# -*- coding: utf-8 -*-
"""Search the Ministry of Health nutrition table by words, to pick the right item for an everyday food name.
Usage:  python -I find_food.py <moh_dir> "ביצה קשה" "אורז לבן מבושל" ...      (several queries in one run)
        add  -n 12  to change how many candidates are shown per query (default 10)
        add  -u     to list every unit weight of each candidate (default: the six most useful)
A query matches a food when every word of the query appears in its Hebrew name (or, for Latin words, in its English name).
A word starting with '-' must NOT appear. Candidates are ordered: shorter, more generic names first; brand rows later.
Columns: id | Hebrew name | English name | kcal p c f fibre per 100 g | units -> grams
"""
import io, json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

def norm(s):
    s = (s or '').lower()
    s = re.sub(r'[֑-ׇ]', '', s)
    s = s.replace('ך', 'כ').replace('ם', 'מ').replace('ן', 'נ').replace('ף', 'פ').replace('ץ', 'צ')
    s = re.sub(r'["\'׳״`\-־.,()/%]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def main():
    args = sys.argv[1:]
    d = args.pop(0)
    n, allu, qs = 10, False, []
    while args:
        a = args.pop(0)
        if a == '-n': n = int(args.pop(0))
        elif a == '-u': allu = True
        else: qs.append(a)
    ld = lambda name: json.loads(io.open('%s/%s.json' % (d, name), encoding='utf-8').read())['rows']
    foods, units, unitw = ld('foods'), ld('units'), ld('unitw')
    uname = {u['smlmida']: re.sub(r'\s+', ' ', u['shmmida']).strip() for u in units}
    uw = {}
    for r in unitw:
        uw.setdefault(r['mmitzrach'], []).append((r['mida'], r['mishkal']))
    BRAND = re.compile(r'תנובה|שטראוס|טרה|אסם|עלית|יטבתה|גד|אנג.ל|ברמן|תלמה|סוגת|יכין|ויליגר|זוגלובק|יחיעם|טבעול|שופרסל|[A-Z]{3,}')
    idx = [(norm(f['shmmitzrach']), (f.get('english_name') or '').lower(), f) for f in foods]
    for q in qs:
        words = norm(q).split()
        pos = [w for w in words if not q.split()[words.index(w)].startswith('-')] if False else None
        raw = q.split()
        must = [norm(w) for w in raw if not w.startswith('-')]
        mustnot = [norm(w[1:]) for w in raw if w.startswith('-')]
        hits = []
        for he, en, f in idx:
            ok = all((w in he) or (re.match(r'^[a-z0-9 ]+$', w) and w in en) for w in must) and not any(w in he for w in mustnot)
            if not ok: continue
            name = f['shmmitzrach'].strip()
            score = len(name) + (40 if BRAND.search(name) else 0) + (60 if name.startswith('FFQ') else 0) + (0 if he.startswith(must[0]) else 25)
            hits.append((score, f))
        hits.sort(key=lambda x: x[0])
        print('=== %s   (%d matches)' % (q, len(hits)))
        for _, f in hits[:n]:
            us = uw.get(str(int(f['Code'])), [])
            us = [(uname.get(m, m), w) for m, w in us if m not in ('700', '2000')]
            if not allu: us = us[:6]
            print('  %d | %s | %s | %s kcal p%s c%s f%s fb%s | %s' % (int(f['smlmitzrach']), f['shmmitzrach'].strip(), (f.get('english_name') or '').strip(),
                  f['food_energy'], f['protein'], f['carbohydrates'], f['total_fat'], f.get('total_dietary_fiber'), '; '.join('%s=%s' % u for u in us)))

if __name__ == '__main__':
    main()
