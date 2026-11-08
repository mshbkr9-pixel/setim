# -*- coding: utf-8 -*-
"""v9: a real calendar. Month grid in the journal, a page per date (past: what was done, editable per exercise
and per set; today/future: the plan, with one-date overrides or the weekly template), add/remove exercises on
any date. Applies to index.template.html and index.html."""

CSS = r"""
/* ========================= v9: calendar ========================= */
.cal{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:12px 12px 10px;margin-bottom:12px}
.cal .nav{display:flex;align-items:center;gap:6px;margin-bottom:10px} .cal .nav .m{flex:1;text-align:center;font-family:var(--display);font-weight:900;font-size:20px}
.cal .nav button{width:36px;height:36px;border-radius:12px;background:var(--card2);color:var(--ink);display:grid;place-items:center} .cal .nav button.t{width:auto;padding:0 10px;font-size:12px;font-weight:800;color:var(--accent)}
.cal .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.cal .dh{font-size:11px;color:var(--ink3);text-align:center;font-weight:800;padding-bottom:2px}
.cal .c{aspect-ratio:1;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-weight:800;font-size:14px;color:var(--ink2);background:var(--card2);position:relative;transition:transform .15s}
.cal .c:active{transform:scale(.94)} .cal .c.out{visibility:hidden}
.cal .c.done{background:rgba(74,222,128,.16);color:var(--ink)} .cal .c .n{font-size:9px;line-height:1;font-weight:900;color:var(--good)}
.cal .c.plan{box-shadow:0 0 0 1px var(--line2) inset} .cal .c.plan::after{content:"";width:5px;height:5px;border-radius:50%;background:var(--ink3)}
.cal .c.rest{opacity:.55} .cal .c.today{box-shadow:0 0 0 2px var(--accent) inset;color:var(--ink)} .cal .c.sel{background:var(--accent);color:var(--accent-ink)} .cal .c.sel .n{color:var(--accent-ink)}
.cal .sum{display:flex;gap:10px;justify-content:center;margin-top:10px;font-size:12px;color:var(--ink2);font-weight:700}
.daynav{display:flex;gap:6px} .daynav button{width:36px;height:36px;border-radius:12px;background:var(--card2);color:var(--ink);display:grid;place-items:center}
.daysum{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 12px} .daysum div{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 8px;text-align:center} .daysum b{display:block;font-size:20px;font-weight:900;letter-spacing:-.02em;font-variant-numeric:tabular-nums} .daysum span{font-size:11px;color:var(--ink2);font-weight:700}
.ovtag{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:4px 10px;margin:0 0 8px}
.pick .list{max-height:52vh;overflow-y:auto}
"""

HELPERS = r"""
/* ========================= v9: calendar, day pages, per-date logs ========================= */
function dateOfWeekday(i){ const [a]=weekRange(0); const d=new Date(a); d.setDate(d.getDate()+i); return iso(d); }
function addDays(k,n){ const d=new Date(k); d.setDate(d.getDate()+n); return iso(d); }
function planFor(k){ const ov=S.days.map[k]?.plan; if(ov){ ov.ex=ov.ex||[]; ov.groups=ov.groups||[]; return ov; } const d=S.week.days[new Date(k).getDay()]; return d?{label:d.label||'',groups:d.groups||[],ex:d.ex||[],rest:!!d.rest,routine:d.routine||'',weekly:true}:{label:'',groups:[],ex:[],rest:false,weekly:true}; }
function setOverride(k,plan){ const rec=S.days.map[k]||(S.days.map[k]={label:'',routine:'',ids:[]}); if(plan) rec.plan=plan; else delete rec.plan; save('days',S.days); }
function sessionsOn(k){ return allSessions().filter(s=>s.d===k); }
function recordDayFor(k,id){ const rec=S.days.map[k]||(S.days.map[k]={label:'',routine:'',ids:[]}); rec.ids=rec.ids||[]; if(id&&!rec.ids.includes(id)) rec.ids.push(id); clearTimeout(recordDayFor.t); recordDayFor.t=setTimeout(()=>save('days',S.days),600); }
function removeLogOn(k,id){ const l=S.logs[id]; if(!l) return; const idx=(l.sessions||[]).findIndex(s=>s.d===k); if(idx<0) return; const [gone]=l.sessions.splice(idx,1); save('log-'+id,l); const rec=S.days.map[k]; if(rec&&rec.ids){ rec.ids=rec.ids.filter(x=>x!==id); save('days',S.days); } render(); toastUndo(`${getEx(id)?.he||'התרגיל'} הוסר מ-${fmtDate(k)}`,()=>{ l.sessions.splice(idx,0,gone); l.sessions.sort((a,b)=>a.d.localeCompare(b.d)); save('log-'+id,l); recordDayFor(k,id); render(); }); }
function pickExerciseSheet(onPick,title='בחר/י תרגיל'){
  const body=h('div',{class:'pick'}); body.append(h('h2',{},title));
  const q=h('input',{type:'search',placeholder:'חיפוש בעברית או באנגלית…',autocomplete:'off'}); body.append(h('div',{class:'fld'},q));
  const list=h('div',{class:'list'}); body.append(list);
  const stars=new Set(S.deck.stars||[]); const recent={}; allSessions().forEach(s=>{ if(!recent[s.id]||recent[s.id]<s.d) recent[s.id]=s.d; });
  const all=S.ex.concat(S.deck.custom||[]);
  const score=e=>(stars.has(e.id)?2:0)+(recent[e.id]?3:0);
  const draw=()=>{ list.replaceChildren(); const t=q.value.trim().toLowerCase(); let items=all.filter(e=>!t||(e.he||'').toLowerCase().includes(t)||(e.en||'').toLowerCase().includes(t)); items=items.sort((a,b)=>score(b)-score(a)||(recent[b.id]||'').localeCompare(recent[a.id]||'')).slice(0,40); items.forEach(e=>list.append(exItem(e,{sub:recent[e.id]?`לאחרונה ${fmtDate(recent[e.id])}`:undefined,onclick:()=>{ Sheet.close(); onPick(e); }}))); if(!items.length) list.append(h('div',{class:'empty'},'לא נמצא')); };
  q.addEventListener('input',draw); draw(); Sheet.show(body); setTimeout(()=>q.focus(),350);
}
let calMonth=null, calSel=null;
function calendar(){
  const tk=todayKey(); if(!calMonth) calMonth=tk.slice(0,7); const [y,m]=calMonth.split('-').map(Number); const first=new Date(y,m-1,1); const nDays=new Date(y,m,0).getDate(); const lead=first.getDay();
  const by={}; allSessions().forEach(s=>{ const o=by[s.d]||(by[s.d]={ids:new Set(),sets:0,vol:0}); o.ids.add(s.id); o.sets+=s.sets.filter(x=>x.t||x.w>0||x.r>0).length; o.vol+=volOf(s); });
  const box=h('div',{class:'cal'});
  const shift=n=>{ const d=new Date(y,m-1+n,1); calMonth=iso(d).slice(0,7); render(); };
  box.append(h('div',{class:'nav'},h('button',{'aria-label':'חודש קודם',html:I('chev'),onclick:()=>shift(-1)}),h('div',{class:'m'},`${MONTHS[m-1]} ${y}`),calMonth!==tk.slice(0,7)?h('button',{class:'t',onclick:()=>{ calMonth=tk.slice(0,7); render(); }},'היום'):null,h('button',{'aria-label':'חודש הבא',html:I('chev'),style:'transform:scaleX(-1)',onclick:()=>shift(1)})));
  const grid=h('div',{class:'grid'}); DAY_LETTERS.forEach(l=>grid.append(h('div',{class:'dh'},l)));
  for(let i=0;i<lead;i++) grid.append(h('div',{class:'c out'}));
  let mSets=0,mVol=0,mDays=0;
  for(let d=1;d<=nDays;d++){ const k=iso(new Date(y,m-1,d)); const o=by[k]; const cls=['c']; if(o){ cls.push('done'); mDays++; mSets+=o.sets; mVol+=o.vol; } else if(k>=tk){ const p=planFor(k); if(p.rest) cls.push('rest'); else if(p.ex.length) cls.push('plan'); } if(k===tk) cls.push('today'); if(k===calSel) cls.push('sel');
    grid.append(h('button',{class:cls.join(' '),'aria-label':fmtDate(k),onclick:()=>{ calSel=k; go('#day-'+k); }},h('span',{},String(d)),o?h('span',{class:'n'},`${o.ids.size} תר׳`):null)); }
  box.append(grid);
  box.append(h('div',{class:'sum'},h('span',{},mDays?`${plural(mDays,'אימון אחד','אימונים')} החודש`:'אין אימונים החודש'),mSets?h('span',{},`· ${mSets} סטים`):null,mVol?h('span',{},`· ${fmtK(mVol)} ק״ג`):null));
  return box;
}
function dayPage(){
  const k=route.param; if(!/^\d{4}-\d{2}-\d{2}$/.test(k||'')){ header('יום',{back:'#journal'}); return h('div',{class:'empty'},'תאריך לא תקין'); }
  const tk=todayKey(); const isToday=k===tk, isPast=k<tk, isFuture=k>tk; const dow=new Date(k).getDay(); calSel=k; calMonth=k.slice(0,7);
  header(`${DAY_NAMES[dow]} ${fmtDate(k)}`,{back:'#journal',right:h('div',{class:'daynav'},h('button',{'aria-label':'יום קודם',html:I('chev'),onclick:()=>go('#day-'+addDays(k,-1))}),h('button',{'aria-label':'יום הבא',html:I('chev'),style:'transform:scaleX(-1)',onclick:()=>go('#day-'+addDays(k,1))}))});
  const wrap=h('div');
  const rec=S.days.map[k]; const sess=sessionsOn(k); const plan=planFor(k);
  wrap.append(h('div',{class:'display'},isToday?'היום':(isPast?`${DAY_NAMES[dow]}, ${new Date(k).getDate()} ב${MONTHS[new Date(k).getMonth()]}`:`${DAY_NAMES[dow]}, ${new Date(k).getDate()} ב${MONTHS[new Date(k).getMonth()]}`)),h('p',{class:'lead',style:'margin-bottom:10px'},isToday?'מה שבוצע ומה שמתוכנן להיום. אפשר לערוך הכול.':(isPast?'מה שבוצע ביום הזה. לחיצה על תרגיל עורכת את הסטים, מינוס מסיר.':'מה שמתוכנן ליום הזה. אפשר לשנות רק את התאריך הזה או את כל השבוע.')));
  // label
  const lbl=h('input',{type:'text',value:(rec&&rec.label)||(isFuture?plan.label:'')||'',placeholder:isFuture?'שם האימון (למשל "רגליים")':'שם לאימון הזה (לא חובה)'});
  lbl.addEventListener('change',()=>{ const v=lbl.value.trim(); if(isFuture){ if(plan.weekly){ setOverride(k,{label:v,groups:[...plan.groups],ex:plan.ex.map(x=>({...x})),rest:plan.rest}); } else { plan.label=v; save('days',S.days); } } else { const r=S.days.map[k]||(S.days.map[k]={label:'',routine:'',ids:[]}); r.label=v; save('days',S.days); } render(); });
  wrap.append(h('div',{class:'fld'},h('label',{},'שם האימון'),lbl));
  // done section
  if(!isFuture){
    const sets=sess.reduce((n,s)=>n+s.sets.filter(x=>x.t||x.w>0||x.r>0).length,0), vol=sess.reduce((n,s)=>n+volOf(s),0);
    if(sess.length) wrap.append(h('div',{class:'daysum'},h('div',{},h('b',{},String(sess.length)),h('span',{},'תרגילים')),h('div',{},h('b',{},String(sets)),h('span',{},'סטים')),h('div',{},h('b',{},rec&&rec.dur?fmtClock(rec.dur):fmtK(vol)),h('span',{},rec&&rec.dur?'זמן אימון':'ק״ג נפח'))));
    wrap.append(h('div',{class:'sec'},h('h2',{},isToday?'בוצע היום':'בוצע')));
    const list=h('div',{class:'list'});
    sess.forEach(s=>{ const e=getEx(s.id); if(!e) return; const b=bestSet(s.id); const pr=b&&b.d===k&&(S.logs[s.id].sessions||[]).filter(x=>x.d<k).length>0; list.append(exItem(e,{sub:setStr(s.sets,e)||'בלי סטים מסומנים',right:h('div',{class:'row',style:'gap:4px'},pr?h('span',{class:'pr',html:I('trophy')+'<span>שיא</span>'}):null,h('button',{class:'rowx','aria-label':'הסר מהיום הזה',title:'הסר מהיום הזה',html:I('minus'),onclick:ev=>{ ev.stopPropagation(); removeLogOn(k,s.id); }})),onclick:()=>go('#dayex-'+k+'-'+s.id)})); });
    if(!sess.length) list.append(h('div',{class:'empty'},ic('cal'),h('div',{},isToday?'עוד לא סומנו סטים היום.':'לא נרשם אימון ביום הזה.')));
    wrap.append(list);
    wrap.append(h('button',{class:sess.length?'btn ghost':'btn',html:I('plus')+`<span>${isToday?'רשום תרגיל נוסף':'הוסף תרגיל ליום הזה'}</span>`,onclick:()=>pickExerciseSheet(e=>go('#dayex-'+k+'-'+e.id),isToday?'איזה תרגיל עשית היום?':`מה עשית ב-${fmtDate(k)}?`)}));
  }
  // plan section
  if(!isPast){
    const ov=!plan.weekly;
    wrap.append(h('div',{class:'sec'},h('h2',{},isToday?'מתוכנן להיום':'מתוכנן')));
    if(ov) wrap.append(h('div',{class:'ovtag'},ic('cal'),h('span',{},'שינוי לתאריך הזה בלבד')));
    const pl=h('div',{class:'list'});
    if(plan.rest) pl.append(h('div',{class:'restcard'},ic('heart'),h('div',{class:'k'},'יום מנוחה')));
    else { plan.ex.forEach((x,idx)=>{ const e=getEx(x.id); if(!e) return; pl.append(exItem(e,{sub:`${x.sets||3} × ${x.reps||10}`,right:ov?h('button',{class:'rowx','aria-label':'הסר','html':I('minus'),onclick:ev=>{ ev.stopPropagation(); plan.ex.splice(idx,1); save('days',S.days); render(); }}):h('span',{class:'chev',html:I('chev')}),onclick:()=>go('#ex-'+e.id)})); }); if(!plan.ex.length) pl.append(h('div',{class:'empty'},'אין תרגילים מתוכננים')); }
    wrap.append(pl);
    const mkOverride=()=>{ setOverride(k,{label:plan.label||'',groups:[...plan.groups],ex:plan.ex.map(x=>({...x})),rest:false}); render(); };
    if(ov){
      wrap.append(h('div',{class:'row',style:'gap:8px;flex-wrap:wrap;margin-top:8px'},h('button',{class:'btn sec2',html:I('plus')+'<span>תרגיל</span>',onclick:()=>pickExerciseSheet(e=>{ plan.rest=false; plan.ex.push({id:e.id,sets:isCardio(e)?1:3,reps:isCardio(e)?30:repsForGoal()}); save('days',S.days); render(); },'הוסף לתאריך הזה')}),h('button',{class:'btn sec2',style:'width:auto;padding-inline:14px',onclick:()=>{ plan.rest=!plan.rest; save('days',S.days); render(); }},plan.rest?'בטל מנוחה':'יום מנוחה')));
      wrap.append(h('button',{class:'lnkline center',onclick:()=>{ setOverride(k,null); render(); toast('חזרנו לתוכנית השבועית'); }},`חזור לתוכנית הקבועה של יום ${DAY_NAMES[dow]}`));
    } else {
      wrap.append(h('div',{class:'row',style:'gap:8px;flex-wrap:wrap;margin-top:8px'},h('button',{class:'btn sec2',onclick:mkOverride},'שנה רק את התאריך הזה'),h('button',{class:'btn sec2',onclick:()=>{ homeDay=dow; editMode=true; go('#home'); }},`שנה את כל ימי ${DAY_NAMES[dow]}`)));
      wrap.append(h('p',{class:'small muted',style:'margin:6px 2px 0;line-height:1.5'},'התוכנית חוזרת כל שבוע לפי יום בשבוע. "רק התאריך הזה" יוצר חריגה חד-פעמית שלא משנה שבועות אחרים.'));
    }
  }
  if(isToday) wrap.append(h('button',{class:'btn',style:'margin-top:12px',onclick:()=>go('#home')},'לדף היום'));
  wrap.append(credit()); return wrap;
}
function dayExPage(){
  const p=route.param||''; const k=p.slice(0,10), id=p.slice(11); const e=getEx(id);
  if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(k)){ header('תרגיל',{back:'#journal'}); return h('div',{class:'empty'},'לא נמצא'); }
  const dow=new Date(k).getDay(); const isToday=k===todayKey();
  header(e.he,{back:'#day-'+k,right:h('button',{class:'iconbtn',html:I('dots'),'aria-label':'אפשרויות',onclick:()=>exMenu(e)})});
  const wrap=h('div'); const dc=demoCard(e); if(dc) wrap.append(dc);
  wrap.append(h('div',{class:'hero',style:'grid-template-columns:1fr;margin-bottom:10px'},h('div',{class:'grow'},h('h1',{},e.he),h('div',{class:'en'},`${isToday?'היום':DAY_NAMES[dow]+' '+fmtDate(k)} · ${subName(e)}`))));
  wrap.append(setsCard(e,{date:k}));
  if((S.logs[id]?.sessions||[]).some(s=>s.d===k)) wrap.append(h('button',{class:'btn sm danger',style:'margin-top:4px',onclick:()=>{ removeLogOn(k,id); go('#day-'+k); }},`הסר את התרגיל מ-${fmtDate(k)}`));
  const sessions=(S.logs[id]?.sessions||[]).filter(s=>s.d!==k&&s.sets.some(x=>x.w>0||x.r>0)).slice(-6).reverse();
  if(sessions.length){ const hist=h('div',{class:'card'},h('div',{class:'k',style:'margin-bottom:8px'},'פעמים אחרות')); sessions.forEach(s=>hist.append(h('button',{class:'h row between',style:'width:100%;padding:6px 0;border-bottom:1px solid var(--line)',onclick:()=>go('#dayex-'+s.d+'-'+id)},h('span',{class:'muted small'},fmtDate(s.d)),h('span',{class:'setline small'},setStr(s.sets,e))))); wrap.append(hist); }
  return wrap;
}
"""

EDITS = [
 (".myex .item .th{width:48px;height:48px}", ".myex .item .th{width:48px;height:48px}" + CSS),
 # routes
 ("for(const p of ['ex','machine','group','read']){", "for(const p of ['dayex','day','ex','machine','group','read']){"),
 ("journal,more,workout,myex};", "journal,more,workout,myex,day:dayPage,dayex:dayExPage};"),
 ("progress:'journal',install:'more',plans:'more',profile:'more',myex:'more'};", "progress:'journal',install:'more',plans:'more',profile:'more',myex:'more',day:'journal',dayex:'journal'};"),
 # one-date overrides flow through wkDay for the current week
 ("function wkDay(i){ const d=S.week.days[i]||", "function wkDay(i){ const ov=S.days.map[dateOfWeekday(i)]?.plan; if(ov){ ov.ex=ov.ex||[]; ov.groups=ov.groups||[]; return ov; } const d=S.week.days[i]||"),
 ("function saveWeek(){ save('week',S.week); }", "function saveWeek(){ save('week',S.week); if([0,1,2,3,4,5,6].some(i=>S.days.map[dateOfWeekday(i)]?.plan)) save('days',S.days); }"),
 ("function todayList(){ const i=new Date(todayKey()).getDay(); const d=S.week.days[i]; const ids=", "function todayList(){ const i=new Date(todayKey()).getDay(); const d=wkDay(i); const ids="),
 ("function targetsFor(id){ const i=new Date(todayKey()).getDay(); const d=S.week.days[i]; const x=", "function targetsFor(id){ const i=new Date(todayKey()).getDay(); const d=wkDay(i); const x="),
 # setsCard: any date
 ("  const cardio=isCardio(e); const last=lastSession(e.id); const isToday=last&&last.d===todayKey();\n  const prev=isToday?(S.logs[e.id].sessions[S.logs[e.id].sessions.length-2]||null):last;\n  const tgt=targetsFor(e.id);",
  "  const D=opts.date||todayKey(); const cardio=isCardio(e); const all=(S.logs[e.id]?.sessions||[]); const last=all.find(s=>s.d===D)||null; const isToday=!!last;\n  const prev=all.filter(s=>s.d<D).slice(-1)[0]||null;\n  const tgt=D===todayKey()?targetsFor(e.id):null;"),
 ("if(s.t){ haptic(15); startRest(); } else stopRest(); persist(); drawRows(); }}));", "if(s.t){ haptic(15); if(D===todayKey()) startRest(); } else stopRest(); persist(); drawRows(); }}));"),
 ("card.append(h('div',{class:'setact'},h('button',{class:'btn sm ghost',html:I('plus')+'<span>סט</span>',onclick:()=>{ const l=sets[sets.length-1]||{r:10,w:20}; sets.push({r:l.r,w:l.w,t:false}); drawRows(); persist(); }})));",
  "card.append(h('div',{class:'setact',style:'display:flex;gap:8px;flex-wrap:wrap'},h('button',{class:'btn sm ghost',html:I('plus')+'<span>סט</span>',onclick:()=>{ const l=sets[sets.length-1]||{r:10,w:20}; sets.push({r:l.r,w:l.w,t:false}); drawRows(); persist(); }}),D!==todayKey()&&sets.some(x=>!x.t)?h('button',{class:'btn sm ghost',html:I('check')+'<span>סמן הכול כבוצע</span>',onclick:()=>{ sets.forEach(x=>x.t=true); drawRows(); persist(); render(); }}):null));"),
 ("function persist(){ const l=S.logs[e.id]||{sessions:[]}; const idx=l.sessions.findIndex(s=>s.d===todayKey()); const sess={d:todayKey(),sets:sets.map(s=>({r:+s.r||0,w:+s.w||0,t:!!s.t}))}; if(idx>=0) l.sessions[idx]=sess; else l.sessions.push(sess); if(l.sessions.length>80) l.sessions=l.sessions.slice(-80); S.logs[e.id]=l; clearTimeout(persist.t); persist.t=setTimeout(()=>save('log-'+e.id,l),500); recordDay();",
  "function persist(){ const l=S.logs[e.id]||{sessions:[]}; const idx=l.sessions.findIndex(s=>s.d===D); const sess={d:D,sets:sets.map(s=>({r:+s.r||0,w:+s.w||0,t:!!s.t}))}; if(idx>=0) l.sessions[idx]=sess; else { l.sessions.push(sess); l.sessions.sort((a,b)=>a.d.localeCompare(b.d)); } if(l.sessions.length>80) l.sessions=l.sessions.slice(-80); S.logs[e.id]=l; clearTimeout(persist.t); persist.t=setTimeout(()=>save('log-'+e.id,l),500); if(D===todayKey()) recordDay(); else recordDayFor(D,e.id);"),
 # journal: calendar on top, dates and items clickable
 ("  const sess=allSessions().sort((a,b)=>b.d.localeCompare(a.d)); const byDate={}; sess.forEach(s=>{ (byDate[s.d]=byDate[s.d]||[]).push(s); });",
  "  wrap.append(calendar());\n  const sess=allSessions().sort((a,b)=>b.d.localeCompare(a.d)); const byDate={}; sess.forEach(s=>{ (byDate[s.d]=byDate[s.d]||[]).push(s); });"),
 ("if(!dates.length){ wrap.append(h('div',{class:'empty'},ic('book'),h('div',{},'עוד לא נרשם כלום. כל סט שתסמן/י יופיע כאן.'))); return wrap; }",
  "if(!dates.length){ wrap.append(h('div',{class:'empty'},ic('book'),h('div',{},'עוד לא נרשם כלום. כל סט שתסמן/י יופיע כאן, ואפשר ללחוץ על כל יום בלוח כדי לרשום אימון מהעבר.'))); return wrap; }"),
 ("wrap.append(h('div',{class:'jdate'},h('div',{class:'d'},`${DAY_NAMES[dow]} ${fmtDate(dt)}`),", "wrap.append(h('div',{class:'jdate',style:'cursor:pointer',onclick:()=>go('#day-'+dt)},h('div',{class:'d'},`${DAY_NAMES[dow]} ${fmtDate(dt)} ›`),"),
 ("list.append(exItem(e,{sub:setStr(s.sets,e),right:pr?h('span',{class:'pr',html:I('trophy')+'<span>שיא</span>'}):h('span',{class:'chev',html:I('chev')})})); }); wrap.append(list); });",
  "list.append(exItem(e,{sub:setStr(s.sets,e),right:pr?h('span',{class:'pr',html:I('trophy')+'<span>שיא</span>'}):h('span',{class:'chev',html:I('chev')}),onclick:()=>go('#dayex-'+dt+'-'+e.id)})); }); wrap.append(list); });"),
 # home: the day strip opens the date page on a second tap of the selected day
 ("onclick:()=>{ homeDay=i; editMode=false; render(); }},h('span',{class:'l'},DAY_LETTERS[i])", "onclick:()=>{ if(homeDay===i){ go('#day-'+dateOfWeekday(i)); return; } homeDay=i; editMode=false; render(); }},h('span',{class:'l'},DAY_LETTERS[i])"),
 # loadLocal: one non-JSON value (e.g. gt:theme='dark') must not abort loading the other keys
 ('applyDoc(k.slice(3), JSON.parse(localStorage.getItem(k))); } }catch(e){}', 'let v=null; try{ v=JSON.parse(localStorage.getItem(k)); }catch(e){ continue; } applyDoc(k.slice(3), v); } }catch(e){}'),
 ("/* ========================= boot ========================= */", HELPERS + "\n/* ========================= boot ========================= */"),
]

for p in ('index.template.html', 'index.html'):
    s = open(p, encoding='utf-8').read()
    for a, b in EDITS:
        assert s.count(a) == 1, (p, s.count(a), a[:90])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
print('v9 edits ok')
