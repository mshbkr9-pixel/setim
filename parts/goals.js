/* GoalKit: takes a goal in the person's own words or from a list, and turns it into stages that make sense for the body.
   It knows the usual rates (how fast weight can come off, how fast a lift grows, how a long run is built, how a triathlon is
   periodised), checks a wished-for date against them, and reads the journal to say where the person stands and how the week went.
   No DOM and no globals, plain ES5: the app injects it (build.py) and the tests load it with node. */
var GoalKit=(function(){
  function has(o,k){ return Object.prototype.hasOwnProperty.call(o,k); }
  function pad(n){ return n<10?'0'+n:''+n; }
  function D(s){ var p=String(s).split('-'); return new Date(Date.UTC(+p[0],+p[1]-1,+p[2])); }
  function iso(d){ return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate()); }
  function addDays(s,n){ var d=D(s); d.setUTCDate(d.getUTCDate()+n); return iso(d); }
  function daysBetween(a,b){ return Math.round((D(b)-D(a))/86400000); }
  function weekStart(s){ var d=D(s); d.setUTCDate(d.getUTCDate()-d.getUTCDay()); return iso(d); }
  function f1(x){ return String(Math.round(x*10)/10); }
  function r05(x){ return Math.round(x*2)/2; }
  function clamp(x,a,b){ return Math.max(a,Math.min(b,x)); }
  var FINALS={'ך':'כ','ם':'מ','ן':'נ','ף':'פ','ץ':'צ'};
  function norm(s){ return String(s==null?'':s).toLowerCase().replace(/[֑-ׇ]/g,'').replace(/[ךםןףץ]/g,function(c){ return FINALS[c]; }).replace(/["'׳״`‘’\-־.,()\/:;!?]/g,' ').replace(/וו/g,'ו').replace(/יי/g,'י').replace(/\s+/g,' ').trim(); }
  var MONTHS=['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  var MONTHS_EN=['january','february','march','april','may','june','july','august','september','october','november','december'];
  function heDate(s,today){ var d=D(s); var y=d.getUTCFullYear(); var same=today&&String(today).slice(0,4)===String(y); return d.getUTCDate()+' ב'+MONTHS[d.getUTCMonth()]+(same?'':' '+y); }
  function heWeeks(n){ n=Math.max(1,Math.round(n)); if(n===1) return 'שבוע'; if(n===2) return 'שבועיים'; if(n<=10) return n+' שבועות'; var m=Math.round(n/4.345); if(m<=11) return 'כ-'+m+' חודשים'; if(m<=14) return 'כשנה'; if(m<=20) return 'כשנה וחצי'; if(m<=27) return 'כשנתיים'; return 'כ-'+Math.round(m/12)+' שנים'; }
  function plural(n,one,many){ return n===1?one:n+' '+many; }

  /* ---------- what the app offers to choose from ---------- */
  var TYPES=[
    {k:'lose',t:'לרדת במשקל',s:'בקצב בריא, עם שמירה על השריר',icon:'scale',col:'cardio'},
    {k:'gain',t:'לעלות במסת שריר',s:'עלייה נקייה, שלב אחרי שלב',icon:'arms',col:'arms'},
    {k:'lift',t:'להתחזק בתרגיל',s:'בנץ׳ 100, סקוואט 140 וכדומה',icon:'gym',col:'chest'},
    {k:'run',t:'לרוץ מרחק',s:'5 ק״מ, 10 ק״מ, חצי מרתון, מרתון',icon:'cardio',col:'legs'},
    {k:'tri',t:'טריאתלון ואיירונמן',s:'שחייה, רכיבה וריצה',icon:'bolt',col:'back'},
    {k:'reps',t:'עליות מתח ושכיבות סמיכה',s:'יותר חזרות במשקל גוף',icon:'trend',col:'shoulders'},
    {k:'habit',t:'להתמיד באימונים',s:'כמה אימונים בשבוע, שבוע אחרי שבוע',icon:'cal',col:'core'},
    {k:'free',t:'מטרה אחרת',s:'כותבים אותה ואת השלבים שלה',icon:'target',col:'full'}
  ];
  function typeOf(k){ for(var i=0;i<TYPES.length;i++) if(TYPES[i].k===k) return TYPES[i]; return TYPES[TYPES.length-1]; }
  var RACES={ sprint:{swim:0.75,bike:20,run:5,he:'טריאתלון ספרינט'}, oly:{swim:1.5,bike:40,run:10,he:'טריאתלון אולימפי'}, half:{swim:1.9,bike:90,run:21.1,he:'חצי איירונמן'}, iron:{swim:3.8,bike:180,run:42.2,he:'איירונמן'} };
  var LIFTS=[['bench-press','בנצ|bench|לחיצת חזה'],['squat','סקוואט|squat|כריע'],['deadlift','דדליפט|דד ליפט|deadlift'],['seated-barbell-overhead-press','לחיצת כתפ|overhead|ohp|shoulder press|military'],['barbell-row','חתירה|barbell row'],['hip-thrust','היפ ת ראסט|היפ טראסט|hip thrust'],['leg-press','לג פרס|leg press|לחיצת רגל'],['lat-pulldown','פולדאונ|pulldown|פולי עליונ']];
  var BWS=[['pull-up','מתח|פול אפ|pull up|pullup'],['chin-ups','סנטר|צ ינ אפ|chin'],['push-up','שכיבות|push up|pushup|פושאפ|פוש אפ'],['dips','מקבילימ|dips|דיפס']];
  var LIFT_IDS=LIFTS.map(function(x){ return x[0]; }), BW_IDS=BWS.map(function(x){ return x[0]; }).concat(['bodyweight-squat']);
  function findBy(table,n){ for(var i=0;i<table.length;i++){ var ks=table[i][1].split('|'); for(var j=0;j<ks.length;j++){ if((' '+n+' ').indexOf(norm(ks[j]))>=0) return table[i][0]; } } return ''; }

  /* ---------- reading the journal ---------- */
  function sessionsOf(data,id){ var l=data.logs&&data.logs[id]; return (l&&l.sessions)||[]; }
  function eachSet(data,id,since,fn){ sessionsOf(data,id).forEach(function(s){ if(since&&s.d<since) return; (s.sets||[]).forEach(function(x){ if(x.k==='w') return; if(!(+x.r>0||+x.w>0)) return; if(s.d===data.today&&!x.t) return; fn(x,s.d); }); }); }
  function oneRM(w,r){ return r<=1?w:w*(1+r/30); }
  function nRM(w,r,n){ var o=oneRM(w,r), v=n<=1?o:o/(1+n/30); return (r>=n&&w>v)?w:v; }
  function bestLift(data,ex,n,since){ var est=0,real=0,at='',bw=0,br=0; eachSet(data,ex,since,function(x,d){ var w=+x.w||0,r=+x.r||0; if(!(w>0&&r>0)) return; var v=nRM(w,r,n); if(v>est){ est=v; at=d; bw=w; br=r; } if(r>=n&&w>real) real=w; }); return {est:est,real:real,d:at,w:bw,r:br}; }
  function maxReps(data,ex,since){ var m=0,at=''; eachSet(data,ex,since,function(x,d){ var r=+x.r||0; if(r>m){ m=r; at=d; } }); return {n:m,d:at}; }
  var SPORT={'running':'run','treadmill-running':'run','cycling':'bike','stationary-bike':'bike','x-bike-outdoor':'bike','air-bike':'bike','x-swimming':'swim'};
  function sportOf(data,id){ if(has(SPORT,id)) return SPORT[id]; if(!/^c-|^custom|^m-/.test(id)&&!(data.isCustom&&data.isCustom(id))) return ''; var n=norm(data.nameOf?data.nameOf(id):''); if(/ריצ|run|jog/.test(n)) return 'run'; if(/אופנ|רכיב|bike|cycl/.test(n)) return 'bike'; if(/שחי|swim/.test(n)) return 'swim'; return ''; }
  function sportStats(data,sport,a,b){ var km=0,min=0,n=0,lng=0,id; for(id in (data.logs||{})){ if(!has(data.logs,id)||sportOf(data,id)!==sport) continue; eachSet(data,id,a,function(x,d){ if(b&&d>=b) return; var k=+x.w||0; km+=k; min+=+x.r||0; n++; if(k>lng) lng=k; }); } return {km:Math.round(km*10)/10,min:Math.round(min),n:n,long:lng}; }
  function longest(data,sport,since){ return sportStats(data,sport,since,'').long; }
  function workoutDates(data){ var set={},id; for(id in (data.logs||{})){ if(!has(data.logs,id)) continue; eachSet(data,id,'',function(x,d){ set[d]=1; }); } return set; }
  function weekDays(data,a,b){ var set=workoutDates(data),n=0,d; for(d in set) if(has(set,d)&&d>=a&&d<b) n++; return n; }
  function weeksMet(data,per,since){ var set=workoutDates(data), wk={}, d, n=0; for(d in set){ if(!has(set,d)||d<since) continue; var k=weekStart(d); wk[k]=(wk[k]||0)+1; } for(d in wk) if(has(wk,d)&&wk[d]>=per) n++; return n; }
  function weighins(data){ return (data.weighins||[]).slice().sort(function(a,b){ return a.d<b.d?-1:(a.d>b.d?1:0); }); }
  function weightOn(data,d){ var w=weighins(data),out=null; for(var i=0;i<w.length;i++){ if(w[i].d<=d) out=w[i]; } return out; }
  function tdeeOf(p){ var w=+p.weight||0,h=+p.height||0,a=+p.age||0; if(!w||!h||!a) return 0; var bmr=p.sex==='f'?10*w+6.25*h-5*a-161:10*w+6.25*h-5*a+5; var wk=+p.weekly||3; var act=+p.activity||(wk<=1?1.2:wk<=2?1.375:wk<=4?1.55:wk<=6?1.725:1.9); return Math.round(bmr*act); }

  /* ---------- the person's own words -> a kind of goal and what we already know about it ---------- */
  function dueFrom(text,today){
    var n=norm(text), m, t=today, y=+String(today).slice(0,4), i;
    m=/(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?/.exec(String(text));
    if(m&&+m[1]<=31&&+m[2]<=12){ var yy=m[3]?(+m[3]<100?2000+ +m[3]:+m[3]):y; var d0=yy+'-'+pad(+m[2])+'-'+pad(+m[1]); if(!m[3]&&d0<=today) d0=(yy+1)+'-'+pad(+m[2])+'-'+pad(+m[1]); return d0; }
    var num=function(s){ var v=parseFloat(s); if(!isNaN(v)) return v; var W={'שבוע':1,'חודש':1,'שנה':1,'שבועימ':2,'חודשימ':2,'שנתימ':2,'חצי':0.5}; return has(W,s)?W[s]:0; };
    m=/(?:תוכ|בעוד|within|in|תוך) (חצי שנה|half a year|(\d+(?:\.\d+)?) ?(שבועות|שבוע|חודשימ|חודש|שנימ|שנה|weeks?|months?|years?)|שבועימ|חודשימ|שנתימ|חודש|שנה|שבוע)/.exec(n);
    if(m){ var days=0, g=m[1];
      if(g==='חצי שנה'||g==='half a year') days=182; else if(m[2]){ var v=+m[2], u=m[3]; days=/שבוע|week/.test(u)?v*7:(/חודש|month/.test(u)?v*30.4:v*365); }
      else days=({'שבועימ':14,'חודשימ':61,'שנתימ':730,'חודש':30,'שנה':365,'שבוע':7})[g]||0;
      if(days) return addDays(t,Math.round(days)); }
    if(/סופ השנה|end of the year|end of year/.test(n)) return y+'-12-31';
    var seasons=[['קיצ','06-21'],['summer','06-21'],['חורפ','12-21'],['winter','12-21'],['אביב','03-21'],['spring','03-21'],['סתיו','09-23'],['autumn','09-23'],['fall','09-23']];
    for(i=0;i<seasons.length;i++){ if((' '+n+' ').indexOf(seasons[i][0])>=0&&/עד|לקראת|by|before|לפני/.test(n)){ var ds=y+'-'+seasons[i][1]; return ds>today?ds:(y+1)+'-'+seasons[i][1]; } }
    for(i=0;i<12;i++){ var hm=norm(MONTHS[i]); if(new RegExp('(?:עד|ב|by|in|before|לפני|לקראת) ?(?:סופ |תחילת |חודש )?'+hm+'(?: |$)').test(n)||new RegExp('(?:by|in|before) '+MONTHS_EN[i]).test(n)){ var end=/סופ/.test(n); var dm=y+'-'+pad(i+1)+'-'+(end?'28':'01'); return dm>today?dm:(y+1)+'-'+pad(i+1)+'-'+(end?'28':'01'); } }
    return '';
  }
  /* ctx: {today, weight, weekly, parse: VoiceLog.parse (optional, adds number words)} */
  function understand(text,ctx){
    ctx=ctx||{}; var n=norm(text), out={kind:'free',p:{},due:'',text:String(text||'').trim()}; if(!n) return out;
    var P=ctx.parse?ctx.parse(text):null, kg=null, km=null, loose=[];
    if(P){ kg=P.weight; km=P.km; loose=(P.loose||[]).slice(); if(P.reps!=null) loose.unshift(P.reps); if(P.count&&!loose.length) loose.push(P.count); }
    else { var rx=/(\d+(?:[.,]\d+)?)\s*(קילומטר|ק"מ|ק״מ|קמ|km|k\b|קילוגרם|קילו|ק"ג|ק״ג|קג|kg)?/g, mm; while((mm=rx.exec(String(text)))){ var v=parseFloat(mm[1].replace(',','.')), u=mm[2]||''; if(/קילומטר|ק"מ|ק״מ|קמ|km|^k$/.test(u)) km=v; else if(u) kg=v; else loose.push(v); } }
    out.due=dueFrom(text,ctx.today||iso(new Date()));
    var W=+ctx.weight||0, any=kg!=null?kg:(loose.length?loose[0]:null);
    if(/איירונמנ|אירונמנ|איירונ מנ|ironman|iron man|טריאתלונ|triathlon|70 3/.test(n)){
      out.kind='tri'; var iron=/איירונ|אירונ|iron/.test(n);
      out.p.race=(/חצי|half|70 3/.test(n))?'half':(/אולימפי|olympic/.test(n)?'oly':(/ספרינט|sprint/.test(n)?'sprint':(iron?'iron':'sprint'))); return out; }
    if(/מרתונ|marathon/.test(n)){ out.kind='run'; out.p.km=/חצי|half/.test(n)?21.1:42.2; return out; }
    if(/לרוצ|ריצה|ריצת|לרוץ|run|jog/.test(n)){ out.kind='run'; out.p.km=km!=null?km:((loose.length&&loose[0]<=100)?loose[0]:5); return out; }
    var bw=findBy(BWS,n), lift=findBy(LIFTS,n), raw=String(text).replace(/[־–—]/g,'-');
    if(bw&&kg==null){ out.kind='reps'; out.p.ex=bw; if(loose.length) out.p.to=Math.round(loose[0]); return out; }
    if(lift){ out.kind='lift'; out.p.ex=lift; if(kg!=null||loose.length) out.p.to=kg!=null?kg:loose[0]; return out; }
    if(/לרדת|להוריד|ירידה|לרזות|להרזות|הרזיה|דיאטה|lose|weight loss|slim|חיטוב|לחטב|להתחטב|להשיל/.test(n)||/(^| )cut( |$)/.test(n)){
      out.kind='lose';
      if(any!=null){ var asTarget=/(?:^|\s)(?:ל|עד|להגיע ל|to|down to|reach)\s*-?\s*\d/.test(raw), asAmount=/(?:לרדת|להוריד|לרזות|lose|drop)\s*-?\s*\d/.test(raw); if((asTarget&&!asAmount)||any>(W?W*0.45:35)) out.p.to=any; else out.p.lose=any; }
      return out; }
    if(/לעלות|להעלות|עליה במסה|מסה|מסת שריר|לבנות שריר|שריר|bulk|gain|muscle|לגדול/.test(n)){
      out.kind='gain'; if(any!=null){ if(any>(W?W*0.45:35)) out.p.to=any; else out.p.gain=any; } return out; }
    if(bw){ out.kind='reps'; out.p.ex=bw; return out; }
    if(/להתמיד|התמדה|שגרה|הרגל|קבוע|consisten|routine|habit|פעמימ בשבוע|אימונימ בשבוע|times a week|כושר|בריאות|בריא|fit|shape|health|להרגיש/.test(n)){
      out.kind='habit'; var per=(loose.length&&loose[0]>=1&&loose[0]<=7)?Math.round(loose[0]):0; if(per) out.p.perWeek=per; return out; }
    return out;
  }

  /* ---------- the few questions each kind still needs ---------- */
  function round25(x){ return Math.round(x/2.5)*2.5; }
  /* data: {today, profile, weighins, logs, nameOf(id)} */
  function ask(kind,p,data){
    p=p||{}; var pr=data.profile||{}, lastW=weightOn(data,data.today), W=lastW?lastW.kg:(+pr.weight||0), q=[];
    var exOpts=function(ids){ return ids.filter(function(id){ return !data.nameOf||data.nameOf(id); }).map(function(id){ return [id,data.nameOf?data.nameOf(id):id]; }); };
    if(kind==='lose'||kind==='gain'){
      var to=p.to!=null?p.to:(W?(kind==='lose'?(p.lose?W-p.lose:r05(W*0.93)):(p.gain?W+p.gain:r05(W*1.05))):'');
      q.push({k:'from',t:'כמה אתה שוקל היום?',type:'num',unit:'ק״ג',def:W||'',min:35,max:250,step:0.1});
      q.push({k:'to',t:kind==='lose'?'לאיזה משקל רוצים להגיע?':'לאיזה משקל רוצים לעלות?',type:'num',unit:'ק״ג',def:to===''?'':r05(to),min:35,max:250,step:0.5});
      if(kind==='lose'&&!(+pr.height>0)) q.push({k:'height',t:'מה הגובה שלך?',type:'num',unit:'ס״מ',def:'',min:120,max:230,step:1,why:'כדי לוודא שהיעד בטווח הבריא'});
    } else if(kind==='lift'){
      var ex=p.ex||LIFT_IDS[0], n=p.reps||1, b=bestLift(data,ex,n,'');
      q.push({k:'ex',t:'באיזה תרגיל?',type:'ex',def:ex,opts:exOpts(LIFT_IDS)});
      q.push({k:'from',t:'כמה אתה מרים היום?',type:'num',unit:'ק״ג',def:b.est?round25(b.est):'',min:1,max:500,step:2.5,why:b.est?'לפי הסטים שרשמת':''});
      q.push({k:'to',t:'ולכמה רוצים להגיע?',type:'num',unit:'ק״ג',def:p.to!=null?p.to:(b.est?round25(b.est*1.2):''),min:1,max:600,step:2.5});
    } else if(kind==='reps'){
      var ex2=p.ex||BW_IDS[0], mr=maxReps(data,ex2,'').n;
      q.push({k:'ex',t:'באיזה תרגיל?',type:'ex',def:ex2,opts:exOpts(BW_IDS)});
      q.push({k:'from',t:'כמה חזרות ברצף היום?',type:'num',unit:'חזרות',def:mr||0,min:0,max:300,step:1});
      q.push({k:'to',t:'ולכמה רוצים להגיע?',type:'num',unit:'חזרות',def:p.to!=null?p.to:(mr?Math.max(mr+5,Math.round(mr*1.5)):10),min:1,max:500,step:1});
    } else if(kind==='run'){
      var lg=longest(data,'run',addDays(data.today,-60));
      q.push({k:'km',t:'איזה מרחק?',type:'pick',def:p.km||5,opts:[[5,'5 ק״מ'],[10,'10 ק״מ'],[21.1,'חצי מרתון'],[42.2,'מרתון']],other:{unit:'ק״מ',min:1,max:100,step:0.5}});
      q.push({k:'from',t:'כמה ק״מ ברצף היום?',type:'num',unit:'ק״מ',def:lg||0,min:0,max:100,step:0.5,why:lg?'לפי הריצות שרשמת':'אם עוד לא רצים, משאירים 0'});
    } else if(kind==='tri'){
      var s=longest(data,'swim',addDays(data.today,-90)), bk=longest(data,'bike',addDays(data.today,-90)), rn=longest(data,'run',addDays(data.today,-90));
      var lvl=(s>=1.5&&bk>=60&&rn>=14)?'exp':((s>=0.75||bk>=30||rn>=7)?'trained':'beginner');
      q.push({k:'race',t:'איזה מרחק?',type:'pick',def:p.race||'sprint',opts:[['sprint','ספרינט · 750 מ׳, 20, 5'],['oly','אולימפי · 1.5, 40, 10'],['half','חצי איירונמן · 1.9, 90, 21'],['iron','איירונמן · 3.8, 180, 42']]});
      q.push({k:'level',t:'איפה אתה היום?',type:'pick',def:p.level||lvl,opts:[['beginner','מתחיל · עוד לא מתאמן בשלושת הענפים'],['trained','מתאמן · שוחה 750 מ׳, רוכב 30, רץ 7'],['exp','מנוסה · כבר סיימתי מרחק אולימפי']]});
    } else if(kind==='habit'){
      q.push({k:'perWeek',t:'כמה אימונים בשבוע?',type:'pick',def:p.perWeek||+pr.weekly||3,opts:[[2,'פעמיים'],[3,'שלוש'],[4,'ארבע'],[5,'חמש']]});
      q.push({k:'weeks',t:'לכמה זמן?',type:'pick',def:p.weeks||12,opts:[[4,'חודש'],[8,'חודשיים'],[12,'שלושה חודשים'],[24,'חצי שנה']]});
    }
    return q;
  }

  /* ---------- stages ---------- */
  function mkStage(t,sub,why,todo,m,weeks,fixed){ var s={t:t,sub:sub||'',why:why||'',todo:todo||[],m:m,weeks:Math.max(1,Math.round(weeks||1)),done:''}; if(fixed) s.fixed=1; return s; }
  function schedule(stages,start){ var d=start; stages.forEach(function(s,i){ s.id='s'+(i+1); s.from=d; d=addDays(d,s.weeks*7); s.until=d; }); return d; }
  /* fit the plan into the weeks there are: stretch freely, squeeze down to `floor` of the natural length */
  function fit(stages,avail,floor){
    var fixed=0, tot=0; stages.forEach(function(s){ if(s.fixed) fixed+=s.weeks; else tot+=s.weeks; });
    if(!avail||avail<=0||!tot) return {ok:true,weeks:tot+fixed,ratio:1};
    var room=avail-fixed, ratio=room/tot; if(ratio<floor) return {ok:false,weeks:tot+fixed,ratio:ratio};
    var acc=0, used=0, free=stages.filter(function(s){ return !s.fixed; });
    free.forEach(function(s,i){ acc+=s.weeks*ratio; var w=Math.max(1,Math.round(acc)-used); if(i===free.length-1) w=Math.max(1,Math.round(room)-used); s.weeks=w; used+=w; });
    return {ok:true,weeks:used+fixed,ratio:ratio};
  }
  function availWeeks(today,due){ return due?Math.floor(daysBetween(today,due)/7):0; }

  function buildWeight(kind,p,data,due){
    var pr=data.profile||{}, today=data.today, W0=+p.from, WT=+p.to, lose=kind==='lose', notes=[];
    if(!(W0>0)||!(WT>0)) return {err:'חסר משקל נוכחי או משקל יעד.'};
    if(lose&&WT>=W0) return {err:'היעד צריך להיות נמוך מהמשקל של היום. לעלייה במסה בוחרים במטרה השנייה.'};
    if(!lose&&WT<=W0) return {err:'היעד צריך להיות גבוה מהמשקל של היום.'};
    var h=+p.height||+pr.height||0, age=+pr.age||0;
    if(lose&&age>0&&age<18) return {stop:'מתחת לגיל 18 האפליקציה לא בונה תוכנית ירידה במשקל. את זה עושים עם רופא או דיאטנית. אפשר לבחור מטרה של התמדה או של כוח.'};
    if(lose&&h>0){ var minW=Math.ceil(18.5*Math.pow(h/100,2)*2)/2; if(W0<=minW+0.5) return {stop:'המשקל שלך כבר בקצה התחתון של הטווח הבריא לגובה שלך. מכאן האפליקציה לא בונה תוכנית ירידה. אפשר לבחור מטרה של כוח, מסה או התמדה.'}; if(WT<minW){ WT=minW; notes.push('היעד עודכן ל-'+f1(WT)+' ק״ג. זה הגבול התחתון של המשקל הבריא לגובה שלך.'); } }
    var total=Math.abs(W0-WT), dir=lose?-1:1;
    var pace=lose?clamp(0.006*W0,0.35,0.75):clamp(0.0035*W0,0.2,0.4), maxPace=lose?0.01*W0:0.005*W0;
    var state='ok', text='', wish=due, weeks=0, avail=availWeeks(today,due), need=0, easy=pace;
    if(due&&avail>0){ need=total/avail; if(need<=pace*1.1) pace=Math.max(need,0.1); else if(need<=maxPace){ pace=need; state='hard'; } else { pace=maxPace; state='no'; } }
    var n=total<=2?1:total<=4?2:total<=7?3:total<=11?4:total<=16?5:6, marks=[], i, prev=W0;
    for(i=1;i<=n;i++){ var w=i===n?WT:r05(W0+dir*total*i/n); if(Math.abs(w-prev)<0.5&&i<n) continue; marks.push(w); prev=w; }
    var tdee=tdeeOf({weight:W0,height:h,age:age,sex:pr.sex,weekly:pr.weekly,activity:pr.activity}), delta=Math.round(pace*7700/7/10)*10, kcal=0;
    if(tdee){ kcal=Math.round((lose?tdee-delta:tdee+Math.min(delta,400))/50)*50; var floor=pr.sex==='f'?1200:1500; if(lose&&kcal<floor){ kcal=floor; notes.push('לא יורדים מתחת ל-'+floor+' קק״ל ביום, גם אם זה מאט את הקצב.'); } }
    var wk=+pr.weekly||3, prot=Math.round(W0*(lose?2:1.8)/5)*5;
    var todo=lose?[kcal?'אוכלים כ-'+kcal+' קק״ל ביום, כ-'+delta+' פחות ממה שהגוף שורף':'אוכלים כ-500 קק״ל פחות ממה שהגוף שורף. מחשבון הקלוריות יחשב בדיוק',prot+' גרם חלבון ביום, כדי שהירידה תהיה משומן ולא משריר',wk+' אימוני כוח בשבוע','שקילה פעם בשבוע, בבוקר, באותו יום']
                 :[kcal?'אוכלים כ-'+kcal+' קק״ל ביום, מעט מעל מה שהגוף שורף':'אוכלים כ-300 קק״ל מעל מה שהגוף שורף',prot+' גרם חלבון ביום',wk+' אימוני כוח בשבוע, ובכל שבוע עוד קצת משקל או עוד חזרה','שקילה פעם בשבוע, בבוקר, באותו יום'];
    var stages=[]; prev=W0;
    marks.forEach(function(w,ix){
      var first=ix===0, last=ix===marks.length-1, mid=!first&&!last, why;
      if(lose) why=first?'בשבועות הראשונים הירידה מהירה יותר, כי חלק ממנה נוזלים. כאן בונים את ההרגלים שיחזיקו עד הסוף.':(last?'הקילוגרמים האחרונים הם האיטיים ביותר. זה צפוי, ולא סימן שמשהו לא עובד.':(ix===2&&weeks>10?'אחרי כשמונה עד עשרה שבועות בגירעון כדאי שבוע אחד בתחזוקה. הגוף והראש נחים, ואז ממשיכים.':'הקצב מתייצב. אם המשקל נתקע שבועיים, מורידים עוד 100 עד 150 קק״ל או מוסיפים הליכה יומית.'));
      else why=first?'מתחילים בעודף קטן. עלייה מהירה מדי היא בעיקר שומן.':(last?'ככל שמתקדמים העלייה מאטה. ממשיכים להוסיף עומס באימונים, לא רק אוכל.':'אם המשקל לא זז שבועיים, מוסיפים 100 עד 150 קק״ל ביום.');
      if(marks.length===1) why=lose?'ירידה קטנה: גירעון מתון, אימוני כוח ושקילה שבועית.':'עלייה קטנה: עודף מתון ועומס שעולה באימונים.';
      stages.push(mkStage((lose?'עד ':'עד ')+f1(w)+' ק״ג',(lose?'יורדים ':'עולים ')+f1(Math.abs(w-prev))+' ק״ג',why,todo,{k:'weight',to:w,dir:dir},Math.abs(w-prev)/pace)); prev=w;
    });
    var keepW=lose?4:3;
    stages.push(mkStage('שמירה','נשארים בטווח של קילו מ-'+f1(WT)+' ק״ג',lose?'המטרה האמיתית היא להישאר שם. מעלים קלוריות בהדרגה עד לתחזוקה ונשארים קרוב ליעד.':'מייצבים את המשקל החדש לפני שמחליטים על השלב הבא.',[lose?(tdee?'עולים בהדרגה לכ-'+Math.round(tdeeOf({weight:WT,height:h,age:age,sex:pr.sex,weekly:pr.weekly,activity:pr.activity})/50)*50+' קק״ל ביום':'מוסיפים 100 קק״ל בכל שבוע עד שהמשקל יציב'):'נשארים על אותן קלוריות','ממשיכים באותם אימונים','שקילה פעם בשבוע'],{k:'keep',to:WT,tol:1,weeks:keepW},keepW,1));
    var body=stages.slice(0,-1); if(wish&&avail>0&&state!=='no') fit(body,avail,0.2);
    body.forEach(function(s){ weeks+=s.weeks; }); due=addDays(today,weeks*7);
    if(!wish||!(avail>0)) text=(lose?'בקצב בריא של ':'בקצב של ')+f1(pace)+' ק״ג בשבוע זה לוקח '+heWeeks(weeks)+'.';
    else if(state==='ok'){ text='התאריך שבחרת ריאלי: '+f1(pace)+' ק״ג בשבוע.'; if(pace<easy*0.75) text+=' אפשר גם מהר יותר: בקצב של '+f1(easy)+' ק״ג בשבוע זה לוקח '+heWeeks(Math.ceil(total/easy))+'.'; }
    else if(state==='hard') text='שאפתני אבל אפשרי: '+f1(need)+' ק״ג בשבוע. זה דורש הקפדה כמעט בלי חריגות.';
    else text='עד '+heDate(wish,today)+' זה '+(lose?'מהיר מדי בשביל להיות בריא':'מהיר מדי, ורוב העלייה תהיה שומן')+'. בקצב בטוח של '+f1(maxPace)+' ק״ג בשבוע מגיעים ב-'+heDate(due,today)+', והתוכנית נבנתה לתאריך הזה.';
    var title=(lose?'לרדת ל-':'לעלות ל-')+f1(WT)+' ק״ג';
    return {kind:kind,title:title,p:{from:W0,to:WT,pace:Math.round(pace*100)/100,kcal:kcal},stages:stages,due:due,verdict:{state:state,text:text,weeks:weeks},notes:notes};
  }

  var STD={bench:[0.5,1.0,1.5],squat:[0.75,1.25,1.75],deadlift:[1.0,1.5,2.0],ohp:[0.35,0.65,0.9],row:[0.5,0.9,1.3]};
  function liftClass(ex){ if(/bench/.test(ex)&&!/db-|dumbbell/.test(ex)) return 'bench'; if(/squat/.test(ex)&&!/goblet|db-|dumbbell|bodyweight/.test(ex)) return 'squat'; if(/deadlift/.test(ex)&&!/dumbbell|db-/.test(ex)) return 'deadlift'; if(/overhead|shoulder-press|military/.test(ex)&&!/dumbbell|db-/.test(ex)) return 'ohp'; if(/barbell-row|t-bar-row/.test(ex)) return 'row'; return ''; }
  function liftRate(w,n,ex,data){ var pr=data.profile||{}, lw=weightOn(data,data.today), BW=lw?lw.kg:(+pr.weight||0), cls=liftClass(ex);
    if(cls&&BW>0){ var st=STD[cls], f=pr.sex==='f'?0.65:1, r=(n<=1?w:w*(1+n/30))/BW; if(r<st[0]*f) return 0.02; if(r<st[1]*f) return 0.01; if(r<st[2]*f) return 0.0045; return 0.002; }
    var ns=sessionsOf(data,ex).length; return ns<12?0.015:(ns<40?0.008:0.004); }
  function buildLift(p,data,due){
    var today=data.today, ex=p.ex, n=Math.max(1,Math.round(p.reps||1)), cur=+p.from, target=+p.to, name=data.nameOf?data.nameOf(ex):ex;
    if(!ex||!name) return {err:'בוחרים תרגיל.'}; if(!(cur>0)) return {err:'צריך לדעת כמה אתה מרים היום, גם בערך.'}; if(!(target>cur)) return {err:'היעד צריך להיות גבוה ממה שאתה מרים היום.'};
    var g=target/cur, ns=g<=1.08?2:g<=1.2?3:g<=1.4?4:g<=1.7?5:6, step=target-cur<10?1:2.5, marks=[], i, prev=cur;
    for(i=1;i<=ns;i++){ var w=i===ns?target:Math.round(cur*Math.pow(g,i/ns)/step)*step; if(w<=prev||(w>=target&&i<ns)) continue; marks.push(w); prev=w; }
    var sim=function(a,b){ var w=a, k=0; while(w<b&&k<600){ w=w*(1+liftRate(w,n,ex,data)); k++; } return Math.max(1,k); };
    var stages=[], reps=n>1?' × '+n:''; prev=cur;
    marks.forEach(function(w,ix){
      var last=ix===marks.length-1, first=ix===0, pre=ix===marks.length-2, why, todo;
      if(last){ why='ניסיון על המשקל המלא, ביום שבו אתה רענן. השלב הזה נסגר רק כשהמשקל באמת עולה.'; todo=['שבוע קל לפני הניסיון','חימום הדרגתי, ואז ניסיון אחד או שניים','עם מאבטח או עם מעצורי בטיחות']; }
      else if(first){ why='בונים בסיס של טכניקה ונפח. בתחילת הדרך רוב ההתקדמות מגיעה מתנועה טובה יותר.'; todo=['פעמיים בשבוע על התרגיל','3 עד 4 סטים של 6 עד 10 חזרות','כשכל הסטים מצליחים, מוסיפים '+f1(step)+' ק״ג']; }
      else if(pre){ why='מתקרבים ליעד. כאן ההתקדמות איטית, וזה תקין.'; todo=['סטים של 2 עד 3 חזרות קרוב למשקל היעד','שבוע קל אחת לארבעה או חמישה שבועות','שינה ואוכל מספיקים']; }
      else { why='עוברים לעומסים כבדים יותר: פחות חזרות, יותר משקל.'; todo=['יום כבד: 4 עד 5 סטים של 3 עד 5 חזרות','יום קל: 3 סטים של 8 בכ-80% מהמשקל','תרגילי עזר לשרירים המסייעים']; }
      stages.push(mkStage((last?'היעד: ':'')+f1(w)+' ק״ג'+reps,last?'הרמה אמיתית של המשקל':'לפי הערכה מהסטים שלך',why,todo,last?{k:'lift',ex:ex,to:w,reps:n,real:1}:{k:'lift',ex:ex,to:w,reps:n},sim(prev,w))); prev=w;
    });
    var weeks=0; stages.forEach(function(s){ weeks+=s.weeks; });
    var state='ok', text='ברמה שלך מתקדמים בערך '+f1(liftRate(cur,n,ex,data)*100)+'% בשבוע, ולכן זה לוקח '+heWeeks(weeks)+'. הקצב מאט ככל שמתחזקים.', wish=due, avail=availWeeks(today,due);
    if(due&&avail>0){ var ratio=weeks/avail;
      if(ratio<=1.1){ fit(stages,avail,0.9); weeks=avail; text='התאריך שבחרת ריאלי לרמה שלך.'; }
      else if(ratio<=1.6){ fit(stages,avail,0.6); weeks=avail; state='hard'; text='שאפתני. כדי להגיע בזמן צריך להתקדם מהר מהרגיל, בלי שבועות שהולכים לאיבוד.'; }
      else { due=addDays(today,weeks*7); state='no'; text='עד '+heDate(wish,today)+' זה מוקדם מדי: כוח נבנה לאט. בקצב ריאלי מגיעים ב-'+heDate(due,today)+', והתוכנית נבנתה לתאריך הזה.'; }
    } else due=addDays(today,weeks*7);
    return {kind:'lift',title:name+': '+f1(target)+' ק״ג'+reps,p:{ex:ex,from:cur,to:target,reps:n},stages:stages,due:due,verdict:{state:state,text:text,weeks:weeks},notes:[]};
  }

  function buildReps(p,data,due){
    var today=data.today, ex=p.ex, cur=Math.max(0,Math.round(+p.from||0)), target=Math.round(+p.to), name=data.nameOf?data.nameOf(ex):ex;
    if(!ex||!name) return {err:'בוחרים תרגיל.'}; if(!(target>cur)) return {err:'היעד צריך להיות גבוה ממה שאתה עושה היום.'};
    var hard=/pull|chin|dip|muscle-up|handstand/.test(ex), rate=hard?0.6:2, ladder=[1,3,5,8,10,12,15,20,25,30,40,50,60,80,100,150,200], marks=ladder.filter(function(x){ return x>cur&&x<target; });
    while(marks.length>5) marks=marks.filter(function(x,i){ return i%2===0; });
    marks.push(target);
    var stages=[], prev=cur;
    marks.forEach(function(m,ix){
      var last=ix===marks.length-1, why, todo, w=Math.max(2,(m-prev)/rate);
      if(prev===0&&hard){ w=6; why='החזרה הראשונה היא עניין של כוח יחסי. בונים אותו עם תלייה, עם ירידות איטיות ועם עזרה.'; todo=/dip/.test(ex)?['החזקה למעלה על המקבילים, 3 פעמים עד 20 שניות','ירידות איטיות של 5 שניות, 3 סטים של 3 עד 5','מקבילים עם גומיה או במכונה מסייעת, 3 סטים של 5 עד 8']:['תלייה על המתח, 3 פעמים עד 30 שניות','שליליות: קופצים למעלה ויורדים 5 שניות, 3 סטים של 3 עד 5','מתח עם גומיה או במכונה מסייעת, 3 סטים של 5 עד 8']; }
      else if(last){ why='הסט שסוגר את המטרה. מגיעים אליו רעננים.'; todo=['יום או יומיים של מנוחה לפני','חימום קצר, ואז סט אחד עד הסוף','רושמים אותו באפליקציה']; }
      else { why=hard?'מוסיפים חזרות בהדרגה. הרבה סטים קלים בונים יותר מסט אחד עד כישלון.':'מוסיפים חזרות בהדרגה, עם סטים קצרים וחוזרים.'; todo=['3 אימונים בשבוע','כמה סטים של כ-60% מהמקסימום, עם מנוחה מלאה','פעם בשבוע סט אחד עד הסוף, ורושמים אותו']; }
      stages.push(mkStage((last?'היעד: ':'')+plural(m,'חזרה אחת','חזרות'),last?'בסט אחד, ברצף':'בסט אחד',why,todo,{k:'reps',ex:ex,to:m},w)); prev=m;
    });
    var weeks=0; stages.forEach(function(s){ weeks+=s.weeks; });
    var state='ok', text='בקצב רגיל זה לוקח '+heWeeks(weeks)+'.', wish=due, avail=availWeeks(today,due);
    if(due&&avail>0){ var ratio=weeks/avail; if(ratio<=1.1){ fit(stages,avail,0.9); weeks=avail; text='התאריך שבחרת ריאלי.'; } else if(ratio<=1.7){ fit(stages,avail,0.55); weeks=avail; state='hard'; text='שאפתני, אבל אפשרי עם שלושה אימונים בכל שבוע.'; } else { due=addDays(today,weeks*7); state='no'; text='עד '+heDate(wish,today)+' זה מוקדם מדי. בקצב ריאלי מגיעים ב-'+heDate(due,today)+', והתוכנית נבנתה לתאריך הזה.'; } }
    else due=addDays(today,weeks*7);
    return {kind:'reps',title:name+': '+target+' חזרות',p:{ex:ex,from:cur,to:target},stages:stages,due:due,verdict:{state:state,text:text,weeks:weeks},notes:[]};
  }

  /* weeks to grow the long run from `cur` through each mark; every fourth week is an easy one and adds nothing */
  function runPlan(cur,marks){ var w=Math.max(cur,0), k=0, out=[], last=0; marks.forEach(function(m){ while(w<m-0.01&&k<400){ k++; if(k%4===0) continue; w=w<5?w+0.55:(w<10?Math.max(w*1.15,w+0.75):w+1.5); } out.push(Math.max(1,k-last)); last=k; }); return out; }
  function kmText(k){ return k===42.2?'מרתון':(k===21.1?'חצי מרתון':f1(k)+' ק״מ'); }
  function buildRun(p,data,due){
    var today=data.today, T=+p.km, cur=Math.max(0,+p.from||0);
    if(!(T>0)) return {err:'בוחרים מרחק.'}; if(cur>=T) return {err:'את המרחק הזה אתה כבר רץ. אפשר לבחור מרחק ארוך יותר.'};
    var long=T>11, peak=T>22?32:(T>11?19:T), ladder=T<=5.5?[1,2,3,4]:(T<=11?[2,3,5,6.5,8]:(T<=22?[5,8,10,13,16]:[10,16,21,26,30]));
    var marks=ladder.filter(function(x){ return x>cur+0.3&&x<peak-0.3; }); marks.push(peak);
    var stages=[], prev=cur, beginner=cur<2, plan=runPlan(cur,marks);
    marks.forEach(function(m,ix){
      var isPeak=ix===marks.length-1, why, todo;
      if(prev<2){ why='מתחילים בריצה והליכה לסירוגין. הלב והריאות מסתגלים מהר, הגידים והמפרקים לאט, ולכן לא ממהרים.'; todo=['3 פעמים בשבוע, יום מנוחה ביניהן','דקה ריצה ודקה עד שתיים הליכה, 20 עד 25 דקות','בכל שבוע מאריכים מעט את קטעי הריצה']; }
      else if(isPeak&&long){ why='הריצות הארוכות ביותר בתוכנית. אחריהן הגוף מוכן למרחק המלא.'; todo=['הריצה הארוכה מגיעה ל-'+f1(m)+' ק״מ','שבוע קל אחרי כל שלושה שבועות עמוסים','מתרגלים שתייה ואכילה בריצות הארוכות']; }
      else if(isPeak){ why='המרחק המלא, ברצף, בקצב נוח.'; todo=['יומיים קלים לפני','יוצאים לאט ממה שמתחשק','רושמים את הריצה באפליקציה']; }
      else { why='מאריכים את הריצה הארוכה בהדרגה. הכלל: לא יותר מעשרה אחוזים בשבוע.'; todo=['3 ריצות בשבוע: שתיים קצרות וקלות, אחת ארוכה','קצב שאפשר לדבר בו','אימון כוח לרגליים פעם בשבוע: סקוואט, לאנג׳ים, תאומים']; }
      stages.push(mkStage((isPeak&&!long?'היעד: ':'')+f1(m)+' ק״מ ברצף',isPeak&&long?'הריצה הארוכה של התוכנית':'בריצה אחת',why,todo,{k:'long',sport:'run',km:m},plan[ix])); prev=m;
    });
    if(long){ var tw=T>22?3:2;
      stages.push(mkStage('הפחתה','פחות קילומטרים, אותה תדירות','בשבועות האחרונים הגוף סופג את העבודה. מי שממשיך לדחוף מגיע עייף לקו הזינוק.',['מורידים את הנפח בשליש עד חצי','שומרים על מעט קצב, בלי ריצות ארוכות','שינה, ואוכל רגיל'],{k:'rest',weeks:tw},tw,1));
      stages.push(mkStage('היעד: '+kmText(T),f1(T)+' ק״מ',T>22?'היום שבשבילו התאמנת.':'המרחק המלא.',['יוצאים לאט מהמתוכנן','שותים ואוכלים לפי מה שתרגלת','נהנים מהדרך'],{k:'long',sport:'run',km:T},1,1)); }
    var weeks=0; stages.forEach(function(s){ weeks+=s.weeks; });
    var state='ok', text=(beginner?'מאפס, בקצב בטוח, ':'מהמקום שבו אתה היום ')+'זה לוקח '+heWeeks(weeks)+'.', wish=due, avail=availWeeks(today,due);
    if(due&&avail>0){ var ratio=weeks/avail; if(ratio<=1.1){ fit(stages,avail,0.9); weeks=avail; text='התאריך שבחרת ריאלי.'; } else if(ratio<=1.4){ fit(stages,avail,0.7); weeks=avail; state='hard'; text='שאפתני. זה אפשרי רק אם לא מפספסים שבועות, והסיכון לפציעה עולה.'; } else { due=addDays(today,weeks*7); state='no'; text='עד '+heDate(wish,today)+' זה מוקדם מדי: העלאה מהירה של קילומטרים היא הדרך הקצרה לפציעה. בקצב בטוח מגיעים ב-'+heDate(due,today)+', והתוכנית נבנתה לתאריך הזה.'; } }
    else due=addDays(today,weeks*7);
    return {kind:'run',title:'לרוץ '+kmText(T),p:{km:T,from:cur},stages:stages,due:due,verdict:{state:state,text:text,weeks:weeks},notes:[]};
  }

  function triLine(s,b,r){ return 'שחייה '+(s<1?Math.round(s*1000)+' מ׳':f1(s)+' ק״מ')+' · רכיבה '+f1(b)+' ק״מ · ריצה '+f1(r)+' ק״מ'; }
  var TRI_BASE={beginner:{swim:0.2,bike:10,run:2},trained:{swim:0.75,bike:30,run:7},exp:{swim:1.5,bike:60,run:14}};
  var TRI_PH=[
    {id:'base',t:'בסיס אירובי',s:0.4,b:15,r:3,w:6,why:'קודם בונים מנוע: שלושה ענפים בקצב קל, וטכניקת שחייה.',todo:['שחייה פעמיים בשבוע: טכניקה ונשימה','רכיבה פעמיים וריצה פעמיים, הכול בקצב קל','אימון כוח אחד בשבוע לכל הגוף']},
    {id:'sprint',t:'מרחק ספרינט',s:0.75,b:20,r:5,w:6,why:'כל ענף מגיע למרחק של טריאתלון ספרינט, ומתחילים לחבר ביניהם.',todo:['אימון משולב אחד בשבוע: ריצה קצרה מיד אחרי רכיבה','שחייה במים פתוחים לפחות פעמיים','שבוע קל אחת לארבעה שבועות']},
    {id:'oly',t:'מרחק אולימפי',s:1.5,b:40,r:10,w:10,why:'מכפילים את המרחקים. הנפח עולה לאט, והגוף לומד להתאושש בין אימונים.',todo:['רכיבה ארוכה אחת וריצה ארוכה אחת בשבוע','אימון משולב אחת לשבוע','תחרות ספרינט כמבחן, אם יש']},
    {id:'half',t:'מרחק חצי איירונמן',s:1.9,b:90,r:18,w:12,why:'כאן נכנסת התזונה: בלי לאכול ולשתות על האופניים אי אפשר לסיים את הריצה.',todo:['רכיבה ארוכה בסוף השבוע, ולמחרת ריצה ארוכה','מתרגלים אכילה ושתייה תוך כדי רכיבה','תחרות אולימפית כמבחן באמצע השלב']},
    {id:'build',t:'בנייה לאיירונמן',s:3.0,b:130,r:26,w:12,why:'שבועות ארוכים של נפח. המטרה היא סבולת, לא מהירות.',todo:['10 עד 14 שעות אימון בשבוע','רכיבה ארוכה ואחריה מיד ריצה קצרה','תחרות חצי איירונמן כמבחן']},
    {id:'peak',t:'שיא',s:3.8,b:160,r:32,w:6,why:'האימונים הארוכים ביותר. אחריהם אין מה להוסיף, רק לנוח.',todo:['שחייה של המרחק המלא','רכיבה של 160 ק״מ וריצה של 32 ק״מ, בימים נפרדים','בודקים את כל הציוד והתזונה ליום המרוץ']}
  ];
  var TRI_UPTO={sprint:1,oly:2,half:3,iron:5};
  function buildTri(p,data,due){
    var today=data.today, race=has(RACES,p.race)?p.race:'sprint', R=RACES[race], lvl=has(TRI_BASE,p.level)?p.level:'beginner', since=addDays(today,-90);
    var base={swim:Math.max(TRI_BASE[lvl].swim,longest(data,'swim',since)),bike:Math.max(TRI_BASE[lvl].bike,longest(data,'bike',since)),run:Math.max(TRI_BASE[lvl].run,longest(data,'run',since))};
    var all=TRI_PH.slice(0,TRI_UPTO[race]+1);      // phases the person is already past are skipped; the last one always stays, it is where the three sports are joined
    var path=all.filter(function(ph,i){ return i===all.length-1||!(base.swim>=ph.s&&base.bike>=ph.b&&base.run>=ph.r); });
    var stages=path.map(function(ph,ix){ var w=ph.w; if(ix===0){ var gap=Math.max(0,1-Math.min(base.swim/ph.s,base.bike/ph.b,base.run/ph.r)); w=Math.max(3,Math.round(ph.w*Math.max(0.5,gap+0.3))); }
      return mkStage(ph.t,triLine(ph.s,ph.b,ph.r),ph.why,ph.todo,{k:'tri',swim:ph.s,bike:ph.b,run:ph.r},w); });
    var tw=race==='iron'?3:(race==='half'?2:1);
    stages.push(mkStage('הפחתה','פחות נפח, אותה תדירות','הגוף סופג את העבודה של החודשים האחרונים. מגיעים לקו הזינוק רעננים.',['מורידים את הנפח בחצי','שומרים על תדירות ועל מעט קצב','שינה, ציוד, ותכנון יום המרוץ'],{k:'rest',weeks:tw},tw,1));
    stages.push(mkStage('יום המרוץ: '+R.he,triLine(R.swim,R.bike,R.run),'היום שבשבילו התאמנת.',['יוצאים רגוע בשחייה','אוכלים ושותים לפי התוכנית','חוצים את קו הסיום'],{k:'event'},1,1));
    var weeks=0; stages.forEach(function(s){ weeks+=s.weeks; });
    var state='ok', text=(lvl==='beginner'&&(race==='iron'||race==='half')?'מהמקום שבו אתה היום הדרך עוברת דרך מרחקים קצרים יותר. ':'')+'בסך הכול '+heWeeks(weeks)+'.', wish=due, avail=availWeeks(today,due), notes=[];
    if(due&&avail>0){ var f=fit(stages,avail,0.7); if(f.ok){ if(f.ratio<0.97){ state='hard'; text='שאפתני: התוכנית נדחסה ל-'+heWeeks(avail)+'. אין מקום לשבועות שהולכים לאיבוד.'; } else text='התאריך שבחרת ריאלי. התוכנית פרושה על '+heWeeks(avail)+'.'; weeks=f.weeks; } else { due=addDays(today,weeks*7); state='no'; text='עד '+heDate(wish,today)+' אין מספיק זמן לבנות את המרחקים בבטחה. צריך לפחות '+heWeeks(Math.ceil(weeks*0.7))+', ורצוי '+heWeeks(weeks)+'. התוכנית נבנתה ל-'+heDate(due,today)+'.'; } }
    else due=addDays(today,weeks*7);
    if(race==='iron'||race==='half') notes.push('לפני מרחקים כאלה כדאי בדיקה אצל רופא ספורט.');
    return {kind:'tri',title:'לסיים '+R.he,p:{race:race,level:lvl,base:base},stages:stages,due:due,verdict:{state:state,text:text,weeks:weeks},notes:notes};
  }

  function buildHabit(p,data){
    var today=data.today, per=clamp(Math.round(+p.perWeek||3),1,7), total=clamp(Math.round(+p.weeks||12),2,104), ladder=[2,4,8,12,16,24,36,52,78], marks=ladder.filter(function(x){ return x<total; }); marks.push(total);
    var WHY={2:'שבועיים ראשונים: רק להגיע. האימון יכול להיות קצר.',4:'חודש: ההרגל מתחיל להחזיק את עצמו.',8:'חודשיים: כאן כבר רואים שינוי בכוח ובמראה.',12:'שלושה חודשים: האימונים הם חלק מהשבוע שלך.'}, stages=[], prev=0;
    marks.forEach(function(m,ix){ var last=ix===marks.length-1; stages.push(mkStage((last?'היעד: ':'')+(m===2?'שבועיים מלאים':plural(m,'שבוע מלא','שבועות מלאים')),plural(per,'אימון אחד','אימונים')+' בכל שבוע',WHY[m]||'ממשיכים באותו קצב. שבוע שהתפספס לא מוחק את מה שנבנה.',['ימים ושעות קבועים לאימון','אימון קצר עדיף על דילוג','מסמנים כל אימון באפליקציה'],{k:'weeks',n:m,per:per},m-prev)); prev=m; });
    return {kind:'habit',title:'להתאמן '+(per===1?'פעם':per===2?'פעמיים':per+' פעמים')+' בשבוע, '+heWeeks(total).replace('כ-',''),p:{perWeek:per,weeks:total},stages:stages,due:addDays(today,total*7),verdict:{state:'ok',text:'שבוע נספר כשיש בו '+plural(per,'אימון אחד','אימונים')+' לפחות. שבוע שהתפספס לא מאפס את הספירה.',weeks:total},notes:[]};
  }
  function buildFree(p,data,due){
    var today=data.today, title=String(p.title||'').trim(), names=(p.stages||[]).map(function(s){ return String(s||'').trim(); }).filter(Boolean);
    if(!title) return {err:'כותבים את המטרה במילים שלך.'};
    if(!names.length) names=['מגדירים איך נראית הצלחה','שבועיים ראשונים של עקביות','אמצע הדרך','המטרה'];
    var avail=availWeeks(today,due), each=avail>0?Math.max(1,Math.floor(avail/names.length)):4;
    var stages=names.map(function(nm){ return mkStage(nm,'מסמנים כשהשלב הושלם','',[],{k:'manual'},each); });
    return {kind:'free',title:title,p:{},stages:stages,due:due||addDays(today,each*names.length*7),verdict:{state:'ok',text:'את השלבים האלה מסמנים ביד. אפשר לשנות את השמות שלהם בכל רגע.',weeks:each*names.length},notes:[]};
  }
  /* build(kind, params, data, due) -> {goal, verdict, notes} | {err} | {stop} */
  function build(kind,p,data,due,text){
    var r; p=p||{}; due=(due&&due>data.today)?due:'';
    if(kind==='lose'||kind==='gain') r=buildWeight(kind,p,data,due); else if(kind==='lift') r=buildLift(p,data,due); else if(kind==='reps') r=buildReps(p,data,due);
    else if(kind==='run') r=buildRun(p,data,due); else if(kind==='tri') r=buildTri(p,data,due); else if(kind==='habit') r=buildHabit(p,data); else r=buildFree(p,data,due);
    if(r.err||r.stop) return r;
    schedule(r.stages,data.today);
    var goal={id:'g'+(data.now||Date.now()).toString(36),kind:r.kind,title:r.title,text:String(text||'').trim(),created:data.today,p:r.p,due:r.due,stages:r.stages,status:'on',doneAt:'',state:r.verdict.state};
    return {goal:goal,verdict:r.verdict,notes:r.notes||[]};
  }

  /* ---------- where the person stands ---------- */
  function stageMet(goal,st,ix,data){
    var m=st.m||{}, since=goal.created, prevDone=ix>0?goal.stages[ix-1].done:goal.created;
    if(m.k==='weight'){ var w=weightOn(data,data.today); if(!w||w.d<since) return false; return m.dir<0?w.kg<=m.to+0.05:w.kg>=m.to-0.05; }
    if(m.k==='keep'){ if(!prevDone) return false; var ws=weighins(data).filter(function(x){ return x.d>prevDone; }); if(ws.length<2||daysBetween(prevDone,data.today)<m.weeks*7) return false; return Math.abs(ws[ws.length-1].kg-m.to)<=m.tol+0.05; }
    if(m.k==='lift'){ var b=bestLift(data,m.ex,m.reps||1,since); return m.real?b.real>=m.to-0.01:b.est>=m.to-0.01; }
    if(m.k==='reps') return maxReps(data,m.ex,since).n>=m.to;
    if(m.k==='long') return longest(data,m.sport,since)>=m.km-0.05;
    if(m.k==='tri') return longest(data,'swim',since)>=m.swim-0.01&&longest(data,'bike',since)>=m.bike-0.05&&longest(data,'run',since)>=m.run-0.05;
    if(m.k==='weeks') return weeksMet(data,m.per,weekStart(since))>=m.n;
    if(m.k==='rest') return !!prevDone&&daysBetween(prevDone,data.today)>=m.weeks*7;
    return false;      // manual, event: the person marks these
  }
  /* marks every stage the journal already proves, in order; returns the ones that just closed */
  function sync(goal,data){
    var fresh=[]; if(!goal||goal.status!=='on') return {fresh:fresh,finished:false};
    for(var i=0;i<goal.stages.length;i++){ var st=goal.stages[i]; if(st.done) continue; if(!stageMet(goal,st,i,data)) break; st.done=data.today; fresh.push(st); }
    var all=goal.stages.every(function(s){ return !!s.done; }); if(all){ goal.status='done'; goal.doneAt=data.today; }
    return {fresh:fresh,finished:all&&fresh.length>0};
  }
  function markStage(goal,ix,data){ var st=goal.stages[ix]; if(!st||st.done) return false; for(var i=0;i<ix;i++) if(!goal.stages[i].done) return false; st.done=data.today; if(goal.stages.every(function(s){ return !!s.done; })){ goal.status='done'; goal.doneAt=data.today; } return true; }
  /* remaining stages keep their length and start again from today */
  function replan(goal,data){ var d=data.today; goal.stages.forEach(function(s){ if(s.done) return; s.from=d; d=addDays(d,s.weeks*7); s.until=d; }); goal.due=d; goal.state='ok'; return goal; }
  function stageRatio(goal,st,ix,data){
    var m=st.m||{}, since=goal.created, lo, cur, prev=ix>0?goal.stages[ix-1]:null, pm=prev?prev.m:null;
    if(st.done) return 1;
    if(m.k==='weight'){ lo=(pm&&pm.k==='weight')?pm.to:goal.p.from; var w=weightOn(data,data.today); cur=(w&&w.d>=since)?w.kg:goal.p.from; return clamp((cur-lo)/((m.to-lo)||1),0,1); }
    if(m.k==='lift'){ lo=(pm&&pm.k==='lift')?pm.to:goal.p.from; cur=Math.max(goal.p.from,bestLift(data,m.ex,m.reps||1,since).est); return clamp((cur-lo)/((m.to-lo)||1),0,m.real?0.97:1); }
    if(m.k==='reps'){ lo=(pm&&pm.k==='reps')?pm.to:goal.p.from; cur=Math.max(goal.p.from,maxReps(data,m.ex,since).n); return clamp((cur-lo)/((m.to-lo)||1),0,1); }
    if(m.k==='long'){ lo=(pm&&pm.k==='long')?pm.km:(goal.p.from||0); cur=Math.max(goal.p.from||0,longest(data,m.sport,since)); return clamp((cur-lo)/((m.km-lo)||1),0,1); }
    if(m.k==='tri'){ var b=goal.p.base||{swim:0,bike:0,run:0}; var one=function(sp,to){ var c=Math.max(b[sp]||0,longest(data,sp,since)); return clamp(c/to,0,1); }; return (one('swim',m.swim)+one('bike',m.bike)+one('run',m.run))/3; }
    if(m.k==='weeks'){ lo=(pm&&pm.k==='weeks')?pm.n:0; return clamp((weeksMet(data,m.per,weekStart(since))-lo)/((m.n-lo)||1),0,1); }
    if(m.k==='rest'||m.k==='keep'){ var from=(prev&&prev.done)||goal.created; return clamp(daysBetween(from,data.today)/(m.weeks*7),0,m.k==='keep'?0.95:1); }
    return 0;
  }
  function progress(goal,data){
    var n=goal.stages.length, done=0, idx=-1, i; for(i=0;i<n;i++){ if(goal.stages[i].done) done++; else if(idx<0) idx=i; }
    var st=idx>=0?goal.stages[idx]:null, sp=st?stageRatio(goal,st,idx,data):1, p=goal.p||{}, since=goal.created, out={idx:idx,done:done,total:n,stage:st,stagePct:sp,pct:goal.status==='done'?1:clamp((done+sp)/n,0,0.99),need:'',cur:null,curText:'',toText:'',leftText:'',eta:'',state:'on'};
    var k=goal.kind;
    if(k==='lose'||k==='gain'){ var w=weightOn(data,data.today), fresh=w&&w.d>=since; out.cur=fresh?w.kg:p.from; out.curText=f1(out.cur)+' ק״ג'; out.toText=f1(p.to)+' ק״ג'; var left=Math.abs(out.cur-p.to), past=k==='lose'?out.cur<=p.to:out.cur>=p.to; out.leftText=past?'הגעת ליעד':'נשארו '+f1(left)+' ק״ג';
      out.pct=goal.status==='done'?1:clamp(Math.abs(out.cur-p.from)/(Math.abs(p.to-p.from)||1)*(((out.cur-p.from)*(p.to-p.from))>=0?1:0),0,0.99);
      if(!w||daysBetween(w.d,data.today)>=8) out.need='weighin';
      var wk=daysBetween(since,data.today)/7, exp=p.from+(k==='lose'?-1:1)*Math.min(Math.abs(p.to-p.from),(p.pace||0.5)*wk), diff=(k==='lose'?exp-out.cur:out.cur-exp);
      out.state=wk<1.5?'new':(diff>0.6?'ahead':(diff<-1.2?'behind':'on'));
      var old=weightOn(data,addDays(data.today,-21)); if(fresh&&old&&old.d>=addDays(since,-1)&&old.d<w.d){ var rate=(w.kg-old.kg)/(daysBetween(old.d,w.d)/7), good=k==='lose'?-rate:rate; if(good>0.05&&!past) out.eta=addDays(data.today,Math.round(left/good*7)); } }
    else if(k==='lift'){ var b=bestLift(data,p.ex,p.reps||1,since); out.cur=Math.max(p.from,b.est); out.curText=f1(Math.round(out.cur*2)/2)+' ק״ג'; out.toText=f1(p.to)+' ק״ג'; out.leftText=out.cur>=p.to?'נשאר להרים את זה באמת':'נשארו '+f1(Math.max(0,p.to-Math.round(out.cur*2)/2))+' ק״ג';
      out.pct=goal.status==='done'?1:clamp((out.cur-p.from)/((p.to-p.from)||1),0,0.97); var last=sessionsOf(data,p.ex).slice(-1)[0]; if(!last||daysBetween(last.d,data.today)>=10) out.need='log'; }
    else if(k==='reps'){ var mr=maxReps(data,p.ex,since); out.cur=Math.max(p.from,mr.n); out.curText=out.cur+' חזרות'; out.toText=p.to+' חזרות'; out.leftText='נשארו '+Math.max(0,p.to-out.cur)+' חזרות'; out.pct=goal.status==='done'?1:clamp((out.cur-p.from)/((p.to-p.from)||1),0,0.99); var l2=sessionsOf(data,p.ex).slice(-1)[0]; if(!l2||daysBetween(l2.d,data.today)>=10) out.need='log'; }
    else if(k==='run'){ var lg=Math.max(p.from||0,longest(data,'run',since)); out.cur=lg; out.curText=f1(lg)+' ק״מ'; out.toText=f1(p.km)+' ק״מ'; out.leftText='הריצה הארוכה שלך: '+f1(lg)+' ק״מ'; var rw=sportStats(data,'run',addDays(data.today,-10),''); if(!rw.n) out.need='run'; }
    else if(k==='tri'){ var s=sportStats(data,'swim',addDays(data.today,-10),''), bk=sportStats(data,'bike',addDays(data.today,-10),''), rn=sportStats(data,'run',addDays(data.today,-10),''); if(!s.n&&!bk.n&&!rn.n) out.need='run'; out.curText=''; out.toText=RACES[p.race]?RACES[p.race].he:''; out.leftText='שלב '+(Math.min(done+1,n))+' מתוך '+n; }
    else if(k==='habit'){ var met=weeksMet(data,p.perWeek,weekStart(since)); out.cur=met; out.curText=plural(met,'שבוע אחד','שבועות'); out.toText=p.weeks+' שבועות'; out.leftText='נשארו '+plural(Math.max(0,p.weeks-met),'שבוע אחד','שבועות'); out.pct=goal.status==='done'?1:clamp(met/p.weeks,0,0.99); }
    else { out.leftText='שלב '+(Math.min(done+1,n))+' מתוך '+n; }
    if(k!=='lose'&&k!=='gain'){ if(st&&st.until&&daysBetween(st.until,data.today)>10) out.state='behind'; else if(st&&st.from&&daysBetween(data.today,st.from)>10) out.state='ahead'; else if(daysBetween(since,data.today)<10) out.state='new'; }
    if(goal.status==='done') out.state='done';
    return out;
  }

  /* ---------- how the week went, in words ---------- */
  function week(goal,data,off){
    off=off==null?1:off; var a=addDays(weekStart(data.today),-7*off), b=addDays(a,7), k=goal.kind, p=goal.p||{}, lines=[], tone='ok', moved=false;
    var days=weekDays(data,a,b), wkGoal=k==='habit'?p.perWeek:(+((data.profile||{}).weekly)||3);
    if(k==='lose'||k==='gain'){
      var end=weightOn(data,addDays(b,-1)), start=weightOn(data,addDays(a,-1)), inWeek=end&&end.d>=a;
      if(inWeek&&start){ var d=end.kg-start.kg, good=k==='lose'?-d:d; if(Math.abs(d)<0.15){ lines.push('המשקל נשאר '+f1(end.kg)+' ק״ג.'); } else { lines.push((d<0?'ירדת ':'עלית ')+f1(Math.abs(d))+' ק״ג, ל-'+f1(end.kg)+'.'); if(good>0){ moved=true; tone='good'; lines.push(good>=(p.pace||0.5)*0.8?'זה הקצב שתוכנן, '+f1(p.pace||0.5)+' ק״ג בשבוע.':'קצת פחות מהמתוכנן, ועדיין בכיוון.'); if(k==='lose'&&good>Math.max(1.2,(p.from||80)*0.012)) lines.push('זה מהיר. אם זה נמשך, מוסיפים מעט אוכל כדי לשמור על השריר.'); } else { tone='low'; lines.push(k==='lose'?'שבוע אחד לא קובע: נוזלים ומלח מזיזים קילו לכאן ולשם.':'בודקים שבאמת אוכלים מעל התחזוקה.'); } } }
      else if(inWeek){ lines.push('נשקלת: '+f1(end.kg)+' ק״ג. מהשבוע הבא יש עם מה להשוות.'); }
      else { lines.push('לא נרשמה שקילה, אז אי אפשר לדעת איך היה השבוע.'); tone='low'; }
      lines.push(days>wkGoal?plural(days,'אימון אחד','אימונים')+', יותר מהיעד השבועי.':(days===wkGoal?plural(days,'אימון אחד','אימונים')+', כמו שתוכנן.':(days?plural(days,'אימון אחד','אימונים')+' מתוך '+wkGoal+'.':'בלי אימונים השבוע.')));
    } else if(k==='lift'){
      var n=p.reps||1, wk=null; eachSet(data,p.ex,a,function(x,dd){ if(dd>=b) return; var w=+x.w||0,r=+x.r||0; if(!(w>0&&r>0)) return; var v=nRM(w,r,n); if(!wk||v>wk.v) wk={v:v,w:w,r:r}; });
      var before=0; eachSet(data,p.ex,'',function(x,dd){ if(dd>=a) return; var w=+x.w||0,r=+x.r||0; if(w>0&&r>0) before=Math.max(before,nRM(w,r,n)); }); before=Math.max(before,p.from||0);
      if(!wk){ lines.push('לא התאמנת על התרגיל השבוע.'); tone='low'; }
      else { lines.push('הסט הטוב ביותר: '+f1(wk.w)+' ק״ג על '+plural(wk.r,'חזרה אחת','חזרות')+'.'); if(wk.v>before+0.4){ moved=true; tone='good'; lines.push('זה שווה ערך ל-'+f1(Math.round(wk.v*2)/2)+' ק״ג, '+f1(Math.round((wk.v-before)*2)/2)+' מעל השיא הקודם.'); } else lines.push('אותה רמה כמו קודם. כוח עולה במדרגות, לא בקו ישר.'); }
    } else if(k==='reps'){
      var best=0, prevBest=p.from||0; eachSet(data,p.ex,a,function(x,dd){ if(dd<b) best=Math.max(best,+x.r||0); }); eachSet(data,p.ex,goal.created,function(x,dd){ if(dd<a) prevBest=Math.max(prevBest,+x.r||0); });
      if(!best){ lines.push('לא נרשם השבוע סט בתרגיל.'); tone='low'; } else { lines.push('המקסימום השבוע: '+plural(best,'חזרה אחת','חזרות')+'.'); if(best>prevBest){ moved=true; tone='good'; lines.push(plural(best-prevBest,'חזרה אחת','חזרות')+' יותר מהשיא הקודם.'); } else lines.push('השיא עדיין '+prevBest+'. ממשיכים לצבור סטים קלים.'); }
    } else if(k==='run'||k==='tri'){
      var sports=k==='run'?[['run','ריצה']]:[['swim','שחייה'],['bike','רכיבה'],['run','ריצה']], any=false;
      sports.forEach(function(sp){ var s=sportStats(data,sp[0],a,b); if(!s.n) return; any=true; var prevLong=Math.max((p.base&&p.base[sp[0]])||(sp[0]==='run'?p.from:0)||0,sportStats(data,sp[0],goal.created,a).long); var t=sp[1]+': '+f1(s.km)+' ק״מ '+(s.n===1?'באימון אחד':'ב-'+s.n+' אימונים')+'.'; if(s.long>prevLong+0.05){ moved=true; t+=' הארוך ביותר עד היום: '+f1(s.long)+' ק״מ.'; } lines.push(t); });
      if(!any){ lines.push(k==='run'?'לא נרשמה ריצה השבוע.':'לא נרשמו השבוע שחייה, רכיבה או ריצה.'); tone='low'; } else tone=moved?'good':'ok';
    } else if(k==='habit'){
      var met=days>=p.perWeek; lines.push(plural(days,'אימון אחד','אימונים')+' מתוך '+p.perWeek+'.'); if(met){ moved=true; tone='good'; lines.push('שבוע מלא. '+plural(weeksMet(data,p.perWeek,weekStart(goal.created)),'שבוע אחד','שבועות')+' מתוך '+p.weeks+'.'); } else { tone='low'; lines.push(days?'חסר '+plural(p.perWeek-days,'אימון אחד','אימונים')+' לשבוע מלא.':'שבוע בלי אימונים. הספירה לא מתאפסת.'); }
    } else { lines.push(days?plural(days,'אימון אחד','אימונים')+' השבוע.':'בלי אימונים השבוע.'); tone=days?'ok':'low'; }
    var title=moved?'השבוע התקדמת לעבר המטרה':(tone==='low'?'שבוע בלי התקדמות, וזה קורה':'שבוע של שמירה על הקצב');
    var close=moved?'יפה מאוד.':(tone==='low'?'השבוע הבא מתחיל מחדש.':'ממשיכים.');
    return {key:a,until:b,title:title,lines:lines,close:close,tone:tone,moved:moved,days:days};
  }
  /* one short line: "שלב 2 מתוך 5 · נשארו 4.5 ק״ג" */
  function line(goal,data){ var pr=progress(goal,data); if(goal.status==='done') return 'הושגה ב-'+heDate(goal.doneAt,data.today); return 'שלב '+Math.min(pr.done+1,pr.total)+' מתוך '+pr.total+(pr.leftText&&goal.kind!=='tri'&&goal.kind!=='free'?' · '+pr.leftText:''); }

  return {TYPES:TYPES,RACES:RACES,typeOf:typeOf,understand:understand,ask:ask,build:build,sync:sync,markStage:markStage,replan:replan,progress:progress,week:week,line:line,
    heDate:heDate,heWeeks:heWeeks,addDays:addDays,daysBetween:daysBetween,weekStart:weekStart,weightOn:weightOn,bestLift:bestLift,maxReps:maxReps,longest:longest,sportStats:sportStats,sportOf:sportOf,norm:norm,dueFrom:dueFrom};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=GoalKit;
