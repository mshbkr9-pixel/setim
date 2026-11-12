/* Tests for PulseKit: the sentences the coach says with no model, on top of each sector.
   Run: node --test tests/pulse.test.js */
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const PK = require(path.join(__dirname, '..', 'parts', 'pulse.js'));

const GOAL = { title: 'לרדת ל-76 ק״ג', pct: 0.2, left: 'נשארו 6.4 ק״ג', state: 'on', need: '', weight: true, week: null };
const PLANNED = { rest: false, planned: 5, allDone: false, ring: true }, REST = { rest: true, planned: 0, allDone: false, ring: false }, OPEN = { rest: false, planned: 0, allDone: false, ring: false }, DONE = { rest: false, planned: 5, allDone: true, ring: true };
const FIT = { weekly: 3, weekDone: 1, streak: 0, pr: 0, prName: '', lastGap: 1, gain: null, today: PLANNED };
const FOOD = { ok: true, kcal: 2220, p: 170, eaten: { k: 686, p: 43 }, state: 'low', hitP: false, meals: 1, week: { days: 1, ok: 0, hitP: 0 }, veg: null };
const env = o => Object.assign({ hour: 14, goal: GOAL, fit: FIT, food: FOOD, body: {} }, o || {});
const fit = (f, o) => PK.brief(env(Object.assign({ fit: Object.assign({}, FIT, f || {}) }, o || {})), 'fit');
const food = (n, o) => PK.brief(env(Object.assign({ food: Object.assign({}, FOOD, n || {}) }, o || {})), 'food');
const week = { moved: true, fresh: true, line: 'ירדת 0.6 ק״ג, ל-82.6.' };

test('the goal line: the title, how far, what is left and the pace in words', () => {
  const b = PK.brief(env(), 'fit');
  assert.deepStrictEqual(b.goal, { title: 'לרדת ל-76 ק״ג', pct: 0.2, left: 'נשארו 6.4 ק״ג', state: 'on', stateText: 'בקצב' });
  assert.strictEqual(PK.brief(env({ goal: null }), 'fit').goal, null);
  assert.strictEqual(PK.brief(env({ goal: Object.assign({}, GOAL, { state: 'behind' }) }), 'food').goal.stateText, 'מאחורי התוכנית');
  assert.strictEqual(PK.brief(env({ goal: Object.assign({}, GOAL, { pct: 1.4 }) }), 'food').goal.pct, 1);
});

test('fitness, a planned day: what today\'s workout does for the week, never the numbers the page already shows', () => {
  let b = fit();
  assert.deepStrictEqual(b.say, ['אחרי האימון של היום יישאר עוד אימון אחד עד היעד השבועי.']); assert.strictEqual(b.praise, false); assert.strictEqual(b.step, null);
  assert.strictEqual(fit({ weekDone: 2 }).say[0], 'האימון של היום סוגר את היעד השבועי.');
  assert.strictEqual(fit({ weekDone: 0 }).say[0], 'אחרי האימון של היום יישארו עוד שני אימונים עד היעד השבועי.');
  assert.strictEqual(fit({ weekly: 5, weekDone: 1 }).say[0], 'אחרי האימון של היום יישארו עוד 3 אימונים עד היעד השבועי.');
  b = fit({ gain: { name: 'לחיצת חזה במוט', pct: 9.2 } });
  assert.deepStrictEqual(b.say, ['אחרי האימון של היום יישאר עוד אימון אחד עד היעד השבועי.', 'מאז שהתחלת: לחיצת חזה במוט, 9% יותר.']);
  assert.strictEqual(fit({ gain: { name: 'סקוואט', pct: 1 } }).say.length, 1);      // a change that small is not news
  assert.ok(!fit().say.join(' ').includes('1 מתוך 3'));      // the ring right under the card already says it
});

test('fitness: "כל הכבוד" is said for what was done', () => {
  let b = fit({ weekDone: 2, today: DONE });
  assert.deepStrictEqual(b.say, ['כל הכבוד, סיימת את האימון של היום. 2 מתוך 3 השבוע.']); assert.ok(b.praise);
  assert.strictEqual(fit({ weekDone: 3, today: DONE }).say[0], 'כל הכבוד! סיימת את האימון, והיעד השבועי הושג: 3 מתוך 3.');
  b = fit({ pr: 1, prName: 'לחיצת חזה במוט', weekDone: 2 });
  assert.deepStrictEqual(b.say, ['שיא חדש היום בלחיצת חזה במוט. כל הכבוד!', 'האימון של היום סוגר את היעד השבועי.']); assert.ok(b.praise);
  b = fit({ weekDone: 4, today: REST });
  assert.deepStrictEqual(b.say, ['היעד השבועי הושג: 4 אימונים. כל הכבוד!']); assert.ok(b.praise);
  b = fit({ weekDone: 3 });      // a planned workout beyond the target
  assert.deepStrictEqual(b.say, ['היעד השבועי הושג: 3 אימונים. כל הכבוד!', 'היעד השבועי כבר הושג. האימון של היום הוא תוספת.']);
  b = fit({ today: REST }, { goal: Object.assign({}, GOAL, { week }) });
  assert.strictEqual(b.say[0], 'השבוע שעבר קירב אותך למטרה: ירדת 0.6 ק״ג, ל-82.6.'); assert.ok(b.praise);
  assert.ok(!fit({ today: REST }, { goal: Object.assign({}, GOAL, { week: { moved: true, fresh: false, line: 'x' } }) }).say.join(' ').includes('קירב'));      // only at the start of the week
  assert.strictEqual(fit({}, { goal: Object.assign({}, GOAL, { week }) }).praise, false);      // said second, after what today holds: the first sentence is not praise
});

test('fitness, a day with no ring on the page: the week as a number', () => {
  assert.deepStrictEqual(fit({ weekDone: 2, today: REST }).say, ['2 מתוך 3 אימונים השבוע.']);
  assert.deepStrictEqual(fit({ weekDone: 2, today: OPEN }).say, ['2 מתוך 3 אימונים השבוע, עוד אחד עד היעד.']);
  assert.deepStrictEqual(fit({ weekDone: 1, today: OPEN }).say, ['1 מתוך 3 אימונים השבוע, עוד 2 עד היעד.']);
  assert.deepStrictEqual(fit({ weekDone: 0, lastGap: 2, today: OPEN }).say, ['השבוע עוד לא נרשם אימון.']);
  assert.deepStrictEqual(fit({ weekDone: 0, lastGap: 9, today: OPEN }).say, ['עברו 9 ימים מהאימון האחרון. אימון קצר היום מחזיר לקצב.']);
  assert.deepStrictEqual(fit({ weekDone: 0, lastGap: null, today: OPEN }).say, ['האימון הראשון עוד לפניך.']);
});

test('fitness: the steps and an injury', () => {
  let b = fit({ today: REST }, { body: { steps: 10400, stepsGoal: 8000 } });
  assert.strictEqual(b.say[0], 'עברת את יעד הצעדים: 10,400. כל הכבוד!'); assert.ok(b.praise);
  b = fit({ weekDone: 3, today: REST }, { body: { steps: 9000, stepsGoal: 8000 } });      // said second when something bigger came first
  assert.deepStrictEqual(b.say, ['היעד השבועי הושג: 3 אימונים. כל הכבוד!', 'וגם יעד הצעדים הושג: 9,000.']);
  assert.ok(!/צעדים/.test(fit({}, { body: { steps: 3000, stepsGoal: 8000 } }).say.join(' ')));
  b = fit({}, { body: { injuries: [{ part: 'כתף', hits: 2 }] } });
  assert.strictEqual(b.say[0], 'שמים לב לכתף: שני תרגילים היום עשויים להעמיס על האזור.'); assert.deepStrictEqual(b.step, { k: 'injury', t: 'הפציעה' }); assert.strictEqual(b.praise, false);
  b = fit({ pr: 1 }, { body: { injuries: [{ part: 'ברך', hits: 1 }] } });      // praise first, the caution right after it, and its step stays with it
  assert.deepStrictEqual(b.say, ['שיא חדש היום. כל הכבוד!', 'שמים לב לברך: תרגיל אחד היום עשוי להעמיס על האזור.']); assert.ok(b.step);
  assert.strictEqual(fit({}, { body: { injuries: [{ part: 'כתף', hits: 0 }] } }).step, null);      // an injury that today's workout does not touch is not brought up
});

test('nutrition: nothing is said that the box under the card already shows', () => {
  assert.deepStrictEqual(food().say, []);      // what is left of the calories and the protein is in the ring and the bars
  assert.deepStrictEqual(food({ eaten: { k: 0, p: 0 }, state: 'none' }, { hour: 8 }).say, []);
  assert.deepStrictEqual(food({ eaten: { k: 2600, p: 120 }, state: 'over' }).say, []);      // "מעל היעד, קורה" is the box's own line
  assert.strictEqual(PK.brief(env({ food: { ok: false } }), 'food').none, true);
  assert.strictEqual(food().none, false);
});

test('nutrition: "כל הכבוד" for the protein and for a day inside the target', () => {
  let b = food({ eaten: { k: 2200, p: 172 }, state: 'ok', hitP: true }); assert.deepStrictEqual(b.say, ['כל הכבוד, היום בתוך היעד, כולל החלבון.']); assert.ok(b.praise);
  b = food({ eaten: { k: 1500, p: 175 }, state: 'under', hitP: true }); assert.deepStrictEqual(b.say, ['כל הכבוד, יעד החלבון של היום הושג.']); assert.ok(b.praise);
  b = food({ veg: 4, meals: 3 }); assert.deepStrictEqual(b.say, ['4 מנות ירק ופרי היום. כל הכבוד!']); assert.ok(b.praise);
  b = food({ week: { days: 6, ok: 5, hitP: 2 } }); assert.deepStrictEqual(b.say, ['5 ימים בתוך היעד השבוע. כל הכבוד על העקביות.']); assert.ok(b.praise);
  assert.deepStrictEqual(food({ week: { days: 6, ok: 1, hitP: 4 } }).say, ['יעד החלבון הושג ב-4 ימים השבוע. כל הכבוד!']);
});

test('nutrition: eating very little is never praised', () => {
  for (const hour of [9, 14, 19, 22, 23]) {
    const b = food({ eaten: { k: 500, p: 30 }, state: 'low', hitP: false }, { hour });
    assert.strictEqual(b.praise, false, 'hour ' + hour); assert.ok(!/כל הכבוד/.test(b.say.join(' ')), b.say.join(' '));
  }
  assert.strictEqual(food({ eaten: { k: 500, p: 30 }, state: 'low' }, { hour: 22 }).say[0], 'נרשם היום הרבה פחות מהיעד. אם אכלת יותר, כדאי להשלים את הרישום.');
  const b = food({ eaten: { k: 700, p: 175 }, state: 'low', hitP: true }, { hour: 22 });      // the protein was reached on almost no food: still not a success
  assert.strictEqual(b.praise, false); assert.ok(!/כל הכבוד/.test(b.say[0]));
});

test('nutrition: the scale, the week, vegetables and the protein gap', () => {
  let b = food({}, { goal: Object.assign({}, GOAL, { need: 'weighin' }) });
  assert.deepStrictEqual(b.say, ['עבר יותר משבוע מאז השקילה. שקילה בבוקר מראה איפה עומדים.']); assert.deepStrictEqual(b.step, { k: 'weigh', t: 'שקילה' });
  assert.deepStrictEqual(food({}, { body: { weighDays: 9 } }).step, { k: 'weigh', t: 'שקילה' });
  assert.strictEqual(food({}, { body: { weighDays: 9 }, goal: Object.assign({}, GOAL, { weight: false }) }).step, null);      // a strength goal does not ask for the scale
  assert.strictEqual(food({}, { body: { weighDays: 9 }, goal: null }).step, null);
  b = food({}, { goal: Object.assign({}, GOAL, { week }) }); assert.deepStrictEqual(b.say, ['השבוע שעבר קירב אותך למטרה: ירדת 0.6 ק״ג, ל-82.6.']); assert.ok(b.praise);
  assert.deepStrictEqual(food({ veg: 0, meals: 2 }).say, ['עוד אין ירק או פרי היום.']);
  assert.deepStrictEqual(food({ veg: 0, meals: 1 }).say, []);      // one meal in, it is too early to say
  assert.deepStrictEqual(food({ veg: 0, meals: 2 }, { hour: 9 }).say, []);
  assert.deepStrictEqual(food({ veg: null, meals: 3 }).say, []);      // a meal the vocabulary could not read may have held vegetables
  assert.deepStrictEqual(food({ veg: 1, meals: 3 }, { hour: 18 }).say, ['חסרים עוד 127 ג׳ חלבון. ארוחה עם חלבון תסגור את הפער.']);
  assert.deepStrictEqual(food({ veg: 0, meals: 3 }, { hour: 18 }).say, ['עוד אין ירק או פרי היום.', 'חסרים עוד 127 ג׳ חלבון. ארוחה עם חלבון תסגור את הפער.']);
});

test('the same data always gives the same words, never more than two sentences, and nothing breaks on missing parts', () => {
  for (const sector of ['fit', 'food']) {
    const a = PK.brief(env({ goal: Object.assign({}, GOAL, { week }) }), sector), b = PK.brief(env({ goal: Object.assign({}, GOAL, { week }) }), sector);
    assert.deepStrictEqual(a, b); assert.ok(a.say.length <= 2);
  }
  const busy = fit({ pr: 2, weekDone: 3, gain: { name: 'סקוואט', pct: 12 } }, { goal: Object.assign({}, GOAL, { week }), body: { steps: 12000, stepsGoal: 8000, injuries: [{ part: 'גב תחתון', hits: 3 }] } });
  assert.strictEqual(busy.say.length, 2); assert.ok(busy.step);      // however much there is to say, two sentences
  assert.doesNotThrow(() => PK.brief({}, 'fit')); assert.doesNotThrow(() => PK.brief(null, 'food'));
  assert.doesNotThrow(() => PK.brief({ goal: {}, fit: {}, food: { ok: true, kcal: 2000, p: 100 }, body: { injuries: [] } }, 'food'));
  assert.strictEqual(PK.brief({ goal: {} }, 'fit').goal, null);
});
