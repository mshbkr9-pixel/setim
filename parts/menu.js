/* MenuKit: the recipes, the home pantry and the shopping list, tied to the day's targets.
   "What can I cook tonight from what I have, that fits what is left of my day?" is answered here, with no screen and no network.
   A recipe's numbers are worked out by build_food.py from the national nutrition table; this file only chooses and adds up.
   Plain ES5, no DOM. Needs FoodKit (the vocabulary). */
var MenuKit=(function(){
  var FK=(typeof FoodKit!=='undefined')?FoodKit:((typeof require!=='undefined')?require('./food.js'):null);
  function has(o,k){ return Object.prototype.hasOwnProperty.call(o,k); }
  function r1(v){ return Math.round(v*10)/10; }
  var SLOTS={3:['b','l','d'],4:['b','l','s','d'],5:['b','s','l','s','d']};
  var SHARE={3:[0.3,0.4,0.3],4:[0.25,0.35,0.1,0.3],5:[0.22,0.09,0.32,0.09,0.28]};
  var STAPLE={};      // always at home: nobody lists salt or water
  ['מלח','פלפל שחור','מים','פפריקה','כמון','כורכום','אורגנו','קינמון','מיץ לימון'].forEach(function(k){ STAPLE[k]=1; });
  var LOOSE={poultry:1,meat:1,fish:1,veg:1,fruit:1};
  function isStaple(k){ var e=FK.byKey(k); return has(STAPLE,k)||!!(e&&e.c==='spice'); }

  /* ---------- who may eat what ---------- */
  /* prefs: {kosher:true, veg:0|1|2, al:['milk',...], no:['חציל',...], thrifty:true, meals:3|4|5} */
  function allowed(r,prefs){
    prefs=prefs||{};
    if(prefs.kosher&&r.ko==='x') return false;
    if((+prefs.veg||0)>(r.vg==null?2:r.vg)) return false;
    var al=prefs.al||[], no=prefs.no||[], i;
    for(i=0;i<al.length;i++) if((r.al||[]).indexOf(al[i])>=0) return false;
    for(i=0;i<r.ing.length;i++) if(no.indexOf(r.ing[i][0])>=0) return false;
    return true;
  }
  function byId(id){ var R=FK.recipes(); for(var i=0;i<R.length;i++) if(R[i].id===id) return R[i]; return null; }
  function nut(r,sv){ sv=sv||1; return [Math.round(r.n[0]*sv),r1(r.n[1]*sv),r1(r.n[2]*sv),r1(r.n[3]*sv)]; }

  /* ---------- the pantry ---------- */
  /* how much of each food is at home, in grams as bought. An item with no amount ("יש לי אורז") counts as enough */
  function stock(pantry){
    var m={}; ((pantry&&pantry.items)||[]).forEach(function(it){ if(!it||!it.k) return; var e=FK.byKey(it.k), g;
      if(it.q==null) g=Infinity; else if(it.u==='יח') g=it.q*unitRaw(e); else g=+it.q||0;
      m[it.k]=(m[it.k]||0)+g; });
    return m;
  }
  function unitRaw(e){ if(!e) return 100; return e.raw&&e.y?e.ug/e.y:e.ug; }
  /* does the pantry cover one serving-count of a recipe? miss lists what has to be bought, in grams as bought */
  function cover(r,st,sv){
    sv=sv||1; var miss=[], need=0, got=0;
    r.ing.forEach(function(x){ var k=x[0], g=x[1]*sv/(r.serves||1); if(isStaple(k)) return; need++;
      var hv=st[k]||0; if(hv>=g*0.9) got++; else miss.push({k:k,g:r1(g-(hv===Infinity?0:hv))}); });
    return {ok:!miss.length,miss:miss,pct:need?got/need:1,need:need};
  }
  /* cooking takes the ingredients out of the pantry; returns what was taken, for the message and for an undo */
  function cook(pantry,r,sv){
    sv=sv||1; var taken=[]; if(!pantry||!pantry.items) return taken;
    r.ing.forEach(function(x){ var k=x[0], g=x[1]*sv/(r.serves||1); if(isStaple(k)) return;
      pantry.items.forEach(function(it){ if(it.k!==k||it.q==null||g<=0) return; var e=FK.byKey(k), per=it.u==='יח'?unitRaw(e):1, have=it.q*per, use=Math.min(have,g);
        if(use<=0) return; var q=it.u==='יח'?Math.max(0,Math.round((have-use)/per*2)/2):Math.max(0,Math.round(have-use)); taken.push({k:k,was:it.q,now:q,u:it.u}); it.q=q; g-=use; }); });
    pantry.items=pantry.items.filter(function(it){ return it.q==null||it.q>0; });
    return taken;
  }
  function expiring(pantry,today,days){
    var lim=addDays(today,days==null?3:days); return ((pantry&&pantry.items)||[]).filter(function(it){ return it.exp&&it.exp<=lim; }).sort(function(a,b){ return a.exp<b.exp?-1:1; });
  }
  function addDays(d,n){ var t=new Date(d+'T12:00:00'); t.setDate(t.getDate()+n); return t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2); }

  /* ---------- choosing ---------- */
  function seeded(seed){ var x=0; String(seed).split('').forEach(function(c){ x=(x*31+c.charCodeAt(0))>>>0; }); return function(){ x=(x*1664525+1013904223)>>>0; return x/4294967296; }; }
  function servingsFor(r,kcal){ var s=Math.round(kcal/Math.max(1,r.n[0])*2)/2; return Math.max(0.5,Math.min(2,s)); }      // a plate is half, one, one and a half or two servings, no more
  /* what to eat now: recipes that fit the slot and the person, ranked by how well they fill what is left of the day,
     with what is already at home first. o: {slot, kcal, protein, prefs, stock, soon:{key:1}, used:{id:n}, limit, rnd} */
  function suggest(o){
    var out=[], st=o.stock||{}, used=o.used||{}, soon=o.soon||{};
    FK.recipes().forEach(function(r){
      if(o.slot&&r.slot.indexOf(o.slot)<0) return; if(!allowed(r,o.prefs)) return;
      var sv=o.kcal?servingsFor(r,o.kcal):1, n=nut(r,sv), cv=cover(r,st,sv), sc=0;
      if(o.kcal) sc-=Math.abs(n[0]-o.kcal)/o.kcal*60;
      if(o.protein) sc-=Math.max(0,(o.protein-n[1])/o.protein)*45;
      sc+=cv.ok?30:cv.pct*18; sc-=Math.abs(sv-1)*10;
      r.ing.forEach(function(x){ if(soon[x[0]]) sc+=12; });
      sc-=(used[r.id]||0)*22;
      if(o.prefs&&o.prefs.thrifty) sc-=((r.cost||2)-1)*10;
      if(o.rnd) sc+=o.rnd()*6;
      out.push({r:r,sv:sv,n:n,cover:cv,score:sc});
    });
    out.sort(function(a,b){ return b.score-a.score; });
    return out.slice(0,o.limit||out.length);
  }
  /* one day of meals that adds up to the targets. T: {kcal,p}. returns {meals:[{slot,rid,sv,n}], tot:[k,p,c,f]} */
  function planDay(T,o){
    o=o||{}; var prefs=o.prefs||{}, n=+prefs.meals||4; if(!SLOTS[n]) n=4;
    var slots=SLOTS[n], share=SHARE[n], rnd=seeded(o.seed||'x'), used=o.used||{}, meals=[], picks=[];
    slots.forEach(function(sl,i){
      var c=suggest({slot:sl,kcal:T.kcal*share[i],protein:T.p*share[i],prefs:prefs,stock:o.stock,soon:o.soon,used:used,limit:6,rnd:rnd});
      picks.push(c); if(c.length){ meals.push(c[0]); used[c[0].r.id]=(used[c[0].r.id]||0)+1; } else meals.push(null);
    });
    function total(ms){ var t=[0,0,0,0]; ms.forEach(function(m){ if(m) for(var i=0;i<4;i++) t[i]+=m.n[i]; }); return t; }
    function badness(ms){ var t=total(ms); return Math.abs(t[0]-T.kcal)/T.kcal+1.4*Math.max(0,(T.p-t[1])/T.p)+0.5*Math.max(0,(t[1]-T.p*1.5)/T.p); }
    /* a second look: swap one meal for one of its runners-up, or move a meal half a serving, while the day gets closer */
    var best=badness(meals), moved=true, guard=0;
    while(moved&&guard++<12){ moved=false;
      for(var i=0;i<meals.length;i++){ if(!meals[i]) continue;
        var tries=picks[i].slice(0,5).concat([-0.5,0.5].map(function(d){ var m=meals[i], sv=m.sv+d; return sv<0.5||sv>2?null:{r:m.r,sv:sv,n:nut(m.r,sv),cover:m.cover,score:m.score}; }).filter(Boolean));
        for(var j=0;j<tries.length;j++){ var alt=tries[j]; if(alt.r===meals[i].r&&alt.sv===meals[i].sv) continue;
          if(alt.r!==meals[i].r&&meals.some(function(m){ return m&&m.r===alt.r; })) continue;
          var trial=meals.slice(); trial[i]=alt; var b=badness(trial);
          if(b<best-0.005){ used[meals[i].r.id]=Math.max(0,(used[meals[i].r.id]||1)-1); used[alt.r.id]=(used[alt.r.id]||0)+1; meals=trial; best=b; moved=true; } } } }
    return {meals:meals.map(function(m,i){ return m?{slot:slots[i],rid:m.r.id,sv:m.sv,n:m.n}:null; }).filter(Boolean),tot:total(meals).map(function(v,i){ return i?r1(v):Math.round(v); })};
  }
  /* a run of days, from a date. targetFor(date) gives each day's own numbers (training days eat a little more) */
  function planDays(from,count,targetFor,o){
    o=o||{}; var out={}, used={}, st=o.stock, soon=o.soon;
    for(var i=0;i<count;i++){ var d=addDays(from,i), T=targetFor(d); if(!T||!T.ok) continue;
      out[d]=planDay(T,{prefs:o.prefs,stock:st,soon:i<2?soon:null,used:used,seed:(o.seed||'')+d}); }
    return out;
  }

  /* ---------- the shopping list ---------- */
  /* everything the planned days need, less what is at home, rounded up to how the food is sold */
  function shopping(days,pantry){
    var need={}, st=stock(pantry), out=[];
    Object.keys(days||{}).forEach(function(d){ ((days[d]&&days[d].meals)||[]).forEach(function(m){ if(m.done) return; var r=byId(m.rid); if(!r) return;
      r.ing.forEach(function(x){ if(isStaple(x[0])) return; need[x[0]]=(need[x[0]]||0)+x[1]*m.sv/(r.serves||1); }); }); });
    Object.keys(need).forEach(function(k){ var hv=st[k]||0; if(hv===Infinity) return; var g=need[k]-hv; if(g<=need[k]*0.05) return; out.push(buy(k,g)); });
    out.sort(function(a,b){ return (a.c||'').localeCompare(b.c||'')||a.k.localeCompare(b.k); });
    return out;
  }
  /* grams to buy -> what to put in the basket: whole packs, pieces or a rounded weight */
  function buy(k,g){
    var e=FK.byKey(k)||{}, o={k:k,g:Math.round(g),c:e.c||''};
    if(e.pu==='יח'){ var per=unitRaw(e), n=Math.max(1,Math.ceil(g/per-0.05)); o.q=e.pk?Math.ceil(n/e.pk)*e.pk:n; o.u='יח'; o.packs=e.pk?Math.ceil(n/e.pk):0; }
    else if(LOOSE[e.c]){ o.q=Math.max(100,Math.ceil(g/100-0.05)*100); o.u='g'; }      // sold by weight: the amount needed, rounded up to a hundred grams
    else if(e.pk){ o.packs=Math.max(1,Math.ceil(g/e.pk-0.05)); o.q=o.packs*e.pk; o.u=e.pu||'g'; }
    else { o.q=Math.max(50,Math.ceil(g/50)*50); o.u=e.pu||'g'; }
    return o;
  }
  function qtyText(q,u){ if(q==null) return 'יש'; if(u==='יח') return r1(q)+' יח׳'; if(u==='ml') return q>=1000?r1(q/1000)+' ליטר':Math.round(q)+' מ״ל'; return q>=1000?r1(q/1000)+' ק״ג':Math.round(q)+' ג׳'; }

  return {allowed:allowed,byId:byId,nut:nut,stock:stock,cover:cover,cook:cook,expiring:expiring,suggest:suggest,planDay:planDay,planDays:planDays,shopping:shopping,buy:buy,qtyText:qtyText,addDays:addDays,isStaple:isStaple,SLOTS:SLOTS};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=MenuKit;
