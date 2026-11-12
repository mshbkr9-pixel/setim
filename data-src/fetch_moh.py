# -*- coding: utf-8 -*-
"""Pull the four tables of the Israeli national nutrition database (Ministry of Health, data.gov.il, open licence)
through the portal's documented CKAN API, page by page, and keep them as JSON in the folder given as argv[1].
Run:  python -I fetch_moh.py <out_dir>
"""
import io, json, sys, time, urllib.parse, urllib.request

API = 'https://data.gov.il/api/3/action/datastore_search'
RES = {
    'foods': 'c3cb0630-0650-46c1-a068-82d575c094b2',       # foods and recipes, nutrients per 100 g
    'recipes': '5c726506-5c1e-43a7-94f7-24845dbde9c3',     # recipes: ingredients and amounts
    'units': '98fb46fe-e8de-4067-94d2-b0a8ea4269da',       # the list of measuring units
    'unitw': '755d28c0-75f7-40e1-9c8c-ecdd106f9b2d',       # weight of a unit, per food
}

def page(rid, offset, limit=1000):
    url = API + '?' + urllib.parse.urlencode({'resource_id': rid, 'limit': limit, 'offset': offset})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=90) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:      # the portal is slow at times: wait and try again, a few times only
            if attempt == 3:
                raise
            time.sleep(3 + attempt * 4)

def main(out):
    sys.stdout.reconfigure(encoding='utf-8')
    for name, rid in RES.items():
        rows, fields, total, off = [], None, None, 0
        while True:
            j = page(rid, off)
            assert j.get('success'), j
            res = j['result']
            if fields is None:
                fields = res['fields']
                total = res.get('total')
            got = res['records']
            rows.extend(got)
            off += len(got)
            if not got or (total is not None and off >= total):
                break
            time.sleep(0.6)
        io.open('%s/%s.json' % (out, name), 'w', encoding='utf-8').write(json.dumps({'fields': fields, 'rows': rows}, ensure_ascii=False))
        print('%-8s %6d rows (portal says %s), %d fields' % (name, len(rows), total, len(fields)))
        for f in fields:
            print('    %-22s %-8s %s' % (f['id'], f.get('type', ''), (f.get('info') or {}).get('label', '')))

if __name__ == '__main__':
    main(sys.argv[1])
