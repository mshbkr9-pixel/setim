/* The classes of the v14 layer all start with "px-". Older style sheets already own the short names (fin, coach, steps, ring, stat, body, pop),
   and a name used twice once squeezed a sheet into a strip while every text check passed. This test holds the new layer to its prefix.
   Run: node --test tests/css.test.js */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const css = read('parts/v14.css').replace(/\/\*[\s\S]*?\*\//g, '');

test('every rule of parts/v14.css starts from a class of its own', () => {
  const bad = [];
  css.split('}').forEach(rule => {
    const sel = rule.split('{')[0];
    sel.split(',').forEach(s => { s = s.trim(); if (!s) return; const first = (s.match(/\.[A-Za-z_][\w-]*/) || [''])[0]; if (!first.startsWith('.px-')) bad.push(s); });
  });
  assert.deepStrictEqual(bad, []);
});

test('the older style sheets know nothing of the prefix', () => {
  const tpl = read('index.template.html'), style = tpl.slice(tpl.indexOf('<style'), tpl.indexOf('</style>'));
  for (const [name, text] of [['index.template.html', style], ['parts/v12.css', read('parts/v12.css')], ['parts/v13.css', read('parts/v13.css')]])
    assert.ok(!/\.px-/.test(text), name + ' has a .px- class');
});

test('every px- class the screens use is styled, and every styled one is used', () => {
  const styled = new Set((css.match(/\.px-[\w-]+/g) || []).map(x => x.slice(1)));
  const js = ['parts/v14.js', 'parts/v13.js', 'parts/v13b.js', 'parts/v12.js', 'index.template.html'].map(read).join('\n');
  const used = new Set((js.match(/\bpx-[a-z][\w-]*/g) || []));
  assert.deepStrictEqual([...used].filter(c => !styled.has(c)).sort(), [], 'used in the screens, missing from parts/v14.css');
  assert.deepStrictEqual([...styled].filter(c => !used.has(c)).sort(), [], 'styled in parts/v14.css, used nowhere');
});
