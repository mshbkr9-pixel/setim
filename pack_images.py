# -*- coding: utf-8 -*-
"""Resize RepDB images to 320px WebP and pack them per muscle group as base64 JSON (data/img-<group>.json)."""
import json, os, io, base64
from PIL import Image
ex = json.load(open('data/exercises.json', encoding='utf-8'))
groups = {}
for e in ex:
    for fn in e['img'].values():
        groups.setdefault(e['g'], set()).add(fn)
total = 0
for g, fns in groups.items():
    out = {}
    for fn in sorted(fns):
        im = Image.open('img/' + fn).convert('RGB')
        im.thumbnail((320, 320), Image.LANCZOS)
        buf = io.BytesIO(); im.save(buf, 'WEBP', quality=70, method=6)
        out[fn] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
    p = f'data/img-{g}.json'
    json.dump(out, open(p, 'w', encoding='utf-8'), separators=(',', ':'))
    sz = os.path.getsize(p); total += sz
    print(g, len(out), round(sz / 1e6, 2), 'MB')
print('total', round(total / 1e6, 2), 'MB')
