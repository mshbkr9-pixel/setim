# -*- coding: utf-8 -*-
"""Check data-src/food_vocab.json (the everyday food vocabulary) against the Ministry of Health table.
Usage:  python -I data-src/check_vocab.py            checks, prints problems, exits 1 when there are any
        python -I data-src/check_vocab.py --table    also prints one review line per entry
Run from the project root. The rules are the contract the app relies on (see build_food.py and parts/food.js).
"""
import io, json, re, sys, collections
sys.stdout.reconfigure(encoding='utf-8')

UNITS = {'g', 'ml', 'יח', 'פרוסה', 'כף', 'כפית', 'כוס', 'מנה', 'גביע', 'קופסה', 'חופן', 'פיתה', 'כדור', 'שקית'}
CATS = {'dairy', 'egg', 'meat', 'poultry', 'fish', 'legume', 'grain', 'bread', 'veg', 'fruit', 'nut', 'fat', 'sweet', 'drink', 'dish', 'snack', 'sauce', 'spice', 'other'}
KO = {'m', 'd', 'p', 'f', 'x'}
ALLERG = {'gluten', 'milk', 'egg', 'peanut', 'nut', 'soy', 'sesame', 'fish'}
KEYS = {'k', 'a', 'id', 'raw', 'y', 'u', 'ug', 'units', 'd', 'c', 'ko', 'vg', 'al', 'pk', 'pu', 'buy', 'en'}

def norm(s):
    s = (s or '').lower()
    s = re.sub(r'[֑-ׇ]', '', s)
    s = s.replace('ך', 'כ').replace('ם', 'מ').replace('ן', 'נ').replace('ף', 'פ').replace('ץ', 'צ')
    s = re.sub(r'["\'׳״`\-־.,()/]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def main():
    foods = {int(f['smlmitzrach']): f for f in json.loads(io.open('data-src/moh/foods.json', encoding='utf-8').read())['rows']}
    vocab = json.loads(io.open('data-src/food_vocab.json', encoding='utf-8').read())
    bad, seen = [], {}
    err = lambda e, m: bad.append('%s: %s' % (e.get('k', '?') if isinstance(e, dict) else e, m))
    for e in vocab:
        if not isinstance(e, dict) or not e.get('k'):
            err(e, 'entry without k'); continue
        extra = set(e) - KEYS
        if extra: err(e, 'unknown fields %s' % sorted(extra))
        for name in [e['k']] + list(e.get('a') or []):
            n = norm(name)
            if not n: err(e, 'empty name'); continue
            if n in seen and seen[n] != e['k']: err(e, 'the name "%s" is also used by "%s"' % (name, seen[n]))
            seen[n] = e['k']
        for fld in ('id', 'raw'):
            v = e.get(fld)
            if fld == 'id' and v is None: err(e, 'no id')
            if v is not None and v not in foods: err(e, '%s %s is not in the table' % (fld, v))
        if e.get('raw') is not None and e.get('raw') == e.get('id'): err(e, 'raw equals id: leave raw out')
        if e.get('raw') is not None and not (0.2 <= float(e.get('y') or 0) <= 4): err(e, 'raw needs y (cooked grams per raw gram), 0.2 to 4')
        if e.get('u') not in UNITS: err(e, 'u must be one of %s' % sorted(UNITS))
        for label, v in [('ug', e.get('ug')), ('d', e.get('d'))] + [('units.' + k, v) for k, v in (e.get('units') or {}).items()]:
            if not isinstance(v, (int, float)) or not (0.5 <= v <= 2000): err(e, '%s must be grams between 0.5 and 2000' % label)
        for k in (e.get('units') or {}):
            if k not in UNITS: err(e, 'unknown unit %s' % k)
        if e.get('c') not in CATS: err(e, 'c must be one of %s' % sorted(CATS))
        if e.get('ko') not in KO: err(e, 'ko must be one of %s' % sorted(KO))
        if e.get('vg') not in (0, 1, 2): err(e, 'vg must be 0, 1 or 2')
        if not set(e.get('al') or []) <= ALLERG: err(e, 'al may hold only %s' % sorted(ALLERG))
        if e.get('pu') not in (None, 'g', 'ml', 'יח'): err(e, 'pu must be g, ml or יח')
        f = foods.get(e.get('id'))
        if f:
            kc, p, c, fat = float(f['food_energy'] or 0), float(f['protein'] or 0), float(f['carbohydrates'] or 0), float(f['total_fat'] or 0)
            if e.get('c') not in ('drink', 'spice', 'veg', 'other') and kc <= 0: err(e, 'the chosen item has no energy value')
            if e.get('vg') == 2 and e.get('c') in ('dairy', 'egg', 'meat', 'poultry', 'fish'): err(e, 'vg 2 does not fit the category')
            if e.get('ko') == 'p' and e.get('c') in ('dairy', 'meat', 'poultry'): err(e, 'ko p does not fit the category')
    print('%d entries, %d names, %d problems' % (len(vocab), len(seen), len(bad)))
    for b in bad: print('  !', b)
    print('by category:', dict(collections.Counter(e.get('c') for e in vocab if isinstance(e, dict))))
    if '--table' in sys.argv:
        for e in vocab:
            f, r = foods.get(e.get('id')), foods.get(e.get('raw'))
            if not f: continue
            one = float(f['food_energy'] or 0) * float(e.get('ug') or 0) / 100
            print('%-22s %-9s %4s kcal/100g p%-5s c%-5s f%-5s | 1 %s = %sg = %d kcal | d=%sg | %s%s' % (e['k'], e.get('c'), f['food_energy'], f['protein'], f['carbohydrates'], f['total_fat'],
                  e.get('u'), e.get('ug'), round(one), e.get('d'), f['shmmitzrach'].strip()[:46], (' || RAW ' + r['shmmitzrach'].strip()[:34] + ' y=' + str(e.get('y'))) if r else ''))
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
