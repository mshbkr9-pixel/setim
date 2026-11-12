# -*- coding: utf-8 -*-
"""Walks the v13 screens (the three sectors, nutrition, the coach) in a headless phone-sized browser and checks what a person
would see. Needs two local servers, on ports of their own so that they can run beside another session's:
    python -m http.server 8793 --bind 127.0.0.1        (the app; the "v13-app" preview does this)
    node server/mock_pb.js 8094                        (accounts, and the coach's address with a stand-in for the Claude API)
Run:  python -X utf8 tests/ui_v13.py [output folder for screenshots]
Nothing here costs money: the stand-in answers in the shape of the real API, so the real request and checking code runs.
Exit code 0 only when every check passed. Screenshots are for the eye; the checks read the page itself."""
import json, os, re, sys
from playwright.sync_api import sync_playwright

APP = 'http://127.0.0.1:8793/index.html'
PBM = 'http://127.0.0.1:8094'
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out13')
os.makedirs(OUT, exist_ok=True)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
fails, errors = [], []

def check(label, ok, detail=''):
    if not ok:
        fails.append(label)
    print(('PASS  ' if ok else 'FAIL  ') + label + ((' -> ' + str(detail)[:500]) if (detail and not ok) else ''))

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

def run(pw, scheme):
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=2, locale='he-IL', color_scheme=scheme,
                        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
    ctx.add_init_script("try{ localStorage.setItem('gt:theme','%s'); localStorage.setItem('gt:onboarded','1'); localStorage.setItem('gtdev:pb','%s'); }catch(e){}" % (scheme, PBM))
    # a desktop browser has a share dialog that a test cannot answer: without it the app shows the link in a sheet, which the test reads
    ctx.add_init_script("try{ Object.defineProperty(navigator,'share',{value:undefined,configurable:true}); }catch(e){}")
    # the product database is a public service on the internet: the test answers in its place
    ctx.route('https://world.openfoodfacts.org/**', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(
        {'status': 1, 'product': {'code': '7290000000001', 'product_name_he': 'חטיף בדיקה', 'brands': 'מותג', 'serving_quantity': 30, 'nutriments': {'energy-kcal_100g': 480, 'proteins_100g': 8, 'carbohydrates_100g': 60, 'fat_100g': 22}}}
        if '7290000000001' in r.request.url else {'status': 0})))
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append('%s pageerror: %s' % (scheme, e)))
    page.on('console', lambda m: errors.append('%s console: %s' % (scheme, m.text)) if (m.type == 'error' and 'vibrate' not in m.text and 'ERR_CONNECTION' not in m.text and '404' not in m.text) else None)
    shot = lambda name: page.screenshot(path=os.path.join(OUT, '%s-%s.png' % (scheme, name)))
    ev = page.evaluate
    settle = lambda ms=450: page.wait_for_timeout(ms)
    def goto(h):
        ev("h => { location.hash = h; }", h); settle()
    def contrast(name, sel=None):
        bad = ev(CONTRAST, sel) if sel else ev(CONTRAST)
        check('%s: text contrast on %s' % (scheme, name), not bad, bad)
    view = lambda: ev("document.querySelector('#view').innerText")
    sheet = lambda: ev("document.querySelector('#sheetBody').innerText")
    toast = lambda: ev("document.querySelector('#toastTx').textContent")
    close = lambda: (ev("Sheet.close()"), settle(700))
    coach = lambda cfg=None, mode='', reset=False: page.request.post(PBM + '/__test/coach', data=json.dumps({'mode': mode, 'cfg': cfg, 'reset': reset}), headers={'Content-Type': 'application/json'})
    calls = lambda: page.request.get(PBM + '/__test/coach').json()
    tag = scheme + ': '
    coach(reset=True)

    page.goto(APP); page.wait_for_function("typeof S !== 'undefined' && S.ex && S.ex.length > 700 && FD.core")
    today = ev(SEED); settle()

    # ---- three doors ----
    tabs = ev("[...document.querySelectorAll('#tabbar .tab')].map(t=>t.textContent)")
    check(tag + 'the tab bar has the three sectors', tabs == ['אימונים', 'תזונה', 'המאמן'], tabs)
    st = ev("({cal:!!document.querySelector('#view .cal'),boxes:[...document.querySelectorAll('#view .hubbox .t')].map(e=>e.textContent),fab:!!document.querySelector('#dock .vfab'),strip:document.querySelectorAll('#view .dsd').length})")
    check(tag + 'training: today, the calendar and every training box on one page', st['cal'] and st['strip'] == 7 and st['boxes'][:6] == ['הישגים', 'כל האימונים', 'תרגילים', 'תוכניות', 'המכון שלי', 'מדריכים'] and st['fab'], st)
    shot('1-training'); contrast('training')
    ev("document.querySelector('#scroll').scrollTop=600"); settle(200); shot('1b-training-hub')
    goto('#journal'); t = view(); check(tag + 'the old journal is now the list of every workout', 'כל האימונים' in t and not ev("!!document.querySelector('#view .cal')") and ev("activeTab()") == 'home', t[:120])
    goto('#progress'); check(tag + 'progress has two views, training and nutrition', ev("[...document.querySelectorAll('#view .seg button')].map(b=>b.textContent)") == ['אימונים', 'תזונה'])
    goto('#more'); check(tag + 'the old address of the hub leads to the coach', ev("activeTab()") == 'coach' and 'המאמן' in view())
    goto('#home'); goto('#library'); check(tag + 'a training page lights the training tab', ev("activeTab()") == 'home'); page.click('#hdr .back'); settle(); check(tag + 'and back from it returns to the training sector', ev("route.page") == 'home')

    # ---- nutrition: from nothing to a target ----
    goto('#food'); t = view(); check(tag + 'nutrition starts by asking for a target', 'כמה לאכול ביום?' in t and 'התפריט שלי' in t and 'המטבח שלי' in t, t[:200]); shot('2-food-empty'); contrast('nutrition, empty')
    page.click('#view .btn:has-text("קובעים יעד")'); settle(); check(tag + 'the target page opens', ev("route.page") == 'nut')
    page.click('.typebtn:has-text("ירידה במשקל")'); settle()
    st = ev("({T:FoodKit.targets(S.profile,S.nut),goal:S.nut.goal,big:document.querySelector('.big-num').innerText})")
    check(tag + 'a goal gives a daily target with macros, above the safe floor', st['goal'] == 'lose' and 1500 <= st['T']['kcal'] < st['T']['tdee'] and st['T']['p'] >= 150 and str(st['T']['kcal'])[:1] in st['big'], st)
    shot('3-nut'); contrast('targets')
    page.click('.gchip:has-text("בוטנים")'); settle(200); page.click('.tgl:has-text("כשר")'); settle(200)
    st = ev("S.nut"); check(tag + 'preferences are kept', st['al'] == ['peanut'] and st['kosher'] is True, st)

    # ---- a meal in words ----
    goto('#food'); t = view(); check(tag + 'the day shows the target and what is left', 'היעד להיום' in t and 'קק״ל' in t and 'נשארו' in t and 'חלבון' in t, t[:200])
    page.click('#dock .btn'); settle(700); page.fill('#sheetBody textarea', "שתי ביצים, שלוש פרוסות לחם, קוטג' וסלט עם קצת שמן זית"); shot('4-meal-sheet'); contrast('meal sheet', '#sheetBody')
    page.click('#sheetBody .btn:has-text("המשך")'); settle(900)
    t = sheet(); n = ev("document.querySelectorAll('#sheetBody .frow').length")
    check(tag + 'the sentence becomes five foods with amounts, estimates marked', n == 5 and 'ביצה' in t and 'שמן זית' in t and 'הערכה' in t and 'סך הכול' in t, t[:300])
    shot('5-meal-confirm'); contrast('meal confirm', '#sheetBody')
    page.fill('#sheetBody .frow >> nth=2 >> input', '200'); settle(200)
    page.click('#sheetBody .btn:has-text("רישום")'); settle(900)
    st = ev("({tot:FoodKit.totalsOf(S.food,todayKey()),meals:FoodKit.mealsOf(S.food,todayKey()),toast:document.querySelector('#toastTx').textContent,rows:document.querySelectorAll('#view .meal').length})")
    cot = [x for x in st['meals'][0]['it'] if x['n'].startswith('קוטג')][0]
    check(tag + 'the meal is in the diary, with the corrected amount', len(st['meals']) == 1 and len(st['meals'][0]['it']) == 5 and cot['g'] == 200 and 'est' not in cot and 600 < st['tot']['k'] < 800 and 'נרשם' in st['toast'] and st['rows'] == 1, st)
    shot('6-food-day'); contrast('nutrition, a day')
    page.click('#view .meal'); settle(700); t = sheet(); check(tag + 'a logged meal opens for changes', 'הסרת הארוחה' in t and 'קוטג' in t, t[:200]); contrast('meal view', '#sheetBody'); close()

    # ---- search, amount, barcode ----
    page.click('#dock .btn'); settle(700); page.click('#sheetBody .fway:has-text("חיפוש")'); settle(900)
    page.fill('#sheetBody input[type=search]', 'שניצל'); settle(1500)
    res = ev("[...document.querySelectorAll('#sheetBody .item .t')].map(e=>e.textContent)")
    check(tag + 'search finds everyday names first, then the whole table', res[0] == 'שניצל' and len(res) > 6 and res[-1] == 'מוצר משלי', res[:8]); shot('7-search')
    page.click('#sheetBody .item >> nth=0'); settle(900); t = sheet(); check(tag + 'an amount can be given in the food\'s own units', 'יחידה' in t and 'כמה' in t and 'קק״ל' in t, t[:200]); shot('8-amount'); contrast('amount sheet', '#sheetBody')
    page.fill('#sheetBody input[type=number]', '2'); settle(200); page.click('#sheetBody .btn:has-text("רישום")'); settle(900)
    st = ev("FoodKit.mealsOf(S.food,todayKey()).map(m=>m.it.map(x=>x.n+':'+x.g))"); check(tag + 'two schnitzels are logged by weight', any('שניצל:200' in x for m in st for x in m), st)
    page.click('#dock .btn'); settle(700); page.click('#sheetBody .fway:has-text("ברקוד")'); settle(900)
    page.fill('#sheetBody input', '7290000000001'); page.click('#sheetBody .btn:has-text("חיפוש")'); settle(1500)
    t = sheet(); check(tag + 'a barcode brings a product with its numbers', 'חטיף בדיקה' in t and '480' in t, t[:200])
    page.click('#sheetBody .btn:has-text("רישום")'); settle(900)
    st = ev("({mine:S.myfood.items.map(x=>x.n),last:FoodKit.mealsOf(S.food,todayKey()).slice(-1)[0].it.slice(-1)[0]})"); check(tag + 'the product is kept and logged', st['mine'] == ['חטיף בדיקה'] and st['last']['n'] == 'חטיף בדיקה' and st['last']['e'][0] == 144, st)

    # ---- the pantry, the recipes ----
    goto('#pantry'); page.fill('#view input', 'יש לי קילו חזה עוף, חצי קילו אורז, 12 ביצים, עגבניות, מלפפונים, שמן זית ולחם מלא'); page.click('#view .btn:has-text("הוספה")'); settle()
    st = ev("S.pantry.items.map(x=>x.n+' '+(x.q==null?'?':x.q)+x.u)"); t = view()
    check(tag + 'the pantry takes a sentence and keeps amounts as bought', 'חזה עוף 1000g' in st and 'אורז 500g' in st and 'ביצה 12יח' in st and len(st) == 7 and 'עוף והודו' in t and 'אפשר להכין' in t, st)
    shot('9-pantry'); contrast('pantry')
    page.click('#view .card.pressable'); settle(); st = ev("({page:route.page,f:RCP.f,n:document.querySelectorAll('#view .item').length,ok:document.querySelectorAll('#view .cov.ok').length})")
    check(tag + 'recipes can be filtered to what is at home', st['page'] == 'recipes' and st['f'] == 'home' and st['n'] >= 3 and st['ok'] >= 1, st); shot('10-recipes'); contrast('recipes')
    goto('#recipe-chicken-rice-salad'); t = view(); check(tag + 'a recipe shows its numbers, ingredients and steps', 'חזה עוף עם אורז וסלט' in t and 'מצרכים' in t and 'איך מכינים' in t and 'קק״ל' in t, t[:200]); shot('11-recipe'); contrast('recipe')
    before = ev("({k:FoodKit.totalsOf(S.food,todayKey()).k,ch:S.pantry.items.find(x=>x.k==='חזה עוף').q})")
    page.click('#dock .btn'); settle(900)
    after = ev("({k:FoodKit.totalsOf(S.food,todayKey()).k,ch:S.pantry.items.find(x=>x.k==='חזה עוף').q,last:FoodKit.mealsOf(S.food,todayKey()).find(m=>m.rid==='chicken-rice-salad'),toast:document.querySelector('#toastTx').textContent})")
    ev("(() => { pantryAdd([{k:'קינואה',n:'קינואה',q:60,u:'g'},{k:'סלמון',n:'סלמון',q:400,u:'g'}]); recipeEat(MenuKit.byId('salmon-quinoa'),1); })()"); settle(300)
    st = ev("({q:S.pantry.items.some(x=>x.k==='קינואה'),shop:S.shop.items.filter(x=>x.k==='קינואה').length,toast:document.querySelector('#toastTx').textContent})")
    check(tag + 'what a recipe used up leaves the pantry and goes onto the shopping list', not st['q'] and st['shop'] == 1 and 'נכנס לקניות' in st['toast'], st)
    ev("S.shop.items=[]; saveShop(); FoodKit.removeMeal(S.food,todayKey(),FoodKit.mealsOf(S.food,todayKey()).find(m=>m.rid==='salmon-quinoa').id); foodSave(todayKey()); pantryRemove(['סלמון'])")
    check(tag + 'eating a recipe logs it and takes its ingredients out of the pantry', after['k'] - before['k'] > 500 and after['ch'] == before['ch'] - 180 and after['last'] and 'המטבח עודכן' in after['toast'], [before, after])

    # ---- the menu, the shopping list ----
    goto('#mplan'); t = view(); check(tag + 'the menu page offers to build a day or a week', 'עוד אין תפריט ליום הזה' in t and 'לכל השבוע' in t, t[:200]); shot('12-menu-empty'); contrast('menu, empty')
    page.click('#view .btn:has-text("לכל השבוע")'); settle(900)
    st = ev("""(() => { const out=[]; Object.keys(S.mplan.days).sort().forEach(d=>{ const T=nutT(d), tot=[0,0]; S.mplan.days[d].meals.forEach(m=>{ const n=MenuKit.nut(MenuKit.byId(m.rid),m.sv); tot[0]+=n[0]; tot[1]+=n[1]; }); out.push({d,k:tot[0],T:T.kcal,p:tot[1],Tp:T.p,n:S.mplan.days[d].meals.length,bad:S.mplan.days[d].meals.filter(m=>{ const r=MenuKit.byId(m.rid); return r.ko==='x'||(r.al||[]).includes('peanut'); }).length}); }); return out; })()""")
    check(tag + 'a week of menus: every day near its calories, at or above its protein, inside the preferences', len(st) == 7 and all(abs(x['k'] - x['T']) / x['T'] < 0.08 and x['p'] >= x['Tp'] * 0.9 and x['n'] == 4 and x['bad'] == 0 for x in st), st)
    shot('13-menu'); contrast('menu')
    n0 = ev("FoodKit.mealsOf(S.food,todayKey()).length"); page.click('#view .meal .do >> nth=0'); settle(700)
    check(tag + '"I ate it" on a planned meal logs it', ev("FoodKit.mealsOf(S.food,todayKey()).length") == n0 + 1 and ev("S.mplan.days[todayKey()].meals.filter(m=>m.done).length") == 1)
    page.click('#view .hubbox:has-text("רשימת קניות לתפריט")'); settle(900)
    st = ev("({page:route.page,n:S.shop.items.length,hasRice:S.shop.items.some(x=>x.k==='אורז'&&x.q<=500),cats:document.querySelectorAll('#view .catl').length})")
    check(tag + 'the shopping list holds what the menu needs and the pantry lacks', st['page'] == 'shop' and st['n'] > 10 and st['cats'] > 3, st); shot('14-shop'); contrast('shopping list')
    page.click('#view .item >> nth=0'); settle(250); page.click('#view .item >> nth=1'); settle(250)
    pn = ev("S.pantry.items.length"); page.click('#dock .btn'); settle(700)
    st = ev("({left:S.shop.items.filter(x=>x.done).length,pn:S.pantry.items.length,toast:document.querySelector('#toastTx').textContent})"); check(tag + 'what was bought moves into the pantry', st['left'] == 0 and st['pn'] >= pn and 'למטבח' in st['toast'], st)

    # ---- the coach: what it answers by itself ----
    goto('#coach'); t = view(); check(tag + 'the coach door: the conversation, the goal, the person, the settings', all(x in t for x in ['המאמן', 'מטרות והישגים', 'הפרופיל שלי', 'יעדי התזונה', 'מה המאמן זוכר', 'הגדרות']), t[:300]); shot('15-coach'); contrast('coach door')
    page.fill('#view .askbar textarea', 'כמה חלבון חסר לי היום?'); page.click('#view .askbar .go'); settle(900)
    st = ev("({page:route.page,last:S.coach.msgs.slice(-1)[0],n:S.coach.msgs.length})")
    check(tag + 'a question the data answers is answered with no model', st['page'] == 'chat' and st['last']['tier'] == 'local' and 'חלבון' in st['last']['t'] and st['n'] == 2 and len(calls()['calls']) == 0, st)
    def say(text, wait=700):
        page.fill('#dock .askbar textarea', text); page.click('#dock .askbar .go'); settle(wait); return ev("S.coach.msgs.slice(-1)[0]")
    m = say('תזכור שאני לא אוהב חציל'); st = ev("({no:S.nut.no,mem:S.coach.mem.map(x=>x.t)})"); check(tag + 'a thing to remember is kept, with no model', m['tier'] == 'local' and 'חציל' in st['no'] and any('חציל' in x for x in st['mem']), [m, st])
    m = say('שקלתי 83.2'); check(tag + 'a weigh-in is logged, with no model', m['tier'] == 'local' and ev("S.body.w.slice(-1)[0].kg") == 83.2 and '83.2' in m['t'], m)
    m = say('בנץ 8 חזרות 62.5 קילו'); st = ev("S.logs['bench-press'].sessions.slice(-1)[0]"); check(tag + 'a set is logged, with no model', m['tier'] == 'local' and st['d'] == today and st['sets'][-1]['w'] == 62.5 and 'נרשם' in m['t'], [m, st])
    n0 = ev("FoodKit.mealsOf(S.food,todayKey()).reduce((a,m)=>a+m.it.length,0)")
    m = say('אכלתי תפוח ובננה'); check(tag + 'a meal the vocabulary knows waits for one tap', m['tier'] == 'local' and m['acts'][0]['t'] == 'meal' and m['acts'][0]['st'] == 'p' and ev("document.querySelectorAll('#view .actc').length") >= 1, m)
    shot('16-chat-local'); contrast('chat')
    page.click('#view .actc:not(.done) .btn:has-text("רישום")'); settle(700)
    check(tag + 'the tap logs it', ev("FoodKit.mealsOf(S.food,todayKey()).reduce((a,m)=>a+m.it.length,0)") == n0 + 2 and ev("S.coach.msgs.slice(-1)[0].acts[0].st") == 'y')
    m = say('מה אפשר להכין לארוחת ערב?'); check(tag + 'what to cook is answered from the recipes and the pantry, with no model', m['tier'] == 'local' and len(m.get('links') or []) >= 2 and m['links'][0]['to'].startswith('recipe-'), m)
    check(tag + 'nothing so far reached the model', len(calls()['calls']) == 0, calls()['calls'])

    # ---- the coach: what needs a model, and an account ----
    m = say('מה כדאי לי לאכול אחרי האימון?', 900); check(tag + 'without an account a model question says so', m.get('why') == 'auth' and 'חשבון' in m['t'] and ev("[...document.querySelectorAll('#view .btn')].some(b=>b.textContent.includes('כניסה או הרשמה'))"), m)
    ok = ev("""async () => { try{ const mail='v13'+Date.now().toString(36)+'@example.test', pw=Array.from(crypto.getRandomValues(new Uint8Array(9))).map(x=>x.toString(36)).join('');
        await PB.signup(mail,pw,'ui'); S.storageMode='pb'; await syncFromCloud(); return !!PB.user; }catch(e){ return String(e&&e.message); } }""")
    check(tag + 'sign up on the stand-in server', ok is True, ok)
    docs = page.request.get(PBM + '/api/collections/docs/records?perPage=500', headers={'Authorization': ev("PB.token")}).json()
    keys = sorted(x['key'] for x in docs['items']); check(tag + 'a first sign-in sends the new documents up too', all(k in keys for k in ['nut', 'pantry', 'shop', 'mplan', 'coach', 'myfood', 'food-' + today[:7]]), keys)
    # ---- the full coach answers only people the owner invited ----
    goto('#chat'); settle(300)
    m = say('מה כדאי לי לאכול אחרי האימון?', 1200)
    check(tag + 'someone who was not invited is told so, and nothing reaches a model', m.get('why') == 'invite' and 'למוזמנים' in m['t'] and len(calls()['calls']) == 0, m)
    goto('#coach'); settle(600); t = view(); check(tag + 'the coach door says the full coach is for invited people', 'למוזמנים בלבד' in t and 'הזמנות ומגבלות' not in t, t[-300:])
    code = page.request.post(PBM + '/__test/coach', data=json.dumps({'invite': 'owner'}), headers={'Content-Type': 'application/json'}).json()['code']
    goto('#join-' + code); settle(1500)
    st = ev("({page:route.page,hash:location.hash,info:CO.info,kept:joinCode(),toast:document.querySelector('#toastTx').textContent})")
    check(tag + 'opening an invitation link unlocks the coach, and the code does not stay in the address', st['page'] == 'coach' and st['hash'] == '#coach' and st['info'] and st['info']['access'] and st['info']['owner'] and not st['kept'] and 'המאמן' in st['toast'], st)
    t = view(); check(tag + 'the owner gets a box for invitations and limits', 'הזמנות ומגבלות' in t and '20 הודעות ביום' in t, t[-300:])
    goto('#crew'); settle(1000); t = view()
    check(tag + 'the owner sees the limits and who is in', 'הודעות ביום לאדם' in t and 'תקציב יומי' in t and 'בעלים' in t and 'להזמין מישהו' in ev("document.querySelector('#dock').innerText"), t[:400]); shot('21-crew'); contrast('the owner\'s corner')
    page.click('#view .stepper >> nth=0 >> button >> nth=0'); settle(1600)
    cfgs = calls()['config']; check(tag + 'the number of answers a day is changed from the app', ev("CREW.st.total") == 15 and len(cfgs) == 1 and cfgs[0]['total'] == 15 and ev("CO.info.limit") == 15, cfgs)
    page.click('#view .stepper >> nth=0 >> button >> nth=1'); settle(1600)
    page.click('#dock .btn'); settle(1300); t = sheet(); link = ev("(document.querySelector('#sheetBody input')||{}).value||''")
    check(tag + 'an invitation is a link to this app with a code in it, and one more link is waiting', re.match(r'^http://127\.0\.0\.1:8793/index\.html#join-[A-Za-z0-9]{24}$', link) is not None and 'קישור הזמנה' in t and ev("CREW.st.pending") == 1 and ev("CREW.st.total") == 20, [link, t[:120]])
    contrast('invitation link', '#sheetBody'); close()

    goto('#chat'); settle(300)
    m = say('מה כדאי לי לאכול אחרי האימון?', 1200); c = calls()['calls']
    check(tag + 'a short question goes to the small model, thinking little', m['tier'] == 'cheap' and len(c) == 1 and c[0]['model'] == 'claude-haiku-5-5' and c[0]['effort'] == 'low' and c[0]['fallbacks'] == '' and c[0]['format'] and c[0]['cached'], [m, c])
    m = say('תבנה לי תפריט לשבוע עם הרבה חלבון שלא יעלה יותר מ-350 שקלים', 1200); c = calls()['calls']
    check(tag + 'a plan with a budget goes to the large model', m['tier'] in ('smart', 'deep') and c[-1]['model'] == 'claude-opus-5-5' and c[-1]['fallbacks'] == 'default' and m['acts'] and m['acts'][0]['t'] == 'plan', [m, c[-1]])
    shot('17-chat-model'); contrast('chat with a proposal')
    page.click('#view .actc:not(.done) .btn:has-text("לתפריט שלי")'); settle(700)
    tm = ev("addDays(todayKey(),1)"); check(tag + 'the proposed menu enters the plan only after the tap', ev("d => (S.mplan.days[d].meals||[]).length", tm) == 3 and ev("S.coach.msgs.slice(-1)[0].acts[0].st") == 'y')
    m = say('יש לי עוף, אורז, ביצים וירקות בבית. תבנה לי ארוחות לשלושת הימים הקרובים לפי התפריט שלי, ותמצא לי איפה לקנות את מה שחסר הכי בזול.', 1200); c = calls()['calls']
    check(tag + 'a request that crosses everything goes to the large model, thinking more', m['tier'] == 'deep' and c[-1]['effort'] == 'medium' and c[-1]['max_tokens'] == 16000, [m.get('tier'), c[-1]])
    ev("coachSend('', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==')"); settle(1200); m = ev("S.coach.msgs.slice(-1)[0]"); c = calls()['calls']
    check(tag + 'a photo of a plate goes to the large model and comes back as a meal to confirm', c[-1]['img'] and c[-1]['model'] == 'claude-opus-5-5' and m['acts'][0]['t'] == 'meal', [m, c[-1]])
    usage = calls()['usage']; check(tag + 'the server counts each answer and its cost', len(usage) == 1 and usage[0]['cheap'] == 1 and usage[0]['smart'] + usage[0]['deep'] == 3 and usage[0]['img'] == 1 and usage[0]['cost'] > 0, usage)
    coach(mode='refuse'); m = say('שאלה כלשהי על אימונים וגם על תזונה?', 1200); check(tag + 'a declined request is said plainly', m.get('why') == 'refusal' and 'לא יכול לעזור' in m['t'], m)
    coach(mode='busy'); m = say('עוד שאלה על אימונים?', 1500); check(tag + 'a busy model is said plainly', m.get('why') == 'busy', m)
    coach(mode='schema400'); m = say('ועוד שאלה אחת על תזונה?', 1500); c = calls()['calls']; check(tag + 'when the answer shape is refused, one more try without it still answers', m.get('tier') == 'cheap' and c[-2]['format'] and not c[-1]['format'], [m, c[-2:]])
    coach(mode='', cfg={'perUser': {'cheap': 0, 'smart': 0, 'deep': 0, 'img': 0}}); m = say('ושאלה אחרונה על תזונה?', 1200); check(tag + 'past the daily limit the coach says so and spends nothing', m.get('why') == 'quota' and 'מכסת' in m['t'], m)
    coach(mode='', cfg=None)
    page.click('#hdr .iconbtn'); settle(700); t = sheet(); check(tag + 'the conversation menu', 'מה המאמן זוכר' in t and 'כמה לחשוב' in t and 'ניקוי השיחה' in t, t); contrast('chat menu', '#sheetBody'); close()

    # ---- the ask-the-coach road from a meal the vocabulary cannot read ----
    goto('#food'); page.click('#dock .btn'); settle(700); page.fill('#sheetBody textarea', 'המבורגר ענק במסעדה עם תוספות'); page.click('#sheetBody .btn:has-text("המשך")'); settle(500)
    t = sheet(); check(tag + 'an unknown meal offers the coach', 'המאמן יפענח' in t, t[:300]); shot('18-meal-unknown'); contrast('meal sheet, unknown', '#sheetBody')
    page.click('#sheetBody .btn:has-text("המאמן יפענח")'); settle(2200); t = sheet()
    check(tag + 'the coach reads it and the same confirmation list comes back, marked as an estimate', 'לרשום את הארוחה?' in t and 'המבורגר' in t and 'הערכה' in t, t[:300]); shot('19-meal-ai')
    page.click('#sheetBody .btn:has-text("רישום")'); settle(900)
    check(tag + 'and it is logged', ev("FoodKit.mealsOf(S.food,todayKey()).some(m=>m.it.some(x=>x.n.includes('המבורגר')))"))

    # ---- memory, settings, progress, backup ----
    goto('#memory'); t = view(); check(tag + 'what the coach remembers can be seen and removed', 'חציל' in t and ev("document.querySelectorAll('#view .memrow').length") >= 1, t[:200]); contrast('memory')
    goto('#settings'); settle(900); t = view(); check(tag + 'settings open with the coach\'s part', t.index('המאמן') < t.index('באימון') and 'כמה לחשוב' in t and 'נשארו היום' in t, t[:400]); shot('20-settings'); contrast('settings')
    goto('#nprog'); t = view(); check(tag + 'nutrition progress: days, averages, the fortnight', 'ימים ביומן' in t and 'קלוריות ביום · שבועיים' in t and ev("document.querySelectorAll('#view .kbars .b').length") == 14, t[:300]); shot('21-nprog'); contrast('nutrition progress')
    goto('#ach'); t = view(); check(tag + 'the nutrition medals are with the others', 'ביס ראשון' in t and 'מטבח מסודר' in t and 'תפריט ראשון' in t and ev("['fd1','pn','pl','ck'].every(k=>S.prefs.ach[k])"), ev("S.prefs.ach"))
    bk = ev("(() => { const d={app:'setim',profile:S.profile,logs:S.logs,...backupExtra()}; return {keys:Object.keys(d),food:Object.keys(d.food),mem:d.coach.mem.length,msgs:d.coach.msgs.length}; })()")
    check(tag + 'a backup carries the nutrition documents, and what the coach remembers without the conversation', all(k in bk['keys'] for k in ['nut', 'food', 'pantry', 'shop', 'mplan', 'coach', 'myfood']) and bk['food'] == [today[:7]] and bk['mem'] >= 1 and bk['msgs'] == 0, bk)

    # ---- everything comes back after the page is opened again: from this device, and from the account ----
    ev("document.querySelector('#dock .askbar textarea') && 0"); goto('#chat'); page.fill('#dock .askbar textarea', 'טיוטה שלא נשלחה'); ev("render()"); settle(200)
    check(tag + 'a draft in the chat box survives a repaint', ev("document.querySelector('#dock .askbar textarea').value") == 'טיוטה שלא נשלחה')
    ev("Promise.all(Object.values(writeQ))"); settle(600)
    page.reload(); page.wait_for_function("typeof S !== 'undefined' && S.ex && S.ex.length > 700 && FD.core"); settle(1200)
    # the number of meals depends on the hour the test runs at (what is logged within 45 minutes into the same slot is one meal), so the foods are counted
    st = ev("({goal:S.nut.goal,kosher:S.nut.kosher,pantry:S.pantry.items.length,meals:FoodKit.mealsOf(S.food,todayKey()).length,foods:FoodKit.mealsOf(S.food,todayKey()).reduce((a,m)=>a+m.it.length,0),plan:Object.keys(S.mplan.days).length,mem:S.coach.mem.length,msgs:S.coach.msgs.length,mine:S.myfood.items.length,user:!!PB.user,tabs:[...document.querySelectorAll('#tabbar .tab')].map(t=>t.textContent)})")
    check(tag + 'after a reload the nutrition data, the menu, the pantry and the conversation are all there', st['goal'] == 'lose' and st['kosher'] is True and st['pantry'] >= 5 and st['meals'] >= 3 and st['foods'] >= 10 and st['plan'] >= 7 and st['mem'] >= 1 and st['msgs'] >= 10 and st['mine'] == 1 and st['user'] and len(st['tabs']) == 3, st)
    ctx.close(); b.close()

with sync_playwright() as pw:
    for scheme in ('light', 'dark'):
        run(pw, scheme)
check('no script errors in the page', not errors, errors[:6])
print('\n%s (%d failed)' % ('ALL PASSED' if not fails else 'SOME CHECKS FAILED', len(fails)))
sys.exit(1 if fails else 0)
