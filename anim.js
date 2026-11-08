/* ===================================================================================
   anim.js — הדגמות תנועה לתרגילים (SVG, ללא תמונות)
   דמות ממופרקת (צד / חזית) + ציוד (מוט, משקולות, קטלבל, כבל, ספסל, מכונה…).
   כל תרגיל ממופה ל"ארכיטיפ תנועה" (ראה EXANIM.RULES בסוף הקובץ); לכל ארכיטיפ
   שני פוזות או יותר, והמנוע מרכך ביניהן בזמן אמת (קונצנטרי מהיר, אקסצנטרי איטי).
   עקרונות (מתוך סקיל anatomy): גופים מלאים ולא קווי מתאר, ארבעה טונים, סדר ציור
   מאחור לפנים, הילה מתחת לדמות, "חלק מואר אחד" = השריר העובד, תנועה רגועה
   מבוססת זמן, עצירה מחוץ למסך ובהעדפת reduced-motion.
   API:  EXANIM.resolve(e) -> {key,arch,prop}|null   EXANIM.make(e,{size,still,muscle}) -> <svg>
   =================================================================================== */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const D=Math.PI/180;
const L={head:9,neck:5,torso:42,ua:27,fa:25,hand:3.4,th:38,sh:36,ft:13};
const FLOOR=160;
// ---------- small helpers ----------
const el=(t,a)=>{ const n=document.createElementNS(NS,t); if(a) for(const k in a) n.setAttribute(k,a[k]); return n; };
const set=(n,a)=>{ for(const k in a) n.setAttribute(k,a[k]); };
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;          // easeInOutQuad
const sm=t=>t*t*(3-2*t);
// direction helpers: limbs measured from "down", clockwise toward the front (+x); torso from "up"
const dir=a=>[Math.sin(a*D),Math.cos(a*D)];
const up=a=>[Math.sin(a*D),-Math.cos(a*D)];
const add=(p,v,l)=>[p[0]+v[0]*l,p[1]+v[1]*l];
const mid=(a,b,t=.5)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];

// ---------- poses ----------
// side view defaults (facing right)
const SIDE0={hx:100,hy:82,to:0,hd:0,ua:0,fa:0,ua2:null,fa2:null,th:0,sh:0,ft:90,th2:null,sh2:null,ft2:null,sho:0,sc:1,hh:0};
// front view defaults (facing viewer); angles positive = outward
const FRONT0={hx:100,hy:82,to:0,hd:0,ua:4,fa:4,ua2:null,fa2:null,th:4,sh:4,th2:null,sh2:null,sho:0,sc:1,lg:1,al:1};
function full(p,base){ const o={...base,...p}; if(o.ua2==null) o.ua2=o.ua; if(o.fa2==null) o.fa2=o.fa; if(o.th2==null) o.th2=o.th; if(o.sh2==null) o.sh2=o.sh; if(o.ft2==null) o.ft2=o.ft; return o; }
function mix(a,b,t){ const o={}; for(const k in a){ const x=a[k],y=b[k]; o[k]=(typeof x==='number'&&typeof y==='number')?lerp(x,y,t):(t<.5?x:y); } return o; }

// ---------- forward kinematics ----------
function fkSide(p){
  const hip=[p.hx,p.hy];
  const tdir=up(p.to); const sh=add(hip,tdir,L.torso); const shR=[sh[0],sh[1]-p.sho];       // shoulder (raised by sho)
  const neck=add(shR,up(p.to+p.hd),L.neck); const head=add(neck,up(p.to+p.hd),L.head);
  const arm=(ua,fa)=>{ const e=add(shR,dir(ua),L.ua); const w=add(e,dir(fa),L.fa); const h=add(w,dir(fa),L.hand); return {s:shR,e,w,h}; };
  const leg=(th,sh_,ft)=>{ const k=add(hip,dir(th),L.th); const a=add(k,dir(sh_),L.sh); const f=add(a,dir(ft),L.ft); return {h:hip,k,a,f}; };
  return {hip,sh:shR,neck,head,tdir,fdir:[tdir[1]*-1,tdir[0]].map((v,i)=>i===0?-tdir[1]:tdir[0]), // perpendicular pointing to the front
          arm1:arm(p.ua,p.fa),arm2:arm(p.ua2,p.fa2),leg1:leg(p.th,p.sh,p.ft),leg2:leg(p.th2,p.sh2,p.ft2)};
}
function fkFront(p){
  const hip=[p.hx,p.hy]; const tdir=up(p.to); const top=add(hip,tdir,L.torso); const perp=[Math.cos(p.to*D),Math.sin(p.to*D)];
  const shL=add(top,perp,-12), shR=add(top,perp,12); shL[1]-=p.sho; shR[1]-=p.sho;
  const neck=add(top,up(p.to+p.hd),L.neck-1); const head=add(neck,up(p.to+p.hd),L.head);
  const hipL=add(hip,perp,-7), hipR=add(hip,perp,7);
  const arm=(s,ua,fa,side)=>{ const d1=[Math.sin(ua*D)*side,Math.cos(ua*D)], d2=[Math.sin(fa*D)*side,Math.cos(fa*D)]; const e=add(s,d1,L.ua*p.al); const w=add(e,d2,L.fa*p.al); const h=add(w,d2,L.hand); return {s,e,w,h}; };
  const leg=(hp,th,sh_,side)=>{ const d1=[Math.sin(th*D)*side,Math.cos(th*D)], d2=[Math.sin(sh_*D)*side,Math.cos(sh_*D)]; const k=add(hp,d1,L.th*p.lg); const a=add(k,d2,L.sh*p.lg); const f=[a[0]+side*2,a[1]+7]; return {h:hp,k,a,f}; };
  return {hip,top,neck,head,tdir,perp,shL,shR,arm1:arm(shR,p.ua,p.fa,1),arm2:arm(shL,p.ua2,p.fa2,-1),leg1:leg(hipR,p.th,p.sh,1),leg2:leg(hipL,p.th2,p.sh2,-1)};
}

// ---------- muscle anchor (where the glow sits) ----------
const MUS={chest_upper:'chest',chest_mid:'chest',chest_lower:'chest',lats:'back',back_upper:'back',back_lower:'lowback',delt_front:'delt',delt_side:'delt',delt_rear:'delt',biceps:'biceps',triceps:'triceps',forearms:'forearm',quads:'quads',hams:'hams',calves:'calves',adductors:'quads',hipflex:'hipflex',glute_max:'glute',glute_med:'glute',abs:'core',obliques:'core',core_deep:'core',
  chest:'chest',back:'back',shoulders:'delt',arms:'biceps',legs:'quads',glutes:'glute',core:'core',cardio:'core',stretch:null,full:null};
function musclePoint(k,m,view){
  const f=view==='f'; const fr=f?[0,0]:[-k.tdir[1],k.tdir[0]];                         // "front" perpendicular (side view only)
  const t=(q)=>add(k.hip,k.tdir,L.torso*q);
  const a=k.arm1, lg=k.leg1;
  switch(m){
    case 'chest': return [add(t(.8),fr,f?0:7),12];
    case 'back': return [add(t(.62),fr,f?0:-7),13];
    case 'lowback': return [add(t(.22),fr,f?0:-6),11];
    case 'delt': return [f?k.shR:k.sh,9];
    case 'biceps': return [add(mid(a.s,a.e),f?[0,0]:[(a.e[0]-a.s[0])/L.ua*0+ (a.e[1]-a.s[1])/L.ua, -(a.e[0]-a.s[0])/L.ua],f?0:4),8];
    case 'triceps': return [add(mid(a.s,a.e),f?[0,0]:[(a.e[1]-a.s[1])/L.ua, -(a.e[0]-a.s[0])/L.ua],f?0:-4),8];
    case 'forearm': return [mid(a.e,a.w),7];
    case 'quads': return [add(mid(lg.h,lg.k),f?[0,0]:[(lg.k[1]-lg.h[1])/L.th,-(lg.k[0]-lg.h[0])/L.th],f?0:5),11];
    case 'hams': return [add(mid(lg.h,lg.k),f?[0,0]:[(lg.k[1]-lg.h[1])/L.th,-(lg.k[0]-lg.h[0])/L.th],f?0:-5),11];
    case 'hipflex': return [add(k.hip,fr,f?0:6),9];
    case 'glute': return [add(k.hip,fr,f?0:-6),11];
    case 'calves': return [add(mid(lg.k,lg.a),f?[0,0]:[(lg.a[1]-lg.k[1])/L.sh,-(lg.a[0]-lg.k[0])/L.sh],f?0:-4),8];
    case 'core': return [add(t(.45),fr,f?0:6),11];
  }
  return null;
}

// ---------- figure (DOM once, attributes per frame) ----------
const TONE={skin:'#E6B48B',skin2:'#C98F66',ink:'var(--ink,#eee)',ink2:'var(--ink2,#aaa)',ink3:'var(--ink3,#666)',acc:'var(--accent,#FF6B4A)',card2:'var(--card2,#1e212b)',line:'var(--line2,rgba(128,128,128,.3))'};
function limb(g,w,color,back){ const sh=el('line',{'stroke-linecap':'round','stroke-width':w+2,stroke:'rgba(0,0,0,.28)'}); const b=el('line',{'stroke-linecap':'round','stroke-width':w,stroke:color,opacity:back?.62:1}); const hi=el('line',{'stroke-linecap':'round','stroke-width':Math.max(1.4,w*.3),stroke:'#fff',opacity:back?0:.16}); g.append(sh,b,hi); return {sh,b,hi,w}; }
function setLimb(l,a,b){ const x1=a[0],y1=a[1],x2=b[0],y2=b[1]; set(l.sh,{x1,y1,x2,y2}); set(l.b,{x1,y1,x2,y2}); const o=l.w*.22; set(l.hi,{x1:x1-o,y1:y1-o,x2:x2-o,y2:y2-o}); }
let GID=0;
function buildFigure(svg,view){
  const id='g'+(++GID);
  const defs=el('defs'); defs.innerHTML=`<radialGradient id="${id}"><stop offset="0" stop-color="${TONE.acc}" stop-opacity=".95"/><stop offset=".55" stop-color="${TONE.acc}" stop-opacity=".35"/><stop offset="1" stop-color="${TONE.acc}" stop-opacity="0"/></radialGradient>`;
  svg.append(defs);
  const root=el('g'); svg.append(root);
  const floor=el('g'); root.append(floor);
  const shadow=el('ellipse',{fill:'rgba(0,0,0,.35)'}); root.append(shadow);
  const propsBack=el('g'); root.append(propsBack);
  const glow=el('circle',{fill:`url(#${id})`,opacity:0}); root.append(glow);
  const back=el('g'); root.append(back);
  const body=el('g'); root.append(body);
  const front=el('g'); root.append(front);
  const propsFront=el('g'); root.append(propsFront);
  const F={view,root,floor,shadow,glow,propsBack,propsFront,back,body,front,props:[]};
  // back limbs
  F.b_ua=limb(back,8,TONE.ink,true); F.b_fa=limb(back,6.5,TONE.skin,true); F.b_th=limb(back,10,TONE.ink2,true); F.b_sh=limb(back,7.5,TONE.skin,true); F.b_ft=limb(back,5,TONE.ink,true); F.b_hand=el('circle',{r:3.2,fill:TONE.skin,opacity:.7}); back.append(F.b_hand);
  // torso: shorts + shirt + head
  F.hips=limb(body,15,TONE.ink2); F.torso=limb(body,16,TONE.ink); F.neckL=limb(body,5,TONE.skin);
  F.headSh=el('circle',{fill:'rgba(0,0,0,.28)'}); F.head=el('circle',{fill:TONE.skin}); F.hair=el('path',{fill:TONE.ink}); body.append(F.headSh,F.head,F.hair);
  // front limbs
  F.f_th=limb(front,10,TONE.ink2); F.f_sh=limb(front,7.5,TONE.skin); F.f_ft=limb(front,5,TONE.ink);
  F.f_ua=limb(front,8,TONE.ink); F.f_fa=limb(front,6.5,TONE.skin); F.f_hand=el('circle',{r:3.4,fill:TONE.skin}); front.append(F.f_hand);
  return F;
}
function drawFigure(F,p,k,muscle,phase){
  const f=F.view==='f';
  // legs: back leg first
  const l2=k.leg2,l1=k.leg1,a2=k.arm2,a1=k.arm1;
  setLimb(F.b_th,l2.h,l2.k); setLimb(F.b_sh,l2.k,l2.a); setLimb(F.b_ft,l2.a,l2.f);
  setLimb(F.b_ua,a2.s,a2.e); setLimb(F.b_fa,a2.e,a2.w); set(F.b_hand,{cx:a2.h[0],cy:a2.h[1]});
  const hipTop=add(k.hip,k.tdir,L.torso*.3);
  setLimb(F.hips,k.hip,hipTop); setLimb(F.torso,add(k.hip,k.tdir,L.torso*.22),f?k.top:k.sh); setLimb(F.neckL,f?k.top:k.sh,k.neck);
  set(F.head,{cx:k.head[0],cy:k.head[1],r:L.head}); set(F.headSh,{cx:k.head[0]+.6,cy:k.head[1]+.9,r:L.head+.6});
  // hair cap: half disc on the back/top of the head
  const ha=(p.to+p.hd)*D; const hx=k.head[0],hy=k.head[1],r=L.head; const rot=f?0:(-20);
  const a0=(180+rot+ (f?0:0))*D - ha, a1_=(360+rot)*D - ha;
  const p0=[hx+Math.cos(a0)*r,hy+Math.sin(a0)*r], p1=[hx+Math.cos(a1_)*r,hy+Math.sin(a1_)*r];
  set(F.hair,{d:`M${p0[0]},${p0[1]} A${r},${r} 0 0 1 ${p1[0]},${p1[1]} L${hx},${hy} Z`,opacity:.9});
  setLimb(F.f_th,l1.h,l1.k); setLimb(F.f_sh,l1.k,l1.a); setLimb(F.f_ft,l1.a,l1.f);
  setLimb(F.f_ua,a1.s,a1.e); setLimb(F.f_fa,a1.e,a1.w); set(F.f_hand,{cx:a1.h[0],cy:a1.h[1]});
  // shadow under the lowest point
  const pts=[l1.f,l2.f,a1.h,a2.h,k.head,k.hip]; let lowest=Math.max(...pts.map(q=>q[1])); const cx=(l1.f[0]+l2.f[0])/2;
  const lift=Math.max(0,Math.min(1,(FLOOR-lowest)/40));
  set(F.shadow,{cx,cy:FLOOR+2,rx:26-lift*8,ry:4-lift*1.5,opacity:.28-lift*.12});
  // muscle glow
  const mp=muscle?musclePoint(k,muscle,F.view):null;
  if(mp){ set(F.glow,{cx:mp[0][0],cy:mp[0][1],r:mp[1]*1.9,opacity:.35+.45*phase}); } else set(F.glow,{opacity:0});
}

// ---------- props ----------
// each prop: {make(g)->state, draw(state,k,p,ctx)}  ctx={hand:[x,y] (front hand), hand2, hands mid, feet...}
const PROPS={
  floor:{make(g){ const l=el('line',{x1:8,y1:FLOOR+.5,x2:192,y2:FLOOR+.5,stroke:TONE.ink3,'stroke-width':1.2,'stroke-linecap':'round',opacity:.8}); g.append(l); return {}; },draw(){}},
  bar:{make(g){ const stub=el('line',{stroke:TONE.ink2,'stroke-width':3,'stroke-linecap':'round'}); const pl=el('circle',{r:15,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':3}); const rim=el('circle',{r:10,fill:'none',stroke:TONE.ink3,'stroke-width':1,opacity:.6}); const hub=el('circle',{r:3.4,fill:TONE.ink2}); g.append(stub,pl,rim,hub); return {stub,pl,rim,hub}; },
    draw(s,k,p,c){ const h=c.hand; set(s.pl,{cx:h[0],cy:h[1]}); set(s.rim,{cx:h[0],cy:h[1]}); set(s.hub,{cx:h[0],cy:h[1]}); set(s.stub,{x1:h[0]-6,y1:h[1],x2:h[0]+6,y2:h[1]}); }},
  barF:{make(g){ const bar=el('line',{stroke:TONE.ink2,'stroke-width':3,'stroke-linecap':'round'}); const pl=[0,1].map(()=>el('rect',{width:8,height:30,rx:2.5,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':2})); g.append(bar,...pl); return {bar,pl}; },
    draw(s,k,p,c){ const y=(c.hand[1]+c.hand2[1])/2; const x1=Math.min(c.hand[0],c.hand2[0])-22,x2=Math.max(c.hand[0],c.hand2[0])+22; set(s.bar,{x1,y1:y,x2,y2:y}); set(s.pl[0],{x:x1-6,y:y-15}); set(s.pl[1],{x:x2-2,y:y-15}); }},
  db:{make(g){ const mk=()=>{ const grp=el('g'); const b=el('line',{stroke:TONE.ink2,'stroke-width':2.4,'stroke-linecap':'round'}); const p1=el('rect',{width:6,height:11,rx:2,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.6}); const p2=p1.cloneNode(); grp.append(b,p1,p2); g.append(grp); return {b,p1,p2}; }; return {a:mk(),b:mk()}; },
    draw(s,k,p,c){ const one=(d,h,fa)=>{ const v=dir(fa); const px=[-v[1],v[0]]; // perpendicular to forearm
        const a=add(h,px,-7), b=add(h,px,7); set(d.b,{x1:a[0],y1:a[1],x2:b[0],y2:b[1]}); const ang=Math.atan2(px[1],px[0])/D; set(d.p1,{x:a[0]-3,y:a[1]-5.5,transform:`rotate(${ang} ${a[0]} ${a[1]})`}); set(d.p2,{x:b[0]-3,y:b[1]-5.5,transform:`rotate(${ang} ${b[0]} ${b[1]})`}); };
      one(s.a,c.hand,c.fa); if(c.two) one(s.b,c.hand2,c.fa2); else { set(s.b.b,{x1:0,y1:0,x2:0,y2:0}); set(s.b.p1,{width:0}); set(s.b.p2,{width:0}); } }},
  kb:{make(g){ const mk=()=>{ const hd=el('path',{fill:'none',stroke:TONE.ink2,'stroke-width':2.4}); const bl=el('circle',{r:7,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':2}); const hi=el('circle',{r:2,fill:'#fff',opacity:.18}); g.append(hd,bl,hi); return {hd,bl,hi}; }; return {a:mk(),b:mk()}; },
    draw(s,k,p,c){ const one=(d,h,fa)=>{ const v=dir(fa); const cx=h[0]+v[0]*9, cy=h[1]+v[1]*9; set(d.bl,{cx,cy}); set(d.hi,{cx:cx-2.5,cy:cy-2.5}); set(d.hd,{d:`M${h[0]-4},${h[1]+1} Q${h[0]},${h[1]-6} ${h[0]+4},${h[1]+1}`,transform:`rotate(${Math.atan2(v[1],v[0])/D-90} ${h[0]} ${h[1]})`}); };
      one(s.a,c.hand,c.fa); if(c.two) one(s.b,c.hand2,c.fa2); else { set(s.b.bl,{r:0}); set(s.b.hi,{r:0}); set(s.b.hd,{d:''}); } }},
  plate:{make(g){ const pl=el('circle',{r:9,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':2.5}); const hub=el('circle',{r:2.2,fill:TONE.ink2}); g.append(pl,hub); return {pl,hub}; },draw(s,k,p,c){ set(s.pl,{cx:c.hand[0],cy:c.hand[1]}); set(s.hub,{cx:c.hand[0],cy:c.hand[1]}); }},
  ball:{make(g,o){ const b=el('circle',{r:o.r||8,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':2}); g.append(b); return {b}; },draw(s,k,p,c){ set(s.b,{cx:c.hand[0],cy:c.hand[1]}); }},
  cable:{make(g,o){ const col=el('rect',{x:o.x-4,y:o.top??6,width:8,height:(o.bottom??FLOOR)-(o.top??6),rx:3,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5}); const pul=el('circle',{cx:o.x,cy:o.y,r:4,fill:TONE.ink3}); const pul2=el('circle',{cx:o.x,cy:o.y,r:1.5,fill:TONE.ink2}); const w=el('line',{stroke:TONE.ink2,'stroke-width':1.3}); const w2=el('line',{stroke:TONE.ink2,'stroke-width':1.3}); const hd=el('line',{stroke:TONE.ink2,'stroke-width':3,'stroke-linecap':'round'}); g.append(col,pul,pul2,w,w2,hd); return {w,w2,hd,x:o.x,y:o.y,both:o.both}; },
    draw(s,k,p,c){ set(s.w,{x1:s.x,y1:s.y,x2:c.hand[0],y2:c.hand[1]}); if(s.both) set(s.w2,{x1:s.x,y1:s.y,x2:c.hand2[0],y2:c.hand2[1]}); else set(s.w2,{x1:0,y1:0,x2:0,y2:0}); const v=dir(c.fa); const px=[-v[1],v[0]]; const a=add(c.hand,px,-4),b=add(c.hand,px,4); set(s.hd,{x1:a[0],y1:a[1],x2:b[0],y2:b[1]}); }},
  band:{make(g,o){ const w=el('path',{fill:'none',stroke:TONE.acc,'stroke-width':2,opacity:.85}); if(!o.feet) g.append(el('circle',{cx:o.x,cy:o.y,r:3,fill:TONE.ink3})); g.append(w); return {w,x:o.x,y:o.y,feet:o.feet}; },
    draw(s,k,p,c){ const a=s.feet?[k.leg1.a[0],FLOOR]:[s.x,s.y]; const h=c.hand; const m=mid(a,h); set(s.w,{d:`M${a[0]},${a[1]} Q${m[0]+6},${m[1]} ${h[0]},${h[1]}`}); }},
  bench:{make(g,o){ const grp=el('g'); const x=o.x??60,y=o.y??128,w=o.w??80,ang=o.ang||0; const legs=[el('rect',{x:x+6,y,width:4,height:FLOOR-y,fill:TONE.ink3}),el('rect',{x:x+w-10,y,width:4,height:FLOOR-y,fill:TONE.ink3})]; const foot=el('rect',{x:x+2,y:FLOOR-3,width:w-4,height:3,rx:1,fill:TONE.ink3}); const pad=el('rect',{x,y:y-6,width:w,height:7,rx:3,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5}); grp.append(...legs,foot,pad); if(o.back){ const bk=el('rect',{x:o.back.x,y:o.back.y-o.back.h,width:7,height:o.back.h,rx:3,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5,transform:`rotate(${o.back.ang||0} ${o.back.x+3.5} ${o.back.y})`}); grp.append(bk); } if(ang) grp.setAttribute('transform',`rotate(${ang} ${x+w/2} ${y})`); g.append(grp); return {}; },draw(){}},
  pad:{make(g,o){ const r=el('rect',{x:o.x,y:o.y,width:o.w,height:o.h,rx:3,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5,transform:o.ang?`rotate(${o.ang} ${o.x} ${o.y})`:''}); g.append(r); if(o.post){ g.append(el('rect',{x:o.post,y:o.y,width:5,height:FLOOR-o.y,fill:TONE.ink3})); } return {}; },draw(){}},
  box:{make(g,o){ const r=el('rect',{x:o.x,y:o.y,width:o.w,height:FLOOR-o.y,rx:3,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5}); const t=el('line',{x1:o.x+2,y1:o.y+6,x2:o.x+o.w-2,y2:o.y+6,stroke:TONE.ink3,'stroke-width':1,opacity:.6}); g.append(r,t); return {}; },draw(){}},
  wall:{make(g,o){ const r=el('rect',{x:o.x,y:6,width:7,height:FLOOR-6,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5}); g.append(r); return {}; },draw(){}},
  barHigh:{make(g,o){ const y=o.y??28; const posts=[el('rect',{x:34,y,width:5,height:FLOOR-y,fill:TONE.ink3}),el('rect',{x:161,y,width:5,height:FLOOR-y,fill:TONE.ink3})]; const b=el('line',{x1:28,y1:y,x2:172,y2:y,stroke:TONE.ink2,'stroke-width':3.5,'stroke-linecap':'round'}); g.append(...posts,b); return {}; },draw(){}},
  dipBars:{make(g,o){ const y=o.y??118; const posts=[el('rect',{x:70,y,width:5,height:FLOOR-y,fill:TONE.ink3}),el('rect',{x:128,y,width:5,height:FLOOR-y,fill:TONE.ink3})]; const b=el('line',{x1:62,y1:y,x2:140,y2:y,stroke:TONE.ink2,'stroke-width':3.5,'stroke-linecap':'round'}); g.append(...posts,b); return {}; },draw(){}},
  seat:{make(g,o){ const x=o.x??80,y=o.y??122,w=o.w??34; const post=el('rect',{x:x+w/2-4,y,width:8,height:FLOOR-y,fill:TONE.ink3}); const base=el('rect',{x:x-6,y:FLOOR-4,width:w+12,height:4,rx:1.5,fill:TONE.ink3}); const pad=el('rect',{x,y:y-6,width:w,height:7,rx:3,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5}); g.append(post,base,pad); if(o.back){ g.append(el('rect',{x:o.back.x,y:o.back.y-o.back.h,width:7,height:o.back.h,rx:3,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5,transform:`rotate(${o.back.ang||0} ${o.back.x+3.5} ${o.back.y})`})); } return {}; },draw(){}},
  lever:{make(g,o){ const piv=el('circle',{cx:o.x,cy:o.y,r:3.5,fill:TONE.ink3}); const arm=el('line',{stroke:TONE.ink3,'stroke-width':4,'stroke-linecap':'round'}); const hd=el('line',{stroke:TONE.ink2,'stroke-width':3,'stroke-linecap':'round'}); const post=el('rect',{x:o.x-3,y:o.y,width:6,height:FLOOR-o.y,fill:TONE.ink3,opacity:.7}); g.append(post,arm,piv,hd); return {arm,hd,x:o.x,y:o.y,at:o.at||'hand'}; },
    draw(s,k,p,c){ const t=s.at==='foot'?k.leg1.a:c.hand; set(s.arm,{x1:s.x,y1:s.y,x2:t[0],y2:t[1]}); const v=[t[0]-s.x,t[1]-s.y]; const n=Math.hypot(v[0],v[1])||1; const px=[-v[1]/n,v[0]/n]; set(s.hd,{x1:t[0]-px[0]*6,y1:t[1]-px[1]*6,x2:t[0]+px[0]*6,y2:t[1]+px[1]*6}); }},
  footplate:{make(g,o){ const r=el('rect',{width:6,height:34,rx:2,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5}); const rail=el('line',{stroke:TONE.ink3,'stroke-width':3,opacity:.6}); g.append(rail,r); return {r,rail,ang:o.ang??-35,anchor:o.anchor}; },
    draw(s,k){ const f=mid(k.leg1.a,k.leg2.a); const a=add(f,dir(k.pose.sh+90-180),4); set(s.r,{x:f[0]+3,y:f[1]-17,transform:`rotate(${s.ang} ${f[0]+3} ${f[1]})`}); if(s.anchor) set(s.rail,{x1:s.anchor[0],y1:s.anchor[1],x2:f[0]+3,y2:f[1]}); }},
  rope:{make(g,o){ const w=el('path',{fill:'none',stroke:TONE.ink2,'stroke-width':1.8}); const w2=el('path',{fill:'none',stroke:TONE.ink2,'stroke-width':1.8}); g.append(w,w2); return {w,w2,x:o.x,y:o.y}; },
    draw(s,k,p,c){ const wave=(h,ph)=>{ const a=[s.x,s.y]; const pts=[]; for(let i=0;i<=8;i++){ const t=i/8; const q=mid(h,a,t); const amp=Math.sin(t*Math.PI)*8*Math.sin(ph*6.28+t*9); pts.push(`${q[0]},${q[1]+amp}`); } return 'M'+pts.join(' L'); }; set(s.w,{d:wave(c.hand,c.phase)}); set(s.w2,{d:wave(c.hand2,c.phase+.5)}); }},
  jumprope:{make(g){ const w=el('path',{fill:'none',stroke:TONE.ink2,'stroke-width':1.6}); g.append(w); return {w}; },
    draw(s,k,p,c){ const h=c.hand; const ph=c.phase; const r=64; const a=Math.PI*2*ph; const cx=k.hip[0],cy=k.hip[1]-10; const px=cx+Math.cos(a)*r*.4, py=cy+Math.sin(a)*r; set(s.w,{d:`M${h[0]},${h[1]} Q${px},${py} ${h[0]-1},${h[1]}`,opacity:.9}); }},
  bike:{make(g){ const grp=el('g'); const w1=el('circle',{cx:150,cy:140,r:20,fill:'none',stroke:TONE.ink3,'stroke-width':3}); const w2=el('circle',{cx:48,cy:140,r:20,fill:'none',stroke:TONE.ink3,'stroke-width':3}); const fr=el('path',{d:'M48,140 L96,100 L150,140 M96,100 L112,138 M86,112 L112,138',fill:'none',stroke:TONE.ink2,'stroke-width':3,'stroke-linecap':'round'}); const seat=el('rect',{x:82,y:96,width:20,height:5,rx:2,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5}); const bars=el('path',{d:'M150,140 L140,92 L128,92',fill:'none',stroke:TONE.ink2,'stroke-width':3,'stroke-linecap':'round'}); const crank=el('circle',{cx:112,cy:138,r:5,fill:TONE.ink3}); grp.append(w2,w1,fr,seat,bars,crank); g.append(grp); const ped=el('line',{stroke:TONE.ink2,'stroke-width':2.5,'stroke-linecap':'round'}); g.append(ped); return {ped}; },
    draw(s,k){ set(s.ped,{x1:k.leg1.a[0],y1:k.leg1.a[1],x2:k.leg2.a[0],y2:k.leg2.a[1]}); }},
  rower:{make(g){ const rail=el('rect',{x:20,y:FLOOR-14,width:170,height:5,rx:2,fill:TONE.ink3}); const fan=el('circle',{cx:176,cy:FLOOR-30,r:16,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':2.5}); const seat=el('rect',{width:22,height:5,rx:2,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5}); const w=el('line',{stroke:TONE.ink2,'stroke-width':1.3}); const hd=el('line',{stroke:TONE.ink2,'stroke-width':3,'stroke-linecap':'round'}); const fp=el('rect',{x:146,y:FLOOR-34,width:5,height:22,rx:2,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.5,transform:'rotate(-30 146 '+(FLOOR-12)+')'}); g.append(rail,fan,fp,seat,w,hd); return {seat,w,hd}; },
    draw(s,k,p,c){ set(s.seat,{x:k.hip[0]-11,y:k.hip[1]+5}); set(s.w,{x1:176,y1:FLOOR-30,x2:c.hand[0],y2:c.hand[1]}); set(s.hd,{x1:c.hand[0],y1:c.hand[1]-5,x2:c.hand[0],y2:c.hand[1]+5}); }},
  sled:{make(g){ const grp=el('g'); grp.innerHTML=`<rect x="142" y="${FLOOR-26}" width="40" height="22" rx="3" fill="${TONE.card2}" stroke="${TONE.ink3}" stroke-width="1.5"/><rect x="150" y="${FLOOR-72}" width="5" height="48" fill="${TONE.ink3}"/><rect x="138" y="${FLOOR-5}" width="50" height="4" rx="1.5" fill="${TONE.ink3}"/>`; g.append(grp); return {}; },draw(){}},
  landmine:{make(g,o){ const an=el('circle',{cx:o.x,cy:o.y,r:4,fill:TONE.ink3}); const b=el('line',{stroke:TONE.ink2,'stroke-width':3,'stroke-linecap':'round'}); const pl=el('circle',{r:9,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':2.5}); g.append(an,b,pl); return {b,pl,x:o.x,y:o.y}; },
    draw(s,k,p,c){ const h=c.hand; const v=[h[0]-s.x,h[1]-s.y]; const n=Math.hypot(v[0],v[1])||1; const e=[h[0]+v[0]/n*10,h[1]+v[1]/n*10]; set(s.b,{x1:s.x,y1:s.y,x2:e[0],y2:e[1]}); set(s.pl,{cx:h[0]+v[0]/n*4,cy:h[1]+v[1]/n*4}); }},
  wheel:{make(g){ const w=el('circle',{r:9,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':2.5}); const hub=el('circle',{r:2,fill:TONE.ink2}); g.append(w,hub); return {w,hub}; },draw(s,k,p,c){ const h=c.hand; set(s.w,{cx:h[0],cy:FLOOR-9}); set(s.hub,{cx:h[0],cy:FLOOR-9}); }},
  mat:{make(g){ g.append(el('rect',{x:14,y:FLOOR-3,width:172,height:4,rx:2,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':1.2})); return {}; },draw(){}},
  stairs:{make(g){ const grp=el('g'); let d=''; for(let i=0;i<5;i++){ const x=70+i*22,y=FLOOR-i*16; d+=`M${x},${y} h22 v-16 `; } grp.append(el('path',{d,fill:'none',stroke:TONE.ink3,'stroke-width':2.5,'stroke-linejoin':'round'})); g.append(grp); return {}; },draw(){}},
  trx:{make(g,o){ const an=el('circle',{cx:o.x??128,cy:o.y??8,r:3.5,fill:TONE.ink3}); const s1=el('line',{stroke:'#E8C25A','stroke-width':2}); const s2=el('line',{stroke:'#E8C25A','stroke-width':2}); g.append(an,s1,s2); return {s1,s2,x:o.x??128,y:o.y??8,feet:o.feet}; },
    draw(s,k,p,c){ const a=s.feet?k.leg1.a:c.hand, b=s.feet?k.leg2.a:c.hand2; set(s.s1,{x1:s.x,y1:s.y,x2:a[0],y2:a[1]}); set(s.s2,{x1:s.x,y1:s.y,x2:b[0],y2:b[1]}); }},
  bigball:{make(g,o){ const b=el('circle',{cx:o.x,cy:FLOOR-(o.r||22),r:o.r||22,fill:TONE.card2,stroke:TONE.ink3,'stroke-width':2.5}); const hi=el('circle',{cx:o.x-7,cy:FLOOR-(o.r||22)-7,r:4,fill:'#fff',opacity:.14}); g.append(b,hi); return {}; },draw(){}},
};
window.__PROPS=PROPS; window.__ANIMCORE={el,set,lerp,ease,sm,dir,up,add,mid,SIDE0,FRONT0,full,mix,fkSide,fkFront,MUS,buildFigure,drawFigure,L,FLOOR,TONE};
})();

/* =========================== archetypes: poses per movement =========================== */
(function(){
'use strict';
const ST={hx:100,hy:82};                         // standing
const SIT={hx:100,hy:122,th:85,sh:0};            // seated on a bench (seat top ≈128)
const LIE={hx:100,hy:120,to:-90,th:90,sh:0};     // lying on a bench, head to the left
const FLR={hx:100,hy:151,to:-90,th:135,sh:-12};  // lying on the floor, knees bent
const PRONE={hx:100,hy:151,to:90,th:-90,sh:-90,ft:0}; // face down on the floor
const BENT={hx:94,hy:92,to:70,th:15,sh:-10};     // hip hinge, torso ~70°
const Q={hx:100,hy:108,to:90,ua:0,fa:0,th:0,sh:-90,ft:0}; // quadruped (hands & knees)
const BENCH=['bench',{x:28,y:128,w:96}];
const SEAT=['seat',{x:84,y:128,w:34,back:{x:76,y:128,h:50,ang:-8}}];
const A={};
const def=(k,o)=>{ A[k]=o; return o; };
// ---------- squats & lunges ----------
def('squat',{v:'s',m:'quads',props:[],hand:true,rack:'back',f:[{...ST,ua:-40,fa:170},{hx:92,hy:112,to:25,ua:-40,fa:170,th:75,sh:-20}]});
def('frontsquat',{v:'s',m:'quads',hand:true,f:[{...ST,ua:80,fa:-170},{hx:94,hy:112,to:12,ua:80,fa:-170,th:75,sh:-20}]});
def('goblet',{v:'s',m:'quads',hand:true,two:false,f:[{...ST,ua:40,fa:-150},{hx:94,hy:112,to:15,ua:40,fa:-150,th:75,sh:-20}]});
def('ohsquat',{v:'s',m:'quads',hand:true,f:[{...ST,ua:178,fa:178},{hx:94,hy:112,to:18,ua:160,fa:160,th:75,sh:-20}]});
def('bwsquat',{v:'s',m:'quads',f:[{...ST},{hx:92,hy:112,to:25,ua:90,fa:90,th:75,sh:-20}]});
def('zercher',{v:'s',m:'quads',props:[],hand:true,f:[{...ST,ua:30,fa:-170},{hx:94,hy:112,to:15,ua:30,fa:-170,th:75,sh:-20}]});
def('wallsit',{v:'s',m:'quads',mode:'hold',props:[['wall',{x:86}]],f:[{hx:100,hy:114,to:0,ua:10,fa:10,th:90,sh:0}]});
def('squathold',{v:'s',m:'quads',mode:'hold',hand:true,rack:'back',f:[{hx:92,hy:112,to:25,ua:-40,fa:170,th:75,sh:-20}]});
def('sumosquat',{v:'f',m:'quads',hand:true,two:true,f:[{...ST,th:14,sh:14},{hx:100,hy:108,th:48,sh:-34,lg:.92,ua:4,fa:4}]});
def('lunge',{v:'s',m:'quads',hand:true,two:true,f:[{...ST},{hx:104,hy:104,to:5,th:72,sh:0,th2:-45,sh2:-18,ft2:0}]});
def('splitsquat',{v:'s',m:'quads',hand:true,two:true,f:[{hx:100,hy:88,to:3,th:32,sh:-16,th2:-30,sh2:-10,ft2:0},{hx:102,hy:106,to:5,th:68,sh:-4,th2:-44,sh2:-18,ft2:0}]});
def('bulgarian',{v:'s',m:'quads',hand:true,two:true,props:[['bench',{x:14,y:128,w:50}]],f:[{hx:96,hy:86,to:5,th:28,sh:-14,th2:-62,sh2:-105,ft2:0},{hx:98,hy:106,to:10,th:66,sh:-4,th2:-80,sh2:-110,ft2:0}]});
def('stepup',{v:'s',m:'quads',hand:true,two:true,props:[['box',{x:118,y:126,w:56}]],f:[{hx:92,hy:84,th:62,sh:-5,ua:0,fa:0},{hx:140,hy:50,th:0,sh:0,th2:30,sh2:-40,ft2:40}]});
def('jumpsquat',{v:'s',m:'quads',mode:'cycle',dur:1400,f:[{hx:94,hy:110,to:25,ua:-30,fa:-30,th:72,sh:-20},{hx:100,hy:56,to:-5,ua:170,fa:170,th:0,sh:0,ft:40},{hx:94,hy:110,to:25,ua:-30,fa:-30,th:72,sh:-20}]});
def('boxjump',{v:'s',m:'quads',mode:'cycle',dur:1800,props:[['box',{x:118,y:118,w:60}]],f:[{hx:80,hy:110,to:25,ua:-30,fa:-30,th:72,sh:-20},{hx:118,hy:40,to:5,ua:120,fa:120,th:70,sh:-20,ft:60},{hx:146,hy:90,to:15,ua:60,fa:60,th:50,sh:-15},{hx:146,hy:40,th:0,sh:0}]});
def('pistol',{v:'s',m:'quads',f:[{...ST,ua:90,fa:90,th2:30,sh2:30},{hx:92,hy:118,to:30,ua:90,fa:90,th:82,sh:-25,th2:98,sh2:96,ft2:150}]});
def('hacksquat',{v:'s',m:'quads',props:[['pad',{x:66,y:30,w:8,h:110,ang:-25,post:62}]],f:[{hx:96,hy:84,to:-25,ua:-20,fa:180,th:-10,sh:-10},{hx:88,hy:112,to:-25,ua:-20,fa:180,th:70,sh:-25}]});
def('legpress',{v:'s',m:'quads',props:[['seat',{x:62,y:130,w:40,back:{x:52,y:130,h:56,ang:-40}}],['footplate',{ang:-30,anchor:[176,160]}]],f:[{hx:84,hy:124,to:-45,ua:40,fa:-130,th:148,sh:118,ft:200},{hx:84,hy:124,to:-45,ua:40,fa:-130,th:120,sh:118,ft:200}]});
// ---------- hinges ----------
def('deadlift',{v:'s',m:'hams',hand:true,f:[{hx:93,hy:104,to:62,ua:8,fa:8,th:60,sh:-14},{...ST,ua:2,fa:2}]});
def('rdl',{v:'s',m:'hams',hand:true,f:[{...ST,ua:2,fa:2},{hx:90,hy:92,to:76,ua:4,fa:4,th:16,sh:-10}]});
def('goodmorning',{v:'s',m:'hams',hand:true,rack:'back',f:[{...ST,ua:-40,fa:170},{hx:92,hy:90,to:78,ua:-40,fa:170,th:16,sh:-8}]});
def('kbswing',{v:'s',m:'glute',hand:true,f:[{hx:92,hy:96,to:68,ua:-30,fa:-30,th:34,sh:-12},{...ST,ua:90,fa:90}]});
def('hipthrust',{v:'s',m:'glute',hand:true,hip:true,props:[['bench',{x:14,y:128,w:50}]],f:[{hx:100,hy:134,to:-52,ua:30,fa:30,th:52,sh:-6},{hx:100,hy:116,to:-85,ua:40,fa:40,th:88,sh:-8}]});
def('glutebridge',{v:'s',m:'glute',hand:true,hip:true,props:[['mat',{}]],f:[{...FLR,ua:-100,fa:-100},{hx:100,hy:128,to:-118,ua:-110,fa:-110,th:98,sh:-28}]});
def('sl_glutebridge',{v:'s',m:'glute',props:[['mat',{}]],f:[{...FLR,ua:-100,fa:-100,th2:150,sh2:150},{hx:100,hy:128,to:-118,ua:-110,fa:-110,th:98,sh:-28,th2:112,sh2:112}]});
def('backext',{v:'s',m:'lowback',props:[['pad',{x:84,y:104,w:34,h:8,post:98}],['pad',{x:40,y:128,w:10,h:6}]],f:[{hx:100,hy:100,to:150,hd:-20,ua:200,fa:260,th:-90,sh:-90,ft:0},{hx:100,hy:100,to:88,hd:-10,ua:130,fa:200,th:-90,sh:-90,ft:0}]});
def('superman',{v:'s',m:'lowback',props:[['mat',{}]],f:[{...PRONE,ua:95,fa:95},{hx:100,hy:149,to:64,hd:-15,ua:120,fa:120,th:-70,sh:-72,ft:0}]});
def('sl_rdl',{v:'s',m:'hams',hand:true,two:false,f:[{...ST,ua:2,fa:2,th2:0},{hx:94,hy:86,to:85,hd:-20,ua:4,fa:4,th:6,sh:-4,th2:-92,sh2:-92,ft2:0}]});
def('rackpull',{v:'s',m:'back',hand:true,f:[{hx:96,hy:94,to:45,ua:6,fa:6,th:30,sh:-10},{...ST,ua:2,fa:2}]});
// ---------- horizontal push ----------
def('benchpress',{v:'s',m:'chest',hand:true,props:[BENCH],f:[{...LIE,ua:14,fa:180},{...LIE,ua:178,fa:178}]});
def('inclinepress',{v:'s',m:'chest_upper',hand:true,props:[['bench',{x:70,y:128,w:48,back:{x:64,y:128,h:60,ang:-45}}]],f:[{hx:100,hy:122,to:-45,ua:-28,fa:135,th:70,sh:0},{hx:100,hy:122,to:-45,ua:135,fa:135,th:70,sh:0}]});
def('declinepress',{v:'s',m:'chest_lower',hand:true,props:[['bench',{x:28,y:122,w:96,ang:12}]],f:[{hx:100,hy:106,to:-105,ua:28,fa:196,th:120,sh:30},{hx:100,hy:106,to:-105,ua:190,fa:190,th:120,sh:30}]});
def('floorpress',{v:'s',m:'chest',hand:true,props:[['mat',{}]],f:[{...FLR,ua:0,fa:180},{...FLR,ua:178,fa:178}]});
def('pushup',{v:'s',m:'chest',f:[{hx:100,hy:110,to:90,ua:0,fa:0,th:-65,sh:-60,ft:10},{hx:100,hy:128,to:90,ua:-65,fa:40,th:-62,sh:-45,ft:10}]});
def('kneepushup',{v:'s',m:'chest',f:[{hx:100,hy:122,to:88,ua:0,fa:0,th:-50,sh:-150,ft:-90},{hx:100,hy:134,to:88,ua:-70,fa:40,th:-50,sh:-150,ft:-90}]});
def('inclinepushup',{v:'s',m:'chest',props:[['box',{x:134,y:118,w:50}]],f:[{hx:100,hy:86,to:60,ua:0,fa:0,th:-20,sh:-20,ft:40},{hx:100,hy:96,to:60,ua:-55,fa:50,th:-20,sh:-20,ft:40}]});
def('declinepushup',{v:'s',m:'chest_upper',props:[['box',{x:14,y:126,w:50}]],f:[{hx:100,hy:96,to:110,ua:0,fa:0,th:-85,sh:-85,ft:0},{hx:100,hy:118,to:112,ua:-60,fa:40,th:-85,sh:-85,ft:0}]});
def('wallpushup',{v:'s',m:'chest',props:[['wall',{x:150}]],f:[{...ST,to:12,ua:90,fa:90},{...ST,to:16,ua:40,fa:120}]});
def('chestpress',{v:'s',m:'chest',props:[SEAT,['lever',{x:136,y:60}]],f:[{...SIT,to:-8,ua:50,fa:-110},{...SIT,to:-8,ua:95,fa:95}]});
def('fly',{v:'f',m:'chest',hand:true,two:true,props:[],f:[{...ST,ua:95,fa:112},{...ST,ua:40,fa:-62}]});
def('pecdeck',{v:'f',m:'chest',props:[['seat',{x:83,y:128,w:34}]],f:[{hx:100,hy:122,th:16,sh:12,lg:.6,ua:95,fa:155},{hx:100,hy:122,th:16,sh:12,lg:.6,ua:40,fa:-50}]});
def('svend',{v:'s',m:'chest',hand:true,f:[{...ST,ua:40,fa:-140},{...ST,ua:90,fa:90}]});
def('dips',{v:'s',m:'chest_lower',props:[['dipBars',{y:118}]],f:[{hx:100,hy:96,to:12,ua:-14,fa:-14,th:20,sh:-90,ft:0},{hx:100,hy:116,to:22,ua:-90,fa:16,th:20,sh:-90,ft:0}]});
def('benchdips',{v:'s',m:'triceps',props:[['bench',{x:14,y:128,w:50}]],f:[{hx:100,hy:124,to:-12,ua:-22,fa:-22,th:80,sh:0},{hx:100,hy:140,to:-12,ua:-100,fa:14,th:76,sh:-6}]});
// ---------- vertical push ----------
def('ohp',{v:'s',m:'delt_front',hand:true,f:[{...ST,ua:20,fa:-160},{...ST,ua:178,fa:178}]});
def('seatedpress',{v:'s',m:'delt_front',hand:true,props:[SEAT],f:[{...SIT,ua:20,fa:-160},{...SIT,ua:178,fa:178}]});
def('pushpress',{v:'s',m:'delt_front',hand:true,mode:'cycle',dur:1700,f:[{...ST,ua:20,fa:-160},{hx:98,hy:92,to:6,ua:20,fa:-160,th:28,sh:-10},{...ST,ua:178,fa:178},{...ST,ua:20,fa:-160}]});
def('machinepress',{v:'s',m:'delt_front',props:[SEAT,['lever',{x:146,y:40}]],f:[{...SIT,to:-6,ua:20,fa:-150},{...SIT,to:-6,ua:170,fa:170}]});
def('landmine',{v:'s',m:'delt_front',props:[['landmine',{x:26,y:158}]],f:[{...ST,to:10,ua:20,fa:-150},{...ST,to:10,ua:130,fa:130}]});
def('pikepushup',{v:'s',m:'delt_front',f:[{hx:100,hy:84,to:128,ua:14,fa:14,th:-24,sh:-16,ft:0},{hx:98,hy:96,to:136,ua:-50,fa:36,th:-26,sh:-14,ft:0}]});
def('handstandpu',{v:'s',m:'delt_front',f:[{hx:100,hy:64,to:180,ua:0,fa:0,th:180,sh:180,ft:270,sc:.78},{hx:100,hy:84,to:178,ua:-60,fa:30,th:180,sh:180,ft:270,sc:.78}]});
def('handstand',{v:'s',m:'delt',mode:'hold',f:[{hx:100,hy:64,to:180,ua:0,fa:0,th:180,sh:180,ft:270,sc:.78}]});
def('arnold',{v:'s',m:'delt_front',hand:true,two:true,f:[{...ST,ua:30,fa:-160},{...ST,ua:178,fa:178}]});
def('thruster',{v:'s',m:'quads',hand:true,mode:'cycle',dur:2200,f:[{hx:94,hy:112,to:12,ua:80,fa:-170,th:75,sh:-20},{...ST,ua:80,fa:-170},{...ST,ua:178,fa:178},{hx:94,hy:112,to:12,ua:80,fa:-170,th:75,sh:-20}]});
// ---------- vertical pull ----------
def('pullup',{v:'f',m:'lats',props:[['barHigh',{y:30}]],f:[{hx:100,hy:128,ua:172,fa:172,th:6,sh:-10,lg:.7,sc:.86},{hx:100,hy:92,ua:58,fa:170,th:6,sh:-10,lg:.7,sc:.86}]});
def('chinup',{v:'f',m:'biceps',props:[['barHigh',{y:30}]],f:[{hx:100,hy:128,ua:168,fa:168,th:6,sh:-10,lg:.7,sc:.86},{hx:100,hy:92,ua:30,fa:160,th:6,sh:-10,lg:.7,sc:.86}]});
def('deadhang',{v:'f',m:'lats',mode:'hold',props:[['barHigh',{y:30}]],f:[{hx:100,hy:128,ua:172,fa:172,th:6,sh:-10,lg:.7,sc:.86}]});
def('hang_flexed',{v:'f',m:'biceps',mode:'hold',props:[['barHigh',{y:30}]],f:[{hx:100,hy:92,ua:30,fa:160,th:6,sh:-10,lg:.7,sc:.86}]});
def('latpulldown',{v:'f',m:'lats',props:[['seat',{x:83,y:128,w:34}],['cable',{x:100,y:8,top:4,bottom:22,both:false}]],f:[{hx:100,hy:122,th:16,sh:12,lg:.6,ua:150,fa:168,al:.95},{hx:100,hy:122,th:16,sh:12,lg:.6,ua:55,fa:160}]});
def('straightarm_pd',{v:'s',m:'lats',props:[['cable',{x:168,y:14,top:6}]],f:[{...ST,to:15,ua:150,fa:150},{...ST,to:15,ua:10,fa:10}]});
def('pullover',{v:'s',m:'lats',hand:true,props:[BENCH],f:[{...LIE,ua:170,fa:170},{...LIE,ua:-95,fa:-95}]});
def('hangingkneeraise',{v:'s',m:'abs',props:[['barHigh',{y:26}]],f:[{hx:100,hy:120,to:0,ua:178,fa:178,th:4,sh:0,ft:60,sc:.86},{hx:100,hy:120,to:-12,ua:178,fa:178,th:100,sh:10,ft:60,sc:.86}]});
def('hanginglegraise',{v:'s',m:'abs',props:[['barHigh',{y:26}]],f:[{hx:100,hy:120,to:0,ua:178,fa:178,th:4,sh:4,ft:60,sc:.86},{hx:100,hy:120,to:-14,ua:178,fa:178,th:100,sh:100,ft:60,sc:.86}]});
def('toestobar',{v:'s',m:'abs',props:[['barHigh',{y:26}]],f:[{hx:100,hy:120,to:0,ua:178,fa:178,th:4,sh:4,ft:60,sc:.86},{hx:104,hy:112,to:-40,ua:160,fa:160,th:150,sh:150,ft:60,sc:.86}]});
def('muscleup',{v:'f',m:'lats',mode:'cycle',dur:2600,props:[['barHigh',{y:30}]],f:[{hx:100,hy:128,ua:172,fa:172,th:6,sh:-10,lg:.7,sc:.86},{hx:100,hy:92,ua:58,fa:170,th:6,sh:-10,lg:.7,sc:.86},{hx:100,hy:62,ua:10,fa:10,th:6,sh:-10,lg:.7,sc:.86},{hx:100,hy:128,ua:172,fa:172,th:6,sh:-10,lg:.7,sc:.86}]});
def('frontlever',{v:'s',m:'lats',mode:'hold',props:[['barHigh',{y:30}]],f:[{hx:134,hy:86,to:-90,ua:-98,fa:-98,th:90,sh:90,ft:120,sc:.8}]});
def('backlever',{v:'s',m:'lats',mode:'hold',props:[['barHigh',{y:30}]],f:[{hx:66,hy:86,to:90,ua:98,fa:98,th:-90,sh:-90,ft:0,sc:.8}]});
def('scappull',{v:'f',m:'back_upper',props:[['barHigh',{y:30}]],f:[{hx:100,hy:128,ua:172,fa:172,th:6,sh:-10,lg:.7,sc:.86},{hx:100,hy:122,ua:172,fa:172,th:6,sh:-10,lg:.7,sc:.86,sho:3}]});
// ---------- horizontal pull ----------
def('row',{v:'s',m:'lats',hand:true,f:[{...BENT,ua:4,fa:4},{...BENT,ua:-62,fa:30}]});
def('dbrow',{v:'s',m:'lats',hand:true,two:false,props:[['bench',{x:112,y:124,w:60}]],f:[{hx:92,hy:96,to:72,ua:4,fa:4,ua2:30,fa2:30,th:18,sh:-10,th2:70,sh2:-110,ft2:-90},{hx:92,hy:96,to:72,ua:-66,fa:28,ua2:30,fa2:30,th:18,sh:-10,th2:70,sh2:-110,ft2:-90}]});
def('seatedrow',{v:'s',m:'back_upper',props:[['cable',{x:178,y:126,top:100}],['pad',{x:60,y:131,w:40,h:5}]],f:[{hx:88,hy:126,to:18,ua:88,fa:88,th:80,sh:38},{hx:88,hy:126,to:-6,ua:-38,fa:62,th:80,sh:38}]});
def('cs_row',{v:'s',m:'back_upper',hand:true,two:true,props:[['pad',{x:64,y:96,w:8,h:70,ang:-40,post:118}]],f:[{hx:86,hy:120,to:44,ua:0,fa:0,th:-18,sh:-6},{hx:86,hy:120,to:44,ua:-72,fa:38,th:-18,sh:-6}]});
def('tbarrow',{v:'s',m:'lats',props:[['landmine',{x:150,y:158}]],f:[{...BENT,ua:4,fa:4},{...BENT,ua:-62,fa:30}]});
def('invertedrow',{v:'s',m:'back_upper',props:[['barHigh',{y:88}]],f:[{hx:100,hy:138,to:-82,ua:178,fa:178,th:84,sh:84,ft:120},{hx:100,hy:120,to:-80,ua:-92,fa:150,th:84,sh:84,ft:120}]});
def('facepull',{v:'s',m:'delt_rear',props:[['cable',{x:174,y:70,top:6}]],f:[{...ST,ua:88,fa:88},{...ST,ua:80,fa:-130}]});
def('shrug',{v:'s',m:'back_upper',hand:true,dur:1800,f:[{...ST,ua:2,fa:2},{...ST,ua:2,fa:2,sho:6}]});
def('uprightrow',{v:'f',m:'delt_side',hand:true,two:true,f:[{...ST,ua:6,fa:6},{...ST,ua:96,fa:-28}]});
def('reardeltfly',{v:'s',m:'delt_rear',hand:true,two:true,f:[{...BENT,ua:4,fa:4},{...BENT,ua:-70,fa:-70}]});
def('reverseflyM',{v:'f',m:'delt_rear',props:[['seat',{x:83,y:128,w:34}]],f:[{hx:100,hy:122,th:16,sh:12,lg:.6,ua:60,fa:-40},{hx:100,hy:122,th:16,sh:12,lg:.6,ua:96,fa:110}]});
def('bandpullapart',{v:'f',m:'delt_rear',f:[{...ST,ua:70,fa:-50},{...ST,ua:92,fa:98}]});
def('renegade',{v:'s',m:'back_upper',hand:true,f:[{hx:100,hy:110,to:90,ua:0,fa:0,th:-65,sh:-60,ft:10},{hx:100,hy:110,to:90,ua:-60,fa:50,ua2:0,fa2:0,th:-65,sh:-60,ft:10}]});
// ---------- arms ----------
def('curl',{v:'s',m:'biceps',hand:true,two:true,f:[{...ST,ua:2,fa:2},{...ST,ua:8,fa:160}]});
def('preacher',{v:'s',m:'biceps',hand:true,two:true,props:[['pad',{x:112,y:96,w:8,h:34,ang:-30,post:140}],SEAT],f:[{...SIT,to:8,ua:60,fa:62},{...SIT,to:8,ua:60,fa:166}]});
def('concentration',{v:'s',m:'biceps',hand:true,two:false,props:[SEAT],f:[{...SIT,to:36,ua:54,fa:54},{...SIT,to:36,ua:54,fa:165}]});
def('spidercurl',{v:'s',m:'biceps',hand:true,two:true,props:[['pad',{x:64,y:96,w:8,h:70,ang:-40,post:118}]],f:[{hx:86,hy:120,to:44,ua:0,fa:0,th:-18,sh:-6},{hx:86,hy:120,to:44,ua:0,fa:150,th:-18,sh:-6}]});
def('inclinecurl',{v:'s',m:'biceps',hand:true,two:true,props:[['bench',{x:70,y:128,w:48,back:{x:64,y:128,h:60,ang:-45}}]],f:[{hx:100,hy:122,to:-45,ua:-40,fa:-40,th:70,sh:0},{hx:100,hy:122,to:-45,ua:-36,fa:120,th:70,sh:0}]});
def('cablecurl',{v:'s',m:'biceps',props:[['cable',{x:168,y:150,top:40}]],f:[{...ST,ua:12,fa:12},{...ST,ua:14,fa:160}]});
def('pushdown',{v:'s',m:'triceps',props:[['cable',{x:164,y:14,top:6}]],f:[{...ST,to:4,ua:6,fa:92},{...ST,to:4,ua:6,fa:4}]});
def('overheadext',{v:'s',m:'triceps',hand:true,f:[{...ST,ua:176,fa:-36},{...ST,ua:176,fa:176}]});
def('cable_ohext',{v:'s',m:'triceps',props:[['cable',{x:30,y:60,top:6}]],f:[{...ST,to:20,ua:170,fa:-40},{...ST,to:20,ua:170,fa:170}]});
def('skullcrusher',{v:'s',m:'triceps',hand:true,props:[BENCH],f:[{...LIE,ua:178,fa:-100},{...LIE,ua:178,fa:178}]});
def('kickback',{v:'s',m:'triceps',hand:true,two:false,f:[{...BENT,ua:-72,fa:0},{...BENT,ua:-72,fa:-74}]});
def('cablekickback',{v:'s',m:'triceps',props:[['cable',{x:172,y:150,top:40}]],f:[{...BENT,ua:-72,fa:0},{...BENT,ua:-72,fa:-74}]});
def('closegrip',{v:'s',m:'triceps',hand:true,props:[BENCH],f:[{...LIE,ua:4,fa:180},{...LIE,ua:178,fa:178}]});
def('tricepM',{v:'s',m:'triceps',props:[SEAT,['lever',{x:146,y:96}]],f:[{...SIT,ua:60,fa:-120},{...SIT,ua:70,fa:70}]});
def('wristcurl',{v:'s',m:'forearm',hand:true,two:true,props:[SEAT],dur:1600,f:[{...SIT,to:20,ua:60,fa:92},{...SIT,to:20,ua:60,fa:70}]});
def('farmers',{v:'s',m:'forearm',hand:true,two:true,mode:'cycle',dur:1400,f:[{...ST,hy:83,ua:2,fa:2,th:22,sh:10,th2:-20,sh2:-30},{...ST,hy:81,ua:2,fa:2,th:0,sh:0,th2:0,sh2:-20,ft2:60},{...ST,hy:83,ua:2,fa:2,th:-20,sh:-30,th2:22,sh2:10},{...ST,hy:81,ua:2,fa:2,th:0,sh:-20,ft:60,th2:0,sh2:0}]});
def('suitcase',{v:'s',m:'core',hand:true,two:false,mode:'cycle',dur:1400,f:[{...ST,hy:83,ua:2,fa:2,ua2:20,fa2:20,th:22,sh:10,th2:-20,sh2:-30},{...ST,hy:81,ua:2,fa:2,ua2:-10,fa2:-10,th:0,sh:0,th2:0,sh2:-20,ft2:60},{...ST,hy:83,ua:2,fa:2,ua2:-20,fa2:-20,th:-20,sh:-30,th2:22,sh2:10},{...ST,hy:81,ua:2,fa:2,ua2:10,fa2:10,th:0,sh:-20,ft:60,th2:0,sh2:0}]});
def('ohcarry',{v:'s',m:'delt',hand:true,two:false,mode:'cycle',dur:1400,f:[{...ST,hy:83,ua:178,fa:178,ua2:20,fa2:20,th:22,sh:10,th2:-20,sh2:-30},{...ST,hy:81,ua:178,fa:178,ua2:-10,fa2:-10,th:0,sh:0,th2:0,sh2:-20,ft2:60},{...ST,hy:83,ua:178,fa:178,ua2:-20,fa2:-20,th:-20,sh:-30,th2:22,sh2:10},{...ST,hy:81,ua:178,fa:178,ua2:10,fa2:10,th:0,sh:-20,ft:60,th2:0,sh2:0}]});
def('rackcarry',{v:'s',m:'core',hand:true,two:true,mode:'cycle',dur:1400,f:[{...ST,hy:83,ua:30,fa:-160,th:22,sh:10,th2:-20,sh2:-30},{...ST,hy:81,ua:30,fa:-160,th:0,sh:0,th2:0,sh2:-20,ft2:60},{...ST,hy:83,ua:30,fa:-160,th:-20,sh:-30,th2:22,sh2:10},{...ST,hy:81,ua:30,fa:-160,th:0,sh:-20,ft:60,th2:0,sh2:0}]});
def('wristroller',{v:'s',m:'forearm',props:[['bar',{}]],dur:1600,f:[{...ST,ua:88,fa:88},{...ST,ua:88,fa:92}]});
// ---------- shoulders ----------
def('lateralraise',{v:'f',m:'delt_side',hand:true,two:true,f:[{...ST,ua:8,fa:8},{...ST,ua:88,fa:92}]});
def('frontraise',{v:'s',m:'delt_front',hand:true,two:true,f:[{...ST,ua:4,fa:4},{...ST,ua:92,fa:92}]});
def('lateralM',{v:'f',m:'delt_side',props:[['seat',{x:83,y:128,w:34}]],f:[{hx:100,hy:122,th:16,sh:12,lg:.6,ua:12,fa:-70},{hx:100,hy:122,th:16,sh:12,lg:.6,ua:88,fa:0}]});
def('halo',{v:'f',m:'delt',hand:true,two:false,mode:'cycle',dur:2200,f:[{...ST,ua:40,fa:-150},{...ST,ua:120,fa:-170},{...ST,ua:175,fa:140,ua2:175,fa2:-140},{...ST,ua:40,fa:-150}]});
def('windmill',{v:'f',m:'obliques',hand:true,two:false,f:[{...ST,ua:176,fa:176,ua2:6,fa2:6,th:20,sh:20},{...ST,to:-40,ua:176,fa:176,ua2:0,fa2:0,th:20,sh:20}]});
def('tgu',{v:'s',m:'delt',hand:true,two:false,mode:'cycle',dur:3200,f:[{...FLR,ua:178,fa:178,th2:90,sh2:90},{hx:100,hy:146,to:-45,ua:178,fa:178,ua2:-60,fa2:-60,th:135,sh:-12,th2:90,sh2:90},{hx:100,hy:118,to:-10,ua:178,fa:178,ua2:-20,fa2:-20,th:80,sh:0,th2:-40,sh2:-120,ft2:0},{...ST,ua:178,fa:178}]});
def('bottomsup',{v:'s',m:'delt',mode:'hold',hand:true,two:false,f:[{...ST,ua:20,fa:-176}]});
def('ohhold',{v:'s',m:'delt',mode:'hold',hand:true,f:[{...ST,ua:178,fa:178}]});
def('rackhold',{v:'s',m:'core',mode:'hold',hand:true,two:true,f:[{...ST,ua:30,fa:-160}]});
def('isoneck',{v:'f',m:'back_upper',dur:1800,f:[{...ST,ua:120,fa:-178,hd:0},{...ST,ua:120,fa:-178,hd:-14}]});
def('chintuck',{v:'s',m:'back_upper',dur:1800,f:[{...ST,hd:12},{...ST,hd:-10}]});
// ---------- core ----------
def('plank',{v:'s',m:'core',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:127,to:90,ua:10,fa:90,th:-70,sh:-60,ft:10}]});
def('highplank',{v:'s',m:'core',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:110,to:90,ua:0,fa:0,th:-65,sh:-60,ft:10}]});
def('sideplank',{v:'f',m:'obliques',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:134,to:-72,ua:150,fa:150,ua2:-70,fa2:-15,th:0,sh:0,lg:1,al:1}]});
def('crunch',{v:'s',m:'abs',props:[['mat',{}]],f:[{...FLR,ua:-90,fa:-170},{...FLR,to:-58,ua:-70,fa:-150}]});
def('situp',{v:'s',m:'abs',props:[['mat',{}]],f:[{...FLR,ua:-90,fa:-170},{...FLR,to:-15,ua:-10,fa:-100}]});
def('legraise',{v:'s',m:'abs',props:[['mat',{}]],f:[{hx:100,hy:152,to:-90,ua:90,fa:90,th:92,sh:92,ft:120},{hx:100,hy:152,to:-90,ua:90,fa:90,th:170,sh:170,ft:200}]});
def('reversecrunch',{v:'s',m:'abs',props:[['mat',{}]],f:[{hx:100,hy:152,to:-90,ua:90,fa:90,th:135,sh:40,ft:100},{hx:100,hy:144,to:-100,ua:90,fa:90,th:190,sh:80,ft:120}]});
def('bicyclecrunch',{v:'s',m:'obliques',mode:'cycle',dur:1600,props:[['mat',{}]],f:[{...FLR,to:-62,ua:-70,fa:-150,th:160,sh:60,th2:100,sh2:100},{...FLR,to:-62,ua:-70,fa:-150,th:100,sh:100,th2:160,sh2:60}]});
def('flutter',{v:'s',m:'hipflex',mode:'cycle',dur:900,props:[['mat',{}]],f:[{hx:100,hy:152,to:-90,ua:90,fa:90,th:110,sh:110,th2:96,sh2:96},{hx:100,hy:152,to:-90,ua:90,fa:90,th:96,sh:96,th2:110,sh2:110}]});
def('hollow',{v:'s',m:'abs',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:150,to:-72,ua:-100,fa:-100,th:106,sh:106,ft:130}]});
def('deadbug',{v:'s',m:'core_deep',props:[['mat',{}]],f:[{hx:100,hy:152,to:-90,ua:178,fa:178,th:170,sh:80,ft:110},{hx:100,hy:152,to:-90,ua:178,fa:178,ua2:-100,fa2:-100,th:170,sh:80,th2:112,sh2:112,ft:110}]});
def('mountainclimber',{v:'s',m:'core',mode:'cycle',dur:900,f:[{hx:100,hy:110,to:88,ua:0,fa:0,th:-65,sh:-60,ft:10,th2:30,sh2:-40},{hx:100,hy:110,to:88,ua:0,fa:0,th:30,sh:-40,th2:-65,sh2:-60,ft2:10}]});
def('birddog',{v:'s',m:'lowback',f:[{...Q,th2:0,sh2:-90},{...Q,ua:92,fa:92,th2:-90,sh2:-90,ft2:0}]});
def('abwheel',{v:'s',m:'abs',props:[['wheel',{}]],f:[{hx:100,hy:122,to:10,ua:60,fa:60,th:0,sh:-90,ft:0},{hx:112,hy:118,to:64,ua:100,fa:100,th:-14,sh:-90,ft:0}]});
def('cablecrunch',{v:'s',m:'abs',props:[['cable',{x:160,y:14,top:6}]],f:[{hx:100,hy:122,to:4,ua:80,fa:-170,th:0,sh:-90,ft:0},{hx:100,hy:122,to:56,ua:60,fa:-150,th:0,sh:-90,ft:0}]});
def('russiantwist',{v:'f',m:'obliques',mode:'cycle',dur:1600,props:[['mat',{}]],f:[{hx:100,hy:136,to:-14,ua:40,fa:-80,ua2:85,fa2:-10,th:22,sh:-10,lg:.5},{hx:100,hy:136,to:14,ua:85,fa:-10,ua2:40,fa2:-80,th:22,sh:-10,lg:.5}]});
def('pallof',{v:'s',m:'obliques',props:[['cable',{x:174,y:92,top:6}]],f:[{...ST,ua:40,fa:-140},{...ST,ua:90,fa:90}]});
def('sidebend',{v:'f',m:'obliques',hand:true,two:false,f:[{...ST,ua:4,fa:4,ua2:4,fa2:4},{...ST,to:22,ua:4,fa:4,ua2:4,fa2:4}]});
def('woodchop',{v:'s',m:'obliques',props:[['cable',{x:172,y:30,top:6}]],f:[{...ST,to:-6,ua:150,fa:150},{...ST,to:30,ua:40,fa:40,th:20,sh:-8}]});
def('vup',{v:'s',m:'abs',props:[['mat',{}]],f:[{hx:100,hy:152,to:-90,ua:-100,fa:-100,th:92,sh:92},{hx:100,hy:146,to:-40,ua:130,fa:130,th:130,sh:130}]});
def('lsit',{v:'s',m:'abs',mode:'hold',props:[['dipBars',{y:124}]],f:[{hx:100,hy:92,to:-2,ua:6,fa:6,th:90,sh:90,ft:120}]});
def('dragonflag',{v:'s',m:'abs',props:[BENCH],f:[{hx:72,hy:84,to:-180,ua:-100,fa:-100,th:180,sh:180,ft:270},{hx:106,hy:118,to:-110,ua:-120,fa:-120,th:110,sh:110,ft:200}]});
def('sixinch',{v:'s',m:'abs',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:152,to:-90,ua:90,fa:90,th:106,sh:106,ft:130}]});
def('medballslam',{v:'s',m:'core',hand:true,mode:'cycle',dur:1500,f:[{...ST,ua:176,fa:176},{hx:96,hy:106,to:40,ua:20,fa:20,th:50,sh:-15},{...ST,ua:176,fa:176}]});
def('medballthrow',{v:'s',m:'obliques',hand:true,f:[{...ST,to:-10,ua:-40,fa:-40},{...ST,to:25,ua:100,fa:100,th:15,sh:-5}]});
def('wallball',{v:'s',m:'quads',hand:true,mode:'cycle',dur:1700,props:[['wall',{x:170}]],f:[{hx:94,hy:112,to:12,ua:40,fa:-150,th:75,sh:-20},{...ST,ua:150,fa:150},{hx:94,hy:112,to:12,ua:40,fa:-150,th:75,sh:-20}]});
// ---------- leg machines & calves ----------
def('legext',{v:'s',m:'quads',props:[SEAT,['lever',{x:120,y:124,at:'foot'}]],f:[{...SIT,to:-10,ua:20,fa:20},{...SIT,to:-10,ua:20,fa:20,sh:84}]});
def('legcurl_seated',{v:'s',m:'hams',props:[SEAT,['lever',{x:120,y:124,at:'foot'}]],f:[{...SIT,to:-10,ua:20,fa:20,sh:84},{...SIT,to:-10,ua:20,fa:20,sh:0}]});
def('legcurl_lying',{v:'s',m:'hams',props:[['bench',{x:28,y:128,w:96}],['lever',{x:40,y:138,at:'foot'}]],f:[{hx:100,hy:120,to:90,ua:-40,fa:40,th:-90,sh:-90,ft:0},{hx:100,hy:120,to:90,ua:-40,fa:40,th:-90,sh:175,ft:270}]});
def('nordic',{v:'s',m:'hams',props:[['pad',{x:40,y:150,w:30,h:6}]],f:[{hx:100,hy:122,to:0,ua:4,fa:4,th:0,sh:-90,ft:0},{hx:124,hy:131,to:40,ua:100,fa:100,th:-40,sh:-90,ft:0}]});
def('reversenordic',{v:'s',m:'quads',f:[{hx:100,hy:122,to:0,ua:4,fa:4,th:0,sh:-90,ft:0},{hx:84,hy:128,to:-35,ua:-20,fa:-20,th:30,sh:-90,ft:0}]});
def('calfraise',{v:'s',m:'calves',hand:true,two:true,dur:1700,f:[{...ST,ua:2,fa:2,ft:90},{...ST,hy:75,ua:2,fa:2,ft:56}]});
def('seatedcalf',{v:'s',m:'calves',props:[SEAT,['pad',{x:128,y:108,w:14,h:6}]],dur:1600,f:[{...SIT,ua:40,fa:-100,ft:90},{...SIT,hy:118,th:80,sh:0,ua:40,fa:-100,ft:56}]});
def('donkeycalf',{v:'s',m:'calves',props:[['pad',{x:128,y:98,w:30,h:6,post:150}]],dur:1700,f:[{hx:94,hy:84,to:80,ua:10,fa:10,ft:90},{hx:94,hy:77,to:80,ua:10,fa:10,ft:56}]});
def('tibraise',{v:'s',m:'calves',props:[['wall',{x:80}]],dur:1500,f:[{...ST,to:-6,ft:90},{...ST,to:-6,ft:60}]});
def('hipabd',{v:'f',m:'glute_med',props:[['seat',{x:83,y:128,w:34}]],f:[{hx:100,hy:122,th:8,sh:8,lg:.6},{hx:100,hy:122,th:40,sh:30,lg:.6}]});
def('hipadd',{v:'f',m:'adductors',props:[['seat',{x:83,y:128,w:34}]],f:[{hx:100,hy:122,th:40,sh:30,lg:.6},{hx:100,hy:122,th:8,sh:8,lg:.6}]});
def('clamshell',{v:'s',m:'glute_med',props:[['mat',{}]],f:[{hx:100,hy:146,to:-90,ua:-120,fa:-170,th:120,sh:-20},{hx:100,hy:146,to:-90,ua:-120,fa:-170,th:120,sh:-20,th2:90,sh2:-50}]});
def('sidelying_abd',{v:'s',m:'glute_med',props:[['mat',{}]],f:[{hx:100,hy:150,to:-90,ua:-120,fa:-170,th:92,sh:92,th2:92,sh2:92},{hx:100,hy:150,to:-90,ua:-120,fa:-170,th:92,sh:92,th2:130,sh2:130}]});
def('firehydrant',{v:'f',m:'glute_med',f:[{hx:100,hy:120,to:0,ua:40,fa:40,al:1.1,th:10,sh:-80,lg:.6},{hx:100,hy:120,to:0,ua:40,fa:40,al:1.1,th:60,sh:-50,lg:.6}]});
def('glutekickback',{v:'s',m:'glute_max',f:[{...Q,th2:0,sh2:-90},{...Q,th2:-80,sh2:-100,ft2:0}]});
def('cablekickback_glute',{v:'s',m:'glute_max',props:[['cable',{x:170,y:150,top:40}]],f:[{...ST,to:20,ua:70,fa:70,th2:10,sh2:0},{...ST,to:25,ua:70,fa:70,th2:-45,sh2:-45,ft2:30}]});
def('cablepullthrough',{v:'s',m:'glute_max',props:[['cable',{x:30,y:150,top:40}]],f:[{hx:92,hy:94,to:70,ua:-40,fa:-40,th:34,sh:-12},{...ST,ua:4,fa:4}]});
def('lateralwalk',{v:'f',m:'glute_med',mode:'cycle',dur:1400,f:[{hx:100,hy:94,th:20,sh:4,th2:20,sh2:4,lg:.92,ua:30,fa:-120},{hx:100,hy:94,th:44,sh:4,th2:20,sh2:4,lg:.92,ua:30,fa:-120},{hx:100,hy:94,th:20,sh:4,th2:20,sh2:4,lg:.92,ua:30,fa:-120}]});
def('standing_abd',{v:'f',m:'glute_med',props:[],f:[{...ST,th:4,sh:4},{...ST,th:4,sh:4,th2:40,sh2:40,to:-5}]});
def('copenhagen',{v:'s',m:'adductors',mode:'hold',props:[['bench',{x:112,y:122,w:60}]],f:[{hx:90,hy:128,to:-80,ua:-80,fa:-170,th:84,sh:84,th2:104,sh2:104}]});
def('sled',{v:'s',m:'quads',mode:'cycle',dur:1200,props:[['sled',{}]],f:[{hx:92,hy:96,to:48,ua:86,fa:86,th:40,sh:-10,th2:-40,sh2:-30,ft2:30},{hx:92,hy:96,to:48,ua:86,fa:86,th:-40,sh:-30,ft:30,th2:40,sh2:-10,ft2:90}]});
// ---------- cardio & cycles ----------
def('walk',{v:'s',m:null,mode:'cycle',dur:1300,f:[{...ST,hy:83,ua:22,fa:22,ua2:-20,fa2:-10,th:22,sh:10,th2:-20,sh2:-30},{...ST,hy:81,ua:0,fa:0,ua2:0,fa2:0,th:0,sh:0,th2:0,sh2:-20,ft2:60},{...ST,hy:83,ua:-20,fa:-10,ua2:22,fa2:22,th:-20,sh:-30,th2:22,sh2:10},{...ST,hy:81,ua:0,fa:0,th:0,sh:-20,ft:60,th2:0,sh2:0}]});
def('run',{v:'s',m:null,mode:'cycle',dur:800,f:[{hx:100,hy:80,to:10,ua:40,fa:120,ua2:-50,fa2:20,th:50,sh:-20,th2:-40,sh2:-110,ft2:0},{hx:100,hy:76,to:10,ua:0,fa:80,ua2:0,fa2:80,th:10,sh:0,th2:-10,sh2:-70,ft2:20},{hx:100,hy:80,to:10,ua:-50,fa:20,ua2:40,fa2:120,th:-40,sh:-110,ft:0,th2:50,sh2:-20,ft2:90},{hx:100,hy:76,to:10,ua:0,fa:80,ua2:0,fa2:80,th:-10,sh:-70,ft:20,th2:10,sh2:0,ft2:90}]});
def('highknees',{v:'s',m:'hipflex',mode:'cycle',dur:700,f:[{...ST,hy:80,to:5,ua:30,fa:110,ua2:-30,fa2:60,th:95,sh:0},{...ST,hy:80,to:5,ua:-30,fa:60,ua2:30,fa2:110,th:0,sh:0,th2:95,sh2:0}]});
def('buttkicks',{v:'s',m:'hams',mode:'cycle',dur:700,f:[{...ST,hy:80,to:5,ua:30,fa:110,ua2:-30,fa2:60,th:-10,sh:-160},{...ST,hy:80,to:5,ua:-30,fa:60,ua2:30,fa2:110,th:0,sh:0,th2:-10,sh2:-160}]});
def('jumpingjacks',{v:'f',m:null,mode:'cycle',dur:1000,f:[{...ST,ua:6,fa:6,th:4,sh:4},{...ST,hy:78,ua:168,fa:168,th:26,sh:26}]});
def('burpee',{v:'s',m:null,mode:'cycle',dur:2600,f:[{...ST},{hx:96,hy:118,to:60,ua:60,fa:60,th:80,sh:-25},{hx:100,hy:110,to:90,ua:0,fa:0,th:-65,sh:-60,ft:10},{hx:96,hy:118,to:60,ua:60,fa:60,th:80,sh:-25},{hx:100,hy:60,to:-4,ua:170,fa:170,th:0,sh:0,ft:40},{...ST}]});
def('jumprope',{v:'s',m:'calves',mode:'cycle',dur:620,props:[['jumprope',{}]],f:[{...ST,hy:82,ua:20,fa:95,ft:90},{...ST,hy:72,ua:20,fa:95,ft:60}]});
def('cycling',{v:'s',m:'quads',mode:'cycle',dur:1200,props:[['bike',{}]],f:[{hx:92,hy:98,to:30,ua:70,fa:70,th:68,sh:-10,th2:20,sh2:40},{hx:92,hy:98,to:30,ua:70,fa:70,th:40,sh:30,th2:40,sh2:-30},{hx:92,hy:98,to:30,ua:70,fa:70,th:20,sh:40,th2:68,sh2:-10},{hx:92,hy:98,to:30,ua:70,fa:70,th:40,sh:-30,th2:40,sh2:30}]});
def('rowing',{v:'s',m:'back',mode:'cycle',dur:2000,props:[['rower',{}]],f:[{hx:84,hy:138,to:22,ua:86,fa:86,th:98,sh:36,ft:120},{hx:70,hy:138,to:-14,ua:-40,fa:60,th:84,sh:70,ft:120},{hx:84,hy:138,to:22,ua:86,fa:86,th:98,sh:36,ft:120}]});
def('elliptical',{v:'s',m:null,mode:'cycle',dur:1300,f:[{...ST,hy:84,ua:60,fa:60,ua2:20,fa2:20,th:22,sh:10,th2:-20,sh2:-30},{...ST,hy:84,ua:20,fa:20,ua2:60,fa2:60,th:-20,sh:-30,th2:22,sh2:10}]});
def('stairs',{v:'s',m:'glute_max',mode:'cycle',dur:1400,props:[['stairs',{}]],f:[{hx:96,hy:92,to:8,ua:20,fa:20,ua2:-20,fa2:-20,th:62,sh:-10,th2:-20,sh2:-20,ft2:30},{hx:104,hy:80,to:8,ua:-20,fa:-20,ua2:20,fa2:20,th:0,sh:0,th2:30,sh2:-60,ft2:60}]});
def('battlerope',{v:'s',m:'delt',mode:'cycle',dur:700,props:[['rope',{x:184,y:150}]],f:[{hx:96,hy:96,to:20,ua:100,fa:110,ua2:30,fa2:70,th:40,sh:-10},{hx:96,hy:96,to:20,ua:30,fa:70,ua2:100,fa2:110,th:40,sh:-10}]});
def('bearcrawl',{v:'s',m:'core',mode:'cycle',dur:1000,f:[{hx:100,hy:104,to:96,ua:20,fa:20,ua2:-20,fa2:-20,th:-20,sh:-100,ft:0,th2:20,sh2:-80,ft2:0},{hx:100,hy:104,to:96,ua:-20,fa:-20,ua2:20,fa2:20,th:20,sh:-80,ft:0,th2:-20,sh2:-100,ft2:0}]});
def('boxing',{v:'s',m:'delt',mode:'cycle',dur:800,f:[{...ST,to:6,ua:40,fa:-140,ua2:30,fa2:-130,th:20,sh:0,th2:-15,sh2:-10},{...ST,to:12,ua:92,fa:92,ua2:30,fa2:-130,th:20,sh:0,th2:-15,sh2:-10},{...ST,to:6,ua:40,fa:-140,ua2:30,fa2:-130,th:20,sh:0,th2:-15,sh2:-10},{...ST,to:12,ua:40,fa:-140,ua2:92,fa2:92,th:20,sh:0,th2:-15,sh2:-10}]});
def('swim',{v:'s',m:'lats',mode:'cycle',dur:1500,f:[{hx:100,hy:120,to:88,ua:100,fa:100,ua2:-80,fa2:-80,th:-85,sh:-85,ft:-20},{hx:100,hy:120,to:88,ua:170,fa:170,ua2:-20,fa2:-20,th:-85,sh:-85,ft:-20},{hx:100,hy:120,to:88,ua:-80,fa:-80,ua2:100,fa2:100,th:-85,sh:-85,ft:-20},{hx:100,hy:120,to:88,ua:-20,fa:-20,ua2:170,fa2:170,th:-85,sh:-85,ft:-20}]});
def('inchworm',{v:'s',m:'core',mode:'cycle',dur:2600,f:[{...ST},{hx:96,hy:86,to:130,ua:10,fa:10,th:-10,sh:-8},{hx:100,hy:110,to:90,ua:0,fa:0,th:-65,sh:-60,ft:10},{hx:96,hy:86,to:130,ua:10,fa:10,th:-10,sh:-8},{...ST}]});
def('legswing',{v:'s',m:'hipflex',mode:'cycle',dur:1400,props:[['wall',{x:30}]],f:[{...ST,ua:-80,fa:-80,th2:-40,sh2:-40,ft2:30},{...ST,ua:-80,fa:-80,th2:70,sh2:70,ft2:120},{...ST,ua:-80,fa:-80,th2:-40,sh2:-40,ft2:30}]});
// ---------- olympic ----------
def('clean',{v:'s',m:'glute',hand:true,mode:'cycle',dur:2400,f:[{hx:93,hy:104,to:62,ua:8,fa:8,th:60,sh:-14},{...ST,hy:78,ua:0,fa:0,sho:5,ft:60},{hx:94,hy:112,to:12,ua:80,fa:-170,th:75,sh:-20},{...ST,ua:80,fa:-170},{hx:93,hy:104,to:62,ua:8,fa:8,th:60,sh:-14}]});
def('hangclean',{v:'s',m:'glute',hand:true,mode:'cycle',dur:2000,f:[{hx:92,hy:92,to:60,ua:4,fa:4,th:20,sh:-10},{...ST,hy:78,ua:0,fa:0,sho:5,ft:60},{hx:96,hy:100,to:8,ua:80,fa:-170,th:45,sh:-12},{...ST,ua:80,fa:-170},{hx:92,hy:92,to:60,ua:4,fa:4,th:20,sh:-10}]});
def('snatch',{v:'s',m:'glute',hand:true,mode:'cycle',dur:2600,f:[{hx:93,hy:104,to:62,ua:8,fa:8,th:60,sh:-14},{...ST,hy:78,ua:0,fa:0,sho:5,ft:60},{hx:94,hy:112,to:18,ua:160,fa:160,th:75,sh:-20},{...ST,ua:178,fa:178},{hx:93,hy:104,to:62,ua:8,fa:8,th:60,sh:-14}]});
def('jerk',{v:'s',m:'delt',hand:true,mode:'cycle',dur:2000,f:[{...ST,ua:80,fa:-170},{hx:98,hy:92,to:6,ua:80,fa:-170,th:28,sh:-10},{hx:100,hy:94,to:4,ua:178,fa:178,th:50,sh:0,th2:-40,sh2:-20,ft2:40},{...ST,ua:178,fa:178},{...ST,ua:80,fa:-170}]});
def('kbsnatch',{v:'s',m:'glute',hand:true,two:false,mode:'cycle',dur:1700,f:[{hx:92,hy:96,to:68,ua:-30,fa:-30,ua2:-10,fa2:-10,th:34,sh:-12},{...ST,ua:178,fa:178,ua2:10,fa2:10},{hx:92,hy:96,to:68,ua:-30,fa:-30,ua2:-10,fa2:-10,th:34,sh:-12}]});
def('kbclean',{v:'s',m:'glute',hand:true,two:false,mode:'cycle',dur:1600,f:[{hx:92,hy:96,to:68,ua:-30,fa:-30,ua2:-10,fa2:-10,th:34,sh:-12},{...ST,ua:30,fa:-160,ua2:10,fa2:10},{hx:92,hy:96,to:68,ua:-30,fa:-30,ua2:-10,fa2:-10,th:34,sh:-12}]});
def('sumohighpull',{v:'f',m:'delt',hand:true,two:false,f:[{hx:100,hy:108,th:48,sh:-34,lg:.92,ua:6,fa:6},{...ST,th:14,sh:14,ua:96,fa:-28}]});
// ---------- stretches & yoga (holds with breathing) ----------
def('downdog',{v:'s',m:'hams',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:82,to:130,hd:0,ua:20,fa:20,th:-25,sh:-15,ft:0}]});
def('cobra',{v:'s',m:'core',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:150,to:65,hd:-20,ua:-80,fa:50,th:-90,sh:-90,ft:0}]});
def('updog',{v:'s',m:'core',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:140,to:40,hd:-20,ua:0,fa:0,th:-90,sh:-90,ft:0}]});
def('childpose',{v:'s',m:'back',mode:'hold',props:[['mat',{}]],f:[{hx:86,hy:124,to:112,hd:10,ua:70,fa:70,th:0,sh:-90,ft:0}]});
def('catcow',{v:'s',m:'lowback',dur:2600,f:[{...Q,to:84,hd:-30,hy:106},{...Q,to:98,hd:40,hy:110}]});
def('forwardfold',{v:'s',m:'hams',mode:'hold',f:[{hx:98,hy:84,to:132,hd:10,ua:-10,fa:-10,th:-4,sh:-2}]});
def('halflift',{v:'s',m:'hams',dur:2400,f:[{hx:98,hy:84,to:132,hd:10,ua:-10,fa:-10,th:-4,sh:-2},{hx:96,hy:86,to:84,hd:-20,ua:10,fa:10,th:-4,sh:-2}]});
def('quadstretch',{v:'s',m:'quads',mode:'hold',props:[['wall',{x:160}]],f:[{...ST,ua:92,fa:92,ua2:-40,fa2:-80,th2:-12,sh2:-172,ft2:-90}]});
def('hamstretch_seated',{v:'s',m:'hams',mode:'hold',props:[['mat',{}]],f:[{hx:90,hy:150,to:58,hd:-10,ua:110,fa:110,th:90,sh:90,ft:120}]});
def('hamstretch_standing',{v:'s',m:'hams',mode:'hold',props:[['box',{x:126,y:126,w:40}]],f:[{hx:92,hy:84,to:50,hd:-10,ua:60,fa:60,th:60,sh:60,ft:140,th2:0,sh2:0}]});
def('hipflexor',{v:'s',m:'hipflex',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:124,to:-4,ua:170,fa:170,th:90,sh:0,th2:-40,sh2:-100,ft2:0}]});
def('lowlunge',{v:'s',m:'hipflex',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:124,to:30,ua:40,fa:40,th:90,sh:0,th2:-40,sh2:-100,ft2:0}]});
def('butterfly',{v:'f',m:'adductors',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:134,ua:30,fa:-30,th:72,sh:-100,lg:.6}]});
def('pigeon',{v:'s',m:'glute',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:142,to:8,ua:30,fa:30,th:100,sh:-150,ft:-90,th2:-90,sh2:-90,ft2:0}]});
def('figure4',{v:'s',m:'glute',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:151,to:-90,ua:-110,fa:-170,th:140,sh:-10,th2:110,sh2:-80}]});
def('warrior1',{v:'s',m:'hipflex',mode:'hold',f:[{hx:100,hy:104,to:-5,ua:178,fa:178,th:72,sh:0,th2:-50,sh2:-45,ft2:40}]});
def('warrior2',{v:'s',m:'quads',mode:'hold',f:[{hx:100,hy:104,to:0,ua:92,fa:92,ua2:-92,fa2:-92,th:72,sh:0,th2:-50,sh2:-45,ft2:40}]});
def('warrior3',{v:'s',m:'glute',mode:'hold',f:[{hx:100,hy:84,to:88,hd:-20,ua:96,fa:96,th:0,sh:0,th2:-92,sh2:-92,ft2:0}]});
def('tree',{v:'f',m:'glute_med',mode:'hold',f:[{...ST,ua:150,fa:-150,th:4,sh:4,th2:62,sh2:-60}]});
def('triangle',{v:'f',m:'hams',mode:'hold',f:[{hx:100,hy:92,to:52,ua:176,fa:176,ua2:4,fa2:4,th:34,sh:34,th2:34,sh2:34,lg:.9}]});
def('chestdoor',{v:'f',m:'chest',mode:'hold',f:[{...ST,ua:100,fa:170}]});
def('latstretch',{v:'f',m:'lats',mode:'hold',f:[{...ST,to:16,ua:172,fa:172,ua2:172,fa2:172}]});
def('neckstretch',{v:'f',m:'back_upper',mode:'hold',f:[{...ST,hd:30,ua:120,fa:-178,ua2:4,fa2:4}]});
def('tricepstretch',{v:'f',m:'triceps',mode:'hold',f:[{...ST,ua:176,fa:-120,ua2:150,fa2:-178}]});
def('crossbody',{v:'f',m:'delt_rear',mode:'hold',f:[{...ST,ua:95,fa:-85,ua2:40,fa2:-120}]});
def('calfstretch',{v:'s',m:'calves',mode:'hold',props:[['wall',{x:160}]],f:[{hx:100,hy:86,to:20,ua:92,fa:92,th:40,sh:-10,th2:-30,sh2:-30,ft2:60}]});
def('plow',{v:'s',m:'back',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:112,to:180,ua:-100,fa:-100,th:-100,sh:-100,ft:-60,sc:.9}]});
def('shoulderstand',{v:'s',m:'core',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:112,to:180,ua:-100,fa:-170,th:178,sh:178,ft:270,sc:.9}]});
def('supinetwist',{v:'s',m:'lowback',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:151,to:-90,ua:-90,fa:-90,ua2:90,fa2:90,th:135,sh:-12}]});
def('savasana',{v:'s',m:null,mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:152,to:-90,ua:80,fa:80,th:90,sh:90,ft:130}]});
def('mountain',{v:'f',m:null,mode:'hold',f:[{...ST}]});
def('chairpose',{v:'s',m:'quads',mode:'hold',f:[{hx:94,hy:100,to:25,ua:170,fa:170,th:50,sh:-10}]});
def('boat',{v:'s',m:'abs',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:140,to:-35,ua:100,fa:100,th:120,sh:120,ft:150}]});
def('happybaby',{v:'s',m:'glute',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:151,to:-90,ua:140,fa:140,th:168,sh:60,ft:90}]});
def('kneestochest',{v:'s',m:'lowback',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:151,to:-90,ua:120,fa:150,th:160,sh:20,ft:60}]});
def('seatedtwist',{v:'f',m:'obliques',dur:2600,props:[['mat',{}]],f:[{hx:100,hy:134,to:0,ua:60,fa:-20,ua2:30,fa2:-60,th:40,sh:-80,lg:.6},{hx:100,hy:134,to:10,ua:90,fa:40,ua2:20,fa2:-90,th:40,sh:-80,lg:.6}]});
def('seated',{v:'f',m:null,mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:134,ua:20,fa:-20,th:60,sh:-100,lg:.6}]});
def('bridgepose',{v:'s',m:'glute',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:126,to:-120,ua:-110,fa:-110,th:98,sh:-28}]});
def('wheel',{v:'s',m:'core',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:106,to:-125,ua:-170,fa:-140,th:110,sh:-35}]});
def('lunge_rot',{v:'s',m:'obliques',dur:2600,props:[['mat',{}]],f:[{hx:100,hy:124,to:40,ua:20,fa:20,ua2:20,fa2:20,th:90,sh:0,th2:-40,sh2:-100,ft2:0},{hx:100,hy:124,to:30,ua:178,fa:178,ua2:20,fa2:20,th:90,sh:0,th2:-40,sh2:-100,ft2:0}]});
def('torsotwist',{v:'f',m:'obliques',dur:1800,f:[{...ST,to:0,ua:80,fa:-70,ua2:80,fa2:-70},{...ST,to:0,ua:92,fa:-20,ua2:60,fa2:-110}]});
def('sidebendflow',{v:'f',m:'obliques',mode:'cycle',dur:2600,f:[{...ST,to:-18,ua:172,fa:172,ua2:10,fa2:10},{...ST,to:0,ua:172,fa:172,ua2:172,fa2:172},{...ST,to:18,ua:10,fa:10,ua2:172,fa2:172},{...ST,to:0,ua:172,fa:172,ua2:172,fa2:172},{...ST,to:-18,ua:172,fa:172,ua2:10,fa2:10}]});
def('ninety',{v:'f',m:'glute',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:136,ua:30,fa:30,th:70,sh:-110,th2:20,sh2:-150,lg:.6}]});
def('frog',{v:'s',m:'adductors',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:126,to:95,ua:20,fa:90,th:10,sh:-90,ft:0}]});
def('legsupwall',{v:'s',m:null,mode:'hold',props:[['wall',{x:150}]],f:[{hx:130,hy:152,to:-90,ua:80,fa:80,th:178,sh:178,ft:240}]});
def('crow',{v:'s',m:'core',mode:'hold',f:[{hx:86,hy:96,to:118,hd:-20,ua:20,fa:20,th:40,sh:-130,ft:-90}]});
def('camel',{v:'s',m:'hipflex',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:122,to:-40,hd:-30,ua:-110,fa:-110,th:0,sh:-90,ft:0}]});
def('reverseplank',{v:'s',m:'glute',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:132,to:-60,ua:-40,fa:-40,th:70,sh:70,ft:120}]});
def('reversetabletop',{v:'s',m:'glute',mode:'hold',props:[['mat',{}]],f:[{hx:100,hy:124,to:-70,ua:-30,fa:-30,th:88,sh:0}]});
def('crabwalk',{v:'s',m:'triceps',mode:'cycle',dur:1200,props:[['mat',{}]],f:[{hx:100,hy:124,to:-70,ua:-30,fa:-30,th:88,sh:0},{hx:100,hy:134,to:-70,ua:-100,fa:10,th:84,sh:-4}]});
def('planche',{v:'s',m:'delt_front',mode:'hold',f:[{hx:80,hy:108,to:90,ua:-20,fa:-20,th:-90,sh:-90,ft:0}]});
def('planchelean',{v:'s',m:'delt_front',mode:'hold',f:[{hx:100,hy:110,to:96,ua:-25,fa:-25,th:-65,sh:-60,ft:10}]});
def('humanflag',{v:'f',m:'obliques',mode:'hold',props:[['wall',{x:40}]],f:[{hx:104,hy:88,to:-86,ua:60,fa:60,ua2:-110,fa2:-110,th:0,sh:0,lg:1}]});
def('ropeclimb',{v:'f',m:'lats',mode:'cycle',dur:1400,props:[['cable',{x:100,y:6,top:4,bottom:40}]],f:[{hx:100,hy:120,ua:172,fa:172,ua2:100,fa2:-160,th:30,sh:-20,th2:0,sh2:0,lg:.75,sc:.86},{hx:100,hy:104,ua:100,fa:-160,ua2:172,fa2:172,th:0,sh:0,th2:30,sh2:-20,lg:.75,sc:.86}]});
def('dbsquat',{v:'s',m:'quads',hand:true,two:true,f:[{...ST,ua:2,fa:2},{hx:92,hy:112,to:25,ua:2,fa:2,th:75,sh:-20}]});
def('cablepress',{v:'s',m:'chest',props:[['cable',{x:28,y:60,top:6}]],f:[{...ST,to:12,ua:40,fa:-140},{...ST,to:12,ua:90,fa:90}]});
def('extrot',{v:'f',m:'delt_rear',props:[['cable',{x:30,y:100,top:40,bottom:160}]],f:[{...ST,ua:10,fa:-88,ua2:4,fa2:4},{...ST,ua:10,fa:70,ua2:4,fa2:4}]});
window.__ARCH=A;
})();

/* =========================== runtime: resolve, make, ticker =========================== */
(function(){
'use strict';
const C=window.__ANIMCORE, PROPS=window.__PROPS, ARCH=window.__ARCH;
const {el,set,lerp,ease,full,mix,fkSide,fkFront,MUS,buildFigure,drawFigure,add,FLOOR,SIDE0,FRONT0}=C;
// ---- id → archetype rules (first match wins) ----
const R=[
 // stretches & yoga first (specific names)
 [/upward-dog/,'updog'],[/^(downward-dog|three-legged-dog|dolphin-pose)/,'downdog'],[/cobra|sphinx|locust|bow-pose/,'cobra'],[/childs-pose|puppy-pose|thread-the-needle|kneeling-wrist|wrist-stretch/,'childpose'],
 [/cat-cow|cat-stretch/,'catcow'],[/forward-fold-to-half-lift|roll-down/,'halflift'],[/wall-hamstring|bench-hamstring/,'hamstretch_standing'],[/seated-forward|hamstring-stretch|straddle|spine-stretch|pilates-saw|head-to-knee/,'hamstretch_seated'],
 [/forward-fold|pyramid-pose|standing-split/,'forwardfold'],[/quad-stretch|couch-stretch|dancer-pose/,'quadstretch'],[/worlds-greatest|revolved-crescent/,'lunge_rot'],[/low-lunge|lizard/,'lowlunge'],[/hip-flexor|crescent-lunge|half-kneeling/,'hipflexor'],
 [/frog-stretch/,'frog'],[/butterfly|garland|easy-pose|hero-pose|cow-face|lotus/,'butterfly'],[/90-90/,'ninety'],[/figure-4/,'figure4'],[/pigeon|cross-legged/,'pigeon'],
 [/warrior-one/,'warrior1'],[/warrior-two|extended-side-angle/,'warrior2'],[/warrior-three/,'warrior3'],[/heel-to-toe/,'walk'],[/tree-pose|eagle-pose|half-moon|single-leg-stand|tandem|dome-stand/,'tree'],
 [/triangle|revolved-chair/,'triangle'],[/knee-to-chest|knees-to-chest/,'kneestochest'],[/camel-pose/,'camel'],[/chest-stretch|doorway|fish-pose|reclined-butterfly/,'chestdoor'],[/side-bend-flow/,'sidebendflow'],[/lat-stretch|standing-side-bend/,'latstretch'],
 [/chin-tuck/,'chintuck'],[/isometric-neck/,'isoneck'],[/neck-side|neck-stretch/,'neckstretch'],[/triceps-stretch|overhead-triceps/,'tricepstretch'],[/cross-body-shoulder|rear-delt-stretch|shoulder-stretch/,'crossbody'],[/calf-stretch|ankle-stretch/,'calfstretch'],
 [/legs-up-the-wall/,'legsupwall'],[/plow-pose|pilates-roll-over/,'plow'],[/shoulderstand/,'shoulderstand'],[/supine-spinal|spinal-twist|windshield/,'supinetwist'],[/savasana|corpse/,'savasana'],[/mountain-pose/,'mountain'],[/chair-pose/,'chairpose'],[/boat-pose|v-sit$/,'boat'],[/happy-baby/,'happybaby'],
 [/torso-twists/,'torsotwist'],[/pilates-spine-twist|seated-spinal/,'seatedtwist'],[/thoracic-bridge|bridge-pose|wheel-pose/,'bridgepose'],[/adductor-stretch|it-band-stretch|leg-swing/,'legswing'],[/wide-legged-forward/,'forwardfold'],
 [/pilates-leg-pull-back/,'reverseplank'],[/pilates-leg-pull-front/,'highplank'],[/pilates-side-bend|side-plank|trx-side-plank/,'sideplank'],[/pilates-kneeling-side-kick|fire-hydrant/,'firehydrant'],[/crow-pose/,'crow'],
 // calisthenics holds
 [/handstand-push/,'handstandpu'],[/handstand/,'handstand'],[/planche-lean|pseudo-planche/,'planchelean'],[/planche/,'planche'],[/front-lever/,'frontlever'],[/back-lever/,'backlever'],[/human-flag/,'humanflag'],[/muscle-up/,'muscleup'],[/rope-climb/,'ropeclimb'],
 [/dead-hang/,'deadhang'],[/flexed-arm-hang/,'hang_flexed'],[/scapular-pull/,'scappull'],[/wall-sit|wall-squat/,'wallsit'],[/(^|-)l-sit|ring-support|support-hold/,'lsit'],
 [/hanging-tuck|hanging-knee|captains-chair-knee/,'hangingkneeraise'],[/toes-to-bar|hanging-pike/,'toestobar'],[/hanging-leg|captains-chair-leg/,'hanginglegraise'],
 // pulls
 [/chin-up|close-grip-pull|commando-pull/,'chinup'],[/pull-up|pullup/,'pullup'],[/lat-pulldown|pulldown-machine/,'latpulldown'],[/straight-arm-pulldown/,'straightarm_pd'],[/pullover/,'pullover'],
 [/chest-supported|rings-inverted|incline-bench-row/,'cs_row'],[/inverted-row|ring-row|trx-row|sled-row/,'invertedrow'],[/seated-cable-row|seated-row|kneeling-cable-row/,'seatedrow'],[/t-bar-row/,'tbarrow'],[/single-arm-db-row|one-arm-.*row/,'dbrow'],[/renegade/,'renegade'],
 [/face-pull/,'facepull'],[/sumo-high-pull/,'sumohighpull'],[/upright-row/,'uprightrow'],[/shrug/,'shrug'],[/band-pull-apart/,'bandpullapart'],[/machine-reverse-fly|reverse-fly-machine/,'reverseflyM'],[/rear-delt|reverse-fly|reverse-flye|trx-y-fly/,'reardeltfly'],[/\brow\b|-row$|-row-|bench-pull|pendlay/,'row'],
 // squats & lunges
 [/squat-hold|isometric-squat|deep-squat-hold|squat-pulse/,'squathold'],[/bulgarian/,'bulgarian'],[/split-squat|isometric-split/,'splitsquat'],[/step-up/,'stepup'],[/box-jump/,'boxjump'],[/jump-squat|plyo-lunge/,'jumpsquat'],
 [/pistol|shrimp-squat|single-leg-box|skater/,'pistol'],[/cossack|side-lunge|lateral-lunge|lunge/,'lunge'],[/hack-squat-calf/,'calfraise'],[/hack-squat|v-squat/,'hacksquat'],[/leg-press/,'legpress'],
 [/goblet|somersault/,'goblet'],[/front-squat|zercher-squat|kettlebell-squat/,'frontsquat'],[/overhead-squat/,'ohsquat'],[/sumo-squat|sumo-deadlift/,'sumosquat'],[/zercher-hold/,'rackhold'],[/thruster/,'thruster'],[/wall-ball/,'wallball'],
 [/(db|dumbbell|kettlebell)-squat/,'dbsquat'],[/(trx|box|banded|balance-dome|bodyweight|air)-squat$|^squat-bodyweight/,'bwsquat'],[/squat/,'squat'],
 // hinges
 [/kettlebell-swing|one-arm-.*swing|dumbbell-swing|swing-snatch/,'kbswing'],[/swing-clean|kettlebell-clean|dead-clean|dumbbell-clean|kb-clean/,'kbclean'],[/kettlebell-snatch|dumbbell-snatch|dead-split-snatch/,'kbsnatch'],
 [/hip-thrust|glute-drive/,'hipthrust'],[/single-leg-glute-bridge/,'sl_glutebridge'],[/glute-bridge|hip-bridge|floor-glute/,'glutebridge'],[/good-morning/,'goodmorning'],
 [/single-leg.*(deadlift|rdl)|kickstand|one-arm-single-leg|single-leg-rdl/,'sl_rdl'],[/romanian|rdl|stiff-leg/,'rdl'],[/rack-pull/,'rackpull'],[/deadlift|jefferson/,'deadlift'],
 [/back-extension|hyperextension/,'backext'],[/superman/,'superman'],[/bird-dog/,'birddog'],[/cable-pull-through/,'cablepullthrough'],
 // presses
 [/svend/,'svend'],[/cable-chest-press/,'cablepress'],[/cable-external-rotation|external-rotation/,'extrot'],[/incline.*(press|bench)|paused-incline/,'inclinepress'],[/decline.*(press|bench)/,'declinepress'],[/floor-.*press|floor-press/,'floorpress'],[/close-grip.*(bench|press)/,'closegrip'],
 [/chest-press-machine|machine-chest-press/,'chestpress'],[/trx-chest-press|wall-push/,'wallpushup'],[/bench-press|spoto/,'benchpress'],[/pec-deck|machine-chest-fly|chest-fly-machine/,'pecdeck'],[/fly$|-fly-|-flye|cable-fly|crossover/,'fly'],
 [/knee-push-up|knee-pushup/,'kneepushup'],[/incline-push|hands-on-ball/,'inclinepushup'],[/pike-push/,'pikepushup'],[/decline-push/,'declinepushup'],[/push-up|pushup|push-ups/,'pushup'],
 [/bench-dips|dip-hold-bench|crab-dips|reverse-plank-dips/,'benchdips'],[/dips|dip-hold-bars|dip-machine|seated-dip/,'dips'],
 [/arnold/,'arnold'],[/push-press/,'pushpress'],[/push-jerk|split-jerk|jerk$|clean-and-jerk/,'jerk'],[/machine-shoulder-press|shoulder-press-machine|single-arm-machine-shoulder/,'machinepress'],[/landmine/,'landmine'],
 [/seated.*(press|ohp)|smith-machine-shoulder/,'seatedpress'],[/bottoms-up/,'bottomsup'],[/overhead-press|shoulder-press|^ohp$|paused-ohp|behind-the-neck-press|military|clean-and-press|curl-and-press|lunge-press|lunge-and-press/,'ohp'],
 // arms
 [/preacher/,'preacher'],[/concentration/,'concentration'],[/spider-curl/,'spidercurl'],[/incline-db-curl|incline-hammer|incline-curl/,'inclinecurl'],[/cable-curl|cable-hammer/,'cablecurl'],[/curl-iso-hold/,'rackhold'],[/wrist-roller/,'wristroller'],[/wrist-curl|plate-pinch/,'wristcurl'],
 [/reverse-nordic/,'reversenordic'],[/nordic/,'nordic'],[/seated-leg-curl|banded-standing-curl/,'legcurl_seated'],[/leg-curl|hamstring-curl/,'legcurl_lying'],
 [/curl/,'curl'],[/pushdown|press-down/,'pushdown'],[/cable-overhead-tricep/,'cable_ohext'],[/overhead.*(extension|tricep)|french-press/,'overheadext'],[/skull|lying-tricep|lying-triceps/,'skullcrusher'],
 [/glute-kickback|donkey-kick/,'glutekickback'],[/cable-tricep-kickback/,'cablekickback'],[/cable-kickback/,'cablekickback_glute'],[/kickback/,'kickback'],[/triceps-extension-machine|machine-triceps|tricep-extension-machine/,'tricepM'],[/tricep-extension|triceps-extension|trx-tricep/,'overheadext'],
 // shoulders
 [/plate-loaded-lateral|lateral-raise-machine/,'lateralM'],[/lateral-raise|side-lying-lateral/,'lateralraise'],[/front-raise/,'frontraise'],[/halo/,'halo'],[/windmill/,'windmill'],[/turkish/,'tgu'],[/overhead-hold/,'ohhold'],[/overhead-carry/,'ohcarry'],[/rack-hold/,'rackhold'],
 // core
 [/copenhagen/,'copenhagen'],[/reverse-tabletop/,'reversetabletop'],[/reverse-plank/,'reverseplank'],
 [/bench-decline-plank|incline-plank|high-plank|bear-plank|single-arm-plank|ring-plank|trx-plank|balance-dome-plank/,'highplank'],[/plank-knee-tuck|mountain-climber|knee-tuck|knee-drive/,'mountainclimber'],[/plank/,'plank'],
 [/bicycle-crunch|cross-body-crunch/,'bicyclecrunch'],[/cable-crunch|seated-crunch|ab-crunch-machine/,'cablecrunch'],[/v-ups/,'vup'],[/reverse-crunch|leg-pull-in|cocoons|jackknife|ball-pike|stability-ball-knee/,'reversecrunch'],
 [/decline-crunch|sit-up|wall-crunch|weighted-crunch/,'situp'],[/crunch|heel-touches/,'crunch'],[/leg-raise/,'legraise'],[/flutter|scissor/,'flutter'],[/six-inch/,'sixinch'],[/hollow/,'hollow'],[/dead-bug/,'deadbug'],
 [/ab-wheel|rollout/,'abwheel'],[/russian-twist/,'russiantwist'],[/pallof/,'pallof'],[/side-bend/,'sidebend'],[/woodchop|wood-chop/,'woodchop'],[/dragon-flag/,'dragonflag'],[/medicine-ball-side|rotational/,'medballthrow'],[/slam/,'medballslam'],
 // legs & glutes accessories
 [/leg-extension|terminal-knee/,'legext'],[/seated-calf/,'seatedcalf'],[/donkey-calf/,'donkeycalf'],[/calf-raise/,'calfraise'],[/tibialis/,'tibraise'],
 [/hip-abduction-machine|seated-hip-abduction|^hip-abduction/,'hipabd'],[/hip-adduction/,'hipadd'],[/clamshell/,'clamshell'],[/side-lying-hip-abduction|side-plank-leg-lift/,'sidelying_abd'],
 [/lateral-walk|sumo-walk|monster-walk/,'lateralwalk'],[/standing-hip-abduction|standing-abduction/,'standing_abd'],[/sled/,'sled'],
 // carries & cardio
 [/farmers|farmer/,'farmers'],[/suitcase/,'suitcase'],[/sandbag-carry|bear-hug/,'rackcarry'],
 [/jumping-jacks/,'jumpingjacks'],[/burpee/,'burpee'],[/jump-rope|skipping/,'jumprope'],[/high-knees/,'highknees'],[/heel-flicks|butt-kick/,'buttkicks'],[/cycling|bike|bicycle/,'cycling'],[/rowing-machine|rower/,'rowing'],[/elliptical|ski-erg/,'elliptical'],
 [/stair|step-mill/,'stairs'],[/battle-rope/,'battlerope'],[/bear-crawl/,'bearcrawl'],[/crab-walk/,'crabwalk'],[/inchworm/,'inchworm'],[/running|sprint|treadmill-run/,'run'],[/walk/,'walk'],[/x-swimming/,'swim'],[/x-boxing/,'boxing'],[/x-(football|basketball|tennis)/,'run'],[/x-park/,'pullup'],[/x-yoga/,'downdog'],
 // olympic
 [/hang-power-clean|hang-clean/,'hangclean'],[/^clean$|power-clean/,'clean'],[/hang-snatch|muscle-snatch|^snatch$|power-snatch/,'snatch'],
 // generic fallbacks
 [/hold$/,'rackhold'],
];
const RULES=R.map(([rx,key,o])=>({rx,key,o}));
const BARS=new Set(['barbell','ez_bar','smith_machine','trap_bar']);
function handProp(e,arch){
  const eq=e.eq||'none'; const f=arch.v==='f';
  if(BARS.has(eq)) return [f?'barF':'bar',{}];
  if(eq==='dumbbell') return ['db',{}];
  if(eq==='kettlebell') return ['kb',{}];
  if(eq==='plates') return ['plate',{}];
  if(eq==='medicine_ball'||eq==='slam_ball'||eq==='wall_ball') return ['ball',{r:9}];
  if(eq==='sandbag') return ['ball',{r:11}];
  if(eq==='loop_band'||eq==='resistance_band') return ['band',{feet:true}];
  if(eq==='cable'&&!(arch.props||[]).some(p=>p[0]==='cable')) return ['cable',{x:f?100:172,y:150,top:40}];
  return null;
}
function resolve(e){
  if(!e) return null;
  let key=e.anim||null;
  if(!key){ if(e.custom) return null; const id=e.id||''; for(const r of RULES){ if(r.rx.test(id)){ key=r.key; break; } } }
  const arch=ARCH[key]; if(!arch) return null;
  const props=(arch.props||[]).map(p=>[p[0],{...p[1]}]);
  const hp=arch.hand?handProp(e,arch):null; if(hp) props.push(hp);
  if(arch.hand&&!hp&&arch.rack==='back') props.push([arch.v==='f'?'barF':'bar',{}]);  // squats etc. default to a bar
  return {key,arch,props,two:!!arch.two||(e.eq==='dumbbell'||e.eq==='kettlebell')&&!e.uni&&arch.two!==false};
}
// ---- timing ----
function repS(t){ // 0..1 cycle → progress toward the peak (concentric fast, eccentric slow)
  if(t<.36) return ease(t/.36); if(t<.44) return 1; if(t<.9) return 1-ease((t-.44)/.46); return 0;
}
// ---- ticker ----
const LIVE=new Set(); let raf=0; let reduced=false;
try{ const mq=matchMedia('(prefers-reduced-motion: reduce)'); reduced=mq.matches; mq.addEventListener('change',()=>{ reduced=mq.matches; }); }catch(e){}
const io=('IntersectionObserver' in window)?new IntersectionObserver(es=>{ es.forEach(en=>{ const fig=en.target.__fig; if(fig){ fig.visible=en.isIntersecting; if(fig.visible) run(); } }); },{rootMargin:'120px 0px'}):null;
function run(){ if(!raf) raf=requestAnimationFrame(tick); }
function tick(now){
  raf=0; let any=false;
  LIVE.forEach(fig=>{ if(!fig.visible||fig.still) return; if(!fig.svg.isConnected){ LIVE.delete(fig); if(io) io.unobserve(fig.svg); return; } any=true; frame(fig,now); });
  if(any&&!document.hidden) raf=requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) run(); });
function poseAt(fig,now){
  const {arch,frames}=fig; const dur=arch.dur||(arch.mode==='cycle'?1600:2600); const t=((now-fig.t0)%dur)/dur;
  if(arch.mode==='hold'){ const b=Math.sin(t*Math.PI*2*(dur/3200)); const p={...frames[0]}; p.hy+=b*.8; p.to+=b*1.2; p.hd+=b*2; p.sho+=b*.6; return [p,.5+.5*b]; }
  if(arch.mode==='cycle'){ const n=fig.n; const x=t*n; const i=Math.floor(x)%n; const u=ease(x-Math.floor(x)); return [mix(frames[i],frames[(i+1)%n],u),u]; }
  const s=repS(t); return [mix(frames[0],frames[1],s),s];
}
function frame(fig,now){
  const [p,phase]=poseAt(fig,now); draw(fig,p,phase);
}
function draw(fig,p,phase){
  const f=fig.arch.v==='f'; const k=f?fkFront(p):fkSide(p); k.pose=p;
  fig.root.setAttribute('transform',p.sc&&p.sc!==1?`translate(100 ${FLOOR}) scale(${p.sc}) translate(-100 ${-FLOOR})`:'');
  drawFigure(fig.F,p,k,fig.muscle,phase);
  let hand=k.arm1.h, hand2=k.arm2.h;
  if(fig.arch.hip){ const fr=[-k.tdir[1],k.tdir[0]]; hand=add(k.hip,fr,9); hand2=hand; }
  const ctx={hand,hand2,fa:p.fa,fa2:p.fa2,two:fig.two,phase};
  fig.props.forEach(pr=>{ if(pr.def.draw) pr.def.draw(pr.state,k,p,ctx); });
}
function make(e,opts={}){
  const res=opts.res||resolve(e); if(!res) return null;
  const {arch,props,two}=res;
  const svg=el('svg',{viewBox:'0 0 200 200',class:'exanim',role:'img','aria-label':(e.he||e.en||'')+' – הדגמה','data-arch':res.key});
  const F=buildFigure(svg,arch.v);
  const base=arch.v==='f'?FRONT0:SIDE0;
  let frames=arch.f.map(p=>full(p,base));
  let n=frames.length; if(arch.mode==='cycle'&&n>1&&JSON.stringify(arch.f[0])===JSON.stringify(arch.f[n-1])){ frames=frames.slice(0,-1); n--; }
  const fig={svg,F,root:F.root,arch,frames,n,two,props:[],t0:performance.now()-(opts.offset||0),visible:!io,still:!!opts.still||reduced,muscle:musKey(opts.muscle)||musKey(arch.m)};
  // props: static ones in the back layer, hand props in front
  const BACKP=new Set(['floor','bench','pad','box','wall','barHigh','dipBars','seat','mat','stairs','bike','rower','sled','bigball','cable','landmine','lever','trx','band']);
  [['floor',{}],...props].forEach(([name,o])=>{ const def=PROPS[name]; if(!def) return; const g=el('g'); (BACKP.has(name)?F.propsBack:F.propsFront).append(g); fig.props.push({def,state:def.make(g,o)}); });
  svg.__fig=fig;
  if(fig.still){ const [p,ph]=arch.mode==='rep'||!arch.mode?[mix(frames[0],frames[1]||frames[0],.55),.55]:poseAt(fig,fig.t0+(arch.dur||2000)*.3); draw(fig,p,ph); return svg; }
  draw(fig,frames[0],0);
  LIVE.add(fig); if(io) io.observe(svg); else run();
  return svg;
}
const TOK=new Set(['chest','back','lowback','delt','biceps','triceps','forearm','quads','hams','hipflex','glute','calves','core']);
function musKey(m){ if(!m) return null; if(TOK.has(m)) return m; return MUS[m]||null; }
function still(e,opts={}){ return make(e,{...opts,still:true}); }
window.EXANIM={resolve,make,still,ARCH,RULES,MUS,has:e=>!!resolve(e),stats(list){ const c={}; let hit=0; list.forEach(e=>{ const r=resolve(e); if(r){ hit++; c[r.key]=(c[r.key]||0)+1; } }); return {hit,total:list.length,byKey:c}; }};
})();
