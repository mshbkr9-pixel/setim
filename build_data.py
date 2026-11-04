# -*- coding: utf-8 -*-
"""Builds data/exercises.json (trimmed RepDB dataset + Hebrew names) and copies images into img/.
Run with:  python -I -X utf8 build_data.py <path-to-repdb-folder>
"""
import json, os, shutil, sys

REPDB = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
src = json.load(open(os.path.join(REPDB, 'exercise-dataset', 'exercises.json'), encoding='utf-8'))
ex = src['exercises']

he = {}
for i in range(4):
    p = os.path.join(REPDB, 'chunks', f'he{i}.json')
    if os.path.exists(p):
        he.update(json.load(open(p, encoding='utf-8')))
print('hebrew entries', len(he))

GROUP_OF = {
    'pectoralis_major': 'chest', 'serratus_anterior': 'chest',
    'latissimus_dorsi': 'back', 'rhomboids': 'back', 'trapezius': 'back', 'erector_spinae': 'back',
    'infraspinatus_teres_minor': 'back',
    'anterior_deltoid': 'shoulders', 'lateral_deltoid': 'shoulders', 'posterior_deltoid': 'shoulders',
    'supraspinatus': 'shoulders',
    'biceps_brachii': 'arms', 'brachialis': 'arms', 'brachioradialis': 'arms', 'triceps_brachii': 'arms',
    'forearm_flexors': 'arms', 'forearm_extensors': 'arms', 'forearms': 'arms',
    'quadriceps': 'legs', 'hamstrings': 'legs', 'adductors': 'legs', 'abductors': 'legs',
    'gastrocnemius': 'legs', 'soleus': 'legs', 'tibialis_anterior': 'legs', 'hip_flexors': 'legs',
    'gluteus_maximus': 'glutes', 'gluteus_medius': 'glutes',
    'rectus_abdominis': 'core', 'obliques': 'core', 'transverse_abdominis': 'core', 'quadratus_lumborum': 'core',
}
BP_GROUP = {'chest': 'chest', 'back': 'back', 'shoulders': 'shoulders', 'upper_arms': 'arms', 'lower_arms': 'arms',
            'upper_legs': 'legs', 'lower_legs': 'legs', 'core': 'core', 'full_body': 'full'}

out = []
img_dir = os.path.join(HERE, 'img')
os.makedirs(img_dir, exist_ok=True)
copied = 0
for e in ex:
    pm = e.get('primary_muscles') or []
    g = None
    for m in pm:
        if m in GROUP_OF:
            g = GROUP_OF[m]; break
    if not g:
        g = BP_GROUP.get(e.get('body_part'), 'full')
    if e.get('category') in ('stretching',):
        g = 'stretch'
    elif e.get('category') == 'cardio':
        g = 'cardio'
    flat = (e.get('images') or {}).get('flat') or {}
    img = {}
    for k, short in (('start', 's'), ('peak', 'p'), ('main', 'm')):
        if flat.get(k):
            fn = os.path.basename(flat[k])
            srcp = os.path.join(REPDB, 'exercise-dataset', flat[k])
            dst = os.path.join(img_dir, fn)
            if os.path.exists(srcp):
                if not os.path.exists(dst):
                    shutil.copyfile(srcp, dst); copied += 1
                img[short] = fn
    h = he.get(e['id'], {})
    out.append({
        'id': e['id'],
        'en': e['name_en'],
        'he': h.get('he') or e['name_en'],
        'dhe': h.get('dhe') or '',
        'den': e.get('description_en') or '',
        'cat': e.get('category'),
        'g': g,
        'bp': e.get('body_part'),
        'eq': e.get('equipment') or 'none',
        'pm': pm,
        'sm': e.get('secondary_muscles') or [],
        'mech': e.get('mechanic'),
        'diff': e.get('difficulty'),
        'force': e.get('force_type'),
        'uni': bool(e.get('is_unilateral')),
        'bw': bool(e.get('is_bodyweight')),
        'ins': e.get('instructions_en') or [],
        'tips': e.get('tips_en') or [],
        'goals': e.get('goals') or [],
        'tags': e.get('tags') or [],
        'vg': e.get('variation_group') or '',
        'img': img,
    })

os.makedirs(os.path.join(HERE, 'data'), exist_ok=True)
with open(os.path.join(HERE, 'data', 'exercises.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
print('exercises', len(out), 'images copied', copied, 'json bytes',
      os.path.getsize(os.path.join(HERE, 'data', 'exercises.json')))
from collections import Counter
print(Counter(o['g'] for o in out))
