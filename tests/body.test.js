/* Tests for BodyKit: the body's own numbers (steps, heart rate, the watch's calories, sleep) and injuries.
   Run: node --test tests/body.test.js */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const BK = require(path.join(__dirname, '..', 'parts', 'body.js'));
const EX = {}; JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'exercises.json'), 'utf8')).forEach(e => { EX[e.id] = e; });
const D = '2026-11-12';

test('a day keeps only numbers that make sense, and a field can be cleared', () => {
  const sig = {};
  assert.deepStrictEqual(BK.setDay(sig, D, { st: 10000.4, hr: '62', kc: 540, sl: 7.6 }, 'm', 1000), ['st', 'hr', 'kc', 'sl']);
  assert.deepStrictEqual(sig.day[D], { st: 10000, hr: 62, kc: 540, sl: 7.5, at: 1000, src: 'm' });
  assert.deepStrictEqual(BK.setDay(sig, D, { st: 500000, hr: 500, kc: -3, sl: 30 }, 'm', 2000), []);      // out of range: nothing changes
  assert.deepStrictEqual(BK.setDay(sig, D, { st: 10000 }, 'v', 3000), []); assert.strictEqual(sig.day[D].at, 1000);      // the same number again is not a change
  assert.deepStrictEqual(BK.setDay(sig, D, { hr: null, sl: '' }, 'm', 4000), ['hr', 'sl']);
  assert.deepStrictEqual(sig.day[D], { st: 10000, kc: 540, at: 4000, src: 'm' });
  BK.setDay(sig, D, { st: null, kc: null }, 'm', 5000); assert.strictEqual(sig.day[D], undefined);      // an empty day is removed
  assert.deepStrictEqual(BK.setDay(sig, 'not a date', { st: 5 }, 'm', 1), []);
  assert.deepStrictEqual(BK.dayOf(sig, D), {}); assert.deepStrictEqual(BK.dayOf(null, D), {});
});

test('no more than 400 days are kept, the oldest go first', () => {
  const sig = {}; for (let i = 0; i < 420; i++) BK.setDay(sig, BK.addDays('2025-01-01', i), { st: 1000 + i }, 'm', i + 1);
  const keys = Object.keys(sig.day).sort(); assert.strictEqual(keys.length, 400); assert.strictEqual(keys[0], BK.addDays('2025-01-01', 20));
});

test('the week: days with steps, the average, days on which the goal was met, the resting heart rate', () => {
  const sig = {}; [[0, 9000, 60], [1, 7000, null], [2, 11000, 64], [9, 20000, 50]].forEach(([back, st, hr]) => BK.setDay(sig, BK.addDays(D, -back), { st, hr }, 'm', 1));
  assert.deepStrictEqual(BK.week(sig, D, 8000), { days: 3, avg: 9000, met: 2, hr: 62 });
  assert.deepStrictEqual(BK.week({}, D, 8000), { days: 0, avg: 0, met: 0, hr: 0 });
});

test('what the watch sent is merged by day, and the newer version of a day wins', () => {
  const sig = {}; BK.setDay(sig, D, { st: 4000 }, 'm', 5000);
  assert.strictEqual(BK.merge(sig, [{ d: D, st: 9000, hr: 61, at: 4000 }]), 0); assert.strictEqual(sig.day[D].st, 4000);      // typed later than the watch's reading: it stays
  assert.strictEqual(BK.merge(sig, [{ d: D, st: 9500, hr: 61, at: 6000 }, { d: BK.addDays(D, -1), st: 12000, at: 6000 }, { d: 'x' }, null]), 2);
  assert.deepStrictEqual(sig.day[D], { st: 9500, hr: 61, at: 6000, src: 'h' }); assert.strictEqual(sig.day[BK.addDays(D, -1)].st, 12000);
  assert.strictEqual(BK.merge(sig, [{ d: D, st: 9500, hr: 61, at: 6000 }]), 0);      // the same reading twice changes nothing
});

test('an injury: one for each place, with its first day; healing closes it', () => {
  const sig = {};
  const a = BK.injure(sig, 'shoulder', 'מאז הלחיצות', D, 1000);
  assert.deepStrictEqual([a.part, a.note, a.from, a.to], ['shoulder', 'מאז הלחיצות', D, '']);
  const b = BK.injure(sig, 'shoulder', 'עדיין כואב', BK.addDays(D, 3), 2000);
  assert.strictEqual(b.id, a.id); assert.deepStrictEqual([b.note, b.from], ['עדיין כואב', D]); assert.strictEqual(sig.inj.length, 1);
  BK.injure(sig, 'knee', '', D, 3000); BK.injure(sig, 'no such place', '', D, 4000);
  assert.deepStrictEqual(BK.active(sig).map(x => x.part), ['other', 'knee', 'shoulder']);
  assert.strictEqual(BK.heal(sig, 'knee', BK.addDays(D, 5), 5000), 1); assert.deepStrictEqual(BK.active(sig).map(x => x.part), ['other', 'shoulder']);
  assert.strictEqual(BK.heal(sig, 'knee', D, 6000), 0);      // already closed
  assert.strictEqual(BK.heal(sig, '', D, 7000), 2); assert.deepStrictEqual(BK.active(sig), []);
  assert.strictEqual(sig.inj.length, 3);      // the history stays
  assert.strictEqual(BK.partHe('lower_back'), 'גב תחתון'); assert.strictEqual(BK.partHe('nothing'), 'מקום אחר');
});

test('which exercises may load an injured place', () => {
  const may = (part, id) => { assert.ok(EX[id], id + ' is in the catalogue'); return BK.loads(part, EX[id]); };
  // the shoulder: presses, raises, pull-ups; not a squat or a leg curl
  ['bench-press', 'dumbbell-shoulder-press', 'lateral-raise', 'pull-up', 'push-up', 'dips'].forEach(id => assert.ok(may('shoulder', id), id));
  ['squat', 'leg-press', 'leg-curl', 'standing-calf-raise'].forEach(id => assert.ok(!may('shoulder', id), id));
  // the knee: squats, lunges, the leg machines, running; not a bench press or a curl
  ['squat', 'lunge', 'leg-press', 'leg-extension', 'leg-curl', 'running'].forEach(id => assert.ok(may('knee', id), id));
  ['bench-press', 'barbell-curl', 'lat-pulldown', 'plank'].forEach(id => assert.ok(!may('knee', id), id));
  // the lower back: deadlifts and squats; not a calf raise
  ['deadlift', 'romanian-deadlift', 'squat'].forEach(id => assert.ok(may('lower_back', id), id));
  ['standing-calf-raise', 'lateral-raise'].forEach(id => assert.ok(!may('lower_back', id), id));
  // the elbow and the wrist: curls and presses
  ['barbell-curl', 'tricep-pushdown', 'bench-press'].forEach(id => assert.ok(may('elbow', id), id));
  ['push-up', 'plank', 'barbell-curl'].forEach(id => assert.ok(may('wrist', id), id));
  assert.ok(!may('elbow', 'squat')); assert.ok(may('ankle', 'standing-calf-raise')); assert.ok(may('ankle', 'running')); assert.ok(may('hip', 'hip-thrust')); assert.ok(may('upper_back', 'barbell-row'));
  // stretches are never marked; a place that is not a joint the app knows marks nothing
  const stretch = Object.values(EX).find(e => e.cat === 'stretching'); assert.ok(!BK.loads('knee', stretch)); assert.ok(!BK.loads('other', EX['squat'])); assert.ok(!BK.loads('knee', null));
  // an exercise the person added has only a group
  assert.ok(BK.loads('knee', { id: 'c-1', g: 'legs' })); assert.ok(!BK.loads('knee', { id: 'c-2', g: 'arms' })); assert.ok(BK.loads('shoulder', { id: 'c-3', g: 'chest' }));
  // outdoor activities: running loads the knee, swimming does not
  assert.ok(BK.loads('knee', { id: 'x-stairs', g: 'cardio', cat: 'cardio' })); assert.ok(!BK.loads('knee', { id: 'x-swimming', g: 'cardio', cat: 'cardio' }));
});

test('today against the active injuries', () => {
  const sig = {}; BK.injure(sig, 'shoulder', '', BK.addDays(D, -3), 1000); BK.injure(sig, 'ankle', '', D, 2000);
  const h = BK.hits(sig, [EX['bench-press'], EX['squat'], EX['lateral-raise'], null], D);
  assert.deepStrictEqual(h.map(x => [x.part, x.he, x.the, x.days, x.hits, x.ids]), [['ankle', 'קרסול וכף רגל', 'הקרסול וכף הרגל', 0, 0, []], ['shoulder', 'כתף', 'הכתף', 3, 2, ['bench-press', 'lateral-raise']]]);
  assert.deepStrictEqual(BK.hits({}, [EX['squat']], D), []);
});

test('what is said back', () => {
  assert.strictEqual(BK.say({ st: 10000 }), 'נרשם: 10,000 צעדים.');
  assert.strictEqual(BK.say({ st: 10000 }, { goal: 8000 }), 'נרשם: 10,000 צעדים. עברת את יעד הצעדים. כל הכבוד!');
  assert.strictEqual(BK.say({ st: 5000 }, { goal: 8000 }), 'נרשם: 5,000 צעדים.');
  assert.strictEqual(BK.say({ st: 9200, hr: 61, kc: 540, sl: 7.5 }), 'נרשם: 9,200 צעדים, דופק 61, 540 קלוריות מהשעון, 7.5 שעות שינה.');
  assert.strictEqual(BK.say({ st: 12000 }, { back: 1, goal: 8000 }), 'נרשם לאתמול: 12,000 צעדים.');
  assert.strictEqual(BK.say({ st: 9000, hr: 64 }, { lang: 'en' }), 'Logged: 9,000 steps, heart rate 64.');
  assert.strictEqual(BK.say({ st: 999999 }), 'לא הבנתי איזה מספר לרשום.');
  assert.ok(BK.sayInjury('shoulder').startsWith('רשמתי פציעה: כתף.') && /רופא/.test(BK.sayInjury('shoulder')) && /יסומנו/.test(BK.sayInjury('shoulder')));
  assert.ok(/רופא/.test(BK.sayInjury('other')) && !/יסומנו/.test(BK.sayInjury('other')));
  assert.strictEqual(BK.sayHealed(1), 'טוב לשמוע. הפציעה נסגרה.'); assert.strictEqual(BK.sayHealed(0), 'לא רשומה פציעה פעילה.');
});
