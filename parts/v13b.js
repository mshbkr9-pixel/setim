/* ========================= v13: the coach, and the three sectors ========================= */
/* The app has three doors now: training (what was "היום", "יומן" and the training boxes of "עוד", in one place), nutrition
   (parts/v13.js) and the coach (the conversation, the goals, the profile and every setting).
   The coach answers in three ways, cheapest first (parts/coach.js): by itself with no model, through the small model, or through the
   large one. Only the last two leave the device: they go to this app's own server (POST /api/setim/coach), which holds the key. */
const CO={wait:false,draft:'',auto:false,left:null,info:null,infoAt:0,infoBusy:false};
function coachSave(){ if(S.coach.msgs.length>80) S.coach.msgs=S.coach.msgs.slice(-80); if((S.coach.mem||[]).length>60) S.coach.mem=S.coach.mem.slice(-60); return save('coach',S.coach); }
function pushMsg(m){ m.at=Date.now(); S.coach.msgs.push(m); return m; }

/* ---------- what the coach is told about the person, with each question that needs a model ---------- */
function trainToday(){
  const tk=todayKey(), pl=planFor(tk)||{}, ids=todayList(), name=id=>(getEx(id)||{}).he, done=[], left=[];
  ids.forEach(id=>{ const s=((S.logs[id]||{}).sessions||[]).find(x=>x.d===tk), sets=s?s.sets.filter(x=>x.t):[]; if(sets.length&&name(id)) done.push({name:name(id),sets:setStr(sets,getEx(id))}); else if(name(id)) left.push(name(id)); });
  return {label:pl.label||'',rest:!!pl.rest,planned:ids.map(name).filter(Boolean),done,left};
}
function coachEnv(){
  const tk=todayKey();
  return {FK:FoodKit,MK:MenuKit,hour:new Date().getHours(),today:tk,voice:t=>VoiceLog.handle(t,voiceEnv()),T:nutT(tk),tot:FoodKit.totalsOf(S.food,tk),mealsOn:d=>FoodKit.mealsOf(S.food,d),
    pantry:S.pantry,shop:S.shop,prefs:nutPrefs(),lastWeigh:lastWeigh(),train:trainToday(),stock:MenuKit.stock(S.pantry),used:planUsed(),
    body:sigRead,sig:{today:sigDay(tk),goal:stepsGoal()}};      // v14: the body's numbers and an injury are understood and kept with no model (parts/v14.js)
}
function coachSnap(){
  const tk=todayKey(), p=S.profile, T=nutT(tk), tot=FoodKit.totalsOf(S.food,tk), now=new Date(), ws=weekStats(0);
  const meals=FoodKit.mealsOf(S.food,tk).map(m=>{ const t=mealSum(m); return {slot:m.s,items:(m.it||[]).map(x=>x.n+' '+Math.round(x.g)+'g').join(', ').slice(0,220),kcal:t.k,p:Math.round(t.p)}; });
  const wk=FoodKit.stretch(S.food,addDays(tk,-7),tk,d=>nutT(d));
  const menu=d=>((S.mplan.days[d]||{}).meals||[]).map(m=>{ const r=m.rid?MenuKit.byId(m.rid):null; return {slot:m.slot,recipe:m.rid||'',title:r?r.t:(m.t||''),servings:m.sv||1,kcal:r?MenuKit.nut(r,m.sv)[0]:((m.n||[0])[0]),done:!!m.done}; });
  const byDate={}; allSessions().forEach(s=>{ (byDate[s.d]=byDate[s.d]||[]).push(s); });
  const recent=Object.keys(byDate).sort().reverse().slice(0,6).map(d=>({date:d,label:(S.days.map[d]||{}).label||'',sets:byDate[d].slice(0,8).map(s=>((getEx(s.id)||{}).he||'')+' '+setStr(s.sets.filter(x=>x.t||x.r>0),getEx(s.id))).join('; ').slice(0,420)}));
  const lifts=sinceStart().sort((a,b)=>b.n-a.n).slice(0,8).map(r=>({exercise:(getEx(r.id)||{}).he||'',first_kg:r.fw,first_date:r.firstD,now_kg:r.lw,sessions:r.n,change_pct:Math.round(r.p)}));
  const tr=trainToday();
  return {today:tk,weekday:DAY_NAMES[now.getDay()],time:String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'),
    me:{name:p.name||'',sex:p.sex==='f'?'female':'male',age:+p.age||null,height_cm:+p.height||null,weight_kg:+p.weight||null,training_focus:GOALS[p.goal]||'',workouts_per_week_target:+p.weekly||3},
    goals:goalsOn().slice(0,3).map(g=>({title:g.title,now:GoalKit.line(g,goalData()),due:g.due||''})),
    nutrition:{goal:nutGoal(),target:T.ok?{kcal:T.kcal,p:T.p,c:T.c,f:T.f,training_day:!!T.training}:null,eaten_today:{kcal:tot.k,p:Math.round(tot.p),c:Math.round(tot.c),f:Math.round(tot.f)},left_today:T.ok?{kcal:Math.round(T.kcal-tot.k),p:Math.round(T.p-tot.p)}:null,meals_today:meals,
      last_7_days:{days_logged:wk.days,avg_kcal:wk.avgK,avg_protein:wk.avgP,days_within_target:wk.ok,days_protein_target_met:wk.hitP}},
    PREFS:{kosher:!!S.nut.kosher,diet:['any','vegetarian','vegan'][+S.nut.veg||0],allergies:S.nut.al||[],dislikes:S.nut.no||[],weekly_food_budget_ils:+S.nut.budget||null,meals_per_day:+S.nut.meals||4},
    memory:(S.coach.mem||[]).slice(-25).map(m=>m.t),
    pantry:S.pantry.items.slice(0,70).map(x=>x.n+(x.q!=null?' '+MenuKit.qtyText(x.q,x.u):'')),
    shopping_list:S.shop.items.filter(x=>!x.done).slice(0,40).map(x=>x.n),
    menu:{today:menu(tk),tomorrow:menu(addDays(tk,1))},
    training:{today:tr,this_week:{workouts:ws.days,sets:ws.sets},streak_weeks:weekStreak().n,recent_sessions:recent,progress_since_start:lifts},
    weigh_ins:((S.body&&S.body.w)||[]).slice(-8),...sigSnap()};      // v14: body and injuries (sigSnap in parts/v14.js)
}

/* ---------- the two tiers that need a model ---------- */
async function coachCall(text,img,o){
  o=o||{};
  if(!STANDALONE) return {ok:false,why:'app',say:'המאמן המלא עובד בגרסה שבכתובת getonekeyai.com, עם חשבון.'};
  if(!PB.user) return {ok:false,why:'auth',say:'על זה עונה המאמן המלא, והוא צריך חיבור לחשבון.'};
  if(navigator.onLine===false) return {ok:false,why:'net',say:'אין חיבור לאינטרנט כרגע. מה שאפשר לענות בלי מודל ממשיך לעבוד.'};
  const hist=(o.quiet?[]:S.coach.msgs.slice(0,-1)).filter(m=>m.t&&(m.r==='u'||m.r==='a')).slice(-8).map(m=>({r:m.r,t:m.t}));
  const lastA=o.quiet?null:[...S.coach.msgs].reverse().find(m=>m.r==='a'&&m.tier&&m.tier!=='local');
  try{
    const r=await fetch(PB_URL+'/api/setim/coach',{method:'POST',headers:{'Content-Type':'application/json',Authorization:PB.token},body:JSON.stringify({text,hist,snap:coachSnap(),img:img||'',pref:o.pref||S.nut.pref||'',lastTier:lastA?lastA.tier:''})});
    const j=await r.json().catch(()=>null);
    if(r.status===404) return {ok:false,why:'off',say:'המאמן המלא עוד לא הופעל בשרת. מה שאפשר לענות בלי מודל ממשיך לעבוד.'};
    if(!j||typeof j.ok!=='boolean') return {ok:false,why:'net',say:'לא הצלחתי להגיע למאמן. מנסים שוב בעוד רגע.'};
    if(j.left) CO.left=j.left;
    return j;
  }catch(e){ return {ok:false,why:'net',say:'לא הצלחתי להגיע למאמן. מנסים שוב בעוד רגע.'}; }
}
async function coachInfo(force){
  if(!STANDALONE||!PB.user||CO.infoBusy||(CO.info&&!force)||(!force&&Date.now()-CO.infoAt<20000)) return CO.info;
  CO.infoBusy=true; CO.infoAt=Date.now();
  try{ const r=await fetch(PB_URL+'/api/setim/coach',{headers:{Authorization:PB.token}}); const j=await r.json().catch(()=>null);
    if(j&&j.ok){ CO.info=j; CO.left=j.left||null; const typing=document.querySelector('#view .askbar textarea');      // the coach's door has a box someone may be typing in: it is not repainted under their fingers
      if(['settings','chat','crew'].includes(route.page)||(route.page==='coach'&&!(typing&&typing.value))) render(); } }catch(e){}
  CO.infoBusy=false; return CO.info;
}

/* ---------- an invitation: the full coach answers only people the owner sent a link to ---------- */
/* The link is https://…/#join-<code>. The code waits on the device until there is an account to give it to, and is sent once. */
function joinCode(){ try{ return localStorage.getItem('gt:join')||''; }catch(e){ return ''; } }
function joinKeep(c){ try{ if(c) localStorage.setItem('gt:join',c); else localStorage.removeItem('gt:join'); }catch(e){} }
async function joinTry(){
  const code=joinCode(); if(!code||!STANDALONE||!PB.user||CO.joining) return;
  CO.joining=true;
  try{
    const r=await fetch(PB_URL+'/api/setim/coach/join',{method:'POST',headers:{'Content-Type':'application/json',Authorization:PB.token},body:JSON.stringify({code})});
    const j=await r.json().catch(()=>null);
    if(j&&j.ok){ joinKeep(''); toast(j.owner?'המאמן פתוח, ואפשר להזמין אליו אנשים':'המאמן המלא נפתח עבורך'); haptic(12); CO.info=null; CO.infoAt=0; await coachInfo(true); render(); }
    else if(j&&['code','used','expired'].includes(j.why)){ joinKeep(''); toast(j.say||'קישור ההזמנה לא תקף'); render(); }
  }catch(e){}
  CO.joining=false;
}

/* ---------- one sentence in ---------- */
async function coachSend(text,img){
  text=String(text||'').trim(); if((!text&&!img)||CO.wait) return;
  await foodCore();
  pushMsg({r:'u',t:text,...(img?{pic:1}:{})});
  let L=null; if(!img){ try{ L=CoachKit.local(text,coachEnv()); }catch(e){ console.warn('coach local',e); L=null; } }
  if(L){
    let say=L.say; const acts=[];
    (L.acts||[]).forEach(a=>{ if(a.auto){ const r=actApply(a); if(a.t==='voice'&&r) say=r; } else acts.push({...a,st:'p'}); });
    pushMsg({r:'a',t:say,tier:'local',acts,links:L.links||[]}); coachSave(); render(); chatBottom(); return;
  }
  CO.wait=true; render(); chatBottom();
  const R=await coachCall(text,img); CO.wait=false;
  if(R.ok) pushMsg({r:'a',t:R.say,tier:R.tier,acts:(R.acts||[]).filter(a=>a.t!=='go').map(a=>({...a,st:'p'})),links:(R.acts||[]).filter(a=>a.t==='go').map(a=>({t:GO_HE[a.to]||a.to,to:GO_TO[a.to]||a.to}))});
  else pushMsg({r:'a',t:R.say||'משהו השתבש. מנסים שוב.',tier:'',why:R.why||'',acts:[]});
  coachSave(); render(); chatBottom();
}
function chatBottom(){ if(route.page!=='chat') return; requestAnimationFrame(()=>{ const sc=$('#scroll'); sc.scrollTop=sc.scrollHeight; }); }
const GO_TO={food:'food',pantry:'pantry',recipes:'recipes',plan:'mplan',shop:'shop',goals:'goals',nut:'nut',progress:'progress',home:'home',settings:'settings',profile:'profile'};
const GO_HE={food:'יומן האוכל',pantry:'המטבח שלי',recipes:'מתכונים',plan:'התפריט שלי',shop:'רשימת הקניות',goals:'המטרות שלי',nut:'יעדי התזונה',progress:'התקדמות',home:'האימון של היום',settings:'הגדרות',profile:'הפרופיל שלי'};

/* ---------- doing what was proposed, after the tap ---------- */
function qtyItems(list){ return (list||[]).map(x=>{ if(x.n) return x; const R=FoodKit.parse(x.name||''), k=R.items.length===1&&R.conf>=1?R.items[0].k:''; return {k,n:k||x.name,q:x.qty>0?x.qty:null,u:x.unit==='pcs'?'יח':(x.unit||'g')}; }); }
function actApply(a){
  const tk=todayKey();
  if(a.t==='voice'){ const R=voiceSay(a.text); return R&&R.say; }
  if(a.t==='remember'){ S.coach.mem=(S.coach.mem||[]).filter(m=>m.t!==a.text); S.coach.mem.push({t:String(a.text).slice(0,200),at:Date.now()}); return; }
  if(a.t==='prefs'){ const n=S.nut; if(a.al&&a.al.length) n.al=[...new Set((n.al||[]).concat(a.al))]; if(a.no&&a.no.length) n.no=[...new Set((n.no||[]).concat(a.no))]; if(a.veg!=null) n.veg=a.veg; if(a.kosher!=null) n.kosher=!!a.kosher; if(a.budget!=null) n.budget=a.budget; saveNut(); return; }
  if(a.t==='weigh'){ addWeigh(a.kg,a.date||tk); return; }
  if(a.t==='body'){ const dd=a.date&&a.date<=tk&&a.date>=addDays(tk,-7)?a.date:''; if(dd){ if(BodyKit.setDay(S.sig,dd,a.day,a.src||'c',Date.now()).length) sigSave(); } else sigPut(a.day,a.src||'c',a.back||0); return; }
  if(a.t==='injury'){ sigInjure(a.part,a.note||''); return 'הפציעה נרשמה'; }
  if(a.t==='healed'){ sigHeal(a.part||''); return; }
  if(a.t==='meal'){ const items=a.local?a.items:actItems(a.items); logMeal(items,{date:a.date||tk,slot:a.slot||'',title:a.title||'',src:a.local?'t':'ai'}); const t=FoodKit.sum(items.map(x=>x.e)); toast(`נרשם: ${kc(t.k)} קק״ל, ${g1(t.p)} ג׳ חלבון`); return; }
  if(a.t==='pantry'){ const it=qtyItems(a.items); if(a.op==='remove') pantryRemove(it.map(x=>x.k||x.n),true); else pantryAdd(it); return; }
  if(a.t==='shop'){ shopAdd(qtyItems(a.items),'c'); return; }
  if(a.t==='targets'){ S.nut.custom={kcal:a.kcal,p:a.p,c:a.c,f:a.f}; saveNut(); return; }
  if(a.t==='plan'){ (a.days||[]).forEach(d=>{ const meals=(d.meals||[]).map(m=>{ const r=m.recipe?MenuKit.byId(m.recipe):null; return r?{slot:m.slot,rid:r.id,sv:m.servings||1,n:MenuKit.nut(r,m.servings||1)}:{slot:m.slot,t:m.title||'ארוחה',n:[m.kcal||0,m.p||0,0,0]}; }); if(meals.length) S.mplan.days[d.date]={meals}; });
    S.mplan.made=Date.now(); S.prefs.seen.plans=(S.prefs.seen.plans||0)+1; save('prefs',S.prefs); savePlan(); nutAch(700); return; }
  if(a.t==='sets'){ let said=''; (a.sets||[]).forEach(s=>{ const R=voiceSay(`${a.ex} ${s.reps} חזרות${s.kg>0?' '+s.kg+' קילו':''}`); if(R&&!R.ok) said=R.say; }); return said; }
  if(a.t==='goal'){ newGoal(); GW.text=a.text; return; }
}
function actCard(msg,a){
  if(a.st==='n') return null;
  const done=a.st==='y', mk=(icn,title,text,yes,extra)=>{ const c=h('div',{class:'actc'+(done?' done':'')},h('div',{class:'h'},ic(done?'check':icn),h('span',{},done?title+' · בוצע':title)),text?h('div',{class:'b'},text):null);
    if(!done) c.append(h('div',{class:'row'},h('button',{class:'btn sm',type:'button',onclick:()=>{ const r=actApply(a); a.st='y'; coachSave(); haptic(12); if(typeof r==='string'&&r) toast(r); if(a.t==='goal'){ go('#goalnew'); return; } render(); }},yes),extra||null,h('button',{class:'btn sm sec2',type:'button',style:'flex:none',onclick:()=>{ a.st='n'; coachSave(); render(); }},'לא')));
    return c; };
  if(a.t==='meal'){ const its=a.local?a.items:actItems(a.items), t=FoodKit.sum(its.map(x=>x.e));
    return mk('fork',FoodKit.SLOT_HE[a.slot]||'ארוחה לרישום',its.map(x=>`${x.name} ${g1(x.g)} ג׳`).join(' · ')+`. ${kc(t.k)} קק״ל, ${g1(t.p)} ג׳ חלבון.`,'רישום',
      h('button',{class:'btn sm sec2',type:'button',onclick:()=>mealConfirm(its,{date:a.date||todayKey(),slot:a.slot||'',src:a.local?'t':'ai',onDone:()=>{ a.st='y'; coachSave(); render(); }})},'תיקון')); }
  if(a.t==='pantry') return mk('fridge',a.op==='remove'?'להוריד מהמטבח':'להוסיף למטבח',qtyItems(a.items).map(x=>x.n+(x.q!=null?' '+MenuKit.qtyText(x.q,x.u):'')).join(' · '),a.op==='remove'?'הסרה':'הוספה');
  if(a.t==='shop') return mk('cart','לרשימת הקניות',qtyItems(a.items).map(x=>x.n).join(' · '),'הוספה');
  if(a.t==='plan'){ const txt=(a.days||[]).map(d=>`${fmtDate(d.date)}: ${(d.meals||[]).map(m=>{ const r=m.recipe?MenuKit.byId(m.recipe):null; return r?r.t:(m.title||'ארוחה'); }).join(', ')}`).join('. '); return mk('list',(a.days||[]).length===1?'תפריט ליום אחד':`תפריט ל-${(a.days||[]).length} ימים`,txt,'לתפריט שלי'); }
  if(a.t==='targets') return mk('target','יעד יומי חדש',`${kc(a.kcal)} קק״ל · ${a.p} ג׳ חלבון · ${a.c} ג׳ פחמימות · ${a.f} ג׳ שומן.${a.why?' '+a.why:''}`,'עדכון היעד');
  if(a.t==='remember') return mk('sparkle','לזכור',a.text,'לזכור');
  if(a.t==='weigh') return mk('scale','שקילה',`${a.kg} ק״ג`,'רישום');
  if(a.t==='injury') return mk('heart','פציעה לרישום',BodyKit.partHe(a.part)+(a.note?' · '+a.note:''),'רישום');
  if(a.t==='body') return mk('pxsteps','נתוני גוף לרישום',BodyKit.say(a.day).replace(/^נרשם: /,''),'רישום');
  if(a.t==='sets') return mk('gym','סטים לרישום',`${a.ex}: ${(a.sets||[]).map(s=>`${s.reps}${s.kg>0?'×'+s.kg+' ק״ג':''}`).join(', ')}`,'רישום');
  if(a.t==='goal') return mk('target','מטרה חדשה',a.text,'בונים שלבים');
  return null;
}

/* ========================= the conversation ========================= */
function askBar(o){
  o=o||{}; const ta=h('textarea',{rows:'1',placeholder:o.ph||'כותבים למאמן',maxlength:'1500','aria-label':'הודעה למאמן'}); ta.value=o.value||'';
  const send=h('button',{class:'go',type:'button','aria-label':'שליחה',html:I('send'),disabled:!ta.value.trim()});
  const grow=()=>{ ta.style.height='auto'; ta.style.height=Math.min(120,ta.scrollHeight)+'px'; send.disabled=!ta.value.trim()||CO.wait; };
  const fire=()=>{ const t=ta.value.trim(); if(!t||CO.wait) return; ta.value=''; grow(); o.onSend(t); };
  ta.addEventListener('input',()=>{ grow(); if(o.keep) CO.draft=ta.value; });      // the page may repaint while someone types: the words are kept
  ta.addEventListener('keydown',ev=>{ if(ev.key==='Enter'&&!ev.shiftKey){ ev.preventDefault(); fire(); } }); send.addEventListener('click',fire);
  const mic=micBtn(ta,()=>fire()), bar=h('div',{class:'askbar'});
  /* no "capture": the phone then offers both the camera and the pictures already on it. What is typed in the box goes with the picture. */
  if(o.photo){ const cam=h('input',{type:'file',accept:'image/*',class:'hide'}); cam.addEventListener('change',async()=>{ const f=cam.files[0]; if(!f) return; let url=''; try{ url=await fileToDataUrl(f,1024,0.8); }catch(e){ toast('לא הצלחתי לפתוח את התמונה'); } cam.value=''; if(!url) return; o.onSend(ta.value.trim(),url); ta.value=''; grow(); }); bar.append(h('button',{type:'button','aria-label':'תמונה של הצלחת',html:I('camera'),onclick:()=>cam.click()}),cam); }
  bar.append(ta); if(mic) bar.append(mic); bar.append(send); requestAnimationFrame(grow);
  return bar;
}
function chatPage(){
  header('המאמן',{back:'#coach',right:S.coach.msgs.length?h('button',{class:'iconbtn',type:'button','aria-label':'אפשרויות השיחה',html:I('dots'),onclick:chatMenu}):null}); const wrap=h('div',{class:'chat'});
  if(!FD.core) foodCore();
  coachInfo();
  const msgs=S.coach.msgs.slice(-40);
  if(!msgs.length){
    wrap.append(h('div',{class:'msg a'},'היי, אני המאמן שלך. אני מכיר את האימונים, את יומן האוכל, את המטבח ואת המטרות שלך. אפשר לספר לי מה אכלת או מה עשית, ולשאול כל דבר.'));
    const chips=h('div',{class:'qchips'}); ['כמה חלבון חסר לי היום?','מה אפשר להכין לארוחת ערב?','אכלתי 2 ביצים ו-2 פרוסות לחם','תבנה לי תפריט לשלושה ימים','למה אני לא מתקדם במשקלים?'].forEach(t=>chips.append(h('button',{class:'gchip',type:'button',onclick:()=>coachSend(t)},t)));
    wrap.append(chips);
  }
  msgs.forEach(m=>{
    if(m.r==='u'){ wrap.append(h('div',{class:'msg u'},m.pic?h('div',{class:'small b muted'},'צילום של הצלחת'):null,m.t||'')); return; }
    const b=h('div',{class:'msg a'},m.t||'');
    if(m.tier) b.append(h('div',{class:'tierb '+m.tier},h('i'),h('span',{},CoachKit.TIER_HE[m.tier]||'')));
    wrap.append(b);
    if(m.why==='auth') wrap.append(h('button',{class:'btn sm',type:'button',style:'align-self:flex-start',onclick:()=>authSheet('login')},'כניסה או הרשמה'));
    (m.acts||[]).forEach(a=>{ const c=actCard(m,a); if(c) wrap.append(c); });
    if(m.links&&m.links.length) wrap.append(h('div',{class:'qchips',style:'margin:0'},...m.links.map(l=>h('button',{class:'gchip on',type:'button',onclick:()=>go('#'+l.to)},h('span',{},l.t),ic('chev')))));
  });
  if(CO.wait) wrap.append(h('div',{class:'msg a wait','aria-live':'polite'},'המאמן חושב…'));
  Dock.set(askBar({photo:true,keep:true,value:CO.auto?'':CO.draft,onSend:(t,img)=>{ CO.draft=''; coachSend(t,img); }}));
  if(CO.draft&&CO.auto){ const t=CO.draft; CO.draft=''; CO.auto=false; setTimeout(()=>coachSend(t),60); } else { CO.auto=false; }
  if(FRESH) chatBottom();
  return wrap;
}
function chatMenu(){
  const body=h('div',{},h('h2',{},'השיחה')), list=h('div',{class:'list'});
  const row=(icn,t,sub,fn,bad)=>list.append(h('button',{class:'item pressable',type:'button',onclick:()=>{ Sheet.close(); setTimeout(fn,320); }},h('div',{class:'th',style:`width:40px;height:40px;border-radius:var(--r-s);color:${bad?'var(--bad)':'var(--accent-t)'};background:${bad?'rgba(248,113,113,.14)':'var(--accent-soft)'}`},ic(icn)),h('div',{class:'grow'},h('div',{class:'t'},t),sub?h('div',{class:'s'},sub):null)));
  row('sparkle','מה המאמן זוכר',plural((S.coach.mem||[]).length,'דבר אחד','דברים'),()=>go('#memory'));
  row('gear','כמה לחשוב','חסכוני, מאוזן או מעמיק',coachDepthSheet);
  row('trash','ניקוי השיחה','מה שנרשם ביומן ומה שהמאמן זוכר נשארים',()=>{ S.coach.msgs=[]; coachSave(); render(); },true);
  body.append(list); Sheet.show(body);
}
function coachDepthSheet(){ pickSheet('כמה המאמן חושב','שאלות פשוטות נענות בלי מודל בכלל. לשאר נבחר מודל לפי מורכבות השאלה, וכאן אפשר להטות את הבחירה.',[['eco','חסכוני: המודל המהיר כמעט תמיד'],['','מאוזן: לפי מורכבות השאלה'],['deep','מעמיק: המודל הגדול גם לשאלות בינוניות']],S.nut.pref||'',v=>{ S.nut.pref=v; saveNut(); render(); }); }
function memoryPage(){
  header('מה המאמן זוכר',{back:'#coach'}); const wrap=h('div'); wrap.append(h('div',{class:'display'},'מה המאמן זוכר'),h('p',{class:'lead'},'דברים שאמרת למאמן לזכור, או שהוא הציע לזכור ואישרת. הם משפיעים על התשובות ועל התפריטים.'));
  const inp=h('input',{type:'text',placeholder:'למשל: אני מתאמן רק בבקרים',maxlength:'200',autocomplete:'off','aria-label':'משהו לזכור'});
  const add=()=>{ const t=inp.value.trim(); if(!t) return; actApply({t:'remember',text:t}); coachSave(); inp.value=''; render(); };
  inp.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); add(); } });
  wrap.append(h('div',{class:'addrow'},h('div',{class:'fld grow'},inp),h('button',{class:'btn sm',type:'button',onclick:add},'לזכור')));
  const mem=(S.coach.mem||[]).slice().reverse();
  if(!mem.length){ wrap.append(h('div',{class:'empty'},ic('sparkle'),h('div',{},'עוד אין כאן כלום. אפשר לכתוב למאמן "תזכור ש…", או להוסיף כאן.'))); return wrap; }
  const l=h('div',{class:'list'}); mem.forEach(m=>l.append(h('div',{class:'memrow'},h('div',{class:'grow',style:'line-height:1.45'},m.t),h('button',{class:'iconbtn sm',type:'button','aria-label':'למחוק',html:I('trash'),style:'color:var(--bad);background:none',onclick:()=>{ S.coach.mem=S.coach.mem.filter(x=>x!==m); coachSave(); render(); }}))));
  wrap.append(l); return wrap;
}

/* ========================= the coach's door: the conversation, the goals, the person, the settings ========================= */
function coachHome(){
  header('המאמן'); const wrap=h('div'), p=S.profile; wrap.append(h('div',{class:'display'},'המאמן'));
  const last=[...S.coach.msgs].reverse().find(m=>m.r==='a'&&m.t);
  const top=h('div',{class:'coachtop'},h('div',{class:'row'},h('div',{class:'grow'},h('div',{class:'k',style:'font-size:22px;line-height:1.2'},p.name?`מה נשמע, ${p.name}?`:'מה נשמע?')),S.coach.msgs.length?h('button',{class:'btn sm sec2',type:'button',onclick:()=>go('#chat')},'לשיחה'):null),
    coachBoth()||h('div',{class:'last'},last?last.t:'אני מכיר את האימונים, את האוכל, את המטבח ואת המטרות שלך. מספרים לי מה אכלת או מה עשית, שואלים כמה נשאר להיום, או מבקשים תפריט.'),
    askBar({ph:'מה בא לך לשאול?',onSend:t=>{ CO.draft=t; CO.auto=true; go('#chat'); }}));
  wrap.append(top);
  coachInfo();
  if(STANDALONE&&joinCode()&&!PB.user) wrap.append(h('div',{class:'card'},h('div',{class:'k',style:'font-size:17px'},'קיבלת הזמנה למאמן המלא'),h('p',{class:'small muted',style:'margin:6px 0 12px;line-height:1.55'},'נכנסים לחשבון או נרשמים, והמאמן נפתח.'),h('button',{class:'btn',type:'button',onclick:()=>authSheet('signup')},'כניסה או הרשמה')));
  else if(STANDALONE&&PB.user&&CO.info&&CO.info.on&&!CO.info.access) wrap.append(h('p',{class:'small muted',style:'margin:10px 4px 0;line-height:1.55'},'המאמן המלא פתוח כרגע למוזמנים בלבד. רישום, שקילה, זיכרון ושאלות על הנתונים שלך עובדים לכולם.'));
  const acct=STANDALONE?(PB.user?(SYNC.state==='off'?'ממתין לחיבור · נשמר במכשיר':`מסונכרן · ${PB.user.email}`):'בלי חשבון · נשמר במכשיר הזה'):(S.storageMode==='cloud'?'מחוברים · נשמר בחשבון':'לא מחוברים · נשמר בדפדפן הזה');
  const T=FD.core?nutBase():{ok:false}, nm=(S.coach.mem||[]).length;
  wrap.append(h('div',{class:'hub stagger'},
    goalHubBox(),
    hubBox('user','הפרופיל שלי',acct,'#profile','back','low'),
    hubBox('apple','יעדי התזונה',T.ok&&nutGoal()?`${kc(T.kcal)} קק״ל ביום`:'מטרה, העדפות, אלרגיות','#nut','legs','low'),
    hubBox('sparkle','מה המאמן זוכר',nm?plural(nm,'דבר אחד','דברים'):'העדפות ודברים שסיפרת','#memory','arms','low'),
    hubBox('gear','הגדרות',S.prefs.seen.backup?`גיבוי אחרון ${fmtDate(S.prefs.seen.backup)}`:'צליל, מראה, גיבוי','#settings','full','low'),
    STANDALONE&&PB.user&&CO.info&&CO.info.owner?hubBox('send','הזמנות ומגבלות',`${CO.info.limit} הודעות ביום לכל אחד`,'#crew','chest','low'):null));
  wrap.append(h('div',{class:'credit'},'המאמן אינו רופא ואינו דיאטן. במצב רפואי פונים לאיש מקצוע.'));
  return wrap;
}

/* ========================= the owner's corner: who is invited, and how much each may ask ========================= */
const CREW={st:null,busy:false,err:'',t:0};
async function crewDo(body){
  if(!PB.user) return null; CREW.busy=true;
  try{
    const r=await fetch(PB_URL+'/api/setim/coach/admin',{method:'POST',headers:{'Content-Type':'application/json',Authorization:PB.token},body:JSON.stringify(body)}); const j=await r.json().catch(()=>null);
    CREW.busy=false; if(j&&j.ok){ CREW.st=j; CREW.err=''; return j; } CREW.err=(j&&j.say)||'לא הצלחתי להגיע לשרת. מנסים שוב.'; return null;
  }catch(e){ CREW.busy=false; CREW.err='לא הצלחתי להגיע לשרת. מנסים שוב.'; return null; }
}
function crewLink(url){
  const inp=h('input',{type:'text',readonly:'',value:url,dir:'ltr','aria-label':'קישור ההזמנה'});
  Sheet.show(h('div',{},h('h2',{},'קישור הזמנה'),h('p',{class:'small muted',style:'margin:0 0 12px;line-height:1.5'},'שולחים את הקישור לאדם אחד. הוא נפתח פעם אחת, ותקף לשבוע.'),h('div',{class:'fld'},inp),h('button',{class:'btn',type:'button',onclick:()=>copyText(url,'הקישור הועתק')},'העתקה')));
}
async function crewInvite(){
  const j=await crewDo({do:'invite'}); if(route.page==='crew') render();
  if(!j||!j.code){ toast(CREW.err||'לא הצלחתי ליצור קישור'); return; }
  const url=location.origin+location.pathname+'#join-'+j.code;
  try{ if(navigator.share){ await navigator.share({title:'סטים',text:'הזמנה למאמן האישי באפליקציית סטים. הקישור נפתח פעם אחת, ותקף לשבוע.',url}); return; } }catch(e){}
  crewLink(url);      // no share sheet here, or it was closed: the link is shown, so that it is not lost
}
function crewPage(){
  header('הזמנות ומגבלות',{back:'#coach'}); const wrap=h('div');
  wrap.append(h('div',{class:'display'},'הזמנות ומגבלות'),h('p',{class:'lead'},'המאמן המלא עונה רק למי ששלחת לו קישור הזמנה. כל קישור נפתח פעם אחת, לאדם אחד, ותקף לשבוע.'));
  if(!STANDALONE||!PB.user){ wrap.append(h('div',{class:'empty'},ic('user'),h('div',{},'צריך חיבור לחשבון.'))); return wrap; }
  if(!CREW.st){
    if(!CREW.busy&&!CREW.err) crewDo({do:'state'}).then(()=>{ if(route.page==='crew') render(); });
    wrap.append(CREW.err?h('div',{class:'banner'},CREW.err):h('div',{class:'empty'},h('div',{},'רגע…'))); return wrap;
  }
  const st=CREW.st, usd=v=>'$'+(Math.round(v/1e4)/100).toFixed(2);
  const setLim=(total,dailyUsd)=>{ st.total=total; st.dailyUsd=dailyUsd; render(); clearTimeout(CREW.t);
    CREW.t=setTimeout(()=>crewDo({do:'limits',total,dailyUsd}).then(j=>{ if(!j) toast(CREW.err); CO.info=null; CO.infoAt=0; coachInfo(true); if(route.page==='crew') render(); }),700); };
  const stepper=(txt,label,dn,up)=>h('div',{class:'stepper'},h('button',{type:'button','aria-label':label+': פחות',onclick:dn},'−'),h('b',{},txt),h('button',{type:'button','aria-label':label+': יותר',onclick:up},'+'));
  const T=st.total, U=st.dailyUsd;
  wrap.append(h('div',{class:'card'},
    h('div',{class:'row'},h('div',{class:'grow'},h('div',{class:'k'},'הודעות ביום לאדם'),h('div',{class:'small muted',style:'line-height:1.45'},'נספרות רק תשובות ממודל. מה שנענה במכשיר לא נספר.')),
      stepper(String(T),'הודעות ביום',()=>setLim(T<=5?Math.max(1,T-1):T-5,U),()=>setLim(T<5?T+1:Math.min(200,T+5),U))),
    h('div',{class:'row',style:'margin-top:16px'},h('div',{class:'grow'},h('div',{class:'k'},'תקציב יומי לכולם'),h('div',{class:'small muted',style:'line-height:1.45'},`היום: ${plural(st.today.n,'הודעה אחת','הודעות')} · ${usd(st.today.cost)}`)),
      stepper('$'+U,'תקציב יומי',()=>setLim(T,Math.max(1,Math.round(U)-1)),()=>setLim(T,Math.min(20,Math.round(U)+1))))));
  wrap.append(h('div',{class:'sec'},h('h2',{},'מי מוזמן')));
  const l=h('div',{class:'list'});
  st.people.slice().sort((a,b)=>(b.owner-a.owner)||String(a.name||a.email).localeCompare(String(b.name||b.email))).forEach(p=>{ const who=p.name||p.email||'בלי שם';
    l.append(h('div',{class:'memrow'},h('div',{class:'grow',style:'min-width:0'},h('div',{class:'b ell'},who+(p.owner?' · בעלים':'')),h('div',{class:'small muted ell',dir:'ltr',style:'text-align:right'},p.email||''),h('div',{class:'small muted'},`היום: ${plural(p.today,'הודעה אחת','הודעות')}`)),
      p.owner?null:h('button',{class:'iconbtn sm',type:'button','aria-label':'להסיר את '+who,html:I('trash'),style:'color:var(--bad);background:none',onclick:()=>confirmSheet('להסיר מהמאמן?',`${who} לא יקבל תשובות מהמאמן המלא עד שתשלח קישור חדש. הנתונים שלו לא נמחקים.`,()=>crewDo({do:'revoke',user:p.id}).then(()=>render()),'כן, להסיר')}))); });
  wrap.append(l);
  if(st.pending) wrap.append(h('p',{class:'small muted',style:'margin:10px 4px 0'},st.pending===1?'קישור אחד שנוצר עוד לא נפתח.':`${st.pending} קישורים שנוצרו עוד לא נפתחו.`));
  Dock.set(h('button',{class:'btn sgo',type:'button',onclick:crewInvite},ic('send'),h('span',{},'להזמין מישהו')));
  return wrap;
}

/* ========================= the training door: today, then everything about training in one place ========================= */
function trainPage(){
  const wrap=home();
  const got=S.prefs.ach||{}, nA=ACH.filter(a=>got[a.id]).length, nR=(S.routines.list||[]).length, nS=new Set(allSessions().map(s=>s.d)).size;
  wrap.append(h('div',{class:'sec'},h('h2',{},'לוח האימונים')),calendar());
  /* v14: the week's numbers moved up into the card that opens the page (sectorTop in parts/v14.js); five boxes, not seven: the gym, the guides,
     voice logging and the charts are behind "עוד" (fitMoreSheet) */
  wrap.append(h('div',{class:'hub stagger'},
    hubBox('medal','הישגים',`${nA} מתוך ${ACH.length}`,'#ach','chest','low'),
    hubBox('journal','כל האימונים',nS?plural(nS,'אימון אחד','אימונים')+' ביומן':'כל מה שנרשם, לפי תאריך','#journal','back','low'),
    hubBox('lib','תרגילים',`${fmtK(allEx().length)} תרגילים עם הדגמה`,'#library','shoulders','low'),
    hubBox('plan','תוכניות',nR?plural(nR,'אימון קבוע אחד','אימונים קבועים'):'מילוי השבוע בלחיצה','#plans','arms','low'),
    wideBox('grid','עוד',STANDALONE?'התקדמות, המכון שלי, מדריכים, רישום בקול':'התקדמות, המכון שלי, מדריכים',fitMoreSheet,'full')));
  wrap.append(h('div',{class:'credit',html:'סטים · Exercise data by <a href="https://repdb.co" rel="nofollow" target="_blank">RepDB</a>. לא ייעוץ רפואי.'}));
  return wrap;
}
/* what used to be the journal tab is now the list of every workout; its calendar and its boxes moved to the training door */
function historyPage(){
  const wrap=journal(); header('כל האימונים',{back:'#home'});
  const d=wrap.querySelector('.display'); if(d) d.textContent='כל האימונים';
  ['.jstats','.cal','.grid3'].forEach(s=>{ const el=wrap.querySelector(s); if(el) el.remove(); });
  if(d) d.after(h('button',{class:'lnkline',type:'button',onclick:()=>recapSheet('month')},ic('sparkle'),h('span',{},'סיכום החודש')));
  return wrap;
}

/* ========================= progress: training and nutrition are two views of one screen ========================= */
function progSeg(cur){ return h('div',{class:'seg',style:'margin:0 0 14px'},h('button',{class:cur==='t'?'on':'',type:'button',onclick:()=>{ if(cur!=='t') goReplace('#progress'); }},'אימונים'),h('button',{class:cur==='n'?'on':'',type:'button',onclick:()=>{ if(cur!=='n') goReplace('#nprog'); }},'תזונה')); }
function progressPage(){ const wrap=progress(); header('התקדמות',{back:'#home'}); const d=wrap.querySelector('.display'); if(d) d.after(progSeg('t')); return wrap; }
function nprogPage(){
  header('התקדמות',{back:'#food'}); const wrap=h('div'), tk=todayKey(); wrap.append(h('div',{class:'display'},'התקדמות'),progSeg('n'));
  if(!FD.core){ if(!FD.failed) foodCore(); wrap.append(foodWait()); return wrap; }
  const T0=nutBase(), tf=d=>nutT(d), w7=FoodKit.stretch(S.food,addDays(tk,-6),addDays(tk,1),tf), w30=FoodKit.stretch(S.food,addDays(tk,-29),addDays(tk,1),tf);
  if(!w30.days){ wrap.append(h('div',{class:'empty'},mascot('idle')||ic('trend'),h('div',{},'הגרפים יתמלאו אחרי היום הראשון ביומן האוכל.'))); return wrap; }
  const tile=(icn,l,n,u)=>h('div',{class:'stat'},h('div',{class:'l',html:I(icn)+`<span>${l}</span>`}),h('div',{class:'n'},String(n)),h('span',{class:'small muted'},u));
  wrap.append(h('div',{class:'grid3 stagger'},tile('cal','ימים ביומן',w7.days,'מתוך 7'),tile('flame','קק״ל ביום',kc(w7.avgK),'בממוצע'),tile('target','חלבון ביום',w7.avgP,'ג׳ בממוצע')));
  if(T0.ok&&nutGoal()){
    wrap.append(h('div',{class:'card'},h('div',{class:'k',style:'font-size:17px;line-height:1.45'},w30.days===1?'ב-30 הימים האחרונים נרשם יום אחד ביומן.':`ב-30 הימים האחרונים נרשמו ${w30.days} ימים ביומן.`),h('p',{class:'small muted',style:'margin:6px 0 0;line-height:1.55'},`בתוך יעד הקלוריות: ${plural(w30.ok,'יום אחד','ימים')} · יעד החלבון הושג: ${plural(w30.hitP,'יום אחד','ימים')}`),w30.low>=3?h('p',{class:'small muted',style:'margin:8px 0 0;line-height:1.55'},`ב-${w30.low} ימים נרשם הרבה פחות מהיעד. אם אלה ימים שלא נרשמו עד הסוף, הכול בסדר. אם ככה אכלת, כדאי לאכול קרוב יותר ליעד: גוף שמקבל מעט מדי מאבד שריר.`):null));
    const days=[]; for(let i=13;i>=0;i--){ const d=addDays(tk,-i), t=FoodKit.totalsOf(S.food,d), T=tf(d), J=FoodKit.judgeDay(t,T); days.push({d,k:t.k,T:T.kcal,st:J.state}); }
    const mx=Math.max(...days.map(x=>Math.max(x.k,x.T)))*1.08||1, tg=T0.kcal, PH=96;      // time runs left to right, like the other charts
    const bars=h('div',{class:'kbars',role:'img','aria-label':'קלוריות ביום ב-14 הימים האחרונים, מול היעד'},...days.map(x=>h('div',{class:'b '+(x.st==='ok'?'ok':(x.st==='over'?'over':(x.k?'low':'')))},h('div',{class:'p'},h('i',{style:`height:${x.k?Math.max(3,Math.round(x.k/mx*PH)):0}px`})),h('span',{},String(+x.d.slice(8))))),h('div',{class:'tg',style:`top:${Math.round((1-tg/mx)*PH)}px`}));
    wrap.append(h('div',{class:'sec'},h('h2',{},'קלוריות ביום · שבועיים')),h('div',{class:'card'},bars,h('div',{class:'legend',style:'margin-top:10px'},h('span',{},h('i',{style:'background:var(--good)'}),'בתוך היעד'),h('span',{},h('i',{style:'background:var(--warn)'}),'מעל'),h('span',{},h('i',{style:'background:var(--ink3)'}),'מתחת'),h('span',{},'קו מקווקו: היעד'))));
  }
  const ws=((S.body&&S.body.w)||[]).slice(-12);
  if(ws.length>=2){ const W=320,H=70,px=8,vals=ws.map(x=>x.kg),mn=Math.min(...vals),sp=(Math.max(...vals)-mn)||1,t0=new Date(ws[0].d).getTime(),t1=Math.max(new Date(ws[ws.length-1].d).getTime(),t0+86400000);
    const X=d=>px+(new Date(d).getTime()-t0)/(t1-t0)*(W-2*px), Y=v=>10+(1-(v-mn)/sp)*(H-20), lastW=ws[ws.length-1], dlt=Math.round((lastW.kg-ws[0].kg)*10)/10;
    wrap.append(h('div',{class:'sec'},h('h2',{},'משקל')),h('div',{class:'card'},h('div',{class:'k',style:'font-size:17px'},`${fmtW(lastW.kg)} ק״ג${dlt?` · ${dlt<0?'ירידה':'עלייה'} של ${fmtW(Math.abs(dlt))} ק״ג מאז ${fmtDate(ws[0].d)}`:''}`),h('div',{role:'img','aria-label':`${ws.length} שקילות`,html:`<svg class="gspark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" style="--c:var(--g-legs)"><polyline class="ln" points="${ws.map(x=>X(x.d).toFixed(1)+','+Y(x.kg).toFixed(1)).join(' ')}"/><circle class="pt" cx="${X(lastW.d).toFixed(1)}" cy="${Y(lastW.kg).toFixed(1)}" r="4"/></svg>`}))); }
  else wrap.append(h('button',{class:'lnkline center',type:'button',onclick:weighSheet},ic('scale'),h('span',{},'שקילה ראשונה, כדי לראות את המגמה')));
  return wrap;
}

/* ---------- prices: the list knows what is missing and how much; comparing chains is not connected in this version ---------- */
function pricePanel(wrap,open){ if(open&&open.length) wrap.append(h('div',{class:'credit',style:'padding-top:14px'},'השוואת מחירים בין רשתות עוד לא מחוברת בגרסה הזאת.')); }

/* ========================= joining it all ========================= */
TABS.length=0; TABS.push(['home','כושר','gym'],['food','תזונה','apple'],['coach','המאמן','chat']);      // v14: "כושר", not "אימונים": the sector also holds the steps, the heart rate and an injury
Object.assign(PAGES,{home:trainPage,journal:historyPage,more:coachHome,coach:coachHome,chat:chatPage,memory:memoryPage,crew:crewPage,food:foodPage,nut:nutPage,calories:nutPage,pantry:pantryPage,recipes:recipesPage,recipe:recipePage,mplan:mplanPage,shop:shopPage,progress:progressPage,nprog:nprogPage});
Object.assign(TABOF,{journal:'home',progress:'home',ach:'home',library:'home',group:'home',machine:'home',gym:'home',guides:'home',read:'home',plans:'home',myex:'home',day:'home',dayex:'home',voice:'home',
  calories:'food',pantry:'food',recipes:'food',recipe:'food',mplan:'food',shop:'food',nut:'food',nprog:'food',
  more:'coach',chat:'coach',memory:'coach',crew:'coach',profile:'coach',settings:'coach',install:'coach',goals:'coach',goal:'coach',goalnew:'coach'});
const parseHashBase=parseHash;
parseHash=function(){
  const hsh=(location.hash||'#home').slice(1);
  /* an invitation link: the code is taken off the address at once (it is not left in the history) and kept until an account can use it */
  if(hsh.startsWith('join-')){ const c=hsh.slice(5); if(/^[A-Za-z0-9]{16,64}$/.test(c)) joinKeep(c); try{ history.replaceState(null,'','#coach'); }catch(e){} setTimeout(joinTry,0); return {page:'coach',param:''}; }
  if(hsh.startsWith('recipe-')) return {page:'recipe',param:hsh.slice(7)};
  return parseHashBase();
};
/* "back" from a page leads to the door it now lives behind */
const headerBase=header;
header=function(title,o){ if(o&&(o.back==='#more'||o.back==='#journal')) o={...o,back:'#'+(TABOF[route.page]||'home')}; return headerBase(title,o); };

/* settings: the coach's own part comes first */
const settingsBase=settings;
PAGES.settings=function(){
  const wrap=settingsBase(), d=wrap.querySelector('.display'); coachInfo();
  const row=(icn,t,sub,onclick)=>h('button',{class:'item pressable',type:'button',onclick},h('div',{class:'th',style:'width:40px;height:40px;border-radius:var(--r-s);color:var(--accent-t);background:var(--accent-soft)'},ic(icn)),h('div',{class:'grow'},h('div',{class:'t ell'},t),sub?h('div',{class:'s ell'},sub):null),h('span',{class:'chev',html:I('chev')}));
  const L=CO.left, inf=CO.info, st=!STANDALONE?'עובד בגרסה שבכתובת getonekeyai.com':(!PB.user?'צריך חיבור לחשבון':(!inf?'בודק…':(!inf.on?'עוד לא הופעל בשרת':(inf.access===false?'פתוח כרגע למוזמנים בלבד':(L?`נשארו היום ${plural(L.total!=null?L.total:L.cheap,'הודעה אחת','הודעות')}, ומתוכן עד ${plural(L.img,'צילום אחד','צילומים')}`:'פעיל')))));
  const sec=[h('div',{class:'sec'},h('h2',{},'המאמן')),h('div',{class:'list morelist'},
    row('chat','המאמן המלא',st,()=>PB.user||!STANDALONE?go('#chat'):authSheet('login')),
    row('gear','כמה לחשוב',({eco:'חסכוני',deep:'מעמיק'})[S.nut.pref]||'מאוזן',coachDepthSheet),
    row('sparkle','מה המאמן זוכר',plural((S.coach.mem||[]).length,'דבר אחד','דברים'),()=>go('#memory'))),
    h('p',{class:'small muted',style:'margin:-4px 4px 0;line-height:1.55'},'רישום, שקילה, צעדים, דופק, פציעה, זיכרון ושאלות על הנתונים שלך נענים במכשיר, בלי מודל. שאלה שצריכה מודל נשלחת, יחד עם תקציר של הנתונים שלך (אימונים, אוכל, מטרות, נתוני הגוף ופציעות פעילות), לשרת של סטים ומשם ל-Claude של Anthropic.')];
  if(d) d.after(...sec); else wrap.prepend(...sec);
  return wrap;
};

/* achievements of the nutrition side: for logging and for landing inside the target, never for eating little */
const achStatsV12=achStats;
achStats=function(){
  const s=achStatsV12(), tk=todayKey(); let T=null; try{ T=FD.core?nutBase():null; }catch(e){ T=null; }
  const st=FD.core?FoodKit.stretch(S.food,addDays(tk,-90),addDays(tk,1),()=>T||{ok:false}):{days:0,ok:0,hitP:0};
  s.foodDays=FoodKit.daysLogged(S.food).length; s.foodOk=st.ok; s.foodProt=st.hitP; s.pantryN=S.pantry.items.length; s.plansMade=+S.prefs.seen.plans||0; s.cooked=+S.prefs.seen.cooked||0;
  return s;
};
ACH.push({id:'fd1',t:'ביס ראשון',d:'ארוחה ראשונה ביומן האוכל',v:s=>[s.foodDays,1]},{id:'fd7',t:'שבוע של יומן',d:'שבעה ימים עם רישום אוכל',v:s=>[s.foodDays,7]},{id:'fp5',t:'חמישה ימי חלבון',d:'חמישה ימים שבהם הושג יעד החלבון',v:s=>[s.foodProt,5]},
  {id:'ft5',t:'בול ביעד',d:'חמישה ימים בתוך יעד הקלוריות',v:s=>[s.foodOk,5]},{id:'pn',t:'מטבח מסודר',d:'חמישה מצרכים במטבח שלי',v:s=>[s.pantryN,5]},{id:'pl',t:'תפריט ראשון',d:'תפריט שנבנה לפי היעדים',v:s=>[s.plansMade,1]},{id:'ck',t:'בישלת מהתפריט',d:'מתכון שהוכן ונרשם',v:s=>[s.cooked,1]});

/* backup and restore carry the new documents too */
const restoreFromBase=restoreFrom;
restoreFrom=function(d){
  restoreFromBase(d);
  if(d.nut){ S.nut={...S.nut,...d.nut}; save('nut',S.nut); } if(d.pantry){ S.pantry={items:[],...d.pantry}; save('pantry',S.pantry); } if(d.shop){ S.shop={items:[],...d.shop}; save('shop',S.shop); }
  if(d.mplan){ S.mplan={days:{},...d.mplan}; save('mplan',S.mplan); } if(d.coach){ S.coach={mem:[],msgs:[],...d.coach}; save('coach',S.coach); } if(d.myfood){ S.myfood={items:[],...d.myfood}; FoodKit.setMine(S.myfood.items); save('myfood',S.myfood); }
  if(d.food){ Object.entries(d.food).forEach(([k,v])=>{ S.food[k]=v; save('food-'+k,v); }); }
};
function backupExtra(){ return {nut:S.nut,food:S.food,pantry:S.pantry,shop:S.shop,mplan:S.mplan,coach:{mem:S.coach.mem||[],msgs:[]},myfood:S.myfood}; }
/* a first sign-in on an account with nothing in it sends the device's documents up: the new kinds go with them */
const syncFromCloudBase=syncFromCloud;
syncFromCloud=async function(){
  await syncFromCloudBase();
  CO.info=null; CO.left=null; CO.infoAt=0; CREW.st=null; CREW.err='';      // another account may have come in: what the server said about the last one no longer holds
  try{ if(!PB.user) return; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(!/^gt:(nut|pantry|shop|mplan|coach|myfood|food-\d{4}-\d{2})$/.test(k)) continue; const key=k.slice(3); if(PB.ids[key]) continue; try{ await PB.push(key,JSON.parse(localStorage.getItem(k))); }catch(e){} } }catch(e){}
  joinTry();      // an invitation that was opened before there was an account
};
const signOutBase=signOut;
signOut=function(){ signOutBase(); CO.info=null; CO.left=null; CO.infoAt=0; CREW.st=null; CREW.err=''; };
function v13Boot(){ foodCore(); }
