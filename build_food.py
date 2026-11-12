# -*- coding: utf-8 -*-
"""Build the food data the app loads, from the Israeli national nutrition database (Ministry of Health, data.gov.il, open licence).

   data-src/moh/*.json        the four raw tables (not in git; fetch them with:  python data-src/fetch_moh.py data-src/moh)
   data-src/food_vocab.json   the everyday vocabulary: what people say -> which table item, units, kosher, allergens, how it is bought
   data-src/recipes.json      the recipes: ingredients by vocabulary name, steps, time

   -> data/foods.json         the whole table, compact, for search:  {v, src, units:[names], f:[[id, he, en, kcal, p, c, f, fibre, [unitIdx, grams, ...]], ...]}
   -> data/food-core.json     the vocabulary and the recipes with their numbers worked out, small enough to load with the first screen:
                              {v, vocab:[{..., n:[kcal,p,c,f,fibre] per 100 g as eaten, rn:[...] per 100 g raw}], recipes:[{..., n:[kcal,p,c,f] per serving}]}
Run:  python build_food.py        (then python build.py as usual)
Every number in the app's nutrition maths comes from the table through this script; nothing is typed by hand.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding='utf-8')
SRC = 'data-src'
def rd(p): return json.loads(io.open(p, encoding='utf-8').read())
def num(v):
    try: return float(v)
    except (TypeError, ValueError): return 0.0
def r1(v):
    v = round(num(v), 1)
    return int(v) if v == int(v) else v
def clean(s): return re.sub(r'\s+', ' ', (s or '').replace('‏', '').replace('‎', '')).strip()

foods_raw = rd(SRC + '/moh/foods.json')['rows']
unit_names = {u['smlmida']: clean(u['shmmida']) for u in rd(SRC + '/moh/units.json')['rows']}
unitw = {}
for r in rd(SRC + '/moh/unitw.json')['rows']:
    if r['mida'] in ('700', '2000'): continue                 # grams and kilograms: every food has them, they say nothing
    g = num(r['mishkal'])
    if g > 0: unitw.setdefault(r['mmitzrach'], []).append((r['mida'], g))

# ---- the whole table ----
UNIT_ORDER = ['יחידה', 'יחידה בינונית', 'פרוסה', 'פרוסה בינונית', 'כף', 'כפית', 'כוס', 'מנה בינונית', 'מנה קטנה', 'מנה גדולה', 'גביע', 'יחידה קטנה', 'יחידה גדולה']
rank = {n: i for i, n in enumerate(UNIT_ORDER)}
units_used, unit_ix, rows, by_id = [], {}, [], {}
skipped = 0
for f in foods_raw:
    name = clean(f['shmmitzrach'])
    fid = int(f['smlmitzrach'])
    n = [r1(f['food_energy']), r1(f['protein']), r1(f['carbohydrates']), r1(f['total_fat']), r1(f['total_dietary_fiber'])]
    if not name or name.startswith('FFQ'):                    # questionnaire averages ("falafel in a pita"): not listed in the search,
        by_id[fid] = [fid, name, '', n[0], n[1], n[2], n[3], n[4], []]      # but the vocabulary may lean on one for a street dish
        skipped += 1; continue
    us = sorted(unitw.get(str(int(f['Code'])), []), key=lambda u: (rank.get(unit_names.get(u[0], ''), 99), u[1]))[:8]
    flat = []
    for code, g in us:
        nm = unit_names.get(code)
        if not nm: continue
        if nm not in unit_ix: unit_ix[nm] = len(units_used); units_used.append(nm)
        flat += [unit_ix[nm], r1(g)]
    row = [fid, name, clean(f.get('english_name')), n[0], n[1], n[2], n[3], n[4], flat]
    rows.append(row); by_id[fid] = row
rows.sort(key=lambda r: r[0])
out = {'v': 1, 'src': 'מאגר התזונה הלאומי, משרד הבריאות (data.gov.il)', 'units': units_used, 'f': rows}
os.makedirs('data', exist_ok=True)
txt = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
io.open('data/foods.json', 'w', encoding='utf-8', newline='\n').write(txt)
print('data/foods.json: %d foods (%d questionnaire rows left out), %d unit names, %d KB' % (len(rows), skipped, len(units_used), len(txt.encode('utf-8')) // 1024))

# ---- the everyday vocabulary ----
vocab_path, rec_path = SRC + '/food_vocab.json', SRC + '/recipes.json'
vocab = rd(vocab_path) if os.path.exists(vocab_path) else []
vk, core_v, problems = {}, [], []
for e in vocab:
    row, raw = by_id.get(e.get('id')), by_id.get(e.get('raw')) if e.get('raw') else None
    if not row: problems.append('vocabulary "%s": id %s is not in the table' % (e.get('k'), e.get('id'))); continue
    if e.get('raw') and not raw: problems.append('vocabulary "%s": raw %s is not in the table' % (e.get('k'), e.get('raw'))); continue
    o = {k: e[k] for k in ('k', 'a', 'en', 'id', 'raw', 'y', 'u', 'ug', 'units', 'd', 'c', 'ko', 'vg', 'al', 'pk', 'pu', 'buy') if e.get(k) not in (None, [], {}, '')}
    o['n'] = row[3:8]
    if raw: o['rn'] = raw[3:8]
    core_v.append(o); vk[e['k']] = o

# ---- the recipes ----
GENERIC = {'כף': 15, 'כפית': 5, 'כוס': 200}
def grams(e, amount, unit):
    """how many grams of the as-bought food an ingredient line means"""
    if unit in ('g', 'ml'): return float(amount)
    per = (e.get('units') or {}).get(unit) or (e['ug'] if e.get('u') == unit else None) or GENERIC.get(unit)
    if per is None: raise ValueError('no weight for unit %s' % unit)
    g = float(amount) * per
    return g / e['y'] if e.get('raw') and e.get('y') else g        # household units are weighed as eaten; the recipe is cooked from raw
recipes, core_r = (rd(rec_path) if os.path.exists(rec_path) else []), []
for r in recipes:
    tot, ing, ko, vg, al, bad = [0.0, 0.0, 0.0, 0.0], [], set(), 2, set(), False
    for line in r['ing']:
        key, amount, unit = line[0], line[1], (line[2] if len(line) > 2 else 'g')
        e = vk.get(key)
        if not e: problems.append('recipe "%s": "%s" is not in the vocabulary' % (r['t'], key)); bad = True; continue
        try: g = grams(e, amount, unit)
        except ValueError as ex: problems.append('recipe "%s", "%s": %s' % (r['t'], key, ex)); bad = True; continue
        n = e.get('rn') or e['n']
        for i in range(4): tot[i] += n[i] * g / 100.0
        ing.append([key, round(g, 1)] + ([amount, unit] if unit not in ('g', 'ml') else []))
        if e.get('c') != 'spice': ko.add(e['ko'])
        vg = min(vg, e.get('vg', 2)); al |= set(e.get('al') or [])
    if bad: continue
    s = float(r.get('serves') or 1)
    kosher = 'x' if ('x' in ko or ('m' in ko and 'd' in ko)) else ('m' if 'm' in ko else 'd' if 'd' in ko else 'p')
    core_r.append({'id': r['id'], 't': r['t'], 'slot': r['slot'], 'min': r['min'], 'serves': r.get('serves') or 1, 'ing': ing, 'steps': r['steps'],
                   'n': [round(tot[0] / s), round(tot[1] / s, 1), round(tot[2] / s, 1), round(tot[3] / s, 1)], 'ko': kosher, 'vg': vg, 'al': sorted(al),
                   **({'note': r['note']} if r.get('note') else {}), **({'cost': r['cost']} if r.get('cost') else {})})
ids = [r['id'] for r in core_r]
for i in set(ids):
    if ids.count(i) > 1: problems.append('recipe id "%s" appears twice' % i)

core = {'v': 1, 'src': out['src'], 'vocab': core_v, 'recipes': core_r}
txt = json.dumps(core, ensure_ascii=False, separators=(',', ':'))
io.open('data/food-core.json', 'w', encoding='utf-8', newline='\n').write(txt)
print('data/food-core.json: %d vocabulary entries, %d recipes, %d KB' % (len(core_v), len(core_r), len(txt.encode('utf-8')) // 1024))
for p in problems: print('  !', p)
if '--recipes' in sys.argv:
    for r in core_r: print('  %-34s %4d kcal  p%-5s c%-5s f%-5s  %s %s' % (r['t'], r['n'][0], r['n'][1], r['n'][2], r['n'][3], r['ko'], 'vg%d' % r['vg']))
sys.exit(1 if problems else 0)
