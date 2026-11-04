# -*- coding: utf-8 -*-
"""One-off: onboarding, first-run setup, getting-started checklist, rest timer, next-exercise bar, theme setting, confirm sheet, hints."""
CSS = r"""
/* onboarding */
.onb{position:absolute;inset:0;z-index:60;background:var(--bg);display:flex;flex-direction:column;opacity:0;transition:opacity .3s}
.onb.on{opacity:1}
.onb .top{display:flex;justify-content:space-between;align-items:center;padding:calc(env(safe-area-inset-top) + 14px) 18px 0}
.onb .skip{color:var(--ink2);font-weight:700;font-size:14px;padding:6px 10px}
.onb .dots{display:flex;gap:6px}
.onb .dots i{width:6px;height:6px;border-radius:3px;background:var(--card3);transition:width .3s,background .3s}
.onb .dots i.on{width:20px;background:var(--accent)}
.onb .vp{flex:1;overflow:hidden;touch-action:pan-y}
.onb .track{display:flex;direction:rtl;height:100%;will-change:transform}
.onb .slide{flex:0 0 100%;display:flex;flex-direction:column;justify-content:center;padding:0 26px;gap:16px}
.onb .art{height:220px;border-radius:28px;background:linear-gradient(160deg,var(--card3),var(--card) 70%);border:1px solid var(--line2);display:grid;place-items:center;overflow:hidden;position:relative}
.onb .art svg{width:100%;height:100%}
.onb h1{font-family:var(--display);font-size:32px;font-weight:900;line-height:1.1}
.onb p{font-size:16.5px;line-height:1.65;color:var(--ink2);margin:0}
.onb .bottom{padding:0 18px calc(env(safe-area-inset-bottom) + 22px);display:flex;flex-direction:column;gap:8px}
@media (max-height:700px){.onb .art{height:160px}.onb h1{font-size:28px}}
/* getting started checklist */
.start{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:14px 16px;margin-bottom:12px}
.start .st{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line);width:100%}
.start .st:first-of-type{border-top:0}
.start .st .c{width:26px;height:26px;border-radius:50%;border:2px solid var(--line2);display:grid;place-items:center;color:transparent;flex:none;transition:background .3s,color .3s,border-color .3s}
.start .st.done .c{background:var(--good);border-color:var(--good);color:#06240F}
.start .st .c svg.i{width:14px;height:14px;stroke-width:3}
.start .st.done .t{color:var(--ink2);text-decoration:line-through}
.start .pbar{height:6px;background:var(--card2);border-radius:3px;overflow:hidden;margin:8px 0 4px}
.start .pbar i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:3px;transition:width .6s cubic-bezier(.2,.8,.2,1)}
/* rest timer pill */
.rest{position:absolute;bottom:calc(env(safe-area-inset-bottom) + 86px);inset-inline:18px;z-index:25;background:var(--ink);color:var(--bg);border-radius:20px;padding:10px 12px 10px 14px;display:flex;align-items:center;gap:12px;box-shadow:0 14px 40px rgba(0,0,0,.45);transform:translateY(30px) scale(.96);opacity:0;transition:transform .35s cubic-bezier(.2,1.4,.4,1),opacity .25s;pointer-events:none}
.rest.on{transform:none;opacity:1;pointer-events:auto}
.rest .rr{width:44px;height:44px;position:relative;flex:none}
.rest .rr svg{width:100%;height:100%;transform:rotate(-90deg)}
.rest .rr .v{position:absolute;inset:0;display:grid;place-items:center;font-weight:900;font-size:13px}
.rest .l{font-size:12px;opacity:.7;font-weight:700}
.rest .n{font-size:22px;font-weight:900;letter-spacing:-.02em;line-height:1}
.rest button{background:rgba(255,255,255,.14);color:inherit;border-radius:10px;padding:8px 10px;font-weight:800;font-size:13px}
:root[data-theme="light"] .rest button{background:rgba(0,0,0,.1)}
.rest.done{background:var(--good);color:#06240F}
/* next exercise bar */
.nextbar{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:12px 14px;margin-bottom:12px;width:100%}
.nextbar .th{width:48px;height:48px;border-radius:12px;background:var(--card2);overflow:hidden;flex:none}
.nextbar .th img{width:100%;height:100%;object-fit:cover}
.hint{display:flex;gap:10px;align-items:flex-start;background:var(--card2);border-radius:12px;padding:10px 12px;margin:10px 14px 0;font-size:12.5px;color:var(--ink2);line-height:1.5}
"""

JS = r"""
/* ========================= UX: theme, onboarding, checklist, rest timer ========================= */
function applyTheme(){ let t=''; try{ t=localStorage.getItem('gt:theme')||''; }catch(e){} const root=document.documentElement; if(t==='light'||t==='dark'){ root.setAttribute('data-theme',t); } else if(STANDALONE){ root.setAttribute('data-theme', matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'); } }
if(STANDALONE){ try{ matchMedia('(prefers-color-scheme: light)').addEventListener('change',applyTheme); }catch(e){} }
const ONB_SLIDES=[
 {t:'ברוך הבא לסטים',p:'יומן האימונים שלך בכיס. בכל תרגיל רושמים משקל וחזרות, מסמנים ✓, והאפליקציה זוכרת ומציגה את זה בפעם הבאה כדי שתוכל להעלות.',
  art:`<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="og" x1="0" x2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs><g font-family="Heebo" font-weight="900"><rect x="40" y="40" width="240" height="44" rx="14" fill="var(--card2)"/><text x="262" y="68" text-anchor="end" font-size="16" fill="var(--ink)">1</text><rect x="150" y="50" width="70" height="24" rx="8" fill="var(--card3)"/><text x="185" y="67" text-anchor="middle" font-size="13" fill="var(--ink)">40 ק״ג</text><rect x="70" y="50" width="60" height="24" rx="8" fill="var(--card3)"/><text x="100" y="67" text-anchor="middle" font-size="13" fill="var(--ink)">10</text><rect x="40" y="94" width="240" height="44" rx="14" fill="var(--card2)"/><text x="262" y="122" text-anchor="end" font-size="16" fill="var(--ink)">2</text><rect x="150" y="104" width="70" height="24" rx="8" fill="var(--card3)"/><text x="185" y="121" text-anchor="middle" font-size="13" fill="var(--ink)">42.5</text><rect x="70" y="104" width="60" height="24" rx="8" fill="var(--card3)"/><text x="100" y="121" text-anchor="middle" font-size="13" fill="var(--ink)">10</text><rect x="40" y="148" width="240" height="44" rx="14" fill="rgba(74,222,128,.12)"/><text x="262" y="176" text-anchor="end" font-size="16" fill="var(--good)">3</text><rect x="150" y="158" width="70" height="24" rx="8" fill="var(--card3)"/><text x="185" y="175" text-anchor="middle" font-size="13" fill="var(--ink)">42.5</text><rect x="70" y="158" width="60" height="24" rx="8" fill="var(--card3)"/><text x="100" y="175" text-anchor="middle" font-size="13" fill="var(--ink)">11</text><circle cx="52" cy="170" r="11" fill="var(--good)"/><path d="M46 170l4 4 8-8" stroke="#06240F" stroke-width="2.5" fill="none" stroke-linecap="round"/><text x="236" y="30" text-anchor="end" font-size="11" fill="var(--good)">▲ 2.5 ק״ג</text></g></svg>`},
 {t:'הספרייה והמכון שלך',p:'701 תרגילים לפי שריר, עם תמונה והסבר לכל אחד. בחר את יצרן המכשירים במכון שלך (השם מודפס על המכונות) וכל המכשירים ייכנסו אוטומטית.',
  art:`<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg"><g fill="var(--card2)" stroke="var(--line2)"><rect x="30" y="30" width="120" height="76" rx="18"/><rect x="170" y="30" width="120" height="76" rx="18"/><rect x="30" y="118" width="120" height="76" rx="18"/><rect x="170" y="118" width="120" height="76" rx="18"/></g><g stroke="var(--accent)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(236 46) scale(1.4)">${ICONS.chest}</g><g transform="translate(96 46) scale(1.4)">${ICONS.back}</g><g transform="translate(236 134) scale(1.4)">${ICONS.legs}</g><g transform="translate(96 134) scale(1.4)">${ICONS.arms}</g></g><g font-family="Heebo" font-weight="800" font-size="13" fill="var(--ink)" text-anchor="middle"><text x="250" y="96">חזה</text><text x="110" y="96">גב</text><text x="250" y="184">רגליים</text><text x="110" y="184">ידיים</text></g></svg>`},
 {t:'תוכניות שמתחדשות',p:'בכל יום מחכה אימון מומלץ שמדלג על השרירים שעבדו אתמול. סימון ✓ על סט מפעיל טיימר מנוחה, ובסוף כל תרגיל יש כפתור לתרגיל הבא.',
  art:`<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="og2" x1="0" x2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs><circle cx="160" cy="110" r="70" fill="none" stroke="var(--card3)" stroke-width="12"/><circle cx="160" cy="110" r="70" fill="none" stroke="url(#og2)" stroke-width="12" stroke-linecap="round" stroke-dasharray="440" stroke-dashoffset="150" transform="rotate(-90 160 110)"/><g font-family="Heebo" font-weight="900" fill="var(--ink)" text-anchor="middle"><text x="160" y="118" font-size="34">1:12</text><text x="160" y="140" font-size="12" fill="var(--ink2)">מנוחה</text></g><g font-family="Heebo" font-weight="800" font-size="12" fill="var(--ink2)"><text x="300" y="40" text-anchor="end">יום A · כל הגוף</text><text x="20" y="200">הבא: חתירה בפולי ›</text></g></svg>`},
 {t:'התקדמות שרואים',p:'השבוע במספרים, השוואה לשבוע שעבר, שיאים אישיים, מחשבון קלוריות ומדריכים כתובים. התחבר עם חשבון כדי שהכול יישמר גם כשמחליפים טלפון.',
  art:`<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="og3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent2)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs><g fill="var(--card3)"><rect x="40" y="130" width="26" height="50" rx="7"/><rect x="80" y="110" width="26" height="70" rx="7"/><rect x="120" y="120" width="26" height="60" rx="7"/><rect x="160" y="90" width="26" height="90" rx="7"/><rect x="200" y="100" width="26" height="80" rx="7"/></g><rect x="240" y="50" width="26" height="130" rx="7" fill="url(#og3)"/><g font-family="Heebo" font-weight="900" font-size="14" fill="var(--good)"><text x="253" y="40" text-anchor="middle">+18%</text></g><path d="M40 190H290" stroke="var(--line2)"/></svg>`},
];
const Onb={el:null,i:0,W:0,x:0,anim:null};
function showOnboarding(){
  if(Onb.el) return; const n=ONB_SLIDES.length; Onb.i=0;
  const dots=h('div',{class:'dots'},...ONB_SLIDES.map((_,k)=>h('i',{class:k===0?'on':''})));
  const track=h('div',{class:'track'},...ONB_SLIDES.map(s=>h('div',{class:'slide'},h('div',{class:'art',html:s.art}),h('h1',{},s.t),h('p',{},s.p))));
  const next=h('button',{class:'btn'},'הבא'); const alt=h('button',{class:'btn sec2',style:'display:none'},'יש לי כבר חשבון');
  const el=h('div',{class:'onb'},h('div',{class:'top'},h('button',{class:'skip',onclick:()=>finish()},'דלג'),dots),h('div',{class:'vp'},track),h('div',{class:'bottom'},next,alt));
  $('#app').append(el); Onb.el=el; requestAnimationFrame(()=>el.classList.add('on'));
  const vp=el.querySelector('.vp'); Onb.W=vp.clientWidth||innerWidth;
  const setX=x=>{ Onb.x=x; track.style.transform=`translateX(${x}px)`; };
  const goTo=(k,v=0)=>{ k=Math.max(0,Math.min(n-1,k)); Onb.i=k; [...dots.children].forEach((d,j)=>d.classList.toggle('on',j===k)); next.textContent=k===n-1?'בוא נתחיל':'הבא'; alt.style.display=(k===n-1&&STANDALONE&&!PB.user)?'':'none'; if(Onb.anim) Onb.anim.stop(); if(reduceMotion.matches){ setX(k*Onb.W); return; } Onb.anim=spring({from:Onb.x,to:k*Onb.W,velocity:v,response:0.4,damping:0.9,onUpdate:setX,onDone:()=>{ Onb.anim=null; }}); };
  function finish(){ try{ localStorage.setItem('gt:onboarded','1'); }catch(e){} el.classList.remove('on'); setTimeout(()=>{ el.remove(); Onb.el=null; },300); }
  next.addEventListener('click',()=>{ if(Onb.i<n-1) goTo(Onb.i+1); else { finish(); setupSheet(); } });
  alt.addEventListener('click',()=>{ finish(); authSheet('login'); });
  let drag=null;
  vp.addEventListener('pointerdown',e=>{ if(Onb.anim){ const st=Onb.anim.stop(); Onb.anim=null; Onb.x=st.x; } drag={x0:e.clientX,base:Onb.x,hist:[[e.clientX,performance.now()]],moved:false}; });
  vp.addEventListener('pointermove',e=>{ if(!drag) return; const dx=e.clientX-drag.x0; if(!drag.moved&&Math.abs(dx)<8) return; if(!drag.moved){ drag.moved=true; try{ vp.setPointerCapture(e.pointerId);}catch(_){} } let x=drag.base+dx; const max=(n-1)*Onb.W; if(x<0) x=-(Math.abs(x)*0.5*Onb.W/(Onb.W+0.5*Math.abs(x))); if(x>max) x=max+((x-max)*0.5*Onb.W/(Onb.W+0.5*(x-max))); setX(x); drag.hist.push([e.clientX,performance.now()]); if(drag.hist.length>6) drag.hist.shift(); });
  const end=()=>{ if(!drag) return; const d=drag; drag=null; if(!d.moved) return; const [x0,t0]=d.hist[0],[x1,t1]=d.hist[d.hist.length-1]; const v=t1>t0?(x1-x0)/((t1-t0)/1000):0; const proj=Onb.x+(v/1000)*0.998/(1-0.998); goTo(Math.round(proj/Onb.W),v); };
  vp.addEventListener('pointerup',end); vp.addEventListener('pointercancel',end);
  goTo(0);
}
function setupSheet(){
  const p=S.profile; const name=h('input',{type:'text',value:p.name||'',placeholder:'איך לקרוא לך',autocomplete:'given-name'});
  const goal=h('select',{},...Object.entries(GOALS).map(([k,v])=>h('option',{value:k,selected:p.goal===k},v)));
  const weekly=h('div',{class:'seg'}); let wk=p.weekly||3; [2,3,4,5,6].forEach(nn=>weekly.append(h('button',{class:nn===wk?'on':'',onclick:ev=>{ wk=nn; [...weekly.children].forEach(c=>c.classList.remove('on')); ev.currentTarget.classList.add('on'); }},String(nn))));
  Sheet.show(h('div',{},h('h2',{},'כמה פרטים ונצא לדרך'),h('p',{class:'small muted',style:'margin:0 0 12px;line-height:1.5'},'אפשר לשנות הכול אחר כך בפרופיל.'),h('div',{class:'fld'},h('label',{},'שם'),name),h('div',{class:'fld'},h('label',{},'מה המטרה'),goal),h('div',{class:'fld'},h('label',{},'כמה אימונים בשבוע'),weekly),h('button',{class:'btn',onclick:()=>{ p.name=name.value.trim(); p.goal=goal.value; p.weekly=wk; save('profile',p); Sheet.close(); render(); toast('מעולה. עכשיו בוחרים את המכון.'); setTimeout(pickBrand,450); }},'המשך'),h('button',{class:'btn sec2',style:'margin-top:8px',onclick:()=>{ Sheet.close(); render(); }},'אחר כך')));
}
function startChecklist(){
  let hidden=false; try{ hidden=!!localStorage.getItem('gt:hideStart'); }catch(e){} if(hidden) return null;
  const steps=[{t:'שם, מטרה ויעד שבועי',done:!!S.profile.name,go:()=>setupSheet()},{t:'המכשירים במכון שלי',done:!!(S.profile.brand||(S.deck.stars||[]).length),go:()=>pickBrand()},{t:'אימון ראשון: תרגיל אחד עם ✓',done:allSessions().length>0,go:()=>go('#library')}];
  const n=steps.filter(s=>s.done).length; if(n===steps.length){ try{ localStorage.setItem('gt:hideStart','1'); }catch(e){} return null; }
  const box=h('div',{class:'start'},h('div',{class:'row between'},h('div',{class:'k'},'התחל כאן'),h('span',{class:'xs muted b'},`${n}/${steps.length}`)),h('div',{class:'pbar'},h('i',{style:'width:0'})));
  steps.forEach(s=>box.append(h('button',{class:'st pressable'+(s.done?' done':''),onclick:s.go},h('span',{class:'c',html:I('check')}),h('span',{class:'t grow'},s.t),s.done?null:h('span',{class:'chev',html:I('chev')}))));
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ const b=box.querySelector('.pbar i'); if(b) b.style.width=(n/steps.length*100)+'%'; }));
  return box;
}
const Rest={el:null,end:0,total:0,iv:null};
function restSeconds(){ const v=S.profile.rest; return v==null?90:+v; }
function startRest(sec){ sec=sec??restSeconds(); if(!sec) return; if(!Rest.el){ Rest.el=h('div',{class:'rest'},h('div',{class:'rr',html:'<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="rgba(128,128,128,.3)" stroke-width="4"/><circle class="p" cx="22" cy="22" r="18" fill="none" stroke="var(--accent2)" stroke-width="4" stroke-linecap="round" stroke-dasharray="113" stroke-dashoffset="0"/></svg><div class="v">⏱</div>'}),h('div',{class:'grow'},h('div',{class:'l'},'מנוחה'),h('div',{class:'n'},'')),h('button',{onclick:()=>{ Rest.end+=30000; Rest.total+=30; tick(); }},'+30'),h('button',{'aria-label':'סגור',onclick:stopRest},'✕')); $('#app').append(Rest.el); }
  Rest.end=Date.now()+sec*1000; Rest.total=sec; Rest.el.classList.remove('done'); clearInterval(Rest.iv); tick(); Rest.iv=setInterval(tick,250); requestAnimationFrame(()=>Rest.el.classList.add('on')); }
function tick(){ if(!Rest.el) return; const left=Math.max(0,Math.ceil((Rest.end-Date.now())/1000)); const m=Math.floor(left/60), s=left%60; Rest.el.querySelector('.n').textContent=`${m}:${String(s).padStart(2,'0')}`; const c=Rest.el.querySelector('circle.p'); if(c) c.style.strokeDashoffset=String(113*(1-left/Math.max(1,Rest.total))); if(left<=0){ clearInterval(Rest.iv); Rest.el.classList.add('done'); Rest.el.querySelector('.l').textContent='המנוחה נגמרה'; haptic([80,60,80]); setTimeout(stopRest,2500); } }
function stopRest(){ clearInterval(Rest.iv); if(Rest.el) Rest.el.classList.remove('on'); }
function nextInPlan(curId){ if(S.today.d!==todayKey()||!S.today.plan.length||!S.today.plan.includes(curId)) return undefined; const plan=S.today.plan; const i=plan.indexOf(curId); const after=plan.slice(i+1).concat(plan.slice(0,i)); return after.find(id=>!S.today.done[id])||null; }
function nextBar(e){ const nx=nextInPlan(e.id); if(nx===undefined) return null; if(nx===null) return h('button',{class:'nextbar pressable',onclick:()=>go('#home')},h('div',{class:'grow'},h('div',{class:'k'},'זה התרגיל האחרון באימון'),h('div',{class:'small muted'},'חזרה לדף היום')),ic('chev')); const n=getEx(nx); if(!n) return null; const left=S.today.plan.filter(id=>!S.today.done[id]&&id!==e.id).length; return h('button',{class:'nextbar pressable',onclick:()=>go('#ex-'+nx)},h('div',{class:'th'},hasImg(n)?exImg(n,'s'):null),h('div',{class:'grow'},h('div',{class:'xs muted b'},`הבא באימון · נשארו ${left}`),h('div',{class:'k ell'},n.he)),ic('chev')); }
function confirmSheet(title,text,onYes,yesLabel='כן, נקה'){ Sheet.show(h('div',{},h('h2',{},title),h('p',{class:'small muted',style:'margin:0 0 14px;line-height:1.5'},text),h('button',{class:'btn danger',onclick:()=>{ Sheet.close(); onYes(); }},yesLabel),h('button',{class:'btn sec2',style:'margin-top:8px',onclick:()=>Sheet.close()},'ביטול'))); }
function setsHint(){ try{ if(localStorage.getItem('gt:hintSets')) return null; }catch(e){} const el=h('div',{class:'hint'},ic('info'),h('span',{class:'grow'},'+ ו− משנים משקל וחזרות (לחיצה ארוכה רצה מהר). ✓ מסמן שהסט בוצע ומפעיל טיימר מנוחה. הכול נשמר לבד.'),h('button',{style:'color:var(--ink2);font-weight:900',onclick:ev=>{ try{ localStorage.setItem('gt:hintSets','1'); }catch(e){} ev.currentTarget.parentElement.remove(); }},'✕')); return el; }
"""

EDITS = [
 ("</style>", CSS + "</style>"),
 ("/* ========================= boot =========================", JS + "\n/* ========================= boot ========================="),
 # home: checklist after banner
 ("  wrap.append(h('div',{id:'storageBanner'},bannerContent()));\n  const cur=weekStats(0)",
  "  wrap.append(h('div',{id:'storageBanner'},bannerContent()));\n  const chk0=startChecklist(); if(chk0) wrap.append(chk0);\n  const cur=weekStats(0)"),
 # home: confirm before clearing today's workout
 ("onclick:()=>{ S.today.plan=[]; S.today.done={}; save('today-'+todayKey(),S.today); render(); }},'נקה')",
  "onclick:()=>confirmSheet('לנקות את האימון של היום?','ההיסטוריה של הסטים שכבר רשמת נשמרת. רק רשימת התרגילים של היום תתאפס.',()=>{ S.today.plan=[]; S.today.done={}; save('today-'+todayKey(),S.today); render(); })},'נקה')"),
 # exercise page: hint + next bar + rest timer
 ("  wrap.append(card);\n  function persist(){",
  "  const hint0=setsHint(); if(hint0) card.append(hint0);\n  wrap.append(card); const nb=nextBar(e); if(nb) wrap.append(nb);\n  function persist(){"),
 ("row.classList.toggle('done',s.t); if(s.t) haptic(15); persist(); }",
  "row.classList.toggle('done',s.t); if(s.t){ haptic(15); startRest(); } else stopRest(); persist(); }"),
 # profile: theme + rest settings
 ("h('div',{class:'fld',style:'margin:0'},h('label',{},'יעד שבועי'),weekly)));",
  "h('div',{class:'fld'},h('label',{},'יעד שבועי'),weekly),h('div',{class:'fld'},h('label',{},'מנוחה בין סטים'),(()=>{ const sel=h('select',{},...[[0,'בלי טיימר'],[60,'60 שניות'],[90,'90 שניות'],[120,'2 דקות'],[150,'2.5 דקות'],[180,'3 דקות']].map(([v,l])=>h('option',{value:v,selected:restSeconds()===v},l))); sel.addEventListener('change',()=>{ p.rest=+sel.value; save('profile',p); }); return sel; })()),h('div',{class:'fld',style:'margin:0'},h('label',{},'מראה'),(()=>{ let cur=''; try{ cur=localStorage.getItem('gt:theme')||''; }catch(e){} const sel=h('select',{},...[['','אוטומטי לפי המכשיר'],['dark','כהה'],['light','בהיר']].map(([v,l])=>h('option',{value:v,selected:cur===v},l))); sel.addEventListener('change',()=>{ try{ if(sel.value) localStorage.setItem('gt:theme',sel.value); else localStorage.removeItem('gt:theme'); }catch(e){} if(!sel.value) document.documentElement.removeAttribute('data-theme'); applyTheme(); render(); }); return sel; })())));"),
 # profile: onboarding link
 ("[['progress','התקדמות מלאה','trend'],['calories','מחשבון קלוריות','flame'],",
  "[['onboarding','הסבר קצר על האפליקציה','info'],['progress','התקדמות מלאה','trend'],['calories','מחשבון קלוריות','flame'],"),
 ("onclick:()=>{ if(pg==='library') libMode='gym'; go('#'+pg); }",
  "onclick:()=>{ if(pg==='onboarding'){ showOnboarding(); return; } if(pg==='library') libMode='gym'; go('#'+pg); }"),
 # boot: theme + first-run onboarding
 ("  loadLocal(); const r=parseHash(); route.page=r.page; route.param=r.param; render();",
  "  loadLocal(); applyTheme(); const r=parseHash(); route.page=r.page; route.param=r.param; render();\n  let onboarded=false; try{ onboarded=!!localStorage.getItem('gt:onboarded'); }catch(e){} if(!onboarded) setTimeout(showOnboarding,250);"),
]
for p in ('index.template.html', 'index.html'):
    s = open(p, encoding='utf-8').read()
    for a, b in EDITS:
        assert s.count(a) == 1, (p, s.count(a), a[:80])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
print('ux edits ok')
