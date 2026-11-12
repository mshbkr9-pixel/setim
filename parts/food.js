/* FoodKit: everything the app knows about food, with no screen in it.
   "אכלתי שתי ביצים, שלוש פרוסות לחם, קוטג' וסלט עם קצת שמן זית"  ->  items with grams, calories, protein, carbohydrates, fat.
   The numbers come from the national nutrition table (data/foods.json, built by build_food.py); the everyday names, the units
   and the serving sizes come from the vocabulary (data/food-core.json). Nothing here guesses a nutrition value.
   Plain ES5, no DOM, no globals except VoiceLog (its number reader), so the same file runs in the app and in the tests. */
var FoodKit=(function(){
  var VL=(typeof VoiceLog!=='undefined')?VoiceLog:((typeof require!=='undefined')?require('./voice.js'):null);
  /* a name as the sentence reader writes it: the geresh inside "צ׳יפס" or "ג׳חנון" is dropped, not turned into a space */
  function norm(s){ return VL.norm(pct(String(s==null?'':s)).replace(/["'׳״`‘’“”]/g,'')); }
  /* "5%" is part of a name ("קוטג' 5%"), not an amount: it becomes one word made of letters, the same way in the vocabulary and in the sentence */
  /* for the search box the figure stays a figure: typing "קוטג 3" finds "קוטג' 3%" */
  function snorm(s){ return VL.norm(String(s==null?'':s).replace(/["'׳״`‘’“”%]/g,'')); }
  function pct(s){ return s.replace(/(\d+(?:[.,]\d+)?)\s*%/g,function(m,n){ return ' pct'+n.replace(/[.,]/,'p').replace(/\d/g,function(d){ return 'abcdefghij'.charAt(+d); })+' '; }); }
  function has(o,k){ return Object.prototype.hasOwnProperty.call(o,k); }
  function r1(v){ return Math.round(v*10)/10; }
  function uniq(a){ var o={},out=[]; a.forEach(function(x){ if(!has(o,x)){ o[x]=1; out.push(x); } }); return out; }

  /* ---------- units ---------- */
  var UNIT={};      // normalized word -> canonical unit
  function addUnit(u,words){ words.split(' ').forEach(function(w){ if(w) UNIT[norm(w)]=u; }); }
  addUnit('g','ג גר גרם גרמים גרמ g gr gram grams'); addUnit('kg','קג קילו קילוגרם קילוגרמים קילוגרמ קילוים kg kilo kilos kilogram');
  addUnit('ml','מל מיליליטר מיליליטרים סמק ml'); addUnit('l','ליטר ליטרים l liter liters litre');
  addUnit('כוס','כוס כוסות cup cups'); addUnit('כף','כף כפות tbsp tablespoon tablespoons'); addUnit('כפית','כפית כפיות tsp teaspoon teaspoons');
  addUnit('פרוסה','פרוסה פרוסות פרוסת slice slices'); addUnit('יח','יחידה יחידות יח חתיכה חתיכות חתיכת unit units piece pieces');
  addUnit('מנה','מנה מנות מנת צלחת צלחות קערה קערית קערות serving servings portion plate bowl');
  addUnit('גביע','גביע גביעים גביעי'); addUnit('קופסה','קופסה קופסא קופסת קופסאות פחית פחיות can cans');
  addUnit('חופן','חופן חופנים handful'); addUnit('כדור','כדור כדורים כדורי scoop scoops'); addUnit('שקית','שקית שקיות חבילה חבילת חבילות אריזה אריזת אריזות pack packs bag');
  var GENERIC={'כף':15,'כפית':5,'כוס':200,'פרוסה':30,'גביע':150,'קופסה':160,'חופן':30,'כדור':50,'שקית':100};      // when the food itself has no weight for the unit
  var UNIT_HE={g:'ג׳',ml:'מ״ל','יח':'יח׳'};
  var UNIT_PL={'כוס':'כוסות','כף':'כפות','כפית':'כפיות','פרוסה':'פרוסות','מנה':'מנות','גביע':'גביעים','קופסה':'קופסאות','חופן':'חופנים','כדור':'כדורים','שקית':'שקיות','פיתה':'פיתות'};

  /* ---------- words that are not food ---------- */
  function setOf(words){ var o={}; words.split(' ').forEach(function(w){ if(w) o[norm(w)]=1; }); return o; }
  var FILL=setOf('אכלתי אכלנו אוכל אוכלת שתיתי שתינו שותה לקחתי היה היו הייתה לי אני גם ו עוד אז ואז כן טוב של עם על ליד בתוך בצד מעל כמו משהו בערך כ סביב ארוחה ארוחת לארוחת בארוחת '+
    'היום הבוקר בבוקר בוקר צהריים צהרים בצהריים בצהרים ערב בערב הערב לילה בלילה אתמול נשנוש לנשנוש ביניים אחרי לפני האימון אימון בבית בעבודה במסעדה רק פשוט בסוף בהתחלה ואחרי ולפני '+
    'תרשום תרשמי רשום תוסיף תוסיפי הוסף בבקשה את זה זאת אלה יש ה ל ב '+
    'i ate had have drank and with of a an the some for my breakfast lunch dinner snack today yesterday then also about plus please log add');
  var NOT=setOf('בלי ללא without no');
  var SMALL=setOf('קצת מעט טיפה טיפונת קצתי little bit'), BIG=setOf('הרבה המון גדול גדולה גדולים גדולות ענק ענקית large big'), TINY=setOf('קטן קטנה קטנים קטנות small');
  var PAIR=setOf('זוג');
  var SLOT_RX=[['b',/בוקר|breakfast/],['l',/צהר|lunch/],['d',/ערב|dinner|supper/],['s',/נשנוש|ביניים|חטיף|snack|אחרי האימון|לפני האימון/]];
  var SLOT_HE={b:'ארוחת בוקר',l:'ארוחת צהריים',d:'ארוחת ערב',s:'נשנוש'};
  function slotByHour(h){ return h<5?'s':(h<11?'b':(h<16?'l':(h<22?'d':'s'))); }      // something eaten at two at night is a snack, not a breakfast

  /* ---------- the vocabulary ---------- */
  var V=[], BYK={}, FIRST={}, RECIPES=[], DB=null, DBN=null, DBBY={}, MY=[];
  /* the ways one written word may stand for a vocabulary word: as it is, without a plural ending, without a glued prefix letter */
  function stems(t){
    var out=[t], bases=[t];
    function plural(b){
      if(/^[a-z]/.test(b)){ if(b.length>3&&/s$/.test(b)) out.push(b.slice(0,-1)); if(b.length>4&&/es$/.test(b)) out.push(b.slice(0,-2)); return; }
      if(b.length>3&&/ימ$/.test(b)){ var s=b.slice(0,-2); out.push(s,s+'ה',s+'י'); }
      if(b.length>3&&/ות$/.test(b)){ var s2=b.slice(0,-2); out.push(s2,s2+'ה',s2+'ת',s2+'ית'); }
      if(b.length>4&&/יות$/.test(b)){ var s3=b.slice(0,-3); out.push(s3+'יה',s3+'ית',s3+'י'); }
      if(b.length>2&&/י$/.test(b)){ out.push(b.slice(0,-1),b.slice(0,-1)+'ה'); }                // תפוחי אדמה, גבינת -> construct forms
      if(b.length>2&&/ת$/.test(b)){ out.push(b.slice(0,-1)+'ה'); }
    }
    plural(t);
    if(t.length>2&&'והבלמשכ'.indexOf(t.charAt(0))>=0){ bases.push(t.slice(1)); if(t.length>3&&'הב'.indexOf(t.charAt(1))>=0&&t.charAt(0)==='ו') bases.push(t.slice(2)); }
    for(var i=1;i<bases.length;i++){ out.push(bases[i]); plural(bases[i]); }
    return uniq(out);
  }
  function init(core){
    V=(core&&core.vocab)||[]; RECIPES=(core&&core.recipes)||[]; BYK={}; FIRST={};
    V.forEach(function(e){
      BYK[e.k]=e;
      uniq([e.k].concat(e.a||[]).map(norm)).forEach(function(nm,ix){
        var w=nm.split(' ').filter(Boolean); if(!w.length) return;
        (FIRST[w[0]]=FIRST[w[0]]||[]).push({w:w,e:e,main:ix===0});
      });
    });
    Object.keys(FIRST).forEach(function(k){ FIRST[k].sort(function(a,b){ return b.w.length-a.w.length; }); });
    return V.length;
  }
  function setDb(db){
    DB=db||null; DBN=null; DBBY={};
    if(!DB) return 0;
    DBN=DB.f.map(function(r){ DBBY[r[0]]=r; return [snorm(r[1]),String(r[2]||'').toLowerCase()]; });
    return DB.f.length;
  }
  function setMine(list){ MY=list||[]; }
  function byKey(k){ return BYK[k]||null; }
  function dbRow(id){ return DBBY[id]||null; }
  /* a food as the rest of the app sees it, wherever it came from: {src, key, name, per:[kcal,p,c,f,fibre] for 100 g, u, ug, d, units} */
  function fromVocab(e){ return {src:'v',key:e.k,name:e.k,per:e.n,u:e.u,ug:e.ug,d:e.d,units:unitsOf(e),c:e.c}; }
  function fromDb(r){
    var units={}, u='', ug=0;
    for(var i=0;i+1<r[8].length;i+=2){ var nm=DB.units[r[8][i]]; if(!has(units,nm)){ units[nm]=r[8][i+1]; if(!u){ u=nm; ug=r[8][i+1]; } } }
    return {src:'d',key:r[0],name:r[1],en:r[2],per:[r[3],r[4],r[5],r[6],r[7]],u:u||'g',ug:ug||100,d:units['מנה בינונית']||ug||100,units:units};
  }
  function fromMine(m){ return {src:'m',key:m.id,name:m.n,per:m.per,u:m.u||'g',ug:m.ug||100,d:m.ug||100,units:m.u&&m.ug?(function(){ var o={}; o[m.u]=m.ug; return o; })():{},brand:m.brand||'',code:m.code||''}; }
  function unitsOf(e){ var o={}; if(e.u&&e.u!=='g'&&e.u!=='ml') o[e.u]=e.ug; var x=e.units||{}; Object.keys(x).forEach(function(k){ if(!has(o,k)) o[k]=x[k]; }); return o; }
  function food(src,key){
    if(src==='v'){ var e=BYK[key]; return e?fromVocab(e):null; }
    if(src==='d'){ var r=DBBY[key]; return r?fromDb(r):null; }
    if(src==='m'){ for(var i=0;i<MY.length;i++) if(MY[i].id===key) return fromMine(MY[i]); }
    return null;
  }

  /* ---------- search: the vocabulary first (everyday names), then the person's own foods, then the whole table ---------- */
  function search(q,limit){
    var nq=snorm(q), out=[], seen={}; limit=limit||30; if(!nq) return out;
    var words=nq.split(' ');
    function hit(names){ var best=0; for(var i=0;i<names.length;i++){ var n=names[i]; var s=0; if(n===nq) s=100; else if(n.indexOf(nq)===0) s=85; else if(words.every(function(w){ return n.indexOf(w)>=0; })) s=60; if(s>best) best=s-(i?4:0); } return best; }
    V.forEach(function(e){ var s=hit([snorm(e.k)].concat((e.a||[]).map(snorm))); if(s) out.push([s+20,fromVocab(e)]); seen[e.id]=1; });
    MY.forEach(function(m){ var s=hit([snorm(m.n),snorm((m.brand||'')+' '+m.n)]); if(s) out.push([s+10,fromMine(m)]); });
    if(DB){ var latin=/^[a-z0-9 ]+$/.test(nq);
      for(var i=0;i<DB.f.length;i++){ var he=DBN[i][0], en=DBN[i][1], s=0;
        if(he.indexOf(nq)===0) s=70; else if(words.every(function(w){ return he.indexOf(w)>=0; })) s=50; else if(latin&&words.every(function(w){ return en.indexOf(w)>=0; })) s=45;
        if(!s||seen[DB.f[i][0]]) continue; s-=Math.min(20,he.length/5);
        out.push([s,fromDb(DB.f[i])]); } }
    out.sort(function(a,b){ return b[0]-a[0]; });
    return out.slice(0,limit).map(function(x){ return x[1]; });
  }

  /* ---------- amounts ---------- */
  function per(p,g){ var k=g/100; return {k:Math.round(p[0]*k),p:r1(p[1]*k),c:r1(p[2]*k),f:r1(p[3]*k)}; }
  function sum(list){ var t={k:0,p:0,c:0,f:0}; (list||[]).forEach(function(x){ var e=x.e||x; t.k+=+e[0]||+e.k||0; t.p+=+e[1]||+e.p||0; t.c+=+e[2]||+e.c||0; t.f+=+e[3]||+e.f||0; }); return {k:Math.round(t.k),p:r1(t.p),c:r1(t.c),f:r1(t.f)}; }
  /* grams for "q units of this food"; est says the weight is a household guess and not the food's own figure */
  function gramsFor(fd,q,u){
    if(u==='g'||u==='ml') return {g:q,est:false};
    if(u==='kg'||u==='l') return {g:q*1000,est:false};
    var m=fd.units||{};
    if(u&&has(m,u)) return {g:q*m[u],est:false};
    if(u==='יח'||!u) return {g:q*(fd.u==='g'||fd.u==='ml'?fd.d:fd.ug),est:!u?false:fd.u!=='יח'};
    if(u==='מנה') return {g:q*fd.d,est:true};
    if(u==='שקית'||u==='קופסה'){ var e=BYK[fd.key]; if(e&&e.pk&&e.pu!=='יח') return {g:q*e.pk,est:false}; }
    return {g:q*(GENERIC[u]||fd.d),est:true};
  }
  function fmtG(g){ return g>=1000?(r1(g/1000)+' ק״ג'):(Math.round(g)+' ג׳'); }
  /* "2 ביצים", "קוטג׳, 125 ג׳", "3 כפות אורז": how one item is said back */
  function label(it){
    var u=it.u, q=it.q;
    if(q&&u&&u!=='g'&&u!=='ml'&&u!=='kg'&&u!=='l'){ var qs=String(r1(q)); return u==='יח'?(q===1?it.name:(it.name+' ×'+qs)):(qs+' '+((q>1&&UNIT_PL[u])||u)+' '+it.name); }
    return it.name+', '+fmtG(it.g);
  }

  /* ---------- one sentence -> foods ---------- */
  var COUNTED={'יח':1,'פרוסה':1,'כדור':1,'פיתה':1};
  function bareGrams(fd,q){ return q>=25&&!(COUNTED[fd.u]&&q*fd.ug<=2500); }
  function matchAt(T,i){
    var t=T[i]; if(!t||t.k!=='w') return null; var cand=stems(t.n), best=null;
    if(t.and) cand=stems(norm(t.raw)).concat(cand);      // the number reader took a leading "ו" off ("וודקה" became "דקה"): the whole word comes first
    for(var c=0;c<cand.length;c++){ var list=FIRST[cand[c]]; if(!list) continue;
      for(var j=0;j<list.length;j++){ var ph=list[j], ok=true;
        for(var k=1;k<ph.w.length;k++){ var nx=T[i+k]; if(!nx||nx.k!=='w'||stems(nx.n).indexOf(ph.w[k])<0){ ok=false; break; } }
        if(!ok) continue;
        var sc=ph.w.length*10-c+(ph.main?1:0);
        if(!best||sc>best.sc) best={sc:sc,e:ph.e,len:ph.w.length};
        break; } }      // the list is longest first: the first that fits is the longest for this spelling
    return best;
  }
  function parse(text,opts){
    opts=opts||{}; var raw=String(text||'');
    var slot=''; for(var s=0;s<SLOT_RX.length;s++){ if(SLOT_RX[s][1].test(raw)){ slot=SLOT_RX[s][0]; break; } }
    var back=/אתמול|yesterday/.test(raw)?1:0;
    if(/^(עוד )?לא (אכלתי|שתיתי)/.test(raw.trim())) return {items:[],rest:[],conf:0,slot:slot,back:back,sum:sum([])};
    var src=pct(raw).replace(/½/g,' 0.5 ').replace(/¼/g,' 0.25 ').replace(/¾/g,' 0.75 ').replace(/(\d)\s*\/\s*(\d)/g,function(m,a,b){ return ' '+(Math.round(a/b*100)/100)+' '; });
    /* commas and line ends close an item: a number after them belongs to the next food, a number before them to the last one */
    var T=[]; src.split(/[,،;\n]+|\s\+\s/).forEach(function(seg){ var L=VL.words(seg); if(L.length){ L.forEach(function(x){ T.push(x); }); T.push({k:'|'}); } });
    var items=[], rest=[], P={q:null,u:'',mod:1,skip:false}, content=0, matched=0, lastItem=null;
    function reset(){ P={q:null,u:'',mod:1,skip:false}; }
    function emit(e,len){
      var fd=fromVocab(e), q=P.q, u=P.u, g, est=false, r;
      if(q!=null&&!u&&bareGrams(fd,q)){ u='g'; }                         // "200 עוף": a bare large number is grams
      if(q==null&&!u){ g=fd.d*P.mod; est=true; if(P.mod===0.5&&(e.c==='fat'||e.c==='sauce')) g=Math.min(g,fd.d*0.5); }
      else { if(q==null) q=1; r=gramsFor(fd,q,u||fd.u); g=r.g*P.mod; est=r.est||P.mod!==1; if(!u) u=(fd.u==='g'||fd.u==='ml')?'':fd.u; }
      var it={k:e.k,name:e.k,g:r1(g),q:(q!=null&&u&&u!=='g'&&u!=='ml'&&u!=='kg'&&u!=='l')?q*P.mod:null,u:u||'',est:est,c:e.c};
      var n=per(e.n,it.g); it.e=[n.k,n.p,n.c,n.f];
      if(!P.skip){ items.push(it); lastItem=it; } else lastItem=null;
      matched+=len; reset();
    }
    for(var i=0;i<T.length;i++){
      var t=T[i];
      if(t.k==='|'){ reset(); lastItem=null; continue; }
      if(t.k==='n'){
        if(t.and&&P.u&&P.q==null){ P.q=1+t.v; continue; }                // "כוס וחצי"
        if(t.and&&P.q!=null){ P.q+=t.v; continue; }                       // "שתי כוסות וחצי"
        /* a number that closes an item: "עוף 200 גרם", "ביצים 2" */
        var nx=T[i+1], un=nx&&nx.k==='w'?UNIT[nx.n]:'';
        if(lastItem&&lastItem.q==null&&lastItem.est&&P.q==null&&!P.u){
          var after=T[i+(un?2:1)];
          if(!after||after.k==='|'||(un&&!matchAt(T,i+2))){ regrams(lastItem,t.v,un||''); i+=un?1:0; lastItem=null; continue; }
        }
        P.q=t.v; continue;
      }
      var n=t.n;
      if(n.length>2&&n.charAt(0)==='ו'&&!matchAt(T,i)&&(has(UNIT,n.slice(1))||has(SMALL,n.slice(1))||has(BIG,n.slice(1))||has(TINY,n.slice(1))||has(NOT,n.slice(1))||has(PAIR,n.slice(1)))) n=n.slice(1);
      if(/^pct[a-jp]+$/.test(n)&&!matchAt(T,i)) continue;      // a fat percentage the vocabulary has no separate entry for
      if(has(NOT,n)){ P.skip=true; continue; }
      if(has(SMALL,n)){ P.mod=0.5; continue; } if(has(BIG,n)){ if(lastItem&&P.q==null&&!P.u){ scale(lastItem,1.5); continue; } P.mod=1.5; continue; }
      if(has(TINY,n)){ if(lastItem&&P.q==null&&!P.u){ scale(lastItem,0.7); continue; } P.mod=0.7; continue; }
      if(has(PAIR,n)){ P.q=2; continue; }
      var m=matchAt(T,i);
      if(m&&!(has(UNIT,n)&&P.q!=null&&!P.u&&matchAt(T,i+1))){ content+=m.len; emit(m.e,m.len); i+=m.len-1; continue; }      // "2 פיתות" is the food; "2 כוסות אורז" is a unit
      if(has(UNIT,n)){ P.u=UNIT[n]; continue; }
      if(has(FILL,n)||(n.length>1&&'וה'.indexOf(n.charAt(0))>=0&&has(FILL,n.slice(1)))) continue;
      content++; rest.push(t.raw); lastItem=null;
    }
    function regrams(it,q,u){
      var e=BYK[it.k], fd=fromVocab(e); if(!u&&bareGrams(fd,q)) u='g';
      var r=gramsFor(fd,q,u||fd.u); it.g=r1(r.g); it.est=r.est; it.u=u||((fd.u==='g'||fd.u==='ml')?'':fd.u); it.q=(it.u&&it.u!=='g'&&it.u!=='ml'&&it.u!=='kg'&&it.u!=='l')?q:null;
      var n=per(e.n,it.g); it.e=[n.k,n.p,n.c,n.f];
    }
    function scale(it,f){ var e=BYK[it.k]; it.g=r1(it.g*f); if(it.q!=null) it.q=r1(it.q*f); it.est=true; var n=per(e.n,it.g); it.e=[n.k,n.p,n.c,n.f]; }
    var conf=content?matched/content:0;
    return {items:items,rest:rest,conf:conf,slot:slot||(opts.hour!=null?slotByHour(opts.hour):''),back:back,sum:sum(items)};
  }
  /* the same reading for "what I have at home": amounts are kept the way food is bought (grams, millilitres or pieces) */
  function parsePantry(text){
    var R=parse(String(text||'').replace(/יש לי|יש לנו|יש בבית|במקרר|במקפיא|בארון|בבית|קניתי|נשאר לי|נשארו לי|i have|we have|bought/g,' ')), out=[];
    R.items.forEach(function(it){ var e=BYK[it.k]; if(!e) return; out.push(pantryItem(e,it)); });
    return {items:out,rest:R.rest,conf:R.conf};
  }
  function pantryItem(e,it){
    var count=e.pu==='יח'||(e.u==='יח'&&!e.raw&&e.pu!=='g'&&e.pu!=='ml');
    if(it.est&&it.q==null) return {k:e.k,n:e.k,q:null,u:count?'יח':(e.pu==='ml'?'ml':'g')};          // "יש לי אורז": there is some, the amount is not known
    if(count){ var q=it.q!=null&&it.u==='יח'?it.q:Math.max(1,Math.round(it.g/(e.ug||it.g||1))); return {k:e.k,n:e.k,q:q,u:'יח'}; }
    /* what is said about a food that is cooked at home is its weight as bought: "קילו אורז" is a kilo of dry rice */
    var g=it.g; if(e.raw&&e.y&&it.u&&it.u!=='g'&&it.u!=='kg'&&it.u!=='ml'&&it.u!=='l') g=it.g/e.y;
    return {k:e.k,n:e.k,q:Math.round(g),u:e.pu==='ml'?'ml':'g'};
  }

  /* ---------- how much to eat ---------- */
  var NGOALS=[['lose','ירידה במשקל','פחות קלוריות ממה שהגוף שורף, עם הרבה חלבון'],['muscle','בניית שריר','מעט מעל התחזוקה, חלבון גבוה'],['gain','עלייה במסה','עודף מבוקר, כדי לעלות לאט'],['keep','שמירה על המשקל','לאכול כמה שהגוף שורף'],['habits','הרגלים טובים יותר','בלי לספור הרבה: סדר, ירקות וחלבון']];
  function bmrOf(p){ var w=+p.weight||0,h=+p.height||0,a=+p.age||0; if(!w||!h||!a) return 0; return p.sex==='f'?10*w+6.25*h-5*a-161:10*w+6.25*h-5*a+5; }
  function actOf(p){ var wk=+p.weekly||3; return +p.activity||(wk<=1?1.2:wk<=2?1.375:wk<=4?1.55:wk<=6?1.725:1.9); }
  /* T: {ok, kcal, p, c, f, bmr, tdee, goal, notes[], custom, floor, rate}. Never below 1,200 (women) or 1,500 (men) kcal, no deficit under 18 or under BMI 18.5.
     nut.rate (kg a week, optional): the pace a weight goal asks for. With it the day's calories come from that pace (a kilo of body weight is about
     7,700 kcal, so a kilo a week is 1,100 a day) instead of from a fixed share of what the body burns: this is how the goal page and this page
     show one number. Losing is never faster than 1% of body weight a week, gaining never more than 400 kcal over. */
  function targets(profile,nut){
    nut=nut||{}; var p=profile||{}, bmr=bmrOf(p); if(!bmr) return {ok:false};
    var w=+p.weight, h=+p.height/100, bmi=w/(h*h), tdee=bmr*actOf(p), goal=nut.goal||'keep', notes=[], floor=p.sex==='f'?1200:1500;
    if(nut.custom&&nut.custom.kcal>0){ var c=nut.custom; return {ok:true,custom:true,kcal:Math.round(c.kcal),p:Math.round(c.p),c:Math.round(c.c),f:Math.round(c.f),bmr:Math.round(bmr),tdee:Math.round(tdee),goal:goal,notes:notes,bmi:r1(bmi),floor:floor}; }
    var factor={lose:nut.pace==='slow'?0.9:(nut.pace==='fast'?0.78:0.83),muscle:1.05,gain:1.1,keep:1,habits:1}[goal]||1, guard=false;
    if(goal==='lose'&&(+p.age||0)<18){ factor=1; guard=true; notes.push('מתחת לגיל 18 האפליקציה לא בונה תפריט לירידה במשקל. היעד כאן הוא תחזוקה, וכדאי להתייעץ עם רופא או דיאטנית.'); }
    if(goal==='lose'&&bmi<18.5){ factor=1; guard=true; notes.push('לפי הגובה והמשקל שלך אין מקום לירידה נוספת. היעד כאן הוא תחזוקה.'); }
    var kcal=tdee*factor, rate=+nut.rate>0&&!guard&&(goal==='lose'||goal==='muscle'||goal==='gain')?+nut.rate:0;
    if(rate){ kcal=goal==='lose'?tdee-Math.min(rate,0.01*w)*1100:tdee+Math.min(rate*1100,400); factor=kcal/tdee; }
    if(kcal<floor){ kcal=floor; notes.push('היעד הועלה ל-'+floor+' קק״ל, הרצפה הבטוחה. מתחת לזה קשה לקבל את כל מה שהגוף צריך.'); }
    var ref=bmi>30?27*h*h:w;                                          // above BMI 30 protein is counted for a reference weight, not for all of the body weight
    var pg=ref*({lose:2,muscle:1.8,gain:1.8,keep:1.6,habits:1.4}[goal]||1.6), fg=Math.max(ref*0.9,kcal*0.2/9); fg=Math.min(fg,kcal*0.35/9);
    var cg=Math.max(0,(kcal-pg*4-fg*9)/4);
    return {ok:true,kcal:Math.round(kcal/10)*10,p:Math.round(pg/5)*5,c:Math.round(cg/5)*5,f:Math.round(fg/5)*5,bmr:Math.round(bmr),tdee:Math.round(tdee),goal:goal,notes:notes,bmi:r1(bmi),factor:factor,floor:floor,rate:rate};
  }
  /* a training day gets a little more (as carbohydrates) and a rest day a little less, so that the week adds up to the same total.
     A rest day never goes under the safe floor: there the day simply stays at the floor. */
  function dayTargets(T,training,weekly,on){
    if(!T||!T.ok||!on) return T; var t=Math.max(1,Math.min(6,+weekly||3)), up=Math.round(T.kcal*0.06/10)*10, d=training?up:-Math.round(up*t/(7-t)/10)*10;
    if(d<0&&T.floor&&T.kcal+d<T.floor) d=Math.min(0,T.floor-T.kcal);
    return {ok:true,kcal:T.kcal+d,p:T.p,c:Math.max(0,T.c+Math.round(d/4/5)*5),f:T.f,bmr:T.bmr,tdee:T.tdee,goal:T.goal,notes:T.notes,shift:d,training:!!training,floor:T.floor,rate:T.rate,custom:T.custom};
  }
  /* where a day stands against its target. "low" is said when a person eats far less than the plan: that is not a success here */
  function judgeDay(tot,T){
    if(!T||!T.ok||!tot||!tot.k) return {state:'none'};
    var r=tot.k/T.kcal, pr=T.p?tot.p/T.p:1;
    return {state:r<0.75?'low':(r<0.9?'under':(r<=1.1?'ok':'over')),ratio:r,protein:pr,hitP:pr>=0.9,left:{k:Math.round(T.kcal-tot.k),p:Math.round(T.p-tot.p),c:Math.round(T.c-tot.c),f:Math.round(T.f-tot.f)}};
  }

  /* ---------- the diary: one document a month, days inside it ---------- */
  function monthKey(d){ return 'food-'+d.slice(0,7); }
  function dayOf(docs,d){ var doc=docs&&docs[d.slice(0,7)]; return (doc&&doc.days&&doc.days[d.slice(8)])||null; }
  function mealsOf(docs,d){ var day=dayOf(docs,d); return (day&&day.m)||[]; }
  function totalsOf(docs,d){ var all=[]; mealsOf(docs,d).forEach(function(m){ (m.it||[]).forEach(function(x){ all.push(x); }); }); return sum(all); }
  function addMeal(docs,d,meal){
    var mk=d.slice(0,7), doc=docs[mk]||(docs[mk]={days:{}}), dd=d.slice(8), day=doc.days[dd]||(doc.days[dd]={m:[]});
    day.m.push(meal); day.m.sort(function(a,b){ return (a.at||0)-(b.at||0); }); return doc;
  }
  function removeMeal(docs,d,id){ var day=dayOf(docs,d); if(!day) return null; day.m=day.m.filter(function(m){ return m.id!==id; }); return docs[d.slice(0,7)]; }
  function daysLogged(docs){ var out=[]; Object.keys(docs||{}).forEach(function(mk){ var ds=(docs[mk]&&docs[mk].days)||{}; Object.keys(ds).forEach(function(dd){ if(ds[dd]&&ds[dd].m&&ds[dd].m.length) out.push(mk+'-'+dd); }); }); return out.sort(); }
  /* what was eaten most lately, once each: the quick list under the search box */
  function recent(docs,limit){
    var seen={}, out=[], days=daysLogged(docs).reverse();
    for(var i=0;i<days.length&&out.length<(limit||12);i++){ var ms=mealsOf(docs,days[i]).slice().reverse();
      ms.forEach(function(m){ (m.it||[]).slice().reverse().forEach(function(x){ var key=(x.k||x.n); if(seen[key]||out.length>=(limit||12)) return; seen[key]=1; out.push(x); }); }); }
    return out;
  }
  /* a stretch of days against the targets: how many were logged, how many landed in range, the averages */
  function stretch(docs,from,to,targetFor){
    var days=daysLogged(docs).filter(function(d){ return d>=from&&d<to; }), n=days.length, ok=0, hitP=0, k=0, p=0, low=0;
    days.forEach(function(d){ var t=totalsOf(docs,d), J=judgeDay(t,targetFor(d)); k+=t.k; p+=t.p; if(J.state==='ok') ok++; if(J.state==='low') low++; if(J.hitP) hitP++; });
    return {days:n,ok:ok,hitP:hitP,low:low,avgK:n?Math.round(k/n):0,avgP:n?Math.round(p/n):0,list:days};
  }

  return {init:init,setDb:setDb,setMine:setMine,norm:norm,stems:stems,byKey:byKey,dbRow:dbRow,food:food,fromVocab:fromVocab,search:search,per:per,sum:sum,gramsFor:gramsFor,label:label,fmtG:fmtG,
    parse:parse,parsePantry:parsePantry,pantryItem:pantryItem,targets:targets,dayTargets:dayTargets,judgeDay:judgeDay,bmrOf:bmrOf,NGOALS:NGOALS,SLOT_HE:SLOT_HE,slotByHour:slotByHour,UNIT_HE:UNIT_HE,UNIT_PL:UNIT_PL,
    monthKey:monthKey,dayOf:dayOf,mealsOf:mealsOf,totalsOf:totalsOf,addMeal:addMeal,removeMeal:removeMeal,daysLogged:daysLogged,recent:recent,stretch:stretch,
    vocab:function(){ return V; },recipes:function(){ return RECIPES; },hasDb:function(){ return !!DB; }};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=FoodKit;
