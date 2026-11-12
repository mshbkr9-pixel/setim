/* ========================= PulseKit: what the coach says without being asked =========================
   No screens here and no model: plain rules over what the app already knows. For each of the two sectors it gives the card that sits on top:
   the goal and how far it is, up to two sentences, and at most one step for which the screen has no button of its own (a weigh-in, an injury).

   Three rules shape the sentences:
   1. The coach says only what the screen does not already show. The fitness page has the week's ring and today's workout right under the card,
      the nutrition page has the calories that are left and the three bars: so the sentences are about what those numbers mean (what today's
      workout does for the week, how far a lift has come, whether there was a vegetable today), not the numbers again. With nothing to add,
      nothing is said.
   2. "כל הכבוד" is for doing: a workout, a full week, a record, the steps, the protein, a day inside the target. Never for eating little.
   3. The words depend only on the data and on the hour, never on chance: the pages are painted again and again, and the words must not jump.

   env (built once per paint by pulseEnv() in parts/v14.js; every part may be missing):
     hour
     goal: {title, pct 0..1, left 'נשארו 6.4 ק״ג', state 'ahead'|'on'|'behind'|'new'|'done', need ''|'weighin'|'log'|'run', weight (true for a goal measured on the scale),
            week: {moved, line 'ירדת 0.6 ק״ג, ל-82.6.', fresh (true from Sunday to Tuesday)} | null}
     fit:  {weekly, weekDone, streak, pr, prName, lastGap (days since the last workout, null if there was none), gain {name, pct} (the lift that grew most since the start),
            today: {rest, planned, allDone, ring (the page shows the week's ring today)}}
     food: {ok, kcal, p, eaten {k,p}, state 'none'|'low'|'under'|'ok'|'over', hitP, meals, week {days, ok, hitP}, veg (portions of vegetables and fruit today, null if unknown)}
     body: {steps, stepsGoal, weighDays (days since the last weigh-in, null if never), injuries [{part 'כתף', hits (today's exercises that may load it)}]} */
var PulseKit=(function(){
  function num(n){ return Math.round(n).toLocaleString('he-IL'); }
  function cnt(n,one,two,many){ return n===1?one:(n===2?two:n+' '+many); }
  function workouts(n){ return cnt(n,'אימון אחד','שני אימונים','אימונים'); }
  function exercises(n){ return cnt(n,'תרגיל אחד','שני תרגילים','תרגילים'); }
  function days(n){ return cnt(n,'יום אחד','יומיים','ימים'); }
  var STATE={ahead:'מקדים את התוכנית',on:'בקצב',behind:'מאחורי התוכנית',new:'רק התחלנו',done:'הושגה'};

  /* the goal line that both sectors open with */
  function goalOf(env){
    var g=env&&env.goal; if(!g||!g.title) return null;
    return {title:g.title,pct:Math.max(0,Math.min(1,+g.pct||0)),left:g.left||'',state:g.state||'on',stateText:STATE[g.state]||STATE.on};
  }
  function weighDue(env){ var g=env.goal||{}, b=env.body||{}; return !!g.weight&&(g.need==='weighin'||(b.weighDays!=null&&b.weighDays>=8)); }
  function weekMoved(g){ return !!(g&&g.week&&g.week.fresh&&g.week.moved&&g.week.line); }
  function sayer(){ var out=[], good0=false; return {add:function(s,good){ if(!out.length&&good) good0=true; out.push(s); },n:function(){ return out.length; },done:function(step){ return {say:out.slice(0,2),praise:good0,step:step||null}; }}; }

  /* ---------- fitness ---------- */
  function fit(env){
    var f=env.fit||{}, t=f.today||{}, b=env.body||{}, g=env.goal, S=sayer(), step=null;
    var wk=+f.weekly||3, done=+f.weekDone||0, left=Math.max(0,wk-done), full=done>=wk, finished=!!(t.allDone&&t.planned>0);
    var inj=(b.injuries||[]).filter(function(x){ return x.hits>0; })[0], stepsMet=b.steps!=null&&b.stepsGoal>0&&b.steps>=b.stepsGoal;
    /* what was done */
    if(finished) S.add(full?'כל הכבוד! סיימת את האימון, והיעד השבועי הושג: '+done+' מתוך '+wk+'.':'כל הכבוד, סיימת את האימון של היום. '+done+' מתוך '+wk+' השבוע.',true);
    else if(f.pr>0) S.add('שיא חדש היום'+(f.prName?' ב'+f.prName:'')+'. כל הכבוד!',true);
    else if(full) S.add('היעד השבועי הושג: '+workouts(done)+'. כל הכבוד!',true);
    /* what to watch */
    if(inj){ S.add('שמים לב ל'+inj.part+': '+exercises(inj.hits)+' היום '+(inj.hits===1?'עשוי':'עשויים')+' להעמיס על האזור.'); step={k:'injury',t:'הפציעה'}; }
    /* what today's workout does for the week */
    if(!finished&&t.planned>0) S.add(left<=0?'היעד השבועי כבר הושג. האימון של היום הוא תוספת.':(left===1?'האימון של היום סוגר את היעד השבועי.':'אחרי האימון של היום '+(left===2?'יישאר עוד אימון אחד':'יישארו עוד '+workouts(left-1))+' עד היעד השבועי.'));
    else if(!finished&&!full&&done===0&&f.lastGap!=null&&f.lastGap>=5) S.add('עברו '+days(f.lastGap)+' מהאימון האחרון. אימון קצר היום מחזיר לקצב.');
    /* more that was earned */
    if(stepsMet) S.add(S.n()?'וגם יעד הצעדים הושג: '+num(b.steps)+'.':'עברת את יעד הצעדים: '+num(b.steps)+'. כל הכבוד!',true);
    if(weekMoved(g)) S.add('השבוע שעבר קירב אותך למטרה: '+g.week.line,true);
    /* how far it has come */
    if(f.gain&&f.gain.name&&f.gain.pct>=3) S.add('מאז שהתחלת: '+f.gain.name+', '+Math.round(f.gain.pct)+'% יותר.');
    /* the week as a number, only on a day when the page does not show it as a ring */
    if(!t.ring&&!finished&&!full){
      if(done>0) S.add(done+' מתוך '+wk+' אימונים השבוע'+(t.rest?'.':', עוד '+(left===1?'אחד':left)+' עד היעד.'));
      else if(f.lastGap==null) S.add('האימון הראשון עוד לפניך.');
      else if(!(f.lastGap>=5)) S.add('השבוע עוד לא נרשם אימון.');
    }
    return S.done(step);
  }

  /* ---------- nutrition ---------- */
  function food(env){
    var n=env.food||{}, g=env.goal, hour=env.hour==null?12:+env.hour, S=sayer(), step=null;
    if(!n.ok){ var r=S.done(null); r.none=true; return r; }
    var k=Math.round((n.eaten||{}).k||0), leftP=Math.round((+n.p||0)-((n.eaten||{}).p||0)), st=n.state||'none', wk=n.week||{}, lateLow=st==='low'&&hour>=21;
    /* what was done */
    if(st==='ok'&&n.hitP) S.add('כל הכבוד, היום בתוך היעד, כולל החלבון.',true);
    else if(n.hitP&&k>0&&!lateLow) S.add('כל הכבוד, יעד החלבון של היום הושג.',true);
    /* the scale, when the goal is measured on it */
    if(weighDue(env)){ S.add('עבר יותר משבוע מאז השקילה. שקילה בבוקר מראה איפה עומדים.'); step={k:'weigh',t:'שקילה'}; }
    if(g&&g.weight&&weekMoved(g)) S.add('השבוע שעבר קירב אותך למטרה: '+g.week.line,true);
    /* eating well is more than the count */
    if(n.veg!=null&&n.veg>=4) S.add(n.veg+' מנות ירק ופרי היום. כל הכבוד!',true);
    else if(n.veg===0&&n.meals>=2&&hour>=13) S.add('עוד אין ירק או פרי היום.');
    if(lateLow) S.add('נרשם היום הרבה פחות מהיעד. אם אכלת יותר, כדאי להשלים את הרישום.');      // never a success
    else if(k>0&&!n.hitP&&leftP>=40&&hour>=15&&st!=='over') S.add('חסרים עוד '+num(leftP)+' ג׳ חלבון. ארוחה עם חלבון תסגור את הפער.');
    /* the week */
    if(wk.ok>=4) S.add(days(wk.ok)+' בתוך היעד השבוע. כל הכבוד על העקביות.',true);
    else if(wk.hitP>=4) S.add('יעד החלבון הושג ב-'+days(wk.hitP)+' השבוע. כל הכבוד!',true);
    return S.done(step);
  }

  /* sector: 'fit' or 'food'  ->  {goal | null, say [up to two sentences, maybe none], praise (the first sentence is praise), step {k,t} | null, none (the sector has no target yet)} */
  function brief(env,sector){
    env=env||{}; var r=sector==='food'?food(env):fit(env);
    return {goal:goalOf(env),say:r.say,praise:!!r.praise,step:r.step||null,none:!!r.none};
  }
  return {brief:brief,fit:fit,food:food,goalOf:goalOf,STATE:STATE,num:num};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=PulseKit;
