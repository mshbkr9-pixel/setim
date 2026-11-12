/* ========================= v14: one goal on top of both sectors ========================= */
/* The app is two sectors, fitness and nutrition, and one goal that both of them serve. The coach is no longer a place to go to: it is the voice
   on top of each sector. The thinking is in parts/pulse.js (PulseKit: the sentences, with no model); this file is the glue and the screens.
     pulseEnv()    gathers, once per paint, what the sentences are made from: the goal, this week's training, today's plate, the body
     sectorTop()   the card that opens the fitness page and the nutrition page: the goal and what is left, the coach's words, today's numbers,
                   and at most one step for which the screen has no button of its own
   Every class of this layer starts with "px-" (parts/v14.css). */
const PX={env:null,back:''};

/* ---------- what the sentences are made from ---------- */
function foodKinds(meals){      // portions of vegetables and fruit (80 g each) and how many sweets, from the vocabulary's own categories
  if(!FD.core) return {veg:null,sweet:0};
  let g=0,n=0,sweet=0,unknown=false;
  meals.forEach(m=>(m.it||[]).forEach(x=>{ const v=x.k?FoodKit.byKey(x.k):null; if(!v){ unknown=true; return; } if(v.c==='veg'||v.c==='fruit'){ g+=+x.g||0; n++; } else if(v.c==='sweet'||v.c==='snack') sweet++; }));
  return {veg:n?Math.max(1,Math.round(g/80)):(unknown?null:0),sweet};      // a meal the vocabulary did not read may hold vegetables: then nothing is said about them
}
function pulseEnv(){
  if(PX.env) return PX.env;
  const tk=todayKey(), p=S.profile, dow=new Date(tk).getDay(), E={hour:new Date().getHours(),name:p.name||''};
  /* the goal that leads */
  const g=goalsOn()[0];
  if(g){ let P=null,wk=null; try{ P=GoalKit.progress(g,goalData()); wk=goalWeekData(g); }catch(e){}
    if(P) E.goal={kind:g.kind,title:g.title,pct:P.pct,left:P.leftText||'',state:P.state,need:P.need||'',weight:g.kind==='lose'||g.kind==='gain',week:wk?{moved:!!wk.moved,line:(wk.lines||[])[0]||'',fresh:dow<=2}:null}; }
  /* fitness: the week, and today as the fitness page itself counts it */
  const dates=new Set(allSessions().map(s=>s.d)), last=[...dates].sort().pop()||'', ids=todayList(), d=wkDay(dow), ws=weekStats(0);
  const prs=ids.filter(id=>{ const b=bestSet(id); return !!(b&&b.d===tk&&getEx(id)&&prInfo(id).n); });
  const rest=!!d.rest&&!ids.length, top=sinceStart().find(r=>r.n>=3&&r.p>=3&&getEx(r.id));      // the lift that grew most since its first session
  E.fit={weekly:+p.weekly||3,weekDone:ws.days,setsWeek:ws.sets,streak:weekStreak().n,pr:prs.length,prName:prs.length?getEx(prs[0]).he:'',lastGap:last?GoalKit.daysBetween(last,tk):null,
    gain:top?{name:getEx(top.id).he,pct:top.p}:null,
    today:{rest,planned:ids.length,allDone:ids.length>0&&ids.every(id=>doneToday(id)),ring:!rest&&(ids.length>0||!!d.label)}};      // ring: the day's box on the fitness page shows the week's ring (template home())
  /* the plate: the same target the nutrition page shows (nutT), and the last seven days against it */
  let B={ok:false}; try{ B=nutBase(); }catch(e){}
  if(B.ok&&(nutGoal()||B.custom)){
    const train=dt=>{ if(dates.has(dt)) return true; try{ const pl=planFor(dt); return !!(pl&&!pl.rest&&pl.ex&&pl.ex.length); }catch(e){ return false; } };
    const tFor=dt=>FoodKit.dayTargets(B,train(dt),p.weekly,S.nut.cycle!==false), T=tFor(tk), tot=FoodKit.totalsOf(S.food,tk), J=FoodKit.judgeDay(tot,T), meals=FoodKit.mealsOf(S.food,tk);
    const wk=FoodKit.stretch(S.food,addDays(tk,-6),addDays(tk,1),tFor);
    E.food={ok:true,kcal:T.kcal,p:T.p,eaten:{k:tot.k,p:tot.p},state:J.state,hitP:!!J.hitP,meals:meals.length,week:{days:wk.days,ok:wk.ok,hitP:wk.hitP},...foodKinds(meals)};
  } else E.food={ok:false};
  /* the body */
  const lw=lastWeigh(), sd=sigDay(tk);
  E.body={weighDays:lw?GoalKit.daysBetween(lw.d,tk):null,steps:sd.st!=null?sd.st:null,stepsGoal:stepsGoal(),hr:sd.hr!=null?sd.hr:null,
    injuries:sigHits().map(x=>({part:x.the.replace(/^ה/,''),hits:x.hits}))};      // "שמים לב ל" + the place: "לכתף", "לגב התחתון"
  PX.env=E; Promise.resolve().then(()=>{ PX.env=null; });      // one gathering serves a whole paint; the next paint gathers again
  return E;
}

/* ---------- the card on top of a sector ---------- */
function sectorTop(sector){
  let E=null,B=null; try{ E=pulseEnv(); B=PulseKit.brief(E,sector); }catch(e){ return null; }
  const g=B.goal, food=sector==='food', card=h('div',{class:'px-top'+(B.praise?' px-good':'')});
  if(g){ const T=GoalKit.typeOf(E.goal.kind), pc=Math.round(g.pct*100);
    card.append(h('button',{class:'px-goal pressable',type:'button',style:`--c:var(--g-${T.col})`,'aria-label':`המטרה: ${g.title}. ${pc} אחוז מהדרך. ${g.left}. ${g.stateText}`,onclick:()=>{ PX.back=food?'#food':'#home'; go('#goals'); }},
      h('span',{class:'px-ic'},ic(T.icon)),h('span',{class:'px-gt'},h('b',{},g.title),h('span',{},[g.left,g.stateText].filter(Boolean).join(' · '))),h('span',{class:'px-pc','aria-hidden':'true'},pc+'%'),
      h('span',{class:'px-bar','aria-hidden':'true'},h('i',{style:`width:${pc}%`}))));
  } else {
    card.append(h('div',{class:'px-goal px-none'},h('span',{class:'px-ic'},ic('target')),h('span',{class:'px-gt'},h('b',{},'מה המטרה שלך?'),h('span',{},'מגדירים פעם אחת, ומכאן יעד הכושר ויעד התזונה מחושבים לבד')),
      h('button',{class:'btn sm',type:'button',onclick:()=>newGoal()},'קובעים מטרה'),
      food&&B.none?h('button',{class:'px-alt',type:'button',onclick:()=>go('#nut')},'רק יעד קלוריות, בלי מטרה'):null));
  }
  if(B.say.length) card.append(h('button',{class:'px-coach pressable',type:'button','aria-label':'המאמן: '+B.say.join(' '),onclick:()=>go('#chat')},h('span',{class:'px-ci'},ic(B.praise?'sparkle':'chat')),h('span',{class:'px-say'},...B.say.map((t,i)=>h('span',{class:i===0&&B.praise?'px-hi':''},t)))));
  const foot=h('div',{class:'px-foot'});
  if(!food){ const F=E.fit, tile=(v,l,aria,fn,cls)=>h('button',{class:'px-n pressable'+(cls?' '+cls:''),type:'button','aria-label':aria,onclick:fn},h('b',{},v),h('span',{},l));
    /* the week's workouts are the ring in the day's box, or the coach's words on a day without it: here are the numbers the page shows nowhere else */
    const Bd=E.body, noSt=Bd.steps==null;
    foot.append(tile(String(F.setsWeek),'סטים השבוע',`${F.setsWeek} סטים השבוע. להתקדמות`,()=>go('#progress')),
      tile(noSt?'—':fmtK(Bd.steps),'צעדים היום',noSt?'צעדים היום: עוד לא נרשמו. לרישום':`${fmtK(Bd.steps)} צעדים היום, מתוך יעד של ${fmtK(Bd.stepsGoal)}. לעדכון`,()=>bodySheet(),noSt?'px-empty':''));
    if(Bd.hr!=null) foot.append(tile(String(Bd.hr),'דופק',`דופק במנוחה ${Bd.hr}. לעדכון`,()=>bodySheet())); }      // never append(null): it would write the word on the page
  else if(g&&B.none) foot.append(h('button',{class:'px-step px-wide pressable',type:'button',onclick:()=>go('#nut')},ic('target'),h('span',{},'קובעים יעד יומי לאוכל')));
  const step=B.step&&PX_STEPS[B.step.k]; if(step) foot.append(h('button',{class:'px-step pressable'+(foot.children.length?'':' px-wide'),type:'button',onclick:step[1]},ic(step[0]),h('span',{},B.step.t)));
  if(foot.children.length) card.append(foot);
  return card;
}
/* the one step a sentence may offer: only things for which the screen has no button of its own */
const PX_STEPS={weigh:['scale',()=>weighSheet()]};      // the injury step joins it further down, with the injury sheet

/* the coach's door says the same two sentences, one for each sector, where it used to repeat the last message of the conversation */
function coachBoth(){
  let a=null,b=null; try{ const E=pulseEnv(); a=PulseKit.brief(E,'fit'); b=PulseKit.brief(E,'food'); }catch(e){ return null; }
  const line=(icn,k,t)=>h('div',{},ic(icn),h('span',{},h('b',{},k+': '),t));
  return h('div',{class:'px-both'},line('gym','כושר',a.say.join(' ')),line('apple','תזונה',b.none?'עוד אין יעד יומי לאוכל. קובעים מטרה, והוא מחושב.':b.say.join(' ')));
}

/* ---------- the things that go with fitness, one level down ---------- */
function pxRow(icn,t,sub,fn){ return h('button',{class:'item pressable',type:'button',onclick:fn},h('div',{class:'th',style:'width:40px;height:40px;border-radius:var(--r-s);color:var(--accent-t);background:var(--accent-soft)'},ic(icn)),h('div',{class:'grow'},h('div',{class:'t ell'},t),sub?h('div',{class:'s ell'},sub):null),h('span',{class:'chev',html:I('chev')})); }
function fitMoreSheet(){
  const to=hash=>()=>{ Sheet.close(); setTimeout(()=>go(hash),320); }, nM=(S.deck.machines||[]).length, brand=BRANDS.find(b=>b.id===S.profile.brand);
  Sheet.show(h('div',{},h('h2',{},'עוד בכושר'),h('div',{class:'list morelist px-more'},
    pxRow('trend','התקדמות','גרפים, שיאים ומה עבד השבוע',to('#progress')),
    pxRow('gym','המכון שלי',brand?brand.name:(nM?plural(nM,'מכשיר אחד','מכשירים'):'המכשירים שיש לך'),to('#gym')),
    pxRow('book','מדריכים',`${ARTICLES.length} מדריכים קצרים`,to('#guides')),
    STANDALONE?pxRow('mic','רישום בקול ו-Siri','אומרים משפט אחד, והסט נרשם',to('#voice')):null)));
}

/* ---------- "back" from the goal returns to the sector it was opened from ---------- */
const headerV13=header;
header=function(title,o){
  if(!['goals','goal','goalnew'].includes(route.page)) PX.back='';
  else if(route.page==='goals'&&PX.back&&o&&o.back) o={...o,back:PX.back};
  return headerV13(title,o);
};

/* ========================= v14: the body's own numbers, and an injury ========================= */
/* Steps, the heart rate, the calories the watch counted, sleep, and an injury: typed in one sheet, said to the mic, or written to the coach.
   Kept in the document "sig" (BodyKit in parts/body.js keeps the rules; VoiceLog.parse in parts/voice.js understands the sentences).
   The steps goal is S.profile.steps (8,000 a day until the person changes it). */
Object.assign(ICONS,{
  pxsteps:'<path d="M8.500 3.500c1.500 0 2.700 1.700 2.700 4.200 0 1.500-.500 2.400-.500 3.800H6.800c0-1.700-1-2.500-1-4.300C5.800 5 7 3.500 8.500 3.500ZM6.800 14h3.900v1.200a1.950 1.950 0 0 1-3.900 0ZM15.500 8c1.500 0 2.700 1.500 2.700 3.700 0 1.800-1 2.600-1 4.300h-3.900c0-1.400-.500-2.300-.500-3.800 0-2.500 1.200-4.200 2.700-4.200ZM13.300 18.500h3.900v1.200a1.950 1.950 0 0 1-3.900 0Z"/>'
});
S.sig={day:{},inj:[]};
const applyDocV13=applyDoc;
applyDoc=function(key,data){ if(key==='sig'){ if(data) S.sig=BodyKit.shape({...data}); } else applyDocV13(key,data); };
const backupExtraV13=backupExtra;
backupExtra=function(){ return {...backupExtraV13(),sig:S.sig}; };
const restoreFromV13=restoreFrom;
restoreFrom=function(d){ restoreFromV13(d); if(d&&d.sig){ S.sig=BodyKit.shape({...d.sig}); save('sig',S.sig); } };
/* a first sign-in sends the device's documents up: this one goes with them */
const syncFromCloudV13=syncFromCloud;
syncFromCloud=async function(){
  await syncFromCloudV13();
  try{ if(PB.user&&!PB.ids.sig){ const raw=localStorage.getItem('gt:sig'); if(raw) await PB.push('sig',JSON.parse(raw)); } }catch(e){}
};

function sigSave(){ return save('sig',S.sig); }
function sigDay(d){ return BodyKit.dayOf(S.sig,d||todayKey()); }
function stepsGoal(){ return +S.profile.steps||8000; }
function sigCmd(c){ return c==='body'||c==='injury'||c==='healed'; }
/* back: 1 writes it for yesterday. -> the fields that changed */
function sigPut(patch,src,back){ const ch=BodyKit.setDay(S.sig,back?addDays(todayKey(),-back):todayKey(),patch,src,Date.now()); if(ch.length) sigSave(); return ch; }
function sigInjure(part,note){ const it=BodyKit.injure(S.sig,part,note,todayKey(),Date.now()); sigSave(); return it; }
function sigHeal(which){ const n=BodyKit.heal(S.sig,which||'',todayKey(),Date.now()); if(n) sigSave(); return n; }
function sigHits(){ return BodyKit.hits(S.sig,todayList().map(id=>getEx(id)).filter(Boolean),todayKey()); }
/* the line on a row of today's list, when an active injury may be loaded by that exercise */
function sigWarn(e){ const a=BodyKit.active(S.sig).find(x=>BodyKit.loads(x.part,e)); return a?'עשוי להעמיס על '+BodyKit.partThe(a.part):''; }
/* a sentence written to the coach -> what it says about the body, or null (CoachKit.local in parts/coach.js) */
function sigRead(text){
  const F=VoiceLog.parse(text); if(!sigCmd(F.cmd)) return null;
  if(F.cmd==='body') return {cmd:'body',body:F.body,back:F.back||0,say:BodyKit.say(F.body,{goal:stepsGoal(),back:F.back})};
  if(F.cmd==='injury') return {cmd:'injury',part:F.part,he:F.part==='other'?'':BodyKit.partHe(F.part),care:BodyKit.CARE};
  const n=BodyKit.active(S.sig).filter(x=>!F.part||x.part===F.part).length;
  return {cmd:'healed',part:F.part||'',n,say:BodyKit.sayHealed(n)};
}
/* what the model is told about the body, with a question that needs it */
function sigSnap(){
  const tk=todayKey(), d=sigDay(tk), w=BodyKit.week(S.sig,tk,stepsGoal()), v=k=>d[k]!=null?d[k]:null;
  return {body:{today:{steps:v('st'),resting_heart_rate:v('hr'),watch_kcal:v('kc'),sleep_hours:v('sl')},steps_goal:stepsGoal(),last_7_days:{days_with_steps:w.days,avg_steps:w.avg,days_steps_goal_met:w.met,avg_resting_heart_rate:w.hr||null}},
    injuries:BodyKit.active(S.sig).map(x=>({place:BodyKit.partHe(x.part),since:x.from,note:(x.note||'').slice(0,120)}))};
}
/* said to the mic: the same three kinds, stored here */
function sigVoice(R,text){
  if(R.cmd==='body'){ sigPut(R.body,'v',R.back||0); return {ok:true,say:BodyKit.say(R.body,{goal:stepsGoal(),back:R.back,lang:R.lang})}; }
  if(R.cmd==='injury'){ sigInjure(R.part,String(text||'').slice(0,160)); return {ok:true,say:BodyKit.sayInjury(R.part,R.lang)}; }
  if(R.cmd==='healed'){ const n=sigHeal(R.part); return {ok:n>0,say:BodyKit.sayHealed(n,R.lang)}; }
  return {ok:false,say:''};
}
/* what the voice sheet shows before "אישור" */
function sigPreview(R){
  const card=(icn,t,n,s)=>h('div',{class:'vq-card'},h('div',{class:'th'},ic(icn)),h('div',{class:'grow'},h('div',{class:'t'},t),h('div',{class:'n',style:'font-size:var(--fs-4)'},n),s?h('div',{class:'s'},s):null));
  if(R.cmd==='body') return card('pxsteps','נתוני הגוף',BodyKit.say(R.body).replace(/^נרשם: /,'').replace(/\.$/,''),R.back?'אתמול':'היום');
  if(R.cmd==='injury') return card('heart','פציעה',BodyKit.partHe(R.part),'תירשם כפעילה מהיום');
  const act=BodyKit.active(S.sig).filter(x=>!R.part||x.part===R.part);
  return card('heart','החלמה',act.length?act.map(x=>BodyKit.partHe(x.part)).join(', '):'לא רשומה פציעה פעילה','');
}

/* ---------- the sheet of the body's numbers: four fields, one button ---------- */
function bodySheet(){
  const d=sigDay(), inj=BodyKit.active(S.sig), KEYS=['st','hr','kc','sl'];
  const fld=(k,label,ph,mode,max,step)=>{ const i=h('input',{type:'number',inputmode:mode,min:'0',max:String(max),step:String(step),value:d[k]!=null?String(d[k]):'',placeholder:ph,'aria-label':label}); return [i,h('div',{class:'fld'},h('label',{},label),i)]; };
  const [st,fst]=fld('st','צעדים','8,000','numeric',150000,1), [hr,fhr]=fld('hr','דופק במנוחה','62','numeric',230,1), [kc,fkc]=fld('kc','קלוריות מהשעון','540','numeric',15000,1), [sl,fsl]=fld('sl','שעות שינה','7.5','decimal',24,0.25);
  const inputs={st,hr,kc,sl};
  const keep=()=>{ const patch={}; KEYS.forEach(k=>{ const t=inputs[k].value.trim(); patch[k]=t===''?null:pnum(t); }); const c=BodyKit.clean(patch), bad=KEYS.find(k=>patch[k]!=null&&c[k]==null);
    if(bad){ toast({st:'מספר הצעדים לא נראה הגיוני',hr:'דופק במנוחה הוא בין 25 ל-230',kc:'מספר הקלוריות לא נראה הגיוני',sl:'שעות שינה: בין חצי שעה ל-24'}[bad]); return; }
    const ch=sigPut(patch,HX.src||'m',0), said={}; ch.forEach(k=>{ if(c[k]!=null) said[k]=c[k]; }); HX.src='';
    Sheet.close(); haptic(12); toast(Object.keys(said).length?BodyKit.say(said,{goal:stepsGoal()}):(ch.length?'נשמר':'לא השתנה דבר')); render(); };
  Object.values(inputs).forEach(i=>i.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); keep(); } }));
  const extra=h('div',{}); HX.src=''; watchRows(extra,inputs);
  Sheet.show(h('div',{},h('h2',{},'נתוני הגוף'),h('p',{class:'small muted',style:'margin:0 0 12px;line-height:1.5'},'של היום, מהשעון או ממה שספרת. ממלאים רק מה שיודעים.'),
    h('div',{class:'px-two'},fst,fhr),h('div',{class:'px-two'},fkc,fsl),
    h('button',{class:'btn',type:'button',onclick:keep},'שמור'),
    h('button',{class:'lnkline',type:'button',style:'margin-top:6px',onclick:()=>{ Sheet.close(); setTimeout(stepsGoalSheet,320); }},ic('target'),h('span',{},`יעד הצעדים: ${fmtK(stepsGoal())} ביום`)),
    h('button',{class:'lnkline',type:'button',onclick:()=>{ Sheet.close(); setTimeout(injurySheet,320); }},ic('heart'),h('span',{},inj.length?`פציעה פעילה: ${inj.map(x=>BodyKit.partHe(x.part)).join(', ')}`:'יש פציעה? רושמים אותה כאן')),
    extra));
}
function stepsGoalSheet(){ pickSheet('יעד הצעדים ביום','כמה צעדים רוצים לעשות ביום. אפשר לשנות בכל רגע.',[[5000,'5,000'],[6000,'6,000'],[8000,'8,000'],[10000,'10,000'],[12000,'12,000'],[15000,'15,000']],stepsGoal(),v=>{ setProf('steps',+v); render(); toast(`יעד הצעדים: ${fmtK(+v)} ביום`); }); }

/* ---------- the injury sheet: what is active (with "החלמתי"), what today's workout may load, and a new one ---------- */
function sigSkipToday(ids){      // today only: the plan of this one date, without those exercises
  const tk=todayKey(), i=new Date(tk).getDay(), cur=wkDay(i), before=S.days.map[tk]&&S.days.map[tk].plan?JSON.parse(JSON.stringify(S.days.map[tk].plan)):null;
  setOverride(tk,{label:cur.label||'',groups:[...(cur.groups||[])],ex:cur.ex.filter(x=>!ids.includes(x.id)).map(x=>({...x})),rest:false,routine:cur.routine||''}); render();
  toastUndo(ids.length===1?'תרגיל אחד ירד מהאימון של היום':`${ids.length} תרגילים ירדו מהאימון של היום`,()=>{ setOverride(tk,before); render(); });
}
function injurySheet(){
  const hits=sigHits(), body=h('div',{}), state={part:''};
  body.append(h('h2',{},'פציעה'));
  if(hits.length){
    const list=h('div',{class:'list morelist px-more'});
    hits.forEach(x=>list.append(h('div',{class:'item'},h('div',{class:'th',style:'width:40px;height:40px;border-radius:var(--r-s);color:var(--accent-t);background:var(--accent-soft)'},ic('heart')),
      h('div',{class:'grow'},h('div',{class:'t ell'},x.he),h('div',{class:'s ell'},x.days?`מאז ${fmtDate(x.from)} · ${plural(x.days,'יום אחד','ימים')}`:'מהיום')),
      h('button',{class:'btn sm sec2',type:'button',style:'flex:none',onclick:()=>{ sigHeal(x.id); Sheet.close(); haptic(12); toast('טוב לשמוע. הפציעה נסגרה.'); render(); }},'החלמתי'))));
    body.append(list);
    const ids=[...new Set(hits.reduce((a,x)=>a.concat(x.ids),[]))];
    if(ids.length) body.append(h('div',{class:'banner',style:'margin:12px 0 0;align-items:center'},ic('info'),h('span',{class:'grow'},`היום עשויים להעמיס: ${ids.map(id=>(getEx(id)||{}).he).filter(Boolean).join(', ')}.`),
      h('button',{class:'btn sm sec2',type:'button',style:'flex:none;width:auto',onclick:()=>{ Sheet.close(); setTimeout(()=>sigSkipToday(ids),320); }},'לדלג היום')));
    body.append(h('div',{class:'sec'},h('h2',{},'פציעה נוספת')));
  } else body.append(h('p',{class:'small muted',style:'margin:0 0 12px;line-height:1.5'},'בוחרים איפה. כל עוד הפציעה פעילה, תרגילים שעשויים להעמיס על האזור יסומנו, והמאמן יתחשב בה.'));
  const chips=h('div',{class:'gchips',role:'group','aria-label':'מקום הפציעה'});
  const note=h('input',{type:'text',maxlength:'120',placeholder:'הערה, לא חובה. למשל: מאז הריצה ביום שני','aria-label':'הערה על הפציעה',autocomplete:'off'});
  const okb=h('button',{class:'btn',type:'button',disabled:true,onclick:()=>{ if(!state.part) return; sigInjure(state.part,note.value); Sheet.close(); haptic(12); toast('הפציעה נרשמה'); render(); }},'רישום הפציעה');
  const paint=()=>{ [...chips.children].forEach(c=>{ const on=c.dataset.k===state.part; c.classList.toggle('on',on); c.setAttribute('aria-pressed',on?'true':'false'); }); okb.disabled=!state.part; };
  BodyKit.PARTS.forEach(([k,he])=>chips.append(h('button',{class:'gchip',type:'button','data-k':k,'aria-pressed':'false',onclick:()=>{ state.part=k; paint(); }},he)));
  body.append(h('div',{class:'fld'},chips),h('div',{class:'fld'},note),okb,h('p',{class:'small muted',style:'margin:12px 2px 0;line-height:1.55'},'האפליקציה אינה מאבחנת. '+BodyKit.CARE));
  Sheet.show(body);
}
PX_STEPS.injury=['heart',()=>injurySheet()];

/* ========================= v14: the watch ========================= */
/* Two roads, and both end in the same four fields of the body sheet:
   - iPhone: a shortcut reads the day's steps and heart rate from the phone's health app (the watch fills it) and posts them to the voice address
     with the person's code. They wait on the server in "hinbox"; healthPull() takes them when the app is opened. The link of the ready-made
     shortcut comes from the server (siri.json, "health"). Until there is one, nothing is offered.
   - any watch: a picture of its screen, read by the coach's small model into a "body" action. Offered only to someone the full coach is open
     to, on a server that knows the action (coach info v 3). What was read lands in the fields, and the person still presses "שמור". */
const HX={pulled:0,busy:false,src:'',link:null};      // link: where the ready-made health shortcut is. null: not asked yet; '': the server has none
async function healthPull(force){
  if(!STANDALONE||!PB.user||(!force&&Date.now()-HX.pulled<15000)) return 0; HX.pulled=Date.now();
  try{ const j=await PB.req('GET',`/api/collections/docs/records?perPage=1&filter=${encodeURIComponent('user="'+PB.user.id+'" && key="hinbox"')}`), it=(j.items||[])[0]; if(!it||!it.data) return 0;
    const before=JSON.stringify(sigDay()), n=BodyKit.merge(S.sig,it.data.items||[]); if(!n) return 0;
    sigSave(); const d=sigDay(); if(JSON.stringify(d)!==before) toast('מהשעון: '+BodyKit.say(d).replace(/^נרשם: /,'')); render(); return n; }catch(e){ return 0; }
}
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) healthPull(); });
window.addEventListener('focus',()=>healthPull());
const syncFromCloudV14=syncFromCloud;
syncFromCloud=async function(){ await syncFromCloudV14(); healthPull(true); };
function watchDevice(){ return STANDALONE&&!!PB.user&&/^ios/.test(devKind()); }
function watchCan(){ return watchDevice()&&!!HX.link; }
/* asked once, by the body sheet, and only on an iPhone with an account: a failure leaves it unasked, to be tried the next time the sheet opens */
async function watchPing(){ if(HX.link!=null) return HX.link; try{ const r=await fetch(PB_URL+'/api/setim/voice'), j=await r.json().catch(()=>({})); if(r.ok&&j&&j.ok) HX.link=siriLink(j.health); }catch(e){} return HX.link||''; }
function photoCan(){ const i=CO.info; return STANDALONE&&!!PB.user&&!!(i&&i.on&&i.access&&i.v>=3); }
function watchSheet(){
  let added=''; try{ added=localStorage.getItem('gtv:hadded')||''; }catch(e){}
  const tap=ev=>{ let prev=null; try{ prev=localStorage.getItem('gtv:added'); }catch(e){}
    siriTap(ev);      // the same tap as the Siri shortcut: the personal code is copied inside it, and Apple's own "add shortcut" screen opens
    try{ if(prev==null) localStorage.removeItem('gtv:added'); else localStorage.setItem('gtv:added',prev); if(voiceKey()) localStorage.setItem('gtv:hadded',todayKey()); }catch(e){} };
  Sheet.show(h('div',{},h('h2',{},'חיבור לשעון'),
    h('p',{style:'margin:0 0 14px;line-height:1.6'},'קיצור דרך אחד באייפון קורא את הצעדים והדופק של היום מאפליקציית "בריאות", שהשעון ממלא, ושולח אותם לסטים. מוסיפים אותו פעם אחת.'),
    h('a',{class:'btn',href:HX.link,target:'_blank',rel:'noopener',onclick:tap},added?'הוספת הקיצור מחדש':'הוספת הקיצור'),
    h('p',{class:'small muted',style:'margin:12px 2px 0;line-height:1.55'},'הקוד האישי מועתק לבד, ומדביקים אותו במסך שנפתח. מכאן והלאה: מפעילים את הקיצור, חוזרים לסטים, והמספרים כבר כאן.')));
}
/* the rows under "שמור" in the body sheet that have to do with the watch. inputs: the sheet's four fields, by key */
function watchRows(box,inputs){
  const watch=()=>{ if(box.querySelector('.px-watch')||!watchCan()) return;
    box.prepend(h('button',{class:'lnkline px-watch',type:'button',onclick:()=>{ Sheet.close(); setTimeout(watchSheet,320); }},ic('phone'),h('span',{},'חיבור לשעון: צעדים ודופק מ״בריאות״ של האייפון'))); };
  watch(); if(watchDevice()&&HX.link==null) watchPing().then(()=>{ if(Sheet.open&&box.isConnected) watch(); }).catch(()=>{});
  const photo=()=>{ if(box.querySelector('.px-photo')||!photoCan()) return;
    const file=h('input',{type:'file',accept:'image/*',class:'hide','aria-label':'צילום מסך של השעון'}), label=h('span',{},'צילום מסך של השעון, והמאמן קורא את המספרים');
    const row=h('button',{class:'lnkline px-photo',type:'button',onclick:()=>{ if(!HX.busy) file.click(); }},ic('camera'),label);
    file.addEventListener('change',async()=>{ const f=file.files[0]; file.value=''; if(!f||HX.busy) return; HX.busy=true; label.textContent='קורא את התמונה…';
      let R=null; try{ const img=await fileToDataUrl(f,1024,0.8); R=await coachCall('נתוני הגוף מהשעון: לקרוא את המספרים שבתמונה',img,{quiet:true,pref:'eco'}); }catch(e){ R=null; }
      HX.busy=false; label.textContent='צילום מסך של השעון, והמאמן קורא את המספרים';
      const a=R&&R.ok?(R.acts||[]).find(x=>x.t==='body'):null;
      if(!a){ toast(R&&!R.ok&&R.say?R.say:'לא הצלחתי לקרוא מספרים מהתמונה. אפשר להקליד אותם.'); return; }
      Object.keys(inputs).forEach(k=>{ if(a.day[k]!=null) inputs[k].value=String(a.day[k]); }); HX.src='p';
      toast('המאמן קרא: '+BodyKit.say(a.day).replace(/^נרשם: /,'')+' בודקים ושומרים.'); });
    box.append(row,file); };
  photo(); if(STANDALONE&&PB.user&&!CO.info) coachInfo().then(()=>{ if(Sheet.open&&box.isConnected) photo(); }).catch(()=>{});
}
