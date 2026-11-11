# -*- coding: utf-8 -*-
"""Assemble index.html from index.template.html + the injected blocks.
   /*__CATALOG__*/  -> parts/catalog.js   (EQ / MACHINES / BRANDS)
   /*__POOL__*/     -> parts/pool.js      (POOL / PROGRAMS / buildDay ...)
   /*__ARTICLES__*/ -> articles.js        (guides)
   /*__V12_CSS__*/  -> parts/v12.css      (goals and voice: styles)
   /*__VOICE__*/    -> parts/voice.js     (VoiceLog: a spoken sentence -> a logged set and the answer)
   /*__GOALS__*/    -> parts/goals.js     (GoalKit: a goal -> stages, progress, the week in words)
   /*__V12__*/      -> parts/v12.js       (goals and voice: screens and glue)
Also writes what the server-side voice hook needs, so the server always understands exactly what the app understands:
   server/pb_hooks/voice.js      a copy of parts/voice.js
   server/pb_hooks/exnames.json  the exercise names (id, Hebrew, English, group, category, equipment, body weight)
Run:  python build.py
Reads with universal newlines and writes CRLF, like the checked-out files on this machine.
"""
import ast, io, json, os, re

def rd(p):
    return io.open(p, encoding='utf-8').read()

t = rd('index.template.html')
src = t
for marker, path in (('/*__CATALOG__*/', 'parts/catalog.js'), ('/*__POOL__*/', 'parts/pool.js'), ('/*__ARTICLES__*/', 'articles.js'),
                     ('/*__V12_CSS__*/', 'parts/v12.css'), ('/*__VOICE__*/', 'parts/voice.js'), ('/*__GOALS__*/', 'parts/goals.js'), ('/*__V12__*/', 'parts/v12.js')):
    assert t.count(marker) == 1, marker
    part = rd(path)
    assert '</script' not in part.lower() and '</style' not in part.lower(), path
    t = t.replace(marker, part)
io.open('index.html', 'w', encoding='utf-8', newline='\r\n').write(t)
print('index.html built:', len(t), 'chars')

# ---- server side of voice logging ----
BW_EQ = {'none', 'pull_up_bar', 'dip_station', 'rings', 'suspension_trainer', 'plyo_box', 'jump_rope'}
names = [{'id': e['id'], 'he': e['he'], 'en': e.get('en') or '', 'g': e.get('g') or '', 'cat': e.get('cat') or '', 'eq': e.get('eq') or '',
          'bw': bool(e.get('bw')) or e.get('eq') in BW_EQ} for e in json.loads(rd('data/exercises.json'))]
m = re.search(r'const EXTRA_EX=\[(.*?)\]\.map\(', src, re.S)          # the outdoor activities are defined in the template
assert m, 'EXTRA_EX not found'
for row in ast.literal_eval('[' + m.group(1) + ']'):
    names.append({'id': row[0], 'he': row[1], 'en': row[2], 'g': 'cardio', 'cat': 'cardio', 'eq': 'none', 'bw': True})
pm = re.search(r'const DEFAULTS = \{(.*?)\};', rd('parts/pool.js'), re.S)   # the exercises the programs reach for first
popular = sorted(set(re.findall(r"'([a-z0-9-]+)'", pm.group(1)))) if pm else []
os.makedirs('server/pb_hooks', exist_ok=True)
io.open('server/pb_hooks/exnames.json', 'w', encoding='utf-8', newline='\n').write(json.dumps({'ex': names, 'popular': popular}, ensure_ascii=False, separators=(',', ':')))
io.open('server/pb_hooks/voice.js', 'w', encoding='utf-8', newline='\n').write(rd('parts/voice.js'))
print('server/pb_hooks: voice.js + exnames.json (%d exercises, %d popular)' % (len(names), len(popular)))
