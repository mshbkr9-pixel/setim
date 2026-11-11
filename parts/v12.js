/* ========================= v12: goals and achievements, logging by voice ========================= */
/* The thinking lives in parts/goals.js (GoalKit) and parts/voice.js (VoiceLog). This file is the screens and the glue:
   four documents are added to what the app stores and syncs: goals, body (weigh-ins), vinbox (what the phone assistant sent,
   written only by the server) and vdone (which of those this account has already taken into the journal). */
ICONS.mic='<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"/>';
S.goals={list:[]}; S.body={w:[]}; S.vinbox={items:[]}; S.vdone={ids:{},last:[]};
const SIRI_SHORTCUT_URL='';      // the iCloud link of the ready-made shortcut; until it exists the app shows how to build it by hand

/* ---------- goals: data ---------- */
function goalData(){ return {today:todayKey(),now:Date.now(),profile:S.profile,weighins:(S.body&&S.body.w)||[],logs:S.logs,nameOf:id=>{ const e=getEx(id); return e?e.he:''; },isCustom:id=>(S.deck.custom||[]).some(c=>c.id===id)}; }
function goalsOn(){ return ((S.goals&&S.goals.list)||[]).filter(g=>g.status==='on'); }
function goalsPast(){ return ((S.goals&&S.goals.list)||[]).filter(g=>g.status!=='on'); }
function goalById(id){ return ((S.goals&&S.goals.list)||[]).find(g=>g.id===id); }
function saveGoals(){ return save('goals',S.goals); }
function lastWeigh(){ const w=(S.body&&S.body.w)||[]; return w.length?w[w.length-1]:null; }
function addWeigh(kg,d){
  d=d||todayKey(); const w=S.body.w||(S.body.w=[]); const i=w.findIndex(x=>x.d===d);
  if(i>=0) w[i].kg=kg; else { w.push({d,kg}); w.sort((a,b)=>a.d.localeCompare(b.d)); }
  if(w.length>400) S.body.w=w.slice(-400);
  if(lastWeigh().d===d){ S.profile.weight=kg; save('profile',S.profile); }
  save('body',S.body);
}
/* every change to a log or to the weigh-ins ends here: stages that the journal now proves are closed, with a banner */
let GOAL_T=null;
function goalsSoon(){ clearTimeout(GOAL_T); GOAL_T=setTimeout(goalsSync,700); }
function goalsSync(){
  if(!goalsOn().length) return;
  const D=goalData(); let n=0;
  goalsOn().forEach(g=>{ const r=GoalKit.sync(g,D); if(!r.fresh.length) return; const last=r.fresh[r.fresh.length-1], k=n++; setTimeout(()=>stageBanner(g,last,r.finished,r.fresh.length),k*1300); });
  if(!n) return;
  saveGoals(); goalAch(n*1300);
  if(['goals','goal','home','more','ach'].includes(route.page)) render();
}
function goalAch(delay){ try{ checkAch().forEach((a,i)=>setTimeout(()=>achBanner(a),(delay||0)+i*1000)); }catch(e){} }
function stageBanner(g,st,finished,count){
  const el=h('button',{class:'prban gban',type:'button','aria-live':'polite'},h('span',{class:'pb-i'},ic(finished?'trophy':'flag')),h('span',{class:'grow'},h('b',{},finished?'המטרה הושגה':(count>1?`${count} שלבים הושלמו`:'שלב הושלם')),h('span',{},finished?g.title:st.t)));
  el.addEventListener('click',()=>{ el.remove(); if(route.page!=='goals') go('#goals'); }); $('#pop').append(el); Snd.pr(); haptic([40,40,120]);
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),400); },4200);
}
/* the medals that belong to goals join the others */
const achStatsBase=achStats;
achStats=function(){ const s=achStatsBase(), gl=(S.goals&&S.goals.list)||[]; s.goalsSet=gl.length; s.stagesDone=gl.reduce((n,g)=>n+(g.stages||[]).filter(x=>x.done).length,0); s.goalsDone=gl.filter(g=>g.status==='done').length; return s; };
ACH.push({id:'gs',t:'מטרה ראשונה',d:'מטרה עם שלבים בדרך',v:s=>[s.goalsSet,1]},{id:'gst',t:'שלב ראשון',d:'שלב אחד בדרך למטרה',v:s=>[s.stagesDone,1]},{id:'gst5',t:'חמישה שלבים',d:'חמישה שלבים שהושלמו',v:s=>[s.stagesDone,5]},{id:'gd',t:'מטרה הושגה',d:'הגעת ליעד שהצבת לעצמך',v:s=>[s.goalsDone,1]});

/* ---------- goals: pieces of the page ---------- */
const GSTATE={ahead:['מקדים את התוכנית','good'],on:['בקצב','on'],behind:['מאחורי התוכנית','late'],new:['רק התחלנו','on'],done:['הושגה','good']};
const gDate=d=>GoalKit.heDate(d,todayKey());
function goalRing(pct,col,done){
  const C=2*Math.PI*40, p=Math.max(0,Math.min(1,pct||0));
  const el=h('div',{class:'gring',role:'img','aria-label':`${Math.round(p*100)} אחוז מהדרך`,html:`<svg viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="40" fill="none" stroke="var(--card3)" stroke-width="9"/><circle class="p" cx="48" cy="48" r="40" fill="none" stroke="${done?'var(--good)':col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${FRESH?C:C*(1-p)}"/></svg><div class="v"><span>${Math.round(p*100)}<small>%</small></span></div>`});
  if(FRESH) requestAnimationFrame(()=>requestAnimationFrame(()=>{ const c=el.querySelector('circle.p'); if(c) c.style.strokeDashoffset=String(C*(1-p)); }));
  return el;
}
/* weigh-ins since the goal began, with the target as a dashed line; time runs left to right like the other charts */
function weightSpark(g){
  const ws=(S.body.w||[]).filter(x=>x.d>=addDays(g.created,-1)); if(ws.length<2) return null;
  const W=320,H=64,px=8,pt=10,pb=10; const vals=ws.map(x=>x.kg).concat([g.p.to]); const mn=Math.min(...vals), mx=Math.max(...vals), span=(mx-mn)||1;
  const t0=new Date(ws[0].d).getTime(), t1=Math.max(new Date(ws[ws.length-1].d).getTime(),t0+86400000);
  const X=d=>px+(new Date(d).getTime()-t0)/(t1-t0)*(W-2*px), Y=v=>pt+(1-(v-mn)/span)*(H-pt-pb);
  const pts=ws.map(x=>`${X(x.d).toFixed(1)},${Y(x.kg).toFixed(1)}`).join(' '); const lastP=ws[ws.length-1];
  return h('div',{role:'img','aria-label':`${ws.length} שקילות, מ-${fmtW(ws[0].kg)} עד ${fmtW(lastP.kg)} ק״ג`,html:`<svg class="gspark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><line class="tg" x1="${px}" x2="${W-px}" y1="${Y(g.p.to).toFixed(1)}" y2="${Y(g.p.to).toFixed(1)}"/><polyline class="ln" points="${pts}"/><circle class="pt" cx="${X(lastP.d).toFixed(1)}" cy="${Y(lastP.kg).toFixed(1)}" r="4"/></svg>`});
}
function goalHero(g,P){
  const T=GoalKit.typeOf(g.kind), col=`var(--g-${T.col})`, done=g.status==='done', st=GSTATE[P.state]||GSTATE.on;
  const box=h('div',{class:'ghero',style:`--c:${col}`});
  box.append(h('div',{class:'row',style:'align-items:flex-start'},h('div',{class:'grow'},h('div',{class:'gk'},ic(T.icon),h('span',{},T.t)),h('div',{class:'gt'},g.title)),h('button',{class:'iconbtn',type:'button',html:I('dots'),'aria-label':'אפשרויות למטרה',onclick:()=>goalMenu(g)})));
  const facts=h('div',{class:'grow'});
  if(P.curText&&P.toText) facts.append(h('div',{class:'gnum'},h('b',{},P.curText),h('span',{class:'arr','aria-hidden':'true'},'←'),h('span',{},P.toText)));
  else if(P.toText) facts.append(h('div',{class:'gnum'},h('b',{},P.toText)));
  facts.append(h('div',{class:'small muted',style:'margin-top:2px'},done?`הושגה ב-${gDate(g.doneAt)}`:(g.status==='off'?'המטרה הופסקה':P.leftText)));
  if(g.status==='on') facts.append(h('div',{class:'gmeta'},h('span',{class:'gst '+st[1]},st[0]),g.due?h('span',{},`יעד: ${gDate(g.due)}`):null));
  box.append(h('div',{class:'hero-row',style:'margin-top:4px'},goalRing(P.pct,col,done),facts));
  if(g.kind==='lose'||g.kind==='gain'){ const sp=weightSpark(g); if(sp) box.append(sp); }
  return box;
}
function goalNow(g,P){
  const st=P.stage; if(!st||g.status!=='on') return null;
  const card=h('div',{class:'card gnow'});
  card.append(h('div',{class:'gn-h'},h('span',{class:'k'},'מה עושים עכשיו'),h('span',{class:'small muted'},`שלב ${P.idx+1} מתוך ${P.total}`)),h('div',{class:'gn-t'},st.t),st.sub?h('div',{class:'small muted',style:'margin-top:2px'},st.sub):null);
  card.append(h('div',{class:'hbar2','aria-hidden':'true',style:'margin-top:10px'},h('i',{style:`width:${Math.round(P.stagePct*100)}%`})));
  if(st.todo&&st.todo.length) card.append(h('ul',{class:'gtodo'},...st.todo.map(t=>h('li',{},ic('check'),h('span',{},t)))));
  if(P.need) card.append(h('div',{class:'banner',style:'margin:14px 0 0'},ic('info'),h('span',{},P.need==='weighin'?'עבר יותר משבוע מאז השקילה האחרונה. בלי שקילה אי אפשר לדעת איפה עומדים.':(P.need==='run'?'בעשרת הימים האחרונים לא נרשם אימון סבולת.':'בעשרת הימים האחרונים לא נרשם סט בתרגיל הזה.'))));
  if(st.why) card.append(h('p',{class:'gwhy'},st.why));
  const k=(st.m||{}).k; if(k==='manual'||k==='event') card.append(h('button',{class:'btn sec2',type:'button',style:'margin-top:12px',onclick:()=>doneStage(g,P.idx)},k==='event'?'סיימתי את המרוץ':'השלב הושלם'));
  return card;
}
function goalWeekData(g){ if(g.status!=='on') return null; const wk=GoalKit.week(g,goalData(),1); return g.created>=wk.until?null:wk; }      // null: the goal did not exist yet that week
function goalWeekCard(g){
  const wk=goalWeekData(g); if(!wk) return null;
  return h('div',{class:'card gweek '+wk.tone},h('div',{class:'gw-h'},ic(wk.moved?'trend':'cal'),h('div',{class:'grow'},h('div',{class:'k'},wk.title),h('div',{class:'small muted'},`השבוע שעבר · ${fmtDate(wk.key)} עד ${fmtDate(addDays(wk.until,-1))}`))),...wk.lines.map(l=>h('p',{},l)),h('p',{class:'b'},wk.close));
}
function stageHow(s){ const k=(s.m||{}).k; return k==='manual'?'מסמנים אותו ביד כשהוא הושלם.':k==='event'?'מסמנים אותו אחרי המרוץ.':k==='rest'?'נסגר לבד כשהזמן עובר.':(k==='weight'||k==='keep')?'נסגר לבד לפי השקילות.':'נסגר לבד לפי מה שנרשם ביומן.'; }
function goalStages(g,P,plain){
  const box=h('div',{class:'list stgs'}), tk=todayKey();
  g.stages.forEach((s,i)=>{ const cur=i===P.idx&&g.status==='on', done=!!s.done; const when=done?`הושלם ב-${gDate(s.done)}`:(cur&&s.until<tk?`תוכנן עד ${gDate(s.until)}`:`עד ${gDate(s.until)}`);
    const inner=[h('span',{class:'dot'},done?ic('check'):String(i+1)),h('span',{class:'grow'},h('span',{class:'t'},s.t),s.sub?h('span',{class:'s'},s.sub):null,h('span',{class:'d'},when))];
    box.append(plain?h('div',{class:'stg'},...inner):h('button',{class:'stg pressable'+(done?' done':'')+(cur?' cur':''),type:'button',onclick:()=>stageSheet(g,i)},...inner,h('span',{class:'chev',html:I('chev')}))); });
  return box;
}
function stageSheet(g,i){
  const s=g.stages[i], P=GoalKit.progress(g,goalData()); const body=h('div',{},h('div',{class:'small b muted'},`שלב ${i+1} מתוך ${g.stages.length}`),h('h2',{},s.t));
  if(s.sub) body.append(h('p',{class:'small muted',style:'margin:0 0 10px'},s.sub));
  if(s.why) body.append(h('p',{style:'margin:0 0 4px;line-height:1.6'},s.why));
  if(s.todo&&s.todo.length) body.append(h('ul',{class:'gtodo'},...s.todo.map(t=>h('li',{},ic('check'),h('span',{},t)))));
  body.append(h('p',{class:'small muted',style:'margin:14px 0 0;line-height:1.55'},s.done?`הושלם ב-${gDate(s.done)}.`:`מתוכנן מ-${gDate(s.from)} עד ${gDate(s.until)}, ${GoalKit.heWeeks(s.weeks)}. ${stageHow(s)}`));
  const k=(s.m||{}).k;
  if(!s.done&&g.status==='on'&&i===P.idx&&(k==='manual'||k==='event')) body.append(h('button',{class:'btn',type:'button',style:'margin-top:14px',onclick:()=>{ Sheet.close(); setTimeout(()=>doneStage(g,i),320); }},k==='event'?'סיימתי את המרוץ':'השלב הושלם'));
  if(g.kind==='free'&&!s.done&&g.status==='on') body.append(h('button',{class:'btn sec2',type:'button',style:'margin-top:8px',onclick:()=>{ Sheet.close(); setTimeout(()=>renameSheet('שם השלב',s.t,v=>{ s.t=v; saveGoals(); render(); }),320); }},'שינוי שם השלב'));
  Sheet.show(body);
}
function doneStage(g,i){ if(!GoalKit.markStage(g,i,goalData())) return; saveGoals(); stageBanner(g,g.stages[i],g.status==='done',1); goalAch(1300); goalsSoon(); render(); }
function renameSheet(title,cur,onSave){
  const inp=h('input',{type:'text',value:cur||'',maxlength:'80'});
  Sheet.show(h('div',{},h('h2',{},title),h('div',{class:'fld'},inp),h('button',{class:'btn',type:'button',onclick:()=>{ const v=inp.value.trim(); if(!v) return; Sheet.close(); onSave(v); }},'שמור'))); setTimeout(()=>{ try{ inp.focus(); }catch(e){} },350);
}
function weighSheet(){
  const lw=lastWeigh(); const inp=h('input',{type:'number',inputmode:'decimal',step:'0.1',min:'30',max:'300',value:lw?lw.kg:(S.profile.weight||''),placeholder:'ק״ג','aria-label':'המשקל היום בקילוגרם'});
  const go2=()=>{ const v=Math.round(pnum(inp.value)*10)/10; if(!(v>=30&&v<=300)){ toast('מקלידים משקל בקילוגרם'); return; } const prev=lastWeigh(); addWeigh(v); Sheet.close(); haptic(12);
    const d=prev&&prev.d!==todayKey()?Math.round((v-prev.kg)*10)/10:0; toast(d?`נרשם: ${fmtW(v)} ק״ג · ${d<0?'ירדת':'עלית'} ${fmtW(Math.abs(d))} מהשקילה הקודמת`:`נרשם: ${fmtW(v)} ק״ג`); render(); };
  inp.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); go2(); } });
  Sheet.show(h('div',{},h('h2',{},'שקילה'),h('p',{class:'small muted',style:'margin:0 0 12px;line-height:1.5'},lw?`בפעם הקודמת, ${fmtDate(lw.d)}: ${fmtW(lw.kg)} ק״ג. הכי מדויק בבוקר, לפני אוכל.`:'הכי מדויק בבוקר, לפני אוכל, באותו יום בשבוע.'),h('div',{class:'fld'},h('label',{},'המשקל היום, בק״ג'),inp),h('button',{class:'btn',type:'button',onclick:go2},'שמור')));
  setTimeout(()=>{ try{ inp.focus(); inp.select(); }catch(e){} },350);
}
function weighList(){
  const body=h('div',{},h('h2',{},'השקילות שלי')); const draw=()=>{ const l=h('div',{class:'list'}); const ws=(S.body.w||[]).slice().reverse().slice(0,40);
    ws.forEach((x,i)=>{ const nx=ws[i+1]; const d=nx?Math.round((x.kg-nx.kg)*10)/10:0; l.append(h('div',{class:'item'},h('div',{class:'grow'},h('div',{class:'t'},`${fmtW(x.kg)} ק״ג`),h('div',{class:'s'},`${fmtDate(x.d)}${d?' · '+(d<0?'ירידה של ':'עלייה של ')+fmtW(Math.abs(d)):''}`)),h('button',{class:'iconbtn sm',type:'button','aria-label':'מחיקת השקילה',html:I('trash'),style:'color:var(--bad);background:none',onclick:()=>{ S.body.w=S.body.w.filter(y=>y.d!==x.d); const lw=lastWeigh(); if(lw){ S.profile.weight=lw.kg; save('profile',S.profile); } save('body',S.body); draw(); }}))); });
    if(!ws.length) l.append(h('div',{class:'empty'},'עוד אין שקילות.')); const old=body.querySelector('.list'); if(old) old.replaceWith(l); else body.append(l); };
  draw(); body.append(h('button',{class:'btn',type:'button',style:'margin-top:4px',onclick:()=>{ Sheet.close(); setTimeout(weighSheet,320); }},'שקילה חדשה')); Sheet.show(body,()=>render());
}
function goalMenu(g){
  const body=h('div',{},h('h2',{},g.title)), list=h('div',{class:'list'}), P=GoalKit.progress(g,goalData());
  const row=(icn,t,sub,fn,bad)=>list.append(h('button',{class:'item pressable',type:'button',onclick:()=>{ Sheet.close(); setTimeout(fn,320); }},h('div',{class:'th',style:`width:40px;height:40px;border-radius:var(--r-s);color:${bad?'var(--bad)':'var(--accent-t)'};background:${bad?'rgba(248,113,113,.14)':'var(--accent-soft)'}`},ic(icn)),h('div',{class:'grow'},h('div',{class:'t'},t),sub?h('div',{class:'s'},sub):null)));
  if(g.status==='on'){
    if(g.kind==='lose'||g.kind==='gain') row('scale','השקילות שלי',plural((S.body.w||[]).length,'שקילה אחת','שקילות'),weighList);
    if(P.state==='behind') row('cal','עדכון התאריכים מהיום','השלבים נשארים, התאריכים זזים',()=>{ GoalKit.replan(g,goalData()); saveGoals(); render(); toast('התאריכים עודכנו'); });
    if(goalsOn()[0]!==g) row('star','להפוך למטרה הראשית','היא תופיע ראשונה',()=>{ S.goals.list=[g].concat(S.goals.list.filter(x=>x!==g)); saveGoals(); goReplace('#goals'); });
    row('edit','שינוי שם המטרה','',()=>renameSheet('שם המטרה',g.title,v=>{ g.title=v; saveGoals(); render(); }));
    row('pause','הפסקת המטרה','היא נשמרת ברשימת המטרות הקודמות',()=>{ g.status='off'; g.doneAt=todayKey(); saveGoals(); toast('המטרה הופסקה'); if(route.page==='goal') history.back(); else render(); });
  } else if(g.status==='off') row('play','חזרה למטרה','התאריכים יתעדכנו מהיום',()=>{ g.status='on'; g.doneAt=''; GoalKit.replan(g,goalData()); saveGoals(); render(); toast('המטרה חזרה לפעילות'); });
  row('trash','מחיקת המטרה','',()=>confirmSheet('למחוק את המטרה?','השלבים וההתקדמות שלה יימחקו. האימונים והשקילות נשארים.',()=>{ S.goals.list=S.goals.list.filter(x=>x.id!==g.id); saveGoals(); toast('המטרה נמחקה'); if(route.page==='goal') history.back(); else render(); },'כן, למחוק'),true);
  body.append(list); Sheet.show(body);
}
function goalDock(g){
  if(g.status!=='on') return; const k=g.kind; let b=null;
  const mk=(icn,label,fn)=>h('button',{class:'btn sgo',type:'button',onclick:fn},ic(icn),h('span',{},label));
  if(k==='lose'||k==='gain') b=mk('scale','שקילה',weighSheet);
  else if((k==='lift'||k==='reps')&&getEx(g.p.ex)) b=mk('plus','רישום סט בתרגיל',()=>go('#ex-'+g.p.ex));
  else if(k==='run') b=mk('plus','רישום ריצה',()=>go('#ex-running'));
  else if(k==='tri') b=mk('plus','רישום אימון',()=>pickSheet('מה עשית?','',[['x-swimming','שחייה'],['cycling','רכיבה'],['running','ריצה']],'',id=>go('#ex-'+id)));
  if(b) Dock.set(b);
}
function goalDetail(wrap,g){
  const P=GoalKit.progress(g,goalData());
  wrap.append(goalHero(g,P)); const now=goalNow(g,P); if(now) wrap.append(now); const wk=goalWeekCard(g); if(wk) wrap.append(wk);
  wrap.append(h('div',{class:'sec'},h('h2',{},'השלבים'),h('span',{class:'small muted'},`${P.done} מתוך ${P.total}`)),goalStages(g,P));
  goalDock(g);
}
function goalRow(g){
  const T=GoalKit.typeOf(g.kind), D=goalData(); const sub=g.status==='done'?`הושגה ב-${gDate(g.doneAt)}`:(g.status==='off'?'הופסקה':GoalKit.line(g,D));
  return h('button',{class:'item pressable',type:'button',onclick:()=>go('#goal-'+g.id)},h('div',{class:'th',style:`width:44px;height:44px;border-radius:var(--r-m);color:var(--g-${T.col});background:color-mix(in srgb,var(--g-${T.col}) 16%,transparent)`},ic(g.status==='done'?'trophy':T.icon)),h('div',{class:'grow'},h('div',{class:'t ell'},g.title),h('div',{class:'s ell'},sub)),h('span',{class:'chev',html:I('chev')}));
}
function achStrip(){
  const got=S.prefs.ach||{}; const mine=ACH.filter(a=>got[a.id]).sort((a,b)=>String(got[b.id]).localeCompare(String(got[a.id]))); const n=mine.length, top=mine.slice(0,3);
  return h('button',{class:'achstrip pressable',type:'button',onclick:()=>go('#ach')},h('div',{class:'as-i'},...(top.length?top.map(()=>h('span',{class:'m on'},ic('medal'))):[h('span',{class:'m'},ic('medal'))])),h('div',{class:'grow'},h('div',{class:'k'},'ההישגים שלי'),h('div',{class:'small muted ell'},n?`${n} מתוך ${ACH.length} · האחרון: ${top[0].t}`:`${ACH.length} הישגים מחכים לך`)),h('span',{class:'chev',html:I('chev')}));
}

/* ---------- goals: the pages ---------- */
function goalsPage(){
  header('מטרות והישגים',{back:'#more'}); const wrap=h('div'); goalsSoon();
  const on=goalsOn(), past=goalsPast();
  wrap.append(h('div',{class:'display'},'מטרות והישגים'));
  if(!on.length){
    wrap.append(h('div',{class:'ghero'},h('div',{class:'hero-row'},mascot('cheer')||h('div',{class:'restico'},ic('target')),h('div',{class:'grow'},h('div',{class:'k',style:'font-size:22px;line-height:1.2'},'מה המטרה שלך?'),h('div',{class:'small muted',style:'margin-top:4px;line-height:1.5'},'כותבים אותה במילים שלך או בוחרים מהרשימה. האפליקציה בונה ממנה שלבים, ועוקבת אחרי ההתקדמות.'))),h('button',{class:'btn',type:'button',style:'margin-top:14px',onclick:newGoal},'בוחרים מטרה')));
  } else {
    goalDetail(wrap,on[0]);
    if(on.length>1){ wrap.append(h('div',{class:'sec'},h('h2',{},'עוד מטרות'))); const l=h('div',{class:'list'}); on.slice(1).forEach(g=>l.append(goalRow(g))); wrap.append(l); }
    if(on.length<3) wrap.append(h('button',{class:'lnkline center',type:'button',onclick:newGoal},ic('plus'),h('span',{},'מטרה נוספת')));
  }
  wrap.append(achStrip());
  if(past.length){ wrap.append(h('div',{class:'sec'},h('h2',{},'מטרות קודמות'))); const l=h('div',{class:'list'}); past.slice().reverse().forEach(g=>l.append(goalRow(g))); wrap.append(l); }
  return wrap;
}
function goalPage(){
  const g=goalById(route.param); header('מטרה',{back:'#goals'}); const wrap=h('div');
  if(!g){ wrap.append(h('div',{class:'empty'},ic('target'),h('div',{},'המטרה לא נמצאה.'))); return wrap; }
  goalsSoon(); goalDetail(wrap,g); return wrap;
}
function goReplace(hash){ if(NAVS.length>1&&NAVS[NAVS.length-2]===hash){ history.back(); return; } NAV_REPL=true; location.replace(hash); }

/* ---------- goals: taking in a new one. three steps: the goal, what is still missing, the plan ---------- */
const GW={step:0,text:'',kind:'',p:{},due:'',dueMode:'',ans:{},res:null,params:null,err:'',fromText:false};
function newGoal(){ Object.assign(GW,{step:0,text:'',kind:'',p:{},due:'',dueMode:'',ans:{},res:null,params:null,err:'',fromText:false}); go('#goalnew'); }
function gwTo(step){ GW.step=step; render(); $('#scroll').scrollTop=0; }
function goalNewPage(){
  header('מטרה חדשה',{back:'#goals'}); const wrap=h('div',{class:'gwiz'});
  wrap.append(h('div',{class:'gw-dots','aria-hidden':'true'},...[0,1,2].map(i=>h('i',{class:i===GW.step?'on':(i<GW.step?'was':'')}))));
  if(GW.step===1&&GW.kind) gwAsk(wrap); else if(GW.step===2&&GW.res) gwPlan(wrap); else gwStart(wrap);
  return wrap;
}
function gwStart(wrap){
  const ta=h('textarea',{rows:'2',placeholder:'למשל: לרדת 8 קילו עד הקיץ',maxlength:'200','aria-label':'המטרה במילים שלך'}); ta.value=GW.text;
  const btn=h('button',{class:'btn',type:'button',disabled:!GW.text.trim()},'המשך');
  const next=()=>{ const t=ta.value.trim(); if(!t) return; const u=GoalKit.understand(t,{today:todayKey(),weight:(lastWeigh()||{}).kg||S.profile.weight,parse:VoiceLog.parse});
    Object.assign(GW,{text:t,kind:u.kind,p:u.p,due:u.due,dueMode:u.due?'date':'',ans:{},err:'',fromText:true}); gwTo(1); };
  ta.addEventListener('input',()=>{ GW.text=ta.value; btn.disabled=!ta.value.trim(); });
  ta.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); next(); } });
  btn.addEventListener('click',next);
  wrap.append(h('div',{class:'display'},'מה המטרה שלך?'),h('p',{class:'lead'},'כותבים אותה במילים שלך. למשל: חצי מרתון עד מרץ, בנץ׳ 100 קילו, איירונמן.'),h('div',{class:'fld'},ta),btn);
  wrap.append(h('div',{class:'sec'},h('h2',{},'או בוחרים מהרשימה')));
  const grid=h('div',{class:'gtiles'});
  GoalKit.TYPES.forEach(T=>grid.append(h('button',{class:'gtile pressable',type:'button',style:`--c:var(--g-${T.col})`,onclick:()=>{ Object.assign(GW,{text:'',kind:T.k,p:{},due:'',dueMode:'',ans:{},err:'',fromText:false}); gwTo(1); }},h('span',{class:'ic'},ic(T.icon)),h('span',{class:'t'},T.t),h('span',{class:'s'},T.s))));
  wrap.append(grid);
}
function gwAsk(wrap){
  const T=GoalKit.typeOf(GW.kind), D=goalData(), tk=todayKey(), free=GW.kind==='free';
  wrap.append(h('div',{class:'gk',style:`--c:var(--g-${T.col})`},ic(T.icon),h('span',{},GW.fromText?(free?'מטרה במילים שלך':'הבנתי: '+T.t):T.t)));
  wrap.append(h('div',{class:'display',style:'font-size:26px;margin-bottom:12px'},GW.text||T.t));
  if(GW.fromText&&free) wrap.append(h('p',{class:'lead'},'את המטרה הזאת האפליקציה לא יודעת למדוד לבד, אז בונים את השלבים ביד. אם היא דומה לאחת מהרשימה, אפשר לחזור ולבחור אותה.'));
  if(free){
    const ti=h('input',{type:'text',value:GW.ans.title!=null?GW.ans.title:GW.text,placeholder:'המטרה במילים שלך',maxlength:'80'}); GW.ans.title=ti.value; ti.addEventListener('input',()=>{ GW.ans.title=ti.value; });
    wrap.append(h('div',{class:'fld'},h('label',{},'המטרה'),ti)); GW.ans.stages=GW.ans.stages||['','','',''];
    const fs=h('div',{class:'fld'},h('label',{},'השלבים בדרך (אפשר להשאיר ריק)'));
    GW.ans.stages.forEach((sv,i)=>{ const si=h('input',{type:'text',value:sv,placeholder:`שלב ${i+1}`,maxlength:'60','aria-label':`שלב ${i+1}`}); si.addEventListener('input',()=>{ GW.ans.stages[i]=si.value; }); fs.append(si); }); wrap.append(fs);
  }
  GoalKit.ask(GW.kind,Object.assign({},GW.p,GW.ans),D).forEach(f=>{
    const val=(GW.ans[f.k]!=null&&GW.ans[f.k]!=='')?GW.ans[f.k]:f.def;
    if(f.type==='num'){
      const inp=h('input',{type:'number',inputmode:'decimal',step:String(f.step||1),min:String(f.min),max:String(f.max),value:(val===''||val==null)?'':val,placeholder:f.unit});
      if(val!==''&&val!=null) GW.ans[f.k]=val; inp.addEventListener('input',()=>{ GW.ans[f.k]=inp.value===''?'':pnum(inp.value); });
      wrap.append(h('div',{class:'fld'},h('label',{},`${f.t} · ${f.unit}`),inp,f.why?h('div',{class:'small muted'},f.why):null));
    } else if(f.type==='pick'){
      GW.ans[f.k]=val; const known=f.opts.some(o=>String(o[0])===String(val)); const one=f.opts.some(o=>String(o[1]).length>12);
      const grid=h('div',{class:'typegrid'+(one?' one':'')}); f.opts.forEach(([v,l])=>grid.append(h('button',{class:'typebtn pressable'+(String(val)===String(v)?' on':''),type:'button','aria-pressed':String(val)===String(v)?'true':'false',onclick:()=>{ GW.ans[f.k]=v; delete GW.ans.from; render(); }},h('span',{},l))));
      const fld=h('div',{class:'fld'},h('label',{},f.t),grid);
      if(f.other){ grid.append(h('button',{class:'typebtn pressable'+(known?'':' on'),type:'button','aria-pressed':known?'false':'true',onclick:()=>{ GW.ans[f.k]=known?15:val; render(); }},h('span',{},'מרחק אחר')));
        if(!known){ const oi=h('input',{type:'number',inputmode:'decimal',step:String(f.other.step),min:String(f.other.min),max:String(f.other.max),value:val,'aria-label':'מרחק בקילומטרים'}); oi.addEventListener('input',()=>{ const v=pnum(oi.value); if(v>0) GW.ans[f.k]=v; }); fld.append(oi); } }
      wrap.append(fld);
    } else if(f.type==='ex'){
      GW.ans.ex=val; const opts=f.opts.slice(); if(!opts.some(o=>o[0]===val)){ const e=getEx(val); if(e) opts.push([val,e.he]); }
      const sel=h('select',{},...opts.map(([v,l])=>h('option',{value:v,selected:v===val},l)),h('option',{value:'__other'},'תרגיל אחר…'));
      sel.addEventListener('change',()=>{ const pickIt=id=>{ GW.ans.ex=id; delete GW.ans.from; delete GW.ans.to; render(); };
        if(sel.value==='__other'){ sel.value=val; pickExerciseSheet(e=>pickIt(e.id),'באיזה תרגיל?'); } else pickIt(sel.value); });
      wrap.append(h('div',{class:'fld'},h('label',{},f.t),sel));
    }
  });
  if(GW.kind!=='habit'){
    const chips=h('div',{class:'gchips'}); [['','בלי תאריך'],['3m','3 חודשים'],['6m','חצי שנה'],['12m','שנה'],['date','תאריך אחר']].forEach(([m,l])=>chips.append(h('button',{class:'gchip'+(GW.dueMode===m?' on':''),type:'button','aria-pressed':GW.dueMode===m?'true':'false',onclick:()=>{ GW.dueMode=m; GW.due=m==='3m'?addDays(tk,91):m==='6m'?addDays(tk,182):m==='12m'?addDays(tk,365):(m==='date'?(GW.due||addDays(tk,90)):''); render(); }},l)));
    const fld=h('div',{class:'fld'},h('label',{},(GW.kind==='run'||GW.kind==='tri')?'מתי המרוץ? (לא חובה)':'עד מתי? (לא חובה)'),chips);
    if(GW.dueMode==='date'){ const di=h('input',{type:'date',value:GW.due,min:addDays(tk,7),'aria-label':'תאריך היעד'}); di.addEventListener('change',()=>{ GW.due=di.value; }); fld.append(di); }
    wrap.append(fld);
  }
  if(GW.err) wrap.append(h('div',{class:'banner',role:'alert'},ic('info'),h('span',{},GW.err)));
  wrap.append(h('button',{class:'btn',type:'button',onclick:gwBuild},'בונים את התוכנית'),h('button',{class:'lnkline center',type:'button',onclick:()=>{ GW.err=''; gwTo(0); }},'חזרה'));
}
function gwBuild(){
  const D=goalData(), a=GW.ans, k=GW.kind; let p;
  if(k==='lose'||k==='gain') p={from:+a.from,to:+a.to,height:+a.height||0};
  else if(k==='lift') p={ex:a.ex,from:+a.from,to:+a.to,reps:1};
  else if(k==='reps') p={ex:a.ex,from:+a.from||0,to:+a.to};
  else if(k==='run') p={km:+a.km,from:+a.from||0};
  else if(k==='tri') p={race:a.race,level:a.level};
  else if(k==='habit') p={perWeek:+a.perWeek,weeks:+a.weeks};
  else p={title:(a.title||'').trim(),stages:a.stages||[]};
  const r=GoalKit.build(k,p,D,GW.due,GW.text);
  if(r.err){ GW.err=r.err; render(); return; }
  GW.err=''; GW.res=r; GW.params=p; gwTo(2);
}
function gwPlan(wrap){
  const r=GW.res;
  if(r.stop){ wrap.append(h('div',{class:'display',style:'font-size:26px;margin-bottom:12px'},'כאן האפליקציה עוצרת'),h('div',{class:'banner'},ic('info'),h('span',{},r.stop)),h('button',{class:'btn',type:'button',onclick:()=>{ GW.res=null; gwTo(0); }},'בחירת מטרה אחרת')); return; }
  const g=r.goal, T=GoalKit.typeOf(g.kind), v=r.verdict;
  wrap.append(h('div',{class:'gk',style:`--c:var(--g-${T.col})`},ic(T.icon),h('span',{},'התוכנית שלך')),h('div',{class:'display',style:'font-size:28px;margin-bottom:12px'},g.title));
  wrap.append(h('div',{class:'banner'+(v.state==='ok'?' good':'')},ic(v.state==='ok'?'check':'info'),h('span',{},v.text)));
  (r.notes||[]).forEach(n=>wrap.append(h('div',{class:'banner blue'},ic('info'),h('span',{},n))));
  wrap.append(h('div',{class:'sec'},h('h2',{},plural(g.stages.length,'שלב אחד','שלבים')),h('span',{class:'small muted'},`יעד: ${gDate(g.due)}`)),goalStages(g,{idx:-1},true));
  wrap.append(h('button',{class:'btn',type:'button',onclick:gwSave},'מתחילים'),h('button',{class:'lnkline center',type:'button',onclick:()=>gwTo(1)},'חזרה לשינוי'));
}
function gwSave(){
  const r=GW.res; if(!r||!r.goal) return; const g=r.goal, p=GW.params||{}, P=S.profile;
  if(g.kind==='lose'||g.kind==='gain'){ if(p.height>0&&!(+P.height>0)) P.height=p.height; addWeigh(g.p.from); }
  if(g.kind==='habit') P.weekly=g.p.perWeek;
  const focus={lose:'fatloss',gain:'hypertrophy',lift:'strength',run:'endurance',tri:'endurance'}[g.kind]; if(focus) P.goal=focus;
  save('profile',P);
  S.goals.list=S.goals.list||[]; S.goals.list.push(g); saveGoals(); GW.res=null; GW.step=0; GW.text='';
  toast('המטרה נשמרה. מתחילים.'); haptic(15); goalAch(900); goReplace('#goals');
}

/* ---------- goals: on the other screens ---------- */
function goalHubBox(){
  const g=goalsOn()[0], D=goalData();
  if(!g){ const n=ACH.filter(a=>(S.prefs.ach||{})[a.id]).length; return h('button',{class:'hubbox wide pressable',type:'button',style:'--c:var(--g-chest)',onclick:()=>go('#goals')},h('div',{class:'ic'},ic('target')),h('div',{class:'grow'},h('div',{class:'t'},'מטרות והישגים'),h('div',{class:'s'},n?`בוחרים מטרה · ${plural(n,'הישג אחד','הישגים')}`:'כותבים מטרה ומקבלים שלבים')),h('span',{class:'chev',html:I('chev')})); }
  const T=GoalKit.typeOf(g.kind), P=GoalKit.progress(g,D);
  return h('button',{class:'hubbox wide pressable',type:'button',style:`--c:var(--g-${T.col})`,onclick:()=>go('#goals')},h('div',{class:'ic'},ic(T.icon)),h('div',{class:'grow'},h('div',{class:'t'},'מטרות והישגים'),h('div',{class:'s ell'},`${g.title} · ${GoalKit.line(g,D)}`),h('div',{class:'gp','aria-hidden':'true'},h('i',{style:`width:${Math.round(P.pct*100)}%`}))),h('span',{class:'chev',html:I('chev')}));
}
function goalProfileRow(){ const g=goalsOn()[0]; return h('button',{class:'card pressable',type:'button',style:'width:100%;text-align:start',onclick:()=>go('#goals')},h('div',{class:'row'},h('div',{class:'grow'},h('div',{class:'k'},g?g.title:'המטרה שלי'),h('div',{class:'small muted'},g?GoalKit.line(g,goalData()):'בוחרים מטרה, והאפליקציה בונה את השלבים')),ic('chev'))); }
/* on the Today screen, one card at most: the week that ended (Sunday to Tuesday, once), or an invitation to set a goal (once) */
function goalCard(){
  const tk=todayKey(), dow=new Date(tk).getDay(), g=goalsOn()[0];
  const card=(icn,k,s,onTap,onSeen)=>h('div',{class:'recap pressable',role:'button',tabindex:'0',onclick:()=>{ onSeen(); onTap(); }},h('div',{class:'rc-i'},ic(icn)),h('div',{class:'grow'},h('div',{class:'rc-k'},k),h('div',{class:'rc-s ell'},s)),h('button',{class:'iconbtn sm',type:'button','aria-label':'סגירה',html:I('x'),onclick:ev=>{ ev.stopPropagation(); onSeen(); render(); }}));
  if(!g){ if(S.prefs.seen.goalNudge||((S.goals&&S.goals.list)||[]).length||allSessions().length<3) return null; return card('target','יש לך מטרה?','כותבים אותה, והאפליקציה בונה את השלבים',newGoal,()=>{ S.prefs.seen.goalNudge=tk; save('prefs',S.prefs); }); }
  if(dow>2) return null; const wk=goalWeekData(g); if(!wk||g.seenWeek===wk.key) return null;
  return card(wk.moved?'trend':'target',wk.title,wk.lines[0]||g.title,()=>goalWeekSheet(g,wk),()=>{ g.seenWeek=wk.key; saveGoals(); });
}
function goalWeekSheet(g,wk){ Sheet.show(h('div',{},h('div',{class:'small b muted'},g.title),h('h2',{},wk.title),...wk.lines.map(l=>h('p',{style:'margin:0 0 8px;line-height:1.6'},l)),h('p',{class:'b',style:'margin:4px 0 14px'},wk.close),h('button',{class:'btn',type:'button',onclick:()=>{ Sheet.close(); setTimeout(()=>go('#goals'),320); }},'למטרה ולשלבים')),()=>render()); }

/* ---------- voice: one sentence in, one set in the journal, one sentence back ---------- */
const VO={rec:null,say:'',ok:null,heard:'',last:null,snap:[],ping:null,pulled:0,auto:false,busy:false,ix:null,ixN:0};
function voiceEnv(){
  const tk=todayKey(), all=allEx(); if(!VO.ix||VO.ixN!==all.length){ VO.ix=VoiceLog.buildIndex(all); VO.ixN=all.length; }
  const stars={}, pop={}; (S.deck.stars||[]).forEach(id=>{ stars[id]=1; }); POPULAR.forEach(id=>{ pop[id]=1; });
  return {index:VO.ix,logs:S.logs,plan:((planFor(tk)||{}).ex||[]).map(x=>x.id),stars,popular:pop,last:VO.last,date:tk,now:Date.now()};
}
function voiceApply(item,src){
  const id=item.ex, before=S.logs[id]?JSON.stringify(S.logs[id]):null, log=S.logs[id]||{sessions:[]};
  const r=VoiceLog.applyItem(log,item); S.logs[id]=log; save('log-'+id,log);
  if(item.d===todayKey()) recordDay(); else recordDayFor(item.d,id);
  const rec={id:item.id||('l'+Date.now().toString(36)),ex:id,d:item.d,sets:item.sets,at:item.at||Date.now(),src:src||'app',no:r.setNo};
  S.vdone.last=[rec].concat(S.vdone.last||[]).slice(0,20); VO.snap=[{id:rec.id,ex:id,d:item.d,before}].concat(VO.snap).slice(0,10); VO.last={ex:id,at:Date.now()};
  return r;
}
/* only what was said while the app is open can be taken back exactly */
function voiceUndo(){
  const s=VO.snap.shift(); if(!s) return false;
  if(s.before) S.logs[s.ex]=JSON.parse(s.before); else delete S.logs[s.ex];
  save('log-'+s.ex,S.logs[s.ex]||{sessions:[]}); S.vdone.last=(S.vdone.last||[]).filter(x=>x.id!==s.id); save('vdone',S.vdone);
  if(s.d===todayKey()) recordDay(); VO.last=null; return true;
}
function voiceSay(text,opts){
  opts=opts||{}; const env=voiceEnv(), R=VoiceLog.handle(text,env), L=VoiceLog.text(R.lang);
  if(R.cmd==='undo'){ R.ok=voiceUndo(); R.say=R.ok?L.undo:L.undoNone; }
  else if(R.cmd==='today') R.say=VoiceLog.todayLine(R.lang,S.logs,env.index,todayKey());
  else if(R.ok){ voiceApply(R.item,'app'); save('vdone',S.vdone); haptic(15); if(R.judge&&/^pr/.test(R.judge.k)) Snd.pr(); else Snd.ok(); }
  VO.say=R.say; VO.ok=!!R.ok; VO.heard=text;
  if(opts.speak) voiceSpeak(R.say,R.lang);
  return R;
}
function voiceSpeak(t,lang){ try{ if(!('speechSynthesis' in window)||!t) return; const u=new SpeechSynthesisUtterance(t); u.lang=lang==='en'?'en-US':'he-IL'; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){} }
function voiceCanListen(){ return !!(window.SpeechRecognition||window.webkitSpeechRecognition); }
function voiceListen(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR){ toast('הדפדפן הזה לא תומך בזיהוי דיבור. אפשר להקליד.'); return; }
  if(VO.rec){ try{ VO.rec.stop(); }catch(e){} return; }
  const rec=new SR(); rec.lang=S.profile.vlang==='en'?'en-US':'he-IL'; rec.interimResults=true; rec.maxAlternatives=1; rec.continuous=false; let heard='';
  rec.onresult=ev=>{ let t=''; for(let i=0;i<ev.results.length;i++) t+=ev.results[i][0].transcript; heard=t; VO.heard=t; const el=$('#vheard'); if(el) el.textContent=t||'מקשיב…'; };
  rec.onerror=ev=>{ if(ev.error==='not-allowed'||ev.error==='service-not-allowed') toast('צריך לאשר לאפליקציה גישה למיקרופון'); else if(ev.error!=='no-speech'&&ev.error!=='aborted') toast('הזיהוי לא הצליח. אפשר להקליד.'); };
  rec.onend=()=>{ VO.rec=null; if(heard.trim()) voiceSay(heard.trim(),{speak:true}); if(route.page==='voice') render(); };
  try{ rec.start(); VO.rec=rec; VO.say=''; VO.heard=''; if(route.page==='voice') render(); }catch(e){ VO.rec=null; toast('המיקרופון לא נפתח'); }
}
/* what the phone assistant sent while the app was closed: taken into the journal once, on this or on any other device */
function voiceIntake(){
  const live={}; ((S.vinbox&&S.vinbox.items)||[]).forEach(it=>{ if(it&&it.id) live[it.id]=1; }); S.vdone.ids=S.vdone.ids||{};
  Object.keys(S.vdone.ids).forEach(id=>{ if(!live[id]) delete S.vdone.ids[id]; });
  const pend=VoiceLog.pending(S.vinbox,S.vdone).slice().sort((a,b)=>(a.at||0)-(b.at||0)); if(!pend.length) return 0;
  let n=0; const names=[];
  pend.forEach(it=>{ S.vdone.ids[it.id]=1; if(typeof it.ex!=='string'||!it.ex||!Array.isArray(it.sets)||!/^\d{4}-\d{2}-\d{2}$/.test(it.d||'')) return;
    it={...it,sets:it.sets.slice(0,10).map(x=>({r:+x.r,w:+x.w})).filter(x=>x.r>=0&&x.r<=7200&&x.w>=0&&x.w<=600)}; if(!it.sets.length) return;      // the inbox is data: only sane numbers enter the journal
    voiceApply(it,'siri'); n+=it.sets.length; const e=getEx(it.ex); if(e&&!names.includes(e.he)) names.push(e.he); });
  save('vdone',S.vdone);
  if(n){ toast(`נרשם בקול: ${plural(n,'סט אחד','סטים')}${names.length?' · '+names.slice(0,2).join(', '):''}`); haptic(12); render(); }
  return n;
}
async function voicePull(force){
  if(!STANDALONE||!PB.user||(!force&&Date.now()-VO.pulled<15000)) return; VO.pulled=Date.now();
  try{ const j=await PB.req('GET',`/api/collections/docs/records?perPage=1&filter=${encodeURIComponent('user="'+PB.user.id+'" && key="vinbox"')}`); const it=(j.items||[])[0]; if(!it||!it.data) return;
    S.vinbox={items:[],...it.data}; try{ localStorage.setItem('gt:vinbox',JSON.stringify(it.data)); }catch(e){} voiceIntake(); }catch(e){}
}
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) voicePull(); });
window.addEventListener('focus',()=>voicePull());
/* the personal code the phone assistant sends with each sentence. the server keeps only its fingerprint, this device keeps the code */
function voiceKey(){ try{ return localStorage.getItem('gtv:key')||''; }catch(e){ return ''; } }
async function sha256hex(s){ const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''); }
async function voiceKeyNew(){
  if(!PB.user||VO.busy) return; VO.busy=true; render();
  try{
    const key='stm_'+Array.from(crypto.getRandomValues(new Uint8Array(24))).map(x=>x.toString(36).padStart(2,'0')).join('').slice(0,40), hash=await sha256hex(key);
    const old=await PB.req('GET',`/api/collections/voice_keys/records?perPage=50&filter=${encodeURIComponent('user="'+PB.user.id+'"')}`);
    for(const it of (old.items||[])){ try{ await PB.req('DELETE','/api/collections/voice_keys/records/'+it.id); }catch(e){} }
    await PB.req('POST','/api/collections/voice_keys/records',{user:PB.user.id,hash,label:'siri'});
    try{ localStorage.setItem('gtv:key',key); }catch(e){} VO.keyInfo={id:'new'}; toast('הקוד האישי מוכן');
  }catch(e){ toast(e&&e.status===404?'השרת עוד לא תומך ברישום בקול':pbError(e)); }
  VO.busy=false; render();
}
/* the code is kept only on the device that made it; another device of the same account can still learn that one exists */
async function voiceKeyInfo(){ if(VO.keyInfo!==undefined||!PB.user) return; VO.keyInfo=null; try{ const j=await PB.req('GET',`/api/collections/voice_keys/records?perPage=1&filter=${encodeURIComponent('user="'+PB.user.id+'"')}`); VO.keyInfo=(j.items||[])[0]||null; }catch(e){ VO.keyInfo=null; } if(VO.keyInfo&&route.page==='voice') render(); }
const pbLogoutBase=PB.logout.bind(PB);
PB.logout=function(){ try{ localStorage.removeItem('gtv:key'); }catch(e){} VO.keyInfo=undefined; return pbLogoutBase(); };      // a code belongs to one account: it leaves the device with it
async function voicePing(){ if(VO.ping!=null||!STANDALONE) return; VO.ping=undefined; try{ const r=await fetch(PB_URL+'/api/setim/voice'); const j=await r.json().catch(()=>({})); VO.ping=!!(r.ok&&j&&j.ok); }catch(e){ VO.ping=false; } if(route.page==='voice') render(); }
async function copyText(t,msg){ try{ await navigator.clipboard.writeText(t); toast(msg||'הועתק'); }catch(e){ toast('ההעתקה לא הצליחה'); } }
function voiceShortcutHelp(){
  const url=PB_URL+'/api/setim/voice', key=voiceKey();
  const step=(t,d,extra)=>h('li',{},h('div',{class:'grow'},h('div',{class:'st'},t),d?h('div',{class:'sd'},d):null,extra||null));
  const code=(txt,label)=>h('div',{class:'vkey'},h('code',{},txt),h('button',{type:'button',onclick:()=>copyText(txt,label+' הועתק')},'העתקה'));
  Sheet.show(h('div',{},h('h2',{},'בונים את הקיצור, פעם אחת'),h('p',{class:'small muted',style:'margin:0 0 4px;line-height:1.55'},'באפליקציה ״קיצורים״ (Shortcuts) באייפון. שמות הפעולות כתובים באנגלית, כי כך מוצאים אותן בחיפוש.'),
    h('ol',{class:'vsteps'},
      step('קיצור חדש','לוחצים על + למעלה.'),
      step('Ask for Input','סוג הקלט: Text. השאלה: מה לרשום?'),
      step('Get Contents of URL','מדביקים את הכתובת. פותחים את החץ ובוחרים בשיטה POST ובגוף בקשה מסוג JSON.',code(url,'הכתובת')),
      step('שני שדות בגוף הבקשה','שדה בשם key עם הקוד האישי, ושדה בשם text עם התשובה מהשלב השני (Provided Input).',key?code(key,'הקוד'):null),
      step('Get Dictionary Value','בשדה Get Value for כותבים את המילה say, כדי שהקיצור ייקח את המשפט שחזר.'),
      step('Show Result','כך Siri מקריאה את התשובה. נותנים לקיצור את השם סטים.'))));
}
function voicePhone(wrap){
  if(!STANDALONE){ wrap.append(h('div',{class:'card'},h('p',{class:'small muted',style:'margin:0;line-height:1.6'},'רישום דרך Siri עובד בגרסה שבכתובת getonekeyai.com, עם חשבון.'))); return; }
  voicePing(); const key=voiceKey(), android=/Android/i.test(navigator.userAgent); if(!key) voiceKeyInfo();
  const head=(t,s)=>h('div',{class:'vc-h'},h('span',{class:'vc-i'},ic('phone')),h('div',{class:'grow'},h('div',{class:'k'},t),h('div',{class:'small muted',style:'line-height:1.45'},s)));
  const step=(t,d,extra)=>h('li',{},h('div',{class:'grow'},h('div',{class:'st'},t),d?h('div',{class:'sd'},d):null,extra||null));
  const ios=h('div',{class:'card vcard'},head('iPhone, דרך Siri','אומרים ״היי סירי, סטים״, Siri שואלת מה לרשום, ועונים במשפט אחד.'));
  if(!PB.user) ios.append(h('p',{class:'small muted',style:'margin:12px 0;line-height:1.6'},'Siri שולחת את המשפט לחשבון שלך, ולכן צריך להתחבר קודם.'),h('button',{class:'btn sm',type:'button',onclick:()=>authSheet('login')},'כניסה או הרשמה'));
  else if(VO.ping===false) ios.append(h('div',{class:'banner',style:'margin:12px 0 0'},ic('info'),h('span',{},'החיבור ל-Siri עוד לא הופעל בשרת של סטים. הרישום מתוך האפליקציה כבר עובד.')));
  else ios.append(h('ol',{class:'vsteps'},
    step('קוד אישי',key?'הקוד שמור במכשיר הזה. מי שמחזיק בו יכול להוסיף סטים לחשבון שלך ולשמוע מה נרשם היום, ולא יותר מזה.':(VO.keyInfo?'לחשבון כבר יש קוד פעיל, והקיצור שלך ממשיך לעבוד. הקוד עצמו שמור רק במכשיר שבו נוצר. קוד חדש מחליף אותו, ואז מעדכנים אותו גם בקיצור.':'קוד שמזהה אותך מול Siri. אפשר להחליף אותו בכל רגע.'),key?h('div',{class:'vkey'},h('code',{},key.slice(0,10)+'…'),h('button',{type:'button',onclick:()=>copyText(key,'הקוד הועתק')},'העתקה'),h('button',{type:'button',onclick:()=>confirmSheet('להחליף את הקוד?','הקוד הישן יפסיק לעבוד, וצריך לעדכן אותו בקיצור של Siri.',voiceKeyNew,'כן, להחליף')},'החלפה')):h('button',{class:'btn sm',type:'button',disabled:VO.busy,onclick:voiceKeyNew},VO.busy?'רגע…':(VO.keyInfo?'קוד חדש במקום הקיים':'יצירת קוד אישי'))),
    step('הקיצור של Siri',SIRI_SHORTCUT_URL?'מוסיפים את הקיצור המוכן ומדביקים בו את הקוד.':'בונים אותו פעם אחת, בארבע פעולות.',h('button',{class:'btn sm sec2',type:'button',onclick:()=>{ if(SIRI_SHORTCUT_URL) window.open(SIRI_SHORTCUT_URL,'_blank','noopener'); else voiceShortcutHelp(); }},SIRI_SHORTCUT_URL?'הוספת הקיצור':'איך בונים את הקיצור')),
    step('מדברים','״היי סירי, סטים״. ״מה לרשום?״ ״בנץ׳, 10 חזרות, 60 קילו.״ Siri עונה מה נרשם ואיך זה ביחס לפעם הקודמת. הסט מופיע ביומן בפעם הבאה שהאפליקציה נפתחת.')));
  const and=h('div',{class:'card vcard'},head('Android','קיצור דרך במסך הבית שפותח את סטים ישר בהאזנה.'),
    h('p',{class:'small muted',style:'margin:12px 0 0;line-height:1.6'},'Google הסירה את Assistant מהטלפונים, ו-Gemini עוד לא יודע להעביר משפט בעברית לאפליקציה כמו סטים. לכן ב-Android אין היום רישום בלי לגעת בטלפון.'),
    h('ol',{class:'vsteps'},step('לחיצה ארוכה על הסמל של סטים','במסך הבית, אחרי שהאפליקציה הותקנה.'),step('גוררים את ״רישום בקול״ למסך הבית','נוצר סמל נפרד.'),step('נגיעה אחת, ומדברים','האפליקציה מקשיבה, רושמת ומקריאה את התשובה.')));
  wrap.append(...(android?[and,ios]:[ios,and]));
}
function voicePage(){
  header('רישום בקול',{back:'#more'}); const wrap=h('div');
  wrap.append(h('div',{class:'display'},'רישום בקול'),h('p',{class:'lead'},'אומרים או כותבים משפט אחד, והסט נרשם. בעברית או באנגלית.'));
  const inp=h('input',{type:'text',id:'vtext',placeholder:'בנץ׳, 10 חזרות, 60 קילו',autocomplete:'off',enterkeyhint:'send','aria-label':'מה לרשום'});
  const send=()=>{ const t=inp.value.trim(); if(!t) return; voiceSay(t); render(); };
  inp.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); send(); } });
  const mic=voiceCanListen()?h('button',{class:'vmic pressable'+(VO.rec?' on':''),type:'button','aria-label':VO.rec?'עצירת ההאזנה':'דיבור','aria-pressed':VO.rec?'true':'false',html:I('mic'),onclick:voiceListen}):null;
  const box=h('div',{class:'vbox'},mic?h('div',{class:'vtop'},mic,h('div',{class:'small b muted'},VO.rec?'מקשיב. אפשר לדבר':'נוגעים ומדברים')):null,h('div',{class:'vrow'},h('div',{class:'fld grow',style:'margin:0'},inp),h('button',{class:'btn sm',type:'button',onclick:send},'רשום')));
  if(VO.rec) box.append(h('div',{class:'vheard',id:'vheard','aria-live':'polite'},VO.heard||'מקשיב…'));
  else if(VO.say){ box.append(h('div',{class:'vres '+(VO.ok?'ok':'no'),'aria-live':'polite'},VO.heard?h('div',{class:'q'},'״'+VO.heard+'״'):null,h('div',{class:'a'},ic(VO.ok?'check':'info'),h('span',{},VO.say))));
    if(VO.ok&&VO.snap.length) box.append(h('button',{class:'lnkline',type:'button',onclick:()=>{ if(voiceUndo()){ VO.say='בוטל. הרישום האחרון נמחק.'; VO.heard=''; } render(); }},ic('undo'),h('span',{},'ביטול הרישום הזה'))); }
  wrap.append(box);
  const chips=h('div',{class:'gchips'}); ['סקוואט, 8 חזרות, 60 קילו','עוד סט','מתח 8','ריצה 30 דקות 5 קילומטר','בטל'].forEach(t=>chips.append(h('button',{class:'gchip',type:'button',onclick:()=>{ inp.value=t; inp.focus(); }},t)));
  wrap.append(h('div',{class:'small b muted',style:'margin:16px 2px 8px'},'אפשר לומר, למשל'),chips);
  wrap.append(h('div',{class:'sec'},h('h2',{},'מהטלפון, בלי לפתוח את האפליקציה'))); voicePhone(wrap);
  const last=(S.vdone.last||[]).filter(x=>getEx(x.ex)).slice(0,8);
  if(last.length){ wrap.append(h('div',{class:'sec'},h('h2',{},'נרשמו בקול'))); const l=h('div',{class:'list'}); last.forEach(x=>{ const e=getEx(x.ex); l.append(exItem(e,{sub:`${setStr((x.sets||[]).map(s=>({...s,t:true})),e)} · ${x.d===todayKey()?'היום':fmtDate(x.d)}${x.src==='siri'?' · Siri':''}`,onclick:()=>go('#dayex-'+x.d+'-'+x.ex)})); }); wrap.append(l); }
  if(route.param==='go'&&!VO.auto&&voiceCanListen()){ VO.auto=true; setTimeout(voiceListen,450); }
  return wrap;
}
function voiceHubBox(){ return h('button',{class:'hubbox wide pressable',type:'button',style:'--c:var(--g-back)',onclick:()=>go('#voice')},h('div',{class:'ic'},ic('mic')),h('div',{class:'grow'},h('div',{class:'t'},'רישום בקול'),h('div',{class:'s'},'אומרים משפט אחד, והסט נרשם')),h('span',{class:'chev',html:I('chev')})); }

PAGES.goals=goalsPage; PAGES.goal=goalPage; PAGES.goalnew=goalNewPage; PAGES.voice=voicePage;
Object.assign(TABOF,{goals:'more',goal:'more',goalnew:'more',voice:'more'});
