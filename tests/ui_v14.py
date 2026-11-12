# -*- coding: utf-8 -*-
"""Walks what v14 changed (one setup, one calorie number, the goal on both sectors, the body's numbers) in a headless phone-sized
browser and checks what a person would see. Needs two local servers, on ports of their own so that they can run beside another session's:
    python -m http.server 8795 --bind 127.0.0.1        (the app; the "v14-app" preview does this)
    node server/mock_pb.js 8096                        (accounts, and the stand-ins for the voice and coach addresses)
Run:  python -X utf8 tests/ui_v14.py [output folder for screenshots]
Other addresses:  SETIM_APP=http://127.0.0.1:8795/index.html  SETIM_PB=http://127.0.0.1:8096
Nothing here costs money. Exit code 0 only when every check passed. Screenshots are for the eye; the checks read the page itself."""
import base64, json, os, sys
from playwright.sync_api import sync_playwright

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')      # one pixel: a stand-in for a picture of a watch's screen

APP = os.environ.get('SETIM_APP') or 'http://127.0.0.1:8795/index.html'
PBM = os.environ.get('SETIM_PB') or 'http://127.0.0.1:8096'
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out14')
os.makedirs(OUT, exist_ok=True)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
fails, errors = [], []

def check(label, ok, detail=''):
    if not ok:
        fails.append(label)
    print(('PASS  ' if ok else 'FAIL  ') + label + ((' -> ' + str(detail)[:500]) if (detail and not ok) else ''))

# someone who has used the app for a while: a full profile, a month of training, no goal yet
SEED = r"""() => {
  localStorage.setItem('gt:onboarded','1'); if(Onb.el){ Onb.el.remove(); Onb.el=null; }
  S.profile={...S.profile,name:'דנה',weight:84,height:178,age:30,sex:'m',weekly:3,goal:'hypertrophy'}; save('profile',S.profile);
  const mk=(id,arr)=>{ S.logs[id]={sessions:arr.map(([d,sets])=>({d,sets:sets.map(([r,w])=>({r,w,t:true}))}))}; save('log-'+id,S.logs[id]); arr.forEach(([d])=>{ const rec=S.days.map[d]||(S.days.map[d]={label:'',routine:'',ids:[]}); if(!rec.ids.includes(id)) rec.ids.push(id); }); };
  const D=n=>addDays(todayKey(),-n);
  mk('bench-press',[[D(23),[[10,55],[10,55],[9,55]]],[D(16),[[10,57.5],[10,57.5],[8,57.5]]],[D(9),[[10,57.5],[10,57.5],[10,57.5]]],[D(2),[[8,60],[8,60],[7,60]]]]);
  mk('squat',[[D(21),[[8,70],[8,70]]],[D(14),[[8,72.5],[8,72.5]]],[D(7),[[8,75],[8,75]]]]);
  save('days',S.days); S.prefs.seen.ach0=1; checkAch(); S.prefs.seen.install=todayKey(); save('prefs',S.prefs); render();
  return todayKey();
}"""

# text against its real background, the way the eye meets it: every text node, backgrounds composited up the ancestors
CONTRAST = r"""(sel) => {
  const cv=document.createElement('canvas'); cv.width=cv.height=1; const cx=cv.getContext('2d',{willReadFrequently:true});
  const solid=c=>{ cx.clearRect(0,0,1,1); cx.fillStyle='#000'; cx.fillStyle=c; cx.fillRect(0,0,1,1); const d=cx.getImageData(0,0,1,1).data; return {r:d[0],g:d[1],b:d[2],a:d[3]/255}; };
  const over=(f,b)=>({r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1});
  const lum=c=>{ const f=v=>{ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); };
  const ratio=(a,b)=>{ const x=lum(a),y=lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
  const bgOf=el=>{ const chain=[]; for(let e=el;e;e=e.parentElement){ const cs=getComputedStyle(e); if(cs.backgroundImage&&cs.backgroundImage!=='none'){ const m=cs.backgroundImage.match(/rgba?\([^)]+\)|color-mix\([^)]*\)\)?|#[0-9a-f]{3,8}/gi); if(m){ let acc=null; m.slice(0,2).forEach(x=>{ const c=solid(x); acc=acc?{r:(acc.r+c.r)/2,g:(acc.g+c.g)/2,b:(acc.b+c.b)/2,a:(acc.a+c.a)/2}:c; }); if(acc) chain.push(acc); } }
      const c=solid(cs.backgroundColor); if(c.a>0) chain.push(c); if(c.a===1) break; }
    let out={r:255,g:255,b:255,a:1}; for(let i=chain.length-1;i>=0;i--) out=over(chain[i],out); return out; };
  const bad=[]; const root=document.querySelector(sel||'#view'); const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let n;
  while((n=w.nextNode())){ const t=n.nodeValue.trim(); if(!t) continue; const el=n.parentElement; const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0) continue; const r=el.getBoundingClientRect(); if(!r.width||!r.height) continue;
    if(el.closest('button:disabled')) continue;
    const fg0=solid(cs.color); const bg=bgOf(el); const fg=over(fg0,bg); const size=parseFloat(cs.fontSize), bold=+cs.fontWeight>=700; const need=(size>=24||(bold&&size>=18.66))?3:4.5; const k=ratio(fg,bg);
    if(k<need-0.05) bad.push({t:t.slice(0,40),k:Math.round(k*100)/100,need,cls:(el.className||el.tagName)+'',size}); }
  return bad;
}"""

UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
READY = "typeof S !== 'undefined' && S.ex && S.ex.length > 700"


class Phone:
    """One phone-sized page with the helpers every part of the walk uses."""
    def __init__(self, pw, scheme, onboarded=True):
        self.scheme, self.tag = scheme, scheme + ': '
        self.b = pw.chromium.launch()
        self.ctx = self.b.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=2, locale='he-IL', color_scheme=scheme, user_agent=UA)
        self.ctx.add_init_script("try{ localStorage.setItem('gt:theme','%s'); %s localStorage.setItem('gtdev:pb','%s'); }catch(e){}" % (scheme, "localStorage.setItem('gt:onboarded','1');" if onboarded else '', PBM))
        # no speech recognizer here: the voice sheet opens ready for typing, which is the same road from the words on
        self.ctx.add_init_script("try{ window.SpeechRecognition=undefined; window.webkitSpeechRecognition=undefined; }catch(e){}")
        self.page = self.ctx.new_page()
        self.page.on('pageerror', lambda e: errors.append('%s pageerror: %s' % (scheme, e)))
        self.page.on('console', lambda m: errors.append('%s console: %s' % (scheme, m.text)) if (m.type == 'error' and 'vibrate' not in m.text and 'ERR_CONNECTION' not in m.text and '404' not in m.text) else None)
        self.ev = self.page.evaluate
    def settle(self, ms=450):
        self.page.wait_for_timeout(ms)
    def goto(self, h):
        self.ev("h => { location.hash = h; }", h); self.settle()
    def view(self):
        return self.ev("document.querySelector('#view').innerText")
    def sheet(self):
        return self.ev("document.querySelector('#sheetBody').innerText")
    def toast(self):
        return self.ev("document.querySelector('#toastTx').textContent")
    def close_sheet(self):
        self.ev("Sheet.close()"); self.settle(700)
    def shot(self, name):
        self.page.screenshot(path=os.path.join(OUT, '%s-%s.png' % (self.scheme, name)))
        # the checks read text, and text is there even when a sheet is squeezed into a strip: so a sheet that is open in a picture is also measured
        box = self.ev("Sheet.open ? (() => { const r=document.querySelector('#sheet').getBoundingClientRect(); return {h:Math.round(r.height),top:Math.round(r.top),vh:innerHeight}; })() : null")
        if box:
            check('%s: the sheet in the picture "%s" is laid out, not squeezed' % (self.scheme, name), box['h'] >= 180 and box['top'] >= 0, box)
    def contrast(self, name, sel=None):
        bad = self.ev(CONTRAST, sel) if sel else self.ev(CONTRAST)
        check('%s: text contrast on %s' % (self.scheme, name), not bad, bad)
    def done(self):
        self.ctx.close(); self.b.close()


def first_run(pw, scheme):
    """A new person: the opening screen leads to one setup, and at its end training and the plate are both ready."""
    P = Phone(pw, scheme, onboarded=False); page, ev, tag, settle = P.page, P.ev, P.tag, P.settle
    page.goto(APP); page.wait_for_function(READY); page.wait_for_selector('.onb.on'); settle(400)
    t = ev("document.querySelector('.onb').innerText")
    check(tag + 'the opening screen has one way in and no questions of its own', 'מתחילים' in t and 'מה המטרה?' not in t and ev("document.querySelectorAll('.onb .typebtn').length") == 0, t[:200])
    P.shot('f1-opening'); P.contrast('the opening screen', '.onb')
    page.click('.onb .btn:has-text("מתחילים")'); settle(700)
    st = ev("({page:route.page,first:GW.first,tiles:document.querySelectorAll('.gtile').length,onb:!!document.querySelector('.onb.on'),flag:localStorage.getItem('gt:onboarded')})")
    check(tag + '"מתחילים" opens the goal wizard as a first run', st['page'] == 'goalnew' and st['first'] is True and st['tiles'] == 8 and not st['onb'] and st['flag'] == '1', st)
    page.click('.gtile:has-text("לרדת במשקל")'); settle()
    t = P.view(); st = ev("({sub:GW.sub,dots:document.querySelectorAll('.gw-dots i').length,segs:document.querySelectorAll('.gwiz .seg').length,nums:document.querySelectorAll('.gwiz input[type=number]').length})")
    check(tag + 'then one screen about the body, with how often and where', st['sub'] == 'body' and 'כמה פרטים עליך' in t and 'כמה אימונים בשבוע?' in t and 'איפה מתאמנים?' in t and st['dots'] == 4 and st['segs'] == 3 and st['nums'] == 3, [st, t[:200]])
    P.shot('f2-body'); P.contrast('the body step')
    page.click('.gwiz .btn:has-text("המשך")'); settle(300)
    check(tag + 'an empty body step says what is missing and stays', ev("GW.sub") == 'body' and 'מקלידים משקל' in P.view())
    page.fill('.gwiz input[aria-label="גיל בשנים"]', '35'); page.fill('.gwiz input[aria-label="גובה בסנטימטרים"]', '180'); page.fill('.gwiz input[aria-label="משקל בקילוגרם"]', '90')
    page.click('.gwiz .seg[aria-label="אימונים בשבוע"] button:has-text("4")'); settle(250)
    st = ev("({age:document.querySelector('.gwiz input[aria-label=\"גיל בשנים\"]').value,on:document.querySelector('.gwiz .seg[aria-label=\"אימונים בשבוע\"] button.on').textContent})")
    check(tag + 'what was typed survives a tap on another choice', st['age'] == '35' and st['on'] == '4', st)
    page.click('.gwiz .btn:has-text("המשך")'); settle()
    st = ev("({step:GW.step,sub:GW.sub,labels:[...document.querySelectorAll('.gwiz .fld label')].map(e=>e.textContent),from:GW.ans.from,p:{w:S.profile.weight,h:S.profile.height,a:S.profile.age,wk:S.profile.weekly,prog:S.profile.program},weigh:S.body.w.length})")
    check(tag + 'the body is saved, and the weight is not asked a second time', st['step'] == 1 and st['sub'] == '' and not any('שוקל' in x for x in st['labels']) and any('לאיזה משקל' in x for x in st['labels']) and st['from'] == 90 and st['p'] == {'w': 90, 'h': 180, 'a': 35, 'wk': 4, 'prog': 'ul'} and st['weigh'] == 1, st)
    page.fill('.gwiz .fld:has-text("לאיזה משקל") input', '82'); page.click('.gwiz .btn:has-text("בונים את התוכנית")'); settle()
    t = P.view(); st = ev("({step:GW.step,verdict:document.querySelector('.gwiz .banner').innerText,stg:document.querySelectorAll('.stg').length,T:FoodKit.targets(S.profile,nutOf(GW.res.goal))})")
    check(tag + 'the plan says what the goal means for training and for the plate', st['step'] == 2 and st['stg'] >= 3 and '4 אימונים בשבוע' in t and ('%s קק״ל' % format(st['T']['kcal'], ',')) in t and ('%d ג׳ חלבון' % st['T']['p']) in t and 'ק״ג בשבוע' in st['verdict'], [st, t[:400]])
    P.shot('f3-plan'); P.contrast('the plan with both sectors')
    page.click('.gwiz .btn:has-text("מתחילים")'); settle(1200)
    st = ev("({page:route.page,goals:S.goals.list.length,by:S.nut.by,focus:S.profile.goal,days:Object.values(S.week.days).filter(d=>d&&d.ex&&d.ex.length).length,w:S.body.w.length,toast:document.querySelector('#toastTx').textContent,first:GW.first})")
    check(tag + 'one "מתחילים" later: the goal, the plate that follows it, and a first week of training', st['page'] == 'home' and st['goals'] == 1 and st['by'] == 'goal' and st['focus'] == 'fatloss' and st['days'] == 4 and st['w'] == 1 and 'השבוע הראשון מוכן' in st['toast'] and st['first'] is False, st)
    ev("document.querySelectorAll('#pop .prban').forEach(e=>e.remove())")

    # ---- one number: the goal page and the plate ----
    page.wait_for_function("FD.core"); nums = ev("({base:nutBase().kcal,today:nutT(todayKey()).kcal,p:nutBase().p,rate:nutBase().rate,pace:S.goals.list[0].p.pace,old:S.goals.list[0].p.kcal,goal:nutGoal()})")
    check(tag + 'the plate is set by the pace of the goal', nums['goal'] == 'lose' and nums['rate'] == nums['pace'] and nums['base'] >= 1500, nums)
    P.goto('#goals'); todo = ev("[...document.querySelectorAll('.gnow .gtodo li')].map(e=>e.innerText)")
    check(tag + 'the goal page tells the calories and the protein of the plate, not a number of its own', len(todo) >= 2 and format(nums['base'], ',') in todo[0] and (nums['base'] == nums['today'] or format(nums['today'], ',') in todo[0]) and todo[1].startswith(str(nums['p']) + ' גרם חלבון'), [todo[:2], nums])
    P.shot('f4-goal-one-number'); P.contrast('the goal page')
    page.click('.stg >> nth=0'); settle(700); t = P.sheet(); check(tag + 'and so does the stage sheet', format(nums['base'], ',') in t, t[:300]); P.close_sheet()
    P.goto('#food'); t = P.view(); check(tag + 'the nutrition sector shows the same target for today', format(nums['today'], ',') + ' קק״ל' in t, t[:200])
    P.goto('#nut'); t = P.view(); on = ev("[...document.querySelectorAll('#view .typebtn.on')].map(e=>e.innerText.split('\\n')[0])")
    check(tag + 'the targets page says the plate follows the goal, and at what pace', on == ['לפי המטרה שלי'] and 'ק״ג בשבוע' in t and format(nums['base'], ',') in t and 'קצב הירידה' not in t, [on, t[:300]])
    P.shot('f5-nut-follow'); P.contrast('targets, following the goal')
    page.click('#view .typebtn:has-text("שמירה על המשקל")'); settle()
    st = ev("({by:S.nut.by,goal:S.nut.goal,k:nutBase().kcal,tdee:nutBase().tdee})")
    check(tag + 'choosing by hand takes the plate back from the goal', st['by'] == '' and st['goal'] == 'keep' and abs(st['k'] - st['tdee']) <= 10, st)
    page.click('#view .typebtn:has-text("לפי המטרה שלי")'); settle(); check(tag + 'and one tap gives it back', ev("S.nut.by") == 'goal' and ev("nutBase().kcal") == nums['base'])
    P.done()


def veteran(pw, scheme):
    """Someone with history: the fixes of things that were wrong, and nothing about their plate changes behind their back."""
    P = Phone(pw, scheme); page, ev, tag, settle = P.page, P.ev, P.tag, P.settle
    page.goto(APP); page.wait_for_function(READY + ' && FD.core'); today = ev(SEED); settle()

    # ---- today's record keeps what it holds ----
    st = ev("""() => { const tk=todayKey(); S.days.map[tk]={label:'',routine:'',ids:[],dur:1800,start:1111,plan:{label:'רק היום',groups:[],ex:[{id:'squat',sets:3,reps:8}],rest:false}};
        S.logs['squat'].sessions.push({d:tk,sets:[{r:8,w:75,t:true}]}); recordDay(); const r=S.days.map[tk]; return {dur:r.dur,start:r.start,plan:r.plan&&r.plan.label,ids:r.ids}; }""")
    check(tag + 'logging a set after a workout keeps its length and the plan of that one date', st['dur'] == 1800 and st['start'] == 1111 and st['plan'] == 'רק היום' and 'squat' in st['ids'], st)
    st = ev("(() => { const a={}; woRecord(a,{start:5},600); woRecord(a,{start:9},300); const b={}; woRecord(b,{start:5},100); woRecord(b,{start:5},120); return {a,b}; })()")
    check(tag + 'a second workout on the same day adds its time; closing the same one twice does not', st['a'] == {'dur': 900, 'start': 5} and st['b'] == {'dur': 120, 'start': 5}, st)

    # ---- a backup pasted as text brings everything back ----
    ev("restoreSheet()"); settle(700)
    page.fill('#sheetBody textarea', json.dumps({'profile': {'name': 'דנה'}, 'nut': {'goal': 'gain', 'kosher': True}, 'pantry': {'items': [{'id': 'p1', 'k': 'אורז', 'n': 'אורז', 'q': 500, 'u': 'g'}]}, 'prefs': {'seen': {'ach0': 1, 'install': today}}}, ensure_ascii=False))
    P.shot('v1-restore'); page.click('#sheetBody .btn:has-text("שחזר")'); settle(800)
    st = ev("({goal:S.nut.goal,kosher:S.nut.kosher,pantry:S.pantry.items.length,toast:document.querySelector('#toastTx').textContent,open:Sheet.open})")
    check(tag + 'a text backup restores the nutrition documents too', st['goal'] == 'gain' and st['kosher'] is True and st['pantry'] == 1 and 'שוחזר' in st['toast'] and not st['open'], st)
    ev("restoreSheet()"); settle(700); page.fill('#sheetBody textarea', '[1,2'); page.click('#sheetBody .btn:has-text("שחזר")'); settle(500)
    check(tag + 'and text that is not a backup is refused', 'לא תקין' in P.toast()); P.close_sheet()

    # ---- a plate chosen by hand is not taken over by a goal ----
    ev("() => { S.nut.goal='lose'; S.nut.pace='slow'; S.nut.by=''; S.nut.kosher=false; saveNut(); }")
    own = ev("nutBase().kcal")
    check(tag + 'a person with a nutrition target of their own would not be switched by a new goal', ev("gwWillFollow()") is False)
    ev("newGoal()"); settle(); page.fill('.gwiz textarea', 'לרדת 8 קילו'); page.click('.gwiz .btn:has-text("המשך")'); settle()
    st = ev("({step:GW.step,sub:GW.sub,labels:[...document.querySelectorAll('.gwiz .fld label')].map(e=>e.textContent),dots:document.querySelectorAll('.gw-dots i').length})")
    check(tag + 'with a full profile the wizard has no body step and three dots, as before', st['step'] == 1 and st['sub'] == '' and any('שוקל' in x for x in st['labels']) and st['dots'] == 3, st)
    page.click('.gwiz .btn:has-text("בונים את התוכנית")'); settle(); t = P.view()
    check(tag + 'the plan shows their own target for the plate', format(own, ',') + ' קק״ל' in t and '3 אימונים בשבוע' in t, t[:400])
    page.click('.gwiz .btn:has-text("מתחילים")'); settle(1100); ev("document.querySelectorAll('#pop .prban').forEach(e=>e.remove())")
    st = ev("({page:route.page,by:S.nut.by,k:nutBase().kcal,want:FoodKit.targets(S.profile,nutOf(S.goals.list[0])).kcal,todo:document.querySelector('.gnow .gtodo li').innerText,hint:(document.querySelector('.gnow .banner.blue')||{innerText:''}).innerText})")
    check(tag + 'after saving, the plate is still theirs, and the goal page says so with one tap to follow the goal', st['page'] == 'goals' and st['by'] == '' and st['k'] == own and abs(st['k'] - st['want']) >= 100 and format(own, ',') in st['todo'] and format(st['want'], ',') in st['hint'] and 'לפי המטרה' in st['hint'], st)
    P.shot('v2-goal-hint'); P.contrast('the goal page with the hint')
    page.click('.gnow .banner .btn:has-text("לפי המטרה")'); settle(700)
    st2 = ev("({by:S.nut.by,k:nutBase().kcal,todo:document.querySelector('.gnow .gtodo li').innerText,hint:!!document.querySelector('.gnow .banner.blue')})")
    check(tag + 'the tap moves the plate to the goal\'s number, everywhere', st2['by'] == 'goal' and st2['k'] == st['want'] and format(st['want'], ',') in st2['todo'] and not st2['hint'], st2)
    ev("() => { const g=S.goals.list[0]; g.status='off'; saveGoals(); render(); }"); settle(300)
    st = ev("({goal:nutGoal(),k:nutBase().kcal,tdee:nutBase().tdee})"); check(tag + 'a goal that was stopped stops steering the plate at once', st['goal'] == 'keep' and abs(st['k'] - st['tdee']) <= 10, st)
    P.goto('#nut'); t = P.view(); check(tag + 'and the targets page explains why the target is now keeping', 'אין כרגע מטרה פעילה' in t, t[:300]); P.contrast('targets, no active goal')
    P.done()


# a person with a goal, a workout planned for today, and nothing logged yet today
DAILY = r"""() => {
  const D=n=>addDays(todayKey(),-n), i=new Date(todayKey()).getDay();
  applyToDay(i,{label:'חזה וכתפיים',groups:['chest','shoulders'],ex:[{id:'bench-press',sets:2,reps:8},{id:'lateral-raise',sets:2,reps:12},{id:'leg-press',sets:2,reps:10}]});
  const r=GoalKit.build('lose',{from:84,to:76,height:178},goalData(),'',''); const g=r.goal; g.created=D(35); g.stages.forEach(s=>{ s.from=addDays(s.from,-35); s.until=addDays(s.until,-35); }); g.due=addDays(g.due,-35);
  S.goals.list=[g]; saveGoals(); S.body.w=[{d:D(35),kg:84},{d:D(21),kg:83.1},{d:D(7),kg:82.4},{d:D(1),kg:81.9}]; save('body',S.body); S.profile.weight=81.9; save('profile',S.profile);
  S.nut.by='goal'; saveNut(); document.querySelectorAll('#pop .prban').forEach(e=>e.remove()); homeDay=null; homeWeek=0; render(); return todayKey();
}"""


def daily(pw, scheme):
    """Every day: the card on top of both sectors, the body's numbers, an injury."""
    P = Phone(pw, scheme); page, ev, tag, settle = P.page, P.ev, P.tag, P.settle
    page.goto(APP); page.wait_for_function(READY + ' && FD.core'); ev(SEED); today = ev(DAILY); settle(700)
    card = "({top:!!document.querySelector('#view .px-top'),goal:(document.querySelector('#view .px-goal')||{innerText:''}).innerText.replace(/\\n/g,' | '),say:[...document.querySelectorAll('#view .px-say span')].map(e=>e.textContent),tiles:[...document.querySelectorAll('#view .px-n')].map(e=>e.innerText.replace(/\\n/g,' ')),step:[...document.querySelectorAll('#view .px-step')].map(e=>e.textContent),good:!!document.querySelector('#view .px-top.px-good')})"
    rows = "[...document.querySelectorAll('#view .list .item')].map(e=>[e.querySelector('.t').textContent,(e.querySelector('.s')||{textContent:''}).textContent])"

    # ---- fitness: the goal, the coach's words, the numbers ----
    P.goto('#home'); st = ev(card); more = ev("({stats:!!document.querySelector('#view .jstats'),boxes:[...document.querySelectorAll('#view .hubbox .t')].map(e=>e.textContent),third:document.querySelector('#view .home').children[2].className,sets:weekStats(0).sets})")
    check(tag + 'fitness opens with one card: the goal and what is left, right under the week', st['top'] and 'לרדת ל-76' in st['goal'] and 'נשארו' in st['goal'] and '%' in st['goal'] and more['third'].startswith('px-top'), [st, more])
    check(tag + 'the coach speaks first, and about what the page does not already show', 1 <= len(st['say']) <= 2 and 'היעד השבועי' in st['say'][0] and not any('מתוך 3' in x for x in st['say']), st['say'])
    check(tag + 'the numbers of the week and of the body, in the same card; five boxes under the day', st['tiles'] == ['%d סטים השבוע' % more['sets'], '— צעדים היום'] and not more['stats'] and more['boxes'] == ['הישגים', 'כל האימונים', 'תרגילים', 'תוכניות', 'עוד'], [st['tiles'], more])
    P.shot('d1-fitness'); P.contrast('fitness with the card')
    ev("render()"); settle(200); check(tag + 'painting again does not change the words', ev(card)['say'] == st['say'])
    page.click('#view .px-goal'); settle(); ok1 = ev("route.page") == 'goals'; page.click('#hdr .back'); settle()
    check(tag + 'the goal line opens the goal, and back returns to fitness', ok1 and ev("route.page") == 'home', ev("route.page"))
    page.click('#view .px-coach'); settle(); check(tag + 'the coach\'s words open the conversation', ev("route.page") == 'chat'); P.goto('#home')
    page.click('#view .hubbox.wide:has-text("עוד")'); settle(700); r = ev("[...document.querySelectorAll('#sheetBody .item .t')].map(e=>e.textContent)")
    check(tag + 'what goes with fitness is one level down', r == ['התקדמות', 'המכון שלי', 'מדריכים', 'רישום בקול ו-Siri'], r); P.shot('d2-more'); P.contrast('the more sheet', '#sheetBody')
    page.click('#sheetBody .item:has-text("התקדמות")'); settle(900); check(tag + 'and a row there leads on', ev("route.page") == 'progress' and not ev("Sheet.open"))

    # ---- nutrition: the same goal on top, only today ----
    P.goto('#food'); nf = ev(card); boxes = ev("[...document.querySelectorAll('#view .hubbox .t')].map(e=>e.textContent)")
    check(tag + 'nutrition opens with the same goal, and five boxes', nf['top'] and nf['goal'] == st['goal'] and nf['tiles'] == [] and boxes == ['התפריט שלי', 'המטבח שלי', 'מתכונים', 'רשימת קניות', 'התקדמות'], [nf, boxes])
    P.shot('d3-nutrition'); P.contrast('nutrition with the card')
    page.click('#view .px-goal'); settle(); page.click('#hdr .back'); settle(); check(tag + 'back from the goal returns to nutrition, where it was opened', ev("route.page") == 'food')
    page.click('#view .hm-nav .iconbtn >> nth=0'); settle(); check(tag + 'another day shows that day, without the card', not ev("!!document.querySelector('#view .px-top')")); ev("foodDay=todayKey(); render()")
    ev("""() => { const T=nutT(todayKey()); logMeal([{n:'עוף',k:'',g:300,e:[Math.round(T.kcal*0.98),T.p+5,10,10]}],{slot:'l'}); render(); }"""); settle(500); nf = ev(card)
    check(tag + 'a day inside the target, protein included, is praised', nf['good'] and nf['say'] and nf['say'][0] == 'כל הכבוד, היום בתוך היעד, כולל החלבון.', nf)
    P.goto('#coach'); t = ev("(document.querySelector('#view .px-both')||{innerText:''}).innerText")
    check(tag + 'the coach\'s door says both sentences', 'כושר:' in t and 'תזונה:' in t and 'כל הכבוד' in t, t); P.shot('d4-coach'); P.contrast('the coach door')

    # ---- the body's numbers: one sheet, one button ----
    P.goto('#home'); page.click('#view .px-n:has-text("צעדים היום")'); settle(700)
    st = ev("({h:(document.querySelector('#sheetBody h2')||{}).textContent,n:document.querySelectorAll('#sheetBody input[type=number]').length,btns:document.querySelectorAll('#sheetBody .btn').length})")
    check(tag + 'the steps open one sheet with four fields and one button', st == {'h': 'נתוני הגוף', 'n': 4, 'btns': 1}, st); P.shot('d5-body-sheet'); P.contrast('the body sheet', '#sheetBody')
    page.fill('#sheetBody input[aria-label="דופק במנוחה"]', '500'); page.click('#sheetBody .btn:has-text("שמור")'); settle(400)
    check(tag + 'a number that makes no sense is refused, and the sheet stays', 'בין 25 ל-230' in P.toast() and ev("Sheet.open") and not ev("S.sig.day[todayKey()]"))
    page.fill('#sheetBody input[aria-label="צעדים"]', '9200'); page.fill('#sheetBody input[aria-label="דופק במנוחה"]', '61'); page.click('#sheetBody .btn:has-text("שמור")'); settle(900)
    st = ev(card); d = ev("S.sig.day[todayKey()]")
    check(tag + 'steps and a heart rate are saved, said back with praise, and stand in the card', P.toast() == 'נרשם: 9,200 צעדים, דופק 61. עברת את יעד הצעדים. כל הכבוד!' and d['st'] == 9200 and d['hr'] == 61 and d['src'] == 'm' and st['tiles'][1:] == ['9,200 צעדים היום', '61 דופק'] and any('יעד הצעדים' in x for x in st['say']) and not ev("Sheet.open"), [P.toast(), d, st])
    P.shot('d6-fitness-steps')
    page.click('#view .px-n:has-text("צעדים היום")'); settle(700); page.fill('#sheetBody input[aria-label="צעדים"]', ''); page.click('#sheetBody .btn:has-text("שמור")'); settle(900)
    d = ev("S.sig.day[todayKey()]"); check(tag + 'emptying a field clears it and keeps the rest', 'st' not in d and d['hr'] == 61 and ev(card)['tiles'][1] == '— צעדים היום', d)
    page.click('#view .px-n:has-text("צעדים היום")'); settle(700); page.click('#sheetBody .lnkline:has-text("יעד הצעדים")'); settle(1000); page.click('#sheetBody .typebtn:has-text("10,000")'); settle(700)
    check(tag + 'the steps goal is one more tap', ev("S.profile.steps") == 10000 and '10,000' in P.toast())

    # ---- written to the coach: no model, no cost ----
    said = lambda text, ms=700: (ev("t => { coachSend(t); }", text), settle(ms), ev("S.coach.msgs.slice(-1)[0]"))[2]
    P.goto('#chat'); m = said('עשיתי 7,500 צעדים')
    check(tag + 'a sentence to the coach writes the steps down with no model', m['tier'] == 'local' and m['t'] == 'נרשם: 7,500 צעדים.' and ev("S.sig.day[todayKey()].st") == 7500 and ev("S.sig.day[todayKey()].src") == 'c', m)
    m = said('כמה צעדים עשיתי היום?'); check(tag + 'and it answers from them', m['tier'] == 'local' and '7,500 צעדים' in m['t'] and '10,000' in m['t'], m)
    m = said('נפצעתי בכתף'); t = ev("[...document.querySelectorAll('#view .actc')].pop().innerText")
    check(tag + 'an injury is offered as a card, with where to turn', m['tier'] == 'local' and 'רופא' in m['t'] and m['acts'][0]['t'] == 'injury' and m['acts'][0]['st'] == 'p' and 'פציעה לרישום' in t and 'כתף' in t and not ev("BodyKit.active(S.sig).length"), [m, t])
    P.shot('d7-chat-injury'); P.contrast('the conversation with the injury card')
    page.click('#view .actc >> nth=-1 >> .btn:has-text("רישום")'); settle(700)
    check(tag + 'one tap writes it down', ev("BodyKit.active(S.sig).map(x=>x.part)") == ['shoulder'] and 'הפציעה נרשמה' in P.toast())

    # ---- an active injury: the card, the rows, skipping for today, healing ----
    P.goto('#home'); st = ev(card); rw = ev(rows)
    check(tag + 'the coach points at the exercises that may load the injured place, with one step', st['say'][0] == 'שמים לב לכתף: שני תרגילים היום עשויים להעמיס על האזור.' and st['step'] == ['הפציעה'], st)
    check(tag + 'and the rows say which', [r[1] for r in rw[:2]] == ['עשוי להעמיס על הכתף'] * 2 and 'להעמיס' not in rw[2][1], rw)
    P.shot('d8-fitness-injury'); P.contrast('fitness with an injury')
    page.click('#view .px-step'); settle(700); t = P.sheet()
    check(tag + 'the injury sheet: what is active, what today may load, and a place for another', 'כתף' in t and 'החלמתי' in t and 'לחיצת חזה במוט' in t and 'לדלג היום' in t and 'פציעה נוספת' in t and ev("document.querySelectorAll('#sheetBody .gchip').length") == 10 and ev("document.querySelector('#sheetBody .btn:not(.sm)').disabled"), t[:300])
    P.shot('d9-injury-sheet'); P.contrast('the injury sheet', '#sheetBody')
    page.click('#sheetBody .btn:has-text("לדלג היום")'); settle(1000); st2 = ev("({ids:todayList(),plan:!!(S.days.map[todayKey()]&&S.days.map[todayKey()].plan),week:wkDay(new Date(todayKey()).getDay()).ex.length,base:S.week.days[new Date(todayKey()).getDay()].ex.length})")
    check(tag + '"לדלג היום" takes them off today only', st2['ids'] == ['leg-press'] and st2['plan'] and st2['base'] == 3 and 'ירדו מהאימון של היום' in P.toast() and ev(card)['step'] == [], [st2, P.toast()])
    page.click('#toastTx button'); settle(500); check(tag + 'and can be taken back', ev("todayList()") == ['bench-press', 'lateral-raise', 'leg-press'])
    ev("injurySheet()"); settle(700); page.click('#sheetBody .btn:has-text("החלמתי")'); settle(800); st = ev(card)
    check(tag + '"החלמתי" closes it: no warning, no step, and the history keeps it', ev("BodyKit.active(S.sig).length") == 0 and ev("S.sig.inj.length") == 1 and st['step'] == [] and not any('שמים לב' in x for x in st['say']) and 'להעמיס' not in ev(rows)[0][1], st)
    ev("injurySheet()"); settle(700); page.click('#sheetBody .gchip:has-text("ברך")'); page.fill('#sheetBody input[type=text]', 'מאז הריצה'); page.click('#sheetBody .btn:has-text("רישום הפציעה")'); settle(800)
    check(tag + 'an injury can be written from the sheet too', ev("BodyKit.active(S.sig).map(x=>[x.part,x.note])") == [['knee', 'מאז הריצה']] and ev(rows)[2][1] == 'עשוי להעמיס על הברך', ev(rows))
    ev("sigHeal('')"); ev("render()")

    # ---- said (or typed) in the voice sheet ----
    ev("voiceQuick()"); settle(700); page.fill('#vqtext', 'עשיתי 10,000 צעדים והדופק היה 58'); settle(500)
    t = ev("(document.querySelector('#sheetBody .vq-card')||{innerText:''}).innerText")
    check(tag + 'the voice sheet shows what it understood of the body before it is saved', 'נתוני הגוף' in t and '10,000 צעדים' in t and 'דופק 58' in t and ev("S.sig.day[todayKey()].st") == 7500, t); P.shot('d10-voice-body'); P.contrast('the voice sheet with the body', '#sheetBody')
    page.click('#sheetBody .vq-btns .btn >> nth=0'); settle(600); d = ev("S.sig.day[todayKey()]")
    check(tag + 'and "אישור" saves it', d['st'] == 10000 and d['hr'] == 58 and d['src'] == 'v' and 'נרשם: 10,000 צעדים, דופק 58' in ev("(document.querySelector('#sheetBody .vq-done')||{innerText:''}).innerText"), d)
    ev("Sheet.close()"); settle(700)
    ev("voiceQuick()"); settle(700); page.fill('#vqtext', 'בנץ 8 חזרות 60 קילו'); settle(500)
    check(tag + 'a set is still a set there', 'לחיצת חזה במוט' in ev("(document.querySelector('#sheetBody .vq-card')||{innerText:''}).innerText")); ev("Sheet.close()"); settle(700)

    # ---- kept: on this device, in a backup, in the account, and for the model ----
    bk = ev("(() => { const d=backupExtra(); return {has:!!d.sig,day:Object.keys(d.sig.day).length,inj:d.sig.inj.length}; })()")
    check(tag + 'a backup carries the body\'s numbers and injuries', bk == {'has': True, 'day': 1, 'inj': 2}, bk)
    sn = ev("coachSnap()"); check(tag + 'the model is told about the body, and only about injuries that are active', sn['body']['today']['steps'] == 10000 and sn['body']['steps_goal'] == 10000 and sn['injuries'] == [], [sn.get('body'), sn.get('injuries')])
    ok = ev("""async () => { try{ const mail='v14'+Date.now().toString(36)+'@example.test', pw=Array.from(crypto.getRandomValues(new Uint8Array(9))).map(x=>x.toString(36)).join('');
        await PB.signup(mail,pw,'ui'); S.storageMode='pb'; await syncFromCloud(); await Promise.all(Object.values(writeQ)); return !!PB.user; }catch(e){ return String(e&&e.message); } }""")
    docs = page.request.get(PBM + '/api/collections/docs/records?perPage=500', headers={'Authorization': ev("PB.token")}).json() if ok is True else {'items': []}
    keys = sorted(x['key'] for x in docs['items']); check(tag + 'a first sign-in sends the body\'s document up with the others', ok is True and 'sig' in keys and 'goals' in keys and 'nut' in keys, [ok, keys])
    # ---- the watch: what the phone's health app sent, and a picture of the watch's screen ----
    tok = ev("PB.token"); hdr = {'Content-Type': 'application/json'}
    page.request.post(PBM + '/__test/shortcut', data=json.dumps({'health': ''}), headers=hdr); page.request.post(PBM + '/__test/coach', data=json.dumps({'reset': True}), headers=hdr)
    key = ev("voiceKeyNew(true).then(ok => ok ? voiceKey() : '')")
    r = page.request.post(PBM + '/api/setim/voice', data=json.dumps({'key': key, 'kind': 'health', 'steps': 9412, 'hr': 58}), headers=hdr).json()
    n = ev("healthPull(true)"); settle(500); d = ev("S.sig.day[todayKey()]")
    check(tag + 'what the phone\'s health app sent is taken in when the app is opened', r.get('ok') is True and n == 1 and d['st'] == 9412 and d['hr'] == 58 and d['src'] == 'h' and 'מהשעון: 9,412 צעדים, דופק 58' in P.toast(), [r, n, d, P.toast()])
    check(tag + 'taking it in a second time changes nothing', ev("healthPull(true)") == 0 and ev("S.sig.day[todayKey()].st") == 9412)
    ev("(async () => { HX.link=null; await watchPing(); await coachInfo(true); })()"); settle(300)
    ev("bodySheet()"); settle(900); rows0 = ev("[...document.querySelectorAll('#sheetBody .lnkline')].map(e=>e.textContent)"); P.close_sheet()
    check(tag + 'with no shortcut on the server and no invitation, the sheet offers neither road', len(rows0) == 2 and not any('חיבור לשעון' in x or 'צילום מסך' in x for x in rows0), rows0)
    page.request.post(PBM + '/__test/shortcut', data=json.dumps({'health': 'https://www.icloud.com/shortcuts/abcdef0123456789abcdef'}), headers=hdr)
    page.request.post(PBM + '/__test/coach', data=json.dumps({'grant': 'guest'}), headers={'Content-Type': 'application/json', 'Authorization': tok})
    ev("(async () => { HX.link=null; await coachInfo(true); })()"); settle(300)      # the sheet itself asks where the shortcut is
    st = ev("({v:CO.info&&CO.info.v,access:CO.info&&CO.info.access,dev:devKind(),ping:VO.ping==null})")
    ev("bodySheet()"); settle(900); rows1 = ev("[...document.querySelectorAll('#sheetBody .lnkline')].map(e=>e.textContent)")
    check(tag + 'on an iPhone, with the link on the server and the coach open: both roads are offered', st['dev'].startswith('ios') and ev("HX.link").startswith('https://www.icloud.com/shortcuts/') and st['v'] == 3 and st['access'] and any('חיבור לשעון' in x for x in rows1) and any('צילום מסך' in x for x in rows1), [st, rows1])
    check(tag + 'asking for it does not touch what the voice page knows about the server', st['ping'])
    P.shot('d11-body-sheet-watch'); P.contrast('the body sheet with the watch rows', '#sheetBody')
    page.set_input_files('#sheetBody input[type=file]', {'name': 'watch.png', 'mimeType': 'image/png', 'buffer': PNG}); settle(1800)
    c = page.request.get(PBM + '/__test/coach').json()['calls'][-1]
    st = ev("({st:document.querySelector('#sheetBody input[aria-label=\"צעדים\"]').value,hr:document.querySelector('#sheetBody input[aria-label=\"דופק במנוחה\"]').value,saved:S.sig.day[todayKey()].st,open:Sheet.open})")
    check(tag + 'a picture of the watch goes to the small model, and what it read lands in the fields, not yet saved', c['img'] and 'haiku' in c['model'] and 'נתוני הגוף' in c['text'] and st == {'st': '9412', 'hr': '58', 'saved': 9412, 'open': True} and 'המאמן קרא' in P.toast(), [c, st, P.toast()])
    page.fill('#sheetBody input[aria-label="צעדים"]', '9500'); page.click('#sheetBody .btn:has-text("שמור")'); settle(800); d = ev("S.sig.day[todayKey()]")
    check(tag + 'the person corrects and saves it; it is marked as read from a picture', d['st'] == 9500 and d['hr'] == 58 and d['src'] == 'p', d)
    page.click('#view .px-n:has-text("צעדים היום")'); settle(700); page.click('#sheetBody .lnkline:has-text("חיבור לשעון")'); settle(1000); t = P.sheet()
    a = ev("(() => { const el=document.querySelector('#sheetBody a.btn'); return el?{href:el.href,text:el.textContent,target:el.target}:null; })()")
    check(tag + 'the watch sheet: one button that adds the ready-made shortcut', 'חיבור לשעון' in t and 'בריאות' in t and a and a['href'].startswith('https://www.icloud.com/shortcuts/') and a['text'] == 'הוספת הקיצור' and a['target'] == '_blank', [t[:200], a])
    P.shot('d12-watch-sheet'); P.contrast('the watch sheet', '#sheetBody'); P.close_sheet()
    page.request.post(PBM + '/__test/shortcut', data=json.dumps({'health': ''}), headers=hdr)
    page.reload(); page.wait_for_function(READY + ' && FD.core'); settle(1200)
    st = ev("({st:(S.sig.day[todayKey()]||{}).st,inj:S.sig.inj.length,steps:S.profile.steps,by:S.nut.by,tile:[...document.querySelectorAll('#view .px-n')].map(e=>e.innerText.replace(/\\n/g,' '))})")
    check(tag + 'after a reload it is all there', st['st'] == 9500 and st['inj'] == 2 and st['steps'] == 10000 and st['by'] == 'goal' and '9,500 צעדים היום' in st['tile'], st)
    P.done()


def no_goal(pw, scheme):
    """Someone with history and no goal: both sectors ask for it in the same place, and nothing is forced."""
    P = Phone(pw, scheme); page, ev, tag, settle = P.page, P.ev, P.tag, P.settle
    page.goto(APP); page.wait_for_function(READY + ' && FD.core'); ev(SEED); settle()
    P.goto('#home'); t = ev("(document.querySelector('#view .px-top')||{innerText:''}).innerText")
    check(tag + 'without a goal, fitness asks for one in the card, and still shows the week', 'מה המטרה שלך?' in t and 'קובעים מטרה' in t and 'סטים השבוע' in t and ev("route.page") == 'home', t); P.shot('n1-fitness-no-goal'); P.contrast('fitness, no goal')
    P.goto('#food'); t = ev("(document.querySelector('#view .px-top')||{innerText:''}).innerText")
    check(tag + 'nutrition asks the same question, with a way to set calories alone', 'מה המטרה שלך?' in t and 'רק יעד קלוריות' in t and 'כמה לאכול ביום?' not in P.view(), t); P.shot('n2-nutrition-no-goal'); P.contrast('nutrition, no goal')
    page.click('#view .px-top .btn:has-text("קובעים מטרה")'); settle(); check(tag + 'the button opens the one setup', ev("route.page") == 'goalnew' and ev("GW.first") is False)
    P.done()


with sync_playwright() as pw:
    for scheme in ('light', 'dark'):
        first_run(pw, scheme)
        veteran(pw, scheme)
        daily(pw, scheme)
        no_goal(pw, scheme)
check('no script errors in the page', not errors, errors[:6])
print('\n%s (%d failed)' % ('ALL PASSED' if not fails else 'SOME CHECKS FAILED', len(fails)))
sys.exit(1 if fails else 0)
