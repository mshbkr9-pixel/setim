# -*- coding: utf-8 -*-
"""One-off: minimalist restructure. 4 tabs (היום / יומן / תרגילים / עוד). Today = week strip + the day's exercises,
tap to log. Exercise screen = sets only, everything else under one disclosure. Journal = what you did, when, how much."""
import re

CSS = r"""
/* minimal home */
.wkline{display:flex;align-items:center;gap:10px;color:var(--ink2);font-size:14px;font-weight:600;margin:-6px 0 14px;flex-wrap:wrap}
.lnk{color:var(--accent);font-weight:800;font-size:14px}
.lnkline{display:flex;align-items:center;gap:8px;color:var(--ink2);font-size:13px;font-weight:600;padding:8px 2px;width:100%}
.lnkline.center{justify-content:center;color:var(--ink3)}
.lnkline svg.i{width:18px;height:18px}
.ds{display:flex;justify-content:space-between;gap:4px;margin:0 0 14px}
.dsd{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px 0 6px;border-radius:14px;color:var(--ink2);font-weight:800;font-size:14px;transition:background .2s,color .2s}
.dsd.on{background:var(--card);color:var(--ink);box-shadow:var(--shadow);border:1px solid var(--line)}
.dsd.today .l{color:var(--accent)}
.dsd.rest{color:var(--ink3)}
.dsd i{width:6px;height:6px;border-radius:50%;background:transparent}
.dsd i.plan{background:var(--ink3)} .dsd i.done{background:var(--good)}
.dayhdr{display:flex;align-items:center;gap:10px;margin:0 2px 10px}
.prog{font-weight:900;font-size:15px;color:var(--ink2);display:inline-flex;align-items:center;gap:6px;letter-spacing:-.01em}
.prog.done{color:var(--good)}
.prog svg.i{width:16px;height:16px;stroke-width:3}
.hint{display:none}
.jdate{display:flex;align-items:baseline;justify-content:space-between;margin:20px 2px 8px}
.jdate .d{font-family:var(--display);font-weight:900;font-size:20px}
.jdate .s{font-size:12px;color:var(--ink2);font-weight:700}
.setline{font-variant-numeric:tabular-nums}
.setdel{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;color:var(--ink3);justify-self:center}
.setdel svg.i{width:14px;height:14px}
.sets .hd{grid-template-columns:36px 1fr 1fr 50px}
.morelist .item .t{font-size:15px}
"""

NEW_HOME = r"""function home(){
  header('היום');
  const wrap=h('div'); const today=new Date(todayKey()).getDay(); if(homeDay==null) homeDay=today; const sel=homeDay; const t=new Date(todayKey());
  wrap.append(h('div',{class:'display'},`${DAY_NAMES[today]}, ${t.getDate()} ב${MONTHS[t.getMonth()]}`));
  const cur=weekStats(0), prev=weekStats(1);
  const line=h('div',{class:'wkline'},h('span',{},cur.days?`${cur.days} אימונים השבוע · ${fmtK(cur.vol)} ק״ג`:'עוד לא התאמנת השבוע'),cur.vol&&prev.vol?delta(cur.vol,prev.vol):null,h('button',{class:'lnk',onclick:()=>go('#journal')},'יומן ›'));
  wrap.append(line);
  if(STANDALONE&&!PB.user) wrap.append(h('button',{class:'lnkline',onclick:()=>authSheet('login')},ic('cloud'),h('span',{},'התחבר/י כדי לשמור את היומן בחשבון ובכל מכשיר')));
  const strip=h('div',{class:'ds'});
  for(let i=0;i<7;i++){ const d=wkDay(i); const info=dayDoneInfo(i); strip.append(h('button',{class:'dsd pressable'+(i===sel?' on':'')+(i===today?' today':'')+(d.rest?' rest':''),onclick:()=>{ homeDay=i; editMode=false; render(); }},h('span',{class:'l'},DAY_LETTERS[i]),h('i',{class:info.done?'done':(d.ex.length?'plan':'')}))); }
  wrap.append(strip);
  const d=wkDay(sel); const isToday=sel===today; const ids=isToday?todayList():(d.rest?[]:d.ex.map(x=>x.id));
  const title=d.rest?'יום מנוחה':(d.label||(ids.length?'אימון':(isToday?'מה עושים היום?':`יום ${DAY_NAMES[sel]}`)));
  wrap.append(h('div',{class:'dayhdr'},h('div',{class:'grow'},h('div',{class:'k',style:'font-size:20px'},title),d.groups.length&&!d.rest?h('div',{class:'small muted'},d.groups.map(g=>GROUPS[g]).join(' · ')):null),h('button',{class:'iconbtn',html:I('dots'),'aria-label':'אפשרויות היום',onclick:()=>dayMenuMin(sel)})));
  if(d.rest&&!ids.length){ wrap.append(h('div',{class:'restcard'},ic('heart'),h('div',{class:'k'},'מנוחה'),h('div',{class:'small'},'הגוף בונה שריר דווקא עכשיו.')),h('button',{class:'lnkline center',onclick:()=>addToDaySheet(sel)},'בכל זאת להוסיף תרגיל')); wrap.append(credit()); return wrap; }
  const list=h('div',{class:'list'});
  ids.forEach((id,idx)=>{ const e=getEx(id); if(!e) return; const [dn,tot]=isToday?setsDoneToday(id):[0,0]; const tg=d.ex.find(x=>x.id===id); const prevS=(S.logs[id]?.sessions||[]).slice().reverse().find(s=>s.d!==todayKey()&&s.sets.some(x=>x.w>0||x.r>0));
    let right; if(editMode&&tg){ right=h('div',{class:'row',style:'gap:2px'},h('button',{class:'iconbtn sm',html:I('chevd'),style:'transform:rotate(180deg)',onclick:ev=>{ ev.stopPropagation(); const k=d.ex.indexOf(tg); if(k>0){ [d.ex[k-1],d.ex[k]]=[d.ex[k],d.ex[k-1]]; saveWeek(); render(); } }}),h('button',{class:'iconbtn sm',html:I('chevd'),onclick:ev=>{ ev.stopPropagation(); const k=d.ex.indexOf(tg); if(k<d.ex.length-1){ [d.ex[k+1],d.ex[k]]=[d.ex[k],d.ex[k+1]]; saveWeek(); render(); } }}),h('button',{class:'iconbtn sm',html:I('trash'),style:'color:var(--bad)',onclick:ev=>{ ev.stopPropagation(); d.ex.splice(d.ex.indexOf(tg),1); saveWeek(); render(); }})); }
    else right=h('span',{class:'prog'+(isToday&&tot&&dn===tot?' done':'')},isToday&&tot?`${dn}/${tot}`:(tg?`${tg.sets}×${tg.reps}`:''),isToday&&tot&&dn===tot?ic('check'):null);
    const sub=prevS?`פעם שעברה ${prevS.sets.map(x=>`${fmtW(x.w)}×${x.r}`).join(' · ')}`:(MUSCLE[e.pm?.[0]]||GROUPS[e.g]);
    list.append(exItem(e,{sub,right,onclick:()=>{ if(!editMode) go('#ex-'+id); }})); });
  if(!ids.length) list.append(h('div',{class:'empty'},ic('gym'),h('div',{},isToday?'אין עדיין תרגילים להיום.':'אין תרגילים ביום הזה.')));
  wrap.append(list);
  if(editMode) wrap.append(h('button',{class:'btn sec2',onclick:()=>{ editMode=false; render(); }},'סיימתי לסדר'));
  else wrap.append(h('button',{class:'btn ghost',html:I('plus')+'<span>תרגיל</span>',onclick:()=>addToDaySheet(sel)}));
  if(!ids.length&&!d.rest) wrap.append(h('button',{class:'lnkline center',onclick:()=>confirmSheet('למלא את כל השבוע אוטומטית?',`לפי תוכנית "${(PROGRAMS.find(p=>p.id===(S.profile.program||'full'))||PROGRAMS[0]).name}" ו-${S.profile.weekly||3} אימונים בשבוע. אפשר לשנות הכול אחר כך.`,()=>{ autoFillWeek(); render(); },'כן, מלא')},'או מלא את כל השבוע אוטומטית לפי תוכנית'));
  wrap.append(credit()); return wrap;
}
"""

NEW_HELPERS = r"""
/* ========================= MINIMAL: today list, day menu, journal, more ========================= */
const MONTHS=['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
let homeDay=null, editMode=false;
function todayList(){ const i=new Date(todayKey()).getDay(); const d=S.week.days[i]; const ids=(d&&!d.rest?(d.ex||[]).map(x=>x.id):[]); const extra=Object.keys(S.logs).filter(id=>!ids.includes(id)&&(S.logs[id].sessions||[]).some(s=>s.d===todayKey()&&s.sets.some(x=>x.t))); return ids.concat(extra); }
function setsDoneToday(id){ const s=(S.logs[id]?.sessions||[]).find(x=>x.d===todayKey()); return s?[s.sets.filter(x=>x.t).length,s.sets.length]:[0,0]; }
function doneToday(id){ const [a,b]=setsDoneToday(id); return b>0&&a===b; }
function targetsFor(id){ const i=new Date(todayKey()).getDay(); const d=S.week.days[i]; const x=d&&(d.ex||[]).find(e=>e.id===id); return x?{sets:x.sets||3,reps:x.reps||10}:null; }
function nextInPlan(curId){ const ids=todayList(); if(!ids.includes(curId)) return undefined; const i=ids.indexOf(curId); const after=ids.slice(i+1).concat(ids.slice(0,i)); return after.find(id=>!doneToday(id))||null; }
function dayMenuMin(i){
  const d=wkDay(i); const body=h('div'); body.append(h('h2',{},`יום ${DAY_NAMES[i]}`));
  const lbl=h('input',{type:'text',value:d.rest?'':d.label,placeholder:'שם, למשל "רגליים" או "דחיפה"'}); lbl.addEventListener('change',()=>{ d.label=lbl.value.trim(); if(d.label) d.rest=false; saveWeek(); render(); });
  body.append(h('div',{class:'fld'},h('label',{},'שם היום'),lbl));
  body.append(h('div',{class:'chips',style:'padding-top:0'},...DAY_PRESETS.map(p=>h('button',{class:'chip'+(d.rest&&p.rest?' on':(!d.rest&&d.label===p.l?' on':'')),onclick:()=>{ if(p.rest){ d.rest=true; d.label='מנוחה'; } else { d.rest=false; d.label=p.l; d.groups=[...p.g]; } saveWeek(); Sheet.close(); render(); }},p.l))));
  body.append(h('div',{class:'xs b muted',style:'margin:8px 0 6px;letter-spacing:.04em'},'שרירים'));
  const gc=h('div',{class:'gchips'},...GROUP_ORDER.map(g=>h('button',{class:'gchip'+(d.groups.includes(g)?' on':''),html:I(g)+`<span>${GROUPS[g]}</span>`,onclick:ev=>{ d.groups=d.groups.includes(g)?d.groups.filter(x=>x!==g):[...d.groups,g]; ev.currentTarget.classList.toggle('on'); saveWeek(); }}))); body.append(gc);
  const copyTo=h('div',{class:'gchips',style:'margin-top:6px'}); for(let j=0;j<7;j++){ if(j===i) continue; copyTo.append(h('button',{class:'gchip',onclick:()=>{ S.week.days[j]=JSON.parse(JSON.stringify(d)); saveWeek(); Sheet.close(); toast(`הועתק ליום ${DAY_NAMES[j]}`); render(); }},DAY_LETTERS[j])); }
  body.append(h('div',{class:'xs b muted',style:'margin:14px 0 6px;letter-spacing:.04em'},'העתק את היום הזה אל'),copyTo);
  body.append(h('div',{class:'list',style:'margin-top:16px'},h('button',{class:'item pressable',onclick:()=>{ editMode=true; Sheet.close(); render(); }},h('div',{class:'grow t'},'סדר או הסר תרגילים'),ic('chev')),h('button',{class:'item pressable',onclick:()=>{ Sheet.close(); confirmSheet('למלא את כל השבוע מחדש?','שבעת הימים יוחלפו לפי התוכנית והיעד השבועי שבפרופיל.',()=>{ autoFillWeek(); render(); },'כן, מלא'); }},h('div',{class:'grow t'},'מלא את כל השבוע אוטומטית'),ic('chev')),h('button',{class:'item pressable',style:'color:var(--bad)',onclick:()=>{ S.week.days[i]={label:'',groups:[],ex:[],rest:false}; saveWeek(); Sheet.close(); render(); }},h('div',{class:'grow t'},'נקה את היום'))));
  Sheet.show(body,()=>render());
}
function journal(){
  header('יומן'); const wrap=h('div'); wrap.append(h('div',{class:'display'},'יומן'));
  const cur=weekStats(0), prev=weekStats(1);
  wrap.append(h('div',{class:'wkline'},h('span',{},`השבוע: ${cur.days} אימונים · ${cur.sets} סטים · ${fmtK(cur.vol)} ק״ג`),cur.vol&&prev.vol?delta(cur.vol,prev.vol):null,h('button',{class:'lnk',onclick:()=>go('#progress')},'גרפים ושיאים ›')));
  const sess=allSessions().sort((a,b)=>b.d.localeCompare(a.d)); const byDate={}; sess.forEach(s=>{ (byDate[s.d]=byDate[s.d]||[]).push(s); });
  const dates=Object.keys(byDate).sort().reverse().slice(0,90);
  if(!dates.length){ wrap.append(h('div',{class:'empty'},ic('book'),h('div',{},'עוד לא נרשם כלום. כל סט שתסמן/י יופיע כאן.'))); return wrap; }
  dates.forEach(dt=>{ const items=byDate[dt]; const vol=items.reduce((n,s)=>n+volume(s.sets),0); const dow=new Date(dt).getDay(); wrap.append(h('div',{class:'jdate'},h('div',{class:'d'},`${DAY_NAMES[dow]} ${fmtDate(dt)}`),h('div',{class:'s'},`${items.length} תרגילים · ${fmtK(vol)} ק״ג`)));
    const list=h('div',{class:'list'}); items.forEach(s=>{ const e=getEx(s.id); if(!e) return; const b=bestSet(s.id); const pr=b&&b.d===dt&&(S.logs[s.id].sessions||[]).filter(x=>x.d<dt).length>0; list.append(exItem(e,{sub:s.sets.filter(x=>x.r>0||x.w>0).map(x=>`${fmtW(x.w)}×${x.r}`).join(' · '),right:pr?h('span',{class:'pr',html:I('trophy')+'<span>שיא</span>'}):h('span',{class:'chev',html:I('chev')})})); }); wrap.append(list); });
  wrap.append(credit()); return wrap;
}
function more(){
  header('עוד'); const wrap=h('div'); wrap.append(h('div',{class:'display'},'עוד'));
  const acct=STANDALONE?(PB.user?`מחובר/ת · ${PB.user.email}`:'לא מחובר/ת · היומן נשמר רק במכשיר הזה'):(S.storageMode==='cloud'?'מחובר/ת · נשמר בחשבון':'לא מחובר/ת');
  const row=(icn,t,s,onclick)=>h('button',{class:'item pressable',onclick},h('div',{class:'th',style:'width:40px;height:40px;border-radius:12px;color:var(--accent);background:var(--accent-soft)'},ic(icn)),h('div',{class:'grow'},h('div',{class:'t ell'},t),s?h('div',{class:'s ell'},s):null),h('span',{class:'chev',html:I('chev')}));
  wrap.append(h('div',{class:'list morelist'},row('user',S.profile.name||'הפרופיל שלי',acct,()=>go('#profile')),STANDALONE?row('cloud',PB.user?'יציאה מהחשבון':'כניסה או הרשמה','',()=>{ if(PB.user) signOut(); else authSheet('login'); }):null));
  wrap.append(h('div',{class:'list morelist'},row('book','מדריכים','איך בונים אימון, עומס מתקדם, תזונה',()=>go('#guides')),row('flame','קלוריות ותזונה',bodyMetrics(S.profile)?`תחזוקה ${bodyMetrics(S.profile).tdee.toLocaleString('he-IL')} קק״ל`:'לפי משקל, גובה וגיל',()=>go('#calories')),row('trend','גרפים ושיאים','',()=>go('#progress')),row('gym','המכון שלי',BRANDS.find(b=>b.id===S.profile.brand)?.name||'בחר/י יצרן מכשירים',()=>{ libMode='gym'; go('#library'); }),row('plan','תוכניות מוכנות והמלצה להיום','',()=>go('#plans'))));
  const p=S.profile;
  wrap.append(h('div',{class:'list morelist'},STANDALONE?row('phone','הוספה למסך הבית','',()=>go('#install')):null,row('share','שתף עם חברים','getonekeyai.com',shareApp),row('info','הסבר קצר על האפליקציה','',()=>showOnboarding())));
  const rest=h('select',{},...[[0,'בלי טיימר'],[60,'60 שניות'],[90,'90 שניות'],[120,'2 דקות'],[150,'2.5 דקות'],[180,'3 דקות']].map(([v,l])=>h('option',{value:v,selected:restSeconds()===v},l))); rest.addEventListener('change',()=>{ p.rest=+rest.value; save('profile',p); });
  let curT=''; try{ curT=localStorage.getItem('gt:theme')||''; }catch(e){} const theme=h('select',{},...[['','אוטומטי'],['dark','כהה'],['light','בהיר']].map(([v,l])=>h('option',{value:v,selected:curT===v},l))); theme.addEventListener('change',()=>{ try{ if(theme.value) localStorage.setItem('gt:theme',theme.value); else localStorage.removeItem('gt:theme'); }catch(e){} if(!theme.value) document.documentElement.removeAttribute('data-theme'); applyTheme(); render(); });
  wrap.append(h('div',{class:'sec'},h('h2',{},'הגדרות')),h('div',{class:'card'},h('div',{class:'fld'},h('label',{},'מנוחה בין סטים'),rest),h('div',{class:'fld',style:'margin:0'},h('label',{},'מראה'),theme)));
  wrap.append(h('div',{class:'credit',html:'סטים · Exercise data by <a href="https://repdb.co" rel="nofollow" target="_blank">RepDB</a>. לא ייעוץ רפואי.'}));
  return wrap;
}
"""

NEW_EXPAGE = r"""function exPage(){
  const e=getEx(route.param);
  if(!e){ header('תרגיל',{back:'#home'}); return h('div',{class:'empty'},'התרגיל לא נמצא'); }
  header(e.he,{back:'#home',right:starBtn(e)});
  const wrap=h('div');
  const img=h('div',{class:'img',style:'width:96px;height:96px;border-radius:18px'});
  if(hasImg(e)){ const a=exImg(e,'s'); a.alt=e.en||''; a.loading='eager'; img.append(a); if(hasPeak(e)){ const b=exImg(e,'p'); b.classList.add('hide'); img.append(b); let flip=false; img.addEventListener('click',()=>{ flip=!flip; b.classList.toggle('hide',!flip); }); } }
  else img.append(h('div',{style:'display:grid;place-items:center;height:100%;color:var(--ink3)'},ic(e.g in ICONS?e.g:'gym')));
  wrap.append(h('div',{class:'hero',style:'grid-template-columns:1fr 96px'},h('div',{class:'grow'},h('h1',{},e.he),h('div',{class:'en'},[MUSCLE[e.pm?.[0]]||GROUPS[e.g],e.eq&&e.eq!=='custom'?EQ[e.eq]:null].filter(Boolean).join(' · '))),img));
  const last=lastSession(e.id); const isToday=last&&last.d===todayKey();
  const prev=isToday?(S.logs[e.id].sessions[S.logs[e.id].sessions.length-2]||null):last;
  const tgt=targetsFor(e.id);
  let sets=isToday?last.sets.map(x=>({...x})):(prev?prev.sets.map(x=>({r:x.r,w:x.w,t:false})):Array.from({length:tgt?tgt.sets:3},()=>({r:tgt?tgt.reps:10,w:e.bw?0:20,t:false})));
  const card=h('div',{class:'sets'});
  card.append(h('div',{class:'row between',style:'padding:10px 14px 0'},h('div',{class:'k',style:'font-size:17px'},'סטים'),h('div',{class:'xs muted b'},prev?`פעם שעברה ${prev.sets.map(x=>`${fmtW(x.w)}×${x.r}`).join(' · ')}`:(tgt?`יעד ${tgt.sets}×${tgt.reps}`:'פעם ראשונה'))),h('div',{class:'hd'},h('span',{},''),h('span',{},'ק״ג'),h('span',{},'חזרות'),h('span',{},'')));
  const rows=h('div'); card.append(rows);
  const stepper=(val,step,onChange,min=0)=>{ const inp=h('input',{type:'number',inputmode:'decimal',value:val,step,min}); inp.addEventListener('change',()=>onChange(parseFloat(inp.value)||0)); const mk=(sign,label)=>{ const b=h('button',{'aria-label':label,type:'button',html:I(sign>0?'plus':'minus')}); let t,iv; const fire=()=>{ const nv=Math.max(min,Math.round(((parseFloat(inp.value)||0)+sign*step)*100)/100); inp.value=nv; onChange(nv); haptic(5); }; b.addEventListener('pointerdown',ev=>{ ev.preventDefault(); fire(); t=setTimeout(()=>{ iv=setInterval(fire,110); },420); }); const stop=()=>{ clearTimeout(t); clearInterval(iv); }; b.addEventListener('pointerup',stop); b.addEventListener('pointercancel',stop); b.addEventListener('pointerleave',stop); return b; }; return h('div',{class:'stp'},mk(1,'הוסף'),inp,mk(-1,'הפחת')); };
  const cmpTxt=i=>{ const p=prev?.sets?.[i]; if(!p) return ''; const dw=(+sets[i].w||0)-(+p.w||0), dr=(+sets[i].r||0)-(+p.r||0); const parts=[]; if(dw) parts.push(`<span class="${dw>0?'up':'dn'}">${dw>0?'▲':'▼'} ${Math.abs(dw)} ק״ג</span>`); if(dr) parts.push(`<span class="${dr>0?'up':'dn'}">${dr>0?'▲':'▼'} ${Math.abs(dr)} חז׳</span>`); return parts.join(' · '); };
  function drawRows(){ rows.replaceChildren(); sets.forEach((s,i)=>{ const cmp=h('div',{class:'cmp',html:cmpTxt(i)}); const isLast=i===sets.length-1&&sets.length>1&&!s.t; const row=h('div',{class:'set'+(s.t?' done':'')},isLast?h('button',{class:'setdel','aria-label':'הסר סט',html:I('minus'),onclick:()=>{ sets.pop(); drawRows(); persist(); }}):h('div',{class:'no'},i+1),stepper(s.w,2.5,v=>{ s.w=v; cmp.innerHTML=cmpTxt(i); persist(); }),stepper(s.r,1,v=>{ s.r=v; cmp.innerHTML=cmpTxt(i); persist(); }),h('button',{class:'chk'+(s.t?' on':''),'aria-label':'סיימתי סט',html:I('check'),onclick:ev=>{ s.t=!s.t; ev.currentTarget.classList.toggle('on',s.t); row.classList.toggle('done',s.t); if(s.t){ haptic(15); startRest(); } else stopRest(); persist(); drawRows(); }})); rows.append(row); if(cmp.innerHTML) rows.append(h('div',{style:'padding:0 14px 6px'},cmp)); }); }
  drawRows();
  card.append(h('div',{class:'setact'},h('button',{class:'btn sm ghost',html:I('plus')+'<span>סט</span>',onclick:()=>{ const l=sets[sets.length-1]||{r:10,w:20}; sets.push({r:l.r,w:l.w,t:false}); drawRows(); persist(); }})));
  wrap.append(card); const nb=nextBar(e); if(nb) wrap.append(nb);
  function persist(){ const l=S.logs[e.id]||{sessions:[]}; const idx=l.sessions.findIndex(s=>s.d===todayKey()); const sess={d:todayKey(),sets:sets.map(s=>({r:+s.r||0,w:+s.w||0,t:!!s.t}))}; if(idx>=0) l.sessions[idx]=sess; else l.sessions.push(sess); if(l.sessions.length>80) l.sessions=l.sessions.slice(-80); S.logs[e.id]=l; clearTimeout(persist.t); persist.t=setTimeout(()=>save('log-'+e.id,l),500); }
  const sessions=(S.logs[e.id]?.sessions||[]).filter(s=>s.sets.some(x=>x.w>0||x.r>0)); const pr=bestSet(e.id);
  const det=h('details',{class:'card'},h('summary',{},h('span',{},'עוד על התרגיל'),ic('chevd'))); const body=h('div',{style:'margin-top:12px'});
  if(sessions.length){ body.append(h('div',{class:'row between'},h('div',{class:'k'},'התקדמות'),pr?h('span',{class:'pr',html:I('trophy')+`<span>שיא ${fmtW(pr.w)}×${pr.r}</span>`}):null)); const cv=h('canvas',{class:'chart'}); body.append(cv); det.addEventListener('toggle',()=>{ if(det.open) requestAnimationFrame(()=>drawChart(cv,sessions)); });
    const fs0=sessions[0]; if(sessions.length>=2){ const fw=Math.max(...fs0.sets.map(x=>+x.w||0)), lw=Math.max(...sessions[sessions.length-1].sets.map(x=>+x.w||0)); body.append(h('div',{class:'banner good',style:'margin:12px 0 0;align-items:center'},ic('trend'),h('span',{class:'grow'},`התחלת ב-${fmtDate(fs0.d)} עם ${fmtW(fw)} ק״ג. היום ${fmtW(lw)} ק״ג${fw?` (${lw>=fw?'+':''}${Math.round((lw-fw)/fw*100)}%)`:''}, אחרי ${sessions.length} אימונים.`))); }
    const hist=h('div',{class:'hist',style:'margin-top:10px'}); sessions.slice(-8).reverse().forEach(s=>hist.append(h('div',{class:'h'},h('span',{class:'muted'},fmtDate(s.d)),h('span',{class:'setline'},s.sets.map(x=>`${fmtW(x.w)}×${x.r}`).join(' · '))))); body.append(hist); }
  if(e.dhe||e.den) body.append(h('p',{class:'small',style:'margin:14px 0 8px;line-height:1.6'},e.dhe||e.den));
  if(e.ins?.length) body.append(h('ol',{class:'steps'},...e.ins.map(s=>h('li',{},s))));
  if(e.notes) body.append(h('p',{class:'small'},e.notes));
  body.append(h('a',{class:'yt pressable',href:ytUrl(e),target:'_blank',rel:'noopener',html:I('play')+'<span class="grow">סרטון הדגמה ביוטיוב</span>'+I('chev')}));
  body.append(h('div',{class:'row',style:'gap:8px;margin-top:10px;flex-wrap:wrap'},h('button',{class:'btn sm sec2',onclick:()=>editYt(e)},S.yt[e.id]||e.yt?'ערוך קישור יוטיוב':'קישור יוטיוב משלי'),e.custom?h('button',{class:'btn sm sec2',onclick:()=>editCustom(e)},'ערוך תרגיל'):null,!todayList().includes(e.id)?h('button',{class:'btn sm sec2',onclick:()=>{ const i=new Date(todayKey()).getDay(); const d=wkDay(i); d.rest=false; d.ex.push({id:e.id,sets:3,reps:repsForGoal()}); saveWeek(); toast('נוסף להיום'); render(); }},'הוסף להיום'):null));
  det.append(body); wrap.append(det);
  return wrap;
}
"""

NEW_SETUP = r"""function setupSheet(){
  const p=S.profile; const name=h('input',{type:'text',value:p.name||'',placeholder:'איך לקרוא לך',autocomplete:'given-name'});
  const weekly=h('div',{class:'seg'}); let wk=p.weekly||3; [2,3,4,5,6].forEach(nn=>weekly.append(h('button',{class:nn===wk?'on':'',onclick:ev=>{ wk=nn; [...weekly.children].forEach(c=>c.classList.remove('on')); ev.currentTarget.classList.add('on'); }},String(nn))));
  Sheet.show(h('div',{},h('h2',{},'שני פרטים ויוצאים לדרך'),h('div',{class:'fld'},h('label',{},'שם'),name),h('div',{class:'fld'},h('label',{},'כמה אימונים בשבוע'),weekly),h('button',{class:'btn',onclick:()=>{ p.name=name.value.trim(); p.weekly=wk; save('profile',p); Sheet.close(); render(); }},'מתחילים')));
}
"""

NEW_SLIDES = r"""const ONB_SLIDES=[
 {t:'סופרים סטים',p:'לוחצים על תרגיל, מסמנים משקל וחזרות, ✓ בסוף כל סט. בפעם הבאה הכול כבר ממולא מהפעם הקודמת, רק מעלים.',
  art:`<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg"><g font-family="Heebo" font-weight="900"><rect x="40" y="40" width="240" height="44" rx="14" fill="var(--card2)"/><text x="262" y="68" text-anchor="end" font-size="16" fill="var(--ink)">1</text><rect x="150" y="50" width="70" height="24" rx="8" fill="var(--card3)"/><text x="185" y="67" text-anchor="middle" font-size="13" fill="var(--ink)">40 ק״ג</text><rect x="70" y="50" width="60" height="24" rx="8" fill="var(--card3)"/><text x="100" y="67" text-anchor="middle" font-size="13" fill="var(--ink)">10</text><rect x="40" y="94" width="240" height="44" rx="14" fill="var(--card2)"/><text x="262" y="122" text-anchor="end" font-size="16" fill="var(--ink)">2</text><rect x="150" y="104" width="70" height="24" rx="8" fill="var(--card3)"/><text x="185" y="121" text-anchor="middle" font-size="13" fill="var(--ink)">42.5</text><rect x="70" y="104" width="60" height="24" rx="8" fill="var(--card3)"/><text x="100" y="121" text-anchor="middle" font-size="13" fill="var(--ink)">10</text><rect x="40" y="148" width="240" height="44" rx="14" fill="rgba(74,222,128,.12)"/><text x="262" y="176" text-anchor="end" font-size="16" fill="var(--good)">3</text><rect x="150" y="158" width="70" height="24" rx="8" fill="var(--card3)"/><text x="185" y="175" text-anchor="middle" font-size="13" fill="var(--ink)">42.5</text><rect x="70" y="158" width="60" height="24" rx="8" fill="var(--card3)"/><text x="100" y="175" text-anchor="middle" font-size="13" fill="var(--ink)">11</text><circle cx="52" cy="170" r="11" fill="var(--good)"/><path d="M46 170l4 4 8-8" stroke="#06240F" stroke-width="2.5" fill="none" stroke-linecap="round"/></g></svg>`},
 {t:'השבוע שלך',p:'שבעה ימים למעלה. בכל יום: אילו תרגילים, כמה סטים וחזרות. מוסיפים, מסדרים, או ממלאים אוטומטית לפי תוכנית.',
  art:`<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg"><g font-family="Heebo" font-weight="900" font-size="16" text-anchor="middle">${['א','ב','ג','ד','ה','ו','ש'].map((l,i)=>`<rect x="${276-i*40}" y="40" width="34" height="46" rx="12" fill="${i===4?'var(--accent)':'var(--card2)'}"/><text x="${293-i*40}" y="69" fill="${i===4?'var(--accent-ink)':'var(--ink2)'}">${l}</text>`).join('')}</g><g fill="var(--card2)"><rect x="40" y="110" width="240" height="30" rx="10"/><rect x="40" y="150" width="240" height="30" rx="10"/></g><g font-family="Heebo" font-weight="800" font-size="12" fill="var(--ink2)"><text x="270" y="130" text-anchor="end">סקוואט</text><text x="50" y="130">3×8</text><text x="270" y="170" text-anchor="end">לחיצת חזה</text><text x="50" y="170">3×10</text></g></svg>`},
 {t:'היומן זוכר הכול',p:'כל תרגיל, כל משקל, כל סט, לפי תאריך. מאיפה התחלת ועד איפה הגעת. התחברות עם חשבון שומרת את זה בכל מכשיר.',
  art:`<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="og3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent2)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs><g fill="var(--card3)"><rect x="40" y="130" width="26" height="50" rx="7"/><rect x="80" y="110" width="26" height="70" rx="7"/><rect x="120" y="120" width="26" height="60" rx="7"/><rect x="160" y="90" width="26" height="90" rx="7"/><rect x="200" y="100" width="26" height="80" rx="7"/></g><rect x="240" y="50" width="26" height="130" rx="7" fill="url(#og3)"/><g font-family="Heebo" font-weight="900" font-size="14" fill="var(--good)"><text x="253" y="40" text-anchor="middle">+18%</text></g><path d="M40 190H290" stroke="var(--line2)"/></svg>`},
];
"""

def between(s, start, end, repl, p):
    i = s.index(start); j = s.index(end, i)
    assert s.count(start) == 1, (p, start[:40], s.count(start))
    return s[:i] + repl + s[j:]

for p in ('index.template.html', 'index.html'):
    s = open(p, encoding='utf-8').read()
    s = s.replace("</style>", CSS + "</style>", 1)
    s = between(s, "function home(){", "function weekDays(){", NEW_HOME, p)
    s = between(s, "function exPage(){", "function editYt(e){", NEW_EXPAGE, p)
    s = between(s, "function setupSheet(){", "function startChecklist(){", NEW_SETUP, p)
    s = between(s, "const ONB_SLIDES=[", "const Onb=", NEW_SLIDES, p)
    # old nextInPlan line -> removed (new one in helpers)
    s = re.sub(r"\nfunction nextInPlan\(curId\)\{[^\n]*\}\n", "\n", s, count=1)
    assert s.count("function nextInPlan(") == 0, p
    s = s.replace("/* ========================= UX: theme, onboarding, checklist, rest timer =========================", NEW_HELPERS + "\n/* ========================= UX: theme, onboarding, checklist, rest timer =========================", 1)
    EDITS = [
     ("const TABS=[['home','היום','home'],['library','ספרייה','lib'],['week','השבוע','cal'],['guides','מדריכים','book'],['profile','פרופיל','user']];",
      "const TABS=[['home','היום','cal'],['journal','יומן','book'],['library','תרגילים','lib'],['more','עוד','dots']];"),
     ("function activeTab(){ const m={ex:'library',group:'library',machine:'library',gym:'library',read:'guides',calories:'profile',progress:'profile',install:'profile',plans:'week'};",
      "function activeTab(){ const m={ex:'home',week:'home',group:'library',machine:'library',gym:'library',guides:'more',read:'more',calories:'more',progress:'journal',install:'more',plans:'more',profile:'more'};"),
     ("const pages={home,library,group:groupPage,ex:exPage,gym,machine:machinePage,plans,week,guides,read:readPage,profile,calories,progress,install};",
      "const pages={home,week:home,library,group:groupPage,ex:exPage,gym,machine:machinePage,plans,guides,read:readPage,profile,calories,progress,install,journal,more};"),
     ("else l.append(h('button',{class:'avatar pressable','aria-label':'פרופיל',onclick:()=>go('#profile')}",
      "else l.append(h('button',{class:'avatar pressable','aria-label':'פרופיל',onclick:()=>go('#more')}"),
     ("wrap.append(h('div',{class:'display'},'תרגילים'),h('p',{class:'lead'},'701 תרגילים לפי שריר, או המכשירים של המכון שלך.'));",
      "wrap.append(h('div',{class:'display'},'תרגילים'));"),
     ("header('התקדמות',{back:'#profile'});", "header('גרפים ושיאים',{back:'#journal'});"),
     ("header('קלוריות',{back:'#profile'});", "header('קלוריות',{back:'#more'});"),
     ("header('הוספה למסך הבית',{back:'#profile'});", "header('הוספה למסך הבית',{back:'#more'});"),
     ("header('מדריכים'); const wrap=h('div'); wrap.append(h('div',{class:'display'},'מדריכים'),h('p',{class:'lead'},'איך בונים אימון, איך מתקדמים ואיך אוכלים לפיו. כתוב למתאמנים, לא לרופאים.'));",
      "header('מדריכים',{back:'#more'}); const wrap=h('div'); wrap.append(h('div',{class:'display'},'מדריכים'));"),
     ("header('תוכניות'); const wrap=h('div'); wrap.append(h('div',{class:'display'},'תוכניות והמלצות'),h('p',{class:'lead'},'מותאם למטרה, למכשירים שלך ולמה שאימנת לאחרונה.'));",
      "header('תוכניות',{back:'#more'}); const wrap=h('div'); wrap.append(h('div',{class:'display'},'תוכניות והמלצות'));"),
     ("header('פרופיל'); const wrap=h('div'); const p=S.profile;", "header('פרופיל',{back:'#more'}); const wrap=h('div'); const p=S.profile;"),
     ("h('button',{class:'btn',style:'margin-top:10px',onclick:()=>startPlan(rec.ids)},'התחל את האימון הזה')));",
      "h('button',{class:'btn',style:'margin-top:10px',onclick:()=>{ const i=new Date(todayKey()).getDay(); S.week.days[i]={label:rec.title,groups:[],ex:rec.ids.map(id=>({id,sets:3,reps:repsForGoal()})),rest:false}; saveWeek(); go('#home'); toast('נכנס ליום של היום'); }},'שים את זה בהיום')));"),
     ("prog.days.forEach((d,i)=>{ const ids=buildDay(d,(S.profile.seed||0)*3+i); wrap.append(h('div',{class:'card'},h('div',{class:'row between'},h('div',{class:'k'},'יום '+d.n),h('button',{class:'btn sm ghost',onclick:()=>startPlan(ids)},'התחל')),",
      "prog.days.forEach((d,i)=>{ const ids=buildDay(d,(S.profile.seed||0)*3+i); wrap.append(h('div',{class:'card'},h('div',{class:'row between'},h('div',{class:'k'},'יום '+d.n),h('button',{class:'btn sm ghost',onclick:()=>{ const di=new Date(todayKey()).getDay(); S.week.days[di]={label:prog.name+' · '+d.n,groups:[...new Set(d.slots.map(slotGroup))],ex:ids.map(id=>({id,sets:3,reps:repsForGoal()})),rest:false}; saveWeek(); go('#home'); toast('נכנס ליום של היום'); }},'להיום')),"),
    ]
    for a, b in EDITS:
        assert s.count(a) == 1, (p, s.count(a), a[:80])
        s = s.replace(a, b)
    # profile: drop the duplicated links list (now in "more")
    i = s.index("  // links\n  const links=h('div',{class:'list'});"); j = s.index("  wrap.append(h('div',{class:'sec'},h('h2',{},'שיתוף עם חברים'))", i)
    s = s[:i] + s[j:]
    open(p, 'w', encoding='utf-8').write(s)
print('minimal edits ok')
