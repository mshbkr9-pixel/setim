/* node --test tests/food.test.js     (from the project folder)
   FoodKit and MenuKit against the real data the app loads (data/food-core.json, data/foods.json): the vocabulary, the recipes and
   the national nutrition table. A sentence must become the right foods with the right weights, and a menu must add up. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
global.VoiceLog = require('../parts/voice.js');
const FK = global.FoodKit = require('../parts/food.js');
const MK = require('../parts/menu.js');

const root = path.join(__dirname, '..');
const core = JSON.parse(fs.readFileSync(path.join(root, 'data', 'food-core.json'), 'utf8'));
FK.init(core);
const items = (text, o) => FK.parse(text, o || { hour: 13 }).items.map(x => [x.k, x.g, x.est]);
const kcal = text => FK.parse(text).sum.k;

test('the sentence from the request: five foods, amounts where they were said, estimates where they were not', () => {
  const R = FK.parse("אכלתי שתי ביצים, שלוש פרוסות לחם, קוטג' וסלט עם קצת שמן זית.", { hour: 8 });
  assert.deepStrictEqual(R.items.map(x => [x.k, x.g, x.est]), [['ביצה', 100, false], ['לחם', 90, false], ["קוטג'", 125, true], ['סלט ירקות', 150, true], ['שמן זית', 5, true]]);
  assert.strictEqual(R.conf, 1); assert.strictEqual(R.slot, 'b');
  assert.ok(R.sum.k > 550 && R.sum.k < 700 && R.sum.p > 30, JSON.stringify(R.sum));
});
test('numbers come from the nutrition table, not from the sentence', () => {
  const egg = FK.byKey('ביצה'); assert.strictEqual(egg.id, 31103000);
  assert.strictEqual(FK.parse('ביצה').items[0].e[0], Math.round(egg.n[0] * 50 / 100));
  assert.strictEqual(kcal('100 גרם חזה עוף'), Math.round(FK.byKey('חזה עוף').n[0]));
});
test('grams, kilos, cups, spoons, halves and words for numbers', () => {
  assert.deepStrictEqual(items('200 גרם חזה עוף'), [['חזה עוף', 200, false]]);
  assert.deepStrictEqual(items('מאתיים גרם חזה עוף'), [['חזה עוף', 200, false]]);
  assert.deepStrictEqual(items('חצי קילו חזה עוף'), [['חזה עוף', 500, false]]);
  assert.deepStrictEqual(items('כוס וחצי אורז'), [['אורז', 237, false]]);
  assert.deepStrictEqual(items('שתי כפות טחינה'), [['טחינה', 42, false]]);
  assert.deepStrictEqual(items('חצי אבוקדו'), [['אבוקדו', 57, false]]);
  assert.deepStrictEqual(items('30 ביצים'), [['ביצה', 1500, false]]);            // a believable count stays a count
  assert.deepStrictEqual(items('200 חזה עוף'), [['חזה עוף', 200, false]]);       // two hundred chicken breasts are two hundred grams
  assert.deepStrictEqual(items('150 קוטג'), [["קוטג'", 150, false]]);
  assert.deepStrictEqual(items('3 תפוחי אדמה'), [['תפוח אדמה', 360, false]]);
});
test('an amount that comes after the food belongs to it', () => {
  assert.deepStrictEqual(items('חזה עוף 150 גרם, אורז 200 גרם'), [['חזה עוף', 150, false], ['אורז', 200, false]]);
  assert.deepStrictEqual(items('ביצים 3, לחם 2 פרוסות'), [['ביצה', 150, false], ['לחם', 60, false]]);
});
test('plurals, a glued "ו", a fat percentage and a geresh inside a name', () => {
  assert.deepStrictEqual(items('2 ביצים ו-2 פיתות').map(x => x[0]), ['ביצה', 'פיתה']);
  assert.deepStrictEqual(items('עגבניות ומלפפונים').map(x => x[0]), ['עגבניה', 'מלפפון']);
  assert.deepStrictEqual(items('קוטג׳ 3%').map(x => x[0]), ["קוטג' 3%"]);
  assert.deepStrictEqual(items('קוטג׳ 5% וכף דבש').map(x => x[0]), ["קוטג'", 'דבש']);
  assert.deepStrictEqual(items('המבורגר עם צ׳יפס').map(x => x[0]), ['המבורגר', 'צ׳יפס']);
  assert.deepStrictEqual(items("ג'חנון").map(x => x[0]), ['ג׳חנון']);
});
test('"without" removes what follows, "big" and "a little" change the amount, and nothing eaten is nothing', () => {
  assert.deepStrictEqual(items('סלט בלי שמן זית').map(x => x[0]), ['סלט ירקות']);
  assert.ok(items('סלט ירקות גדול')[0][1] > items('סלט ירקות')[0][1]);
  assert.ok(items('קצת אורז')[0][1] < items('אורז')[0][1]);
  assert.deepStrictEqual(items('לא אכלתי שום דבר'), []);
});
test('a word the vocabulary does not know lowers the confidence and is reported', () => {
  const R = FK.parse('אכלתי ביצה וקרפצ׳יו של דג ים'); assert.ok(R.conf < 1); assert.ok(R.rest.length >= 1); assert.deepStrictEqual(R.items.map(x => x.k), ['ביצה']);
  assert.strictEqual(FK.parse('אימון חזה').items.length, 0);      // a muscle is not a chicken breast
});
test('English works for the common foods', () => {
  assert.deepStrictEqual(items('I had 2 eggs and a banana').map(x => x[0]), ['ביצה', 'בננה']);
});
test('the pantry keeps food the way it is bought', () => {
  const P = FK.parsePantry("יש לי קילו חזה עוף, חצי קילו אורז, שש ביצים, קוטג', עגבניות ומלפפונים").items.map(x => [x.k, x.q, x.u]);
  assert.deepStrictEqual(P, [['חזה עוף', 1000, 'g'], ['אורז', 500, 'g'], ['ביצה', 6, 'יח'], ["קוטג'", null, 'g'], ['עגבניה', null, 'g'], ['מלפפון', null, 'g']]);
});
test('every vocabulary entry reads back as itself, alone and with an amount', () => {
  const bad = [];
  FK.vocab().forEach(e => { const a = FK.parse(e.k), b = FK.parse('100 גרם ' + e.k);
    if (a.items.length !== 1 || a.items[0].k !== e.k || a.conf < 1) bad.push(e.k + ' -> ' + a.items.map(x => x.k).join(','));
    else if (b.items.length !== 1 || b.items[0].g !== 100) bad.push('100 גרם ' + e.k); });
  assert.deepStrictEqual(bad, []);
});
test('search: everyday names first, then the whole table, and a percentage typed without its sign', () => {
  FK.setDb(JSON.parse(fs.readFileSync(path.join(root, 'data', 'foods.json'), 'utf8')));
  assert.strictEqual(FK.search('שניצל')[0].name, 'שניצל');
  assert.ok(FK.search('שניצל').length > 5);
  assert.strictEqual(FK.search('קוטג 3')[0].name, "קוטג' 3%");
  assert.ok(FK.search('chicken breast').length >= 1);
  assert.strictEqual(FK.search('').length, 0);
});

/* ---------- targets ---------- */
const MAN = { sex: 'm', age: 30, height: 178, weight: 82, weekly: 4 };
test('targets: a deficit to lose, a surplus to gain, protein by body weight, and the macros add up to the calories', () => {
  const lose = FK.targets(MAN, { goal: 'lose' }), keep = FK.targets(MAN, { goal: 'keep' }), gain = FK.targets(MAN, { goal: 'gain' });
  assert.ok(lose.kcal < keep.kcal && keep.kcal < gain.kcal);
  assert.ok(lose.p >= 160 && lose.p <= 170, String(lose.p));
  [lose, keep, gain].forEach(T => assert.ok(Math.abs(T.p * 4 + T.c * 4 + T.f * 9 - T.kcal) < 60, JSON.stringify(T)));
  assert.strictEqual(FK.targets({ sex: 'm' }, { goal: 'lose' }).ok, false);      // no body data, no target
});
test('targets never go below the safe floor, and do not build a deficit for a minor or for a low BMI', () => {
  const small = FK.targets({ sex: 'f', age: 45, height: 150, weight: 50, weekly: 1, activity: 1.2 }, { goal: 'lose', pace: 'fast' });
  assert.strictEqual(small.kcal, 1200); assert.ok(small.notes.length >= 1);
  const teen = FK.targets({ sex: 'm', age: 16, height: 170, weight: 80, weekly: 3 }, { goal: 'lose' });
  assert.strictEqual(teen.kcal, FK.targets({ sex: 'm', age: 16, height: 170, weight: 80, weekly: 3 }, { goal: 'keep' }).kcal); assert.ok(/18/.test(teen.notes[0]));
  const thin = FK.targets({ sex: 'f', age: 30, height: 170, weight: 52, weekly: 3 }, { goal: 'lose' });
  assert.strictEqual(thin.kcal, FK.targets({ sex: 'f', age: 30, height: 170, weight: 52, weekly: 3 }, { goal: 'keep' }).kcal);
});
test('a training day eats a little more and a rest day a little less, and the week stays the same', () => {
  const T = FK.targets(MAN, { goal: 'lose' }), up = FK.dayTargets(T, true, 4, true), down = FK.dayTargets(T, false, 4, true);
  assert.ok(up.kcal > T.kcal && down.kcal < T.kcal);
  assert.ok(Math.abs(4 * up.kcal + 3 * down.kcal - 7 * T.kcal) <= 60);
  assert.strictEqual(FK.dayTargets(T, true, 4, false).kcal, T.kcal);
});
test('a rest day never goes under the safe floor', () => {
  const small = { sex: 'f', age: 45, height: 150, weight: 50, weekly: 1, activity: 1.2 };
  const T = FK.targets(small, { goal: 'lose', pace: 'fast' }); assert.strictEqual(T.kcal, 1200); assert.strictEqual(T.floor, 1200);
  for (let wk = 1; wk <= 6; wk++) assert.ok(FK.dayTargets(T, false, wk, true).kcal >= 1200, 'weekly ' + wk);
  assert.ok(FK.dayTargets(T, true, 3, true).kcal > 1200);
  const man = FK.targets({ sex: 'm', age: 50, height: 165, weight: 60, weekly: 1, activity: 1.2 }, { goal: 'lose', pace: 'fast' });
  assert.strictEqual(man.kcal, 1500); assert.ok(FK.dayTargets(man, false, 3, true).kcal >= 1500);
  const cu = FK.targets(MAN, { goal: 'lose', custom: { kcal: 1550, p: 150, c: 120, f: 50 } });      // a manual target is held to the same floor
  assert.strictEqual(FK.dayTargets(cu, false, 4, true).kcal, 1500);
});
test('with the pace of a weight goal, the calories come from that pace: one number for the goal and for the plate', () => {
  const keep = FK.targets(MAN, { goal: 'keep' }), lose = FK.targets(MAN, { goal: 'lose', rate: 0.5 });
  assert.ok(Math.abs(lose.kcal - (keep.tdee - 550)) <= 10, lose.kcal + ' against ' + (keep.tdee - 550)); assert.strictEqual(lose.rate, 0.5);
  const fast = FK.targets(MAN, { goal: 'lose', rate: 2 });      // never faster than 1% of body weight a week
  assert.ok(Math.abs(fast.kcal - (keep.tdee - 0.82 * 1100)) <= 10, String(fast.kcal));
  const gain = FK.targets(MAN, { goal: 'muscle', rate: 0.25 }), gain2 = FK.targets(MAN, { goal: 'muscle', rate: 1 });      // never more than 400 over
  assert.ok(Math.abs(gain.kcal - (keep.tdee + 275)) <= 10, String(gain.kcal)); assert.ok(Math.abs(gain2.kcal - (keep.tdee + 400)) <= 10, String(gain2.kcal));
  const teen = { sex: 'm', age: 16, height: 170, weight: 80, weekly: 3 };      // the guards win over the pace, and so does a manual target
  assert.strictEqual(FK.targets(teen, { goal: 'lose', rate: 0.6 }).kcal, FK.targets(teen, { goal: 'keep' }).kcal);
  assert.strictEqual(FK.targets(MAN, { goal: 'lose', rate: 0.5, custom: { kcal: 2000, p: 150, c: 200, f: 60 } }).kcal, 2000);
  assert.strictEqual(FK.targets(MAN, { goal: 'keep', rate: 0.5 }).kcal, keep.kcal);      // keeping has no pace
  assert.ok(Math.abs(FK.targets(MAN, { goal: 'lose' }).kcal - keep.tdee * 0.83) <= 10);      // and without a pace nothing changed
  const tiny = FK.targets({ sex: 'f', age: 45, height: 150, weight: 50, weekly: 1, activity: 1.2 }, { goal: 'lose', rate: 0.5 });
  assert.strictEqual(tiny.kcal, 1200);      // the floor still holds
  [lose, gain].forEach(T => assert.ok(Math.abs(T.p * 4 + T.c * 4 + T.f * 9 - T.kcal) < 60, JSON.stringify(T)));
});
test('a day far below the target is called low, never a success', () => {
  const T = FK.targets(MAN, { goal: 'lose' });
  assert.strictEqual(FK.judgeDay({ k: T.kcal * 0.5, p: 60 }, T).state, 'low');
  assert.strictEqual(FK.judgeDay({ k: T.kcal, p: T.p }, T).state, 'ok');
  assert.strictEqual(FK.judgeDay({ k: T.kcal * 1.3, p: T.p }, T).state, 'over');
  const docs = {}; FK.addMeal(docs, '2026-11-10', { id: 'a', s: 'l', at: 1, it: [{ n: 'x', g: 100, e: [T.kcal * 0.4, 20, 0, 0] }] }); FK.addMeal(docs, '2026-11-11', { id: 'b', s: 'l', at: 2, it: [{ n: 'x', g: 100, e: [T.kcal, T.p, 0, 0] }] });
  const st = FK.stretch(docs, '2026-11-01', '2026-11-12', () => T); assert.deepStrictEqual([st.days, st.ok, st.low, st.hitP], [2, 1, 1, 1]);
});

/* ---------- the recipes, the pantry, the menu ---------- */
test('every recipe has sane numbers that come from its ingredients', () => {
  assert.ok(FK.recipes().length >= 60);
  FK.recipes().forEach(r => {
    assert.ok(r.n[0] > 100 && r.n[0] < 950, r.t + ' ' + r.n[0]);
    assert.ok(Math.abs(r.n[1] * 4 + r.n[2] * 4 + r.n[3] * 9 - r.n[0]) / r.n[0] < 0.2, r.t + ' macros do not add up: ' + r.n);
    r.ing.forEach(x => assert.ok(FK.byKey(x[0]), r.t + ': ' + x[0]));
    assert.ok(r.steps.length >= 1 && r.slot.length >= 1 && r.min > 0);
  });
});
test('preferences are obeyed: kosher, vegan, an allergy, a disliked food', () => {
  const R = FK.recipes();
  assert.ok(R.every(r => r.ko !== 'x'), 'a recipe mixes meat and milk');
  assert.ok(R.filter(r => MK.allowed(r, { veg: 2 })).every(r => r.vg === 2));
  assert.ok(R.filter(r => MK.allowed(r, { veg: 2 })).length >= 8);
  assert.ok(R.filter(r => MK.allowed(r, { al: ['milk'] })).every(r => !r.al.includes('milk')));
  assert.ok(R.filter(r => MK.allowed(r, { no: ['טונה'] })).every(r => !r.ing.some(x => x[0] === 'טונה')));
});
test('the pantry covers a recipe or says what is missing, and cooking takes the ingredients out', () => {
  const pantry = { items: FK.parsePantry('יש לי קילו חזה עוף, חצי קילו אורז, 2 עגבניות, 2 מלפפונים, שמן זית').items };
  const r = MK.byId('chicken-rice-salad'), st = MK.stock(pantry);
  assert.strictEqual(MK.cover(r, st, 1).ok, true);
  assert.deepStrictEqual(MK.cover(MK.byId('salmon-quinoa'), st, 1).miss.map(m => m.k).sort(), ['גזר', 'סלמון', 'קינואה', 'קישוא'].sort());
  const taken = MK.cook(pantry, r, 1);
  assert.deepStrictEqual(taken.filter(t => t.k === 'חזה עוף' || t.k === 'אורז').map(t => [t.k, t.now]), [['חזה עוף', 820], ['אורז', 430]]);
});
test('a day of meals lands on its calories and reaches its protein, for different people', () => {
  const people = [[MAN, { goal: 'lose' }, {}], [MAN, { goal: 'muscle' }, { meals: 5 }], [{ sex: 'f', age: 35, height: 163, weight: 60, weekly: 3 }, { goal: 'keep' }, { meals: 3 }],
    [{ sex: 'f', age: 28, height: 168, weight: 70, weekly: 4 }, { goal: 'lose' }, { veg: 1 }], [MAN, { goal: 'keep' }, { veg: 2, meals: 4 }], [MAN, { goal: 'lose' }, { kosher: true, al: ['milk'] }]];
  people.forEach(([p, nut, prefs], i) => {
    const T = FK.targets(p, nut), D = MK.planDay(T, { prefs, seed: 'p' + i });
    assert.ok(Math.abs(D.tot[0] - T.kcal) / T.kcal < 0.08, `person ${i}: ${D.tot[0]} kcal for a target of ${T.kcal}`);
    assert.ok(D.tot[1] >= T.p * (prefs.veg === 2 ? 0.7 : 0.9), `person ${i}: ${D.tot[1]} g protein for a target of ${T.p}`);
    assert.ok(D.meals.every(m => MK.allowed(MK.byId(m.rid), prefs) && m.sv >= 0.5 && m.sv <= 2));
  });
});
test('a week: seven days, variety, and a shopping list that leaves out what is at home', () => {
  const T = FK.targets(MAN, { goal: 'lose' }), pantry = { items: FK.parsePantry('יש לי 2 קילו אורז ו-30 ביצים').items };
  const week = MK.planDays('2026-11-12', 7, () => T, { prefs: { meals: 4 }, stock: MK.stock(pantry), seed: 'w' });
  assert.strictEqual(Object.keys(week).length, 7);
  const used = {}; Object.values(week).forEach(d => d.meals.forEach(m => { used[m.rid] = (used[m.rid] || 0) + 1; }));
  assert.ok(Object.keys(used).length >= 12, 'only ' + Object.keys(used).length + ' different recipes in a week');
  assert.ok(Math.max(...Object.values(used)) <= 4);
  const shop = MK.shopping(week, pantry);
  assert.ok(shop.length > 8); assert.ok(!shop.some(x => x.k === 'אורז' || x.k === 'ביצה'), 'something at home is on the list');
  assert.ok(shop.every(x => x.q > 0 && ['g', 'ml', 'יח'].includes(x.u)));
  const chicken = shop.find(x => x.k === 'חזה עוף'); if (chicken) assert.strictEqual(chicken.q % 100, 0);      // sold by weight: rounded to a hundred grams
});
