/* ========================= v13: the nutrition sector ========================= */
/* The thinking lives in parts/food.js (FoodKit), parts/menu.js (MenuKit) and parts/coach.js (CoachKit). This file is the nutrition
   screens; parts/v13b.js holds the coach, the three sectors and what joins them. Seven kinds of document are added to what the app
   stores and syncs: nut (goal, targets, preferences), food-YYYY-MM (the diary, one a month), pantry, shop, mplan (the menu),
   coach (the conversation and what the coach was asked to remember) and myfood (products the person scanned or typed in). */
Object.assign(ICONS,{
  apple:'<path d="M12 7.5c-1.8-2.2-6-2-7.2 1.8C3.6 13.4 6.6 20 9.6 20c1 0 1.5-.6 2.4-.6s1.4.6 2.4.6c3 0 6-6.6 4.8-10.7C18 5.5 13.800 5.300 12 7.500z"/><path d="M12 7.5c0-2 1-3.600 3-4.200"/>',
  chat:'<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8.500 9.500h7M8.500 12.500h4.500"/>',
  fridge:'<rect x="6" y="3" width="12" height="18" rx="2.500"/><path d="M6 10h12M9.500 6.200v1.800M9.500 13v3"/>',
  cart:'<path d="M3 4h2.200l2.300 11h10.200L20 7.500H6.300"/><circle cx="9" cy="19" r="1.400"/><circle cx="16.500" cy="19" r="1.400"/>',
  pot:'<path d="M5 10h14v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3zM3 10h18"/><path d="M9.500 6.500c0-1.200 1-1.300 1-2.500M14 6.500c0-1.200 1-1.300 1-2.500"/>',
  barcode:'<path d="M4 6v12M7 6v12M10.500 6v12M13 6v12M16.500 6v12M20 6v12"/>',
  send:'<path d="M20 4L4 11l6.500 2.500L13 20z"/><path d="M10.500 13.500L20 4"/>',
  fork:'<path d="M7 3v6.500a2 2 0 0 0 4 0V3M9 11.500V21M16.500 3c-2 2.200-2 6.300 0 8.500V21"/>',
  list:'<path d="M8 6.500h12M8 12h12M8 17.500h12"/><path d="M4 6.500h.01M4 12h.01M4 17.500h.01"/>'
});
S.nut={goal:'',pace:'',cycle:true,meals:4,kosher:false,veg:0,al:[],no:[],budget:0,region:'il',custom:null,pref:''};
S.food={}; S.pantry={items:[]}; S.shop={items:[]}; S.mplan={days:{}}; S.coach={mem:[],msgs:[]}; S.myfood={items:[]};
const applyDocBase=applyDoc;
applyDoc=function(key,data){
  if(!data) return;
  if(key==='nut') S.nut={...S.nut,...data};
  else if(key==='pantry') S.pantry={items:[],...data};
  else if(key==='shop') S.shop={items:[],...data};
  else if(key==='mplan') S.mplan={days:{},...data};
  else if(key==='coach') S.coach={mem:[],msgs:[],...data};
  else if(key==='myfood'){ S.myfood={items:[],...data}; FoodKit.setMine(S.myfood.items); }
  else if(/^food-\d{4}-\d{2}$/.test(key)) S.food[key.slice(5)]={days:{},...data};
  else applyDocBase(key,data);
};

/* ---------- the food data: the vocabulary and recipes come with the first screen, the whole table when someone searches ---------- */
const FD={core:false,db:false,loading:null,dbLoading:null,failed:false};
const FOODPAGES={food:1,pantry:1,recipes:1,recipe:1,mplan:1,shop:1,nut:1,chat:1,coach:1};
function foodCore(){
  if(FD.core) return Promise.resolve(true);
  if(!FD.loading) FD.loading=fetch('data/food-core.json').then(r=>r.json()).then(j=>{ FoodKit.init(j); FoodKit.setMine(S.myfood.items); FD.core=true; FD.failed=false; if(FOODPAGES[route.page]) render(); return true; }).catch(()=>{ FD.loading=null; FD.failed=true; if(FOODPAGES[route.page]) render(); return false; });
  return FD.loading;
}
function foodDb(){
  if(FD.db) return Promise.resolve(true);
  if(!FD.dbLoading) FD.dbLoading=fetch('data/foods.json').then(r=>r.json()).then(j=>{ FoodKit.setDb(j); FD.db=true; return true; }).catch(()=>{ FD.dbLoading=null; return false; });
  return FD.dbLoading;
}
function foodWait(){ return FD.failed?h('div',{class:'card'},h('div',{class:'k',style:'margin-bottom:4px'},'מאגר המזון לא נטען'),h('p',{class:'small muted',style:'margin:0 0 12px;line-height:1.5'},'בודקים את החיבור לאינטרנט ומנסים שוב. מה שכבר נרשם שמור במכשיר.'),h('button',{class:'btn',type:'button',onclick:()=>{ FD.failed=false; foodCore(); render(); }},'לנסות שוב')):h('div',{class:'todaybox'},h('div',{class:'small muted'},'טוען את מאגר המזון…')); }
const SLOT_ICON={b:'sparkle',l:'fork',d:'pot',s:'apple'}, SLOT_COL={b:'shoulders',l:'chest',d:'back',s:'legs'};
const slotNow=()=>FoodKit.slotByHour(new Date().getHours());
const kc=n=>Math.round(n).toLocaleString('he-IL');
const g1=n=>String(Math.round(n));

/* ---------- targets ---------- */
function isTrainDay(d){ try{ if(sessionsOn(d).length) return true; const p=planFor(d); return !!(p&&!p.rest&&p.ex&&p.ex.length); }catch(e){ return false; } }
function nutT(d){ const T=FoodKit.targets(S.profile,S.nut); return T.ok?FoodKit.dayTargets(T,isTrainDay(d),S.profile.weekly,S.nut.cycle!==false):T; }
function nutPrefs(){ return {kosher:!!S.nut.kosher,veg:+S.nut.veg||0,al:S.nut.al||[],no:S.nut.no||[],thrifty:(+S.nut.budget||0)>0,meals:+S.nut.meals||4}; }
function saveNut(){ return save('nut',S.nut); }

/* ---------- the diary ---------- */
function foodSave(d){ const mk=d.slice(0,7); return save('food-'+mk,S.food[mk]||{days:{}}); }
/* items: [{name|n, k, g, e:[kcal,p,c,f], est, q, u, ai}]   o: {date, slot, src, title, rid, sv} */
function logMeal(items,o){
  o=o||{}; const d=o.date||todayKey(), slot=o.slot||slotNow(), now=Date.now();
  const its=items.map(x=>({n:x.name||x.n,k:x.k||'',g:Math.round(x.g*10)/10,e:x.e.map((v,i)=>i?Math.round(v*10)/10:Math.round(v)),...(x.est?{est:1}:{}),...(x.q!=null&&x.u?{q:x.q,u:x.u}:{}),...(x.ai?{ai:1}:{})}));
  const ms=FoodKit.mealsOf(S.food,d), last=ms[ms.length-1]; let meal;
  if(last&&last.s===slot&&!o.rid&&!last.rid&&d===todayKey()&&now-(last.at||0)<45*60000){ last.it=last.it.concat(its); meal=last; }      // more of the same meal, said a moment later
  else { meal={id:'m'+now.toString(36),s:slot,at:now,it:its,...(o.src?{src:o.src}:{}),...(o.title?{t:o.title}:{}),...(o.rid?{rid:o.rid,sv:o.sv||1}:{})}; FoodKit.addMeal(S.food,d,meal); }
  foodSave(d); nutAch(700);
  return meal;
}
function nutAch(delay){ try{ checkAch().forEach((a,i)=>setTimeout(()=>achBanner(a),(delay||0)+i*1000)); }catch(e){} }
function mealLine(m){ return m.t||(m.it||[]).map(x=>x.n).join(', '); }
function mealSum(m){ return FoodKit.sum(m.it||[]); }

/* ---------- pieces ---------- */
function kring(eaten,target){
  const C=2*Math.PI*44, p=target?Math.max(0,Math.min(1,eaten/target)):0, left=Math.round(target-eaten), over=target&&eaten>target*1.1;
  const el=h('div',{class:'kring',role:'img','aria-label':target?`${kc(eaten)} מתוך ${kc(target)} קלוריות`:`${kc(eaten)} קלוריות`,html:`<svg viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="44" fill="none" stroke="var(--card3)" stroke-width="9"/><circle class="p" cx="52" cy="52" r="44" fill="none" stroke="${over?'var(--warn)':'var(--c,var(--accent))'}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${FRESH?C:C*(1-p)}"/></svg><div class="v"><b>${target?kc(Math.abs(left)):kc(eaten)}</b><small>${target?(left>=0?'נשארו':'מעל היעד'):'קק״ל'}</small></div>`});
  if(FRESH) requestAnimationFrame(()=>requestAnimationFrame(()=>{ const c=el.querySelector('circle.p'); if(c) c.style.strokeDashoffset=String(C*(1-p)); }));
  return el;
}
function mbar(label,got,target,col){ const p=target?Math.min(1,got/target):0; return h('div',{class:'mbar',style:`--c:${col}`},h('div',{class:'l'},h('span',{},label),h('b',{},g1(got))),h('div',{class:'t','aria-hidden':'true'},h('i',{style:`width:${Math.round(p*100)}%`})),h('div',{class:'s'},target?`מתוך ${g1(target)} ג׳`:'גרם')); }
function estBadge(){ return h('span',{class:'est'},'הערכה'); }
function hubBox(icn,t,sub,hash,col,cls){ return h('button',{class:'hubbox pressable'+(cls?' '+cls:''),type:'button',style:`--c:var(--g-${col})`,onclick:()=>go(hash)},h('div',{class:'ic'},ic(icn)),h('div',{class:'t'},t),h('div',{class:'s'},sub)); }
function wideBox(icn,t,sub,fn,col){ return h('button',{class:'hubbox wide pressable',type:'button',style:`--c:var(--g-${col})`,onclick:fn},h('div',{class:'ic'},ic(icn)),h('div',{class:'grow'},h('div',{class:'t'},t),h('div',{class:'s'},sub)),h('span',{class:'chev',html:I('chev')})); }
/* speech into any text box: the same recogniser the set logging uses */
const DICT={rec:null};
function dictate(onText,onState){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR){ toast('הדפדפן הזה לא תומך בזיהוי דיבור. אפשר להקליד.'); return; }
  if(DICT.rec){ try{ DICT.rec.stop(); }catch(e){} return; }
  const rec=new SR(); rec.lang=S.profile.vlang==='en'?'en-US':'he-IL'; rec.interimResults=true; rec.continuous=false; let heard='';
  rec.onresult=ev=>{ let t=''; for(let i=0;i<ev.results.length;i++) t+=ev.results[i][0].transcript; heard=t; onText(t,false); };
  rec.onerror=ev=>{ if(ev.error==='not-allowed'||ev.error==='service-not-allowed') toast('צריך לאשר לאפליקציה גישה למיקרופון'); else if(ev.error!=='no-speech'&&ev.error!=='aborted') toast('הזיהוי לא הצליח. אפשר להקליד.'); };
  rec.onend=()=>{ DICT.rec=null; onState&&onState(false); if(heard.trim()) onText(heard.trim(),true); };
  try{ rec.start(); DICT.rec=rec; onState&&onState(true); }catch(e){ DICT.rec=null; toast('המיקרופון לא נפתח'); }
}
function micBtn(target,onFinal){
  if(!(window.SpeechRecognition||window.webkitSpeechRecognition)) return null;
  const b=h('button',{type:'button','aria-label':'דיבור','aria-pressed':'false',html:I('mic')});
  b.addEventListener('click',()=>dictate((t,fin)=>{ target.value=t; target.dispatchEvent(new Event('input')); if(fin&&onFinal) onFinal(t); },on=>{ b.classList.toggle('on',on); b.setAttribute('aria-pressed',on?'true':'false'); }));
  return b;
}

/* ========================= the nutrition page ========================= */
let foodDay=null;
function foodPage(){
  header('תזונה'); const tk=todayKey(); if(!foodDay||foodDay>tk) foodDay=tk; const d=foodDay, isToday=d===tk, wrap=h('div',{class:'home'}), dd=new Date(d+'T12:00:00');
  wrap.append(h('div',{class:'hm-top'},
    h('div',{class:'grow'},isToday?h('div',{class:'hm-g'},'תזונה'):h('button',{class:'hm-g link',type:'button',onclick:()=>{ foodDay=tk; render(); }},'חזרה להיום'),h('div',{class:'display'},`${isToday?'היום':'יום '+DAY_NAMES[dd.getDay()]}, ${dd.getDate()} ב${MONTHS[dd.getMonth()]}`)),
    h('div',{class:'hm-nav'},h('button',{class:'iconbtn',type:'button','aria-label':'היום הקודם',html:I('chev'),onclick:()=>{ foodDay=addDays(d,-1); render(); }}),h('button',{class:'iconbtn',type:'button','aria-label':'היום הבא',html:I('back'),disabled:isToday,style:isToday?'opacity:.4':'',onclick:()=>{ if(!isToday){ foodDay=addDays(d,1); render(); } }}))));
  if(!FD.core){ if(!FD.failed) foodCore(); wrap.append(foodWait()); return wrap; }
  const T=nutT(d), tot=FoodKit.totalsOf(S.food,d), meals=FoodKit.mealsOf(S.food,d), J=FoodKit.judgeDay(tot,T);
  if(!T.ok||!S.nut.goal){
    wrap.append(h('div',{class:'todaybox'},h('div',{class:'hero-row'},mascot('idle')||h('div',{class:'restico'},ic('apple')),h('div',{class:'grow'},h('div',{class:'k',style:'font-size:22px;line-height:1.2'},'כמה לאכול ביום?'),h('div',{class:'small muted',style:'margin-top:4px;line-height:1.5'},'בוחרים מטרה, והאפליקציה מחשבת יעד קלוריות וחלבון לפי הגוף והאימונים שלך.'))),
      h('button',{class:'btn',type:'button',style:'margin-top:14px',onclick:()=>go('#nut')},'קובעים יעד')));
    if(tot.k) wrap.append(h('div',{class:'card'},h('div',{class:'row'},h('div',{class:'grow'},h('div',{class:'k'},`${kc(tot.k)} קק״ל עד עכשיו`),h('div',{class:'small muted'},`${g1(tot.p)} ג׳ חלבון · ${g1(tot.c)} ג׳ פחמימות · ${g1(tot.f)} ג׳ שומן`)))));
  } else {
    const st=J.state, line=!tot.k?(isToday?'עוד לא נרשם אוכל היום':'לא נרשם אוכל ביום הזה'):(st==='ok'?`אכלת ${kc(tot.k)} · בתוך היעד`:(st==='over'?`אכלת ${kc(tot.k)} · מעל היעד, קורה`:(isToday?`אכלת ${kc(tot.k)} עד עכשיו`:`נרשמו ${kc(tot.k)} · ${st==='low'?'הרבה פחות מהיעד':'מעט מתחת ליעד'}`)));
    const box=h('div',{class:'todaybox',style:'--c:var(--g-legs)'});
    box.append(h('div',{class:'hero-row'},kring(tot.k,T.kcal),h('div',{class:'grow'},h('div',{class:'small b muted'},isToday?'היעד להיום':'היעד ליום הזה'),h('div',{class:'k',style:'font-size:22px;line-height:1.15'},`${kc(T.kcal)} קק״ל`),h('div',{class:'small muted',style:'margin-top:3px;line-height:1.4'},line),S.nut.cycle!==false&&T.shift?h('div',{class:'daychip'},ic(T.training?'bolt':'heart'),h('span',{},T.training?'יום אימון: קצת יותר':'יום מנוחה: קצת פחות')):null),h('button',{class:'iconbtn',type:'button',html:I('dots'),'aria-label':'יעדים והעדפות',onclick:()=>go('#nut')})));
    box.append(h('div',{class:'mbars'},mbar('חלבון',tot.p,T.p,'var(--accent)'),mbar('פחמימות',tot.c,T.c,'var(--blue)'),mbar('שומן',tot.f,T.f,'var(--accent2)')));
    wrap.append(box);
  }
  /* what was eaten, and what the menu still holds for this day */
  const list=h('div',{class:'list'}); meals.forEach(m=>list.append(mealRow(d,m)));
  const plan=((S.mplan.days[d]||{}).meals||[]).filter(m=>!m.done);
  plan.forEach(m=>{ const r=m.rid?MenuKit.byId(m.rid):null, n=r?MenuKit.nut(r,m.sv):(m.n||[0,0,0,0]);
    list.append(h('div',{class:'meal plan',style:`--c:var(--g-${SLOT_COL[m.slot]||'full'})`},h('div',{class:'mi'},ic(SLOT_ICON[m.slot]||'fork')),h('button',{class:'grow',type:'button',style:'text-align:start',onclick:()=>r?go('#recipe-'+r.id):go('#mplan')},h('div',{class:'t ell'},r?r.t:(m.t||'ארוחה')),h('div',{class:'s'},`בתפריט · ${FoodKit.SLOT_HE[m.slot]} · ${kc(n[0])} קק״ל`)),h('button',{class:'do pressable',type:'button',onclick:()=>{ planEat(d,m); render(); }},'אכלתי'))); });
  if(meals.length||plan.length) wrap.append(list);
  else if(T.ok&&S.nut.goal) wrap.append(h('div',{class:'empty'},ic('fork'),h('div',{},isToday?'כותבים, אומרים או מצלמים מה אכלת, והיומן מחשב את השאר.':'אפשר לרשום גם ארוחות מימים קודמים.')));
  Dock.set(h('button',{class:'btn sgo',type:'button',onclick:()=>mealSheet(d)},ic('plus'),h('span',{},'רישום ארוחה')));
  /* everything about food, in boxes */
  const pn=S.pantry.items.length, sn=S.shop.items.filter(x=>!x.done).length, hasPlan=Object.keys(S.mplan.days).some(k=>k>=tk&&(S.mplan.days[k].meals||[]).length);
  wrap.append(h('div',{class:'sechub'},h('div',{class:'hub stagger'},
    hubBox('list','התפריט שלי',hasPlan?'הארוחות של הימים הקרובים':'תפריט לפי היעדים שלך','#mplan','chest','low'),
    hubBox('fridge','המטבח שלי',pn?plural(pn,'מצרך אחד','מצרכים')+' בבית':'מה יש במקרר ובארון','#pantry','back','low'),
    hubBox('pot','מתכונים',`${FoodKit.recipes().length} מתכונים עם ערכים`,'#recipes','shoulders','low'),
    hubBox('cart','רשימת קניות',sn?plural(sn,'פריט אחד','פריטים')+' לקנות':'מה חסר לתפריט','#shop','arms','low'),
    hubBox('trend','התקדמות','קלוריות, חלבון ומשקל','#nprog','cardio','low'),
    hubBox('target','יעדים והעדפות',T.ok&&S.nut.goal?(FoodKit.NGOALS.find(x=>x[0]===S.nut.goal)||[])[1]||'':'מטרה, כשרות, אלרגיות','#nut','full','low'),
    wideBox('chat','שאלה למאמן','מה לאכול עכשיו, מה להכין ממה שיש, תפריט לשבוע',()=>go('#chat'),'glutes'))));
  wrap.append(h('div',{class:'credit'},'הערכים התזונתיים: מאגר התזונה הלאומי, משרד הבריאות. המידע אינו ייעוץ רפואי.'));
  return wrap;
}
function mealRow(d,m){
  const t=mealSum(m), est=(m.it||[]).some(x=>x.est);
  return h('button',{class:'meal pressable',type:'button',style:`--c:var(--g-${SLOT_COL[m.s]||'full'})`,onclick:()=>mealView(d,m)},h('div',{class:'mi'},ic(SLOT_ICON[m.s]||'fork')),h('div',{class:'grow'},h('div',{class:'t'},FoodKit.SLOT_HE[m.s]||'ארוחה',est?estBadge():null),h('div',{class:'s'},mealLine(m))),h('div',{class:'k'},kc(t.k),h('small',{},' קק״ל')));
}
/* a logged meal: change an amount, move it to another meal of the day, or remove it */
function mealView(d,m){
  const body=h('div',{}), rows=h('div',{}), tl=h('div',{class:'ftot'});
  const paint=()=>{ rows.replaceChildren(); (m.it||[]).forEach((x,i)=>{ const per=x.g?x.e.map(v=>v/x.g*100):[0,0,0,0];
      const inp=h('input',{type:'number',inputmode:'decimal',min:'0',step:'1',value:String(x.g),'aria-label':`כמות בגרמים: ${x.n}`}), kcal=h('div',{class:'x'},`${kc(x.e[0])} קק״ל · ${g1(x.e[1])} ג׳ חלבון`);
      inp.addEventListener('change',()=>{ const g=Math.max(0,pnum(inp.value)); x.g=g; x.e=[Math.round(per[0]*g/100),Math.round(per[1]*g)/10,Math.round(per[2]*g)/10,Math.round(per[3]*g)/10]; delete x.est; delete x.q; delete x.u; foodSave(d); paint(); });
      rows.append(h('div',{class:'frow'},h('div',{class:'grow'},h('div',{class:'n'},x.n,x.est?estBadge():null),kcal),inp,h('span',{class:'u'},'ג׳'),h('button',{class:'rm',type:'button','aria-label':`הסרת ${x.n}`,html:I('x'),onclick:()=>{ m.it.splice(i,1); if(!m.it.length){ FoodKit.removeMeal(S.food,d,m.id); foodSave(d); Sheet.close(); return; } foodSave(d); paint(); }}))); });
    const t=mealSum(m); tl.replaceChildren(h('span',{},'סך הכול'),`${kc(t.k)} קק״ל · ${g1(t.p)} ג׳ חלבון`); };
  const seg=h('div',{class:'seg',style:'margin:4px 0 10px'},...['b','l','d','s'].map(sl=>h('button',{class:m.s===sl?'on':'',type:'button',onclick:ev=>{ m.s=sl; foodSave(d); [...seg.children].forEach(c=>c.classList.remove('on')); ev.currentTarget.classList.add('on'); }},FoodKit.SLOT_HE[sl].replace('ארוחת ',''))));
  paint();
  body.append(h('h2',{},FoodKit.SLOT_HE[m.s]||'ארוחה'),seg,rows,tl,h('button',{class:'btn danger',type:'button',style:'margin-top:10px',onclick:()=>{ FoodKit.removeMeal(S.food,d,m.id); foodSave(d); Sheet.close(); toast('הארוחה הוסרה'); }},'הסרת הארוחה'));
  Sheet.show(body,()=>render());
}

/* ---------- taking a meal in ---------- */
function mealSheet(d,slot){
  d=d||todayKey(); const o={date:d,slot:slot||(d===todayKey()?'':'l')};
  const ta=h('textarea',{rows:'2',placeholder:'למשל: 2 ביצים, 2 פרוסות לחם וקוטג׳',maxlength:'400','aria-label':'מה אכלת'});
  const btn=h('button',{class:'btn',type:'button',disabled:true},'המשך'), note=h('div',{}), prev=h('div',{}); let pic='';
  /* a photo of the plate waits in the sheet, so that a few words can go with it: what it is, how much of it was eaten */
  const setPic=url=>{ pic=url||''; prev.replaceChildren(); note.replaceChildren();
    if(pic) prev.append(h('div',{class:'fpic'},h('img',{src:pic,alt:'התמונה שנבחרה'}),h('div',{class:'grow'},h('div',{class:'b'},'התמונה תישלח למאמן'),h('div',{class:'small muted',style:'line-height:1.45'},'אפשר להוסיף כמה מילים למעלה: מה זה, וכמה אכלת מזה.')),h('button',{class:'rm',type:'button','aria-label':'הסרת התמונה',html:I('x'),onclick:()=>setPic('')})));
    ta.placeholder=pic?'למשל: חצי מנה, בלי הרוטב':'למשל: 2 ביצים, 2 פרוסות לחם וקוטג׳'; btn.disabled=!(ta.value.trim()||pic); };
  const run=()=>{ const t=ta.value.trim(); if(pic){ const url=pic; Sheet.close(); setTimeout(()=>askMeal(t,url,o),320); return; }
    if(!t) return; const R=FoodKit.parse(t,{hour:new Date().getHours()});
    if(R.items.length&&R.conf>=1){ Sheet.close(); setTimeout(()=>mealConfirm(R.items,{...o,slot:R.slot||o.slot,date:R.back?addDays(todayKey(),-1):d,src:'t'}),320); return; }
    note.replaceChildren(h('div',{class:'banner',style:'margin:10px 0 0'},ic('info'),h('span',{},R.items.length?`הבנתי: ${R.items.map(x=>x.name).join(', ')}. לא הכרתי: ${R.rest.join(' ')}.`:'את זה לא הצלחתי לפרק לבד.')),
      h('div',{class:'row',style:'gap:8px;margin-top:10px'},R.items.length?h('button',{class:'btn sm sec2',type:'button',style:'flex:1',onclick:()=>{ Sheet.close(); setTimeout(()=>mealConfirm(R.items,{...o,slot:R.slot||o.slot,src:'t'}),320); }},'רישום מה שהבנתי'):null,h('button',{class:'btn sm',type:'button',style:'flex:1',onclick:()=>{ Sheet.close(); setTimeout(()=>askMeal(t,'',o),320); }},'המאמן יפענח'))); };
  ta.addEventListener('input',()=>{ btn.disabled=!(ta.value.trim()||pic); }); btn.addEventListener('click',run);
  ta.addEventListener('keydown',ev=>{ if(ev.key==='Enter'&&!ev.shiftKey){ ev.preventDefault(); run(); } });
  const mic=micBtn(ta,()=>{ if(!pic) run(); }); if(mic) mic.className='btn sm sec2';
  /* no "capture": the phone then offers both the camera and the pictures already on it */
  const cam=h('input',{type:'file',accept:'image/*',class:'hide'}); cam.addEventListener('change',async()=>{ const f=cam.files[0]; if(!f) return; try{ const url=await fileToDataUrl(f,1024,0.8); setPic(url); }catch(e){ toast('לא הצלחתי לפתוח את התמונה'); } cam.value=''; });
  const way=(icn,t,fn)=>h('button',{class:'fway pressable',type:'button',onclick:fn},ic(icn),h('span',{},t));
  const body=h('div',{class:'mealin'},h('h2',{},'מה אכלת?'),h('div',{class:'fld'},ta),prev,h('div',{class:'row',style:'gap:8px;margin-top:10px'},mic?h('div',{style:'flex:none'},mic):null,btn),note,
    h('div',{class:'fways'},way('camera','תמונה',()=>cam.click()),way('barcode','ברקוד',()=>{ Sheet.close(); setTimeout(()=>barcodeSheet(o),320); }),way('search','חיפוש',()=>{ Sheet.close(); setTimeout(()=>foodFind(o),320); })),cam);
  const rec=FoodKit.recent(S.food,8);
  if(rec.length){ const chips=h('div',{class:'gchips'}); rec.forEach(x=>chips.append(h('button',{class:'gchip',type:'button',onclick:()=>{ logMeal([{name:x.n,k:x.k,g:x.g,e:x.e,est:x.est,q:x.q,u:x.u}],o); Sheet.close(); toast(`נרשם: ${x.n}, ${kc(x.e[0])} קק״ל`); haptic(10); }},x.n)));
    body.append(h('div',{class:'small b muted',style:'margin:14px 2px 8px'},'מהפעמים האחרונות'),chips); }
  Sheet.show(body,()=>render()); setTimeout(()=>{ try{ ta.focus(); }catch(e){} },350);
}
/* the list before it goes into the diary: every amount can be corrected, and an estimate says that it is one */
function mealConfirm(items,o){
  o=o||{}; let slot=o.slot||slotNow(); const its=items.map(x=>({...x,per:x.g?x.e.map(v=>v/x.g*100):[0,0,0,0]}));
  const body=h('div',{}), rows=h('div',{}), go2=h('button',{class:'btn',type:'button'},'אישור');
  /* the total can be typed over: the foods are scaled to it, each in its own proportion */
  const tin=h('input',{type:'number',inputmode:'numeric',min:'0',step:'10','aria-label':'סך הקלוריות. אפשר לתקן'}), tp=h('b',{}), tl=h('div',{class:'ftot'},h('span',{},'סך הכול'),h('div',{class:'tk'},tin,tp));
  tin.addEventListener('input',()=>{ const want=Math.max(0,pnum(tin.value)), cur=FoodKit.sum(its.map(x=>x.e)).k; if(!(want>0)||!(cur>0)) return; const f=want/cur;
    its.forEach(x=>{ x.e=x.e.map(v=>v*f); x.per=x.per.map(v=>v*f); x.est=false; }); paint(); });
  const paint=()=>{ rows.replaceChildren(); its.forEach((x,i)=>{
      const inp=h('input',{type:'number',inputmode:'decimal',min:'0',step:'1',value:String(Math.round(x.g)),'aria-label':`כמות בגרמים: ${x.name}`}), sub=h('div',{class:'x'});
      const calc=()=>{ sub.textContent=`${kc(x.e[0])} קק״ל · ${g1(x.e[1])} ג׳ חלבון`; };
      inp.addEventListener('input',()=>{ const g=Math.max(0,pnum(inp.value)); x.g=g; x.e=[x.per[0]*g/100,x.per[1]*g/100,x.per[2]*g/100,x.per[3]*g/100]; x.q=null; x.est=false; calc(); total(); });
      calc(); rows.append(h('div',{class:'frow'},h('div',{class:'grow'},h('div',{class:'n'},x.name,x.est?estBadge():null),sub),inp,h('span',{class:'u'},'ג׳'),h('button',{class:'rm',type:'button','aria-label':`הסרת ${x.name}`,html:I('x'),onclick:()=>{ its.splice(i,1); paint(); }}))); });
    total(); go2.disabled=!its.length; };
  const total=()=>{ const t=FoodKit.sum(its.map(x=>x.e)); if(document.activeElement!==tin) tin.value=String(Math.round(t.k)); tp.textContent=`קק״ל · ${g1(t.p)} ג׳ חלבון`; };
  const seg=h('div',{class:'seg',style:'margin:4px 0 6px'},...['b','l','d','s'].map(sl=>h('button',{class:slot===sl?'on':'',type:'button',onclick:ev=>{ slot=sl; [...seg.children].forEach(c=>c.classList.remove('on')); ev.currentTarget.classList.add('on'); }},FoodKit.SLOT_HE[sl].replace('ארוחת ',''))));
  go2.addEventListener('click',()=>{ if(!its.length) return; const m=logMeal(its,{...o,slot}); const t=FoodKit.sum(its.map(x=>x.e)); Sheet.close(); haptic(15); toast(`נרשם: ${kc(t.k)} קק״ל, ${g1(t.p)} ג׳ חלבון`); if(o.onDone) o.onDone(m); });
  paint();
  body.append(h('h2',{},'לרשום את הארוחה?'));
  /* what the coach saw or understood, in its own words, next to the picture it looked at */
  if(o.note||o.img) body.append(h('div',{class:'fsaw'},o.img?h('img',{src:o.img,alt:'התמונה שנשלחה'}):null,o.note?h('p',{},o.note):null));
  body.append(seg,rows,tl,h('div',{class:'small muted',style:'margin:0 0 10px;line-height:1.45'},'אפשר לתקן את הקלוריות כאן, או את הגרמים בכל שורה.'),go2,h('button',{class:'lnkline center',type:'button',onclick:()=>{ Sheet.close(); setTimeout(()=>foodFind({...o,slot,more:its}),320); }},ic('plus'),h('span',{},'עוד מאכל')));
  Sheet.show(body,()=>render());
}
/* what the vocabulary cannot read (a restaurant dish, a photo of a plate) goes to the coach, and comes back as the same list */
async function askMeal(text,img,o){
  const wait=h('div',{},h('h2',{},img?'מסתכל על הצלחת…':'המאמן מפענח…'),img?h('img',{src:img,alt:'',style:'width:100%;max-height:220px;object-fit:cover;border-radius:var(--r-l);margin-bottom:12px'}):null,h('p',{class:'small muted',style:'margin:0;line-height:1.6'},'זה לוקח כמה שניות. הכמויות שיחזרו הן הערכה, ואפשר לתקן אותן לפני הרישום.'));
  Sheet.show(wait,()=>render());
  const R=await coachCall(text||'',img||'',{quiet:true}); if(!Sheet.open) return;
  const act=R.ok?(R.acts||[]).find(a=>a.t==='meal'):null;
  Sheet.close();
  if(!act){ setTimeout(()=>Sheet.show(h('div',{},h('h2',{},'לא יצא רישום'),h('p',{style:'margin:0 0 14px;line-height:1.6'},R.say||'לא הצלחתי לפענח את הארוחה.'),R.why==='auth'?h('button',{class:'btn',type:'button',onclick:()=>{ Sheet.close(); setTimeout(()=>authSheet('login'),320); }},'כניסה או הרשמה'):h('button',{class:'btn',type:'button',onclick:()=>{ Sheet.close(); setTimeout(()=>foodFind(o),320); }},'חיפוש במאגר')),()=>render()),340); return; }
  setTimeout(()=>mealConfirm(actItems(act.items),{...o,slot:act.slot||o.slot,date:act.date||o.date,src:img?'p':'ai',note:R.say,img:img||''}),340);
}
/* items as a model names them -> items of the diary. A name the vocabulary knows gets the table's numbers for the stated weight */
function actItems(list){
  return (list||[]).map(x=>{ const R=FoodKit.parse(x.name||''), one=R.items.length===1&&R.conf>=1?FoodKit.byKey(R.items[0].k):null, g=+x.grams||0;
    if(one&&g>0){ const n=FoodKit.per(one.n,g); return {name:one.k,k:one.k,g,e:[n.k,n.p,n.c,n.f],est:!!x.est}; }
    return {name:x.name,k:'',g:g||100,e:[+x.kcal||0,+x.p||0,+x.c||0,+x.f||0],est:true,ai:true}; });
}

/* ---------- search, amount, barcode, a product of one's own ---------- */
function foodFind(o){
  o=o||{}; const q=h('input',{type:'search',placeholder:'חיפוש מאכל או מוצר',autocomplete:'off','aria-label':'חיפוש מאכל'}), list=h('div',{class:'list',style:'margin-top:4px'}), body=h('div',{});
  const draw=()=>{ const t=q.value.trim(); list.replaceChildren();
    if(!t){ const rec=FoodKit.recent(S.food,10); if(!rec.length){ list.append(h('div',{class:'empty'},ic('search'),h('div',{},'מקלידים שם של מאכל. המאגר כולל יותר מ-4,500 מזונות.'))); return; }
      rec.forEach(x=>list.append(h('button',{class:'item pressable',type:'button',onclick:()=>{ const fd=x.k?FoodKit.food('v',x.k):null; Sheet.close(); setTimeout(()=>fd?amountSheet(fd,o):mealConfirm([{name:x.n,k:x.k,g:x.g,e:x.e,est:!!x.est}],o),320); }},h('div',{class:'grow'},h('div',{class:'t ell'},x.n),h('div',{class:'s'},`${g1(x.g)} ג׳ · ${kc(x.e[0])} קק״ל`)),h('span',{class:'chev',html:I('chev')})))); return; }
    const res=FoodKit.search(t,40);
    res.forEach(fd=>list.append(h('button',{class:'item pressable',type:'button',onclick:()=>{ Sheet.close(); setTimeout(()=>amountSheet(fd,o),320); }},h('div',{class:'grow'},h('div',{class:'t'},fd.name),h('div',{class:'s'},`${kc(fd.per[0])} קק״ל ו-${g1(fd.per[1])} ג׳ חלבון ב-100 ג׳${fd.src==='m'?' · שלי':''}`)),h('span',{class:'chev',html:I('chev')}))));
    if(!res.length) list.append(h('div',{class:'empty'},ic('search'),h('div',{},FD.db?'לא נמצא. אפשר להוסיף מוצר משלך.':'מחפש במאגר המלא…')));
    list.append(h('button',{class:'item pressable',type:'button',onclick:()=>{ Sheet.close(); setTimeout(()=>myFoodSheet({name:t},o),320); }},h('div',{class:'th',style:'width:40px;height:40px;border-radius:var(--r-s);color:var(--accent-t);background:var(--accent-soft)'},ic('plus')),h('div',{class:'grow'},h('div',{class:'t'},'מוצר משלי'),h('div',{class:'s'},'שם וערכים מהאריזה')))); };
  q.addEventListener('input',draw); foodDb().then(()=>{ if(Sheet.open&&body.isConnected) draw(); });
  body.append(h('h2',{},o.more?'עוד מאכל':'חיפוש'),h('div',{class:'search'},ic('search'),q),list); draw();
  Sheet.show(body,()=>render()); setTimeout(()=>{ try{ q.focus(); }catch(e){} },350);
}
function amountSheet(fd,o){
  o=o||{}; const units=Object.keys(fd.units||{}); let u=fd.u&&fd.u!=='g'&&fd.u!=='ml'&&units.includes(fd.u)?fd.u:'g', q=u==='g'?Math.round(fd.d||100):1;
  const inp=h('input',{type:'number',inputmode:'decimal',min:'0',step:'any',value:String(q),'aria-label':'כמות'}), line=h('div',{class:'ftot'}), chips=h('div',{class:'gchips'});
  const grams=()=>u==='g'?q:q*(fd.units[u]||0), calc=()=>{ const n=FoodKit.per(fd.per,grams()); line.replaceChildren(h('span',{},u==='g'?'':`${g1(grams())} ג׳`),`${kc(n.k)} קק״ל · ${g1(n.p)} ג׳ חלבון`); };
  const paintU=()=>{ chips.replaceChildren(...['g'].concat(units).map(x=>h('button',{class:'gchip'+(u===x?' on':''),type:'button','aria-pressed':u===x?'true':'false',onclick:()=>{ const was=grams(); u=x; q=x==='g'?Math.round(was||fd.d||100):1; inp.value=String(q); paintU(); calc(); }},x==='g'?'גרמים':x))); };
  inp.addEventListener('input',()=>{ q=Math.max(0,pnum(inp.value)); calc(); });
  const add=()=>{ const g=grams(); if(!(g>0)){ toast('מקלידים כמות'); return; } const n=FoodKit.per(fd.per,g), it={name:fd.name,k:fd.src==='v'?fd.key:'',g,e:[n.k,n.p,n.c,n.f],q:u==='g'?null:q,u:u==='g'?'':u};
    if(o.more){ Sheet.close(); setTimeout(()=>mealConfirm(o.more.concat([it]),{...o,more:null}),320); return; }
    logMeal([it],o); Sheet.close(); haptic(12); toast(`נרשם: ${fd.name}, ${kc(n.k)} קק״ל`); };
  paintU(); calc();
  Sheet.show(h('div',{},h('h2',{},fd.name),h('p',{class:'small muted',style:'margin:0 0 12px'},`${kc(fd.per[0])} קק״ל, ${g1(fd.per[1])} ג׳ חלבון, ${g1(fd.per[2])} ג׳ פחמימות ו-${g1(fd.per[3])} ג׳ שומן ב-100 ג׳`),h('div',{class:'fld'},h('label',{},'יחידה'),chips),h('div',{class:'fld'},h('label',{},'כמה'),inp),line,h('button',{class:'btn',type:'button',onclick:add},o.more?'הוספה לארוחה':'רישום')),()=>render());
  setTimeout(()=>{ try{ inp.focus(); inp.select(); }catch(e){} },350);
}
/* a barcode: the camera where the browser can read codes by itself, the digits by hand everywhere. Product facts come from Open Food Facts */
function barcodeSheet(o){
  const body=h('div',{}), inp=h('input',{type:'text',inputmode:'numeric',pattern:'[0-9]*',placeholder:'הספרות שמתחת לברקוד',maxlength:'14','aria-label':'מספר הברקוד'}), msg=h('div',{}); let stream=null, timer=null, busy=false;
  const stop=()=>{ clearInterval(timer); timer=null; if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; } };
  const look=async code=>{ code=String(code||'').replace(/\D/g,''); if(code.length<8||busy) return; busy=true; stop();
    const mine=S.myfood.items.find(x=>x.code===code); if(mine){ Sheet.close(); setTimeout(()=>amountSheet(FoodKit.food('m',mine.id),o),320); return; }
    msg.replaceChildren(h('div',{class:'banner blue'},ic('info'),h('span',{},'מחפש את המוצר…')));
    let p=null; try{ const r=await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=code,product_name,product_name_he,brands,nutriments,serving_quantity`); const j=await r.json(); if(j&&j.status===1) p=j.product; }catch(e){ p=null; }
    busy=false; if(!Sheet.open) return;
    const nm=p&&(p.product_name_he||p.product_name), nu=(p&&p.nutriments)||{}, kcal=+nu['energy-kcal_100g']||(+nu.energy_100g?nu.energy_100g/4.184:0);
    if(nm&&kcal>0){ const m={id:'b'+code,n:String(nm).slice(0,60),brand:String(p.brands||'').split(',')[0].slice(0,30),code,per:[Math.round(kcal),+nu.proteins_100g||0,+nu.carbohydrates_100g||0,+nu.fat_100g||0,0],...(+p.serving_quantity>0?{u:'מנה',ug:+p.serving_quantity}:{})};
      saveMine(m); Sheet.close(); setTimeout(()=>amountSheet(FoodKit.food('m',m.id),o),320); return; }
    msg.replaceChildren(h('div',{class:'banner'},ic('info'),h('span',{},nm?'המוצר נמצא, אבל בלי ערכים תזונתיים. אפשר להקליד אותם מהאריזה.':'המוצר לא נמצא במאגר הפתוח. אפשר להקליד את הערכים מהאריזה.')),h('button',{class:'btn',type:'button',onclick:()=>{ Sheet.close(); setTimeout(()=>myFoodSheet({name:nm||'',code},o),320); }},'מקלידים מהאריזה')); };
  inp.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); look(inp.value); } });
  body.append(h('h2',{},'ברקוד'));
  if('BarcodeDetector' in window&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
    const video=h('video',{playsinline:true,muted:true,autoplay:true}), box=h('div',{class:'scanbox'},video); body.append(box);
    navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(st=>{ if(!Sheet.open){ st.getTracks().forEach(t=>t.stop()); return; } stream=st; video.srcObject=st; let det; try{ det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']}); }catch(e){ det=null; }
      if(det) timer=setInterval(async()=>{ if(busy||video.readyState<2) return; try{ const c=await det.detect(video); if(c&&c[0]&&c[0].rawValue){ inp.value=c[0].rawValue; haptic(20); look(c[0].rawValue); } }catch(e){} },450); }).catch(()=>{ box.remove(); });
  }
  body.append(h('div',{class:'addrow'},h('div',{class:'fld grow'},inp),h('button',{class:'btn sm',type:'button',onclick:()=>look(inp.value)},'חיפוש')),msg,h('p',{class:'small muted',style:'margin:10px 0 0;line-height:1.55'},'פרטי המוצרים מגיעים מ-Open Food Facts, מאגר פתוח שאנשים ממלאים. כדאי להציץ שהערכים תואמים לאריזה.'));
  Sheet.show(body,()=>{ stop(); render(); });
}
function saveMine(m){ const l=S.myfood.items, i=l.findIndex(x=>x.id===m.id); if(i>=0) l[i]=m; else l.push(m); if(l.length>300) S.myfood.items=l.slice(-300); FoodKit.setMine(S.myfood.items); save('myfood',S.myfood); }
function myFoodSheet(seed,o){
  seed=seed||{}; const f=(label,ph,val)=>{ const i=h('input',{type:ph==='שם'?'text':'number',inputmode:ph==='שם'?'text':'decimal',placeholder:ph,value:val||'',step:'any',min:'0'}); return [i,h('div',{class:'fld'},h('label',{},label),i)]; };
  const [nm,fn]=f('שם המוצר','שם',seed.name), [kcal,fk]=f('קלוריות ב-100 ג׳','קק״ל'), [p,fp]=f('חלבון','ג׳'), [c,fc]=f('פחמימות','ג׳'), [fat,ff]=f('שומן','ג׳');
  Sheet.show(h('div',{},h('h2',{},'מוצר משלי'),h('p',{class:'small muted',style:'margin:0 0 12px;line-height:1.5'},'מעתיקים מהטבלה שעל האריזה, את העמודה של 100 גרם.'),fn,fk,h('div',{class:'grid3'},fp,fc,ff),h('button',{class:'btn',type:'button',onclick:()=>{ const name=nm.value.trim(), k=pnum(kcal.value); if(!name||!(k>0)){ toast('צריך שם וקלוריות'); return; }
    const m={id:seed.code?'b'+seed.code:'u'+Date.now().toString(36),n:name.slice(0,60),code:seed.code||'',per:[Math.round(k),pnum(p.value),pnum(c.value),pnum(fat.value),0]}; saveMine(m); Sheet.close(); setTimeout(()=>amountSheet(FoodKit.food('m',m.id),o),320); }},'שמירה והמשך')),()=>render());
}

/* ========================= targets and preferences ========================= */
function nutPage(){
  header('יעדים והעדפות',{back:'#food'}); const wrap=h('div'), n=S.nut, p=S.profile, m=bodyMetrics(p);
  wrap.append(h('div',{class:'display'},'יעדי התזונה'));
  if(!m){ wrap.append(h('div',{class:'card'},h('div',{class:'k',style:'margin-bottom:4px'},'קודם כמה פרטים על הגוף'),h('p',{class:'small muted',style:'margin:0 0 12px;line-height:1.5'},'גובה, משקל וגיל. בלעדיהם אי אפשר לחשב כמה הגוף שורף.'),h('button',{class:'btn',type:'button',onclick:editBodySheet},'ממלאים עכשיו'))); }
  wrap.append(h('div',{class:'sec'},h('h2',{},'המטרה בתזונה')));
  const grid=h('div',{class:'typegrid one'}); FoodKit.NGOALS.forEach(([k,t,s])=>grid.append(h('button',{class:'typebtn pressable'+(n.goal===k?' on':''),type:'button','aria-pressed':n.goal===k?'true':'false',style:'flex-direction:column;align-items:flex-start;gap:2px',onclick:()=>{ n.goal=k; n.custom=null; saveNut(); nutAch(500); render(); }},h('span',{},t),h('span',{class:'small muted',style:'font-weight:600'},s))));
  wrap.append(grid);
  const T=FoodKit.targets(p,n);
  if(T.ok&&n.goal){
    if(n.goal==='lose'&&!T.custom) wrap.append(h('div',{class:'card',style:'margin-top:12px'},h('div',{class:'sfld'},h('div',{class:'sl'},'קצב הירידה'),h('div',{class:'seg'},...[['slow','רגוע'],['','רגיל'],['fast','מהיר']].map(([v,l])=>h('button',{class:(n.pace||'')===v?'on':'',type:'button',onclick:()=>{ n.pace=v; saveNut(); render(); }},l))))));
    const box=h('div',{class:'hero-stats',style:'margin-top:12px'});
    box.append(h('div',{class:'xs b muted',style:'letter-spacing:.06em;margin-bottom:6px'},T.custom?'היעד שקבעת':'היעד היומי שלך'),h('div',{class:'big-num'},kc(T.kcal),h('small',{},'קק״ל')),
      h('div',{class:'mbars'},mbar('חלבון',T.p,0,'var(--accent)'),mbar('פחמימות',T.c,0,'var(--blue)'),mbar('שומן',T.f,0,'var(--accent2)')),
      h('div',{class:'small muted',style:'margin-top:12px;line-height:1.55'},T.custom?'יעד ידני. אפשר לחזור ליעד המחושב בכל רגע.':`הגוף שלך שורף כ-${kc(T.tdee)} קק״ל ביום. ${({lose:'היעד נמוך מזה, כדי לרדת בלי לאבד שריר.',muscle:'היעד מעט מעל, כדי לתת לשריר ממה לגדול.',gain:'היעד מעל, כדי לעלות לאט ובשליטה.',keep:'היעד שווה לזה, כדי לשמור על המשקל.',habits:'היעד שווה לזה. הדגש כאן הוא סדר ועקביות, לא ספירה.'})[n.goal]||''}`));
    (T.notes||[]).forEach(t=>box.append(h('div',{class:'banner',style:'margin:12px 0 0'},ic('info'),h('span',{},t))));
    box.append(h('div',{class:'row',style:'gap:8px;margin-top:12px'},h('button',{class:'btn sm sec2',type:'button',onclick:()=>customTargets(T)},T.custom?'שינוי היעד הידני':'יעד ידני'),T.custom?h('button',{class:'btn sm sec2',type:'button',onclick:()=>{ n.custom=null; saveNut(); render(); }},'חזרה למחושב'):null));
    wrap.append(box);
    wrap.append(h('div',{class:'list'},toggleRow('ימי אימון וימי מנוחה',n.cycle!==false,v=>{ n.cycle=v; saveNut(); render(); },'ביום אימון קצת יותר פחמימות, ביום מנוחה קצת פחות. הסכום השבועי נשאר זהה')));
  }
  wrap.append(h('div',{class:'sec'},h('h2',{},'מה אוכלים')));
  const seg=(opts,cur,fn)=>h('div',{class:'seg'},...opts.map(([v,l])=>h('button',{class:String(cur)===String(v)?'on':'',type:'button',onclick:()=>fn(v)},l)));
  const alc=h('div',{class:'gchips'}); Object.entries(CoachKit.AL_HE).forEach(([k,l])=>{ const on=(n.al||[]).includes(k); alc.append(h('button',{class:'gchip'+(on?' on':''),type:'button','aria-pressed':on?'true':'false',onclick:()=>{ n.al=on?n.al.filter(x=>x!==k):(n.al||[]).concat([k]); saveNut(); render(); }},l)); });
  wrap.append(h('div',{class:'card'},h('div',{class:'sfld'},h('div',{class:'sl'},'סגנון'),seg([[0,'הכול'],[1,'צמחוני'],[2,'טבעוני']],+n.veg||0,v=>{ n.veg=+v; saveNut(); render(); })),h('div',{class:'sfld'},h('div',{class:'sl'},'ארוחות ביום'),seg([[3,'3'],[4,'4'],[5,'5']],+n.meals||4,v=>{ n.meals=+v; saveNut(); render(); })),h('div',{class:'sfld'},h('div',{class:'sl'},'בלי (אלרגיות ורגישויות)'),alc)));
  wrap.append(h('div',{class:'list'},toggleRow('כשר',!!n.kosher,v=>{ n.kosher=v; saveNut(); render(); },'בלי בשר וחלב באותה ארוחה, בלי חזיר ופירות ים')));
  const no=(n.no||[]);
  wrap.append(h('div',{class:'list morelist'},
    h('button',{class:'item pressable',type:'button',onclick:dislikeSheet},h('div',{class:'grow'},h('div',{class:'t'},'מאכלים שלא בא לי'),h('div',{class:'s ell'},no.length?no.join(', '):'התפריטים וההצעות ידלגו עליהם')),h('span',{class:'chev',html:I('chev')})),
    h('button',{class:'item pressable',type:'button',onclick:()=>pickSheet('תקציב שבועי לאוכל','המאמן והתפריט יעדיפו ארוחות זולות יותר כשיש תקציב.',[[0,'בלי תקציב'],[250,'250 ₪'],[350,'350 ₪'],[450,'450 ₪'],[600,'600 ₪'],[800,'800 ₪']],+n.budget||0,v=>{ n.budget=+v; saveNut(); render(); })},h('div',{class:'grow'},h('div',{class:'t'},'תקציב שבועי לאוכל'),h('div',{class:'s'},n.budget?`${n.budget} ₪ לשבוע`:'בלי תקציב')),h('span',{class:'chev',html:I('chev')}))));
  wrap.append(h('div',{class:'credit'},'החישוב לפי נוסחת Mifflin-St Jeor והנחיות ISSN לחלבון. המידע אינו ייעוץ רפואי.'));
  return wrap;
}
function customTargets(T){
  const mk=(l,v,u)=>{ const i=h('input',{type:'number',inputmode:'numeric',value:String(v),min:'0'}); return [i,h('div',{class:'fld'},h('label',{},`${l} · ${u}`),i)]; };
  const [k,fk]=mk('קלוריות',T.kcal,'קק״ל'), [p,fp]=mk('חלבון',T.p,'ג׳'), [c,fc]=mk('פחמימות',T.c,'ג׳'), [f,ff]=mk('שומן',T.f,'ג׳');
  Sheet.show(h('div',{},h('h2',{},'יעד ידני'),h('p',{class:'small muted',style:'margin:0 0 12px;line-height:1.5'},'למי שקיבל מספרים מדיאטנית או רוצה לקבוע בעצמו.'),fk,h('div',{class:'grid3'},fp,fc,ff),h('button',{class:'btn',type:'button',onclick:()=>{ const kcal=pnum(k.value), floor=S.profile.sex==='f'?1200:1500; if(kcal<floor){ toast(`פחות מ-${floor} קק״ל ביום זה מתחת לרצפה הבטוחה`); return; } S.nut.custom={kcal,p:pnum(p.value),c:pnum(c.value),f:pnum(f.value)}; saveNut(); Sheet.close(); render(); toast('היעד נשמר'); }},'שמירה')));
}
function dislikeSheet(){
  const inp=h('input',{type:'text',placeholder:'למשל: חציל, דגים, פטריות',autocomplete:'off'}), chips=h('div',{class:'gchips',style:'margin-bottom:12px'});
  const draw=()=>{ chips.replaceChildren(...(S.nut.no||[]).map(k=>h('button',{class:'gchip on',type:'button','aria-label':`הסרת ${k}`,onclick:()=>{ S.nut.no=S.nut.no.filter(x=>x!==k); saveNut(); draw(); }},h('span',{},k),ic('x')))); };
  const add=()=>{ const R=FoodKit.parse(inp.value); if(!R.items.length){ toast('לא הכרתי את המאכל הזה'); return; } const s=new Set(S.nut.no||[]); R.items.forEach(x=>s.add(x.k)); S.nut.no=[...s]; saveNut(); inp.value=''; draw(); };
  inp.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); add(); } }); draw();
  Sheet.show(h('div',{},h('h2',{},'מאכלים שלא בא לי'),chips,h('div',{class:'addrow'},h('div',{class:'fld grow'},inp),h('button',{class:'btn sm',type:'button',onclick:add},'הוספה'))),()=>render());
}

/* ========================= the pantry ========================= */
const CAT_HE={poultry:'עוף והודו',meat:'בשר',fish:'דגים',egg:'ביצים',dairy:'מוצרי חלב',legume:'קטניות',grain:'דגנים',bread:'לחם ומאפים',veg:'ירקות',fruit:'פירות',nut:'אגוזים וזרעים',fat:'שמנים',sauce:'רטבים וממרחים',sweet:'מתוקים',snack:'חטיפים',drink:'משקאות',dish:'מוכן',spice:'תבלינים',other:'אחר','':'אחר'};
const CAT_ORDER=['poultry','meat','fish','egg','dairy','legume','grain','bread','veg','fruit','nut','fat','sauce','dish','sweet','snack','drink','spice','other',''];
function savePantry(){ return save('pantry',S.pantry); }
function pantryAdd(items){
  items.forEach(x=>{ const cur=S.pantry.items.find(y=>(x.k&&y.k===x.k)||(!x.k&&!y.k&&y.n===x.n));
    if(cur){ if(x.q==null||cur.q==null){ if(x.q!=null&&cur.q==null){ cur.q=x.q; cur.u=x.u; } } else if(cur.u===x.u) cur.q=Math.round((cur.q+x.q)*10)/10; else { cur.q=x.q; cur.u=x.u; } cur.at=Date.now(); }
    else S.pantry.items.push({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),k:x.k||'',n:x.n,q:x.q==null?null:x.q,u:x.u||'g',at:Date.now(),...(x.exp?{exp:x.exp}:{})}); });
  savePantry(); nutAch(600);
}
/* what runs out goes onto the shopping list by itself, with no amount: the person decides how much to buy */
function pantryRemove(keys,toShop){
  const gone=S.pantry.items.filter(x=>keys.includes(x.k)||keys.includes(x.n)); S.pantry.items=S.pantry.items.filter(x=>!gone.includes(x)); savePantry();
  if(toShop&&gone.length) shopAdd(gone.map(x=>({k:x.k,n:x.n,q:null,u:x.u})),'e');
  return gone.length;
}
function pantryPage(){
  header('המטבח שלי',{back:'#food'}); const wrap=h('div'); wrap.append(h('div',{class:'display'},'המטבח שלי'),h('p',{class:'lead'},'כותבים או אומרים מה יש בבית, והתפריט וההצעות מתחילים ממה שכבר קנית.'));
  if(!FD.core){ if(!FD.failed) foodCore(); wrap.append(foodWait()); return wrap; }
  const inp=h('input',{type:'text',placeholder:'יש לי קילו עוף, 6 ביצים ואורז',autocomplete:'off',enterkeyhint:'done','aria-label':'מה יש בבית'});
  const add=()=>{ const t=inp.value.trim(); if(!t) return; const R=FoodKit.parsePantry(t); if(!R.items.length){ toast('לא הכרתי את המצרכים האלה'); return; } pantryAdd(R.items); inp.value=''; haptic(10); toast(R.rest.length?`נוסף. לא הכרתי: ${R.rest.join(' ')}`:`נוסף למטבח: ${R.items.map(x=>x.n).join(', ')}`); render(); };
  inp.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); add(); } });
  const mic=micBtn(inp,()=>add()); if(mic) mic.className='btn sm sec2';
  wrap.append(h('div',{class:'addrow'},h('div',{class:'fld grow'},inp),mic,h('button',{class:'btn sm',type:'button',onclick:add},'הוספה')));
  const items=S.pantry.items, soon=MenuKit.expiring(S.pantry,todayKey(),3);
  if(soon.length) wrap.append(h('div',{class:'banner'},ic('clock'),h('span',{},`כדאי להשתמש בקרוב: ${soon.map(x=>x.n).join(', ')}.`)));
  if(!items.length){ wrap.append(h('div',{class:'empty'},ic('fridge'),h('div',{},'המטבח עוד ריק. מתחילים במה שיש עכשיו במקרר.'))); return wrap; }
  const can=MenuKit.suggest({prefs:nutPrefs(),stock:MenuKit.stock(S.pantry)}).filter(x=>x.cover.ok).length;
  wrap.append(h('button',{class:'card pressable',type:'button',style:'width:100%;text-align:start',onclick:()=>{ RCP.f='home'; go('#recipes'); }},h('div',{class:'row'},h('div',{class:'grow'},h('div',{class:'k'},can?`אפשר להכין עכשיו ${plural(can,'מתכון אחד','מתכונים')}`:'מה אפשר להכין ממה שיש'),h('div',{class:'small muted'},can?'בלי לקנות שום דבר':'ומה חסר לכל מתכון')),ic('chev'))));
  const by={}; items.forEach(x=>{ const c=(FoodKit.byKey(x.k)||{}).c||''; (by[c]=by[c]||[]).push(x); });
  CAT_ORDER.forEach(c=>{ if(!by[c]) return; wrap.append(h('div',{class:'catl'},CAT_HE[c]||'אחר')); const l=h('div',{class:'list'});
    by[c].sort((a,b)=>a.n.localeCompare(b.n,'he')).forEach(x=>l.append(h('button',{class:'item pressable',type:'button',style:'min-height:56px',onclick:()=>pantryItemSheet(x)},h('div',{class:'grow'},h('div',{class:'t'},x.n),x.exp?h('div',{class:'s'},`בתוקף עד ${fmtDate(x.exp)}`):null),h('span',{class:'small b muted'},MenuKit.qtyText(x.q,x.u)),h('span',{class:'chev',html:I('chev')})))); wrap.append(l); });
  return wrap;
}
function pantryItemSheet(x){
  let u=x.u||'g'; const q=h('input',{type:'number',inputmode:'decimal',min:'0',step:'any',value:x.q==null?'':String(x.q),placeholder:'לא ידוע','aria-label':'כמות'}), exp=h('input',{type:'date',value:x.exp||'',min:todayKey(),'aria-label':'בתוקף עד'});
  const seg=h('div',{class:'seg'},...[['g','גרם'],['ml','מ״ל'],['יח','יחידות']].map(([v,l])=>h('button',{class:u===v?'on':'',type:'button',onclick:ev=>{ u=v; [...seg.children].forEach(c=>c.classList.remove('on')); ev.currentTarget.classList.add('on'); }},l)));
  Sheet.show(h('div',{},h('h2',{},x.n),h('div',{class:'fld'},h('label',{},'כמה יש'),q),h('div',{class:'fld'},h('label',{},'נמדד ב'),seg),h('div',{class:'fld'},h('label',{},'בתוקף עד (לא חובה)'),exp),
    h('button',{class:'btn',type:'button',onclick:()=>{ x.q=q.value===''?null:Math.max(0,pnum(q.value)); x.u=u; if(exp.value) x.exp=exp.value; else delete x.exp; if(x.q===0) S.pantry.items=S.pantry.items.filter(y=>y!==x); savePantry(); Sheet.close(); render(); }},'שמירה'),
    h('button',{class:'btn danger',type:'button',style:'margin-top:8px',onclick:()=>{ pantryRemove([x.k||x.n],true); Sheet.close(); toast('הוסר מהמטבח ונכנס לרשימת הקניות'); render(); }},'נגמר')));
}

/* ========================= recipes ========================= */
const RCP={f:'all',sv:{}};
function planUsed(){ const u={}, tk=todayKey(); Object.keys(S.mplan.days).forEach(d=>{ if(d>=addDays(tk,-3)) (S.mplan.days[d].meals||[]).forEach(m=>{ if(m.rid) u[m.rid]=(u[m.rid]||0)+1; }); }); return u; }
function recipesPage(){
  header('מתכונים',{back:'#food'}); const wrap=h('div'); wrap.append(h('div',{class:'display'},'מתכונים'));
  if(!FD.core){ if(!FD.failed) foodCore(); wrap.append(foodWait()); return wrap; }
  const chips=h('div',{class:'gchips',style:'margin-bottom:12px'}); [['all','הכול'],['home','ממה שיש בבית'],['b','בוקר'],['l','צהריים וערב'],['s','נשנוש']].forEach(([k,l])=>chips.append(h('button',{class:'gchip'+(RCP.f===k?' on':''),type:'button','aria-pressed':RCP.f===k?'true':'false',onclick:()=>{ RCP.f=k; render(); }},l)));
  wrap.append(chips);
  const st=MenuKit.stock(S.pantry), prefs=nutPrefs(); let list=MenuKit.suggest({prefs,stock:st});
  if(RCP.f==='home') list=list.filter(x=>x.cover.pct>=0.5).sort((a,b)=>(b.cover.ok-a.cover.ok)||(b.cover.pct-a.cover.pct));
  else { if(RCP.f!=='all') list=list.filter(x=>RCP.f==='l'?(x.r.slot.includes('l')||x.r.slot.includes('d')):x.r.slot.includes(RCP.f)); list.sort((a,b)=>a.r.t.localeCompare(b.r.t,'he')); }
  if(!list.length){ wrap.append(h('div',{class:'empty'},ic('pot'),h('div',{},RCP.f==='home'?'עוד אין מתכון שרובו כבר בבית. מוסיפים מצרכים למטבח, או עוברים על כל המתכונים.':'אין מתכונים שמתאימים להעדפות שנבחרו.'))); return wrap; }
  const l=h('div',{class:'list'});
  list.forEach(x=>{ const r=x.r; l.append(h('button',{class:'item pressable',type:'button',onclick:()=>go('#recipe-'+r.id)},h('div',{class:'grow'},h('div',{class:'t'},r.t),h('div',{class:'s'},`${kc(r.n[0])} קק״ל · ${g1(r.n[1])} ג׳ חלבון · ${r.min} דקות`)),S.pantry.items.length?h('span',{class:'cov'+(x.cover.ok?' ok':'')},x.cover.ok?'הכול בבית':`חסרים ${x.cover.miss.length}`):null,h('span',{class:'chev',html:I('chev')}))); });
  wrap.append(l,h('div',{class:'credit'},'הערכים מחושבים מהמצרכים לפי מאגר התזונה הלאומי.'));
  return wrap;
}
function recipePage(){
  const r=FD.core?MenuKit.byId(route.param):null; header('מתכון',{back:'#recipes'}); const wrap=h('div');
  if(!FD.core){ if(!FD.failed) foodCore(); wrap.append(foodWait()); return wrap; }
  if(!r){ wrap.append(h('div',{class:'empty'},ic('pot'),h('div',{},'המתכון לא נמצא.'))); return wrap; }
  const sv=RCP.sv[r.id]||1, n=MenuKit.nut(r,sv), st=MenuKit.stock(S.pantry), cv=MenuKit.cover(r,st,sv), missing={}; cv.miss.forEach(m=>{ missing[m.k]=m.g; });
  wrap.append(h('div',{class:'display',style:'font-size:28px;margin-bottom:10px'},r.t));
  wrap.append(h('div',{class:'rfacts'},h('div',{},h('b',{},kc(n[0])),h('span',{},'קק״ל')),h('div',{},h('b',{},g1(n[1])),h('span',{},'חלבון')),h('div',{},h('b',{},g1(n[2])),h('span',{},'פחמימות')),h('div',{},h('b',{},g1(n[3])),h('span',{},'שומן'))));
  const step=d=>{ RCP.sv[r.id]=Math.max(0.5,Math.min(4,sv+d)); render(); };
  wrap.append(h('div',{class:'card'},h('div',{class:'row'},h('div',{class:'grow'},h('div',{class:'k'},'מנות'),h('div',{class:'small muted'},`${r.min} דקות הכנה`)),h('div',{class:'stepper'},h('button',{type:'button','aria-label':'פחות',onclick:()=>step(-0.5)},'−'),h('b',{},String(sv)),h('button',{type:'button','aria-label':'יותר',onclick:()=>step(0.5)},'+')))));
  wrap.append(h('div',{class:'sec'},h('h2',{},'מצרכים'),S.pantry.items.length?h('span',{class:'small muted'},cv.ok?'הכול בבית':`חסרים ${cv.miss.length}`):null));
  const il=h('div',{class:'list'});
  r.ing.forEach(x=>{ const e=FoodKit.byKey(x[0])||{}, g=x[1]*sv/(r.serves||1), staple=MenuKit.isStaple(x[0]), ok=staple||!(x[0] in missing);
    const amt=x[2]!=null?`${Math.round(x[2]*sv/(r.serves||1)*10)/10} ${FoodKit.UNIT_HE[x[3]]||x[3]}`:(e.pu==='ml'?`${Math.round(g)} מ״ל`:`${Math.round(g)} ג׳`);
    il.append(h('div',{class:'ing'+(S.pantry.items.length&&ok?' ok':'')},S.pantry.items.length?h('span',{class:'d'},ic('check')):null,h('span',{},x[0]),h('span',{class:'q'},amt))); });
  wrap.append(il,h('div',{class:'sec'},h('h2',{},'איך מכינים')),h('div',{class:'card'},h('ol',{class:'rsteps'},...r.steps.map(s=>h('li',{},h('span',{},s))))));
  if(cv.miss.length) wrap.append(h('button',{class:'btn sec2',type:'button',style:'margin-bottom:8px',onclick:()=>{ shopAdd(cv.miss.map(m=>{ const b=MenuKit.buy(m.k,m.g); return {k:m.k,n:m.k,q:b.q,u:b.u}; }),'r'); toast(`${plural(cv.miss.length,'מצרך אחד נוסף','מצרכים נוספו')} לרשימת הקניות`); render(); }},ic('cart'),h('span',{},'החסרים לרשימת הקניות')));
  wrap.append(h('button',{class:'btn sec2',type:'button',onclick:()=>planPick(r,sv)},ic('list'),h('span',{},'לתפריט שלי')));
  Dock.set(h('button',{class:'btn sgo',type:'button',onclick:()=>recipeEat(r,sv)},ic('check'),h('span',{},'אכלתי את זה')));
  return wrap;
}
/* eating a recipe: one line in the diary with the recipe's numbers, and its ingredients leave the pantry */
function recipeEat(r,sv,o){
  o=o||{}; const n=MenuKit.nut(r,sv), slot=o.slot||(r.slot.includes(slotNow())?slotNow():r.slot[0]);
  const g=Math.round(r.ing.reduce((a,x)=>a+x[1],0)*sv/(r.serves||1));
  logMeal([{name:r.t,k:'',g,e:n}],{date:o.date,slot,rid:r.id,sv,title:r.t,src:'r'});
  const taken=MenuKit.cook(S.pantry,r,sv), out=taken.filter(t=>t.now===0); if(taken.length) savePantry();
  if(out.length) shopAdd(out.map(t=>({k:t.k,n:t.k,q:null,u:t.u})),'e');
  S.prefs.seen.cooked=(S.prefs.seen.cooked||0)+1; save('prefs',S.prefs);
  haptic(15); toast(`נרשם: ${kc(n[0])} קק״ל${taken.length?' · המטבח עודכן':''}${out.length?` · נגמר: ${out.map(t=>t.k).join(', ')}, נכנס לקניות`:''}`); nutAch(900);
}
function planEat(d,m){ const r=m.rid?MenuKit.byId(m.rid):null; if(r) recipeEat(r,m.sv,{date:d,slot:m.slot}); else { const n=m.n||[0,0,0,0]; logMeal([{name:m.t||'ארוחה',k:'',g:300,e:n,est:true}],{date:d,slot:m.slot,title:m.t}); toast(`נרשם: ${kc(n[0])} קק״ל`); } m.done=1; save('mplan',S.mplan); }

/* ========================= the menu ========================= */
let planDay=null;
function savePlan(){ return save('mplan',S.mplan); }
function planBuild(from,count){
  const st=MenuKit.stock(S.pantry), soon={}; MenuKit.expiring(S.pantry,todayKey(),4).forEach(x=>{ if(x.k) soon[x.k]=1; });
  const days=MenuKit.planDays(from,count,d=>nutT(d),{prefs:nutPrefs(),stock:st,soon,seed:String(Date.now()%100000)});
  Object.keys(days).forEach(d=>{ S.mplan.days[d]={meals:days[d].meals}; });
  Object.keys(S.mplan.days).forEach(d=>{ if(d<addDays(todayKey(),-14)) delete S.mplan.days[d]; });
  S.mplan.made=Date.now(); S.prefs.seen.plans=(S.prefs.seen.plans||0)+1; save('prefs',S.prefs); savePlan(); nutAch(700);
  return Object.keys(days).length;
}
function planPick(r,sv){
  const tk=todayKey(), opts=[0,1,2,3,4,5,6].map(i=>{ const d=addDays(tk,i); return [d,i===0?'היום':(i===1?'מחר':'יום '+DAY_NAMES[new Date(d+'T12:00:00').getDay()]+' '+fmtDate(d))]; });
  pickSheet('לאיזה יום?',r.t,opts,'',d=>{ setTimeout(()=>pickSheet('לאיזו ארוחה?','',r.slot.map(s=>[s,FoodKit.SLOT_HE[s]]),'',s=>{ const day=S.mplan.days[d]||(S.mplan.days[d]={meals:[]}); day.meals=day.meals.filter(m=>m.slot!==s||s==='s'); day.meals.push({slot:s,rid:r.id,sv,n:MenuKit.nut(r,sv)}); day.meals.sort((a,b)=>'blsd'.indexOf(a.slot)-'blsd'.indexOf(b.slot)); savePlan(); toast('נכנס לתפריט'); nutAch(600); }),340); });
}
function mplanPage(){
  header('התפריט שלי',{back:'#food'}); const wrap=h('div'), tk=todayKey(); if(!planDay||planDay<tk) planDay=tk;
  wrap.append(h('div',{class:'display'},'התפריט שלי'));
  if(!FD.core){ if(!FD.failed) foodCore(); wrap.append(foodWait()); return wrap; }
  const T0=nutT(tk);
  if(!T0.ok||!S.nut.goal){ wrap.append(h('div',{class:'card'},h('div',{class:'k',style:'margin-bottom:4px'},'קודם קובעים יעד'),h('p',{class:'small muted',style:'margin:0 0 12px;line-height:1.5'},'התפריט נבנה כך שהארוחות של כל יום יסתכמו ליעד הקלוריות והחלבון שלך.'),h('button',{class:'btn',type:'button',onclick:()=>go('#nut')},'קובעים יעד'))); return wrap; }
  const strip=h('div',{class:'ds'}); for(let i=0;i<7;i++){ const d=addDays(tk,i), dt=new Date(d+'T12:00:00'), has=((S.mplan.days[d]||{}).meals||[]).length>0;
    strip.append(h('button',{class:'dsd pressable'+(d===planDay?' on':'')+(i===0?' today':''),type:'button',style:'--c:var(--g-legs)','aria-label':`יום ${DAY_NAMES[dt.getDay()]}, ${fmtDate(d)}${has?', יש תפריט':''}`,onclick:()=>{ planDay=d; render(); }},h('span',{class:'l'},DAY_LETTERS[dt.getDay()]),h('span',{class:'n '+(has?'done':'')},String(dt.getDate())))); }
  wrap.append(strip);
  const d=planDay, T=nutT(d), day=S.mplan.days[d], meals=(day&&day.meals)||[];
  if(!meals.length){
    wrap.append(h('div',{class:'todaybox'},h('div',{class:'hero-row'},mascot('idle')||h('div',{class:'restico'},ic('list')),h('div',{class:'grow'},h('div',{class:'k',style:'font-size:22px;line-height:1.2'},'עוד אין תפריט ליום הזה'),h('div',{class:'small muted',style:'margin-top:4px;line-height:1.5'},`האפליקציה תרכיב ארוחות שמסתכמות ל-${kc(T.kcal)} קק״ל ו-${T.p} ג׳ חלבון, ותתחיל ממה שיש בבית.`))),
      h('div',{class:'row',style:'gap:8px;margin-top:14px'},h('button',{class:'btn',type:'button',onclick:()=>{ planBuild(d,1); render(); toast('התפריט ליום הזה מוכן'); }},'תפריט ליום'),h('button',{class:'btn sec2',type:'button',onclick:()=>{ const n=planBuild(tk,7); planDay=tk; render(); toast(`תפריט ל-${n} ימים מוכן`); }},'לכל השבוע'))));
  } else {
    const tot=[0,0,0,0]; meals.forEach(m=>{ const r=m.rid?MenuKit.byId(m.rid):null, n=r?MenuKit.nut(r,m.sv):(m.n||[0,0,0,0]); for(let i=0;i<4;i++) tot[i]+=n[i]; });
    wrap.append(h('div',{class:'jstats',style:'cursor:default'},h('div',{class:'r'},h('div',{},h('b',{},kc(tot[0])),h('span',{},`מתוך ${kc(T.kcal)} קק״ל`)),h('div',{},h('b',{},g1(tot[1])),h('span',{},`מתוך ${T.p} ג׳ חלבון`)),h('div',{},h('b',{},String(meals.length)),h('span',{},'ארוחות')))));
    const l=h('div',{class:'list'});
    meals.forEach((m,i)=>{ const r=m.rid?MenuKit.byId(m.rid):null, n=r?MenuKit.nut(r,m.sv):(m.n||[0,0,0,0]);
      l.append(h('div',{class:'meal'+(m.done?'':' plan'),style:`--c:var(--g-${SLOT_COL[m.slot]||'full'})`},h('div',{class:'mi'},ic(m.done?'check':(SLOT_ICON[m.slot]||'fork'))),h('button',{class:'grow',type:'button',style:'text-align:start',onclick:()=>planMealSheet(d,i)},h('div',{class:'t'},r?r.t:(m.t||'ארוחה')),h('div',{class:'s'},`${FoodKit.SLOT_HE[m.slot]}${m.sv&&m.sv!==1?' · '+m.sv+' מנות':''} · ${kc(n[0])} קק״ל · ${g1(n[1])} ג׳ חלבון`)),m.done?h('span',{class:'small b muted'},'נאכל'):(d===tk?h('button',{class:'do pressable',type:'button',onclick:()=>{ planEat(d,m); render(); }},'אכלתי'):null))); });
    wrap.append(l);
    wrap.append(h('button',{class:'lnkline center',type:'button',onclick:()=>confirmSheet('לבנות את היום מחדש?','הארוחות של היום הזה יוחלפו בהצעה חדשה.',()=>{ planBuild(d,1); render(); },'כן, מחדש')},ic('shuffle'),h('span',{},'הצעה אחרת ליום הזה')));
  }
  const need=MenuKit.shopping(S.mplan.days,S.pantry).length;
  wrap.append(h('div',{class:'sechub'},h('div',{class:'hub'},
    wideBox('cart','רשימת קניות לתפריט',need?`${plural(need,'מצרך אחד חסר','מצרכים חסרים')} לימים המתוכננים`:'כל מה שצריך כבר בבית',()=>{ shopFromPlan(); go('#shop'); },'arms'),
    wideBox('chat','תפריט בהתאמה אישית','מבקשים מהמאמן: תקציב, מה שיש בבית, בלי מאכל מסוים',()=>{ CO.draft='תבנה לי תפריט לשלושת הימים הקרובים לפי היעדים שלי וממה שיש לי בבית'; go('#chat'); },'glutes'))));
  return wrap;
}
function planMealSheet(d,i){
  const day=S.mplan.days[d], m=day.meals[i], r=m.rid?MenuKit.byId(m.rid):null, body=h('div',{},h('div',{class:'small b muted'},FoodKit.SLOT_HE[m.slot]),h('h2',{},r?r.t:(m.t||'ארוחה'))), list=h('div',{class:'list'});
  const row=(icn,t,sub,fn,bad)=>list.append(h('button',{class:'item pressable',type:'button',onclick:()=>{ Sheet.close(); setTimeout(fn,320); }},h('div',{class:'th',style:`width:40px;height:40px;border-radius:var(--r-s);color:${bad?'var(--bad)':'var(--accent-t)'};background:${bad?'rgba(248,113,113,.14)':'var(--accent-soft)'}`},ic(icn)),h('div',{class:'grow'},h('div',{class:'t'},t),sub?h('div',{class:'s'},sub):null)));
  if(r) row('pot','למתכון','מצרכים ואופן ההכנה',()=>go('#recipe-'+r.id));
  row('swap','החלפה','הצעות אחרות לאותה ארוחה',()=>{ const T=nutT(d), share=1/Math.max(3,day.meals.length), used=planUsed(); const sg=MenuKit.suggest({slot:m.slot,kcal:(r?MenuKit.nut(r,m.sv)[0]:(m.n||[T.kcal*share])[0]),protein:T.p*share,prefs:nutPrefs(),stock:MenuKit.stock(S.pantry),used,limit:7}).filter(x=>x.r.id!==m.rid);
    pickSheet('במה להחליף?','',sg.map(x=>[x.r.id,`${x.r.t} · ${kc(x.n[0])} קק״ל${x.cover.ok?' · הכול בבית':''}`]),'',id=>{ const x=sg.find(y=>y.r.id===id); day.meals[i]={slot:m.slot,rid:id,sv:x.sv,n:x.n}; savePlan(); render(); }); });
  row('trash','הסרה מהתפריט','',()=>{ day.meals.splice(i,1); if(!day.meals.length) delete S.mplan.days[d]; savePlan(); render(); },true);
  body.append(list); Sheet.show(body);
}

/* ========================= the shopping list ========================= */
function saveShop(){ return save('shop',S.shop); }
function shopAdd(items,src){
  items.forEach(x=>{ const cur=S.shop.items.find(y=>!y.done&&((x.k&&y.k===x.k)||(!x.k&&y.n===x.n)));
    if(cur){ if(x.q!=null&&cur.q!=null&&cur.u===x.u) cur.q=Math.max(cur.q,x.q); else if(x.q!=null&&cur.q==null){ cur.q=x.q; cur.u=x.u; } }
    else S.shop.items.push({id:'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),k:x.k||'',n:x.n,q:x.q==null?null:x.q,u:x.u||'g',...(src?{src}:{})}); });
  saveShop();
}
/* the part of the list that came from the menu is worked out again; what was added by hand stays */
function shopFromPlan(){
  const tk=todayKey(), days={}; Object.keys(S.mplan.days).forEach(d=>{ if(d>=tk) days[d]=S.mplan.days[d]; });
  const need=MenuKit.shopping(days,S.pantry);
  S.shop.items=S.shop.items.filter(x=>x.src!=='p'||x.done);
  shopAdd(need.map(x=>({k:x.k,n:x.k,q:x.q,u:x.u})),'p');
  return need.length;
}
function shopPage(){
  header('רשימת קניות',{back:'#food'}); const wrap=h('div'); wrap.append(h('div',{class:'display'},'רשימת קניות'));
  if(!FD.core){ if(!FD.failed) foodCore(); wrap.append(foodWait()); return wrap; }
  const inp=h('input',{type:'text',placeholder:'חלב, 12 ביצים, קילו עגבניות',autocomplete:'off',enterkeyhint:'done','aria-label':'מה לקנות'});
  const add=()=>{ const t=inp.value.trim(); if(!t) return; const R=FoodKit.parsePantry(t), items=R.items.slice(); if(R.rest.length||!items.length) items.push({k:'',n:(R.items.length?R.rest.join(' '):t).slice(0,40),q:null,u:'יח'}); shopAdd(items,'m'); inp.value=''; haptic(8); render(); };
  inp.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); add(); } });
  wrap.append(h('div',{class:'addrow'},h('div',{class:'fld grow'},inp),h('button',{class:'btn sm',type:'button',onclick:add},'הוספה')));
  const open=S.shop.items.filter(x=>!x.done), done=S.shop.items.filter(x=>x.done);
  if(!S.shop.items.length){ wrap.append(h('div',{class:'empty'},ic('cart'),h('div',{},'הרשימה ריקה. אפשר להוסיף ביד, או למלא אותה מהתפריט.'))); }
  const by={}; open.forEach(x=>{ const c=(FoodKit.byKey(x.k)||{}).c||''; (by[c]=by[c]||[]).push(x); });
  const rowOf=x=>h('button',{class:'item pressable'+(x.done?' done':''),type:'button',style:'min-height:56px',role:'checkbox','aria-checked':x.done?'true':'false',onclick:()=>{ x.done=x.done?0:1; saveShop(); haptic(8); render(); }},h('span',{class:'chk'},ic('check')),h('div',{class:'grow'},h('div',{class:'t'},x.n)),h('span',{class:'small b muted'},x.q==null?'':MenuKit.qtyText(x.q,x.u)));
  CAT_ORDER.forEach(c=>{ if(!by[c]) return; wrap.append(h('div',{class:'catl'},CAT_HE[c]||'אחר')); const l=h('div',{class:'list'}); by[c].forEach(x=>l.append(rowOf(x))); wrap.append(l); });
  if(done.length){ wrap.append(h('div',{class:'catl'},'בעגלה')); const l=h('div',{class:'list'}); done.forEach(x=>l.append(rowOf(x))); wrap.append(l);
    Dock.set(h('button',{class:'btn sgo',type:'button',onclick:()=>{ pantryAdd(done.map(x=>({k:x.k,n:x.n,q:x.q,u:x.u}))); S.shop.items=S.shop.items.filter(x=>!x.done); saveShop(); haptic(15); toast(`${plural(done.length,'מצרך אחד נכנס','מצרכים נכנסו')} למטבח`); render(); }},ic('fridge'),h('span',{},'קניתי, להכניס למטבח'))); }
  const hasPlan=Object.keys(S.mplan.days).some(k=>k>=todayKey());
  wrap.append(h('button',{class:'lnkline center',type:'button',onclick:()=>{ if(!hasPlan){ go('#mplan'); return; } const n=shopFromPlan(); toast(n?`הרשימה עודכנה: ${plural(n,'מצרך אחד','מצרכים')} לתפריט`:'כל מה שהתפריט צריך כבר בבית'); render(); }},ic('list'),h('span',{},hasPlan?'עדכון לפי התפריט':'בונים תפריט, והרשימה מתמלאת לבד')));
  if(S.shop.items.length) wrap.append(h('button',{class:'lnkline center',type:'button',onclick:()=>confirmSheet('לנקות את הרשימה?','כל הפריטים יימחקו מהרשימה.',()=>{ S.shop.items=[]; saveShop(); render(); },'כן, לנקות')},ic('trash'),h('span',{},'ניקוי הרשימה')));
  pricePanel(wrap,open);
  return wrap;
}
