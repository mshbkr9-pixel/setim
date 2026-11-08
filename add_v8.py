# -*- coding: utf-8 -*-
"""v8: animated exercise demos (anim.js) instead of photos, guided "start workout" mode with a stopwatch,
exercise management in settings, clearer "remove from today". Applies to index.template.html and index.html."""
import re

CSS = r"""
/* ========================= v8: demos, workout mode ========================= */
.exanim{width:100%;height:100%;display:block}
.item .th .exanim,.plan-ex .th .exanim,.nextbar .th .exanim{transform:scale(1.18)}
.exfade{position:relative;width:100%;height:100%} .exfade img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity 520ms ease} .exfade img.b{opacity:0} .exfade.on img.b{opacity:1}
.demo{position:relative;width:100%;aspect-ratio:16/10;max-height:250px;background:var(--card2);border:1px solid var(--line);border-radius:24px;overflow:hidden;box-shadow:var(--shadow);margin-bottom:12px}
.demo .exanim{position:absolute;inset:0;width:100%;height:100%}
.demo .tag{position:absolute;top:10px;inset-inline-start:12px;font-size:11px;font-weight:800;color:var(--ink2);background:var(--glass);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);padding:4px 9px;border-radius:999px;letter-spacing:.04em}
.demo .sw{position:absolute;bottom:10px;inset-inline-end:10px;font-size:12px;font-weight:800;color:var(--ink);background:var(--glass);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);padding:6px 10px;border-radius:10px}
.demo .ph{position:absolute;inset:0;display:none} .demo.photo .ph{display:block} .demo.photo .exanim{display:none}
.rowx{color:var(--ink2);border:1px solid var(--line2)} .rowx svg.i{width:14px;height:14px}
.gobar{display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;border-radius:18px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:var(--accent-ink);box-shadow:0 10px 28px rgba(255,107,74,.28);margin:2px 0 12px;text-align:start}
.gobar .pl{width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.18);display:grid;place-items:center;flex:none} .gobar .pl svg.i{width:20px;height:20px;stroke-width:2.4}
.gobar .k{font-weight:900;font-size:17px;line-height:1.15} .gobar .s{font-size:12px;font-weight:700;opacity:.85}
.gobar .tm{margin-inline-start:auto;font-variant-numeric:tabular-nums;font-weight:900;font-size:22px;letter-spacing:-.02em}
.gobar.live{background:var(--ink);color:var(--bg);box-shadow:0 10px 28px rgba(0,0,0,.3)} .gobar.live .pl{background:var(--accent);color:var(--accent-ink)}
.wo-top{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:14px 16px;margin-bottom:12px}
.wo-top .tm{font-family:var(--display);font-weight:900;font-size:40px;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums}
.wo-top .lbl{font-size:12px;color:var(--ink2);font-weight:700;margin-top:4px}
.wo-top .ctl{display:flex;gap:8px} .wo-top .ctl button{width:44px;height:44px;border-radius:14px;background:var(--card2);color:var(--ink);display:grid;place-items:center;border:1px solid var(--line)} .wo-top .ctl button.fin{background:var(--accent);color:var(--accent-ink);border-color:transparent}
.wo-dots{display:flex;gap:6px;margin:0 2px 12px;align-items:center} .wo-dots i{height:6px;flex:1;border-radius:3px;background:var(--card3);transition:background .3s} .wo-dots i.done{background:var(--good)} .wo-dots i.cur{background:var(--accent)}
.wo-strip{display:flex;gap:8px;overflow-x:auto;margin:0 -18px 12px;padding:2px 18px 6px;scrollbar-width:none} .wo-strip::-webkit-scrollbar{display:none}
.wo-strip button{flex:none;display:flex;align-items:center;gap:8px;padding:6px 10px 6px 6px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-size:12px;font-weight:800;color:var(--ink2);max-width:170px}
.wo-strip button .th{width:30px;height:30px;border-radius:50%;background:var(--card2);overflow:hidden;flex:none;display:grid;place-items:center} .wo-strip button .th svg.i{width:14px;height:14px}
.wo-strip button.cur{border-color:var(--accent);color:var(--ink);background:var(--accent-soft)} .wo-strip button.done{color:var(--good)} .wo-strip button span.t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wo-name{display:flex;align-items:center;gap:10px;margin:0 2px 10px} .wo-name h1{font-family:var(--display);font-size:26px;font-weight:900;line-height:1.1;flex:1} .wo-name .n{font-size:12px;font-weight:800;color:var(--ink2);white-space:nowrap}
.wo-nav{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.wo-next{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border-radius:var(--r);background:var(--good);color:#06240F;box-shadow:0 10px 26px rgba(74,222,128,.25);margin-bottom:12px;text-align:start}
.wo-next .th{width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.35);overflow:hidden;flex:none} .wo-next .k{font-weight:900;font-size:16px} .wo-next .s{font-size:12px;font-weight:700;opacity:.8}
.wo-sum{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0} .wo-sum div{background:var(--card2);border-radius:14px;padding:12px 8px;text-align:center} .wo-sum b{display:block;font-size:22px;font-weight:900;letter-spacing:-.02em;font-variant-numeric:tabular-nums} .wo-sum span{font-size:11px;color:var(--ink2);font-weight:700}
.myex .item .th{width:48px;height:48px}
"""

HELPERS = r"""
/* ========================= v8: demos (anim.js), workout mode ========================= */
const ANIM_HE={squat:'סקוואט עם מוט',bwsquat:'סקוואט משקל גוף',goblet:'גובלט סקוואט',frontsquat:'פרונט סקוואט',lunge:'לאנג׳',splitsquat:'ספליט סקוואט',bulgarian:'בולגרי',legpress:'לחיצת רגליים',hacksquat:'האק סקוואט',deadlift:'דדליפט',rdl:'דדליפט רומני',goodmorning:'גוד מורנינג',kbswing:'סווינג קטלבל',hipthrust:'היפ ת׳ראסט',glutebridge:'גשר ישבן',benchpress:'לחיצת חזה',inclinepress:'לחיצת חזה בשיפוע',declinepress:'לחיצת חזה בשיפוע שלילי',chestpress:'לחיצת חזה במכונה',fly:'פרפר / פלייז',pecdeck:'פק דק',pushup:'שכיבות סמיכה',dips:'מקבילים',ohp:'לחיצת כתפיים',seatedpress:'לחיצת כתפיים בישיבה',machinepress:'לחיצת כתפיים במכונה',lateralraise:'הרחקת כתפיים',frontraise:'הרמה קדמית',reardeltfly:'כתף אחורית',facepull:'פייס פול',shrug:'שראגים',uprightrow:'חתירה אנכית',pullup:'מתח',chinup:'מתח אחיזה הפוכה',latpulldown:'פולי עליון',row:'חתירה בהטיה',dbrow:'חתירה במשקולת',seatedrow:'חתירה בישיבה',cs_row:'חתירה עם תמיכת חזה',tbarrow:'חתירת T',pullover:'פולאובר',curl:'כפיפת מרפקים',preacher:'פריצ׳ר',hammer:'פטיש',concentration:'כפיפה בריכוז',pushdown:'פשיטת מרפקים בפולי',overheadext:'פשיטת מרפקים מעל הראש',skullcrusher:'סקאל קראשר',kickback:'קיקבק',closegrip:'לחיצה באחיזה צרה',legext:'פשיטת ברכיים',legcurl_seated:'כפיפת ברכיים בישיבה',legcurl_lying:'כפיפת ברכיים בשכיבה',calfraise:'תאומים בעמידה',seatedcalf:'תאומים בישיבה',hipabd:'מפשקים במכונה',hipadd:'מקרבים במכונה',plank:'פלאנק',crunch:'כפיפות בטן',situp:'סיט-אפ',legraise:'הרמת רגליים',hanginglegraise:'הרמת רגליים בתלייה',cablecrunch:'כפיפות בטן בפולי',russiantwist:'טוויסט רוסי',abwheel:'גלגל בטן',walk:'הליכה',run:'ריצה',cycling:'אופניים',rowing:'חתירה במכשיר',jumprope:'חבל קפיצה',burpee:'ברפי',jumpingjacks:'קפיצות פישוק',farmers:'הליכת איכר',stepup:'עליות מדרגה',boxjump:'קפיצה לארגז',thruster:'ת׳ראסטר',clean:'קלין',snatch:'סנאץ׳',downdog:'כלב מביט מטה',forwardfold:'כפיפה קדימה',hipflexor:'מתיחת כופפי ירך',quadstretch:'מתיחת ארבע-ראשי',hamstretch_seated:'מתיחת האמסטרינג',chestdoor:'מתיחת חזה',catcow:'חתול-פרה',childpose:'תנוחת ילד'};
function animOn(){ return S.profile.anim!=='off' && !!window.EXANIM; }
function photoLoop(e){ const a=exImg(e,'s'), b=exImg(e,'p'); b.classList.add('b'); const box=h('div',{class:'exfade'},a,b); let on=false; const iv=setInterval(()=>{ if(!box.isConnected){ clearInterval(iv); return; } on=!on; box.classList.toggle('on',on); },1300); return box; }
function exVis(e,o={}){
  if(!e) return null;
  if(animOn()){ try{ const res=EXANIM.resolve(e); if(res){ const svg=EXANIM.make(e,{res,still:!!o.still,muscle:subOf(e)}); if(svg) return svg; } }catch(err){} }
  if(hasImg(e)){ if(hasPeak(e)&&!o.still) return photoLoop(e); return exImg(e,'s'); }
  return null;
}
function thumb(e,o){ return exVis(e,o)||ic(e.g in ICONS?e.g:'gym'); }
function demoCard(e){
  const vis=animOn()&&EXANIM.resolve(e)?EXANIM.make(e,{muscle:subOf(e)}):null;
  if(!vis){ if(!hasImg(e)) return null; const box=h('div',{class:'demo'},hasPeak(e)?photoLoop(e):exImg(e,'s')); return box; }
  const box=h('div',{class:'demo'},vis,h('div',{class:'tag'},'הדגמה'));
  if(hasImg(e)){ const ph=h('div',{class:'ph'},hasPeak(e)?photoLoop(e):exImg(e,'s')); box.append(ph); const sw=h('button',{class:'sw pressable'},'תמונה'); sw.addEventListener('click',()=>{ const p=box.classList.toggle('photo'); sw.textContent=p?'הדגמה':'תמונה'; }); box.append(sw); }
  return box;
}
function fmtClock(sec){ sec=Math.max(0,Math.floor(sec)); const hh=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60; return (hh?hh+':'+String(m).padStart(2,'0'):m)+':'+String(s).padStart(2,'0'); }
/* ---- workout state ---- */
function woActive(){ const w=S.wo; return w&&!w.done&&w.d===todayKey()?w:null; }
function woElapsed(w){ w=w||woActive(); if(!w) return 0; const paused=(w.pauses||[]).reduce((n,p)=>n+((p[1]||Date.now())-p[0]),0); return (Date.now()-w.start-paused)/1000; }
function woPaused(w){ w=w||woActive(); const p=w&&(w.pauses||[]); return !!(p&&p.length&&!p[p.length-1][1]); }
function woSave(){ save('wo',S.wo); }
function woStart(){ const ids=todayList(); if(!ids.length){ toast('אין תרגילים להיום. הוסף/י תרגילים קודם.'); return; } const first=ids.findIndex(id=>!doneToday(id)); S.wo={start:Date.now(),d:todayKey(),i:Math.max(0,first),pauses:[],done:false}; woSave(); haptic(20); go('#workout'); }
function woTogglePause(){ const w=woActive(); if(!w) return; w.pauses=w.pauses||[]; if(woPaused(w)) w.pauses[w.pauses.length-1][1]=Date.now(); else w.pauses.push([Date.now(),null]); woSave(); render(); }
function woFinish(){ const w=woActive(); if(!w) return; const dur=Math.round(woElapsed(w)); const ids=todayList(); const sess=ids.map(id=>(S.logs[id]?.sessions||[]).find(s=>s.d===todayKey())).filter(Boolean); const sets=sess.reduce((n,s)=>n+s.sets.filter(x=>x.t).length,0); const vol=sess.reduce((n,s)=>n+volume(s.sets.filter(x=>x.t)),0); const prs=ids.filter(id=>{ const b=bestSet(id); return b&&b.d===todayKey()&&(S.logs[id].sessions||[]).length>1; }).length;
  w.done=true; w.dur=dur; woSave(); recordDay(); const rec=S.days.map[todayKey()]; if(rec){ rec.dur=dur; rec.start=w.start; clearTimeout(recordDay.t); save('days',S.days); }
  const body=h('div',{},h('h2',{},'כל הכבוד, סיימת!'),h('p',{class:'small muted',style:'margin:0;line-height:1.5'},`${DAY_NAMES[new Date(todayKey()).getDay()]} ${fmtDate(todayKey())}`),h('div',{class:'wo-sum'},h('div',{},h('b',{},fmtClock(dur)),h('span',{},'זמן אימון')),h('div',{},h('b',{},String(sets)),h('span',{},'סטים')),h('div',{},h('b',{},fmtK(vol)),h('span',{},'ק״ג נפח'))),prs?h('div',{class:'banner good',style:'align-items:center'},ic('trophy'),h('span',{class:'grow'},`${prs===1?'שיא אישי חדש':prs+' שיאים אישיים חדשים'} היום!`)):null,h('button',{class:'btn',style:'margin-top:12px',onclick:()=>{ Sheet.close(); go('#journal'); }},'ליומן'),h('button',{class:'btn sec2',style:'margin-top:8px',onclick:()=>{ Sheet.close(); go('#home'); }},'לדף היום'));
  haptic([60,40,60]); stopRest(); Sheet.show(body,()=>{ if(route.page==='workout') go('#home'); });
}
function woGoto(i){ const w=woActive(); if(!w) return; const ids=todayList(); w.i=Math.max(0,Math.min(ids.length-1,i)); woSave(); stopRest(); render(); }
function woNextIdx(){ const w=woActive(); const ids=todayList(); if(!w) return -1; for(let k=1;k<=ids.length;k++){ const j=(w.i+k)%ids.length; if(!doneToday(ids[j])) return j; } return -1; }
let WO_IV=null;
function woTick(){ const el=$('#woTime'); const w=woActive(); if(!el||!w){ clearInterval(WO_IV); WO_IV=null; return; } el.textContent=fmtClock(woElapsed(w)); const tm=$('#goTime'); if(tm) tm.textContent=fmtClock(woElapsed(w)); }
function woTimer(){ clearInterval(WO_IV); WO_IV=setInterval(woTick,1000); woTick(); }
function startBar(){
  const w=woActive(); const ids=todayList(); if(!ids.length) return null;
  if(w){ const left=ids.filter(id=>!doneToday(id)).length; return h('button',{class:'gobar live pressable',onclick:()=>go('#workout')},h('div',{class:'pl'},ic(woPaused(w)?'play':'pause')),h('div',{},h('div',{class:'k'},woPaused(w)?'האימון מושהה':'אימון פעיל'),h('div',{class:'s'},left?`נשארו ${left} תרגילים · המשך/י`:'כל התרגילים הושלמו · לסיכום')),h('div',{class:'tm',id:'goTime'},fmtClock(woElapsed(w)))); }
  const done=ids.every(id=>doneToday(id)); if(done) return null;
  return h('button',{class:'gobar pressable',onclick:woStart},h('div',{class:'pl'},ic('play')),h('div',{},h('div',{class:'k'},'התחל אימון'),h('div',{class:'s'},`${ids.length} תרגילים · סטופר, סטים ומעבר מודרך לתרגיל הבא`)));
}
function workout(){
  const w=woActive(); const ids=todayList();
  if(!w){ header('אימון',{back:'#home'}); const wrap=h('div'); wrap.append(h('div',{class:'display'},'אימון מודרך'),h('p',{class:'lead'},'סטופר רץ, כל סט נרשם, והאפליקציה מעבירה אותך לתרגיל הבא.')); if(ids.length) wrap.append(h('button',{class:'btn',onclick:woStart},'התחל אימון')); else wrap.append(h('div',{class:'empty'},ic('gym'),h('div',{},'אין תרגילים להיום. בחר/י תרגילים בדף "היום" קודם.')),h('button',{class:'btn sec2',onclick:()=>go('#home')},'לדף היום')); return wrap; }
  const i=Math.min(w.i,ids.length-1); const id=ids[i]; const e=getEx(id);
  header('אימון',{back:'#home',right:h('button',{class:'btn sm sec2',onclick:()=>confirmSheet('לסיים את האימון?','הסטופר ייעצר והסיכום יישמר ביומן.',woFinish,'כן, סיימתי')},'סיום')});
  const wrap=h('div');
  const paused=woPaused(w);
  wrap.append(h('div',{class:'wo-top'},h('div',{},h('div',{class:'tm',id:'woTime'},fmtClock(woElapsed(w))),h('div',{class:'lbl'},paused?'מושהה':`תרגיל ${i+1} מתוך ${ids.length} · ${ids.filter(x=>doneToday(x)).length} הושלמו`)),h('div',{class:'ctl'},h('button',{'aria-label':paused?'המשך':'השהה',onclick:woTogglePause},ic(paused?'play':'pause')),h('button',{class:'fin','aria-label':'סיום',onclick:()=>confirmSheet('לסיים את האימון?','הסטופר ייעצר והסיכום יישמר ביומן.',woFinish,'כן, סיימתי')},ic('flag')))));
  wrap.append(h('div',{class:'wo-dots'},...ids.map((x,k)=>h('i',{class:k===i?'cur':(doneToday(x)?'done':'')}))));
  const strip=h('div',{class:'wo-strip'}); ids.forEach((x,k)=>{ const ex=getEx(x); if(!ex) return; strip.append(h('button',{class:(k===i?'cur':'')+(doneToday(x)?' done':''),onclick:()=>woGoto(k)},h('div',{class:'th'},doneToday(x)?ic('check'):thumb(ex,{still:true})),h('span',{class:'t'},ex.he))); }); wrap.append(strip);
  if(!e){ wrap.append(h('div',{class:'empty'},'התרגיל לא נמצא')); return wrap; }
  const dc=demoCard(e); if(dc) wrap.append(dc);
  const tgt=targetsFor(e.id); const cardio=isCardio(e);
  wrap.append(h('div',{class:'wo-name'},h('h1',{},e.he),h('div',{class:'n'},tgt?(cardio?`יעד ${tgt.reps} דק׳`:`יעד ${tgt.sets}×${tgt.reps}`):subName(e))));
  let nextBox=null;
  const showNext=()=>{ const j=woNextIdx(); if(nextBox) nextBox.remove(); if(j<0){ nextBox=h('button',{class:'wo-next pressable',onclick:()=>confirmSheet('לסיים את האימון?','כל התרגילים הושלמו. הסיכום יישמר ביומן.',woFinish,'כן, סיימתי')},h('div',{class:'th',style:'display:grid;place-items:center'},ic('trophy')),h('div',{class:'grow'},h('div',{class:'k'},'זה היה התרגיל האחרון!'),h('div',{class:'s'},'לחץ/י לסיכום האימון')),ic('chev')); } else { const n=getEx(ids[j]); nextBox=h('button',{class:'wo-next pressable',onclick:()=>woGoto(j)},h('div',{class:'th'},thumb(n,{still:true})),h('div',{class:'grow'},h('div',{class:'k'},'סיימת! הבא: '+n.he),h('div',{class:'s'},S.profile.autoNext==='off'?'לחץ/י כדי להמשיך':'ממשיכים אוטומטית בסוף המנוחה')),ic('chev')); } card.after(nextBox); };
  const card=setsCard(e,{onDone:()=>{ showNext(); haptic([30,30,30]); if(S.profile.autoNext!=='off'){ const j=woNextIdx(); if(j>=0){ Rest.onDone=()=>{ if(route.page==='workout'&&woActive()&&doneToday(e.id)) woGoto(j); }; if(!restSeconds()) setTimeout(()=>{ if(route.page==='workout'&&woActive()&&doneToday(e.id)) woGoto(j); },1400); } } }});
  wrap.append(card);
  if(doneToday(e.id)) setTimeout(showNext,0);
  wrap.append(h('div',{class:'wo-nav'},h('button',{class:'btn sec2',disabled:i===0,onclick:()=>woGoto(i-1)},'‹ הקודם'),h('button',{class:'btn sec2',disabled:i>=ids.length-1,onclick:()=>woGoto(i+1)},'דלג ›')));
  if(e.dhe||e.ins?.length){ const det=h('details',{class:'card'},h('summary',{},h('span',{},'איך מבצעים'),ic('chevd'))); const body=h('div',{style:'margin-top:12px'}); if(e.dhe) body.append(h('p',{class:'small',style:'margin:0 0 8px;line-height:1.6'},e.dhe)); if(e.ins?.length) body.append(h('ol',{class:'steps'},...e.ins.map(s=>h('li',{},s)))); det.append(body); wrap.append(det); }
  woTimer();
  return wrap;
}
/* ---- my exercises (settings) ---- */
function myex(){
  header('התרגילים שלי',{back:'#more'}); const wrap=h('div',{class:'myex'}); wrap.append(h('div',{class:'display'},'התרגילים שלי'),h('p',{class:'lead'},'תרגילים ומכשירים שהוספת בעצמך. אפשר לערוך, להחליף תמונה, לבחור הדגמה ולמחוק.'));
  const list=h('div',{class:'list'}); const cs=S.deck.custom||[];
  cs.forEach(c=>list.append(exItem(c,{sub:(GROUPS[c.g]||'')+(c.anim&&ANIM_HE[c.anim]?' · הדגמה: '+ANIM_HE[c.anim]:''),right:h('button',{class:'btn sm sec2',onclick:ev=>{ ev.stopPropagation(); editCustom(c); }},'ערוך')})));
  if(!cs.length) list.append(h('div',{class:'empty'},ic('gym'),h('div',{},'עוד לא הוספת תרגילים משלך.')));
  wrap.append(list,h('button',{class:'btn',style:'margin-top:12px',html:I('plus')+'<span>תרגיל או מכשיר חדש</span>',onclick:()=>addMachineSheet()}));
  const stars=(S.deck.stars||[]).map(getEx).filter(Boolean);
  wrap.append(h('div',{class:'sec'},h('h2',{},`במכון שלי (${stars.length})`)));
  const l2=h('div',{class:'list'}); stars.slice(0,60).forEach(e=>l2.append(exItem(e,{right:starBtn(e)}))); if(!stars.length) l2.append(h('div',{class:'empty'},'סמן/י כוכב על תרגילים בספרייה כדי לראות אותם כאן.')); wrap.append(l2);
  return wrap;
}
function exMenu(e){
  const i=new Date(todayKey()).getDay(); const d=wkDay(i); const inToday=d.ex.some(x=>x.id===e.id); const cardio=isCardio(e);
  const body=h('div'); body.append(h('h2',{},e.he)); const list=h('div',{class:'list'});
  const item=(icn,t,s,onclick,danger)=>h('button',{class:'item pressable',style:danger?'color:var(--bad)':'',onclick},h('div',{class:'th',style:'width:40px;height:40px;border-radius:12px;color:'+(danger?'var(--bad)':'var(--accent)')+';background:'+(danger?'rgba(248,113,113,.12)':'var(--accent-soft)')},ic(icn)),h('div',{class:'grow'},h('div',{class:'t'},t),s?h('div',{class:'s'},s):null),ic('chev'));
  if(inToday) list.append(item('minus','הסר מהיום','יורד מרשימת התרגילים של היום (אפשר לבטל)',()=>{ Sheet.close(); removeFromDay(i,e.id); go('#home'); },true));
  else list.append(item('plus','הוסף להיום','',()=>{ d.rest=false; d.ex.push({id:e.id,sets:cardio?1:3,reps:cardio?30:repsForGoal()}); saveWeek(); Sheet.close(); toast('נוסף להיום'); render(); }));
  if(inToday) list.append(item('shuffle','החלף בתרגיל אחר','מסיר את זה ופותח את הבחירה',()=>{ Sheet.close(); removeFromDay(i,e.id); setTimeout(()=>addToDaySheet(i),350); }));
  list.append(item('play',S.yt[e.id]||e.yt?'ערוך קישור יוטיוב':'קישור יוטיוב משלי','',()=>{ Sheet.close(); setTimeout(()=>editYt(e),300); }));
  if(e.custom) list.append(item('user','ערוך תרגיל','שם, קבוצה, תמונה, הדגמה',()=>{ Sheet.close(); setTimeout(()=>editCustom(e),300); }));
  body.append(list); Sheet.show(body);
}
"""

def between(s, start, end, p):
    assert s.count(start) == 1, (p, 'start', s.count(start), start[:70])
    i = s.index(start); j = s.index(end, i) + len(end)
    return i, j

EDITS = [
 # anim.js + CSS
 ("<script>\n'use strict';", "<script src=\"anim.js\"></script>\n<script>\n'use strict';"),
 (".rowx:active{color:var(--bad)}", ".rowx:active{color:var(--bad)}" + CSS),
 # icons
 ("const ICONS={", "const ICONS={\n pause:'<path d=\"M8 5v14M16 5v14\"/>',flag:'<path d=\"M5 21V4h12l-2 4 2 4H5\"/>',"),
 # thumbs → demos
 ("h('div',{class:'th'},hasImg(e)?exImg(e,'s'):ic(e.g in ICONS?e.g:'gym'))", "h('div',{class:'th'},thumb(e))"),
 ("h('div',{class:'th'},hasImg(n)?exImg(n,'s'):null)", "h('div',{class:'th'},thumb(n))"),
 ("h('button',{class:'th pressable',onclick:()=>go('#ex-'+e.id)},hasImg(e)?exImg(e,'s'):null)", "h('button',{class:'th pressable',onclick:()=>go('#ex-'+e.id)},thumb(e))"),
 ("h('div',{class:'im'},hasImg(e)?exImg(e,'s'):null)", "h('div',{class:'im'},exVis(e))"),
 ("img:first&&hasImg(first)?exImg(first,'s'):''", "img:first?(exVis(first,{still:true})||''):''"),
 # exercise page: header menu + demo card instead of the 96px image
 ("header(e.he,{back:'#home',right:starBtn(e)});", "header(e.he,{back:'#home',right:h('div',{class:'row',style:'gap:6px'},starBtn(e),h('button',{class:'iconbtn',html:I('dots'),'aria-label':'אפשרויות',onclick:()=>exMenu(e)}))});"),
 # routes
 ("const pages={home,week:home,library,group:groupPage,ex:exPage,gym,machine:machinePage,plans,guides,read:readPage,profile,calories,progress,install,journal,more};",
  "const pages={home,week:home,library,group:groupPage,ex:exPage,gym,machine:machinePage,plans,guides,read:readPage,profile,calories,progress,install,journal,more,workout,myex};"),
 ("const m={ex:'home',week:'home',group:'library',machine:'library',gym:'library',guides:'more',read:'more',calories:'more',progress:'journal',install:'more',plans:'more',profile:'more'};",
  "const m={ex:'home',week:'home',workout:'home',group:'library',machine:'library',gym:'library',guides:'more',read:'more',calories:'more',progress:'journal',install:'more',plans:'more',profile:'more',myex:'more'};"),
 ("  else if(key.startsWith('log-')) S.logs[key.slice(4)]=data;", "  else if(key==='wo') S.wo=data;\n  else if(key.startsWith('log-')) S.logs[key.slice(4)]=data;"),
 # home: start-workout bar above today's list; trash in edit mode; clearer menu label
 ("  const list=h('div',{class:'list'});\n  ids.forEach(id=>{ const e=getEx(id); if(!e) return; const [dn,tot]=isToday?setsDoneToday(id):[0,0];",
  "  if(isToday&&!editMode){ const sb=startBar(); if(sb){ wrap.append(sb); if(woActive()) woTimer(); } }\n  const list=h('div',{class:'list'});\n  ids.forEach(id=>{ const e=getEx(id); if(!e) return; const [dn,tot]=isToday?setsDoneToday(id):[0,0];"),
 ("h('button',{class:'iconbtn sm',html:I('chevd'),onclick:ev=>{ ev.stopPropagation(); const k=d.ex.indexOf(tg); if(k<d.ex.length-1){ [d.ex[k+1],d.ex[k]]=[d.ex[k],d.ex[k+1]]; saveWeek(); render(); } }}));",
  "h('button',{class:'iconbtn sm',html:I('chevd'),onclick:ev=>{ ev.stopPropagation(); const k=d.ex.indexOf(tg); if(k<d.ex.length-1){ [d.ex[k+1],d.ex[k]]=[d.ex[k],d.ex[k+1]]; saveWeek(); render(); } }}),h('button',{class:'iconbtn sm',html:I('trash'),style:'color:var(--bad)','aria-label':'הסר מהיום',onclick:ev=>{ ev.stopPropagation(); removeFromDay(sel,id); }}));"),
 ("list.append(item('shuffle','סדר תרגילים','',()=>{ editMode=true; Sheet.close(); render(); }));", "list.append(item('shuffle','סדר או הסר תרגילים','חיצים לסידור, פח להסרה',()=>{ editMode=true; Sheet.close(); render(); }));"),
 ("'aria-label':'הסר תרגיל',html:I('minus')", "'aria-label':'הסר מהיום',title:'הסר מהיום',html:I('minus')"),
 # settings
 ("wrap.append(h('div',{class:'sec'},h('h2',{},'הגדרות')),h('div',{class:'card'},h('div',{class:'fld'},h('label',{},'מנוחה בין סטים'),rest),h('div',{class:'fld',style:'margin:0'},h('label',{},'מראה'),theme)));",
  "const anim=h('select',{},...[['','הדגמות מונפשות (ברירת מחדל)'],['off','תמונות']].map(([v,l])=>h('option',{value:v,selected:(p.anim||'')===v},l))); anim.addEventListener('change',()=>{ p.anim=anim.value||undefined; save('profile',p); toast(anim.value?'עברנו לתמונות':'עברנו להדגמות מונפשות'); });\n  const auto=h('select',{},...[['','כן, בסוף המנוחה'],['off','לא, רק בלחיצה']].map(([v,l])=>h('option',{value:v,selected:(p.autoNext||'')===v},l))); auto.addEventListener('change',()=>{ p.autoNext=auto.value||undefined; save('profile',p); });\n  wrap.append(h('div',{class:'sec'},h('h2',{},'תרגילים')),h('div',{class:'list morelist'},row('gym','התרגילים שלי',`${(S.deck.custom||[]).length} משלי · ${(S.deck.stars||[]).length} במכון שלי`,()=>go('#myex')),row('plus','הוסף תרגיל או מכשיר','שם, קבוצת שרירים, תמונה, יוטיוב',()=>addMachineSheet()),row('shuffle','סדר או הסר תרגילים מהיום','',()=>{ editMode=true; homeDay=new Date(todayKey()).getDay(); go('#home'); })));\n  wrap.append(h('div',{class:'sec'},h('h2',{},'הגדרות')),h('div',{class:'card'},h('div',{class:'fld'},h('label',{},'הדגמות תרגילים'),anim),h('div',{class:'fld'},h('label',{},'באימון מודרך: מעבר אוטומטי לתרגיל הבא'),auto),h('div',{class:'fld'},h('label',{},'מנוחה בין סטים'),rest),h('div',{class:'fld',style:'margin:0'},h('label',{},'מראה'),theme)));"),
 # journal: workout duration
 ("h('div',{class:'s'},`${plural(items.length,'תרגיל אחד','תרגילים')}${vol?' · '+fmtK(vol)+' ק״ג':''}`)", "h('div',{class:'s'},`${plural(items.length,'תרגיל אחד','תרגילים')}${vol?' · '+fmtK(vol)+' ק״ג':''}${S.days.map[dt]?.dur?' · '+fmtClock(S.days.map[dt].dur):''}`)"),
 # custom exercise editing: pick a demo
 ("const notes=h('textarea',{}); notes.value=e.notes||''; const file=h('input',{type:'file',accept:'image/*',capture:'environment'}); let photo=e.photo||'';",
  "const notes=h('textarea',{}); notes.value=e.notes||''; const animSel=h('select',{},h('option',{value:''},'בלי הדגמה (תמונה בלבד)'),...Object.entries(ANIM_HE).sort((a,b)=>a[1].localeCompare(b[1],'he')).map(([k,l])=>h('option',{value:k,selected:e.anim===k},l))); const file=h('input',{type:'file',accept:'image/*',capture:'environment'}); let photo=e.photo||'';"),
 ("h('div',{class:'fld'},h('label',{},'קבוצת שרירים'),grp),h('div',{class:'fld'},h('label',{},'תמונה'),file),h('div',{class:'fld'},h('label',{},'הערות'),notes),",
  "h('div',{class:'fld'},h('label',{},'קבוצת שרירים'),grp),h('div',{class:'fld'},h('label',{},'הדגמה מונפשת'),animSel),h('div',{class:'fld'},h('label',{},'תמונה'),file),h('div',{class:'fld'},h('label',{},'הערות'),notes),"),
 ("e.he=name.value.trim()||e.he; e.g=grp.value; e.notes=notes.value.trim(); e.photo=photo;", "e.he=name.value.trim()||e.he; e.g=grp.value; e.notes=notes.value.trim(); e.photo=photo; if(animSel.value) e.anim=animSel.value; else delete e.anim;"),
 # rest timer: callback when the rest ends (used by the guided workout)
 ("if(left<=0){ clearInterval(Rest.iv); Rest.el.classList.add('done'); Rest.el.querySelector('.l').textContent='המנוחה נגמרה'; haptic([80,60,80]); setTimeout(stopRest,2500); }",
  "if(left<=0){ clearInterval(Rest.iv); Rest.el.classList.add('done'); Rest.el.querySelector('.l').textContent='המנוחה נגמרה'; haptic([80,60,80]); setTimeout(stopRest,2500); const cb=Rest.onDone; Rest.onDone=null; if(cb) setTimeout(cb,900); }"),
 ("function stopRest(){ clearInterval(Rest.iv); if(Rest.el) Rest.el.classList.remove('on'); }", "function stopRest(){ clearInterval(Rest.iv); Rest.onDone=null; Rest.gen=(Rest.gen||0)+1; if(Rest.el) Rest.el.classList.remove('on'); }"),
 ("Rest.end=Date.now()+sec*1000; Rest.total=sec; Rest.el.classList.remove('done'); clearInterval(Rest.iv); tick(); Rest.iv=setInterval(tick,250); requestAnimationFrame(()=>Rest.el.classList.add('on')); }", "Rest.end=Date.now()+sec*1000; Rest.total=sec; Rest.el.classList.remove('done'); clearInterval(Rest.iv); tick(); Rest.iv=setInterval(tick,250); Rest.gen=(Rest.gen||0)+1; const g=Rest.gen; requestAnimationFrame(()=>{ if(Rest.gen===g) Rest.el.classList.add('on'); }); }"),
 # helpers block before the boot
 ("/* ========================= boot ========================= */", HELPERS + "\n/* ========================= boot ========================= */"),
]

HERO_OLD_START = "  const img=h('div',{class:'img',style:'width:96px;height:96px;border-radius:18px'});"
HERO_OLD_END = "h('div',{class:'en'},[MUSCLE[e.pm?.[0]]||GROUPS[e.g],e.eq&&e.eq!=='custom'?EQ[e.eq]:null].filter(Boolean).join(' · '))),img));"
HERO_NEW = "  const dc=demoCard(e); if(dc) wrap.append(dc);\n  wrap.append(h('div',{class:'hero',style:'grid-template-columns:1fr;margin-bottom:10px'},h('div',{class:'grow'},h('h1',{},e.he),h('div',{class:'en'},[subName(e),e.eq&&e.eq!=='custom'?EQ[e.eq]:null].filter(Boolean).join(' · ')))));"

SETS_START = "  const cardio=isCardio(e); const last=lastSession(e.id); const isToday=last&&last.d===todayKey();"
SETS_END = "  function persist(){ const l=S.logs[e.id]||{sessions:[]}; const idx=l.sessions.findIndex(s=>s.d===todayKey()); const sess={d:todayKey(),sets:sets.map(s=>({r:+s.r||0,w:+s.w||0,t:!!s.t}))}; if(idx>=0) l.sessions[idx]=sess; else l.sessions.push(sess); if(l.sessions.length>80) l.sessions=l.sessions.slice(-80); S.logs[e.id]=l; clearTimeout(persist.t); persist.t=setTimeout(()=>save('log-'+e.id,l),500); recordDay(); }"

for p in ('index.template.html', 'index.html'):
    s = open(p, encoding='utf-8').read()
    for a, b in EDITS:
        assert s.count(a) == 1, (p, s.count(a), a[:90])
        s = s.replace(a, b)
    # hero → demo card
    i, j = between(s, HERO_OLD_START, HERO_OLD_END, p); s = s[:i] + HERO_NEW + s[j:]
    # sets block → setsCard(e,{onDone})
    i, j = between(s, SETS_START, SETS_END, p)
    block = s[i:j]
    assert "  wrap.append(card); const nb=nextBar(e); if(nb) wrap.append(nb);\n" in block
    block = block.replace("  wrap.append(card); const nb=nextBar(e); if(nb) wrap.append(nb);\n", "")
    block = block.replace("const sets_=null;", "")
    # the exercise page uses `sets` later? no – it recomputes sessions. Make persist notify.
    block = block.replace("persist.t=setTimeout(()=>save('log-'+e.id,l),500); recordDay(); }",
                          "persist.t=setTimeout(()=>save('log-'+e.id,l),500); recordDay(); if(opts.onDone&&sets.length&&sets.every(x=>x.t)){ if(!persist.fired){ persist.fired=true; opts.onDone(); } } else persist.fired=false; }\n  return card;\n}")
    fn = "function setsCard(e,opts={}){\n" + block
    s = s[:i] + "  const cardio=isCardio(e); const card=setsCard(e); wrap.append(card); const nb=nextBar(e); if(nb) wrap.append(nb);\n" + s[j:]
    # place setsCard right before exPage
    anchor = "/* ========================= EXERCISE PAGE ========================= */"
    assert s.count(anchor) == 1
    s = s.replace(anchor, fn + "\n" + anchor)
    # setsCard needs isToday/prev/tgt only inside; exPage later uses `cardio`,`prev`,`tgt`? check names below
    open(p, 'w', encoding='utf-8').write(s)
print('v8 edits ok')
