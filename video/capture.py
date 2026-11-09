# -*- coding: utf-8 -*-
"""Screenshots of the app for the explainer video (Playwright, headless Chromium, 375x812 @3x, dark theme).
Seeds demo data in the page's localStorage so every screen has content, then captures each screen and the
bounding boxes (CSS px) of the controls the narration explains. Output: video/out/shots/*.png + shots.json.
Needs the local dev server:  python -m http.server 8765  (or the preview the app already runs)."""
import os, json, io, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out', 'shots'); os.makedirs(OUT, exist_ok=True)
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765/index.html'

SEED = r"""
(() => {
  const tk=todayKey(); const dow=new Date(tk).getDay();
  const pick=(g,n)=>S.ex.filter(e=>e.g===g&&e.mech==='compound'&&!e.bw).slice(0,n).map(e=>e.id);
  const ids=[...pick('chest',2),...pick('back',1),...pick('shoulders',1)];
  const week={days:{}}; for(let i=0;i<7;i++) week.days[i]={label:'מנוחה',groups:[],ex:[],rest:true};
  week.days[dow]={label:'חזה וגב',groups:['chest','back','delt_front'],ex:ids.map(id=>({id,sets:3,reps:10})),rest:false};
  const d2=(dow+2)%7; week.days[d2]={label:'רגליים',groups:['legs','glutes'],ex:pick('legs',4).map(id=>({id,sets:3,reps:10})),rest:false};
  const d3=(dow+5)%7; week.days[d3]={label:'כתפיים ובטן',groups:['shoulders','core'],ex:pick('shoulders',2).concat(S.ex.filter(e=>e.g==='core'&&e.cat==='strength').slice(0,2).map(e=>e.id)).map(id=>({id,sets:3,reps:12})),rest:false};
  localStorage.setItem('gt:week',JSON.stringify(week));
  const addD=(k,n)=>{const d=new Date(k); d.setDate(d.getDate()+n); return iso(d);};
  const days={map:{}};
  ids.forEach((id,i)=>{ const sessions=[]; [-21,-14,-7].forEach((off,j)=>{ const d=addD(tk,off); sessions.push({d,sets:[{r:10,w:40+j*2.5+i*5,t:true},{r:10,w:40+j*2.5+i*5,t:true},{r:8,w:40+j*2.5+i*5,t:true}]}); days.map[d]=days.map[d]||{label:'חזה וגב',routine:'',ids:[]}; days.map[d].ids.push(id); });
    if(i===0) sessions.push({d:tk,sets:[{r:10,w:50,t:true},{r:10,w:50,t:true},{r:8,w:50,t:true}]});
    if(i===1) sessions.push({d:tk,sets:[{r:10,w:30,t:true},{r:10,w:30,t:false},{r:10,w:30,t:false}]});
    localStorage.setItem('gt:log-'+id,JSON.stringify({sessions})); });
  pick('legs',4).forEach((id,i)=>{ const sessions=[]; [-19,-12,-5].forEach((off,j)=>{ const d=addD(tk,off); sessions.push({d,sets:[{r:10,w:60+j*5+i*10,t:true},{r:10,w:60+j*5+i*10,t:true},{r:8,w:60+j*5+i*10,t:true}]}); days.map[d]=days.map[d]||{label:'רגליים',routine:'',ids:[]}; days.map[d].ids.push(id); }); localStorage.setItem('gt:log-'+id,JSON.stringify({sessions})); });
  days.map[tk]={label:'חזה וגב',routine:'',ids:ids.slice(0,2)};
  localStorage.setItem('gt:days',JSON.stringify(days));
  localStorage.setItem('gt:profile',JSON.stringify({name:'משה',goal:'hypertrophy',weekly:3,weight:82,height:178,age:35,sex:'m',program:'full',brand:'technogym'}));
  localStorage.setItem('gt:deck',JSON.stringify({machines:['chest_press','lat_pulldown','leg_press','cable','rack','dumbbells'],stars:ids.slice(0,2),custom:[]}));
  localStorage.setItem('gt:theme','dark'); localStorage.setItem('gt:onboarded','1'); localStorage.removeItem('gt:wo');
  return ids;
})()
"""

RECTS = "(sels)=>{const R=s=>[...document.querySelectorAll(s)].map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]}); const o={}; for(const [k,s] of Object.entries(sels)) o[k]=R(s); return o;}"

SHOTS = [
 ('home',     '#home',    None, {'tabs':'.tabbar .tab','strip':'.ds','ring':'.todaybox .ring','gobar':'.todaybox .gobar','dots':'.todaybox .iconbtn','items':'.list .item','plus':'.btn.ghost','box':'.todaybox','title':'.display'}),
 ('home2',    '#home',    "document.getElementById('scroll').scrollTop=120", {'tabs':'.tabbar .tab','ring':'.todaybox .ring','gobar':'.todaybox .gobar','dots':'.todaybox .iconbtn','items':'.list .item','plus':'.btn.ghost','box':'.todaybox'}),
 ('daymenu',  '#home',    "document.getElementById('scroll').scrollTop=0; dayMenuMin(new Date(todayKey()).getDay())", {'sheet':'.sheet','items':'.sheet .item'}),
 ('exercise', '#ex-assisted-dips', None, {'demo':'.demo','stp':'.sets .stp','chk':'.sets .chk','addset':'.setact .btn','star':'.hdr .star','dots':'.hdr .iconbtn','back':'.hdr .back','sets':'.sets','hero':'.hero'}),
 ('workout',  '#workout', "woStart(); S.wo.start=Date.now()-754000; woSave(); render()", {'top':'.wo-top','tm':'.wo-top .tm','ctl':'.wo-top .ctl button','strip':'.wo-strip','name':'.wo-name','sets':'.sets','next':'.wo-next'}),
 ('journal',  '#journal', "S.wo=null; localStorage.removeItem('gt:wo')", {'jstats':'.jstats','cal':'.cal','done':'.cal .c.done','jdate':'.jdate','tabs':'.tabbar .tab'}),
 ('more',     '#more',    None, {'prof':'.profcard','boxes':'.hubbox','tabs':'.tabbar .tab'}),
 ('library',  '#library', None, {'search':'.search','cats':'.cat'}),
 ('plans',    '#plans',   None, {'cards':'.card','btn':'.btn'}),
 ('settings', '#settings',None, {'card':'.card','items':'.item'}),
]

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=3, color_scheme='dark', locale='he-IL', is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.goto(BASE + '#home'); pg.wait_for_function('typeof S!=="undefined" && S.ex && S.ex.length>600', timeout=30000)
    ids = pg.evaluate(SEED); print('seeded ids:', ids)
    pg.reload(); pg.wait_for_function('typeof S!=="undefined" && S.ex && S.ex.length>600', timeout=30000); pg.wait_for_timeout(600)
    meta = {}
    for name, hsh, pre, sels in SHOTS:
        pg.evaluate("h=>{ if(location.hash!==h){ location.hash=h; } }", hsh); pg.wait_for_timeout(350)
        if pre: pg.evaluate(pre)
        pg.wait_for_timeout(900 if pre else 500)
        # settle animations (page fade-in, stagger) and the sheet spring
        pg.wait_for_timeout(500)
        rects = pg.evaluate(RECTS, sels)
        path = os.path.join(OUT, name + '.png'); pg.screenshot(path=path, animations='disabled')
        meta[name] = {'hash': hsh, 'rects': rects}
        print(name, {k: len(v) for k, v in rects.items()})
        if name == 'daymenu': pg.evaluate("Sheet.close()"); pg.wait_for_timeout(500)
    json.dump({'viewport': [375, 812], 'dpr': 3, 'ids': ids, 'shots': meta}, io.open(os.path.join(OUT, 'shots.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    b.close()
print('done ->', OUT)
