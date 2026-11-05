# -*- coding: utf-8 -*-
"""One-off: weekly planner (7 days, muscles, exercises, sets×reps), today's workout from the plan, "since you started"
history, share / QR / Open Graph for distribution. Applied to index.template.html and index.html."""
CSS = r"""
/* weekly planner */
.wk{display:flex;gap:8px;overflow-x:auto;margin:0 -18px 14px;padding:4px 18px 10px;scrollbar-width:none}
.wk::-webkit-scrollbar{display:none}
.wd{flex:0 0 76px;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;transition:border-color .2s,transform .2s}
.wd.on{border-color:var(--accent);background:var(--card2)}
.wd .d{font-weight:900;font-size:18px;letter-spacing:-.02em}
.wd .l{font-size:10.5px;color:var(--ink2);font-weight:700;text-align:center;line-height:1.2;max-width:70px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wd .n{font-size:10px;color:var(--ink3);font-weight:700}
.wd.today .d{color:var(--accent)}
.wd .dot{position:absolute;top:8px;inset-inline-end:8px;width:8px;height:8px;border-radius:50%;background:var(--good)}
.wd.rest .d{color:var(--ink3)}
.gchips{display:flex;flex-wrap:wrap;gap:8px}
.gchip{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:var(--card2);color:var(--ink2);font-size:13px;font-weight:700;border:1px solid transparent;transition:background .2s,color .2s}
.gchip svg.i{width:16px;height:16px}
.gchip.on{background:var(--accent-soft);color:var(--accent);border-color:rgba(255,107,74,.35)}
.plan-ex{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line)}
.plan-ex:last-child{border-bottom:0}
.plan-ex .th{width:52px;height:52px;border-radius:12px;background:var(--card2);overflow:hidden;flex:none}
.plan-ex .th img{width:100%;height:100%;object-fit:cover}
.plan-ex .t{font-weight:800;font-size:14px;line-height:1.25}
.plan-ex .s{font-size:11.5px;color:var(--ink2);margin-top:2px}
.mini{display:inline-grid;grid-template-columns:26px 1fr 26px;align-items:center;background:var(--card2);border:1px solid var(--line);border-radius:10px;height:32px;overflow:hidden;vertical-align:middle}
.mini button{height:100%;display:grid;place-items:center;color:var(--accent)}
.mini button svg.i{width:14px;height:14px;stroke-width:2.6}
.mini b{min-width:28px;text-align:center;font-size:14px}
.plan-ex .ctl{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px}
.plan-ex .ctl .x{font-size:11px;color:var(--ink3);font-weight:800}
.iconbtn.sm{width:30px;height:30px;border-radius:9px}
.iconbtn.sm svg.i{width:16px;height:16px}
.restcard{text-align:center;padding:26px 16px;color:var(--ink2)}
.restcard svg.i{width:36px;height:36px;color:var(--ink3);margin-bottom:8px}
.qr{display:grid;place-items:center;background:#fff;border-radius:20px;padding:14px;margin:12px auto;width:220px}
.qr img{width:100%;height:auto;image-rendering:pixelated}
"""

JS = r"""
/* ========================= WEEKLY PLANNER ========================= */
const DAY_NAMES=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'], DAY_LETTERS=['א','ב','ג','ד','ה','ו','ש'];
const DAY_PRESETS=[{l:'כל הגוף',g:['chest','back','legs','shoulders','core']},{l:'דחיפה',g:['chest','shoulders','arms']},{l:'משיכה',g:['back','arms']},{l:'רגליים',g:['legs','glutes']},{l:'פלג גוף עליון',g:['chest','back','shoulders','arms']},{l:'פלג גוף תחתון',g:['legs','glutes','core']},{l:'חזה וטריצפס',g:['chest','arms']},{l:'גב וביצפס',g:['back','arms']},{l:'כתפיים ובטן',g:['shoulders','core']},{l:'קרדיו',g:['cardio']},{l:'מנוחה',rest:true}];
const TRAIN_DAYS={2:[1,4],3:[0,2,4],4:[0,1,3,4],5:[0,1,2,3,4],6:[0,1,2,3,4,5]};
let wkSel=new Date(todayKey()).getDay();
function wkDay(i){ const d=S.week.days[i]||(S.week.days[i]={label:'',groups:[],ex:[],rest:false}); d.ex=d.ex||[]; d.groups=d.groups||[]; return d; }
function saveWeek(){ save('week',S.week); }
function repsForGoal(){ return S.profile.goal==='strength'?5:S.profile.goal==='endurance'?15:10; }
function dayDoneInfo(i){ const [a,b]=weekRange(0); const d=new Date(a); d.setDate(d.getDate()+i); const k=iso(d); const sess=allSessions().filter(s=>s.d===k); return {date:k,done:sess.length>0,n:new Set(sess.map(s=>s.id)).size,vol:sess.reduce((n,s)=>n+volume(s.sets),0)}; }
function autoFillWeek(){
  const prog=PROGRAMS.find(p=>p.id===(S.profile.program||'full'))||PROGRAMS[0]; const wk=S.profile.weekly||3; const slots=TRAIN_DAYS[wk]||TRAIN_DAYS[3]; const reps=repsForGoal();
  for(let i=0;i<7;i++) S.week.days[i]={label:'מנוחה',groups:[],ex:[],rest:true};
  slots.forEach((di,k)=>{ const pd=prog.days[k%prog.days.length]; const ids=buildDay(pd,(S.profile.seed||0)*5+k); const groups=[...new Set(pd.slots.map(slotGroup))]; S.week.days[di]={label:prog.days.length>1?`${prog.name} · ${pd.n}`:prog.name,groups,ex:ids.map(id=>({id,sets:3,reps})),rest:false}; });
  saveWeek();
}
function week(){
  header('השבוע שלי'); const wrap=h('div'); wrap.append(h('div',{class:'display'},'השבוע שלי'),h('p',{class:'lead'},'איזה יום, אילו שרירים, אילו תרגילים, כמה סטים וחזרות. הכול שלך לשינוי.'));
  const today=new Date(todayKey()).getDay(); const empty=[0,1,2,3,4,5,6].every(i=>!(S.week.days[i]&&(S.week.days[i].ex||[]).length)&&!(S.week.days[i]&&S.week.days[i].rest));
  if(empty) wrap.append(h('div',{class:'card glow'},h('div',{class:'k',style:'font-size:17px'},'השבוע עדיין ריק'),h('p',{class:'small muted',style:'margin:6px 0 12px;line-height:1.6'},`אפשר למלא אוטומטית לפי תוכנית "${(PROGRAMS.find(p=>p.id===(S.profile.program||'full'))||PROGRAMS[0]).name}" ו-${S.profile.weekly||3} אימונים בשבוע, ואז לשנות מה שרוצים. או לבנות יום-יום בעצמך.`),h('div',{class:'row',style:'gap:8px'},h('button',{class:'btn',onclick:()=>{ autoFillWeek(); render(); toast('השבוע מולא. עכשיו אפשר לשחק עם הכול.'); }},'מלא אוטומטית'),h('button',{class:'btn sec2',style:'width:auto;padding-inline:14px',onclick:()=>go('#plans')},'תוכניות'))));
  const strip=h('div',{class:'wk'});
  for(let i=0;i<7;i++){ const d=wkDay(i); const info=dayDoneInfo(i); strip.append(h('button',{class:'wd pressable'+(i===wkSel?' on':'')+(i===today?' today':'')+(d.rest?' rest':''),onclick:()=>{ wkSel=i; render(); }},info.done?h('i',{class:'dot',title:'בוצע'}):null,h('div',{class:'d'},DAY_LETTERS[i]),h('div',{class:'l'},d.rest?'מנוחה':(d.label||(d.ex.length?'אימון':'ריק'))),h('div',{class:'n'},d.rest?'':(d.ex.length?`${d.ex.length} תרגילים`:'')))); }
  wrap.append(strip);
  const d=wkDay(wkSel); const info=dayDoneInfo(wkSel);
  const card=h('div',{class:'card'});
  const title=h('div',{class:'row between'},h('div',{},h('div',{class:'k',style:'font-size:18px'},`יום ${DAY_NAMES[wkSel]}`+(wkSel===today?' · היום':'')),info.done?h('div',{class:'xs b',style:'color:var(--good)'},`בוצע השבוע · ${info.n} תרגילים · ${fmtK(info.vol)} ק״ג`):null),h('button',{class:'iconbtn sm',title:'אפשרויות',html:I('dots'),onclick:()=>dayMenu(wkSel)}));
  card.append(title);
  const lbl=h('input',{type:'text',value:d.rest?'':d.label,placeholder:'שם ליום, למשל "רגליים" או "דחיפה"',style:'margin-top:10px'}); lbl.addEventListener('change',()=>{ d.label=lbl.value.trim(); saveWeek(); render(); });
  card.append(h('div',{class:'fld',style:'margin:10px 0 8px'},h('label',{},'מה היום הזה'),lbl));
  card.append(h('div',{class:'chips',style:'padding-top:0'},...DAY_PRESETS.map(p=>h('button',{class:'chip'+(d.rest&&p.rest?' on':(!d.rest&&d.label===p.l?' on':'')),onclick:()=>{ if(p.rest){ d.rest=true; d.label='מנוחה'; } else { d.rest=false; d.label=p.l; d.groups=[...p.g]; } saveWeek(); render(); }},p.l))));
  if(d.rest){ card.append(h('div',{class:'restcard'},ic('heart'),h('div',{class:'k'},'יום מנוחה'),h('div',{class:'small'},'השריר נבנה דווקא עכשיו. שינה, אוכל ומתיחות קלות.'))); wrap.append(card); wrap.append(credit()); return wrap; }
  card.append(h('div',{class:'xs b muted',style:'margin:12px 0 6px;letter-spacing:.04em'},'שרירים שעובדים היום'));
  card.append(h('div',{class:'gchips'},...GROUP_ORDER.map(g=>h('button',{class:'gchip'+(d.groups.includes(g)?' on':''),html:I(g)+`<span>${GROUPS[g]}</span>`,onclick:()=>{ d.groups=d.groups.includes(g)?d.groups.filter(x=>x!==g):[...d.groups,g]; saveWeek(); render(); }}))));
  wrap.append(card);
  // exercises
  wrap.append(h('div',{class:'sec'},h('h2',{},`תרגילים · ${d.ex.length}`),h('button',{onclick:()=>addToDaySheet(wkSel)},'+ הוסף תרגיל')));
  const list=h('div',{class:'list'});
  if(!d.ex.length) list.append(h('div',{class:'empty'},ic('plan'),h('div',{},'עוד אין תרגילים ביום הזה.'),h('button',{class:'btn sm ghost',onclick:()=>addToDaySheet(wkSel)},'הוסף תרגיל')));
  d.ex.forEach((pe,idx)=>{ const e=getEx(pe.id); if(!e) return; const last=lastSession(e.id); const mini=(val,min,onc)=>h('span',{class:'mini'},h('button',{html:I('plus'),onclick:()=>onc(val+1)}),h('b',{},val),h('button',{html:I('minus'),onclick:()=>onc(Math.max(min,val-1))}));
    list.append(h('div',{class:'plan-ex'},h('button',{class:'th pressable',onclick:()=>go('#ex-'+e.id)},hasImg(e)?exImg(e,'s'):null),h('div',{class:'grow'},h('button',{class:'t',style:'text-align:start',onclick:()=>go('#ex-'+e.id)},e.he),h('div',{class:'s'},last?`פעם שעברה ${fmtW(Math.max(...last.sets.map(x=>+x.w||0)))} ק״ג × ${Math.max(...last.sets.map(x=>+x.r||0))} · ${fmtDate(last.d)}`:(MUSCLE[e.pm?.[0]]||GROUPS[e.g])),h('div',{class:'ctl'},h('span',{class:'x'},'סטים'),mini(pe.sets||3,1,v=>{ pe.sets=v; saveWeek(); render(); }),h('span',{class:'x'},'חזרות'),mini(pe.reps||10,1,v=>{ pe.reps=v; saveWeek(); render(); }))),h('div',{style:'display:flex;flex-direction:column;gap:4px'},h('button',{class:'iconbtn sm',html:I('chevd'),style:'transform:rotate(180deg)',title:'למעלה',onclick:()=>{ if(idx>0){ [d.ex[idx-1],d.ex[idx]]=[d.ex[idx],d.ex[idx-1]]; saveWeek(); render(); } }}),h('button',{class:'iconbtn sm',html:I('chevd'),title:'למטה',onclick:()=>{ if(idx<d.ex.length-1){ [d.ex[idx+1],d.ex[idx]]=[d.ex[idx],d.ex[idx+1]]; saveWeek(); render(); } }}),h('button',{class:'iconbtn sm',html:I('trash'),title:'הסר',style:'color:var(--bad)',onclick:()=>{ d.ex.splice(idx,1); saveWeek(); render(); }})))); });
  wrap.append(list);
  if(d.ex.length){ const ids=d.ex.map(x=>x.id); const targets={}; d.ex.forEach(x=>targets[x.id]={sets:x.sets||3,reps:x.reps||10}); wrap.append(h('button',{class:'btn',onclick:()=>startPlan(ids,targets)},wkSel===today?'התחל את האימון של היום':`התחל את האימון של יום ${DAY_NAMES[wkSel]} עכשיו`)); }
  wrap.append(h('div',{class:'sec'},h('h2',{},'עוד')),h('div',{class:'list'},h('button',{class:'item pressable',onclick:()=>confirmSheet('למלא את השבוע מחדש?','התוכנית הנוכחית של כל שבעת הימים תוחלף לפי התוכנית והיעד השבועי שבפרופיל.',()=>{ autoFillWeek(); render(); toast('השבוע מולא מחדש'); },'כן, מלא מחדש')},h('div',{class:'th',style:'width:40px;height:40px;border-radius:12px;color:var(--accent);background:var(--accent-soft)'},ic('shuffle')),h('div',{class:'grow t'},'מלא את השבוע אוטומטית לפי התוכנית'),h('span',{class:'chev',html:I('chev')})),h('button',{class:'item pressable',onclick:()=>go('#plans')},h('div',{class:'th',style:'width:40px;height:40px;border-radius:12px;color:var(--accent);background:var(--accent-soft)'},ic('plan')),h('div',{class:'grow t'},'תוכניות מוכנות, המלצה להיום ו-AI'),h('span',{class:'chev',html:I('chev')}))));
  wrap.append(credit()); return wrap;
}
function dayMenu(i){ const d=wkDay(i); const body=h('div'); body.append(h('h2',{},`יום ${DAY_NAMES[i]}`));
  const copyTo=h('div',{class:'gchips'}); for(let j=0;j<7;j++){ if(j===i) continue; copyTo.append(h('button',{class:'gchip',onclick:()=>{ S.week.days[j]=JSON.parse(JSON.stringify(d)); saveWeek(); Sheet.close(); toast(`הועתק ליום ${DAY_NAMES[j]}`); render(); }},DAY_LETTERS[j])); }
  body.append(h('div',{class:'xs b muted',style:'margin:6px 0 8px'},'העתק את היום הזה אל'),copyTo,h('button',{class:'btn danger',style:'margin-top:16px',onclick:()=>{ S.week.days[i]={label:'',groups:[],ex:[],rest:false}; saveWeek(); Sheet.close(); render(); }},'נקה את היום'),h('button',{class:'btn sec2',style:'margin-top:8px',onclick:()=>Sheet.close()},'סגור')); Sheet.show(body); }
function addToDaySheet(i){
  const d=wkDay(i); const body=h('div'); let q='';
  const inp=h('input',{type:'search',placeholder:'חיפוש תרגיל…'}); const res=h('div',{class:'list',style:'margin-top:10px;max-height:52vh;overflow:auto'});
  const stars=new Set(S.deck.stars||[]); const mids=new Set(S.deck.machines||[]); const fromM=new Set(); MACHINES.filter(m=>mids.has(m.id)).forEach(m=>m.ex.forEach(x=>fromM.add(x)));
  function draw(){ res.replaceChildren(); const qq=inp.value.trim().toLowerCase(); let items=allEx().filter(e=>!d.ex.some(x=>x.id===e.id)); if(qq.length>=2) items=items.filter(e=>(e.he||'').toLowerCase().includes(qq)||(e.en||'').toLowerCase().includes(qq)); else if(d.groups.length) items=items.filter(e=>d.groups.includes(e.g)); const score=e=>(stars.has(e.id)?4:0)+(lastSession(e.id)?3:0)+(fromM.has(e.id)?2:0)+(e.mech==='compound'?1:0); items=items.sort((a,b)=>score(b)-score(a)).slice(0,40); if(!items.length) res.append(h('div',{class:'empty'},'לא נמצא. נסה/י חיפוש אחר.')); items.forEach(e=>res.append(exItem(e,{sub:(MUSCLE[e.pm?.[0]]||GROUPS[e.g])+' · '+(EQ[e.eq]||''),right:h('span',{class:'chip acc'},'הוסף'),onclick:()=>{ d.ex.push({id:e.id,sets:3,reps:repsForGoal()}); if(!d.groups.includes(e.g)&&e.g!=='full') d.groups.push(e.g); saveWeek(); toast(`${e.he} נוסף ליום ${DAY_NAMES[i]}`); haptic(8); draw(); }}))); }
  inp.addEventListener('input',draw);
  body.append(h('h2',{},`הוספה ליום ${DAY_NAMES[i]}`),h('p',{class:'small muted',style:'margin:0 0 8px'},d.groups.length?`מציג קודם תרגילים ל${d.groups.map(g=>GROUPS[g]).join(', ')}, המכשירים שלך והתרגילים שכבר עשית.`:'מציג את המכשירים שלך והתרגילים שכבר עשית. אפשר לחפש כל תרגיל.'),h('div',{class:'search',style:'margin:0'},ic('target'),inp),res,h('button',{class:'btn sec2',style:'margin-top:10px',onclick:()=>{ Sheet.close(); render(); }},'סיימתי'));
  Sheet.show(body,()=>render()); draw();
}
function todayFromWeek(){ const i=new Date(todayKey()).getDay(); const d=S.week.days[i]; if(!d) return null; if(d.rest) return {rest:true,label:d.label}; if(!(d.ex||[]).length) return null; const targets={}; d.ex.forEach(x=>targets[x.id]={sets:x.sets||3,reps:x.reps||10}); return {label:d.label,groups:d.groups||[],ids:d.ex.map(x=>x.id),targets}; }
function sinceStart(){ return Object.keys(S.logs).map(id=>{ const ss=(S.logs[id].sessions||[]).filter(s=>s.sets.some(x=>x.w>0)); if(ss.length<2) return null; const first=ss[0], last=ss[ss.length-1]; const f=Math.max(...first.sets.map(x=>e1rm(+x.w||0,+x.r||0))), l=Math.max(...last.sets.map(x=>e1rm(+x.w||0,+x.r||0))); const fw=Math.max(...first.sets.map(x=>+x.w||0)), lw=Math.max(...last.sets.map(x=>+x.w||0)); return {id,n:ss.length,firstD:first.d,lastD:last.d,fw,lw,p:f?(l-f)/f*100:0}; }).filter(Boolean).sort((a,b)=>b.p-a.p); }
async function shareApp(){ const url='https://getonekeyai.com/'; const data={title:'סטים',text:'יומן אימונים: סטים, משקלים, התקדמות ותוכנית שבועית. ',url}; try{ if(navigator.share){ await navigator.share(data); return; } }catch(e){ if(e&&e.name==='AbortError') return; } try{ await navigator.clipboard.writeText(url); toast('הקישור הועתק'); }catch(e){ toast(url); } }
"""

EDITS = [
 ("</style>", CSS + "</style>"),
 ("/* ========================= UX: theme, onboarding, checklist, rest timer =========================", JS + "\n/* ========================= UX: theme, onboarding, checklist, rest timer ========================="),
 # meta for sharing previews
 ("<title>סטים</title>",
  "<title>סטים</title>\n<meta name=\"description\" content=\"יומן אימונים בעברית: מעקב סטים, משקלים והתקדמות, 701 תרגילים עם תמונות, תוכנית שבועית, מחשבון קלוריות ומדריכים.\">\n<meta property=\"og:title\" content=\"סטים · יומן האימונים שלך\">\n<meta property=\"og:description\" content=\"רושמים סטים, רואים התקדמות. 701 תרגילים, תוכנית שבועית, מחשבון קלוריות ומדריכים. חינם.\">\n<meta property=\"og:type\" content=\"website\">\n<meta property=\"og:url\" content=\"https://getonekeyai.com/\">\n<meta property=\"og:image\" content=\"https://getonekeyai.com/icons/og.png\">\n<meta property=\"og:image:width\" content=\"1200\">\n<meta property=\"og:image:height\" content=\"630\">\n<meta property=\"og:locale\" content=\"he_IL\">\n<meta name=\"twitter:card\" content=\"summary_large_image\">"),
 # state
 ("deck:{machines:[],stars:[],custom:[]}, logs:{}, yt:{}, today:{d:'',plan:[],done:{}}, loaded:false,storageMode:'local'};",
  "deck:{machines:[],stars:[],custom:[]}, week:{days:{}}, logs:{}, yt:{}, today:{d:'',plan:[],done:{},targets:{}}, loaded:false,storageMode:'local'};"),
 ("  else if(key==='yt') S.yt=data.map||{};",
  "  else if(key==='yt') S.yt=data.map||{};\n  else if(key==='week') S.week={days:{},...data};"),
 ("if(/^gt:(profile|deck|yt|log-.+|today-.+)$/.test(k)) local.push(k.slice(3));",
  "if(/^gt:(profile|deck|yt|week|log-.+|today-.+)$/.test(k)) local.push(k.slice(3));"),
 # tabs: planner replaces plans tab
 ("const TABS=[['home','היום','home'],['library','ספרייה','lib'],['plans','תוכניות','plan'],['guides','מדריכים','book'],['profile','פרופיל','user']];",
  "const TABS=[['home','היום','home'],['library','ספרייה','lib'],['week','השבוע','cal'],['guides','מדריכים','book'],['profile','פרופיל','user']];"),
 ("function activeTab(){ const m={ex:'library',group:'library',machine:'library',gym:'library',read:'guides',calories:'profile',progress:'profile',install:'profile'};",
  "function activeTab(){ const m={ex:'library',group:'library',machine:'library',gym:'library',read:'guides',calories:'profile',progress:'profile',install:'profile',plans:'week'};"),
 ("const pages={home,library,group:groupPage,ex:exPage,gym,machine:machinePage,plans,guides,read:readPage,profile,calories,progress,install};",
  "const pages={home,library,group:groupPage,ex:exPage,gym,machine:machinePage,plans,week,guides,read:readPage,profile,calories,progress,install};"),
 # startPlan with targets
 ("function startPlan(ids){ S.today={d:todayKey(),plan:ids,done:{}}; save('today-'+todayKey(),S.today); haptic(12); go('#home'); toast('האימון נפתח. בהצלחה!'); }",
  "function startPlan(ids,targets){ S.today={d:todayKey(),plan:ids,done:{},targets:targets||{}}; save('today-'+todayKey(),S.today); haptic(12); go('#home'); toast('האימון נפתח. בהצלחה!'); }"),
 # home: today's workout from the weekly plan when nothing started yet
 ("  } else { const rec=recommendToday(); wrap.append(h('div',{class:'card'},h('div',{class:'b',style:'font-size:17px'},rec.title),",
  "  } else if(todayFromWeek()){ const tw=todayFromWeek(); if(tw.rest){ wrap.append(h('div',{class:'card'},h('div',{class:'row'},ic('heart'),h('div',{class:'grow'},h('div',{class:'k'},'יום מנוחה לפי התוכנית השבועית'),h('div',{class:'small muted'},'רוצה בכל זאת? פתח/י תרגיל מהספרייה או שנה/י את השבוע.')),h('button',{class:'btn sm sec2',onclick:()=>go('#week')},'השבוע')))); } else { wrap.append(h('div',{class:'card glow'},h('div',{class:'row between'},h('div',{class:'k',style:'font-size:17px'},tw.label||'האימון של היום'),h('button',{class:'chip',onclick:()=>go('#week')},'ערוך')),h('div',{class:'small muted',style:'margin:4px 0 10px'},`מהתוכנית השבועית · ${tw.ids.length} תרגילים${tw.groups.length?' · '+tw.groups.map(g=>GROUPS[g]).join(', '):''}`),h('div',{class:'list',style:'box-shadow:none'},...tw.ids.map(id=>{ const e=getEx(id); return e?exItem(e,{sub:`${tw.targets[id].sets} סטים × ${tw.targets[id].reps} חזרות`}):null; })),h('button',{class:'btn',style:'margin-top:10px',onclick:()=>startPlan(tw.ids,tw.targets)},'התחל את האימון'))); }\n  } else { const rec=recommendToday(); wrap.append(h('div',{class:'card'},h('div',{class:'b',style:'font-size:17px'},rec.title),"),
 # exercise page: targets from today's plan when no previous session; first-session line
 ("let sets = isToday ? last.sets.map(x=>({...x})) : (prev ? prev.sets.map(x=>({r:x.r,w:x.w,t:false})) : [{r:10,w:e.bw?0:20,t:false},{r:10,w:e.bw?0:20,t:false},{r:10,w:e.bw?0:20,t:false}]);",
  "const tgt=(S.today.d===todayKey()&&S.today.targets&&S.today.targets[e.id])||null;\n  let sets = isToday ? last.sets.map(x=>({...x})) : (prev ? prev.sets.map(x=>({r:x.r,w:x.w,t:false})) : Array.from({length:tgt?tgt.sets:3},()=>({r:tgt?tgt.reps:10,w:e.bw?0:20,t:false})));"),
 ("h('div',{class:'xs muted b'},isToday?'נשמר אוטומטית':(prev?`על בסיס ${fmtDate(prev.d)}`:'אימון ראשון'))),",
  "h('div',{class:'xs muted b'},(tgt?`יעד ${tgt.sets}×${tgt.reps} · `:'')+(isToday?'נשמר אוטומטית':(prev?`על בסיס ${fmtDate(prev.d)}`:'אימון ראשון')))),"),
 ("c.append(h('div',{class:'sec',style:'margin:14px 0 6px'},h('h2',{},'היסטוריה')),hist); wrap.append(c); }",
  "const fs0=sessions[0]; if(sessions.length>=2){ const fw=Math.max(...fs0.sets.map(x=>+x.w||0)), lw=Math.max(...sessions[sessions.length-1].sets.map(x=>+x.w||0)); c.append(h('div',{class:'banner good',style:'margin:12px 0 0;align-items:center'},ic('trend'),h('span',{class:'grow'},`התחלת ב-${fmtDate(fs0.d)} עם ${fmtW(fw)} ק״ג. היום ${fmtW(lw)} ק״ג${fw?` (${lw>=fw?'+':''}${Math.round((lw-fw)/fw*100)}%)`:''}, אחרי ${sessions.length} אימונים.`))); }\n    c.append(h('div',{class:'sec',style:'margin:14px 0 6px'},h('h2',{},'היסטוריה')),hist); wrap.append(c); }"),
 # progress: since you started
 ("  const prList=Object.keys(S.logs).map(id=>({id,b:bestSet(id)})).filter(x=>x.b&&x.b.w>0).sort((a,b)=>b.b.d.localeCompare(a.b.d)).slice(0,12);",
  "  const since=sinceStart(); if(since.length){ wrap.append(h('div',{class:'sec'},h('h2',{},'מאז שהתחלת'))); const c2=h('div',{class:'list'}); since.slice(0,12).forEach(r=>{ const e=getEx(r.id); if(e) c2.append(exItem(e,{sub:`${fmtDate(r.firstD)}: ${fmtW(r.fw)} ק״ג ← היום ${fmtW(r.lw)} ק״ג · ${r.n} אימונים`,right:h('span',{class:'delta '+(r.p>=0?'up':'dn'),html:I(r.p>=0?'trend':'down')+`<span>${r.p>=0?'+':'−'}${Math.abs(Math.round(r.p))}%</span>`})})); }); wrap.append(c2); }\n  const prList=Object.keys(S.logs).map(id=>({id,b:bestSet(id)})).filter(x=>x.b&&x.b.w>0).sort((a,b)=>b.b.d.localeCompare(a.b.d)).slice(0,12);"),
 # profile: share button uses Web Share + the domain; link list gets the planner
 ("h('button',{class:'btn sec2',html:I('copy')+'<span>העתק קישור</span>',onclick:async()=>{ try{ await navigator.clipboard.writeText(location.href.split('#')[0]); toast('הקישור הועתק'); }catch(e){ toast('לא ניתן להעתיק כאן. העתק/י משורת הכתובת.'); } }})));",
  "h('div',{class:'row',style:'gap:8px'},h('button',{class:'btn',html:I('share')+'<span>שתף עם חברים</span>',onclick:shareApp}),h('button',{class:'btn sec2',style:'width:auto;padding-inline:14px',html:I('copy'),'aria-label':'העתק קישור',onclick:async()=>{ try{ await navigator.clipboard.writeText('https://getonekeyai.com/'); toast('הקישור הועתק'); }catch(e){ toast('getonekeyai.com'); } }}))));"),
 ("[['onboarding','הסבר קצר על האפליקציה','info'],['progress','התקדמות מלאה','trend'],",
  "[['week','התוכנית השבועית שלי','cal'],['onboarding','הסבר קצר על האפליקציה','info'],['progress','התקדמות מלאה','trend'],"),
 # install page: domain link, QR, share
 ("  wrap.append(h('button',{class:'btn sec2',html:I('copy')+'<span>העתק קישור</span>',onclick:async()=>{ try{ await navigator.clipboard.writeText(location.href.split('#')[0]); toast('הקישור הועתק'); }catch(e){ toast('העתק/י משורת הכתובת'); } }}));\n  return wrap;",
  "  wrap.append(h('div',{class:'card',style:'text-align:center'},h('div',{class:'k'},'getonekeyai.com'),h('div',{class:'small muted'},'סרוק/י עם המצלמה כדי לפתוח בטלפון אחר'),h('div',{class:'qr'},h('img',{src:'icons/qr.png',alt:'QR של getonekeyai.com'})),h('div',{class:'row',style:'gap:8px'},h('button',{class:'btn',html:I('share')+'<span>שתף</span>',onclick:shareApp}),h('button',{class:'btn sec2',style:'width:auto;padding-inline:14px',html:I('copy'),'aria-label':'העתק קישור',onclick:async()=>{ try{ await navigator.clipboard.writeText('https://getonekeyai.com/'); toast('הקישור הועתק'); }catch(e){ toast('getonekeyai.com'); } }}))));\n  return wrap;"),
 # onboarding slide 3 mentions the weekly planner
 ("{t:'תוכניות שמתחדשות',p:'בכל יום מחכה אימון מומלץ שמדלג על השרירים שעבדו אתמול. סימון ✓ על סט מפעיל טיימר מנוחה, ובסוף כל תרגיל יש כפתור לתרגיל הבא.',",
  "{t:'השבוע שלך, כמו שאתה רוצה',p:'שבעה ימים, ואתה קובע: איזה יום רגליים, איזה דחיפה, אילו תרגילים, כמה סטים וחזרות. אפשר למלא אוטומטית לפי תוכנית ולשנות הכול. סימון ✓ על סט מפעיל טיימר מנוחה.',"),
 # checklist step: plan the week
 ("{t:'אימון ראשון: תרגיל אחד עם ✓',done:allSessions().length>0,go:()=>go('#library')}];",
  "{t:'תוכנית שבועית: לפחות יום אחד',done:[0,1,2,3,4,5,6].some(i=>S.week.days[i]&&((S.week.days[i].ex||[]).length||S.week.days[i].rest)),go:()=>go('#week')},{t:'אימון ראשון: תרגיל אחד עם ✓',done:allSessions().length>0,go:()=>go('#library')}];"),
]
for p in ('index.template.html', 'index.html'):
    s = open(p, encoding='utf-8').read()
    for a, b in EDITS:
        assert s.count(a) == 1, (p, s.count(a), a[:90])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
print('week edits ok')
