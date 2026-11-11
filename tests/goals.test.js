/* node --test tests/goals.test.js     (from the project folder) */
const test = require('node:test');
const assert = require('node:assert');
const G = require('../parts/goals.js');
const VL = require('../parts/voice.js');

const TODAY = '2026-11-11';
const NAMES = { 'bench-press': 'לחיצת חזה במוט', squat: 'סקוואט במוט', deadlift: 'דדליפט במוט', 'pull-up': 'פול-אפ', 'push-up': 'שכיבות סמיכה', dips: 'דיפס לחזה', 'chin-ups': "צ'ין-אפ", running: 'ריצה', cycling: 'רכיבה על אופניים', 'x-swimming': 'שחייה' };
const mk = (over = {}) => Object.assign({ today: TODAY, now: 1794000000000, profile: { weight: 84, height: 178, age: 30, sex: 'm', weekly: 3 }, weighins: [], logs: {}, nameOf: id => NAMES[id] || '' }, over);
const U = (t, w = 84) => G.understand(t, { today: TODAY, weight: w, parse: VL.parse });
const sess = (d, ...sets) => ({ d, sets: sets.map(([r, w]) => ({ r, w, t: true })) });

test('the person\'s own words become a kind of goal', () => {
  let u = U('לרדת 8 קילו עד הקיץ'); assert.strictEqual(u.kind, 'lose'); assert.strictEqual(u.p.lose, 8); assert.strictEqual(u.due, '2027-06-21');
  u = U('לרדת ל-76 קילו'); assert.strictEqual(u.kind, 'lose'); assert.strictEqual(u.p.to, 76);
  u = U('לרדת שמונה קילו'); assert.strictEqual(u.p.lose, 8);
  u = U('אני רוצה להגיע ל 80'); assert.strictEqual(u.kind, 'free');
  u = U('לסיים איירונמן'); assert.strictEqual(u.kind, 'tri'); assert.strictEqual(u.p.race, 'iron');
  u = U('חצי איירונמן בעוד שנה'); assert.strictEqual(u.p.race, 'half'); assert.strictEqual(u.due, '2027-11-11');
  u = U('טריאתלון ספרינט'); assert.strictEqual(u.p.race, 'sprint');
  u = U("בנץ' 100 קילו"); assert.strictEqual(u.kind, 'lift'); assert.strictEqual(u.p.ex, 'bench-press'); assert.strictEqual(u.p.to, 100);
  u = U('להגיע ל-10 עליות מתח'); assert.strictEqual(u.kind, 'reps'); assert.strictEqual(u.p.ex, 'pull-up'); assert.strictEqual(u.p.to, 10);
  u = U('לרוץ 10 קילומטר'); assert.strictEqual(u.kind, 'run'); assert.strictEqual(u.p.km, 10);
  u = U('חצי מרתון עד מרץ'); assert.strictEqual(u.p.km, 21.1); assert.strictEqual(u.due, '2027-03-01');
  u = U('מרתון'); assert.strictEqual(u.p.km, 42.2);
  u = U('לעלות 5 קילו במסת שריר'); assert.strictEqual(u.kind, 'gain'); assert.strictEqual(u.p.gain, 5);
  u = U('להתאמן 4 פעמים בשבוע'); assert.strictEqual(u.kind, 'habit'); assert.strictEqual(u.p.perWeek, 4);
  assert.strictEqual(U('להיכנס לכושר').kind, 'habit');
  assert.strictEqual(U('לעמוד על הידיים').kind, 'free');
  assert.strictEqual(U('לשפר את הסקוואט שלי').kind, 'lift');
  assert.strictEqual(U('lose 5 kg in 10 weeks').due, '2027-01-20');
  assert.strictEqual(U('ironman').p.race, 'iron');
});

test('losing weight: a healthy pace, steps on the way, then holding it', () => {
  const r = G.build('lose', { from: 84, to: 76 }, mk(), '');
  assert.ok(r.goal, JSON.stringify(r)); const g = r.goal;
  assert.strictEqual(g.title, 'לרדת ל-76 ק״ג'); assert.strictEqual(r.verdict.state, 'ok');
  assert.deepStrictEqual(g.stages.map(s => s.m.k === 'weight' ? s.m.to : s.m.k), [82, 80, 78, 76, 'keep']);
  assert.ok(g.p.pace >= 0.45 && g.p.pace <= 0.55, 'pace ' + g.p.pace);
  const weeks = g.stages.slice(0, -1).reduce((n, s) => n + s.weeks, 0); assert.ok(weeks >= 14 && weeks <= 18, 'weeks ' + weeks);
  assert.strictEqual(g.due, G.addDays(TODAY, weeks * 7)); assert.strictEqual(g.stages[0].from, TODAY); assert.strictEqual(g.stages[3].until, g.due);
  assert.ok(g.p.kcal > 1500 && g.p.kcal < 2600, 'kcal ' + g.p.kcal); assert.match(g.stages[0].todo[0], /קק״ל/);
});
test('a date that is too close is moved, not obeyed', () => {
  const soon = G.addDays(TODAY, 6 * 7), r = G.build('lose', { from: 84, to: 76 }, mk(), soon);
  assert.strictEqual(r.verdict.state, 'no'); assert.ok(r.goal.due > soon); assert.match(r.verdict.text, /מהיר מדי/);
  const hard = G.build('lose', { from: 84, to: 76 }, mk(), G.addDays(TODAY, 12 * 7)); assert.strictEqual(hard.verdict.state, 'hard'); assert.strictEqual(hard.goal.due, G.addDays(TODAY, 12 * 7));
  const easy = G.build('lose', { from: 84, to: 80 }, mk(), G.addDays(TODAY, 20 * 7)); assert.strictEqual(easy.verdict.state, 'ok'); assert.strictEqual(easy.goal.due, G.addDays(TODAY, 20 * 7));
});
test('weight goals stay inside the healthy range', () => {
  const r = G.build('lose', { from: 70, to: 50 }, mk({ profile: { weight: 70, height: 178, age: 30, sex: 'm', weekly: 3 } }), '');
  assert.strictEqual(r.goal.p.to, 59); assert.match(r.notes[0], /הגבול התחתון/);
  assert.ok(G.build('lose', { from: 59, to: 55 }, mk({ profile: { weight: 59, height: 178, age: 30, sex: 'm' } }), '').stop);
  assert.ok(G.build('lose', { from: 70, to: 65 }, mk({ profile: { weight: 70, height: 170, age: 16, sex: 'f' } }), '').stop);
  assert.ok(G.build('lose', { from: 70, to: 75 }, mk(), '').err);
  const f = G.build('lose', { from: 62, to: 57 }, mk({ profile: { weight: 62, height: 165, age: 35, sex: 'f', weekly: 2 } }), ''); assert.ok(f.goal.p.kcal >= 1200);
});
test('weight progress: weigh-ins close stages in order', () => {
  const g = G.build('lose', { from: 84, to: 76 }, mk({ weighins: [{ d: TODAY, kg: 84 }] }), '').goal;
  let d = mk({ today: G.addDays(TODAY, 28), weighins: [{ d: TODAY, kg: 84 }, { d: G.addDays(TODAY, 14), kg: 83 }, { d: G.addDays(TODAY, 28), kg: 81.9 }] });
  let s = G.sync(g, d); assert.strictEqual(s.fresh.length, 1); assert.strictEqual(g.stages[0].done, d.today);
  let p = G.progress(g, d); assert.strictEqual(p.idx, 1); assert.ok(Math.abs(p.pct - 2.1 / 8) < 0.01, 'pct ' + p.pct); assert.strictEqual(p.leftText, 'נשארו 5.9 ק״ג'); assert.ok(p.eta, 'eta');
  d = mk({ today: G.addDays(TODAY, 120), weighins: [{ d: TODAY, kg: 84 }, { d: G.addDays(TODAY, 110), kg: 76.4 }, { d: G.addDays(TODAY, 120), kg: 75.8 }] });
  s = G.sync(g, d); assert.strictEqual(s.fresh.length, 3); assert.strictEqual(g.status, 'on'); assert.strictEqual(G.progress(g, d).stage.m.k, 'keep');
  d = mk({ today: G.addDays(TODAY, 150), weighins: d.weighins.concat([{ d: G.addDays(TODAY, 135), kg: 76.2 }, { d: G.addDays(TODAY, 150), kg: 76.5 }]) });
  s = G.sync(g, d); assert.strictEqual(s.finished, true); assert.strictEqual(g.status, 'done'); assert.strictEqual(G.progress(g, d).pct, 1);
});
test('a week in words, for a weight goal', () => {
  const g = G.build('lose', { from: 84, to: 76 }, mk({ weighins: [{ d: '2026-11-01', kg: 84 }] }), '').goal; g.created = '2026-11-01';
  const d = mk({ today: '2026-11-16', weighins: [{ d: '2026-11-01', kg: 84 }, { d: '2026-11-07', kg: 83.6 }, { d: '2026-11-13', kg: 83 }], logs: { squat: { sessions: [sess('2026-11-09', [5, 80]), sess('2026-11-11', [5, 80]), sess('2026-11-13', [5, 82.5])] } } });
  const w = G.week(g, d, 1); assert.strictEqual(w.key, '2026-11-08'); assert.strictEqual(w.title, 'השבוע התקדמת לעבר המטרה'); assert.strictEqual(w.lines[0], 'ירדת 0.6 ק״ג, ל-83.'); assert.match(w.lines[w.lines.length - 1], /3 אימונים, כמו שתוכנן/); assert.strictEqual(w.close, 'יפה מאוד.');
  const none = G.week(g, mk({ today: '2026-11-16', weighins: [{ d: '2026-11-01', kg: 84 }] }), 1); assert.strictEqual(none.tone, 'low'); assert.match(none.lines[0], /לא נרשמה שקילה/);
});

test('strength: the timeline follows how fast lifts really grow', () => {
  const r = G.build('lift', { ex: 'bench-press', from: 60, to: 100 }, mk(), ''); const g = r.goal;
  assert.strictEqual(g.title, 'לחיצת חזה במוט: 100 ק״ג'); const marks = g.stages.map(s => s.m.to); assert.strictEqual(marks[marks.length - 1], 100); assert.ok(marks.length >= 4);
  assert.ok(marks.every((m, i) => i === 0 || m > marks[i - 1])); assert.ok(g.stages[g.stages.length - 1].m.real);
  const weeks = g.stages.reduce((n, s) => n + s.weeks, 0); assert.ok(weeks >= 40 && weeks <= 90, 'weeks ' + weeks);
  assert.strictEqual(G.build('lift', { ex: 'bench-press', from: 60, to: 100 }, mk(), G.addDays(TODAY, 12 * 7)).verdict.state, 'no');
  assert.ok(G.build('lift', { ex: 'bench-press', from: 60, to: 50 }, mk(), '').err);
  // a beginner far below the first standard moves fast
  const nov = G.build('lift', { ex: 'squat', from: 40, to: 60 }, mk(), ''); const nw = nov.goal.stages.reduce((n, s) => n + s.weeks, 0); assert.ok(nw <= 26, 'novice weeks ' + nw);
});
test('strength progress: estimates move the bar, only a real lift closes the goal', () => {
  const g = G.build('lift', { ex: 'bench-press', from: 60, to: 70 }, mk(), '').goal; const later = G.addDays(TODAY, 30);
  let d = mk({ today: later, logs: { 'bench-press': { sessions: [sess(G.addDays(TODAY, 20), [8, 57.5])] } } });        // 57.5 x 8 is worth about 72.8
  let s = G.sync(g, d); assert.strictEqual(g.status, 'on'); assert.ok(g.stages.slice(0, -1).every(x => x.done)); assert.strictEqual(g.stages[g.stages.length - 1].done, '');
  assert.ok(G.progress(g, d).pct < 1); assert.strictEqual(G.progress(g, d).leftText, 'נשאר להרים את זה באמת');
  d = mk({ today: later, logs: { 'bench-press': { sessions: [sess(G.addDays(TODAY, 20), [8, 57.5]), sess(later, [1, 70])] } } });
  s = G.sync(g, d); assert.strictEqual(s.finished, true); assert.strictEqual(g.status, 'done');
  // a set from before the goal was set does not count
  const g2 = G.build('lift', { ex: 'bench-press', from: 60, to: 70 }, mk(), '').goal;
  G.sync(g2, mk({ today: later, logs: { 'bench-press': { sessions: [sess('2025-01-01', [1, 90])] } } })); assert.strictEqual(g2.stages[0].done, '');
});

test('pull-ups from zero start with the first rep', () => {
  const g = G.build('reps', { ex: 'pull-up', from: 0, to: 10 }, mk(), '').goal;
  assert.deepStrictEqual(g.stages.map(s => s.m.to), [1, 3, 5, 8, 10]); assert.match(g.stages[0].todo[1], /שליליות/); assert.strictEqual(g.stages[0].t, 'חזרה אחת'); assert.strictEqual(g.stages[4].t, 'היעד: 10 חזרות');
  const d = mk({ today: G.addDays(TODAY, 70), logs: { 'pull-up': { sessions: [sess(G.addDays(TODAY, 60), [4, 0], [3, 0])] } } });
  G.sync(g, d); assert.deepStrictEqual(g.stages.map(s => !!s.done), [true, true, false, false, false]);
  const p = G.progress(g, d); assert.strictEqual(p.curText, '4 חזרות'); assert.strictEqual(p.leftText, 'נשארו 6 חזרות');
});

test('running: the long run grows slowly, long races get a taper', () => {
  const five = G.build('run', { km: 5, from: 0 }, mk(), '').goal; assert.deepStrictEqual(five.stages.map(s => s.m.km), [1, 2, 3, 4, 5]);
  const w5 = five.stages.reduce((n, s) => n + s.weeks, 0); assert.ok(w5 >= 9 && w5 <= 14, 'weeks to 5k ' + w5); assert.match(five.stages[0].todo[1], /הליכה/);
  const ten = G.build('run', { km: 10, from: 5 }, mk(), '').goal; assert.deepStrictEqual(ten.stages.map(s => s.m.km), [6.5, 8, 10]);
  const half = G.build('run', { km: 21.1, from: 10 }, mk(), '').goal; assert.deepStrictEqual(half.stages.map(s => s.m.k === 'long' ? s.m.km : s.m.k), [13, 16, 19, 'rest', 21.1]); assert.strictEqual(half.title, 'לרוץ חצי מרתון');
  const wh = half.stages.reduce((n, s) => n + s.weeks, 0); assert.ok(wh >= 9 && wh <= 14, 'half weeks ' + wh);
  const mar = G.build('run', { km: 42.2, from: 21 }, mk(), ''); const wm = mar.goal.stages.reduce((n, s) => n + s.weeks, 0); assert.ok(wm >= 12 && wm <= 20, 'marathon weeks ' + wm);
  assert.strictEqual(G.build('run', { km: 42.2, from: 3 }, mk(), G.addDays(TODAY, 8 * 7)).verdict.state, 'no');
  assert.ok(G.build('run', { km: 5, from: 6 }, mk(), '').err);
  const d = mk({ today: G.addDays(TODAY, 40), logs: { running: { sessions: [{ d: G.addDays(TODAY, 30), sets: [{ r: 22, w: 3.1, t: true }] }] }, 'treadmill-running': { sessions: [{ d: G.addDays(TODAY, 35), sets: [{ r: 15, w: 2, t: true }] }] } } });
  G.sync(five, d); assert.deepStrictEqual(five.stages.map(s => !!s.done), [true, true, true, false, false]);
  const w = G.week(five, mk({ today: G.addDays(G.weekStart(G.addDays(TODAY, 35)), 8), logs: d.logs }), 1); assert.match(w.lines.join(' '), /ריצה: 2 ק״מ באימון אחד/);
});

test('an Ironman from scratch goes through the shorter distances first', () => {
  const r = G.build('tri', { race: 'iron', level: 'beginner' }, mk(), ''); const g = r.goal;
  assert.deepStrictEqual(g.stages.map(s => s.t), ['בסיס אירובי', 'מרחק ספרינט', 'מרחק אולימפי', 'מרחק חצי איירונמן', 'בנייה לאיירונמן', 'שיא', 'הפחתה', 'יום המרוץ: איירונמן']);
  const weeks = g.stages.reduce((n, s) => n + s.weeks, 0); assert.ok(weeks >= 48 && weeks <= 60, 'weeks ' + weeks); assert.strictEqual(g.title, 'לסיים איירונמן');
  assert.strictEqual(G.build('tri', { race: 'iron', level: 'beginner' }, mk(), G.addDays(TODAY, 20 * 7)).verdict.state, 'no');
  const year = G.build('tri', { race: 'iron', level: 'beginner' }, mk(), G.addDays(TODAY, 52 * 7)); assert.notStrictEqual(year.verdict.state, 'no'); assert.strictEqual(year.goal.due, G.addDays(TODAY, 52 * 7));
  assert.strictEqual(year.goal.stages[6].weeks, 3);                    // the taper is not stretched or squeezed
  const sprint = G.build('tri', { race: 'sprint', level: 'trained' }, mk(), '').goal; assert.deepStrictEqual(sprint.stages.map(s => s.m.k), ['tri', 'rest', 'event']);
  // logged sessions close a phase, the race itself is ticked by hand
  const d = mk({ today: G.addDays(TODAY, 50), logs: { 'x-swimming': { sessions: [{ d: G.addDays(TODAY, 40), sets: [{ r: 20, w: 0.8, t: true }] }] }, cycling: { sessions: [{ d: G.addDays(TODAY, 41), sets: [{ r: 60, w: 22, t: true }] }] }, running: { sessions: [{ d: G.addDays(TODAY, 42), sets: [{ r: 32, w: 5, t: true }] }] } } });
  G.sync(sprint, d); assert.strictEqual(sprint.stages[0].done, d.today); assert.strictEqual(sprint.stages[1].done, '');
  const d2 = mk({ today: G.addDays(TODAY, 58), logs: d.logs }); G.sync(sprint, d2); assert.strictEqual(sprint.stages[1].done, d2.today); assert.strictEqual(sprint.status, 'on');
  assert.strictEqual(G.markStage(sprint, 2, d2), true); assert.strictEqual(sprint.status, 'done');
});

test('consistency counts full weeks and forgives a missed one', () => {
  const g = G.build('habit', { perWeek: 3, weeks: 12 }, mk(), '').goal; assert.deepStrictEqual(g.stages.map(s => s.m.n), [2, 4, 8, 12]); assert.strictEqual(g.title, 'להתאמן 3 פעמים בשבוע, 3 חודשים');
  const days = ['2026-11-08', '2026-11-10', '2026-11-12', '2026-11-16', '2026-11-18', '2026-11-22', '2026-11-24', '2026-11-26'];       // weeks of 3, 2, 3
  const d = mk({ today: '2026-11-28', logs: { squat: { sessions: days.map(x => sess(x, [5, 80])) } } });
  G.sync(g, d); assert.strictEqual(g.stages[0].done, d.today); const p = G.progress(g, d); assert.strictEqual(p.cur, 2); assert.strictEqual(p.leftText, 'נשארו 10 שבועות');
  const w = G.week(g, mk({ today: '2026-11-23', logs: d.logs }), 1); assert.strictEqual(w.tone, 'low'); assert.match(w.lines[1], /חסר אימון אחד/);
});

test('a goal in free words gets stages the person ticks', () => {
  const r = G.build('free', { title: 'לעמוד על הידיים 30 שניות', stages: ['עמידה מול קיר', 'עשר שניות בלי קיר', '30 שניות'] }, mk(), ''); const g = r.goal;
  assert.strictEqual(g.stages.length, 3); assert.strictEqual(G.sync(g, mk()).fresh.length, 0);
  assert.strictEqual(G.markStage(g, 1, mk()), false); assert.strictEqual(G.markStage(g, 0, mk()), true); assert.strictEqual(G.progress(g, mk()).done, 1);
  assert.ok(G.build('free', { title: '' }, mk(), '').err);
});

test('the questions come pre-filled from what the app already knows', () => {
  const d = mk({ weighins: [{ d: '2026-11-09', kg: 83.2 }], logs: { 'bench-press': { sessions: [sess('2026-11-03', [8, 60])] }, running: { sessions: [{ d: '2026-11-05', sets: [{ r: 30, w: 4.2, t: true }] }] } } });
  let q = G.ask('lose', { lose: 8 }, d); assert.strictEqual(q[0].def, 83.2); assert.strictEqual(q[1].def, 75); assert.strictEqual(q.length, 2);
  q = G.ask('lose', {}, mk({ profile: { weight: 80 } })); assert.strictEqual(q[2].k, 'height');
  q = G.ask('lift', { ex: 'bench-press', to: 100 }, d); assert.strictEqual(q[1].def, 75); assert.strictEqual(q[2].def, 100);
  q = G.ask('run', { km: 10 }, d); assert.strictEqual(q[1].def, 4.2);
  assert.strictEqual(G.ask('free', {}, d).length, 0);
});

test('re-planning keeps the stage lengths and starts from today', () => {
  const g = G.build('run', { km: 5, from: 0 }, mk(), '').goal; const late = mk({ today: G.addDays(TODAY, 60) });
  assert.strictEqual(G.progress(g, late).state, 'behind'); G.replan(g, late); assert.strictEqual(g.stages[0].from, late.today); assert.strictEqual(G.progress(g, late).state !== 'behind', true);
});
