/* ========================= BodyKit: the body's own numbers, and injuries =========================
   No screens here. What a person tells the app about the body that is not a set and not a meal: the day's steps, the heart rate, the calories
   the watch counted, the hours slept, and an injury. Sentences are understood in parts/voice.js (VoiceLog.parse gives {cmd:'body'|'injury'|'healed'});
   this file keeps the numbers, knows which exercises may load an injured place, and says what was written down.

   The document (key "sig", synced like the others; not inside the weigh-ins' document, so that a day's steps written on one phone can never
   overwrite a weigh-in written on another):
     {day: {'YYYY-MM-DD': {st steps, hr resting heart rate, kc calories the watch counted, sl hours of sleep, src, at}},      at most 400 days
      inj: [{id, part, note, from 'YYYY-MM-DD', to '' while it is active, at}]}                                                 at most 60
   src: 'm' typed, 'v' said, 'c' written to the coach, 'h' sent from the phone's health app, 'p' read from a picture. at: when it last changed (ms):
   the newer of two versions of a day wins when the watch's numbers are merged in. */
var BodyKit=(function(){
  function has(o,k){ return Object.prototype.hasOwnProperty.call(o,k); }
  function num(n){ return Math.round(n).toLocaleString('he-IL'); }
  var FIELDS=['st','hr','kc','sl'];
  var RANGE={st:[1,150000],hr:[25,230],kc:[1,15000],sl:[0.5,24]};
  var PARTS=[['shoulder','כתף'],['elbow','מרפק'],['wrist','שורש כף היד'],['neck','צוואר'],['upper_back','גב עליון'],['lower_back','גב תחתון'],['hip','ירך ומפשעה'],['knee','ברך'],['ankle','קרסול וכף רגל'],['other','מקום אחר']];
  var PART_HE={}; PARTS.forEach(function(p){ PART_HE[p[0]]=p[1]; });
  function partHe(k){ return PART_HE[k]||PART_HE.other; }
  /* the place as it is said after "על" or "ל": "על הכתף", "לגב התחתון" */
  var PART_THE={shoulder:'הכתף',elbow:'המרפק',wrist:'שורש כף היד',neck:'הצוואר',upper_back:'הגב העליון',lower_back:'הגב התחתון',hip:'הירך והמפשעה',knee:'הברך',ankle:'הקרסול וכף הרגל',other:'מקום הפציעה'};
  function partThe(k){ return PART_THE[k]||PART_THE.other; }
  function shape(sig){ sig=sig||{}; if(!sig.day||typeof sig.day!=='object') sig.day={}; if(!Array.isArray(sig.inj)) sig.inj=[]; return sig; }
  function addDays(d,n){ var t=new Date(d+'T12:00:00Z'); t.setUTCDate(t.getUTCDate()+n); return t.toISOString().slice(0,10); }
  function daysBetween(a,b){ return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000); }

  /* ---------- a day's numbers ---------- */
  /* what may be stored of a patch: a number inside its range, rounded; null or '' asks to clear the field; anything else is dropped */
  function clean(patch){
    var out={}; patch=patch||{};
    FIELDS.forEach(function(k){ if(!has(patch,k)) return; var v=patch[k]; if(v===null||v===''){ out[k]=null; return; } v=+v; var r=RANGE[k]; if(!isFinite(v)||v<r[0]||v>r[1]) return; out[k]=k==='sl'?Math.round(v*4)/4:Math.round(v); });
    return out;
  }
  function dayOf(sig,date){ return (sig&&sig.day&&sig.day[date])||{}; }
  /* -> the keys that changed. A day with nothing left in it is removed */
  function setDay(sig,date,patch,src,now){
    shape(sig); if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))) return [];
    var c=clean(patch), d=sig.day[date]||{}, ch=[];
    FIELDS.forEach(function(k){ if(!has(c,k)) return; if(c[k]===null){ if(has(d,k)){ delete d[k]; ch.push(k); } } else if(d[k]!==c[k]){ d[k]=c[k]; ch.push(k); } });
    if(!ch.length) return ch;
    d.at=+now||Date.now(); d.src=src||'m';
    if(FIELDS.some(function(k){ return has(d,k); })) sig.day[date]=d; else delete sig.day[date];
    var keys=Object.keys(sig.day).sort(); if(keys.length>400) keys.slice(0,keys.length-400).forEach(function(k){ delete sig.day[k]; });
    return ch;
  }
  /* the seven days that end today: how many have steps, their average, on how many the goal was met, and the average resting heart rate */
  function week(sig,today,goal){
    var n=0,sum=0,met=0,hn=0,hs=0,i,d;
    for(i=0;i<7;i++){ d=dayOf(sig,addDays(today,-i)); if(d.st!=null){ n++; sum+=d.st; if(goal>0&&d.st>=goal) met++; } if(d.hr!=null){ hn++; hs+=d.hr; } }
    return {days:n,avg:n?Math.round(sum/n):0,met:met,hr:hn?Math.round(hs/hn):0};
  }
  /* what the phone's health app sent (the watch): each item is a day; it is taken when it is newer than what the day holds. -> how many days changed */
  function merge(sig,items){
    shape(sig); var n=0;
    (items||[]).forEach(function(it){ if(!it||!it.d) return; var cur=sig.day[it.d]; if(cur&&(+cur.at||0)>=(+it.at||0)) return; if(setDay(sig,it.d,it,'h',+it.at||Date.now()).length) n++; });
    return n;
  }

  /* ---------- injuries ---------- */
  function active(sig){ return shape(sig).inj.filter(function(x){ return x&&!x.to; }).sort(function(a,b){ return (b.at||0)-(a.at||0); }); }
  /* one active injury for each place: saying it again keeps its first day and takes the new note */
  function injure(sig,part,note,today,now){
    shape(sig); part=has(PART_HE,part)?part:'other'; note=String(note||'').replace(/\s+/g,' ').trim().slice(0,160); now=+now||Date.now();
    var cur=sig.inj.filter(function(x){ return !x.to&&x.part===part; })[0];
    if(cur){ if(note) cur.note=note; cur.at=now; return cur; }
    var it={id:'i'+now.toString(36)+Math.floor(Math.random()*1296).toString(36),part:part,note:note,from:today,to:'',at:now};
    sig.inj.push(it); if(sig.inj.length>60) sig.inj=sig.inj.slice(-60);
    return it;
  }
  /* which: an id, a place, or '' for every active injury. -> how many were closed */
  function heal(sig,which,today,now){
    var n=0; active(sig).forEach(function(x){ if(which&&x.id!==which&&x.part!==which) return; x.to=today; x.at=+now||Date.now(); n++; });
    return n;
  }
  /* may this exercise load that place? A guide and not a diagnosis: it reads the muscles the exercise works, its name, and the safety tags of the
     exercise data. e: {id, g, cat, pm[], sm[], tags[]} */
  var MUS={shoulder:['anterior_deltoid','lateral_deltoid','posterior_deltoid','supraspinatus','infraspinatus_teres_minor'],elbow:['biceps_brachii','brachialis','brachioradialis','triceps_brachii'],
    wrist:['forearm_flexors','forearm_extensors','forearms'],neck:['trapezius'],upper_back:['trapezius','rhomboids','latissimus_dorsi','infraspinatus_teres_minor','posterior_deltoid'],
    lower_back:['erector_spinae','quadratus_lumborum'],hip:['hip_flexors','adductors','abductors','gluteus_maximus','gluteus_medius'],knee:['quadriceps','hamstrings'],ankle:['gastrocnemius','soleus','tibialis_anterior']};
  var NAME={shoulder:/press|push-?up|dip|pull-?up|chin-?up|pulldown|raise|fly|overhead|snatch|clean|handstand|upright|bench/,elbow:/curl|extension|press|push-?up|dip|pull-?up|chin-?up|row|pushdown|skull/,
    wrist:/push-?up|plank|handstand|press|curl|clean|snatch|front-squat|farmer|hang/,neck:/shrug|upright-row|neck|overhead/,upper_back:/row|pull-?up|chin-?up|pulldown|shrug|face-pull|reverse-fly/,
    lower_back:/deadlift|good-morning|squat|bent-over|hyperextension|back-extension|superman|swing|clean|snatch|rdl/,hip:/squat|lunge|deadlift|thrust|bridge|step|leg-press|split|abduct|adduct|kick/,
    knee:/squat|lunge|leg-press|leg-extension|leg-curl|step|jump|run|sprint|box|pistol|skater|burpee|stairs|hack/,ankle:/calf|jump|run|sprint|skip|rope|box|burpee|lunge|stairs/};
  var SAFE={shoulder:'shoulder_safe',knee:'knee_safe',lower_back:'lower_back_safe'};
  var GROUP={shoulder:['shoulders','chest'],elbow:['arms','chest'],wrist:['arms'],neck:['shoulders'],upper_back:['back'],lower_back:['back','legs','glutes'],hip:['legs','glutes'],knee:['legs','glutes'],ankle:['legs']};
  /* a name counts only inside the part of the body it belongs to: "leg-press" has "press" in it and is no business of the shoulder */
  var UPPER=['chest','back','shoulders','arms','core','full','calis'], LOWER=['legs','glutes','cardio','full'], TRUNK=['back','legs','glutes','core','full'];
  var ZONE={shoulder:UPPER,elbow:UPPER,wrist:UPPER,neck:UPPER,upper_back:UPPER,lower_back:TRUNK,hip:LOWER,knee:LOWER,ankle:LOWER};
  function any(list,set){ for(var i=0;i<list.length;i++) if(set.indexOf(list[i])>=0) return true; return false; }
  function loads(part,e){
    if(!e||!has(MUS,part)) return false;
    var pm=e.pm||[], sm=e.sm||[], id=String(e.id||'').toLowerCase(), tags=e.tags||[];
    if(e.cat==='stretching'||e.g==='stretch') return false;
    if(any(pm,MUS[part])||(NAME[part].test(id)&&ZONE[part].indexOf(e.g)>=0)) return true;
    if((part==='knee'||part==='ankle')&&(e.g==='cardio'||e.cat==='cardio')&&!/swim/.test(id)) return true;      // running, stairs, ball games
    if(any(sm,MUS[part])) return !(SAFE[part]&&tags.indexOf(SAFE[part])>=0);      // a secondary muscle only: the data's own "safe" tag is trusted
    if(!pm.length&&!sm.length) return GROUP[part].indexOf(e.g)>=0;      // an exercise the person added: only its group is known
    return false;
  }
  /* exs: today's exercises, as objects. -> the active injuries, each with the exercises of today that may load it */
  function hits(sig,exs,today){
    return active(sig).map(function(x){ var ids=[]; (exs||[]).forEach(function(e){ if(e&&loads(x.part,e)) ids.push(e.id); });
      return {id:x.id,part:x.part,he:partHe(x.part),the:partThe(x.part),note:x.note||'',from:x.from,days:x.from&&today?Math.max(0,daysBetween(x.from,today)):0,hits:ids.length,ids:ids}; });
  }

  /* ---------- what is said back ---------- */
  function fmt(v){ var x=Math.round(v*100)/100; return String(x); }
  /* o: {goal (steps a day), back (1: it was written for yesterday), lang} */
  function say(patch,o){
    o=o||{}; var c=clean(patch), en=o.lang==='en', parts=[];
    if(c.st!=null) parts.push(en?num(c.st)+' steps':num(c.st)+' צעדים');
    if(c.hr!=null) parts.push(en?'heart rate '+c.hr:'דופק '+c.hr);
    if(c.kc!=null) parts.push(en?num(c.kc)+' calories from the watch':num(c.kc)+' קלוריות מהשעון');
    if(c.sl!=null) parts.push(en?fmt(c.sl)+' hours of sleep':fmt(c.sl)+' שעות שינה');
    if(!parts.length) return en?'I did not catch a number to write down.':'לא הבנתי איזה מספר לרשום.';
    var s=en?('Logged'+(o.back?' for yesterday':'')+': '+parts.join(', ')+'.'):('נרשם'+(o.back?' לאתמול':'')+': '+parts.join(', ')+'.');
    if(c.st!=null&&o.goal>0&&c.st>=o.goal&&!o.back) s+=en?' That is your steps goal. Well done!':' עברת את יעד הצעדים. כל הכבוד!';
    return s;
  }
  var CARE='אם הכאב חזק או נמשך יותר משבוע, פונים לרופא או לפיזיותרפיסט.', CARE_EN='If the pain is strong or lasts more than a week, see a doctor or a physiotherapist.';
  function sayInjury(part,lang){
    var known=has(MUS,part);
    if(lang==='en') return 'Noted the injury. '+(known?'Exercises that may load that place will be marked. ':'')+CARE_EN;
    return 'רשמתי פציעה'+(known?': '+partHe(part)+'. תרגילים שעשויים להעמיס על האזור יסומנו. ':'. ')+CARE;
  }
  function sayHealed(n,lang){ if(lang==='en') return n?'Good to hear. The injury is closed.':'There is no active injury on record.'; return n?'טוב לשמוע. הפציעה נסגרה.':'לא רשומה פציעה פעילה.'; }

  return {FIELDS:FIELDS,RANGE:RANGE,PARTS:PARTS,partHe:partHe,partThe:partThe,shape:shape,clean:clean,dayOf:dayOf,setDay:setDay,week:week,merge:merge,active:active,injure:injure,heal:heal,loads:loads,hits:hits,
    say:say,sayInjury:sayInjury,sayHealed:sayHealed,CARE:CARE,addDays:addDays,daysBetween:daysBetween};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=BodyKit;
