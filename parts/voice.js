/* VoiceLog: turns one spoken sentence into a logged set, and into the sentence the assistant says back.
   "בנץ' סט 1, 10 חזרות, 20 קילו"  /  "bench press, set one, ten reps, twenty kilos"
   The same file runs in three places, so it is written in plain ES5 with no DOM and no globals:
   in the app (injected by build.py), in the PocketBase hook on the server (require), and in the tests (node). */
var VoiceLog=(function(){
  var FINALS={'ך':'כ','ם':'מ','ן':'נ','ף':'פ','ץ':'צ'};
  /* same idea as the app's norm(): one spelling for a name, however it was typed or dictated */
  function norm(s){
    return String(s==null?'':s).toLowerCase()
      .replace(/[֑-ׇ]/g,'')
      .replace(/[‎‏‪-‮⁦-⁩]/g,'')
      .replace(/[ךםןףץ]/g,function(c){ return FINALS[c]; })
      .replace(/["'׳״`‘’“”\-־–—.,()\/\\:;!?]/g,' ')
      .replace(/וו/g,'ו').replace(/יי/g,'י').replace(/\s+/g,' ').trim();
  }
  function isHe(s){ return /[א-ת]/.test(String(s||'')); }
  function round(v,step){ return Math.round(v/step)*step; }
  function r2(v){ return Math.round(v*100)/100; }
  function has(o,k){ return Object.prototype.hasOwnProperty.call(o,k); }

  /* ---------- number words ---------- */
  var NUM={};      // normalized word -> [value, kind]   kind: u unit 1-9, t ten..nineteen, T tens, H hundred, h hundreds word, f fraction
  function addNum(v,kind,words){ words.split(' ').forEach(function(w){ NUM[norm(w)]=[v,kind]; }); }
  addNum(0,'z','אפס zero');
  addNum(1,'u','אחד אחת one'); addNum(2,'u','שניים שתיים שנים שתים שני שתי two'); addNum(3,'u','שלוש שלושה three');
  addNum(4,'u','ארבע ארבעה four'); addNum(5,'u','חמש חמישה חמשה five'); addNum(6,'u','שש שישה ששה six');
  addNum(7,'u','שבע שבעה seven'); addNum(8,'u','שמונה eight'); addNum(9,'u','תשע תשעה nine');
  addNum(10,'t','עשר עשרה ten'); addNum(11,'t','eleven'); addNum(12,'t','twelve'); addNum(13,'t','thirteen'); addNum(14,'t','fourteen');
  addNum(15,'t','fifteen'); addNum(16,'t','sixteen'); addNum(17,'t','seventeen'); addNum(18,'t','eighteen'); addNum(19,'t','nineteen');
  addNum(20,'T','עשרים twenty'); addNum(30,'T','שלושים thirty'); addNum(40,'T','ארבעים forty fourty'); addNum(50,'T','חמישים חמשים fifty');
  addNum(60,'T','שישים ששים sixty'); addNum(70,'T','שבעים seventy'); addNum(80,'T','שמונים eighty'); addNum(90,'T','תשעים ninety');
  addNum(100,'H','מאה hundred'); addNum(200,'h','מאתיים'); addNum(100,'x','מאות'); addNum(1000,'K','אלף thousand');
  addNum(0.5,'f','חצי half'); addNum(0.25,'f','רבע quarter');
  var ORD={};
  function addOrd(v,words){ words.split(' ').forEach(function(w){ ORD[norm(w)]=v; }); }
  addOrd(1,'ראשון ראשונה first'); addOrd(2,'שנייה שניה second'); addOrd(3,'שלישי שלישית third'); addOrd(4,'רביעי רביעית fourth');
  addOrd(5,'חמישי חמישית fifth'); addOrd(6,'שישי שישית sixth'); addOrd(7,'שביעי שביעית seventh'); addOrd(8,'שמיני שמינית eighth');
  addOrd(9,'תשיעי תשיעית ninth'); addOrd(10,'עשירי עשירית tenth');

  /* ---------- vocabulary ---------- */
  function setOf(words){ var o={}; words.split(' ').forEach(function(w){ if(w) o[norm(w)]=1; }); return o; }
  var U_KG=setOf('קילו קילוגרם קילוגרמים קג קילוגרמ kg kgs kilo kilos kilogram kilograms');
  var U_LB=setOf('פאונד פאונדים ליברה ליברות lb lbs pound pounds');
  var U_REP=setOf('חזרות חזרה rep reps repetition repetitions');
  var U_SET=setOf('סט סטים set sets'); var U_SETS=setOf('סטים sets');
  var U_MIN=setOf('דקות דקה דק minute minutes min mins');
  var U_SEC=setOf('שניות שנייה שניה sec secs seconds');
  var U_HOUR=setOf('שעה שעות hour hours hr hrs');
  var U_KM=setOf('קילומטר קילומטרים קמ km kms kilometer kilometers kilometre kilometres');
  var U_M=setOf('מטר מטרים meter meters metre metres');
  var U_MILE=setOf('מייל מיילים mile miles');
  var K_WEIGHT=setOf('משקל weight'); var K_NUMBER=setOf('מספר number');
  var C_X=setOf('x כפול by'); var C_ON=setOf('על'); var C_OF=setOf('של of'); var C_AT=setOf('עם at with ב');
  var TIMES=setOf('פעמים times');
  var FILL=setOf('תוסיפי תוסיף תוסיפו הוסף הוסיפי תרשום תרשמי תרשמו רשום רשמי לרשום להוסיף תכתוב תכתבי כתוב לי עכשיו בבקשה עשיתי סיימתי ביצעתי הרמתי את אני גם ואז אז זה זאת היה היו כל לכל היום כרגע ו ה ל ש כן טוב אוקיי אוקי היי הי סירי גוגל ג׳מיני ג׳מיניי סטים של עם על ב אחרי ועוד ' +
    'add log record save write please i did have done just now finished completed a an the my to and then me for it is was in on hey siri google gemini ok okay each per hand hands today so with at of app');
  var UNDO=setOf('בטל תבטל תבטלי בטלי ביטול מחק תמחק תמחקי מחקי למחוק לבטל undo cancel delete remove scratch');
  var UNDO_TAIL=setOf('האחרון האחרונה הרישום הסט last that entry one previous אחרון אחרונה רישום');
  var AGAIN=setOf('עוד שוב נוסף same again another אותו כנל');
  var Q_TODAY=['מה עשיתי','מה רשמתי','מה נרשם','סיכום','what did i','summary','what have i'];

  /* spoken slang and English names as Hebrew dictation writes them -> words that exist in the exercise names */
  var ALIAS=[
    ['בנצ פרס','לחיצת חזה'],['בנצ','לחיצת חזה'],['bench press','לחיצת חזה'],['bench','לחיצת חזה'],['ספסל','לחיצת חזה'],
    ['כריעות','סקוואט'],['כריעה','סקוואט'],['squats','סקוואט'],['squat','סקוואט'],['סקווט','סקוואט'],['סקואט','סקוואט'],
    ['דד ליפט','דדליפט'],['deadlifts','דדליפט'],['deadlift','דדליפט'],['הרמה מהרצפה','דדליפט'],
    ['עליות מתח','פול אפ'],['מתח','פול אפ'],['פולאפ','פול אפ'],['pull ups','פול אפ'],['pull up','פול אפ'],['pullups','פול אפ'],['pullup','פול אפ'],
    ['סנטר','צ ינ אפ'],['chin ups','צ ינ אפ'],['chin up','צ ינ אפ'],
    ['שכיבות שמיכה','שכיבות סמיכה'],['שכיבות','שכיבות סמיכה'],['פושאפ','שכיבות סמיכה'],['פוש אפ','שכיבות סמיכה'],['push ups','שכיבות סמיכה'],['push up','שכיבות סמיכה'],['pushups','שכיבות סמיכה'],
    ['מקבילימ','דיפס'],['dips','דיפס'],['dip','דיפס'],
    ['פרפר','פלאי'],['פליי','פלאי'],['flies','פלאי'],['flyes','פלאי'],['fly','פלאי'],
    ['שולדר פרס','לחיצת כתפימ'],['shoulder press','לחיצת כתפימ'],['אוברהד פרס','לחיצת כתפימ'],['overhead press','לחיצת כתפימ'],['military press','לחיצת כתפימ'],['לחיצת כתפ','לחיצת כתפימ'],
    ['פולי עליונ','לאט פולדאונ'],['פולדאונ','לאט פולדאונ'],['lat pulldown','לאט פולדאונ'],['pulldown','לאט פולדאונ'],['pull down','לאט פולדאונ'],
    ['רואו','חתירה'],['rows','חתירה'],['row','חתירה'],
    ['קרל','כפיפת מרפקימ'],['curls','כפיפת מרפקימ'],['curl','כפיפת מרפקימ'],['יד קדמית','כפיפת מרפקימ'],['ביצפס','כפיפת מרפקימ'],['דו ראשי','כפיפת מרפקימ'],
    ['יד אחורית','טריצפס'],['תלת ראשי','טריצפס'],['פושדאונ','טריצפס'],['pushdown','טריצפס'],['triceps','טריצפס'],['tricep','טריצפס'],
    ['לחיצת רגלימ','לג פרס'],['leg press','לג פרס'],
    ['מכרעימ','לאנג'],['מכרע','לאנג'],['lunges','לאנג'],['lunge','לאנג'],
    ['טראסט','היפ ת ראסט'],['hip thrust','היפ ת ראסט'],['גשר','גלוט ברידג'],
    ['הרמות צד','הרמות צד'],['lateral raise','הרמות צד'],['side raise','הרמות צד'],
    ['פלנק','פלאנק'],['plank','פלאנק'],
    ['בטנ','קרנצ'],['כפיפות בטנ','קרנצ'],['crunches','קרנצ'],['crunch','קרנצ'],['קראנצ','קרנצ'],
    ['רצתי','ריצה'],['לרוצ','ריצה'],['run','ריצה'],['running','ריצה'],['ran','ריצה'],['jog','ריצה'],
    ['הלכתי','הליכה'],['walk','הליכה'],['walking','הליכה'],['walked','הליכה'],
    ['רכבתי','רכיבה על אופנימ'],['אופנימ','רכיבה על אופנימ'],['bike','רכיבה על אופנימ'],['cycling','רכיבה על אופנימ'],['cycled','רכיבה על אופנימ'],
    ['שחיתי','שחיה'],['swim','שחיה'],['swimming','שחיה'],['swam','שחיה'],
    ['הליכונ','ריצה על הליכונ'],['treadmill','ריצה על הליכונ'],
    ['leg extension','פשיטת ברכימ'],['leg curl','כפיפת ברכימ'],['calf raise','הרמות תאומימ'],['תאומימ','הרמות תאומימ']
  ];
  ALIAS=ALIAS.map(function(a){ return [norm(a[0]),norm(a[1])]; });
  /* a bare, common name means the standard exercise ("סקוואט" is the barbell squat, not one of its thirty relatives),
     unless the person's own plan or history points to another one that also fits the words */
  var CANON={};
  [['squat','סקוואט|squat|squats|כריעות|כריעה'],
   ['bench-press','לחיצת חזה|בנץ|בנץ פרס|bench|bench press'],
   ['deadlift','דדליפט|דד ליפט|deadlift|deadlifts'],
   ['pull-up','מתח|עליות מתח|פול אפ|פולאפ|pull up|pull ups|pullup|pullups'],
   ['push-up','שכיבות סמיכה|שכיבות שמיכה|שכיבות|פושאפ|פוש אפ|push up|push ups|pushup|pushups'],
   ['dips','מקבילים|דיפס|dip|dips'],
   ['dumbbell-shoulder-press','לחיצת כתפיים|לחיצת כתף|שולדר פרס|shoulder press|overhead press'],
   ['lat-pulldown','פולי עליון|לאט פולדאון|פולדאון|lat pulldown|pulldown|pull down'],
   ['seated-cable-row','חתירה|row|rows'],
   ['barbell-curl','כפיפת מרפקים|כפיפות מרפקים|יד קדמית|ביצפס|דו ראשי|curl|curls|biceps curl|bicep curl|biceps'],
   ['tricep-pushdown','יד אחורית|טריצפס|תלת ראשי|פשיטת מרפקים|פושדאון|triceps|tricep|pushdown|triceps pushdown|tricep pushdown'],
   ['leg-press','לג פרס|לחיצת רגליים|leg press'],
   ['lunge',"לאנג|לאנג'ים|לאנגים|מכרעים|מכרע|lunge|lunges"],
   ['hip-thrust',"היפ ת'ראסט|היפ טראסט|hip thrust"],
   ['lateral-raise','הרמות צד|הרמת צד|lateral raise|lateral raises|side raise'],
   ['plank','פלאנק|פלנק|plank'],
   ['crunches',"בטן|כפיפות בטן|קרנץ'|קרנץ|crunch|crunches|sit ups|situps"],
   ['standing-calf-raise','תאומים|הרמות תאומים|הרמת תאומים|calf raise|calf raises'],
   ['pec-deck','פרפר|פלאי|פק דק|fly|flies|flyes|pec deck|chest fly'],
   ['running','ריצה|רצתי|run|running|ran|jog'],['walking','הליכה|הלכתי|walk|walking|walked'],['cycling','אופניים|רכיבה|רכבתי|bike|cycling|cycled'],
   ['x-swimming','שחייה|שחיתי|swim|swimming|swam'],['treadmill-running','הליכון|treadmill'],
   ['leg-extension','פשיטת ברכיים|leg extension'],['leg-curl','כפיפת ברכיים|leg curl'],['romanian-deadlift','דדליפט רומני|rdl|romanian deadlift']
  ].forEach(function(c){ c[1].split('|').forEach(function(t){ CANON[norm(t)]=c[0]; }); });

  /* ---------- sentence -> tokens ---------- */
  function tokens(text){
    var s=String(text||'').toLowerCase();
    s=s.replace(/[֑-ׇ]/g,'').replace(/[‎‏‪-‮⁦-⁩]/g,'');
    s=s.replace(/(\d)[.,](\d)/g,'$1\u0001$2');
    s=s.replace(/[×*]/g,' x ');
    s=s.replace(/[.,;:!?()\[\]{}…|\-–—־\/\\+=]/g,' ');
    s=s.replace(/["'׳״`‘’“”]/g,'');
    s=s.replace(/\u0001/g,'.');
    s=s.replace(/(\d)([^\d\s.])/g,'$1 $2').replace(/([^\d\s.])(\d)/g,'$1 $2');
    var out=[]; s.split(/\s+/).forEach(function(t){ if(t) out.push(t); });
    return out;
  }
  /* a leading "ו" (and) glued to a known word: "ועשרים", "וחצי", "ועשיתי" */
  function known(n){ return has(NUM,n)||has(FILL,n)||has(U_KG,n)||has(U_REP,n)||has(U_SET,n)||has(U_MIN,n)||has(U_SEC,n)||has(U_KM,n)||has(U_HOUR,n)||has(K_WEIGHT,n)||has(ORD,n); }
  function lex(text){
    var raw=tokens(text), out=[];
    raw.forEach(function(t){
      if(/^\d+(\.\d+)?$/.test(t)){ out.push({k:'n',v:parseFloat(t),raw:t,dig:true}); return; }
      var n=norm(t); if(!n) return; var and=false;
      if(n.length>1&&n.charAt(0)==='ו'&&!known(n)&&known(n.slice(1))){ n=n.slice(1); and=true; }
      else if(n.length>2&&'בלכמש'.indexOf(n.charAt(0))>=0&&!known(n)&&has(NUM,n.slice(1))) n=n.slice(1);
      else if(n==='and'){ out.push({k:'and'}); return; }
      if(n.length>2&&n.charAt(0)==='ה'&&!known(n)&&(has(ORD,n.slice(1))||has(U_SET,n.slice(1)))) n=n.slice(1);
      out.push({k:'w',n:n,raw:t,and:and});
    });
    return out;
  }
  /* number words -> numbers, joined the way they are spoken: "מאה עשרים וחמש", "twenty five", "שתיים וחצי", "אחת עשרה" */
  function numbers(L){
    var out=[], i=0;
    function numAt(j){ var t=L[j]; if(!t||t.k!=='w') return null; return has(NUM,t.n)?NUM[t.n]:null; }
    while(i<L.length){
      var t=L[i];
      if(t.k==='and'){ i++; continue; }
      if(t.k==='n'){
        var v=t.v, raw=t.raw, j=i+1;
        var skipAnd=(L[j]&&L[j].k==='and')?1:0; var nx=numAt(j+skipAnd); var nt=L[j+skipAnd];
        var a=nt&&nt.k==='w'&&nt.n==='a'&&numAt(j+skipAnd+1)&&numAt(j+skipAnd+1)[1]==='f';
        if(a){ v+=numAt(j+skipAnd+1)[0]; j=j+skipAnd+2; }
        else if(nx&&nx[1]==='f'&&(skipAnd||nt.and)){ v+=nx[0]; j=j+skipAnd+1; }
        out.push({k:'n',v:v,raw:raw,dig:true}); i=j; continue;
      }
      var q=numAt(i);
      if(!q){ out.push(t); i++; continue; }
      var total=0, last='', first=t.n, used=0, k=i, started=false;
      while(k<L.length){
        var c=L[k]; var andTok=false;
        if(c.k==='and'){ if(!started) break; andTok=true; c=L[k+1]; if(!c) break; }
        if(c.k==='w'&&c.n==='a'&&started){ var h=numAt(k+(andTok?2:1)); if(h&&h[1]==='f'&&andTok){ total+=h[0]; k+=andTok?3:2; last='f'; break; } }
        if(c.k!=='w'||!has(NUM,c.n)) break;
        var val=NUM[c.n][0], kind=NUM[c.n][1], joined=andTok||c.and, he=isHe(c.n);
        if(!started){ total=val; last=kind; started=true; k++; continue; }
        if(kind==='f'){ if(!joined) break; total+=val; last='f'; k+=andTok?2:1; break; }
        if(kind==='t'&&last==='u'&&val===10&&he&&!joined){ total+=10; last='t'; k++; continue; }        // שלוש עשרה
        if(kind==='x'&&last==='u'){ total=total*100; last='H'; k++; continue; }                          // שלוש מאות
        if(kind==='H'&&last==='u'&&!he){ total=total*100; last='H'; k+=andTok?2:1; continue; }           // two hundred
        if(kind==='K'&&(last==='u'||last==='t'||last==='T')){ total=total*1000; last='K'; k+=andTok?2:1; continue; }
        if((last==='H'||last==='h'||last==='K')&&(kind==='T'||((kind==='t'||kind==='u')&&(joined||!he)))){ total+=val; last=kind; k+=andTok?2:1; continue; }
        if(last==='T'&&kind==='u'&&(joined||!he)){ total+=val; last='u2'; k+=andTok?2:1; continue; }     // עשרים וחמש / twenty five
        break;
      }
      used=k-i; if(used<1) used=1;
      out.push({k:'n',v:total,raw:first,dig:false,one:(used===1&&first===norm('אחד')),and:!!t.and});
      i+=used;
    }
    return out;
  }

  /* ---------- tokens -> what was said ---------- */
  function parse(text){
    var he=isHe(text); var L=numbers(lex(String(text||'').replace(/[לב]כל יד/g,' ').replace(/(per|each|in each) hand/gi,' ')));
    var F={lang:he?'he':'en',text:String(text||''),reps:null,weight:null,idx:0,count:0,min:null,sec:null,km:null,loose:[],query:'',cmd:'',again:false,hasNum:false};
    var plain=norm(text);
    for(var qi=0;qi<Q_TODAY.length;qi++){ if(plain.indexOf(norm(Q_TODAY[qi]))===0){ F.cmd='today'; return F; } }
    var words=L.filter(function(t){ return t.k==='w'; });
    if(words.length&&has(UNDO,words[0].n)&&!L.some(function(t){ return t.k==='n'; })){
      var rest=words.slice(1).filter(function(t){ return !has(UNDO_TAIL,t.n)&&!has(FILL,t.n)&&!has(U_SET,t.n); });
      if(!rest.length){ F.cmd='undo'; return F; }
    }
    var used=[], i; for(i=0;i<L.length;i++) used.push(false);
    function w(j){ var t=L[j]; return (t&&t.k==='w'&&!used[j])?t.n:''; }
    function isN(j){ return !!(L[j]&&L[j].k==='n'); }
    function addMin(m){ F.min=(F.min||0)+m; }
    /* "דקה וחצי", "5 קילומטר וחצי": a half or a quarter said after the unit belongs to it */
    function fracAt(j){ var t=L[j]; if(t&&t.k==='n'&&t.and&&t.v>0&&t.v<1&&!used[j]){ used[j]=true; return t.v; } return 0; }
    // pass 1: a number with the unit right after it, or the keyword right before it
    for(i=0;i<L.length;i++){
      if(!isN(i)||used[i]) continue; F.hasNum=true; var v=L[i].v, a=w(i+1), b=w(i-1), b2=w(i-2), done=true;
      if(a&&(has(U_KG,a)||has(U_MIN,a)||has(U_HOUR,a)||has(U_KM,a))) v+=fracAt(i+2);
      if(a&&has(U_KG,a)){ F.weight=v; used[i+1]=true; }
      else if(a&&has(U_LB,a)){ F.weight=round(v*0.45359237,0.5); used[i+1]=true; }
      else if(a&&has(U_REP,a)){ F.reps=v; used[i+1]=true; }
      else if(a&&has(U_SET,a)){ F.count=v; used[i+1]=true; }
      else if(a&&has(U_MIN,a)){ addMin(v); used[i+1]=true; }
      else if(a&&has(U_HOUR,a)){ addMin(v*60); used[i+1]=true; }
      else if(a&&has(U_SEC,a)){ F.sec=(F.sec||0)+v; used[i+1]=true; }
      else if(a&&has(U_KM,a)){ F.km=(F.km||0)+v; used[i+1]=true; }
      else if(a&&has(U_M,a)){ F.km=(F.km||0)+v/1000; used[i+1]=true; }
      else if(a&&has(U_MILE,a)){ F.km=(F.km||0)+r2(v*1.609344); used[i+1]=true; }
      else if(a&&has(TIMES,a)&&!isN(i+2)){ F.reps=v; used[i+1]=true; }
      else if(b&&has(U_SET,b)){ if(L[i].one) F.count=1; else F.idx=v; used[i-1]=true; }
      else if(b&&has(K_NUMBER,b)&&b2&&has(U_SET,b2)){ F.idx=v; used[i-1]=true; used[i-2]=true; }
      else if(b&&has(K_WEIGHT,b)){ F.weight=v; used[i-1]=true; }
      else if(b&&has(U_REP,b)){ F.reps=v; used[i-1]=true; }
      else done=false;
      if(done) used[i]=true;
    }
    // ordinals next to the word "set": "סט שני", "first set"
    for(i=0;i<L.length;i++){
      var o=w(i); if(!o||!has(ORD,o)) continue; var ov=ORD[o];
      if(has(U_SET,w(i-1))){ F.idx=ov; used[i]=true; used[i-1]=true; }
      else if(has(U_SET,w(i+1))){ F.idx=ov; used[i]=true; used[i+1]=true; }
    }
    // unit words that stand alone: "שעה", "חצי שעה" was a number; "דקה" alone is one minute
    for(i=0;i<L.length;i++){
      var u=w(i); if(!u) continue;
      if(has(U_HOUR,u)&&!isN(i-1)){ addMin(60*(1+fracAt(i+1))); used[i]=true; F.hasNum=true; }
      else if(u===norm('שעתיים')){ addMin(120); used[i]=true; F.hasNum=true; }
      else if(u===norm('דקה')&&!isN(i-1)){ addMin(1+fracAt(i+1)); used[i]=true; F.hasNum=true; }
    }
    // pass 2: two free numbers joined by a word: "3 על 10", "3 סטים של 10", "10 עם 20", "60 x 5"
    for(i=0;i<L.length;i++){
      if(!isN(i)||used[i]) continue; var c=w(i+1); if(!c||!isN(i+2)||used[i+2]) continue; var A=L[i].v, B=L[i+2].v, hit=true;
      var whole=function(x){ return Math.floor(x)===x; };
      if(has(C_OF,c)){ F.count=A; F.reps=B; }
      else if(has(C_AT,c)){ F.reps=A; F.weight=B; }
      else if(has(C_ON,c)){ if(A<=5&&B<=20&&whole(B)&&whole(A)){ F.count=A; F.reps=B; } else { F.reps=A; F.weight=B; } }
      else if(has(C_X,c)||has(TIMES,c)){ if(A>12||!whole(A)){ F.weight=A; F.reps=B; } else if(A<=6&&B<=30){ F.count=A; F.reps=B; } else { F.reps=A; F.weight=B; } }
      else hit=false;
      if(hit){ used[i]=used[i+1]=used[i+2]=true; }
    }
    // "3 סטים של 10": the count is bound, the 10 is still free and follows "של"
    for(i=0;i<L.length;i++){ if(isN(i)&&!used[i]&&has(C_OF,w(i-1))&&F.reps==null&&F.count){ F.reps=L[i].v; used[i]=true; } }
    for(i=0;i<L.length;i++){ if(isN(i)&&!used[i]) F.loose.push(L[i].v); }
    var q=[];
    for(i=0;i<L.length;i++){
      var t=L[i]; if(t.k!=='w'||used[i]) continue; var n=t.n;
      if(has(AGAIN,n)){ F.again=true; continue; }
      if(has(FILL,n)||has(U_KG,n)||has(U_LB,n)||has(U_REP,n)||has(U_SET,n)||has(U_MIN,n)||has(U_SEC,n)||has(U_KM,n)||has(U_M,n)||has(U_HOUR,n)||has(K_WEIGHT,n)||has(K_NUMBER,n)||has(C_X,n)||has(TIMES,n)) continue;
      q.push(n);
    }
    F.query=q.join(' ');
    return F;
  }

  /* ---------- exercise kinds (the same tests the app uses) ---------- */
  var TIMED_RX=/plank|hold|isometric|wall-sit|dead-hang|l-sit|hollow|flexed-arm-hang/;
  function isCardio(e){ return !!e&&(e.g==='cardio'||e.cat==='cardio'); }
  function isTimed(e){ return !!e&&!isCardio(e)&&(e.cat==='stretching'||TIMED_RX.test(e.id||'')); }
  var BW_EQ={none:1,pull_up_bar:1,dip_station:1,rings:1,suspension_trainer:1,plyo_box:1,jump_rope:1};
  function isBw(e){ return !!e&&(!!e.bw||(!e.custom&&BW_EQ[e.eq]===1)); }

  /* ---------- finding the exercise ---------- */
  function buildIndex(list){
    var ix={list:[],byId:{}};
    (list||[]).forEach(function(e){ if(!e||!e.id) return; var he=norm(e.he), en=norm(e.en||''); var x={e:e,he:he,en:en,hw:he?he.split(' '):[],ew:en?en.split(' '):[]}; ix.list.push(x); ix.byId[e.id]=e; });
    return ix;
  }
  function lev1(a,b){ if(a===b) return true; var la=a.length, lb=b.length; if(Math.abs(la-lb)>1) return false; var i=0,j=0,ed=0; while(i<la&&j<lb){ if(a.charAt(i)===b.charAt(j)){ i++; j++; continue; } if(++ed>1) return false; if(la>lb) i++; else if(lb>la) j++; else { i++; j++; } } return ed+(la-i)+(lb-j)<=1; }
  function wordIn(wd,arr){ for(var i=0;i<arr.length;i++){ var x=arr[i]; if(x===wd||x===wd+'s'||x+'s'===wd) return 2; } if(wd.length>=4){ for(var j=0;j<arr.length;j++){ var y=arr[j]; if(lev1(y,wd)||(y.length>wd.length&&lev1(y.slice(0,wd.length),wd))) return 1; } } return 0; }
  function textScore(t,x){
    if(!t) return 0;
    if(x.he===t||x.en===t) return 100;
    var tw=t.split(' ');
    if(x.he.indexOf(t+' ')===0) return 90-Math.min(8,x.hw.length-tw.length);
    if(x.en.indexOf(t+' ')===0) return 86-Math.min(8,x.ew.length-tw.length);
    var exactH=0, softH=0, exactE=0, softE=0;
    tw.forEach(function(wd){ var a=wordIn(wd,x.hw), b=wordIn(wd,x.ew); if(a===2) exactH++; if(a) softH++; if(b===2) exactE++; if(b) softE++; });
    if(exactH===tw.length) return 80-Math.min(10,2*(x.hw.length-tw.length));
    if(exactE===tw.length) return 78-Math.min(10,2*(x.ew.length-tw.length));
    if(softH===tw.length) return 58-Math.min(8,x.hw.length-tw.length);
    if(softE===tw.length) return 56-Math.min(8,x.ew.length-tw.length);
    var mixed=0; tw.forEach(function(wd){ if(wordIn(wd,x.hw)||wordIn(wd,x.ew)) mixed++; });
    if(mixed===tw.length) return 54;
    if(tw.length>=2&&mixed>=tw.length-1&&mixed>=1) return 34;
    return 0;
  }
  /* env.plan: ids planned for today; env.logs: {id:{sessions}}; env.stars, env.popular: {id:1} */
  function match(query,ix,env){
    var q=norm(query); if(!q) return null; env=env||{};
    var terms=[[q,1]];
    ALIAS.forEach(function(a){
      var k=a[0], pos=(' '+q+' ').indexOf(' '+k+' ');
      if(pos<0) return; var alt=norm((' '+q+' ').replace(' '+k+' ',' '+a[1]+' '));
      if(alt&&!terms.some(function(t){ return t[0]===alt; })) terms.push([alt,0.95]);
    });
    var canon=''; terms.forEach(function(t){ if(!canon&&has(CANON,t[0])&&ix.byId[CANON[t[0]]]) canon=CANON[t[0]]; });
    var plan={}, logs=env.logs||{}, stars=env.stars||{}, pop=env.popular||{}, today=env.date||'';
    (env.plan||[]).forEach(function(id){ plan[id]=1; });
    var scored=[];
    ix.list.forEach(function(x){
      var ts=0; terms.forEach(function(t){ var s=textScore(t[0],x)*t[1]; if(s>ts) ts=s; });
      if(canon&&x.e.id===canon&&ts<97) ts=97;
      if(!ts) return;
      var id=x.e.id, pr=0, l=logs[id], ss=(l&&l.sessions)||[];
      if(plan[id]) pr+=25;
      if(ss.length){ pr+=5; var lastD=ss[ss.length-1].d; if(lastD===today) pr+=12; else if(today&&daysBetween(lastD,today)<=30) pr+=8; }
      if(stars[id]) pr+=3; if(pop[id]) pr+=4; if(x.e.custom) pr+=2;
      scored.push({id:id,text:ts,score:ts+pr});
    });
    if(!scored.length) return null;
    scored.sort(function(a,b){ return b.score-a.score||b.text-a.text; });
    var best=scored[0]; if(best.text<50&&!(best.text>=34&&best.score-best.text>=25)) return null;
    var alt=scored.slice(1,4).filter(function(s){ return s.score>=best.score-12; }).map(function(s){ return s.id; });
    return {id:best.id,text:best.text,score:best.score,conf:best.text>=78?'high':(best.text>=54?'mid':'low'),alt:alt};
  }
  function daysBetween(a,b){ var x=Date.parse(a+'T00:00:00Z'), y=Date.parse(b+'T00:00:00Z'); if(isNaN(x)||isNaN(y)) return 9999; return Math.round((y-x)/86400000); }

  /* ---------- the log ---------- */
  function workSets(sess){ return ((sess&&sess.sets)||[]).filter(function(x){ return x.k!=='w'; }); }
  function sessOn(log,d){ var ss=(log&&log.sessions)||[]; for(var i=0;i<ss.length;i++) if(ss[i].d===d) return ss[i]; return null; }
  function prevSess(log,d){ var ss=(log&&log.sessions)||[], out=null; for(var i=0;i<ss.length;i++){ var s=ss[i]; if(s.d<d&&workSets(s).some(function(x){ return (+x.r>0)||(+x.w>0); })) out=s; } return out; }
  /* writes the item into the log (same shape the app writes) and says which set it became */
  function applyItem(log,item){
    log=log||{sessions:[]}; if(!log.sessions) log.sessions=[];
    var s=sessOn(log,item.d), fresh=!s; if(!s){ s={d:item.d,sets:[]}; log.sessions.push(s); log.sessions.sort(function(a,b){ return a.d<b.d?-1:(a.d>b.d?1:0); }); }
    var sets=item.sets||[], replaced=false, setNo=0;
    sets.forEach(function(x){
      var w=workSets(s), slot=-1, j;
      if(item.idx&&sets.length===1&&item.idx<=w.length) slot=item.idx-1;
      else { for(j=0;j<w.length;j++){ if(!w[j].t){ slot=j; break; } } }
      if(slot>=0){ var t=w[slot]; if(t.t) replaced=true; t.r=x.r; t.w=x.w; t.t=true; setNo=slot+1; }
      else { s.sets.push({r:x.r,w:x.w,t:true}); setNo=workSets(s).length; }
    });
    if(log.sessions.length>80) log.sessions=log.sessions.slice(-80);
    return {log:log,setNo:setNo,replaced:replaced,fresh:fresh,count:sets.length};
  }
  function clone(o){ return JSON.parse(JSON.stringify(o||null)); }
  function e1rm(w,r){ return r>0?w*(1+r/30):w; }

  /* ---------- numbers -> a set, for this kind of exercise ---------- */
  function resolve(F,e,log,date){
    var cardio=isCardio(e), timed=isTimed(e), loose=F.loose.slice();
    var todayS=sessOn(log,date), todayW=todayS?workSets(todayS).filter(function(x){ return x.t; }):[], prev=prevSess(log,date), prevW=prev?workSets(prev):[];
    var inherit={};
    if(cardio){
      var min=F.min, km=F.km; if(F.sec) min=(min||0)+F.sec/60;
      if(min==null&&loose.length) min=loose.shift();
      if(km==null&&loose.length) km=loose.shift();
      if(min==null&&km==null){ if(F.again&&(todayW.length||prevW.length)){ var c0=todayW.length?todayW[todayW.length-1]:prevW[prevW.length-1]; min=c0.r; km=c0.w; inherit.all=1; } else return {err:'nonum'}; }
      min=r2(min||0); km=r2(km||0);
      if(min<0||min>900||km<0||km>400) return {err:'range'};
      return {sets:[{r:min,w:km}],idx:0,inherit:inherit,kind:'cardio'};
    }
    if(timed){
      var sec=F.sec; if(F.min) sec=(sec||0)+F.min*60; if(sec==null&&F.reps!=null) sec=F.reps; if(sec==null&&loose.length) sec=loose.shift();
      if(sec==null){ var t0=todayW.length?todayW[todayW.length-1]:(prevW.length?prevW[prevW.length-1]:null); if(t0&&(F.again||F.count)){ sec=t0.r; inherit.r=1; } else return {err:'nonum'}; }
      sec=Math.round(sec); if(sec<1||sec>7200) return {err:'range'};
      var tw=F.weight!=null?F.weight:0; var tn=Math.max(1,Math.min(10,Math.round(F.count||1))); var ts=[]; for(var a=0;a<tn;a++) ts.push({r:sec,w:tw});
      return {sets:ts,idx:tn===1?(F.idx||0):0,inherit:inherit,kind:'timed'};
    }
    var reps=F.reps, weight=F.weight, count=F.count||0;
    if(loose.length>=3&&reps==null&&weight==null&&!count&&loose[0]<=10&&Math.floor(loose[0])===loose[0]){ count=loose[0]; reps=loose[1]; weight=loose[2]; loose=loose.slice(3); }   // "5 5 100"
    if(loose.length>=2&&reps==null&&weight==null){
      var A=loose[0], B=loose[1], frac=function(x){ return Math.floor(x)!==x; };
      if((frac(A)||A>30)&&!frac(B)){ weight=A; reps=B; } else { reps=A; weight=B; }
      loose=loose.slice(2);
    }
    if(loose.length&&reps==null){ reps=loose.shift(); }
    if(loose.length&&weight==null){ weight=loose.shift(); }
    var nextNo=todayW.length+1; var ref=null;
    if(todayW.length) ref=todayW[todayW.length-1]; else if(prevW.length) ref=prevW[Math.min(prevW.length,nextNo)-1];
    if(reps==null){ if(ref&&+ref.r>0){ reps=+ref.r; inherit.r=1; } else return {err:'noreps'}; }
    var bw=isBw(e);
    if(weight==null){ if(bw&&!(ref&&+ref.w>0)) weight=0; else if(ref){ weight=+ref.w||0; if(weight) inherit.w=1; } else if(bw) weight=0; else return {err:'noweight'}; }
    reps=Math.round(reps); weight=r2(weight);
    if(reps<1||reps>300||weight<0||weight>600) return {err:'range'};
    var n=Math.max(1,Math.min(10,Math.round(count||1))); var sets=[]; for(var i=0;i<n;i++) sets.push({r:reps,w:weight});
    return {sets:sets,idx:n===1?(F.idx||0):0,inherit:inherit,kind:'lift'};
  }

  /* ---------- how does it compare ---------- */
  function judge(before,item,e,res){
    var d=item.d, s=item.sets[0], r=+s.r, w=+s.w;
    if(isCardio(e)){
      var pc=prevSess(before,d); if(!pc) return {k:'first'};
      var pw=workSets(pc), pk=0, pm=0; pw.forEach(function(x){ pk+=+x.w||0; pm+=+x.r||0; });
      if(w>0&&pk>0){ if(w>pk+0.05) return {k:'upd',d:r2(w-pk)}; if(w<pk-0.05) return {k:'down'}; }
      if(r>pm) return {k:'upt',d:r2(r-pm),u:'min'}; if(r===pm) return {k:'same'}; return {k:'down'};
    }
    var maxW=0, maxE=0, n=0, repsAt={};
    var take=function(x){ if(x.k==='w'||!(+x.r>0)) return false; var xw=+x.w||0, xr=+x.r||0; if(xw>maxW) maxW=xw; var ee=e1rm(xw,xr); if(ee>maxE) maxE=ee; var key=String(xw); if(!(repsAt[key]>=xr)) repsAt[key]=xr; return true; };
    ((before&&before.sessions)||[]).forEach(function(ss){ if(ss.d>=d) return; var any=false; ss.sets.forEach(function(x){ if(take(x)) any=true; }); if(any) n++; });
    var todayS=sessOn(before,d), slot=res?res.setNo-1:-1, earlier=todayS?workSets(todayS).filter(function(x,i){ return x.t&&i!==slot; }):[];
    earlier.forEach(take);
    if(!n&&!earlier.length) return {k:'first'};
    if(!n) return {k:'ok'};
    var timed=isTimed(e);
    if(!timed&&w>0&&maxW>0&&w>maxW) return {k:'prw',d:r2(w-maxW)};
    var at=repsAt[String(w)]; if(at!=null&&r>at) return timed?{k:'upt',d:r-at,u:'sec'}:{k:w>0?'prr':'prr0',d:r-at};
    if(!timed&&w>0&&e1rm(w,r)>maxE+0.01) return {k:'pre'};
    var prev=prevSess(before,d), pwk=prev?workSets(prev):[]; var no=(res&&res.setNo)||(earlier.length+1); var p=pwk.length?pwk[Math.min(pwk.length,no)-1]:null;
    if(!p) return {k:'ok'};
    var pW=+p.w||0, pR=+p.r||0;
    if(w>pW) return {k:'upw',d:r2(w-pW)}; if(w===pW&&r>pR) return timed?{k:'upt',d:r-pR,u:'sec'}:{k:'upr',d:r-pR}; if(w===pW&&r===pR) return {k:'same'};
    return {k:'down'};
  }

  /* ---------- the sentence that is spoken back ---------- */
  function fmtN(v){ var x=Math.round(v*100)/100; return String(x); }
  function spokenName(e,lang){ var n=(lang==='en'&&e.en)?e.en:(e.he||e.en||''); return String(n).replace(/\s*\([^)]*\)/g,'').replace(/\s+/g,' ').trim(); }
  var HE={
    reps:function(n){ return n===1?'חזרה אחת':n+' חזרות'; }, kg:function(w){ return fmtN(w)+' קילו'; }, sec:function(n){ return n+' שניות'; },
    min:function(n){ return n===1?'דקה':fmtN(n)+' דקות'; }, km:function(n){ return n===1?'קילומטר':fmtN(n)+' קילומטר'; },
    logged:'נרשם', updated:'עודכן', setNo:function(n){ return 'סט '+n; }, many:function(c){ return 'נרשמו '+c+' סטים'; }, bw:'משקל גוף',
    sameW:function(w){ return 'המשקל כמו בסט הקודם, '+fmtN(w)+' קילו'; }, sameR:function(r){ return 'החזרות כמו בסט הקודם, '+r; }, sameSet:'כמו הסט הקודם',
    j:{ first:['פעם ראשונה שהתרגיל הזה נרשם. התחלה טובה.'], ok:['יפה מאוד.','כל הכבוד.'],
        prw:function(d){ return 'שיא חדש! '+fmtN(d)+' קילו יותר מהשיא הקודם.'; }, prr:function(d){ return 'שיא חזרות במשקל הזה! '+(d===1?'חזרה אחת':d+' חזרות')+' יותר.'; },
        pre:['זה הסט החזק ביותר שלך בתרגיל הזה עד היום. יפה מאוד.'], upw:function(d){ return 'יפה מאוד, עלית '+fmtN(d)+' קילו מהפעם הקודמת.'; },
        upr:function(d){ return 'יפה מאוד, '+(d===1?'חזרה אחת':d+' חזרות')+' יותר מהפעם הקודמת.'; }, upt:function(d,u){ return 'יפה מאוד, '+fmtN(d)+(u==='sec'?' שניות':' דקות')+' יותר מהפעם הקודמת.'; }, prr0:function(d){ return 'שיא חזרות חדש! '+(d===1?'חזרה אחת':d+' חזרות')+' יותר מהשיא הקודם.'; },
        upd:function(d){ return 'יפה מאוד, '+fmtN(d)+' קילומטר יותר מהפעם הקודמת.'; }, same:['בדיוק כמו בפעם הקודמת. יציב.'], down:['קצת פחות מהפעם הקודמת, וזה בסדר. ממשיכים.'] },
    err:{ noex:'לא זיהיתי את התרגיל. אומרים למשל: לחיצת חזה, עשר חזרות, עשרים קילו.', nonum:'לא שמעתי מספרים. אומרים למשל: עשר חזרות, עשרים קילו.',
          noreps:'כמה חזרות? אומרים שוב עם מספר החזרות.', noweight:'לא שמעתי משקל. אומרים שוב עם המשקל בקילו.', range:'המספרים לא נשמעים הגיוניים. אומרים שוב, לאט.', empty:'לא שמעתי כלום. אומרים למשל: סקוואט, שמונה חזרות, שישים קילו.' },
    undo:'בוטל. הרישום האחרון נמחק.', undoNone:'אין רישום בקול לבטל.', undoLate:'הסט הזה כבר נכנס ליומן. אפשר למחוק אותו באפליקציה.',
    today0:'עוד לא נרשם היום כלום.', today:function(n,parts){ return 'היום נרשמו '+(n===1?'תרגיל אחד':n+' תרגילים')+': '+parts.join(', ')+'.'; }, sets:function(n){ return n===1?'סט אחד':n+' סטים'; }
  };
  var EN={
    reps:function(n){ return n===1?'1 rep':n+' reps'; }, kg:function(w){ return fmtN(w)+(w===1?' kilo':' kilos'); }, sec:function(n){ return n+' seconds'; },
    min:function(n){ return n===1?'1 minute':fmtN(n)+' minutes'; }, km:function(n){ return n===1?'1 kilometer':fmtN(n)+' kilometers'; },
    logged:'Logged', updated:'Updated', setNo:function(n){ return 'set '+n; }, many:function(c){ return 'Logged '+c+' sets'; }, bw:'body weight',
    sameW:function(w){ return 'same weight as your last set, '+fmtN(w)+' kilos'; }, sameR:function(r){ return 'same reps as your last set, '+r; }, sameSet:'same as your last set',
    j:{ first:['First time you log this exercise. Good start.'], ok:['Nice work.','Well done.'],
        prw:function(d){ return 'New record! '+fmtN(d)+' kilos above your previous best.'; }, prr:function(d){ return 'Rep record at this weight! '+(d===1?'1 rep':d+' reps')+' more.'; },
        pre:['That is your strongest set on this exercise so far. Nice.'], upw:function(d){ return 'Nice, '+fmtN(d)+' kilos up from last time.'; },
        upr:function(d){ return 'Nice, '+(d===1?'1 rep':d+' reps')+' more than last time.'; }, upt:function(d,u){ return 'Nice, '+fmtN(d)+(u==='sec'?' seconds':' minutes')+' more than last time.'; }, prr0:function(d){ return 'New rep record! '+(d===1?'1 rep':d+' reps')+' above your best.'; },
        upd:function(d){ return 'Nice, '+fmtN(d)+' kilometers more than last time.'; }, same:['Same as last time. Steady.'], down:['A little under last time, and that is fine. Keep going.'] },
    err:{ noex:'I did not catch the exercise. Try: bench press, ten reps, twenty kilos.', nonum:'I did not hear any numbers. Try: ten reps, twenty kilos.',
          noreps:'How many reps? Say it again with the reps.', noweight:'I did not hear a weight. Say it again with the kilos.', range:'Those numbers do not sound right. Say it again, slowly.', empty:'I did not hear anything. Try: squat, eight reps, sixty kilos.' },
    undo:'Undone. The last entry was removed.', undoNone:'There is no voice entry to undo.', undoLate:'That set is already in your journal. You can delete it in the app.',
    today0:'Nothing logged today yet.', today:function(n,parts){ return 'Today: '+parts.join(', ')+'.'; }, sets:function(n){ return n===1?'1 set':n+' sets'; }
  };
  function T(lang){ return lang==='en'?EN:HE; }
  function pick(arr,seed){ return arr[Math.abs(seed|0)%arr.length]; }
  function setPhrase(L,e,s){
    if(isCardio(e)){ var p=[]; if(s.r>0) p.push(L.min(s.r)); if(s.w>0) p.push(L.km(s.w)); return p.join(', '); }
    if(isTimed(e)) return L.sec(s.r)+(s.w>0?', '+L.kg(s.w):'');
    if(isBw(e)&&!(s.w>0)) return L.reps(s.r);
    return L.reps(s.r)+', '+L.kg(s.w);
  }
  function compose(lang,e,item,res,J,R){
    var L=T(lang), s=item.sets[0], name=spokenName(e,lang), head;
    var body=setPhrase(L,e,s);
    if(res.count>1) head=L.many(res.count)+': '+name+', '+body+'.';
    else if(isCardio(e)) head=L.logged+': '+name+', '+body+'.';
    else head=(res.replaced?L.updated:L.logged)+': '+name+', '+L.setNo(res.setNo)+', '+body+'.';
    var notes=[]; if(R&&R.inherit){ if(R.inherit.w&&R.inherit.r) notes.push(L.sameSet); else if(R.inherit.w) notes.push(L.sameW(s.w)); else if(R.inherit.r&&!isTimed(e)) notes.push(L.sameR(s.r)); }
    var tail=''; var jj=L.j[J.k]; if(typeof jj==='function') tail=jj(J.d,J.u); else if(jj) tail=pick(jj,res.setNo+String(item.d).length+(s.r|0));
    var out=head; if(notes.length){ var nn=notes.join(', ')+'.'; out+=' '+nn.charAt(0).toUpperCase()+nn.slice(1); } if(tail) out+=' '+tail;
    return out;
  }

  /* ---------- one sentence in, one answer out ----------
     env: {index, logs:{id:{sessions}}, plan:[ids], stars:{}, popular:{}, last:{ex,at}|null, date:'YYYY-MM-DD', now:ms, lang?}
     returns {ok, say, lang, cmd?, item?:{ex,d,sets,idx}, setNo?, replaced?, why?, match?} and never changes env */
  function handle(text,env){
    env=env||{}; var F=parse(text); var lang=env.lang||F.lang; var L=T(lang);
    if(!norm(text)) return {ok:false,why:'empty',lang:lang,say:L.err.empty};
    if(F.cmd) return {ok:true,cmd:F.cmd,lang:lang,say:''};
    var ix=env.index, m=F.query?match(F.query,ix,env):null, exId=m?m.id:'', viaLast=false;
    var recent=env.last&&env.last.ex&&ix.byId[env.last.ex]&&(env.now||0)-(env.last.at||0)<45*60000;
    if(!exId&&recent&&(F.hasNum||F.again)&&(!F.query||F.again)){ exId=env.last.ex; viaLast=true; }
    if(!exId) return {ok:false,why:F.hasNum||F.query?'noex':'empty',lang:lang,say:F.hasNum||F.query?L.err.noex:L.err.empty,parsed:F};
    var e=ix.byId[exId]; var log=(env.logs||{})[exId]||{sessions:[]};
    var R=resolve(F,e,log,env.date); if(R.err) return {ok:false,why:R.err,lang:lang,say:L.err[R.err]||L.err.nonum,parsed:F,ex:exId};
    var item={ex:exId,d:env.date,sets:R.sets,idx:R.idx||0};
    var res=applyItem(clone(log),item); var J=judge(log,item,e,res);
    return {ok:true,lang:lang,item:item,setNo:res.setNo,replaced:res.replaced,count:res.count,judge:J,match:m,viaLast:viaLast,say:compose(lang,e,item,res,J,R),parsed:F};
  }
  /* the inbox the server keeps: items wait there until the app takes them into the journal */
  function pending(inbox,done){ var seen=(done&&done.ids)||{}; return ((inbox&&inbox.items)||[]).filter(function(it){ return it&&it.id&&!seen[it.id]; }); }
  function withPending(logs,items){
    var out={}, k; for(k in logs) if(has(logs,k)) out[k]=logs[k];
    (items||[]).forEach(function(it){ if(!it||!it.ex) return; out[it.ex]=applyItem(clone(out[it.ex]||{sessions:[]}),it).log; });
    return out;
  }
  function todayLine(lang,logs,ix,date){
    var L=T(lang), parts=[], id;
    for(id in logs){ if(!has(logs,id)) continue; var s=sessOn(logs[id],date), e=ix.byId[id]; if(!s||!e) continue; var done=workSets(s).filter(function(x){ return x.t; }); if(!done.length) continue; parts.push(spokenName(e,lang)+' '+(isCardio(e)?setPhrase(L,e,done[done.length-1]):L.sets(done.length))); }
    return parts.length?L.today(parts.length,parts):L.today0;
  }
  /* ---------- the server side of one request ----------
     Storage is handed in, so the PocketBase hook and the local test server run exactly this code.
     io: { get(key) -> document | null,  logs() -> {exerciseId: logDocument},  put(key, document),  catalog: {ex:[...], popular:[...]} }
     input: { text, today: the server's idea of the person's date, date?: the phone's own date, now, lang?, src? }
     The journal itself is never written here. The sentence becomes an item in the "vinbox" document, which only the server writes;
     the app takes the items into the journal when it opens and notes them in "vdone", which only the app writes. */
  function israelDate(ms){
    var d=new Date(ms), y=d.getUTCFullYear(), lastSun=function(m){ var x=new Date(Date.UTC(y,m+1,0)); return x.getUTCDate()-x.getUTCDay(); };
    var start=Date.UTC(y,2,lastSun(2)-2,0,0), end=Date.UTC(y,9,lastSun(9),-1,0);       // summer time: Friday before the last Sunday of March, to the last Sunday of October
    var t=new Date(ms+((ms>=start&&ms<end)?3:2)*3600000), p=function(n){ return n<10?'0'+n:''+n; };
    return t.getUTCFullYear()+'-'+p(t.getUTCMonth()+1)+'-'+p(t.getUTCDate());
  }
  function indexFor(catalog,custom){
    if(!catalog._ix) catalog._ix=buildIndex(catalog.ex||[]);
    if(!custom||!custom.length) return catalog._ix;
    var extra=buildIndex(custom), byId={}, k; for(k in catalog._ix.byId) if(has(catalog._ix.byId,k)) byId[k]=catalog._ix.byId[k]; for(k in extra.byId) if(has(extra.byId,k)) byId[k]=extra.byId[k];
    return {list:catalog._ix.list.concat(extra.list),byId:byId};
  }
  function serve(input,io){
    var text=String(input.text==null?'':input.text).slice(0,300), now=+input.now||Date.now(), today=input.today||israelDate(now);
    var date=(/^\d{4}-\d{2}-\d{2}$/.test(String(input.date||''))&&Math.abs(daysBetween(today,input.date))<=1)?input.date:today;
    var inbox=io.get('vinbox')||{}, done=io.get('vdone')||{}; if(!inbox.items) inbox.items=[];
    var recent=inbox.items.filter(function(it){ return now-(it.at||0)<60000; }).length;
    var langGuess=input.lang||(isHe(text)?'he':'en');
    if(recent>=20) return {ok:false,why:'busy',say:langGuess==='en'?'Too many entries in one minute. Try again shortly.':'יותר מדי רישומים בדקה אחת. מנסים שוב עוד רגע.'};
    var logs=withPending(io.logs(),pending(inbox,done));
    var deck=io.get('deck')||{}, week=io.get('week')||{}, days=io.get('days')||{};
    var custom=(deck.custom||[]).map(function(c){ return {id:c.id,he:c.he,en:c.en||'',g:c.g||'',cat:c.cat||'',eq:c.eq||'custom',bw:!!c.bw,custom:true}; });
    var ix=indexFor(io.catalog,custom), plan=[], rec=(days.map||{})[date], dow=new Date(date+'T00:00:00Z').getUTCDay();
    var p=(rec&&rec.plan)?rec.plan:((week.days||{})[dow]||null); if(p&&!p.rest&&p.ex) plan=p.ex.map(function(x){ return x.id; });
    var stars={}, pop={}; (deck.stars||[]).forEach(function(id){ stars[id]=1; }); ((io.catalog&&io.catalog.popular)||[]).forEach(function(id){ pop[id]=1; });
    var lastIt=inbox.items.length?inbox.items[inbox.items.length-1]:null;
    var R=handle(text,{index:ix,logs:logs,plan:plan,stars:stars,popular:pop,last:lastIt?{ex:lastIt.ex,at:lastIt.at}:null,date:date,now:now,lang:input.lang}), L=T(R.lang);
    if(R.cmd==='undo'){
      if(!lastIt) return {ok:false,why:'undo',say:L.undoNone};
      if((done.ids||{})[lastIt.id]) return {ok:false,why:'undo',say:L.undoLate};
      inbox.items.pop(); io.put('vinbox',inbox); return {ok:true,say:L.undo,undone:lastIt.id};
    }
    if(R.cmd==='today') return {ok:true,say:todayLine(R.lang,logs,ix,date)};
    if(!R.ok) return {ok:false,why:R.why,say:R.say};
    var item={id:'v'+now.toString(36)+Math.floor(Math.random()*46656).toString(36),at:now,d:date,ex:R.item.ex,sets:R.item.sets,idx:R.item.idx||0,text:text,lang:R.lang,src:input.src||'siri'};
    inbox.items.push(item);
    inbox.items=inbox.items.filter(function(it){ return now-(it.at||0)<60*86400000; }); if(inbox.items.length>400) inbox.items=inbox.items.slice(-400);
    io.put('vinbox',inbox);
    return {ok:true,say:R.say,item:{id:item.id,ex:item.ex,d:item.d,sets:item.sets,setNo:R.setNo}};
  }
  return {norm:norm,parse:parse,match:match,buildIndex:buildIndex,applyItem:applyItem,handle:handle,judge:judge,compose:compose,resolve:resolve,serve:serve,israelDate:israelDate,
    pending:pending,withPending:withPending,todayLine:todayLine,isCardio:isCardio,isTimed:isTimed,isBw:isBw,spokenName:spokenName,text:T,clone:clone,ALIAS:ALIAS};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=VoiceLog;
