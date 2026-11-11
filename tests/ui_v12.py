# -*- coding: utf-8 -*-
"""Walks the v12 screens (goals and achievements, logging by voice) in a headless phone-sized browser and checks what a person
would see. Needs the two local servers:
    python -m http.server 8791 --bind 127.0.0.1        (the app; the "setim-statue" preview does this)
    node server/mock_pb.js                             (accounts and the voice address, in memory)
Run:  python -X utf8 tests/ui_v12.py [output folder for screenshots]
Exit code 0 only when every check passed. Screenshots are for the eye; the checks read the page itself."""
import json, os, sys
from playwright.sync_api import sync_playwright

APP = 'http://127.0.0.1:8791/index.html'
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
os.makedirs(OUT, exist_ok=True)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
fails, errors = [], []

def check(label, ok, detail=''):
    if not ok:
        fails.append(label)
    print(('PASS  ' if ok else 'FAIL  ') + label + ((' -> ' + str(detail)[:400]) if (detail and not ok) else ''))

SEED = r"""() => {
  localStorage.setItem('gt:onboarded','1'); if(Onb.el){ Onb.el.remove(); Onb.el=null; }
  S.profile={...S.profile,name:'דנה',weight:84,height:178,age:30,sex:'m',weekly:3,goal:'hypertrophy'}; save('profile',S.profile);
  const mk=(id,arr)=>{ S.logs[id]={sessions:arr.map(([d,sets])=>({d,sets:sets.map(([r,w])=>({r,w,t:true}))}))}; save('log-'+id,S.logs[id]); arr.forEach(([d])=>{ const rec=S.days.map[d]||(S.days.map[d]={label:'',routine:'',ids:[]}); if(!rec.ids.includes(id)) rec.ids.push(id); }); };
  const D=n=>addDays(todayKey(),-n);
  mk('bench-press',[[D(23),[[10,55],[10,55],[9,55]]],[D(16),[[10,57.5],[10,57.5],[8,57.5]]],[D(9),[[10,57.5],[10,57.5],[10,57.5]]],[D(2),[[8,60],[8,60],[7,60]]]]);
  mk('squat',[[D(21),[[8,70],[8,70]]],[D(14),[[8,72.5],[8,72.5]]],[D(7),[[8,75],[8,75]]]]);
  mk('pull-up',[[D(20),[[4,0],[3,0]]],[D(6),[[5,0],[4,0]]]]);
  mk('running',[[D(18),[[20,2.5]]],[D(11),[[24,3]]],[D(4),[[27,3.4]]]]);
  save('days',S.days); S.prefs.seen.ach0=1; checkAch(); S.prefs.seen.install=todayKey(); save('prefs',S.prefs); render();
  return todayKey();
}"""

# text against its real background, the way the eye meets it: every text node, backgrounds composited up the ancestors
CONTRAST = r"""() => {
  const parse=c=>{ const m=/rgba?\(([^)]+)\)/.exec(c); if(!m) return null; const p=m[1].split(/[,\/ ]+/).filter(Boolean).map(parseFloat); return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}; };
  const cv=document.createElement('canvas'); cv.width=cv.height=1; const cx=cv.getContext('2d',{willReadFrequently:true});
  const solid=c=>{ cx.clearRect(0,0,1,1); cx.fillStyle='#000'; cx.fillStyle=c; cx.fillRect(0,0,1,1); const d=cx.getImageData(0,0,1,1).data; return {r:d[0],g:d[1],b:d[2],a:d[3]/255}; };
  const over=(f,b)=>({r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1});
  const lum=c=>{ const f=v=>{ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); };
  const ratio=(a,b)=>{ const x=lum(a),y=lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
  const bgOf=el=>{ const chain=[]; for(let e=el;e;e=e.parentElement){ const cs=getComputedStyle(e); if(cs.backgroundImage&&cs.backgroundImage!=='none'){ const m=cs.backgroundImage.match(/rgba?\([^)]+\)|color-mix\([^)]*\)\)?|#[0-9a-f]{3,8}/gi); if(m){ let acc=null; m.slice(0,2).forEach(x=>{ const c=solid(x); acc=acc?{r:(acc.r+c.r)/2,g:(acc.g+c.g)/2,b:(acc.b+c.b)/2,a:(acc.a+c.a)/2}:c; }); if(acc) chain.push(acc); } }
      const c=solid(cs.backgroundColor); if(c.a>0) chain.push(c); if(c.a===1) break; }
    let out={r:255,g:255,b:255,a:1}; for(let i=chain.length-1;i>=0;i--) out=over(chain[i],out); return out; };
  const bad=[]; const root=document.querySelector('#view'); const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let n;
  while((n=w.nextNode())){ const t=n.nodeValue.trim(); if(!t) continue; const el=n.parentElement; const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0) continue; const r=el.getBoundingClientRect(); if(!r.width||!r.height) continue;
    if(el.closest('button:disabled')) continue;
    const fg0=solid(cs.color); const bg=bgOf(el); const fg=over(fg0,bg); const size=parseFloat(cs.fontSize), bold=+cs.fontWeight>=700; const need=(size>=24||(bold&&size>=18.66))?3:4.5; const k=ratio(fg,bg);
    if(k<need-0.05) bad.push({t:t.slice(0,40),k:Math.round(k*100)/100,need,cls:(el.className||el.tagName)+'',size}); }
  return bad;
}"""

def run(pw, scheme):
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=2, locale='he-IL', color_scheme=scheme,
                        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
    ctx.add_init_script("try{ localStorage.setItem('gt:theme','%s'); localStorage.setItem('gt:onboarded','1'); }catch(e){}" % scheme)
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin='http://127.0.0.1:8791')
    ctx.route('https://www.icloud.com/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<title>shortcut</title>the add-shortcut screen would be here'))
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append('%s pageerror: %s' % (scheme, e)))
    page.on('console', lambda m: errors.append('%s console: %s' % (scheme, m.text)) if (m.type == 'error' and 'vibrate' not in m.text and 'ERR_CONNECTION' not in m.text and '404' not in m.text) else None)
    shot = lambda name: page.screenshot(path=os.path.join(OUT, '%s-%s.png' % (scheme, name)))
    ev = page.evaluate
    settle = lambda ms=450: page.wait_for_timeout(ms)
    def goto(h):
        ev("h => { location.hash = h; }", h); settle()
    def contrast(name):
        bad = ev(CONTRAST)
        check('%s: text contrast on %s' % (scheme, name), not bad, bad)

    page.goto(APP); page.wait_for_function("typeof S !== 'undefined' && S.ex && S.ex.length > 700")
    today = ev(SEED); settle()
    tag = scheme + ': '

    # ---- the hub ----
    goto('#more'); boxes = ev("[...document.querySelectorAll('.hubbox .t')].map(e=>e.textContent)")
    check(tag + 'hub has the goal box first and the voice box last', boxes[0] == 'מטרות והישגים' and boxes[-1] == 'רישום בקול' and len(boxes) == 8, boxes)
    shot('1-hub'); contrast('hub')

    # ---- an empty goals page, then the three steps ----
    goto('#goals'); check(tag + 'goals page invites to choose a goal', 'מה המטרה שלך?' in ev("document.querySelector('#view').innerText")); shot('2-goals-empty'); contrast('goals, empty')
    page.click('text=בוחרים מטרה'); settle()
    check(tag + 'wizard opens with eight kinds', ev("document.querySelectorAll('.gtile').length") == 8); contrast('wizard, step 1')
    page.fill('.gwiz textarea', 'לרדת 8 קילו עד הקיץ'); shot('3-wizard-1'); page.click('.gwiz .btn:has-text("המשך")'); settle()
    st = ev("({kind:GW.kind,due:GW.due,from:GW.ans.from,to:GW.ans.to,head:document.querySelector('.gwiz .gk').innerText})")
    check(tag + 'free text is understood as weight loss with a date', st['kind'] == 'lose' and st['to'] == 76 and st['due'].endswith('-06-21') and 'הבנתי' in st['head'], st)
    shot('4-wizard-2'); contrast('wizard, step 2')
    page.click('.gwiz .btn:has-text("בונים את התוכנית")'); settle()
    plan = ev("({step:GW.step,n:document.querySelectorAll('.stg').length,verdict:document.querySelector('.gwiz .banner').innerText})")
    check(tag + 'a plan of five stages with a verdict', plan['step'] == 2 and plan['n'] == 5 and 'ריאלי' in plan['verdict'], plan)
    shot('5-wizard-3'); contrast('wizard, step 3')
    page.click('.gwiz .btn:has-text("מתחילים")'); settle(900)
    st = ev("({page:route.page,n:S.goals.list.length,w:S.body.w.length,focus:S.profile.goal,dock:!!document.querySelector('#dock .btn'),navs:NAVS.slice(-2)})")
    check(tag + 'the goal is saved, with a first weigh-in, and the wizard left the history', st['page'] == 'goals' and st['n'] == 1 and st['w'] == 1 and st['focus'] == 'fatloss' and st['dock'] and '#goalnew' not in st['navs'], st)
    ev("document.querySelectorAll('#pop .prban').forEach(e=>e.remove())")

    # ---- five weeks on: weigh-ins, the week in words, a stage closing ----
    ev("""() => { const g=S.goals.list[0], back=n=>addDays(todayKey(),-n); g.created=back(35); g.stages.forEach(s=>{ s.from=addDays(s.from,-35); s.until=addDays(s.until,-35); }); g.due=addDays(g.due,-35);
        S.body.w=[{d:back(35),kg:84},{d:back(28),kg:83.5},{d:back(21),kg:83.1},{d:back(14),kg:82.8},{d:back(7),kg:82.4}]; save('body',S.body); saveGoals(); render(); }""")
    settle(); shot('6-goal'); contrast('goal page')
    txt = ev("document.querySelector('#view').innerText")
    check(tag + 'the goal page shows where the person stands', '82.4 ק״ג' in txt and '76 ק״ג' in txt and 'מה עושים עכשיו' in txt and 'השלבים' in txt, txt[:300])
    check(tag + 'the week is told in words', 'השבוע' in ev("(document.querySelector('.gweek')||{innerText:''}).innerText"))
    page.click('#dock .btn'); settle(700); page.fill('#sheetBody input', '81.9'); shot('7-weigh'); page.click('#sheetBody .btn:has-text("שמור")'); settle(1700)
    st = ev("({done:S.goals.list[0].stages[0].done,toast:document.querySelector('#toastTx').textContent,ban:[...document.querySelectorAll('#pop .prban')].map(e=>e.innerText.replace(/\\n/g,' ')),now:document.querySelector('.gnow').innerText.split('\\n')[1],w:S.profile.weight})")
    check(tag + 'a weigh-in closes the first stage and says so', st['done'] == today and 'ירדת 0.5' in st['toast'] and any('שלב הושלם' in x for x in st['ban']) and 'שלב 2' in st['now'] and st['w'] == 81.9, st)
    shot('8-stage-done'); ev("document.querySelectorAll('#pop .prban').forEach(e=>e.remove())")
    page.click('.stg >> nth=1'); settle(700); sheet = ev("document.querySelector('#sheetBody').innerText"); check(tag + 'a stage opens with its reason and its to-do list', 'שלב 2 מתוך 5' in sheet and 'נסגר לבד' in sheet, sheet[:200]); shot('9-stage-sheet')
    ev("Sheet.close()"); settle(700)
    page.click('.ghero .iconbtn'); settle(700); menu = ev("document.querySelector('#sheetBody').innerText"); check(tag + 'the goal menu', 'השקילות שלי' in menu and 'מחיקת המטרה' in menu, menu); ev("Sheet.close()"); settle(700)

    # ---- a second goal from the list: strength, pre-filled from the journal ----
    ev("newGoal()"); settle(); page.click('.gtile:has-text("להתחזק בתרגיל")'); settle()
    st = ev("({ex:GW.ans.ex,from:GW.ans.from,to:GW.ans.to})"); check(tag + 'strength goal is pre-filled from logged sets', st['ex'] == 'bench-press' and st['from'] and st['from'] >= 70, st)
    page.fill('.gwiz .fld:has-text("ולכמה") input', '100'); page.click('.gwiz .btn:has-text("בונים את התוכנית")'); settle(); shot('10-lift-plan'); contrast('strength plan')
    v = ev("document.querySelector('.gwiz .banner').innerText"); check(tag + 'the strength verdict speaks about pace', 'בשבוע' in v, v)
    page.click('.gwiz .btn:has-text("מתחילים")'); settle(900); ev("document.querySelectorAll('#pop .prban').forEach(e=>e.remove())")
    st = ev("({n:S.goals.list.length,more:[...document.querySelectorAll('.list .item .t')].map(e=>e.textContent)})"); check(tag + 'the second goal is listed under the first', st['n'] == 2 and any('100 ק״ג' in x for x in st['more']), st)
    page.click('.item:has-text("100 ק״ג")'); settle(); check(tag + 'a goal has its own page', ev("route.page") == 'goal' and 'לחיצת חזה במוט: 100 ק״ג' in ev("document.querySelector('.ghero').innerText")); shot('11-goal-2'); contrast('second goal page')
    ev("history.back()"); settle()

    # ---- the other kinds at least build ----
    for kind, params in (('run', {'km': 10, 'from': 3}), ('tri', {'race': 'iron', 'level': 'beginner'}), ('reps', {'ex': 'pull-up', 'from': 5, 'to': 12}), ('habit', {'perWeek': 3, 'weeks': 12}), ('gain', {'from': 70, 'to': 75}), ('free', {'title': 'לעמוד על הידיים', 'stages': ['מול קיר', 'בלי קיר']})):
        r = ev("([k,p]) => { const r=GoalKit.build(k,p,goalData(),'',''); return r.goal?{n:r.goal.stages.length,t:r.goal.title,v:r.verdict.state}:r; }", [kind, params])
        check(tag + 'kind "%s" builds a plan' % kind, isinstance(r, dict) and r.get('n', 0) >= 2, r)
    for kind in ('run', 'tri', 'reps', 'habit', 'gain', 'free'):
        ev("k => { newGoal(); }", kind); settle(250); ev("k => { Object.assign(GW,{kind:k,p:{},ans:{},fromText:false,text:''}); gwTo(1); }", kind); settle(250)
        n = ev("document.querySelectorAll('.gwiz .fld').length"); check(tag + 'kind "%s" asks its questions' % kind, n >= 2, n)
        if kind == 'tri':
            shot('12-wizard-tri'); contrast('wizard, triathlon')
        ev("history.back()"); settle(250)

    # ---- medals ----
    goto('#ach'); n = ev("document.querySelectorAll('.ach').length"); got = ev("Object.keys(S.prefs.ach)")
    check(tag + 'twenty medals, the goal ones earned', n == 20 and 'gs' in got and 'gst' in got, (n, got)); shot('13-ach')

    # ---- voice, inside the app ----
    goto('#voice'); shot('14-voice'); contrast('voice page')
    def say(t):
        page.fill('#vtext', t); page.click('.vbox .btn:has-text("רשום")'); settle(200); return ev("(document.querySelector('.vres .a')||{innerText:''}).innerText")
    a = say("בנץ' סט 1, 10 חזרות, 60 קילו"); check(tag + 'a typed sentence logs a set and answers', a.startswith('נרשם: לחיצת חזה במוט, סט 1, 10 חזרות, 60 קילו') and 'שיא' in a, a)
    a = say('עוד סט'); check(tag + '"another set"', 'סט 2' in a and 'כמו הסט הקודם' in a, a)
    a = say('מתח 6'); check(tag + 'body-weight exercise', a.startswith('נרשם: פול-אפ, סט 1, 6 חזרות'), a)
    shot('15-voice-answer'); contrast('voice page with an answer')
    a = say('בטל'); check(tag + '"undo"', 'בוטל' in a and not ev("(S.logs['pull-up'].sessions.slice(-1)[0]||{}).d") == today, a)
    a = say('בלה בלה'); check(tag + 'nonsense is refused', 'לא זיהיתי' in a, a)
    st = ev("({sets:S.logs['bench-press'].sessions.slice(-1)[0],day:(S.days.map[todayKey()]||{}).ids})"); check(tag + 'the journal holds exactly what was said', st['sets']['d'] == today and [(x['r'], x['w'], x['t']) for x in st['sets']['sets']] == [(10, 60, True), (10, 60, True)] and 'bench-press' in st['day'], st)
    goto('#ex-pull-up'); t = ev("document.querySelector('#view').innerText"); check(tag + 'a pull-up reads as body weight in the app', 'ק״ג × ' not in t.split('סטים')[0] and ('משקל גוף' in t or 'חזרות' in t), t[:200])

    # ---- the phone assistant, through the local stand-in server ----
    LINK = 'https://www.icloud.com/shortcuts/0123456789abcdef0123456789abcdef'
    mock = lambda link: page.request.post('http://127.0.0.1:8090/__test/shortcut', data=json.dumps({'link': link}), headers={'Content-Type': 'application/json'})
    mock('')
    ok = ev("""async () => { try{ const mail='ui'+Date.now().toString(36)+'@example.test', pw=Array.from(crypto.getRandomValues(new Uint8Array(9))).map(x=>x.toString(36)).join('');
        await PB.signup(mail,pw,'ui'); S.storageMode='pb'; await syncFromCloud(); return !!PB.user; }catch(e){ return String(e&&e.message); } }""")
    check(tag + 'sign up on the stand-in server', ok is True, ok)
    if ok is True:
        ev("VO.ping=null"); goto('#voice')
        try:
            page.wait_for_function("voiceKey().length > 20 && VO.test", timeout=10000); made = True
        except Exception:
            made = False
        check(tag + 'a first visit makes the personal code by itself and checks it against the server', made and ev("VO.test.ok") is True, ev("({key:voiceKey().length,info:VO.keyInfo,test:VO.test,ping:VO.ping})"))
        key = ev("voiceKey()")
        card = ev("[...document.querySelectorAll('.vcard')].find(c=>c.innerText.includes('Siri')).innerText")
        check(tag + 'with no shared shortcut yet the card says so, and still confirms the code', 'בקרוב' in card and 'בתוקף' in card and not ev("!!document.querySelector('.siri-add')"), card)
        page.click('button:has-text("עוד אפשרויות")'); settle(700); page.click('#sheetBody .item:has-text("בניית הקיצור ביד")'); settle(1100)
        hs = ev("document.querySelector('#sheetBody').innerText"); check(tag + 'the by-hand instructions: five actions, the address, the fields', ev("document.querySelectorAll('#sheetBody .vsteps > li').length") == 5 and '/api/setim/voice' in hs and 'key' in hs and 'say' in hs, hs[:200])
        shot('17-shortcut-help'); ev("Sheet.close()"); settle(700)

        post = lambda text: page.request.post('http://127.0.0.1:8090/api/setim/voice', data=json.dumps({'key': key, 'text': text}), headers={'Content-Type': 'application/json'}).json()
        r1 = post('סקוואט 8 חזרות 77.5 קילו'); r2 = post('עוד סט'); r3 = post('deadlift 5 reps 100 kilos')
        check(tag + 'the assistant gets spoken answers', r1['ok'] and 'שיא חדש' in r1['say'] and 'סט 2' in r2['say'] and r3['say'].startswith('Logged'), (r1, r2, r3))
        check(tag + 'the journal waits until the app looks', ev("S.logs.squat.sessions.slice(-1)[0].d") != today)
        ev("voicePull(true)"); settle(1500)
        st = ev("({sq:S.logs.squat.sessions.slice(-1)[0],dl:!!S.logs.deadlift,toast:document.querySelector('#toastTx').textContent,done:Object.keys(S.vdone.ids).length})")
        check(tag + 'the app takes the three sets into the journal, once', st['sq']['d'] == today and len(st['sq']['sets']) == 2 and st['dl'] and 'נרשם בקול: 3 סטים' in st['toast'] and st['done'] == 3, st)
        ev("voicePull(true)"); settle(900); check(tag + 'a second look adds nothing', ev("S.logs.squat.sessions.slice(-1)[0].sets.length") == 2)

        # the shared shortcut exists: one button, the code is copied inside the tap, Apple's screen opens
        mock(LINK); ev("VO.ping=null"); goto('#home'); goto('#voice'); page.wait_for_function("VO.shortcut", timeout=8000); settle(300)
        b1 = ev("(() => { const a=document.querySelector('.siri-add'); return a?{href:a.href,text:a.innerText.trim(),tag:a.tagName,n:document.querySelectorAll('.vcard .btn').length}:null; })()")
        check(tag + 'one button: "הוספת Siri", a real link to the shortcut', bool(b1) and b1['href'] == LINK and b1['text'] == 'הוספת Siri' and b1['tag'] == 'A', b1)
        ev("document.querySelector('.siri-add').scrollIntoView({block:'center'})"); settle(200); shot('16-voice-siri'); contrast('voice page, signed in')
        ev("document.querySelectorAll('#toastTx').forEach(e=>e.classList.remove('on'))")
        with ctx.expect_page() as pi:
            page.click('.siri-add')
        newp = pi.value; opened = newp.url; newp.close(); page.bring_to_front(); settle(1200)
        clip = ev("navigator.clipboard.readText().catch(e=>'ERR '+e.name)")
        st = ev("({added:siriAdded(),text:document.querySelector('.siri-add').innerText.trim(),toast:document.querySelector('#toastTx').textContent})")
        check(tag + 'the tap copies the code and opens the shortcut', opened.startswith(LINK) and clip == key and bool(st['added']) and st['text'] == 'הוספת Siri מחדש' and 'הועתק' in st['toast'], (opened, clip == key, st))
        vt = ev("document.querySelector('#view').innerText"); check(tag + 'the voice page lists what Siri logged', 'נרשמו בקול' in vt and 'Siri' in vt, vt[-300:])
        ev("(() => { localStorage.setItem('gtv:key','stm_'+'x'.repeat(40)); VO.test=null; render(); })()"); page.wait_for_function("VO.test && !VO.testing", timeout=8000); settle(200)
        card = ev("[...document.querySelectorAll('.vcard')].find(c=>c.innerText.includes('Siri')).innerText"); check(tag + 'a code that was replaced elsewhere is noticed', 'כבר לא בתוקף' in card, card)
        ev("k => { localStorage.setItem('gtv:key',k); VO.test=null; render(); }", key); mock('')

    # ---- profile and backup ----
    goto('#profile'); pt = ev("document.querySelector('#view').innerText"); check(tag + 'the profile links to the goal and calls the old select a focus', 'לרדת ל-76 ק״ג' in pt and 'דגש באימונים' in pt, pt[-300:])
    bk = ev("(() => { const d={app:'setim',goals:S.goals,body:S.body}; const g=JSON.parse(JSON.stringify(d)); S.goals={list:[]}; S.body={w:[]}; restoreFrom(g); return [S.goals.list.length,S.body.w.length]; })()")
    check(tag + 'goals and weigh-ins survive backup and restore', bk[0] == 2 and bk[1] >= 6, bk)
    ctx.close()

    # ---- the Sunday after: Today shows the week of the goal first ----
    ctx = b.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=2, locale='he-IL', color_scheme=scheme)
    ctx.add_init_script("try{ localStorage.setItem('gt:theme','%s'); localStorage.setItem('gt:onboarded','1'); }catch(e){}" % scheme)
    ctx.add_init_script("(() => { const R=Date, t=new R(); const off=((7-t.getDay())%7||7)*86400000; window.Date=class extends R{ constructor(...a){ if(a.length) super(...a); else super(R.now()+off); } static now(){ return R.now()+off; } }; })()")
    page = ctx.new_page(); page.on('pageerror', lambda e: errors.append('%s sunday pageerror: %s' % (scheme, e)))
    ev = page.evaluate; settle = lambda ms=450: page.wait_for_timeout(ms)
    page.goto(APP); page.wait_for_function("typeof S !== 'undefined' && S.ex && S.ex.length > 700"); ev(SEED)
    ev("""() => { const back=n=>addDays(todayKey(),-n); const r=GoalKit.build('lose',{from:84,to:76},Object.assign(goalData(),{today:back(21)}),'',''); const g=r.goal; S.goals.list=[g]; saveGoals();
        S.body.w=[{d:back(21),kg:84},{d:back(8),kg:83.2},{d:back(2),kg:82.6}]; save('body',S.body); delete S.prefs.seen.week; homeDay=null; homeWeek=0; location.hash='#home'; render(); }""")
    settle(700); cards = ev("[...document.querySelectorAll('.recap')].map(e=>e.innerText.replace(/\\n/g,' | '))")
    check(tag + 'on Sunday, Today shows one card and it is about the goal', ev("new Date(todayKey()).getDay()") == 0 and len(cards) == 1 and 'התקדמת לעבר המטרה' in cards[0] and 'ירדת 0.6' in cards[0], cards)
    page.screenshot(path=os.path.join(OUT, '%s-18-home-week.png' % scheme))
    page.click('.recap'); settle(700); ws = ev("document.querySelector('#sheetBody').innerText"); check(tag + 'the card opens the week in words', 'יפה מאוד' in ws and 'למטרה ולשלבים' in ws, ws); page.screenshot(path=os.path.join(OUT, '%s-19-week-sheet.png' % scheme))
    ev("Sheet.close()"); settle(700); cards = ev("[...document.querySelectorAll('.recap')].map(e=>e.innerText.replace(/\\n/g,' | '))")
    check(tag + 'once seen, the usual weekly recap takes the place', len(cards) == 1 and 'השבוע שעבר שלך' in cards[0], cards)
    ctx.close(); b.close()

with sync_playwright() as pw:
    for scheme in ('light', 'dark'):
        run(pw, scheme)
check('no script errors in the page', not errors, errors[:6])
print('\n%s (%d failed)' % ('ALL PASSED' if not fails else 'SOME CHECKS FAILED', len(fails)))
sys.exit(1 if fails else 0)
