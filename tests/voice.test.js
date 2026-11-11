/* node --test tests/     (from the project folder) */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const VL = require('../parts/voice.js');

const root = path.join(__dirname, '..');
const ex = JSON.parse(fs.readFileSync(path.join(root, 'data', 'exercises.json'), 'utf8'));
const extra = [['x-swimming', 'שחייה', 'Swimming'], ['x-bike-outdoor', 'רכיבה על אופניים בחוץ', 'Outdoor cycling'], ['x-hiking', 'הליכה בטבע / טיול', 'Hiking']]
  .map(([id, he, en]) => ({ id, he, en, g: 'cardio', cat: 'cardio', bw: true }));
const IX = VL.buildIndex(ex.concat(extra));
const POP = {}; ['bench-press', 'squat', 'deadlift', 'pull-up', 'lat-pulldown', 'leg-press', 'plank', 'push-up', 'dumbbell-shoulder-press', 'barbell-curl', 'dips', 'running', 'hip-thrust', 'lateral-raise', 'seated-cable-row', 'crunches', 'tricep-pushdown', 'lunge', 'treadmill-running'].forEach(id => POP[id] = 1);
const D = '2026-11-11';
const env = (over = {}) => Object.assign({ index: IX, logs: {}, plan: [], stars: {}, popular: POP, last: null, date: D, now: Date.parse(D + 'T10:00:00Z') }, over);
const say = (text, over) => VL.handle(text, env(over));
const set = (text, over) => { const r = say(text, over); assert.ok(r.ok, `${text} -> ${r.why} / ${r.say}`); return [r.item.ex, r.item.sets[0].r, r.item.sets[0].w, r.item.sets.length, r.item.idx]; };

test('the sentence from the request, Hebrew', () => {
  assert.deepStrictEqual(set("תוסיפי לי עכשיו: עשיתי סט בנץ', סט 1, עשיתי 10 חזרות ועשיתי 20 קילו"), ['bench-press', 10, 20, 1, 1]);
});
test('the sentence from the request, mixed with English words', () => {
  assert.deepStrictEqual(set('עשיתי set bench, עשיתי set 1, עשיתי 10 חזרות ועשיתי 20 קילו'), ['bench-press', 10, 20, 1, 1]);
});
test('plain English', () => {
  assert.deepStrictEqual(set('Log bench press, set one, ten reps, twenty kilos'), ['bench-press', 10, 20, 1, 1]);
  assert.deepStrictEqual(set('I did 3 sets of 10 squats at 100 kg'), ['squat', 10, 100, 3, 0]);
  assert.deepStrictEqual(set('deadlift 5 reps 140 kg'), ['deadlift', 5, 140, 1, 0]);
  assert.deepStrictEqual(set('add leg press twelve reps one hundred and twenty kilos'), ['leg-press', 12, 120, 1, 0]);
  assert.deepStrictEqual(set('lat pulldown 8 reps at 47.5 kilos'), ['lat-pulldown', 8, 47.5, 1, 0]);
  assert.deepStrictEqual(set('shoulder press 8 reps 42.5 kg'), ['dumbbell-shoulder-press', 8, 42.5, 1, 0]);
  assert.deepStrictEqual(set('bench 5 5 100'), ['bench-press', 5, 100, 5, 0]);
  assert.deepStrictEqual(set('squat 5 by 5 at 100'), ['squat', 5, 100, 5, 0]);
  assert.deepStrictEqual(set('bench 100 for 5'), ['bench-press', 5, 100, 1, 0]);
});
test('Hebrew number words', () => {
  assert.deepStrictEqual(set('סקוואט שמונה חזרות שישים קילו'), ['squat', 8, 60, 1, 0]);
  assert.deepStrictEqual(set('דדליפט חמש חזרות מאה עשרים וחמש קילו'), ['deadlift', 5, 125, 1, 0]);
  assert.deepStrictEqual(set('לחיצת חזה שתים עשרה חזרות שבעים ושתיים וחצי קילו'), ['bench-press', 12, 72.5, 1, 0]);
  assert.deepStrictEqual(set('לג פרס אחת עשרה חזרות מאתיים קילו'), ['leg-press', 11, 200, 1, 0]);
  assert.deepStrictEqual(set('בנץ עשר חזרות עשרים קילו'), ['bench-press', 10, 20, 1, 0]);
  assert.deepStrictEqual(set('שני סטים של עשר חזרות בארבעים קילו בנץ'), ['bench-press', 10, 40, 2, 0]);
  assert.deepStrictEqual(set('לחיצת כתפיים במשקולות 12 חזרות 14 קילו לכל יד'), ['dumbbell-shoulder-press', 12, 14, 1, 0]);
  assert.deepStrictEqual(set('בנץ מאה עשר'), ['bench-press', 10, 100, 1, 0]);
  assert.deepStrictEqual(set('בנץ שמונה חזרות מאה ועשר קילו'), ['bench-press', 8, 110, 1, 0]);
});
test('no units: order and size decide', () => {
  assert.deepStrictEqual(set('בנץ 10 20'), ['bench-press', 10, 20, 1, 0]);
  assert.deepStrictEqual(set('סקוואט 100 קילו 5'), ['squat', 5, 100, 1, 0]);
  assert.deepStrictEqual(set('סקוואט 62.5 8'), ['squat', 8, 62.5, 1, 0]);
  assert.deepStrictEqual(set('בנץ 3 על 10 עם 60 קילו'), ['bench-press', 10, 60, 3, 0]);
  assert.deepStrictEqual(set('בנץ 8 על 40'), ['bench-press', 8, 40, 1, 0]);
  assert.deepStrictEqual(set('דדליפט 3 סטים של 5 חזרות 120 קילו'), ['deadlift', 5, 120, 3, 0]);
});
test('set numbers', () => {
  assert.strictEqual(set('בנץ סט שני 8 חזרות 60 קילו')[4], 2);
  assert.strictEqual(set('בנץ הסט השלישי 8 חזרות 60 קילו')[4], 3);
  assert.strictEqual(set('bench press second set 8 reps 60 kilos')[4], 2);
  assert.strictEqual(set('בנץ סט מספר 2 8 חזרות 60 קילו')[4], 2);
  const one = set('עשיתי סט אחד של בנץ 10 חזרות 50 קילו'); assert.strictEqual(one[4], 0); assert.strictEqual(one[3], 1);
});
test('body weight, timed and cardio', () => {
  assert.deepStrictEqual(set('מתח 8 חזרות'), ['pull-up', 8, 0, 1, 0]);
  assert.deepStrictEqual(set('עליות מתח שמונה'), ['pull-up', 8, 0, 1, 0]);
  assert.deepStrictEqual(set('שכיבות סמיכה 25'), ['push-up', 25, 0, 1, 0]);
  assert.deepStrictEqual(set('פלאנק 60 שניות'), ['plank', 60, 0, 1, 0]);
  assert.deepStrictEqual(set('פלאנק דקה וחצי'), ['plank', 90, 0, 1, 0]);
  assert.deepStrictEqual(set('ריצה 30 דקות 5 קילומטר'), ['running', 30, 5, 1, 0]);
  assert.deepStrictEqual(set('רצתי 5 ק"מ ב-28 דקות'), ['running', 28, 5, 1, 0]);
  assert.deepStrictEqual(set('שחייה 40 דקות 1500 מטר'), ['x-swimming', 40, 1.5, 1, 0]);
  assert.deepStrictEqual(set('ran 10 kilometers in one hour'), ['running', 60, 10, 1, 0]);
  assert.deepStrictEqual(set('הליכה חצי שעה'), ['walking', 30, 0, 1, 0]);
});
test('English names as Hebrew dictation spells them', () => {
  assert.strictEqual(set('בנץ פרס 10 חזרות 60 קילו')[0], 'bench-press');
  assert.strictEqual(set('לאט פולדאון 10 חזרות 50 קילו')[0], 'lat-pulldown');
  assert.strictEqual(set('לג פרס 10 חזרות 150 קילו')[0], 'leg-press');
  assert.strictEqual(set('דד ליפט 5 חזרות 100 קילו')[0], 'deadlift');
  assert.strictEqual(set('היפ טראסט 10 חזרות 80 קילו')[0], 'hip-thrust');
  assert.strictEqual(set('דיפס 12 חזרות')[0], 'dips');
});
test('what is planned or was trained recently wins over the catalogue default', () => {
  assert.strictEqual(set('סקוואט 10 חזרות 20 קילו', { plan: ['goblet-squat'] })[0], 'goblet-squat');
  assert.strictEqual(set('לחיצת חזה 10 חזרות 22 קילו', { logs: { 'db-bench-press': { sessions: [{ d: '2026-11-08', sets: [{ r: 10, w: 20, t: true }] }] } } })[0], 'db-bench-press');
  assert.strictEqual(set('לחיצת חזה במוט 10 חזרות 60 קילו', { plan: ['db-bench-press'] })[0], 'bench-press');
});
test('a missing number is taken from the last set, and the answer says so', () => {
  const logs = { 'bench-press': { sessions: [{ d: D, sets: [{ r: 10, w: 60, t: true }] }] } };
  const r = say('בנץ 8 חזרות', { logs }); assert.ok(r.ok); assert.deepStrictEqual(r.item.sets[0], { r: 8, w: 60 }); assert.match(r.say, /כמו בסט הקודם/);
  const r2 = say('עוד סט', { logs, last: { ex: 'bench-press', at: Date.parse(D + 'T09:50:00Z') } }); assert.ok(r2.ok, r2.say); assert.deepStrictEqual(r2.item.sets[0], { r: 10, w: 60 }); assert.strictEqual(r2.setNo, 2);
  const r3 = say('8 חזרות 62.5 קילו', { logs, last: { ex: 'bench-press', at: Date.parse(D + 'T09:50:00Z') } }); assert.ok(r3.ok); assert.strictEqual(r3.item.ex, 'bench-press');
  assert.strictEqual(say('8 חזרות 62.5 קילו', { logs }).ok, false);
});
test('what cannot be understood is not logged', () => {
  assert.strictEqual(say('').why, 'empty');
  assert.strictEqual(say('מה השעה').ok, false);
  assert.strictEqual(say('בנץ').why, 'noreps');
  assert.strictEqual(say('לג פרס 10 חזרות').why, 'noweight');
  assert.strictEqual(say('בנץ 10 חזרות 5000 קילו').why, 'range');
  assert.strictEqual(say('משהו שלא קיים בכלל 10 חזרות 20 קילו').ok, false);
});
test('commands', () => {
  assert.strictEqual(say('בטל').cmd, 'undo'); assert.strictEqual(say('תמחקי את הסט האחרון').cmd, 'undo'); assert.strictEqual(say('undo').cmd, 'undo'); assert.strictEqual(say('cancel that').cmd, 'undo');
  assert.strictEqual(say('מה עשיתי היום').cmd, 'today'); assert.strictEqual(say('what did I do today').cmd, 'today');
});
test('progress in the answer', () => {
  const hist = { 'bench-press': { sessions: [{ d: '2026-11-04', sets: [{ r: 10, w: 57.5, t: true }, { r: 9, w: 57.5, t: true }] }] } };
  assert.match(say('בנץ 10 חזרות 60 קילו', { logs: hist }).say, /שיא חדש! 2\.5 קילו/);
  assert.match(say('בנץ 11 חזרות 57.5 קילו', { logs: hist }).say, /שיא חזרות/);
  assert.match(say('בנץ 10 חזרות 57.5 קילו', { logs: hist }).say, /כמו בפעם הקודמת/);
  assert.match(say('בנץ 8 חזרות 50 קילו', { logs: hist }).say, /קצת פחות/);
  assert.match(say('בנץ 10 חזרות 60 קילו').say, /פעם ראשונה/);
  assert.match(say('bench press 10 reps 60 kilos', { logs: hist }).say, /^Logged: .*set 1, 10 reps, 60 kilos\. New record! 2\.5 kilos/);
  const he = say('בנץ 10 חזרות 60 קילו', { logs: hist }).say; assert.match(he, /^נרשם: לחיצת חזה במוט, סט 1, 10 חזרות, 60 קילו\./);
});
test('applyItem writes what the app writes', () => {
  const log = { sessions: [{ d: '2026-11-04', sets: [{ r: 10, w: 50, t: true }] }] };
  let r = VL.applyItem(log, { ex: 'bench-press', d: D, sets: [{ r: 10, w: 60 }], idx: 0 }); assert.strictEqual(r.setNo, 1); assert.strictEqual(r.fresh, true);
  r = VL.applyItem(log, { ex: 'bench-press', d: D, sets: [{ r: 9, w: 60 }], idx: 0 }); assert.strictEqual(r.setNo, 2);
  r = VL.applyItem(log, { ex: 'bench-press', d: D, sets: [{ r: 11, w: 60 }], idx: 1 }); assert.strictEqual(r.replaced, true);
  assert.deepStrictEqual(log.sessions[1], { d: D, sets: [{ r: 11, w: 60, t: true }, { r: 9, w: 60, t: true }] });
  // sets the app planned for today but nobody ticked are filled in order, then new ones are added
  const pre = { sessions: [{ d: D, sets: [{ r: 5, w: 20, t: true, k: 'w' }, { r: 10, w: 50, t: false }, { r: 10, w: 50, t: false }] }] };
  r = VL.applyItem(pre, { ex: 'x', d: D, sets: [{ r: 8, w: 55 }], idx: 0 }); assert.strictEqual(r.setNo, 1); assert.strictEqual(r.replaced, false);
  r = VL.applyItem(pre, { ex: 'x', d: D, sets: [{ r: 8, w: 55 }, { r: 8, w: 55 }], idx: 0 }); assert.strictEqual(r.setNo, 3);
  assert.deepStrictEqual(pre.sessions[0].sets, [{ r: 5, w: 20, t: true, k: 'w' }, { r: 8, w: 55, t: true }, { r: 8, w: 55, t: true }, { r: 8, w: 55, t: true }]);
});
test('pending inbox items count as history for the next sentence', () => {
  const inbox = { items: [{ id: 'a', ex: 'bench-press', d: D, sets: [{ r: 10, w: 60 }], idx: 0 }, { id: 'b', ex: 'bench-press', d: D, sets: [{ r: 9, w: 60 }], idx: 0 }] };
  const logs = VL.withPending({}, VL.pending(inbox, { ids: { a: 1 } }));
  assert.strictEqual(logs['bench-press'].sessions[0].sets.length, 1);
  const all = VL.withPending({}, VL.pending(inbox, null)); const r = say('בנץ 8 חזרות', { logs: all }); assert.strictEqual(r.setNo, 3);
  assert.match(VL.todayLine('he', all, IX, D), /לחיצת חזה במוט 2 סטים/);
});
test('the server side: sentences wait in the inbox, the journal itself is never written', () => {
  const docs = { 'log-bench-press': { sessions: [{ d: '2026-11-04', sets: [{ r: 10, w: 57.5, t: true }] }] }, week: { days: { 3: { label: 'chest', ex: [{ id: 'db-bench-press', sets: 3, reps: 10 }] } } } };      // 2026-11-11 is a Wednesday
  const copy = o => JSON.parse(JSON.stringify(o));
  const io = { catalog: { ex: ex.concat(extra), popular: Object.keys(POP) }, get: k => docs[k] ? copy(docs[k]) : null, put: (k, d) => { docs[k] = copy(d); },
    logs: () => { const o = {}; Object.keys(docs).forEach(k => { if (k.startsWith('log-')) o[k.slice(4)] = copy(docs[k]); }); return o; } };
  let now = Date.parse('2026-11-11T08:00:00Z'); const ask = (text, extraIn) => VL.serve(Object.assign({ text, now: now += 90000, today: D }, extraIn || {}), io);
  let r = ask('לחיצת חזה במוט 10 חזרות 60 קילו'); assert.ok(r.ok, r.say); assert.match(r.say, /שיא חדש! 2\.5 קילו/); assert.strictEqual(docs.vinbox.items.length, 1); assert.strictEqual(docs['log-bench-press'].sessions.length, 1);
  const first = docs.vinbox.items[0]; assert.strictEqual(first.ex, 'bench-press'); assert.strictEqual(first.d, D); assert.strictEqual(first.src, 'siri'); assert.deepStrictEqual(first.sets, [{ r: 10, w: 60 }]);
  r = ask('עוד סט'); assert.ok(r.ok, r.say); assert.match(r.say, /סט 2/); assert.match(r.say, /כמו הסט הקודם/);
  r = ask('בנץ 8 חזרות 22 קילו'); assert.strictEqual(r.item.ex, 'db-bench-press'); assert.match(r.say, /פעם ראשונה/);                 // today's plan decides which bench press
  r = ask('מה עשיתי היום'); assert.match(r.say, /היום נרשמו 2 תרגילים/);
  r = ask('בטל'); assert.ok(r.ok); assert.strictEqual(docs.vinbox.items.length, 2);
  docs.vdone = { ids: { [first.id]: 1, [docs.vinbox.items[1].id]: 1 } };                                                                // the app took both into the journal
  docs['log-bench-press'].sessions.push({ d: D, sets: [{ r: 10, w: 60, t: true }, { r: 10, w: 60, t: true }] });
  r = ask('בטל'); assert.strictEqual(r.ok, false); assert.match(r.say, /כבר נכנס ליומן/); assert.strictEqual(docs.vinbox.items.length, 2);
  r = ask('בנץ במוט 9 חזרות 60 קילו'); assert.match(r.say, /סט 3/);                                                                   // sets already in the journal are counted once
  assert.strictEqual(ask('squat 5 reps 100 kilos', { date: '2026-11-12' }).item.d, '2026-11-12');                                       // the phone's own date, when it is close
  assert.strictEqual(ask('squat 5 reps 100 kilos', { date: '2026-12-25' }).item.d, D);
  assert.strictEqual(ask('').ok, false); assert.strictEqual(ask('x'.repeat(5000)).ok, false);
  const burst = { catalog: io.catalog, get: k => k === 'vinbox' ? { items: Array.from({ length: 20 }, (_, i) => ({ id: 'b' + i, at: now, ex: 'squat', d: D, sets: [{ r: 5, w: 100 }] })) } : null, logs: () => ({}), put: () => { throw new Error('must not write'); } };
  assert.strictEqual(VL.serve({ text: 'squat 5 reps 100 kilos', now: now + 1000, today: D }, burst).why, 'busy');
});
