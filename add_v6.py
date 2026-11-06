# -*- coding: utf-8 -*-
"""v6: back/close everywhere, remove-with-undo on every exercise, calisthenics & outdoor (minutes/km logging),
day flow (day type -> choose exercises, two-muscle combos), saved routines and rotation detection (ABC)."""
import re

CSS = r"""
.sheet .close{position:absolute;top:10px;inset-inline-start:12px;width:32px;height:32px;border-radius:50%;background:var(--card2);color:var(--ink2);display:grid;place-items:center;z-index:2}
.sheet .close svg.i{width:16px;height:16px;stroke-width:2.4}
.toast span{pointer-events:auto;display:inline-flex;align-items:center;gap:12px}
.toast span button{color:var(--accent2);font-weight:900}
.rowx{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:var(--ink3);flex:none;margin-inline-start:-4px}
.rowx svg.i{width:15px;height:15px;stroke-width:2.4}
.rowx:active{color:var(--bad)}
.sugg{background:linear-gradient(160deg,var(--card3),var(--card) 70%);border:1px solid var(--line2);border-radius:var(--r);padding:16px;margin-bottom:12px;box-shadow:var(--shadow)}
.sugg .k{font-size:17px}
.typegrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.typebtn{background:var(--card2);border:1px solid var(--line);border-radius:14px;padding:12px;font-weight:800;font-size:14px;text-align:start;display:flex;align-items:center;gap:8px}
.typebtn svg.i{width:18px;height:18px;color:var(--accent)}
.typebtn.on{border-color:var(--accent);background:var(--accent-soft)}
.pickchips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:8px 0 0;padding-bottom:4px}
.pickchips::-webkit-scrollbar{display:none}
"""

HELPERS = r"""
/* ========================= v6: outdoor, routines, rotation ========================= */
const EXTRA_EX=[
 ['x-swimming','שחייה','Swimming','שחייה בבריכה או בים. רושמים דקות ומרחק.'],['x-hiking','הליכה בטבע / טיול','Hiking','הליכה בשטח עם עליות. רושמים דקות ומרחק.'],
 ['x-sprints','ספרינטים','Sprint intervals','ריצות קצרות במלוא הכוח עם מנוחה בין לבין.'],['x-stairs','עליית מדרגות בחוץ','Stair running','מדרגות בבניין, באצטדיון או בפארק.'],
 ['x-bike-outdoor','רכיבה על אופניים בחוץ','Outdoor cycling','רכיבת כביש או שטח. רושמים דקות וק״מ.'],['x-football','כדורגל','Football','משחק כדורגל, מגרש או חוף.'],
 ['x-basketball','כדורסל','Basketball','משחק כדורסל.'],['x-tennis','טניס / פאדל','Tennis / Padel','משחק טניס או פאדל.'],['x-boxing','אגרוף / שק','Boxing','אימון שק או ספארינג.'],
 ['x-yoga','יוגה / פילאטיס','Yoga / Pilates','שיעור או תרגול עצמאי.'],['x-walk-dog','הליכה מהירה','Brisk walk','הליכה בקצב מהיר, 30 דקות ומעלה.'],['x-park','אימון פארק','Park workout','מתח, מקבילים ומשקל גוף במתקני הפארק.'],
].map(([id,he,en,dhe])=>({id,he,en,dhe,den:'',cat:'cardio',g:'cardio',bp:'full_body',eq:'none',pm:[],sm:[],mech:null,diff:null,force:null,uni:false,bw:true,ins:[],tips:[],goals:[],tags:[],vg:'',img:{}}));
const CALIS_EQ=new Set(['none','pull_up_bar','dip_station','rings','suspension_trainer','plyo_box','jump_rope']);
const isCalis=e=>!e.custom&&(e.bw||CALIS_EQ.has(e.eq))&&e.cat!=='stretching'&&e.g!=='cardio';
const isCardio=e=>!!e&&(e.g==='cardio'||e.cat==='cardio');
const volOf=s=>s.cardio?0:volume(s.sets);
function setStr(sets,e){ const ss=sets.filter(x=>x.r>0||x.w>0); if(!ss.length) return ''; if(isCardio(e)) return ss.map(x=>`${x.r} דק׳${x.w?' · '+fmtW(x.w)+' ק״מ':''}`).join(' | '); return ss.map(x=>`${fmtW(x.w)}×${x.r}`).join(' · '); }
function toastUndo(text,undo){ const el=$('#toastTx'); el.replaceChildren(h('span',{},text),h('button',{onclick:()=>{ el.classList.remove('on'); undo(); }},'בטל')); el.classList.add('on'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('on'),4000); }
function saveRoutines(){ save('routines',S.routines); }
function recordDay(){ const i=new Date(todayKey()).getDay(); const d=wkDay(i); const rec={label:d.rest?'':(d.label||''),routine:d.routine||'',ids:todayList()}; const cur=S.days.map[todayKey()]; if(JSON.stringify(cur)===JSON.stringify(rec)) return; S.days.map[todayKey()]=rec; const keys=Object.keys(S.days.map).sort(); if(keys.length>400) keys.slice(0,keys.length-400).forEach(k=>delete S.days.map[k]); clearTimeout(recordDay.t); recordDay.t=setTimeout(()=>save('days',S.days),800); }
function workoutOnDate(dt){ const rec=S.days.map[dt]; if(!rec) return null; const ex=rec.ids.map(id=>{ const s=(S.logs[id]?.sessions||[]).find(x=>x.d===dt); return {id,sets:s?Math.max(1,s.sets.length):3,reps:s?(+s.sets[0].r||10):10}; }).filter(x=>getEx(x.id)); return ex.length?{label:rec.label,routine:rec.routine,ex,date:dt}:null; }
function suggestNext(){
  const today=todayKey(); const dates=Object.keys(S.days.map).filter(d=>d<today&&S.days.map[d].ids.length).sort(); if(!dates.length) return null;
  const recent=dates.slice(-21); const last={}; recent.forEach(d=>{ const r=S.days.map[d]; const key=r.routine||r.label||'אימון'; last[key]=d; });
  const keys=Object.keys(last); if(!keys.length) return null;
  const pick=keys.length===1?keys[0]:keys.sort((a,b)=>last[a].localeCompare(last[b]))[0];
  const dt=last[pick]; const w=workoutOnDate(dt); if(!w) return null; const routine=(S.routines.list||[]).find(r=>r.id===w.routine);
  return {label:routine?routine.name:(w.label||'האימון הקודם'),routine,ex:routine?routine.ex.map(x=>({...x})):w.ex,date:dt,cycle:keys.length};
}
function applyToDay(i,{label,groups,ex,routine}){ const d=wkDay(i); d.rest=false; d.label=label||d.label; if(groups) d.groups=[...groups]; d.ex=ex.map(x=>({id:x.id,sets:x.sets||3,reps:x.reps||10})); d.routine=routine||''; saveWeek(); }
function groupsOf(ids){ const g=[]; ids.forEach(id=>{ const e=getEx(id); if(e&&e.g!=='full'&&!g.includes(e.g)) g.push(e.g); }); return g; }
function dayTypeSheet(i){
  const d=wkDay(i); const body=h('div'); body.append(h('h2',{},`איזה יום זה יום ${DAY_NAMES[i]}?`));
  const routines=S.routines.list||[];
  if(routines.length){ body.append(h('div',{class:'xs b muted',style:'margin:0 0 6px;letter-spacing:.04em'},'האימונים הקבועים שלי')); const l=h('div',{class:'list'}); routines.forEach(r=>l.append(h('button',{class:'item pressable',onclick:()=>{ applyToDay(i,{label:r.name,groups:r.groups,ex:r.ex,routine:r.id}); Sheet.close(); render(); toast(`${r.name} נכנס ליום ${DAY_NAMES[i]}`); }},h('div',{class:'th',style:'width:40px;height:40px;border-radius:12px;color:var(--accent);background:var(--accent-soft)'},ic('bolt')),h('div',{class:'grow'},h('div',{class:'t ell'},r.name),h('div',{class:'s ell'},`${r.ex.length} תרגילים · ${(r.groups||[]).map(g=>GROUPS[g]).join(', ')}`)),h('span',{class:'chev',html:I('chev')})))); body.append(l); }
  body.append(h('div',{class:'xs b muted',style:'margin:10px 0 6px;letter-spacing:.04em'},'סוג יום'));
  const grid=h('div',{class:'typegrid'}); DAY_PRESETS.filter(p=>!p.rest).forEach(p=>grid.append(h('button',{class:'typebtn pressable',onclick:()=>{ d.rest=false; d.label=p.l; d.groups=[...p.g]; d.routine=''; saveWeek(); Sheet.close(); render(); if(!d.ex.length) setTimeout(()=>addToDaySheet(i),350); }},ic(p.g[0]||'gym'),h('span',{},p.l)))); body.append(grid);
  body.append(h('div',{class:'xs b muted',style:'margin:12px 0 6px;letter-spacing:.04em'},'או שילוב של שרירים (בחר/י אחד או שניים)'));
  let picked=[]; const gg=h('div',{class:'gchips'}); GROUP_ORDER.filter(g=>g!=='stretch').forEach(g=>gg.append(h('button',{class:'gchip',html:I(g)+`<span>${GROUPS[g]}</span>`,onclick:ev=>{ if(picked.includes(g)) picked=picked.filter(x=>x!==g); else { picked.push(g); if(picked.length>2) picked.shift(); } [...gg.children].forEach((c,k)=>c.classList.toggle('on',picked.includes(GROUP_ORDER.filter(x=>x!=='stretch')[k]))); go2.disabled=!picked.length; go2.textContent=picked.length?`המשך: ${picked.map(x=>GROUPS[x]).join(' + ')}`:'בחר/י שרירים'; }}))); body.append(gg);
  const go2=h('button',{class:'btn',style:'margin-top:12px',disabled:true,onclick:()=>{ d.rest=false; d.label=picked.map(x=>GROUPS[x]).join(' + '); d.groups=[...picked]; d.routine=''; saveWeek(); Sheet.close(); render(); if(!d.ex.length) setTimeout(()=>addToDaySheet(i),350); }},'בחר/י שרירים'); body.append(go2);
  body.append(h('button',{class:'btn sec2',style:'margin-top:8px',onclick:()=>{ d.rest=true; d.label='מנוחה'; d.ex=[]; d.routine=''; saveWeek(); Sheet.close(); render(); }},'יום מנוחה'));
  Sheet.show(body);
}
function saveRoutineSheet(i){ const d=wkDay(i); const name=h('input',{type:'text',value:d.label&&d.label!=='אימון'?d.label:groupsOf(d.ex.map(x=>x.id)).map(g=>GROUPS[g]).join(' + '),placeholder:'למשל: חזה וטריצפס'}); Sheet.show(h('div',{},h('h2',{},'שמירה כאימון קבוע'),h('p',{class:'small muted',style:'margin:0 0 10px;line-height:1.5'},'בפעם הבאה תוסיף/י את כל התרגילים האלה בלחיצה אחת, עם הסטים והמשקלים מהפעם האחרונה.'),h('div',{class:'fld'},h('label',{},'שם האימון'),name),h('button',{class:'btn',onclick:()=>{ const nm=name.value.trim()||'אימון קבוע'; const id='r-'+Date.now().toString(36); S.routines.list=S.routines.list||[]; S.routines.list.push({id,name:nm,groups:d.groups.length?[...d.groups]:groupsOf(d.ex.map(x=>x.id)),ex:d.ex.map(x=>({...x})),created:todayKey()}); d.routine=id; d.label=nm; saveRoutines(); saveWeek(); Sheet.close(); render(); toast(`"${nm}" נשמר כאימון קבוע`); }},'שמור'))); }
function updateRoutineFromDay(i){ const d=wkDay(i); const r=(S.routines.list||[]).find(x=>x.id===d.routine); if(!r) return; r.ex=d.ex.map(x=>({...x})); r.groups=d.groups.length?[...d.groups]:groupsOf(d.ex.map(x=>x.id)); saveRoutines(); }
function removeFromDay(i,id){ const d=wkDay(i); const k=d.ex.findIndex(x=>x.id===id); if(k<0) return; const [gone]=d.ex.splice(k,1); saveWeek(); render(); toastUndo(`${getEx(id)?.he||'התרגיל'} הוסר`,()=>{ d.ex.splice(Math.min(k,d.ex.length),0,gone); saveWeek(); render(); }); }
"""

NEW_HOME = r"""function home(){
  header('היום');
  const wrap=h('div'); const today=new Date(todayKey()).getDay(); if(homeDay==null) homeDay=today; const sel=homeDay; const t=new Date(todayKey());
  wrap.append(h('div',{class:'display'},`${DAY_NAMES[today]}, ${t.getDate()} ב${MONTHS[t.getMonth()]}`));
  const cur=weekStats(0), prev=weekStats(1);
  wrap.append(h('div',{class:'wkline'},h('span',{},cur.days?`${cur.days===1?'אימון אחד':cur.days+' אימונים'} השבוע · ${fmtK(cur.vol)} ק״ג`:'עוד לא התאמנת השבוע'),cur.vol&&prev.vol?delta(cur.vol,prev.vol):null,h('button',{class:'lnk',onclick:()=>go('#journal')},'יומן ›')));
  if(STANDALONE&&!PB.user) wrap.append(h('button',{class:'lnkline',onclick:()=>authSheet('login')},ic('cloud'),h('span',{},'התחבר/י כדי לשמור את היומן בחשבון ובכל מכשיר')));
  const strip=h('div',{class:'ds'});
  for(let i=0;i<7;i++){ const d=wkDay(i); const info=dayDoneInfo(i); strip.append(h('button',{class:'dsd pressable'+(i===sel?' on':'')+(i===today?' today':'')+(d.rest?' rest':''),onclick:()=>{ homeDay=i; editMode=false; render(); }},h('span',{class:'l'},DAY_LETTERS[i]),h('i',{class:info.done?'done':(d.ex.length?'plan':'')}))); }
  wrap.append(strip);
  const d=wkDay(sel); const isToday=sel===today; const ids=isToday?todayList():(d.rest?[]:d.ex.map(x=>x.id));
  const title=d.rest?'יום מנוחה':(d.label||(ids.length?'אימון':''));
  if(title) wrap.append(h('div',{class:'dayhdr'},h('div',{class:'grow'},h('div',{class:'k',style:'font-size:20px'},title),d.groups.length&&!d.rest?h('div',{class:'small muted'},d.groups.map(g=>GROUPS[g]).join(' · ')):null),h('button',{class:'iconbtn',html:I('dots'),'aria-label':'אפשרויות היום',onclick:()=>dayMenuMin(sel)})));
  if(d.rest&&!ids.length){ wrap.append(h('div',{class:'restcard'},ic('heart'),h('div',{class:'k'},'מנוחה'),h('div',{class:'small'},'הגוף בונה שריר דווקא עכשיו.')),h('button',{class:'lnkline center',onclick:()=>dayTypeSheet(sel)},'בכל זאת להתאמן היום')); wrap.append(credit()); return wrap; }
  if(!ids.length&&!d.label){
    const sg=suggestNext();
    if(sg){ wrap.append(h('div',{class:'sugg'},h('div',{class:'xs b muted',style:'letter-spacing:.06em;margin-bottom:4px'},sg.cycle>1?`לפי הסבב שלך (${sg.cycle} אימונים)`:'כמו פעם שעברה'),h('div',{class:'k'},`${isToday?'היום':`יום ${DAY_NAMES[sel]}`}: ${sg.label}`),h('div',{class:'small muted',style:'margin:4px 0 12px'},`${sg.ex.length} תרגילים, עם הסטים והמשקלים מ-${fmtDate(sg.date)}`),h('div',{class:'row',style:'gap:8px'},h('button',{class:'btn',onclick:()=>{ applyToDay(sel,{label:sg.label,groups:sg.routine?sg.routine.groups:groupsOf(sg.ex.map(x=>x.id)),ex:sg.ex,routine:sg.routine?sg.routine.id:''}); render(); toast('האימון נכנס. המשקלים מהפעם הקודמת כבר בפנים.'); }},'כן, להוסיף'),h('button',{class:'btn sec2',style:'width:auto;padding-inline:14px',onclick:()=>dayTypeSheet(sel)},'אחר')))); }
    else wrap.append(h('div',{class:'row',style:'gap:8px;margin-bottom:10px'},h('button',{class:'btn',onclick:()=>dayTypeSheet(sel)},'בחר סוג יום'),h('button',{class:'btn sec2',style:'width:auto;padding-inline:14px',html:I('plus')+'<span>תרגיל</span>',onclick:()=>addToDaySheet(sel)})));
    if(sg) wrap.append(h('div',{class:'row',style:'gap:8px;margin-bottom:10px'},h('button',{class:'btn sec2',onclick:()=>dayTypeSheet(sel)},'בחר סוג יום'),h('button',{class:'btn sec2',style:'width:auto;padding-inline:14px',html:I('plus')+'<span>תרגיל</span>',onclick:()=>addToDaySheet(sel)})));
    wrap.append(h('button',{class:'lnkline center',onclick:()=>confirmSheet('למלא את כל השבוע אוטומטית?',`לפי תוכנית "${(PROGRAMS.find(p=>p.id===(S.profile.program||'full'))||PROGRAMS[0]).name}" ו-${S.profile.weekly||3} אימונים בשבוע. אפשר לשנות הכול אחר כך.`,()=>{ autoFillWeek(); render(); },'כן, מלא')},'או מלא את כל השבוע אוטומטית לפי תוכנית'));
    wrap.append(credit()); return wrap;
  }
  const list=h('div',{class:'list'});
  ids.forEach(id=>{ const e=getEx(id); if(!e) return; const [dn,tot]=isToday?setsDoneToday(id):[0,0]; const tg=d.ex.find(x=>x.id===id); const prevS=(S.logs[id]?.sessions||[]).slice().reverse().find(s=>s.d!==todayKey()&&s.sets.some(x=>x.w>0||x.r>0));
    let right; if(editMode&&tg){ right=h('div',{class:'row',style:'gap:2px'},h('button',{class:'iconbtn sm',html:I('chevd'),style:'transform:rotate(180deg)',onclick:ev=>{ ev.stopPropagation(); const k=d.ex.indexOf(tg); if(k>0){ [d.ex[k-1],d.ex[k]]=[d.ex[k],d.ex[k-1]]; saveWeek(); render(); } }}),h('button',{class:'iconbtn sm',html:I('chevd'),onclick:ev=>{ ev.stopPropagation(); const k=d.ex.indexOf(tg); if(k<d.ex.length-1){ [d.ex[k+1],d.ex[k]]=[d.ex[k],d.ex[k+1]]; saveWeek(); render(); } }})); }
    else right=h('div',{class:'row',style:'gap:4px'},h('span',{class:'prog'+(isToday&&tot&&dn===tot?' done':'')},isToday&&tot?`${dn}/${tot}`:(tg?`${tg.sets}×${tg.reps}`:''),isToday&&tot&&dn===tot?ic('check'):null),tg?h('button',{class:'rowx','aria-label':'הסר תרגיל',html:I('minus'),onclick:ev=>{ ev.stopPropagation(); removeFromDay(sel,id); }}):null);
    const sub=prevS?`פעם שעברה ${setStr(prevS.sets,e)}`:(MUSCLE[e.pm?.[0]]||GROUPS[e.g]);
    list.append(exItem(e,{sub,right,onclick:()=>{ if(!editMode) go('#ex-'+id); }})); });
  if(!ids.length) list.append(h('div',{class:'empty'},ic('gym'),h('div',{},'עוד אין תרגילים. בחר/י תרגילים ליום הזה.')));
  wrap.append(list);
  if(editMode) wrap.append(h('button',{class:'btn sec2',onclick:()=>{ editMode=false; render(); }},'סיימתי לסדר'));
  else wrap.append(h('button',{class:ids.length?'btn ghost':'btn',html:I('plus')+`<span>${ids.length?'תרגיל':'בחר תרגילים'}</span>`,onclick:()=>addToDaySheet(sel)}));
  wrap.append(credit()); return wrap;
}
"""

NEW_DAYMENU = r"""function dayMenuMin(i){
  const d=wkDay(i); const body=h('div'); body.append(h('h2',{},`יום ${DAY_NAMES[i]}`));
  const lbl=h('input',{type:'text',value:d.rest?'':d.label,placeholder:'שם, למשל "רגליים" או "דחיפה"'}); lbl.addEventListener('change',()=>{ d.label=lbl.value.trim(); if(d.label) d.rest=false; saveWeek(); render(); });
  body.append(h('div',{class:'fld'},h('label',{},'שם היום'),lbl));
  const r=(S.routines.list||[]).find(x=>x.id===d.routine);
  const list=h('div',{class:'list'});
  const item=(icn,t,s,onclick,danger)=>h('button',{class:'item pressable',style:danger?'color:var(--bad)':'',onclick},h('div',{class:'th',style:'width:40px;height:40px;border-radius:12px;color:'+(danger?'var(--bad)':'var(--accent)')+';background:'+(danger?'rgba(248,113,113,.12)':'var(--accent-soft)')},ic(icn)),h('div',{class:'grow'},h('div',{class:'t'},t),s?h('div',{class:'s'},s):null),ic('chev'));
  list.append(item('plan','שנה סוג יום','חזה, גב, רגליים, שילוב של שניים, מנוחה',()=>{ Sheet.close(); setTimeout(()=>dayTypeSheet(i),300); }));
  if(d.ex.length){ if(r) list.append(item('bolt',`עדכן את "${r.name}"`,'שמור את הרשימה הנוכחית כאימון הקבוע',()=>{ updateRoutineFromDay(i); Sheet.close(); toast('האימון הקבוע עודכן'); })); else list.append(item('bolt','שמור כאימון קבוע','כדי להוסיף אותו בלחיצה אחת בפעם הבאה',()=>{ Sheet.close(); setTimeout(()=>saveRoutineSheet(i),300); })); list.append(item('shuffle','סדר תרגילים','',()=>{ editMode=true; Sheet.close(); render(); })); }
  if(r) list.append(item('trash',`הסר את "${r.name}" מהאימונים הקבועים`,'',()=>{ S.routines.list=S.routines.list.filter(x=>x.id!==r.id); d.routine=''; saveRoutines(); saveWeek(); Sheet.close(); render(); },true));
  list.append(item('shuffle','מלא את כל השבוע אוטומטית','לפי התוכנית והיעד השבועי',()=>{ Sheet.close(); confirmSheet('למלא את כל השבוע מחדש?','שבעת הימים יוחלפו לפי התוכנית והיעד השבועי שבפרופיל.',()=>{ autoFillWeek(); render(); },'כן, מלא'); }));
  list.append(item('trash','נקה את היום','',()=>{ S.week.days[i]={label:'',groups:[],ex:[],rest:false}; saveWeek(); Sheet.close(); render(); },true));
  body.append(list);
  const copyTo=h('div',{class:'gchips'}); for(let j=0;j<7;j++){ if(j===i) continue; copyTo.append(h('button',{class:'gchip',onclick:()=>{ S.week.days[j]=JSON.parse(JSON.stringify(d)); saveWeek(); Sheet.close(); toast(`הועתק ליום ${DAY_NAMES[j]}`); render(); }},DAY_LETTERS[j])); }
  body.append(h('div',{class:'xs b muted',style:'margin:14px 0 6px;letter-spacing:.04em'},'העתק את היום הזה אל'),copyTo);
  Sheet.show(body,()=>render());
}
"""

NEW_PICKER = r"""function addToDaySheet(i){
  const d=wkDay(i); const body=h('div'); let mode=d.groups.length?'day':'mine';
  const inp=h('input',{type:'search',placeholder:'חיפוש תרגיל…'}); const res=h('div',{class:'list',style:'margin-top:10px;max-height:50vh;overflow:auto'});
  const stars=new Set(S.deck.stars||[]); const mids=new Set(S.deck.machines||[]); const fromM=new Set(); MACHINES.filter(m=>mids.has(m.id)).forEach(m=>m.ex.forEach(x=>fromM.add(x)));
  const MODES=[['day','שרירי היום'],['mine','שלי'],['calis','קליסטניקס'],['out','קרדיו ובחוץ'],['all','הכל']].filter(([k])=>k!=='day'||d.groups.length);
  const chips=h('div',{class:'pickchips'}); const paintChips=()=>{ chips.replaceChildren(...MODES.map(([k,l])=>h('button',{class:'chip'+(mode===k?' on':''),onclick:()=>{ mode=k; paintChips(); draw(); }},l))); };
  function draw(){ res.replaceChildren(); const qq=inp.value.trim().toLowerCase(); let items=allEx().filter(e=>!d.ex.some(x=>x.id===e.id));
    if(qq.length>=2) items=items.filter(e=>(e.he||'').toLowerCase().includes(qq)||(e.en||'').toLowerCase().includes(qq));
    else if(mode==='day') items=items.filter(e=>d.groups.includes(e.g)); else if(mode==='mine') items=items.filter(e=>stars.has(e.id)||fromM.has(e.id)||lastSession(e.id)||e.custom); else if(mode==='calis') items=items.filter(isCalis); else if(mode==='out') items=items.filter(isCardio);
    const score=e=>(stars.has(e.id)?4:0)+(lastSession(e.id)?3:0)+(fromM.has(e.id)?2:0)+(e.mech==='compound'?1:0); items=items.sort((a,b)=>score(b)-score(a)).slice(0,60);
    if(!items.length) res.append(h('div',{class:'empty'},mode==='mine'?'עוד אין תרגילים משלך. נסה/י "הכל" או חיפוש.':'לא נמצא. נסה/י חיפוש אחר.'));
    items.forEach(e=>res.append(exItem(e,{sub:(MUSCLE[e.pm?.[0]]||GROUPS[e.g])+(e.eq&&e.eq!=='custom'&&e.eq!=='none'?' · '+(EQ[e.eq]||''):''),right:h('span',{class:'chip acc'},'הוסף'),onclick:()=>{ d.rest=false; d.ex.push({id:e.id,sets:isCardio(e)?1:3,reps:isCardio(e)?30:repsForGoal()}); if(!d.groups.includes(e.g)&&e.g!=='full') d.groups.push(e.g); if(d.routine) updateRoutineFromDay(i); saveWeek(); toast(`${e.he} נוסף`); haptic(8); draw(); }}))); }
  inp.addEventListener('input',draw); paintChips();
  body.append(h('h2',{},d.label&&!d.rest?`תרגילים ל${d.label}`:`תרגילים ליום ${DAY_NAMES[i]}`),h('div',{class:'search',style:'margin:0'},ic('target'),inp),chips,res,h('button',{class:'btn',style:'margin-top:10px',onclick:()=>{ Sheet.close(); render(); }},'סיימתי'));
  Sheet.show(body,()=>render()); draw();
}
"""

NEW_EXPAGE_PARTS = [
 # cardio-aware header labels and steppers
 ("h('div',{class:'hd'},h('span',{},''),h('span',{},'ק״ג'),h('span',{},'חזרות'),h('span',{},'')));",
  "h('div',{class:'hd'},h('span',{},''),h('span',{},cardio?'ק״מ':'ק״ג'),h('span',{},cardio?'דקות':'חזרות'),h('span',{},'')));"),
 ("const last=lastSession(e.id); const isToday=last&&last.d===todayKey();\n  const prev=isToday?(S.logs[e.id].sessions[S.logs[e.id].sessions.length-2]||null):last;\n  const tgt=targetsFor(e.id);",
  "const cardio=isCardio(e); const last=lastSession(e.id); const isToday=last&&last.d===todayKey();\n  const prev=isToday?(S.logs[e.id].sessions[S.logs[e.id].sessions.length-2]||null):last;\n  const tgt=targetsFor(e.id);"),
 ("Array.from({length:tgt?tgt.sets:3},()=>({r:tgt?tgt.reps:10,w:e.bw?0:20,t:false})));",
  "Array.from({length:cardio?1:(tgt?tgt.sets:3)},()=>({r:cardio?(tgt?tgt.reps:30):(tgt?tgt.reps:10),w:cardio?0:(e.bw?0:20),t:false})));"),
 ("h('div',{class:'xs muted b'},prev?`פעם שעברה ${prev.sets.map(x=>`${fmtW(x.w)}×${x.r}`).join(' · ')}`:(tgt?`יעד ${tgt.sets}×${tgt.reps}`:'פעם ראשונה'))),",
  "h('div',{class:'xs muted b'},prev?`פעם שעברה ${setStr(prev.sets,e)}`:(tgt?(cardio?`יעד ${tgt.reps} דק׳`:`יעד ${tgt.sets}×${tgt.reps}`):'פעם ראשונה'))),"),
 ("const parts=[]; if(dw) parts.push(`<span class=\"${dw>0?'up':'dn'}\">${dw>0?'▲':'▼'} ${Math.abs(dw)} ק״ג</span>`); if(dr) parts.push(`<span class=\"${dr>0?'up':'dn'}\">${dr>0?'▲':'▼'} ${Math.abs(dr)} חז׳</span>`); return parts.join(' · '); };",
  "const parts=[]; if(dw) parts.push(`<span class=\"${dw>0?'up':'dn'}\">${dw>0?'▲':'▼'} ${Math.abs(Math.round(dw*10)/10)} ${cardio?'ק״מ':'ק״ג'}</span>`); if(dr) parts.push(`<span class=\"${dr>0?'up':'dn'}\">${dr>0?'▲':'▼'} ${Math.abs(dr)} ${cardio?'דק׳':'חז׳'}</span>`); return parts.join(' · '); };"),
 ("stepper(s.w,2.5,v=>{ s.w=v; cmp.innerHTML=cmpTxt(i); persist(); }),stepper(s.r,1,v=>{ s.r=v; cmp.innerHTML=cmpTxt(i); persist(); }),",
  "stepper(s.w,cardio?0.5:2.5,v=>{ s.w=v; cmp.innerHTML=cmpTxt(i); persist(); }),stepper(s.r,cardio?5:1,v=>{ s.r=v; cmp.innerHTML=cmpTxt(i); persist(); }),"),
 ("S.logs[e.id]=l; clearTimeout(persist.t); persist.t=setTimeout(()=>save('log-'+e.id,l),500); }",
  "S.logs[e.id]=l; clearTimeout(persist.t); persist.t=setTimeout(()=>save('log-'+e.id,l),500); recordDay(); }"),
 ("hist.append(h('div',{class:'h'},h('span',{class:'muted'},fmtDate(s.d)),h('span',{class:'setline'},s.sets.map(x=>`${fmtW(x.w)}×${x.r}`).join(' · '))))",
  "hist.append(h('div',{class:'h'},h('span',{class:'muted'},fmtDate(s.d)),h('span',{class:'setline'},setStr(s.sets,e))))"),
 ("!todayList().includes(e.id)?h('button',{class:'btn sm sec2',onclick:()=>{ const i=new Date(todayKey()).getDay(); const d=wkDay(i); d.rest=false; d.ex.push({id:e.id,sets:3,reps:repsForGoal()}); saveWeek(); toast('נוסף להיום'); render(); }},'הוסף להיום'):null));",
  "!todayList().includes(e.id)?h('button',{class:'btn sm sec2',onclick:()=>{ const i=new Date(todayKey()).getDay(); const d=wkDay(i); d.rest=false; d.ex.push({id:e.id,sets:cardio?1:3,reps:cardio?30:repsForGoal()}); saveWeek(); toast('נוסף להיום'); render(); }},'הוסף להיום'):(wkDay(new Date(todayKey()).getDay()).ex.some(x=>x.id===e.id)?h('button',{class:'btn sm danger',onclick:()=>{ removeFromDay(new Date(todayKey()).getDay(),e.id); go('#home'); }},'הסר מהיום'):null)));"),
 # sets card 'since you started' uses weights only for non-cardio
 ("const fs0=sessions[0]; if(sessions.length>=2){",
  "const fs0=sessions[0]; if(sessions.length>=2&&!cardio){"),
]

EDITS = [
 ("</style>", CSS + "</style>"),
 ("/* ========================= MINIMAL: today list, day menu, journal, more =========================", HELPERS + "\n/* ========================= MINIMAL: today list, day menu, journal, more ========================="),
 # state + sync
 ("deck:{machines:[],stars:[],custom:[]}, week:{days:{}}, logs:{}, yt:{},",
  "deck:{machines:[],stars:[],custom:[]}, week:{days:{}}, routines:{list:[]}, days:{map:{}}, logs:{}, yt:{},"),
 ("  else if(key==='week') S.week={days:{},...data};",
  "  else if(key==='week') S.week={days:{},...data};\n  else if(key==='routines') S.routines={list:[],...data};\n  else if(key==='days') S.days={map:{},...data};"),
 ("if(/^gt:(profile|deck|yt|week|log-.+|today-.+)$/.test(k)) local.push(k.slice(3));",
  "if(/^gt:(profile|deck|yt|week|routines|days|log-.+|today-.+)$/.test(k)) local.push(k.slice(3));"),
 # sheet close button
 ("  show(content,onClose){ this.body.replaceChildren(content); this.body.scrollTop=0;",
  "  show(content,onClose){ this.body.replaceChildren(h('button',{class:'close','aria-label':'סגור',html:I('plus'),style:'transform:rotate(45deg)',onclick:()=>this.close()}),content); this.body.scrollTop=0;"),
 # toast resets to text mode
 ("function toast(t){ const el=$('#toastTx'); el.textContent=t;", "function toast(t){ const el=$('#toastTx'); el.replaceChildren(); el.textContent=t;"),
 # extra exercises at boot + sessions flagged cardio
 ("S.ex=await res.json(); S.ex.forEach(e=>S.byId[e.id]=e);", "S.ex=(await res.json()).concat(EXTRA_EX); S.ex.forEach(e=>S.byId[e.id]=e);"),
 ("function allSessions(){ const out=[]; Object.entries(S.logs).forEach(([id,l])=>(l.sessions||[]).forEach(s=>{ if(s.sets.some(x=>x.w>0||x.r>0)) out.push({id,...s}); })); return out; }",
  "function allSessions(){ const out=[]; Object.entries(S.logs).forEach(([id,l])=>{ const cardio=isCardio(getEx(id)); (l.sessions||[]).forEach(s=>{ if(s.sets.some(x=>x.w>0||x.r>0)) out.push({id,cardio,...s}); }); }); return out; }"),
 # journal: cardio-aware set strings + plural
 ("list.append(exItem(e,{sub:s.sets.filter(x=>x.r>0||x.w>0).map(x=>`${fmtW(x.w)}×${x.r}`).join(' · '),",
  "list.append(exItem(e,{sub:setStr(s.sets,e),"),
 # library: calisthenics category + outdoor label
 ("const GROUPS = {chest:'חזה',back:'גב',shoulders:'כתפיים',arms:'ידיים',legs:'רגליים',glutes:'ישבן',core:'בטן וליבה',cardio:'קרדיו',stretch:'מתיחות וגמישות',full:'כל הגוף'};",
  "const GROUPS = {chest:'חזה',back:'גב',shoulders:'כתפיים',arms:'ידיים',legs:'רגליים',glutes:'ישבן',core:'בטן וליבה',cardio:'קרדיו ובחוץ',stretch:'מתיחות וגמישות',full:'כל הגוף',calis:'קליסטניקס'};"),
 ("const cats=h('div',{class:'grid2 stagger'},...GROUP_ORDER.map(g=>h('button',{class:'cat pressable',onclick:()=>go('#group-'+g)},h('div',{class:'ic'},ic(g)),h('div',{class:'grow'},h('div',{class:'t'},GROUPS[g]),h('div',{class:'s'},`${S.ex.filter(e=>e.g===g).length} תרגילים`)))));",
  "const cats=h('div',{class:'grid2 stagger'},...GROUP_ORDER.map(g=>h('button',{class:'cat pressable',onclick:()=>go('#group-'+g)},h('div',{class:'ic'},ic(g)),h('div',{class:'grow'},h('div',{class:'t'},GROUPS[g]),h('div',{class:'s'},`${S.ex.filter(e=>e.g===g).length} תרגילים`)))),h('button',{class:'cat pressable',onclick:()=>go('#group-calis')},h('div',{class:'ic'},ic('full')),h('div',{class:'grow'},h('div',{class:'t'},'קליסטניקס'),h('div',{class:'s'},`${S.ex.filter(isCalis).length} תרגילי משקל גוף, מתח ומקבילים`))));"),
 ("const wrap=h('div'); let items = g==='custom' ? (S.deck.custom||[]) : S.ex.filter(e=>e.g===g);",
  "const wrap=h('div'); let items = g==='custom' ? (S.deck.custom||[]) : g==='calis' ? S.ex.filter(isCalis) : S.ex.filter(e=>e.g===g);"),
 ("if(g!=='custom' && g!=='cardio' && g!=='stretch') wrap.append(h('div',{class:'chips'}",
  "if(g!=='custom' && g!=='cardio' && g!=='stretch' && g!=='calis') wrap.append(h('div',{class:'chips'}"),
 # exercise list item: cardio-aware 'last time'
 ("const last=lastSession(e.id); const s = sub!=null ? sub : (last ? `פעם שעברה ${last.sets.length}×${Math.max(...last.sets.map(x=>+x.r||0))} · ${fmtW(Math.max(...last.sets.map(x=>+x.w||0)))} ק״ג · ${fmtDate(last.d)}` :",
  "const last=lastSession(e.id); const s = sub!=null ? sub : (last ? `פעם שעברה ${setStr(last.sets,e)} · ${fmtDate(last.d)}` :"),
 # icon for extra exercises list thumbnails: cardio -> heart icon already via e.g
]

def between(s, start, end, repl, p):
    assert s.count(start) == 1, (p, start[:40], s.count(start))
    i = s.index(start); j = s.index(end, i)
    return s[:i] + repl + s[j:]

for p in ('index.template.html', 'index.html'):
    s = open(p, encoding='utf-8').read()
    for a, b in EDITS:
        assert s.count(a) == 1, (p, s.count(a), a[:90])
        s = s.replace(a, b)
    s = s.replace("volume(s.sets)", "volOf(s)")
    s = between(s, "function home(){", "function weekDays(){", NEW_HOME, p)
    s = between(s, "function dayMenuMin(i){", "function journal(){", NEW_DAYMENU, p)
    s = between(s, "function addToDaySheet(i){", "function todayFromWeek(){", NEW_PICKER, p)
    for a, b in NEW_EXPAGE_PARTS:
        assert s.count(a) == 1, (p, s.count(a), a[:90])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
print('v6 edits ok')
