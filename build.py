# -*- coding: utf-8 -*-
"""Assemble index.html from index.template.html + the three injected blocks.
   /*__CATALOG__*/  -> parts/catalog.js   (EQ / MACHINES / BRANDS)
   /*__POOL__*/     -> parts/pool.js      (POOL / PROGRAMS / buildDay ...)
   /*__ARTICLES__*/ -> articles.js        (guides)
Run:  python build.py
Reads with universal newlines and writes CRLF, like the checked-out files on this machine.
"""
import io

def rd(p):
    return io.open(p, encoding='utf-8').read()

t = rd('index.template.html')
for marker, path in (('/*__CATALOG__*/', 'parts/catalog.js'), ('/*__POOL__*/', 'parts/pool.js'), ('/*__ARTICLES__*/', 'articles.js')):
    assert t.count(marker) == 1, marker
    t = t.replace(marker, rd(path))
io.open('index.html', 'w', encoding='utf-8', newline='\r\n').write(t)
print('index.html built:', len(t), 'chars')
