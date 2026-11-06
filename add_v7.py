# -*- coding: utf-8 -*-
"""v7: detailed muscle taxonomy (22 sub-groups) used in the library filters, day composition, picker and stats."""

HELPERS = r"""
/* ========================= v7: detailed muscles ========================= */
const SUBS=[
 {id:'chest_upper',he:'חזה עליון',g:'chest'},{id:'chest_mid',he:'חזה',g:'chest',m:['pectoralis_major','serratus_anterior']},{id:'chest_lower',he:'חזה תחתון',g:'chest'},
 {id:'lats',he:'לאטס (גב רחב)',g:'back',m:['latissimus_dorsi']},{id:'back_upper',he:'גב עליון',g:'back',m:['trapezius','rhomboids','infraspinatus_teres_minor']},{id:'back_lower',he:'גב תחתון',g:'back',m:['erector_spinae','quadratus_lumborum']},
 {id:'delt_front',he:'כתף קדמית',g:'shoulders',m:['anterior_deltoid']},{id:'delt_side',he:'כתף אמצעית',g:'shoulders',m:['lateral_deltoid','supraspinatus']},{id:'delt_rear',he:'כתף אחורית',g:'shoulders',m:['posterior_deltoid']},
 {id:'biceps',he:'יד קדמית (ביצפס)',g:'arms',m:['biceps_brachii','brachialis','brachioradialis']},{id:'triceps',he:'יד אחורית (טריצפס)',g:'arms',m:['triceps_brachii']},{id:'forearms',he:'אמות',g:'arms',m:['forearm_flexors','forearm_extensors','forearms']},
 {id:'quads',he:'ארבע-ראשי',g:'legs',m:['quadriceps']},{id:'hams',he:'האמסטרינג',g:'legs',m:['hamstrings']},{id:'calves',he:'תאומים',g:'legs',m:['gastrocnemius','soleus','tibialis_anterior']},{id:'adductors',he:'מקרבים ומפשקים',g:'legs',m:['adductors','abductors']},{id:'hipflex',he:'כופפי ירך',g:'legs',m:['hip_flexors']},
 {id:'glute_max',he:'ישבן',g:'glutes',m:['gluteus_maximus']},{id:'glute_med',he:'ישבן צדי',g:'glutes',m:['gluteus_medius']},
 {id:'abs',he:'בטן ישרה',g:'core',m:['rectus_abdominis']},{id:'obliques',he:'אלכסונים',g:'core',m:['obliques']},{id:'core_deep',he:'ליבה עמוקה',g:'core',m:['transverse_abdominis']},
];
const SUB_BY_ID=Object.fromEntries(SUBS.map(s=>[s.id,s]));
const M2SUB={}; SUBS.forEach(s=>(s.m||[]).forEach(m=>{ M2SUB[m]=s.id; }));
const LOWER_RX={quads:/squat|leg-press|lunge|split|leg-extension|hack|step-up|wall-sit|pistol|box-jump|thruster|sissy/,hams:/deadlift|rdl|leg-curl|good-morning|hamstring|nordic|hinge|stiff-leg|swing|pull-through|back-extension|hyperextension/,glute_max:/thrust|bridge|kickback|clamshell|fire-hydrant|glute|donkey|sumo/};
function subsOf(e){ if(!e||e.custom) return e&&e.sub?[e.sub]:[]; const out=[]; const add=s=>{ if(s&&!out.includes(s)) out.push(s); };
  if(e.g==='chest'){ add(/incline/.test(e.id)?'chest_upper':/decline/.test(e.id)?'chest_lower':'chest_mid'); }
  if(e.g==='legs'||e.g==='glutes'||e.g==='full'){ Object.entries(LOWER_RX).forEach(([s,rx])=>{ if(rx.test(e.id)) add(s); }); }
  (e.pm||[]).forEach(m=>add(M2SUB[m])); (e.sm||[]).slice(0,3).forEach(m=>add(M2SUB[m]));
  return out; }
function subOf(e){ return subsOf(e)[0]||null; }
function subName(e){ const s=SUB_BY_ID[subOf(e)]; return s?s.he:(MUSCLE[e.pm?.[0]]||GROUPS[e.g]||''); }
function groupLabel(g){ return SUB_BY_ID[g]?SUB_BY_ID[g].he:(GROUPS[g]||g); }
function matchGroups(e,groups){ if(!groups||!groups.length) return true; const subs=subsOf(e); return groups.some(g=>g===e.g||subs.includes(g)||(SUB_BY_ID[g]&&subs[0]===g)); }
function primaryMatch(e,groups){ const subs=subsOf(e); return groups.some(g=>g===e.g||subs[0]===g); }
let subFilter='all';
"""

NEW_COMBO = r"""  body.append(h('div',{class:'xs b muted',style:'margin:12px 0 6px;letter-spacing:.04em'},'או הרכב/י בעצמך (עד 3 שרירים)'));
  let picked=[]; const combo=h('div');
  const go2=h('button',{class:'btn',style:'margin-top:12px',disabled:true},'בחר/י שרירים');
  const paint=()=>{ combo.querySelectorAll('.gchip').forEach(c=>c.classList.toggle('on',picked.includes(c.dataset.g))); go2.disabled=!picked.length; go2.textContent=picked.length?`המשך: ${picked.map(groupLabel).join(' + ')}`:'בחר/י שרירים'; };
  const togg=g=>{ if(picked.includes(g)) picked=picked.filter(x=>x!==g); else { picked.push(g); if(picked.length>3) picked.shift(); } paint(); };
  GROUP_ORDER.filter(g=>!['stretch','cardio'].includes(g)).forEach(g=>{ const row=h('div',{class:'gchips',style:'margin-bottom:8px'}); row.append(h('button',{class:'gchip','data-g':g,html:I(g)+`<span>${g==='core'?'כל הבטן':'כל ה'+GROUPS[g]}</span>`,onclick:()=>togg(g)})); SUBS.filter(s=>s.g===g).forEach(s=>row.append(h('button',{class:'gchip','data-g':s.id,onclick:()=>togg(s.id)},s.he))); combo.append(row); });
  body.append(combo); go2.addEventListener('click',()=>{ d.rest=false; d.label=picked.map(groupLabel).join(' + '); d.groups=[...picked]; d.routine=''; saveWeek(); Sheet.close(); render(); if(!d.ex.length) setTimeout(()=>addToDaySheet(i),350); }); body.append(go2);
"""

EDITS = [
 ("/* ========================= v6: outdoor, routines, rotation =========================", HELPERS + "\n/* ========================= v6: outdoor, routines, rotation ========================="),
 # presets use detailed muscles where natural
 ("{l:'דחיפה',g:['chest','shoulders','arms']},{l:'משיכה',g:['back','arms']},", "{l:'דחיפה',g:['chest','delt_front','delt_side','triceps']},{l:'משיכה',g:['back','biceps','delt_rear']},"),
 ("{l:'חזה וטריצפס',g:['chest','arms']},{l:'גב וביצפס',g:['back','arms']},", "{l:'חזה וטריצפס',g:['chest','triceps']},{l:'גב וביצפס',g:['back','biceps']},"),
 # picker: day filter + auto group add
 ("else if(mode==='day') items=items.filter(e=>d.groups.includes(e.g));", "else if(mode==='day') items=items.filter(e=>matchGroups(e,d.groups));"),
 ("if(!d.groups.includes(e.g)&&e.g!=='full') d.groups.push(e.g); if(d.routine) updateRoutineFromDay(i);", "if(!matchGroups(e,d.groups)){ const sg=subOf(e)||e.g; if(sg!=='full') d.groups.push(sg); } if(d.routine) updateRoutineFromDay(i);"),
 ("const score=e=>(stars.has(e.id)?4:0)+(lastSession(e.id)?3:0)+(fromM.has(e.id)?2:0)+(e.mech==='compound'?1:0); items=items.sort((a,b)=>score(b)-score(a)).slice(0,60);",
  "const score=e=>(mode==='day'&&primaryMatch(e,d.groups)?5:0)+(stars.has(e.id)?4:0)+(lastSession(e.id)?3:0)+(fromM.has(e.id)?2:0)+(e.mech==='compound'?1:0); items=items.sort((a,b)=>score(b)-score(a)).slice(0,60);"),
 # labels of groups everywhere
 ("h('div',{class:'small muted'},d.groups.map(g=>GROUPS[g]).join(' · '))", "h('div',{class:'small muted'},d.groups.map(groupLabel).join(' · '))"),
 ("h('div',{class:'s ell'},`${r.ex.length} תרגילים · ${(r.groups||[]).map(g=>GROUPS[g]).join(', ')}`)", "h('div',{class:'s ell'},`${r.ex.length} תרגילים · ${(r.groups||[]).map(groupLabel).join(', ')}`)"),
 ("groupsOf(d.ex.map(x=>x.id)).map(g=>GROUPS[g]).join(' + ')", "groupsOf(d.ex.map(x=>x.id)).map(groupLabel).join(' + ')"),
 ("function groupsOf(ids){ const g=[]; ids.forEach(id=>{ const e=getEx(id); if(e&&e.g!=='full'&&!g.includes(e.g)) g.push(e.g); }); return g; }",
  "function groupsOf(ids){ const g=[]; ids.forEach(id=>{ const e=getEx(id); const sg=e?(subOf(e)||e.g):null; if(sg&&sg!=='full'&&!g.includes(sg)) g.push(sg); }); return g.slice(0,4); }"),
 # subtitles show the detailed muscle
 ("(e.custom?'תרגיל מותאם':(EQ[e.eq]||e.eq)+' · '+(MUSCLE[e.pm?.[0]]||GROUPS[e.g]||''))", "(e.custom?'תרגיל מותאם':(EQ[e.eq]||e.eq)+' · '+subName(e))"),
 # progress distribution by detailed muscle
 ("const e=getEx(s.id); if(e) dist[e.g]=(dist[e.g]||0)+s.sets.length; });", "const e=getEx(s.id); if(e){ const k=subOf(e)||e.g; dist[k]=(dist[k]||0)+s.sets.length; } });"),
 ("rows.forEach(([g,n])=>c.append(h('div',{class:'hbar'},h('span',{class:'l'},GROUPS[g]),", "rows.forEach(([g,n])=>c.append(h('div',{class:'hbar'},h('span',{class:'l ell'},groupLabel(g)),"),
 # library tiles: list the sub-groups
 ("h('div',{class:'s'},`${S.ex.filter(e=>e.g===g).length} תרגילים`)))),h('button',{class:'cat pressable',onclick:()=>go('#group-calis')}",
  "h('div',{class:'s ell'},SUBS.filter(s=>s.g===g).length?SUBS.filter(s=>s.g===g).map(s=>s.he.replace(/ \\(.*\\)/,'')).join(' · '):`${S.ex.filter(e=>e.g===g).length} תרגילים`)))),h('button',{class:'cat pressable',onclick:()=>go('#group-calis')}"),
 # group page: sub-muscle chips + filter
 ("const filtered=items.filter(e=>groupFilter==='all'||eqKind(e.eq)===groupFilter).sort(",
  "if(subFilter!=='all'&&(!SUB_BY_ID[subFilter]||SUB_BY_ID[subFilter].g!==g)) subFilter='all';\n  const filtered=items.filter(e=>(groupFilter==='all'||eqKind(e.eq)===groupFilter)&&(subFilter==='all'||subsOf(e).includes(subFilter))).sort("),
 ("if(g!=='custom' && g!=='cardio' && g!=='stretch' && g!=='calis') wrap.append(h('div',{class:'chips'}",
  "const subs=SUBS.filter(s=>s.g===g); if(subs.length) wrap.append(h('div',{class:'chips'},h('button',{class:'chip'+(subFilter==='all'?' on':''),onclick:()=>{ subFilter='all'; render(); }},'הכל'),...subs.map(s=>h('button',{class:'chip'+(subFilter===s.id?' on':''),onclick:()=>{ subFilter=s.id; render(); }},s.he))));\n  if(g!=='custom' && g!=='cardio' && g!=='stretch' && g!=='calis') wrap.append(h('div',{class:'chips'}"),
 ("wrap.append(h('div',{class:'display'},GROUPS[g]||'התרגילים שלי'),h('p',{class:'lead'},`${filtered.length} תרגילים`));",
  "wrap.append(h('div',{class:'display'},subFilter!=='all'?groupLabel(subFilter):(GROUPS[g]||'התרגילים שלי')),h('p',{class:'lead'},`${filtered.length} תרגילים`));"),
]

def between(s, start, end, repl, p):
    assert s.count(start) == 1, (p, start[:50], s.count(start))
    i = s.index(start); j = s.index(end, i) + len(end)
    return s[:i] + repl + s[j:]

for p in ('index.template.html', 'index.html'):
    s = open(p, encoding='utf-8').read()
    for a, b in EDITS:
        assert s.count(a) == 1, (p, s.count(a), a[:90])
        s = s.replace(a, b)
    n = s.count("(MUSCLE[e.pm?.[0]]||GROUPS[e.g])"); assert n >= 3, (p, n)
    s = s.replace("(MUSCLE[e.pm?.[0]]||GROUPS[e.g])", "subName(e)")
    s = between(s, "  body.append(h('div',{class:'xs b muted',style:'margin:12px 0 6px;letter-spacing:.04em'},'או שילוב של שרירים (בחר/י אחד או שניים)'));", "body.append(go2);\n", NEW_COMBO, p)
    open(p, 'w', encoding='utf-8').write(s)
print('v7 edits ok')
