# -*- coding: utf-8 -*-
"""v10: three tabs (היום · יומן · עוד), a hub of boxes instead of a long "more" list,
   one hero box on Today (progress ring + start), max ~3 action buttons per screen,
   dead code removed (old weekly planner, checklist, hints). Edits index.template.html;
   run `python build.py` afterwards to assemble index.html."""
import io, re, sys
P='index.template.html'
s=io.open(P,encoding='utf-8').read()  # universal newlines
NL='\n'

def sub1(old,new,count=1):
    global s
    n=s.count(old); assert n==count, ('expected %d, found %d: %s'%(count,n,old[:100]))
    s=s.replace(old,new)

def fn_span(name):
    """[start,end) of a top-level `function name(` incl. its closing line."""
    m=list(re.finditer(r'^(async )?function '+re.escape(name)+r'\(', s, re.M)); assert len(m)==1,(name,len(m))
    start=m[0].start(); lines=s[start:].split(NL); i=1
    while i<len(lines) and lines[i].startswith(' '): i+=1
    if i<len(lines) and lines[i].startswith('}'): i+=1
    end=start+len(NL.join(lines[:i]))+1
    body=s[start:end]; assert body.count('{')==body.count('}'), ('brace mismatch in',name)
    return start,end

def replace_fn(name,new):
    global s; a,b=fn_span(name); s=s[:a]+new.rstrip(NL)+NL+s[b:]
def delete_fn(name):
    global s; a,b=fn_span(name); s=s[:a]+s[b:]

# ---------- icons, tabs, header, router ----------
sub1("""dots:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',""",
     """dots:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
 grid:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/><circle cx="12" cy="12" r="7"/>',""")
sub1("const TABS=[['home','היום','cal'],['journal','יומן','book'],['library','תרגילים','lib'],['more','עוד','dots']];",
     "const TABS=[['home','היום','cal'],['journal','יומן','book'],['more','עוד','grid']];")
sub1("function activeTab(){ const m={ex:'home',week:'home',workout:'home',group:'library',machine:'library',gym:'library',guides:'more',read:'more',calories:'more',progress:'journal',install:'more',plans:'more',profile:'more',myex:'more',day:'journal',dayex:'journal'};",
     "function activeTab(){ const m={ex:'home',workout:'home',library:'more',group:'more',machine:'more',gym:'more',guides:'more',read:'more',calories:'more',progress:'journal',install:'more',plans:'more',profile:'more',myex:'more',settings:'more',day:'journal',dayex:'journal'};")
sub1("""  else l.append(h('button',{class:'avatar pressable','aria-label':'פרופיל',onclick:()=>go('#more')}, S.profile.photo?h('img',{src:S.profile.photo,alt:''}):(S.profile.name||'א').slice(0,1)));
""","")
sub1("const pages={home,week:home,library,group:groupPage,ex:exPage,gym,machine:machinePage,plans,guides,read:readPage,profile,calories,progress,install,journal,more,workout,myex,day:dayPage,dayex:dayExPage};",
     "const pages={home,library,group:groupPage,ex:exPage,gym,machine:machinePage,plans,guides,read:readPage,profile,calories,progress,install,journal,more,settings,workout,myex,day:dayPage,dayex:dayExPage};")

# ---------- library / gym ----------
sub1("let libQ='', libMode='all';","let libQ='';")
sub1("Sheet.close(); libMode='gym'; if(route.page!=='library') go('#library'); else render();","Sheet.close(); if(route.page!=='gym') go('#gym'); else render();")
sub1("header('מכשיר',{back:'#library'})","header('מכשיר',{back:'#gym'})")
sub1("header(m.he,{back:'#library',right:","header(m.he,{back:'#gym',right:")
sub1("go('#library'); toast('המכשיר הוסר');","go('#gym'); toast('המכשיר הוסר');")
sub1("Sheet.close(); go('#library'); toast('התרגיל נמחק');","Sheet.close(); go('#myex'); toast('התרגיל נמחק');")
sub1("header('הוספה למסך הבית',{back:'#more'})","header('הוספה למסך הבית',{back:'#settings'})")
sub1("header('התרגילים שלי',{back:'#more'})","header('התרגילים שלי',{back:'#settings'})")

# ---------- exercise page: the ⋯ menu already holds these three; drop the duplicate row ----------
s,n=re.subn(r"^  body\.append\(h\('div',\{class:'row',style:'gap:8px;margin-top:10px;flex-wrap:wrap'\},h\('button',\{class:'btn sm sec2',onclick:\(\)=>editYt\(e\)\}.*\n", "", s, flags=re.M); assert n==1,n

# ---------- workout: one finish control (in the timer box), strip instead of prev/skip ----------
sub1("header('אימון',{back:'#home',right:h('button',{class:'btn sm sec2',onclick:()=>confirmSheet('לסיים את האימון?','הסטופר ייעצר והסיכום יישמר ביומן.',woFinish,'כן, סיימתי')},'סיום')});","header('אימון',{back:'#home'});")
sub1("""  wrap.append(h('div',{class:'wo-nav'},h('button',{class:'btn sec2',disabled:i===0,onclick:()=>woGoto(i-1)},'‹ הקודם'),h('button',{class:'btn sec2',disabled:i>=ids.length-1,onclick:()=>woGoto(i+1)},'דלג ›')));
""","")

# ---------- day page: removal lives on the exercise's own page; today has its own tab ----------
sub1("""right:h('div',{class:'row',style:'gap:4px'},pr?h('span',{class:'pr',html:I('trophy')+'<span>שיא</span>'}):null,h('button',{class:'rowx','aria-label':'הסר מהיום הזה',title:'הסר מהיום הזה',html:I('minus'),onclick:ev=>{ ev.stopPropagation(); removeLogOn(k,s.id); }})),onclick:()=>go('#dayex-'+k+'-'+s.id)""",
     """right:pr?h('span',{class:'pr',html:I('trophy')+'<span>שיא</span>'}):undefined,onclick:()=>go('#dayex-'+k+'-'+s.id)""")
sub1("""  if(isToday) wrap.append(h('button',{class:'btn',style:'margin-top:12px',onclick:()=>go('#home')},'לדף היום'));
  wrap.append(credit()); return wrap;
}
function dayExPage(){""","""  wrap.append(credit()); return wrap;
}
function dayExPage(){""")
sub1("'מה שבוצע ביום הזה. לחיצה על תרגיל עורכת את הסטים, מינוס מסיר.'","'מה שבוצע ביום הזה. לחיצה על תרגיל עורכת את הסטים או מסירה אותו.'")

# ---------- day type sheet: the week auto-fill moves here from the home screen ----------
sub1("""saveWeek(); Sheet.close(); render(); }},'יום מנוחה'));
  Sheet.show(body);
}""","""saveWeek(); Sheet.close(); render(); }},'יום מנוחה'));
  body.append(h('button',{class:'lnkline center',onclick:()=>{ Sheet.close(); setTimeout(()=>confirmSheet('למלא את כל השבוע אוטומטית?',`לפי תוכנית "${(PROGRAMS.find(p=>p.id===(S.profile.program||'full'))||PROGRAMS[0]).name}" ו-${S.profile.weekly||3} אימונים בשבוע. אפשר לשנות הכול אחר כך.`,()=>{ autoFillWeek(); render(); toast('השבוע מולא. עכשיו אפשר לשחק עם הכול.'); },'כן, מלא'),300); }},'או למלא את כל השבוע אוטומטית לפי תוכנית'));
  Sheet.show(body);
}""")

# ---------- onboarding copy ----------
sub1("{t:'השבוע שלך',p:'שבעה ימים למעלה. בכל יום: אילו תרגילים, כמה סטים וחזרות. מוסיפים, מסדרים, או ממלאים אוטומטית לפי תוכנית.',",
     "{t:'השבוע שלך',p:'שבעה ימים למעלה בדף \"היום\". לוחצים על יום, בוחרים אימון ומוסיפים תרגילים. או ממלאים את כל השבוע בלחיצה אחת ב\"תוכניות\".',")

# ---------- dead code: the old full planner, checklist, hints ----------
for f in ['week','dayMenu','startChecklist','setsHint','weekDays','todayFromWeek','startPlan']: delete_fn(f)
sub1("let wkSel=new Date(todayKey()).getDay();\n","")

# ---------- HOME ----------
replace_fn('home', r"""function home(){
  header('היום');
  const wrap=h('div'); const today=new Date(todayKey()).getDay(); if(homeDay==null) homeDay=today; const sel=homeDay; const t=new Date(todayKey());
  wrap.append(h('div',{class:'display'},`${DAY_NAMES[today]}, ${t.getDate()} ב${MONTHS[t.getMonth()]}`));
  const strip=h('div',{class:'ds'});
  for(let i=0;i<7;i++){ const d=wkDay(i); const info=dayDoneInfo(i); strip.append(h('button',{class:'dsd pressable'+(i===sel?' on':'')+(i===today?' today':'')+(d.rest?' rest':''),'aria-label':`יום ${DAY_NAMES[i]}`,onclick:()=>{ if(homeDay===i){ go('#day-'+dateOfWeekday(i)); return; } homeDay=i; editMode=false; render(); }},h('span',{class:'l'},DAY_LETTERS[i]),h('i',{class:info.done?'done':(d.ex.length?'plan':'')}))); }
  wrap.append(strip);
  const d=wkDay(sel); const isToday=sel===today; const ids=isToday?todayList():(d.rest?[]:d.ex.map(x=>x.id));
  if(d.rest&&!ids.length){ wrap.append(h('div',{class:'todaybox'},h('div',{class:'restcard'},ic('heart'),h('div',{class:'k'},isToday?'היום מנוחה':`יום ${DAY_NAMES[sel]}: מנוחה`),h('div',{class:'small'},'הגוף בונה שריר דווקא עכשיו.'))),h('button',{class:'lnkline center',onclick:()=>dayTypeSheet(sel)},'בכל זאת להתאמן')); wrap.append(credit()); return wrap; }
  if(!ids.length&&!d.label){
    const sg=suggestNext(); const who=isToday?'היום':`ביום ${DAY_NAMES[sel]}`;
    if(sg) wrap.append(h('div',{class:'todaybox'},h('div',{class:'xs b muted',style:'letter-spacing:.06em;margin-bottom:4px'},sg.cycle>1?`לפי הסבב שלך (${sg.cycle} אימונים)`:'כמו פעם שעברה'),h('div',{class:'k',style:'font-size:20px'},`${isToday?'היום':`יום ${DAY_NAMES[sel]}`}: ${sg.label}`),h('div',{class:'small muted',style:'margin:4px 0 14px'},`${sg.ex.length} תרגילים, עם הסטים והמשקלים מ-${fmtDate(sg.date)}`),h('div',{class:'row',style:'gap:8px'},h('button',{class:'btn',onclick:()=>{ applyToDay(sel,{label:sg.label,groups:sg.routine?sg.routine.groups:groupsOf(sg.ex.map(x=>x.id)),ex:sg.ex,routine:sg.routine?sg.routine.id:''}); render(); toast('האימון נכנס. המשקלים מהפעם הקודמת כבר בפנים.'); }},'כן, זה האימון'),h('button',{class:'btn sec2',style:'width:auto;padding-inline:16px',onclick:()=>dayTypeSheet(sel)},'משהו אחר'))));
    else wrap.append(h('div',{class:'todaybox'},h('div',{class:'k',style:'font-size:20px'},`מה מתאמנים ${who}?`),h('div',{class:'small muted',style:'margin:4px 0 14px;line-height:1.5'},'בוחרים סוג אימון ומקבלים תרגילים מתאימים, או מוסיפים תרגיל אחד-אחד.'),h('div',{class:'row',style:'gap:8px'},h('button',{class:'btn',onclick:()=>dayTypeSheet(sel)},'בחר/י אימון'),h('button',{class:'btn sec2',style:'width:auto;padding-inline:16px',html:I('plus')+'<span>תרגיל</span>',onclick:()=>addToDaySheet(sel)}))));
    wrap.append(credit()); return wrap;
  }
  const w=isToday?woActive():null; let dn=0,tot=0; ids.forEach(id=>{ const [a,b]=isToday?setsDoneToday(id):[0,0]; const tg=d.ex.find(x=>x.id===id); dn+=a; tot+=b||(tg?(tg.sets||3):0); });
  const exDone=isToday?ids.filter(id=>doneToday(id)).length:0; const allDone=isToday&&ids.length>0&&exDone===ids.length;
  const box=h('div',{class:'todaybox'+(w?' live':'')}); const top=h('div',{class:'row',style:'gap:14px;align-items:center'});
  if(isToday){ const C=251.33; const pct=tot?Math.min(1,dn/tot):0; top.append(h('div',{class:'ring',html:`<svg viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="40" fill="none" stroke="var(--card3)" stroke-width="9"/><circle class="p" cx="48" cy="48" r="40" fill="none" stroke="${allDone?'var(--good)':'var(--accent)'}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><div class="v">${exDone}/${ids.length}<small>תרגילים</small></div>`})); requestAnimationFrame(()=>requestAnimationFrame(()=>{ const c=box.querySelector('circle.p'); if(c) c.style.strokeDashoffset=String(C*(1-pct)); })); }
  top.append(h('div',{class:'grow'},h('div',{class:'k',style:'font-size:20px;line-height:1.15'},d.label||'אימון'),h('div',{class:'small muted',style:'margin-top:3px'},isToday?(allDone?'כל הכבוד, סיימת את כל התרגילים!':(tot?`${dn} מתוך ${tot} סטים`:`${ids.length} תרגילים`)):`${ids.length} תרגילים מתוכננים`),d.groups.length&&!allDone?h('div',{class:'xs muted ell',style:'margin-top:2px'},d.groups.map(groupLabel).join(' · ')):null),h('button',{class:'iconbtn',html:I('dots'),'aria-label':'אפשרויות היום',onclick:()=>dayMenuMin(sel)}));
  box.append(top);
  if(isToday&&!editMode){ const sb=startBar(); if(sb){ box.append(sb); if(w) woTimer(); } }
  wrap.append(box);
  const list=h('div',{class:'list'});
  ids.forEach(id=>{ const e=getEx(id); if(!e) return; const [a,b]=isToday?setsDoneToday(id):[0,0]; const tg=d.ex.find(x=>x.id===id); const prevS=(S.logs[id]?.sessions||[]).slice().reverse().find(s=>s.d!==todayKey()&&s.sets.some(x=>x.w>0||x.r>0));
    let right; if(editMode&&tg){ right=h('div',{class:'row',style:'gap:2px'},h('button',{class:'iconbtn sm',html:I('chevd'),style:'transform:rotate(180deg)','aria-label':'למעלה',onclick:ev=>{ ev.stopPropagation(); const k=d.ex.indexOf(tg); if(k>0){ [d.ex[k-1],d.ex[k]]=[d.ex[k],d.ex[k-1]]; saveWeek(); render(); } }}),h('button',{class:'iconbtn sm',html:I('chevd'),'aria-label':'למטה',onclick:ev=>{ ev.stopPropagation(); const k=d.ex.indexOf(tg); if(k<d.ex.length-1){ [d.ex[k+1],d.ex[k]]=[d.ex[k],d.ex[k+1]]; saveWeek(); render(); } }}),h('button',{class:'iconbtn sm',html:I('trash'),style:'color:var(--bad)','aria-label':'הסר מהיום',onclick:ev=>{ ev.stopPropagation(); removeFromDay(sel,id); }})); }
    else right=h('span',{class:'prog'+(isToday&&b&&a===b?' done':'')},isToday&&b?`${a}/${b}`:(tg?`${tg.sets}×${tg.reps}`:''),isToday&&b&&a===b?ic('check'):null);
    list.append(exItem(e,{sub:prevS?`פעם שעברה ${setStr(prevS.sets,e)}`:subName(e),right,onclick:()=>{ if(!editMode) go('#ex-'+id); }})); });
  if(!ids.length) list.append(h('div',{class:'empty'},ic('gym'),h('div',{},'עוד אין תרגילים. בחר/י תרגילים ליום הזה.')));
  wrap.append(list);
  if(editMode) wrap.append(h('button',{class:'btn sec2',onclick:()=>{ editMode=false; render(); }},'סיימתי לסדר'));
  else wrap.append(h('button',{class:ids.length?'btn ghost':'btn',html:I('plus')+`<span>${ids.length?'תרגיל':'בחר תרגילים'}</span>`,onclick:()=>addToDaySheet(sel)}));
  wrap.append(credit()); return wrap;
}""")

# ---------- LIBRARY (lives in the hub now; the gym has its own box) ----------
replace_fn('library', r"""function library(){
  header('תרגילים',{back:'#more'});
  const wrap=h('div'); wrap.append(h('div',{class:'display'},'תרגילים'),h('p',{class:'lead'},`${allEx().length} תרגילים עם הדגמה. לפי שריר, או בחיפוש.`));
  const inp=h('input',{type:'search',placeholder:'חיפוש תרגיל (עברית / English)',value:libQ,oninput:e=>{ libQ=e.target.value; renderResults(); }});
  wrap.append(h('div',{class:'search'},ic('target'),inp));
  const results=h('div');
  const cats=h('div',{class:'grid2 stagger'},...GROUP_ORDER.map(g=>h('button',{class:'cat pressable',onclick:()=>go('#group-'+g)},h('div',{class:'ic'},ic(g)),h('div',{class:'grow'},h('div',{class:'t'},GROUPS[g]),h('div',{class:'s ell'},SUBS.filter(s=>s.g===g).length?SUBS.filter(s=>s.g===g).map(s=>s.he.replace(/ \(.*\)/,'')).join(' · '):`${S.ex.filter(e=>e.g===g).length} תרגילים`)))),h('button',{class:'cat pressable',onclick:()=>go('#group-calis')},h('div',{class:'ic'},ic('full')),h('div',{class:'grow'},h('div',{class:'t'},'קליסטניקס'),h('div',{class:'s'},`${S.ex.filter(isCalis).length} תרגילי משקל גוף, מתח ומקבילים`))));
  if(S.deck.custom?.length) cats.append(h('button',{class:'cat pressable',onclick:()=>go('#group-custom')},h('div',{class:'ic'},ic('star')),h('div',{class:'grow'},h('div',{class:'t'},'התרגילים שלי'),h('div',{class:'s'},`${S.deck.custom.length} מותאמים`))));
  function renderResults(){ results.replaceChildren(); if(libQ.trim().length<2){ results.append(cats); return; } const q=libQ.trim().toLowerCase(); const hits=allEx().filter(e=>(e.he||'').toLowerCase().includes(q)||(e.en||'').toLowerCase().includes(q)||(EQ[e.eq]||'').includes(q)||(e.pm||[]).some(m=>(MUSCLE[m]||'').includes(q))).slice(0,40); if(!hits.length){ results.append(h('div',{class:'empty'},ic('info'),'לא נמצא תרגיל כזה. אפשר להוסיף תרגיל משלך בהגדרות.')); return; } const list=h('div',{class:'list'}); hits.forEach(e=>list.append(exItem(e))); results.append(list); }
  renderResults(); wrap.append(results,credit()); return wrap;
}""")
replace_fn('gym', "function gym(){ header('המכון שלי',{back:'#more'}); const w=h('div'); w.append(h('div',{class:'display'},'המכון שלי')); w.append(gymContent()); return w; }")

# ---------- JOURNAL: one tappable summary instead of a text line with a link ----------
replace_fn('journal', r"""function journal(){
  header('יומן'); const wrap=h('div'); wrap.append(h('div',{class:'display'},'יומן'));
  const cur=weekStats(0), prev=weekStats(1);
  wrap.append(h('button',{class:'jstats pressable',onclick:()=>go('#progress')},h('div',{class:'r'},h('div',{},h('b',{},String(cur.days)),h('span',{},'אימונים השבוע')),h('div',{},h('b',{},String(cur.sets)),h('span',{},'סטים')),h('div',{},h('b',{},fmtK(cur.vol)),h('span',{},'ק״ג נפח'))),h('div',{class:'f'},h('span',{class:'row',style:'gap:8px'},'גרפים ושיאים',cur.vol&&prev.vol?delta(cur.vol,prev.vol):null),ic('chev'))));
  wrap.append(calendar());
  const sess=allSessions().sort((a,b)=>b.d.localeCompare(a.d)); const byDate={}; sess.forEach(s=>{ (byDate[s.d]=byDate[s.d]||[]).push(s); });
  const dates=Object.keys(byDate).sort().reverse().slice(0,90);
  if(!dates.length){ wrap.append(h('div',{class:'empty'},ic('book'),h('div',{},'עוד לא נרשם כלום. כל סט שתסמן/י יופיע כאן, ואפשר ללחוץ על כל יום בלוח כדי לרשום אימון מהעבר.'))); return wrap; }
  dates.forEach(dt=>{ const items=byDate[dt]; const vol=items.reduce((n,s)=>n+volOf(s),0); const dow=new Date(dt).getDay(); wrap.append(h('div',{class:'jdate',style:'cursor:pointer',onclick:()=>go('#day-'+dt)},h('div',{class:'d'},`${DAY_NAMES[dow]} ${fmtDate(dt)} ›`),h('div',{class:'s'},`${plural(items.length,'תרגיל אחד','תרגילים')}${vol?' · '+fmtK(vol)+' ק״ג':''}${S.days.map[dt]?.dur?' · '+fmtClock(S.days.map[dt].dur):''}`)));
    const list=h('div',{class:'list'}); items.forEach(s=>{ const e=getEx(s.id); if(!e) return; const b=bestSet(s.id); const pr=b&&b.d===dt&&(S.logs[s.id].sessions||[]).filter(x=>x.d<dt).length>0; list.append(exItem(e,{sub:setStr(s.sets,e),right:pr?h('span',{class:'pr',html:I('trophy')+'<span>שיא</span>'}):h('span',{class:'chev',html:I('chev')}),onclick:()=>go('#dayex-'+dt+'-'+e.id)})); }); wrap.append(list); });
  wrap.append(credit()); return wrap;
}""")

# ---------- MORE = the hub of boxes; SETTINGS gets its own page ----------
replace_fn('more', r"""function more(){
  header('עוד'); const wrap=h('div'); wrap.append(h('div',{class:'display'},'עוד'));
  const p=S.profile; const acct=STANDALONE?(PB.user?`מחובר/ת · ${PB.user.email}`:'לא מחובר/ת · לחץ/י כדי לשמור בחשבון'):(S.storageMode==='cloud'?'מחובר/ת · נשמר בחשבון':'לא מחובר/ת · נשמר בדפדפן הזה');
  wrap.append(h('button',{class:'profcard pressable',onclick:()=>go('#profile')},h('div',{class:'avatar',style:'width:52px;height:52px;font-size:20px'},p.photo?h('img',{src:p.photo,alt:''}):(p.name||'א').slice(0,1)),h('div',{class:'grow'},h('div',{class:'k',style:'font-size:18px'},p.name||'הפרופיל שלי'),h('div',{class:'small muted ell'},acct)),h('span',{class:'chev',html:I('chev')})));
  const m=bodyMetrics(p); const brand=BRANDS.find(b=>b.id===p.brand);
  const box=(icn,t,sub,hash)=>h('button',{class:'hubbox pressable',onclick:()=>go(hash)},h('div',{class:'ic'},ic(icn)),h('div',{class:'t'},t),h('div',{class:'s'},sub));
  wrap.append(h('div',{class:'hub stagger'},
    box('lib','תרגילים',`${allEx().length} תרגילים לפי שריר`,'#library'),
    box('plan','תוכניות','מילוי השבוע והמלצה להיום','#plans'),
    box('gym','המכון שלי',brand?brand.name:'המכשירים שיש לך','#gym'),
    box('book','מדריכים','איך בונים אימון, תזונה','#guides'),
    box('flame','קלוריות',m?`תחזוקה ${m.tdee.toLocaleString('he-IL')} קק״ל`:'לפי משקל, גובה וגיל','#calories'),
    box('gear','הגדרות','טיימר, מראה, גיבוי','#settings')));
  wrap.append(h('div',{class:'credit',html:'סטים · Exercise data by <a href="https://repdb.co" rel="nofollow" target="_blank">RepDB</a>. לא ייעוץ רפואי.'}));
  return wrap;
}
function settings(){
  header('הגדרות',{back:'#more'}); const wrap=h('div'); const p=S.profile; wrap.append(h('div',{class:'display'},'הגדרות'));
  const sel=(opts,cur,onc)=>{ const el=h('select',{},...opts.map(([v,l])=>h('option',{value:v,selected:String(cur)===String(v)},l))); el.addEventListener('change',()=>onc(el.value)); return el; };
  let curT=''; try{ curT=localStorage.getItem('gt:theme')||''; }catch(e){}
  wrap.append(h('div',{class:'card'},
    h('div',{class:'fld'},h('label',{},'מנוחה בין סטים'),sel([[0,'בלי טיימר'],[60,'60 שניות'],[90,'90 שניות'],[120,'2 דקות'],[150,'2.5 דקות'],[180,'3 דקות']],restSeconds(),v=>{ p.rest=+v; save('profile',p); })),
    h('div',{class:'fld'},h('label',{},'מראה'),sel([['','אוטומטי לפי המכשיר'],['dark','כהה'],['light','בהיר']],curT,v=>{ try{ if(v) localStorage.setItem('gt:theme',v); else localStorage.removeItem('gt:theme'); }catch(e){} if(!v) document.documentElement.removeAttribute('data-theme'); applyTheme(); render(); })),
    h('div',{class:'fld'},h('label',{},'הדגמות תרגילים'),sel([['','הדגמות מונפשות'],['off','תמונות']],p.anim||'',v=>{ p.anim=v||undefined; save('profile',p); toast(v?'עברנו לתמונות':'עברנו להדגמות מונפשות'); })),
    h('div',{class:'fld',style:'margin:0'},h('label',{},'באימון מודרך: מעבר לתרגיל הבא'),sel([['','אוטומטי בסוף המנוחה'],['off','רק בלחיצה']],p.autoNext||'',v=>{ p.autoNext=v||undefined; save('profile',p); }))));
  const row=(icn,t,sub,onclick)=>h('button',{class:'item pressable',onclick},h('div',{class:'th',style:'width:40px;height:40px;border-radius:12px;color:var(--accent);background:var(--accent-soft)'},ic(icn)),h('div',{class:'grow'},h('div',{class:'t ell'},t),sub?h('div',{class:'s ell'},sub):null),h('span',{class:'chev',html:I('chev')}));
  wrap.append(h('div',{class:'sec'},h('h2',{},'תרגילים')),h('div',{class:'list morelist'},row('gym','התרגילים שלי',`${(S.deck.custom||[]).length} משלי · ${(S.deck.stars||[]).length} מסומנים בכוכב`,()=>go('#myex')),row('plus','הוסף תרגיל או מכשיר','שם, קבוצת שרירים, תמונה, יוטיוב',()=>addMachineSheet())));
  wrap.append(h('div',{class:'sec'},h('h2',{},'האפליקציה')),h('div',{class:'list morelist'},STANDALONE?row('phone','הוספה למסך הבית','',()=>go('#install')):null,row('share','שתף עם חברים','getonekeyai.com',shareApp),row('info','הסבר קצר על האפליקציה','',()=>showOnboarding())));
  wrap.append(h('div',{class:'sec'},h('h2',{},'הנתונים שלי')),h('div',{class:'list morelist'},STANDALONE?(PB.user?row('cloud','יציאה מהחשבון',PB.user.email,signOut):row('cloud','כניסה או הרשמה','שמירה בחשבון ובכל מכשיר',()=>authSheet('login'))):null,row('copy','ייצוא גיבוי',`${Object.keys(S.logs).length} תרגילים עם היסטוריה · ${allSessions().length} רשומות`,exportSheet),row('edit','שחזור מגיבוי','',restoreSheet)));
  wrap.append(h('div',{class:'credit',html:'סטים · Exercise data by <a href="https://repdb.co" rel="nofollow" target="_blank">RepDB</a>. לא ייעוץ רפואי.'}));
  return wrap;
}
function exportSheet(){ const data={profile:S.profile,deck:S.deck,logs:S.logs,yt:S.yt,week:S.week,routines:S.routines,days:S.days}; const ta=h('textarea',{style:'width:100%;min-height:160px;font-size:11px',readonly:true}); ta.value=JSON.stringify(data); Sheet.show(h('div',{},h('h2',{},'גיבוי הנתונים'),h('p',{class:'small muted'},'העתק/י את הטקסט ושמור/י אותו במקום בטוח.'),ta,h('button',{class:'btn',style:'margin-top:10px',onclick:async()=>{ try{ await navigator.clipboard.writeText(ta.value); toast('הועתק'); }catch(e){ ta.select(); } }},'העתק'))); }
function restoreSheet(){ const ta=h('textarea',{style:'width:100%;min-height:120px;font-size:11px',placeholder:'הדבק/י כאן גיבוי'}); Sheet.show(h('div',{},h('h2',{},'שחזור מגיבוי'),ta,h('button',{class:'btn',style:'margin-top:10px',onclick:()=>{ try{ const d=JSON.parse(ta.value); if(d.profile){ S.profile={...S.profile,...d.profile}; save('profile',S.profile); } if(d.deck){ S.deck=d.deck; save('deck',S.deck); } if(d.yt){ S.yt=d.yt; save('yt',{map:S.yt}); } if(d.week){ S.week={days:{},...d.week}; save('week',S.week); } if(d.routines){ S.routines={list:[],...d.routines}; save('routines',S.routines); } if(d.days){ S.days={map:{},...d.days}; save('days',S.days); } if(d.logs){ Object.entries(d.logs).forEach(([k,v])=>{ S.logs[k]=v; save('log-'+k,v); }); } Sheet.close(); render(); toast('שוחזר'); }catch(e){ toast('הגיבוי לא תקין'); } }},'שחזר'))); }""")

# ---------- PROFILE: identity, body, goal (settings and backups moved to Settings) ----------
replace_fn('profile', r"""function profile(){
  header('פרופיל',{back:'#more'}); const wrap=h('div'); const p=S.profile;
  const file=h('input',{type:'file',accept:'image/*',class:'hide',id:'avatarFile'}); file.addEventListener('change',async()=>{ if(file.files[0]){ const d=await fileToDataUrl(file.files[0],256,0.8); p.photo=await storeImage(d); save('profile',p); render(); toast('תמונת הפרופיל עודכנה'); } });
  const av=h('label',{for:'avatarFile',class:'avatar pressable',style:'width:84px;height:84px;font-size:32px;cursor:pointer',title:'החלפת תמונה'},p.photo?h('img',{src:p.photo,alt:''}):(p.name||'א').slice(0,1));
  const st=STANDALONE?(PB.user?`מחובר/ת · ${PB.user.email}`:'לא מחובר/ת · הנתונים נשמרים במכשיר הזה'):S.storageMode==='cloud'?(S.canWrite===false?'מחובר/ת · צפייה בלבד בקישור הזה':'מחובר/ת · הנתונים נשמרים בחשבון שלך'):'לא מחובר/ת · נשמר בדפדפן הזה בלבד';
  wrap.append(h('div',{class:'card glow'},h('div',{class:'row'},av,h('div',{class:'grow'},h('div',{class:'display',style:'font-size:26px;margin:0'},p.name||'השם שלך'),h('div',{class:'small muted',style:'margin-top:2px'},S.me?.name||''),h('div',{class:'row',style:'gap:6px;margin-top:8px;font-size:12px;font-weight:700;color:var(--ink2)'},ic(S.storageMode==='cloud'||PB.user?'cloud':'phone'),h('span',{},st)))),h('div',{class:'row',style:'gap:8px;margin-top:14px'},h('button',{class:'btn sm sec2',html:I('edit')+'<span>ערוך שם</span>',onclick:editProfileSheet}),STANDALONE?(PB.user?h('button',{class:'btn sm sec2',onclick:signOut},'יציאה מהחשבון'):h('button',{class:'btn sm',onclick:()=>authSheet('login')},'כניסה / הרשמה')):null,file)));
  const m=bodyMetrics(p);
  wrap.append(h('div',{class:'sec'},h('h2',{},'הגוף שלי')));
  if(m){ wrap.append(h('button',{class:'grid3 stagger',style:'width:100%;margin-bottom:12px','aria-label':'עדכון נתוני גוף',onclick:editBodySheet},h('div',{class:'stat'},h('div',{class:'l',html:I('scale')+'<span>משקל</span>'}),h('div',{class:'n'},p.weight,h('small',{},' ק״ג'))),h('div',{class:'stat'},h('div',{class:'l',html:I('ruler')+'<span>גובה</span>'}),h('div',{class:'n'},p.height,h('small',{},' ס״מ'))),h('div',{class:'stat'},h('div',{class:'l',html:I('target')+'<span>BMI</span>'}),h('div',{class:'n'},m.bmi))));
    wrap.append(h('button',{class:'card pressable',style:'width:100%',onclick:()=>go('#calories')},h('div',{class:'row'},h('div',{class:'grow'},h('div',{class:'k'},'קלוריות ותזונה'),h('div',{class:'small muted'},`BMR ${m.bmr.toLocaleString('he-IL')} · תחזוקה ${m.tdee.toLocaleString('he-IL')} קק״ל ביום`)),ic('chev')))); }
  else wrap.append(h('button',{class:'card pressable',style:'width:100%',onclick:editBodySheet},h('div',{class:'row'},h('div',{class:'ic',style:'width:44px;height:44px;border-radius:14px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center'},ic('scale')),h('div',{class:'grow'},h('div',{class:'k'},'הוסף/י משקל, גובה וגיל'),h('div',{class:'small muted'},'כדי לחשב קלוריות ולהתאים את ההמלצות')),ic('chev'))));
  wrap.append(h('div',{class:'sec'},h('h2',{},'מטרה ויעד')));
  const goal=h('select',{},...Object.entries(GOALS).map(([k,v])=>h('option',{value:k,selected:p.goal===k},v))); goal.addEventListener('change',()=>{ p.goal=goal.value; save('profile',p); toast('המטרה עודכנה'); });
  const weekly=h('select',{},...[2,3,4,5,6].map(n=>h('option',{value:n,selected:(p.weekly||3)===n},n+' אימונים בשבוע'))); weekly.addEventListener('change',()=>{ p.weekly=+weekly.value; save('profile',p); });
  wrap.append(h('div',{class:'card'},h('div',{class:'fld'},h('label',{},'מטרה'),goal),h('div',{class:'fld',style:'margin:0'},h('label',{},'יעד שבועי'),weekly)));
  wrap.append(h('div',{class:'credit',html:'הנתונים נשמרים בפרופיל הפרטי שלך. המידע אינו ייעוץ רפואי.'}));
  return wrap;
}""")

# ---------- PLANS: one button fills the week; a program day opens a sheet ----------
replace_fn('plans', r"""function plans(){
  header('תוכניות',{back:'#more'}); const wrap=h('div'); wrap.append(h('div',{class:'display'},'תוכניות'),h('p',{class:'lead'},'תוכנית בסיס ממלאת את כל השבוע בלחיצה אחת. אפשר גם לקחת רק יום אחד להיום.'));
  const rec=recommendToday();
  wrap.append(h('div',{class:'card glow'},h('div',{class:'row between'},h('div',{class:'k',style:'font-size:17px'},'מומלץ להיום'),h('button',{class:'chip',html:I('shuffle')+'<span>שילוב אחר</span>',onclick:()=>{ S.profile.seed=(S.profile.seed||0)+1; save('profile',S.profile); render(); haptic(6); }})),h('div',{class:'small muted',style:'margin:4px 0 10px;line-height:1.5'},rec.title+' · '+rec.why),h('div',{class:'list',style:'box-shadow:none'},...rec.ids.map(id=>{ const e=getEx(id); return e?exItem(e,{sub:subName(e)+' · 3 סטים'}):null; })),h('button',{class:'btn',style:'margin-top:10px',onclick:()=>{ const i=new Date(todayKey()).getDay(); S.week.days[i]={label:rec.title,groups:[],ex:rec.ids.map(id=>({id,sets:3,reps:repsForGoal()})),rest:false}; saveWeek(); go('#home'); toast('נכנס ליום של היום'); }},'שים את זה בהיום')));
  wrap.append(h('div',{class:'sec'},h('h2',{},'תוכנית בסיס')));
  wrap.append(h('div',{class:'seg'},...PROGRAMS.map(p=>h('button',{class:(S.profile.program||'full')===p.id?'on':'',onclick:()=>{ S.profile.program=p.id; save('profile',S.profile); render(); }},p.name))));
  const prog=PROGRAMS.find(p=>p.id===(S.profile.program||'full'))||PROGRAMS[0];
  wrap.append(h('div',{class:'card',style:'margin-top:10px'},h('div',{class:'k'},prog.name),h('div',{class:'small muted'},prog.per),h('p',{class:'small',style:'margin:6px 0 12px;line-height:1.5'},prog.desc),h('button',{class:'btn',onclick:()=>confirmSheet('למלא את כל השבוע?',`שבעת הימים יסודרו לפי "${prog.name}" ו-${S.profile.weekly||3} אימונים בשבוע. אפשר לשנות הכול אחר כך.`,()=>{ autoFillWeek(); go('#home'); toast('השבוע מולא. עכשיו אפשר לשחק עם הכול.'); },'כן, מלא את השבוע')},'מלא את השבוע לפי התוכנית')));
  const dl=h('div',{class:'list'}); prog.days.forEach((d,i)=>{ const ids=buildDay(d,(S.profile.seed||0)*3+i); dl.append(h('button',{class:'item pressable',onclick:()=>programDaySheet(prog,d,ids)},h('div',{class:'th',style:'width:40px;height:40px;border-radius:12px;color:var(--accent);background:var(--accent-soft)'},ic('plan')),h('div',{class:'grow'},h('div',{class:'t'},'יום '+d.n),h('div',{class:'s ell'},ids.map(id=>getEx(id)?.he||'').filter(Boolean).join(' · '))),h('span',{class:'chev',html:I('chev')}))); }); wrap.append(dl);
  const ai=h('div',{class:'card'}); ai.append(h('div',{class:'row'},ic('sparkle'),h('div',{class:'k'},'תוכנית אישית עם AI')),h('p',{class:'small muted',style:'margin:6px 0 10px;line-height:1.5'},S.sample?'לפי המטרה, נתוני הגוף, המכשירים במכון וההיסטוריה האמיתית של האימונים שלך.':'זמין כשהאפליקציה נפתחת בתוך Claude עם הרשאת AI.'));
  if(S.sample){ const out=h('div',{class:'small',style:'white-space:pre-wrap;line-height:1.7'}); const btn=h('button',{class:'btn ghost',onclick:async()=>{ btn.disabled=true; out.textContent='חושב…'; try{ const hist=Object.entries(S.logs).map(([id,l])=>{ const e=getEx(id); const s=l.sessions[l.sessions.length-1]; return e&&s?`${e.en||e.he}: last ${s.d} ${s.sets.map(x=>x.w+'x'+x.r).join(',')}; best ${fmtW(bestSet(id)?.w)}`:null; }).filter(Boolean).slice(0,40).join('\n'); const mach=MACHINES.filter(m=>(S.deck.machines||[]).includes(m.id)).map(m=>m.en).join(', '); const p=S.profile; const bodyTxt=p.weight?`Body: ${p.sex==='f'?'female':'male'}, ${p.age}y, ${p.height}cm, ${p.weight}kg.`:'';
      const res=await S.sample(`You are a certified strength coach. Write a concise weekly gym program in Hebrew (Israeli gym terminology) for this person. Goal: ${GOALS[p.goal]||p.goal}. ${bodyTxt} Target ${p.weekly||3} sessions/week. Available equipment: ${mach||'standard commercial gym'}. Recent training log:\n${hist||'(no history yet)'}\nRules: progressive overload based on the log (+2.5kg when all sets hit the top of the rep range), 5-7 exercises per session, sets x reps, rest times, one technique cue per exercise, 2 lines on recovery and nutrition for the goal. Plain text with short headers, no markdown tables. One-line disclaimer that this is not medical advice.`,{onText:({text})=>{ out.textContent=text; },modelTier:'default'}); out.textContent=res.text; }catch(e){ out.textContent=e?.code==='not_granted'?'לא ניתנה הרשאה.':e?.code==='rate_limited'?'יותר מדי בקשות, נסה/י בעוד דקה.':'לא הצלחתי לבנות תוכנית כרגע.'; } btn.disabled=false; }},'בנה לי תוכנית'); ai.append(btn,out); }
  wrap.append(ai,credit()); return wrap;
}
function programDaySheet(prog,d,ids){ const body=h('div'); body.append(h('h2',{},`${prog.name} · יום ${d.n}`)); const l=h('div',{class:'list'}); ids.forEach(id=>{ const e=getEx(id); if(e) l.append(exItem(e,{sub:subName(e)+' · 3 סטים',onclick:()=>{ Sheet.close(); go('#ex-'+id); }})); }); body.append(l,h('button',{class:'btn',style:'margin-top:10px',onclick:()=>{ const di=new Date(todayKey()).getDay(); S.week.days[di]={label:prog.name+' · '+d.n,groups:[...new Set(d.slots.map(slotGroup))],ex:ids.map(id=>({id,sets:3,reps:repsForGoal()})),rest:false}; saveWeek(); Sheet.close(); go('#home'); toast('נכנס ליום של היום'); }},'שים את זה בהיום')); Sheet.show(body); }""")

# ---------- CSS: drop rules of removed UI, add the new pieces ----------
dead_prefixes=('.days{','.day{','.day i','.hero .img','.mchips{','.last{','.hint{','.wk{','.wk::','.wd{','.wd.','.wd ','.plan-ex','.mini','.start{','.start ','/* getting started checklist */','.wkline{','.lnk{','.dayhdr{','.sugg','.wo-nav{')
lines=s.split(NL); kept=[]; removed=[]
for ln in lines:
    if ln.startswith(dead_prefixes): removed.append(ln[:40]); continue
    kept.append(ln)
s=NL.join(kept); print('css lines removed:',len(removed));
for r in removed: print('   -',r)
sub1(".item .th .exanim,.plan-ex .th .exanim,.nextbar .th .exanim{transform:scale(1.18)}",".item .th .exanim,.nextbar .th .exanim{transform:scale(1.18)}")
sub1("</style>\n</head>", """/* ========================= v10: three tabs, hubs ========================= */
.todaybox{background:linear-gradient(160deg,var(--card3),var(--card) 70%);border:1px solid var(--line2);border-radius:26px;padding:16px;margin:0 0 12px;box-shadow:var(--shadow);position:relative;overflow:hidden}
.todaybox .ring{width:84px;height:84px}
.todaybox .ring .v{font-size:20px}
.todaybox .ring circle.p{transition:stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)}
.todaybox .gobar{margin:14px 0 0}
.todaybox .restcard{padding:14px 8px}
.todaybox.live{border-color:rgba(255,107,74,.35)}
.hub{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0 0}
.hubbox{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:16px 14px 14px;display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-height:136px;text-align:start;transition:border-color .2s}
.hubbox:active{border-color:var(--line2)}
.hubbox .ic{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent);margin-bottom:8px}
.hubbox .ic svg.i{width:26px;height:26px}
.hubbox .t{font-weight:900;font-size:17px;letter-spacing:-.01em;line-height:1.2}
.hubbox .s{font-size:12px;color:var(--ink2);font-weight:600;line-height:1.35}
.profcard{display:flex;align-items:center;gap:14px;width:100%;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:14px 16px;text-align:start}
.profcard .chev{color:var(--ink3);transform:scaleX(-1)}
.jstats{display:block;width:100%;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:14px 16px 12px;margin-bottom:12px;text-align:start}
.jstats .r{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center}
.jstats b{display:block;font-size:24px;font-weight:900;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}
.jstats span{display:block;font-size:11px;color:var(--ink2);font-weight:700;margin-top:5px}
.jstats .f{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid var(--line);font-size:13px;font-weight:800;color:var(--accent)}
.jstats .f span.row{display:inline-flex;align-items:center;margin:0}
.jstats .f svg.i{width:18px;height:18px;transform:scaleX(-1)}
button.grid3{display:grid}
</style>
</head>""")

io.open(P,'w',encoding='utf-8',newline='\r\n').write(s)
print('v10 edits ok ·', len(s), 'chars')
