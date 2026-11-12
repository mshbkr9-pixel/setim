/* node --test tests/coach.test.js     (from the project folder)
   CoachKit: which sentences the app answers by itself, which go to the small model and which to the large one; the exact request
   that leaves for the Claude API; and the checks on what comes back. The server side (server/pb_hooks/setim_coach_lib.js) is run
   here too, against a stand-in for the API, so its limits and its bookkeeping are tested without spending anything. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
global.VoiceLog = require('../parts/voice.js');
global.FoodKit = require('../parts/food.js');
global.MenuKit = require('../parts/menu.js');
const CK = require('../parts/coach.js');

const root = path.join(__dirname, '..');
FoodKit.init(JSON.parse(fs.readFileSync(path.join(root, 'data', 'food-core.json'), 'utf8')));
const names = JSON.parse(fs.readFileSync(path.join(root, 'server', 'pb_hooks', 'exnames.json'), 'utf8'));
const IX = VoiceLog.buildIndex(names.ex), POP = {}; names.popular.forEach(id => { POP[id] = 1; });
const TODAY = '2026-11-12';
const T = FoodKit.targets({ sex: 'm', age: 30, height: 178, weight: 82, weekly: 4 }, { goal: 'lose' });
const env = (over = {}) => Object.assign({ FK: FoodKit, MK: MenuKit, hour: 13, today: TODAY,
  voice: t => VoiceLog.handle(t, { index: IX, logs: {}, plan: [], stars: {}, popular: POP, last: null, date: TODAY, now: Date.parse(TODAY + 'T10:00:00Z') }),
  T, tot: { k: 900, p: 60, c: 90, f: 30 }, mealsOn: () => [{ s: 'b', it: [{ n: 'ביצה', e: [154, 12.5, 1, 10.6] }] }],
  pantry: { items: [{ k: 'אורז', n: 'אורז', q: 500, u: 'g' }] }, shop: { items: [{ n: 'חלב' }] }, prefs: {}, lastWeigh: { d: '2026-11-05', kg: 83 },
  train: { label: 'חזה', planned: ['לחיצת חזה במוט'], done: [], left: ['לחיצת חזה במוט'], rest: false }, stock: MenuKit.stock({ items: [] }), used: {} }, over);
const local = (text, over) => CK.local(text, env(over));
const tierOf = (text, o) => CK.tier(CK.score(text, o || {}).score);

test('remembering needs no model: allergies, dislikes, diet, budget, free facts', () => {
  let L = local('אני אלרגי לבוטנים'); assert.deepStrictEqual(L.acts.map(a => a.t), ['prefs', 'remember']); assert.deepStrictEqual(L.acts[0].al, ['peanut']); assert.ok(L.acts.every(a => a.auto));
  L = local('תזכור שאני לא אוהב חציל'); assert.deepStrictEqual(L.acts[0].no, ['חציל']); assert.ok(/חציל/.test(L.say));
  assert.strictEqual(local('אני טבעונית').acts[0].veg, 2); assert.strictEqual(local('אני צמחוני').acts[0].veg, 1); assert.strictEqual(local('אני שומר כשרות').acts[0].kosher, true);
  assert.strictEqual(local('התקציב שלי 400 שקל לשבוע').acts[0].budget, 400);
  L = local('תזכור שאני מתאמן רק בבקרים'); assert.deepStrictEqual(L.acts, [{ t: 'remember', text: 'אני מתאמן רק בבקרים', auto: true }]);
});
test('logging needs no model: a weigh-in, a set, a meal, the pantry, the shopping list', () => {
  let L = local('שקלתי 82.4'); assert.deepStrictEqual(L.acts, [{ t: 'weigh', kg: 82.4, date: '', auto: true }]); assert.ok(/ירידה של 0.6/.test(L.say));
  L = local('בנץ 8 חזרות 60 קילו'); assert.strictEqual(L.kind, 'sets'); assert.strictEqual(L.acts[0].t, 'voice'); assert.ok(L.acts[0].auto);
  L = local('אכלתי שתי ביצים ושלוש פרוסות לחם'); assert.strictEqual(L.acts[0].t, 'meal'); assert.ok(!L.acts[0].auto, 'a meal waits for a tap'); assert.strictEqual(L.acts[0].items.length, 2);
  L = local('יש לי קילו חזה עוף ושש ביצים'); assert.strictEqual(L.acts[0].t, 'pantry'); assert.strictEqual(L.acts[0].op, 'add'); assert.ok(!L.acts[0].auto);
  L = local('נגמר לי הקוטג׳'); assert.strictEqual(L.acts[0].op, 'remove');
  L = local('תוסיף ביצים וקוטג׳ לרשימת הקניות'); assert.strictEqual(L.acts[0].t, 'shop'); assert.deepStrictEqual(L.acts[0].items.map(x => x.k), ['ביצה', "קוטג'"]);
});
test('questions the data answers need no model', () => {
  assert.ok(/נשארו להיום 105 ג׳ חלבון/.test(local('כמה חלבון חסר לי היום?').say));
  assert.ok(/900 קק״ל/.test(local('כמה קלוריות אכלתי היום').say));
  assert.ok(/ארוחת בוקר: ביצה/.test(local('מה אכלתי היום?').say));
  assert.ok(/לחיצת חזה במוט/.test(local('מה האימון של היום?').say));
  assert.ok(/אורז \(500 ג׳\)/.test(local('מה יש לי במקרר?').say));
  assert.ok(/חלב/.test(local('מה צריך לקנות?').say));
  assert.ok(/83 ק״ג/.test(local('כמה אני שוקל?').say));
  assert.ok(new RegExp(String(T.kcal)).test(local('מה היעד שלי?').say));
  const L = local('מה אפשר להכין לארוחת ערב?'); assert.ok(L.links.length >= 2 && L.links.every(l => /^recipe-/.test(l.to)));
  assert.ok(local('תודה') && local('היי') && local('מה אתה יודע לעשות'));
  assert.ok(/אין יעד/.test(local('כמה חלבון חסר לי היום?', { T: { ok: false } }).say));
});
test('what the app cannot answer by itself is left for a model', () => {
  ['מה כדאי לי לאכול אחרי האימון?', 'למה אני לא מתקדם במשקלים?', 'תבנה לי תפריט לשבוע', 'אכלתי קרפצ׳יו במסעדה', 'אימון חזה', 'איך עושים סקוואט נכון?', 'כמה חלבון יש בחזה עוף?']
    .forEach(t => assert.strictEqual(local(t), null, t));
});
test('the complexity score chooses the model', () => {
  assert.strictEqual(tierOf('מה כדאי לי לאכול אחרי האימון?'), 'cheap');
  assert.strictEqual(tierOf('כמה חלבון יש בחזה עוף?'), 'cheap');
  assert.strictEqual(tierOf('בקצרה, כמה מים לשתות ביום?'), 'cheap');
  assert.strictEqual(tierOf('תבנה לי תפריט לשבוע עם הרבה חלבון שלא יעלה יותר מ-350 שקלים'), 'smart');
  assert.strictEqual(tierOf('למה אני לא מתקדם במשקלים?'), 'smart');
  assert.strictEqual(tierOf('יש לי סוכרת, מה מותר לי לאכול?'), 'smart');
  assert.strictEqual(tierOf('תסביר לי לעומק איך לבנות שריר'), 'smart');
  assert.strictEqual(tierOf('', { img: true }), 'smart');
  assert.strictEqual(tierOf('יש לי עוף, אורז, ביצים וירקות בבית. תבנה לי ארוחות לשלושת הימים הקרובים לפי התפריט שלי, ותמצא לי איפה לקנות את מה שחסר הכי בזול.'), 'deep');
  assert.ok(!CK.score('למה אני לא מתקדם במשקלים?').why.some(w => /budget/.test(w)), '"משקלים" is not money');
});
test('one knob moves the choice: the person\'s preference, and the cuts in the configuration', () => {
  const plan = 'תבנה לי תפריט לשבוע';
  assert.strictEqual(tierOf(plan), 'smart'); assert.strictEqual(tierOf(plan, { pref: 'eco' }), 'cheap');
  assert.strictEqual(tierOf('מה כדאי לאכול לפני אימון ואיך זה משתלב עם התפריט?', { pref: 'deep' }), 'cheap');
  const sc = CK.score(plan).score; assert.strictEqual(CK.tier(sc, { smart: 50, deep: 90 }), 'cheap'); assert.strictEqual(CK.tier(sc, { smart: 10, deep: 30 }), 'deep');
  assert.strictEqual(CK.config({ score: { smart: 20 } }).score.smart, 20); assert.strictEqual(CK.config({ score: { smart: 20 } }).score.deep, 70); assert.strictEqual(CK.config({ nonsense: 1 }).nonsense, undefined);
});
test('the request: the small model for a short question, as the API expects it', () => {
  const rq = CK.request({ text: 'מה כדאי לי לאכול אחרי האימון?', hist: [{ r: 'u', t: 'היי' }, { r: 'a', t: 'היי.' }], snap: { today: TODAY }, catalog: 'a | b' });
  const b = rq.body;
  assert.strictEqual(rq.tier, 'cheap'); assert.strictEqual(b.model, 'claude-haiku-5-5'); assert.strictEqual(b.output_config.effort, 'low');
  assert.strictEqual(b.fallbacks, undefined, 'the small model has no server-side fallback'); assert.deepStrictEqual(rq.betas, []);
  assert.deepStrictEqual(b.system[0].cache_control, { type: 'ephemeral' }); assert.ok(b.system[0].text.includes('a | b'));
  assert.strictEqual(b.output_config.format.type, 'json_schema'); assert.deepStrictEqual(b.output_config.format.schema.required, ['say', 'acts']);
  assert.deepStrictEqual(b.messages.map(m => m.role), ['user', 'assistant', 'user']);
  assert.ok(b.messages[2].content[0].text.startsWith('DATA\n')); assert.strictEqual(b.messages[2].content[b.messages[2].content.length - 1].text, 'מה כדאי לי לאכול אחרי האימון?');
  ['temperature', 'top_p', 'top_k', 'thinking', 'tool_choice'].forEach(k => assert.strictEqual(b[k], undefined, k + ' must not be sent'));
  assert.ok(b.max_tokens >= 2000, 'thinking counts toward max_tokens');
});
test('the request: the large model for a plan, with the fallback opt-in, and a photo as an image block', () => {
  const rq = CK.request({ text: 'תבנה לי תפריט לשבוע בתקציב של 350 שקל ותסביר למה', snap: {}, catalog: '' });
  assert.strictEqual(rq.body.model, 'claude-opus-5-5'); assert.strictEqual(rq.body.fallbacks, 'default'); assert.deepStrictEqual(rq.betas, ['server-side-fallback-2026-07-01']);
  const ph = CK.request({ text: '', img: { type: 'image/jpeg', data: 'AAAA' }, snap: {} });
  assert.strictEqual(ph.body.model, 'claude-opus-5-5'); assert.deepStrictEqual(ph.body.messages[0].content[1], { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' } });
  assert.strictEqual(CK.request({ text: 'x', force: 'cheap', img: { type: 'image/png', data: 'A' } }).body.model, 'claude-haiku-5-5');
});
test('the schema of the answer is one the API accepts: every object closed, every field required, no limits on numbers or strings', () => {
  const walk = (s, where) => { if (!s || typeof s !== 'object') return;
    if (s.type === 'object') { assert.strictEqual(s.additionalProperties, false, where); assert.deepStrictEqual(s.required.slice().sort(), Object.keys(s.properties).sort(), where); Object.keys(s.properties).forEach(k => walk(s.properties[k], where + '.' + k)); }
    if (s.type === 'array') walk(s.items, where + '[]');
    (s.anyOf || []).forEach((x, i) => walk(x, where + '|' + i));
    ['minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems', 'pattern', 'multipleOf'].forEach(k => assert.strictEqual(s[k], undefined, where + ' has ' + k)); };
  walk(CK.SCHEMA, 'answer');
  assert.strictEqual(CK.SCHEMA.properties.acts.items.anyOf.length, 10);
});
test('the answer is read by block type, checked, and trimmed to what the app knows', () => {
  const good = { say: 'הכנתי לרישום', acts: [{ t: 'meal', slot: 'l', date: '', title: '', items: [{ name: 'המבורגר', grams: 180, kcal: 450, p: 25, c: 30, f: 25, est: true }] }, { t: 'bogus' }, { t: 'weigh', kg: 5000, date: 'x' }, { t: 'go', to: 'nowhere' }, { t: 'targets', kcal: 300, p: 1, c: 1, f: 1, why: '' }] };
  const A = CK.reply({ content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(good) }], stop_reason: 'end_turn', usage: { input_tokens: 1200, cache_read_input_tokens: 2000, output_tokens: 150 }, model: 'claude-haiku-5-5' });
  assert.strictEqual(A.ok, true); assert.strictEqual(A.acts.length, 2, 'unknown and unsafe actions are dropped'); assert.strictEqual(A.acts[1].kg, 400);
  assert.deepStrictEqual(A.usage, { tin: 1200, tcw: 0, tcr: 2000, tout: 150 });
  assert.strictEqual(CK.reply({ content: [], stop_reason: 'refusal', usage: {} }).why, 'refusal');
  assert.strictEqual(CK.reply({ content: [{ type: 'text', text: '{"say":"חתוך' }], stop_reason: 'max_tokens', usage: {} }).why, 'long');
  assert.strictEqual(CK.reply({ content: [{ type: 'text', text: 'תשובה בלי מבנה' }], stop_reason: 'end_turn', usage: {} }).say, 'תשובה בלי מבנה');
  assert.strictEqual(CK.reply({ content: [{ type: 'text', text: '```json\n{"say":"בתוך גדר","acts":[]}\n```' }], stop_reason: 'end_turn', usage: {} }).say, 'בתוך גדר');
  assert.strictEqual(CK.reply(null).ok, false);
});
test('the cost of an answer, from its tokens', () => {
  assert.strictEqual(CK.cost({ tin: 1000000, tcw: 0, tcr: 0, tout: 0 }, 'claude-haiku-5-5'), 100000);       // 0.10 dollars for a million input tokens
  assert.strictEqual(CK.cost({ tin: 0, tcw: 0, tcr: 0, tout: 1000000 }, 'claude-opus-5-5'), 20000000);
  assert.ok(CK.cost({ tin: 0, tcw: 0, tcr: 1000000, tout: 0 }, 'claude-opus-5-5') < CK.cost({ tin: 1000000, tcw: 0, tcr: 0, tout: 0 }, 'claude-opus-5-5') / 10);
});

/* ---------- the server side, against a stand-in for the API ---------- */
const lib = require('../server/pb_hooks/setim_coach_lib.js');
function server(over = {}) {
  const USAGE = {}, sent = [], HOOKS = path.join(root, 'server', 'pb_hooks'); let n = 0;
  class Rec { constructor(c, o) { this.o = o || {}; } get(f) { return this.o[f]; } getString(f) { return this.o[f] == null ? '' : String(this.o[f]); } set(f, v) { this.o[f] = v; } }
  const G = { hooks: HOOKS, Record: Rec, text: b => Buffer.from(b).toString('utf8'), sleep: () => {},
    os: { readFile: p => (/coach\.json$/.test(p) && over.cfg) ? Buffer.from(JSON.stringify(over.cfg)) : fs.readFileSync(p), getenv: k => k === 'ANTHROPIC_API_KEY' ? (over.key === undefined ? 'k' : over.key) : '' },
    http: { send: o => { sent.push({ url: o.url, headers: o.headers, body: JSON.parse(o.body) }); const r = (over.answer || (() => ({ statusCode: 200, json: { model: 'm', content: [{ type: 'text', text: '{"say":"שלום","acts":[]}' }], stop_reason: 'end_turn', usage: { input_tokens: 1000, output_tokens: 100 } } })))(sent.length, JSON.parse(o.body)); if (r === 'throw') throw new Error('net'); return r; } },
    app: { findRecordsByFilter: (c, f, s, l, off, p) => Object.values(USAGE).filter(r => r.day === p.d).map(r => new Rec(c, r)), findCollectionByNameOrId: name => { if (over.noTable) throw new Error('no such collection'); return { name }; }, save: rec => { if (!rec.o.id) rec.o.id = 'u' + (++n); USAGE[rec.o.id] = rec.o; } } };
  if (over.noTable) G.app.findRecordsByFilter = () => { throw new Error('no such collection'); };
  const ask = (body, user) => { let out; lib.post({ auth: user === null ? null : { id: user || 'u1' }, requestInfo: () => ({ body }), json: (c, o) => { out = o; } }, G); return out; };
  const info = user => { let out; lib.info({ auth: user ? { id: user } : null, json: (c, o) => { out = o; } }, G); return out; };
  return { ask, info, sent, USAGE };
}
test('server: only a signed-in person is answered, and only when the key is there', () => {
  assert.strictEqual(server().ask({ text: 'שלום' }, null).why, 'auth');
  const off = server({ key: '' }); assert.strictEqual(off.ask({ text: 'שלום' }).why, 'off'); assert.strictEqual(off.sent.length, 0); assert.strictEqual(off.info('u1').on, false);
  assert.strictEqual(server({ noTable: true }).ask({ text: 'שלום' }).why, 'setup');
});
test('server: the request carries the key in a header, the API version, and the model the score chose', () => {
  const S1 = server(), A = S1.ask({ text: 'מה כדאי לי לאכול אחרי האימון?', snap: { today: TODAY } });
  assert.strictEqual(A.ok, true); assert.strictEqual(A.say, 'שלום'); assert.strictEqual(A.tier, 'cheap');
  const q = S1.sent[0]; assert.strictEqual(q.url, 'https://api.anthropic.com/v1/messages'); assert.strictEqual(q.headers['x-api-key'], 'k'); assert.strictEqual(q.headers['anthropic-version'], '2026-10-21');
  assert.strictEqual(q.headers['anthropic-beta'], undefined); assert.strictEqual(q.body.model, 'claude-haiku-5-5');
  assert.ok(q.body.system[0].text.includes('chicken-rice-salad'), 'the recipe list is part of the system prompt');
  const B = S1.ask({ text: 'תבנה לי תפריט לשבוע בתקציב של 350 שקל' }); assert.strictEqual(B.tier, 'smart'); assert.strictEqual(S1.sent[1].headers['anthropic-beta'], 'server-side-fallback-2026-07-01');
});
test('server: every answer is counted, per person and per day, with its cost', () => {
  const S1 = server(); S1.ask({ text: 'שאלה קצרה' }); S1.ask({ text: 'עוד שאלה קצרה' }); S1.ask({ text: 'תבנה לי תפריט לשבוע' }); S1.ask({ text: 'שאלה' }, 'u2');
  const rows = Object.values(S1.USAGE); assert.strictEqual(rows.length, 2);
  const mine = rows.find(r => r.user === 'u1'); assert.deepStrictEqual([mine.cheap, mine.smart, mine.tin, mine.tout], [2, 1, 3000, 300]); assert.ok(mine.cost > 0);
  assert.strictEqual(S1.info('u1').left.cheap, 58);
});
test('server: past the limits it steps down, then stops, and the daily budget closes the door for everyone', () => {
  const S1 = server({ cfg: { perUser: { cheap: 1, smart: 0, deep: 0, img: 0 } } });
  const A = S1.ask({ text: 'תבנה לי תפריט לשבוע' }); assert.strictEqual(A.tier, 'cheap'); assert.strictEqual(A.wanted, 'smart');
  assert.strictEqual(S1.ask({ text: 'ועוד שאלה' }).why, 'quota'); assert.strictEqual(S1.sent.length, 1);
  assert.strictEqual(S1.ask({ text: '', img: 'data:image/jpeg;base64,AAAA' }).why, 'imgquota');
  const S2 = server({ cfg: { dailyUsd: 0.000001 } }); S2.ask({ text: 'שאלה' }); assert.strictEqual(S2.ask({ text: 'שאלה' }, 'u2').why, 'budget'); assert.strictEqual(S2.sent.length, 1);
});
test('server: bad input never reaches the model', () => {
  const S1 = server();
  assert.strictEqual(S1.ask({ text: '   ' }).why, 'bad'); assert.strictEqual(S1.ask({ text: 'x'.repeat(5000) }).why, 'big');
  assert.strictEqual(S1.ask({ text: 'x', img: 'data:text/html;base64,AAAA' }).why, 'big'); assert.strictEqual(S1.ask({ text: 'x', snap: { a: 'y'.repeat(50000) } }).why, 'big');
  assert.strictEqual(S1.sent.length, 0);
});
test('server: a busy model is tried twice, a refused answer shape once more without it, a bad key is said, a refusal is said', () => {
  const busy = server({ answer: () => ({ statusCode: 529, json: { error: { type: 'overloaded_error', message: 'x' } } }) }); assert.strictEqual(busy.ask({ text: 'שאלה' }).why, 'busy'); assert.strictEqual(busy.sent.length, 2);
  const shape = server({ answer: (i, b) => (b.output_config.format ? { statusCode: 400, json: { error: { type: 'invalid_request_error', message: 'schema' } } } : { statusCode: 200, json: { content: [{ type: 'text', text: '{"say":"בלי סכמה","acts":[]}' }], stop_reason: 'end_turn', usage: {} } }) });
  assert.strictEqual(shape.ask({ text: 'שאלה' }).say, 'בלי סכמה'); assert.strictEqual(shape.sent.length, 2); assert.ok(/JSON/.test(JSON.stringify(shape.sent[1].body.messages)));
  assert.strictEqual(server({ answer: () => ({ statusCode: 401, json: {} }) }).ask({ text: 'שאלה' }).why, 'key');
  assert.strictEqual(server({ answer: () => 'throw' }).ask({ text: 'שאלה' }).why, 'net');
  const ref = server({ answer: () => ({ statusCode: 200, json: { content: [], stop_reason: 'refusal', usage: { input_tokens: 500, output_tokens: 0 } } }) }); const R = ref.ask({ text: 'שאלה' });
  assert.strictEqual(R.why, 'refusal'); assert.strictEqual(Object.values(ref.USAGE)[0].cheap, 1, 'a declined answer is still counted');
});
