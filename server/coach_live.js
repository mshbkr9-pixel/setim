/* A short try-out of the coach against the real Claude API. EVERY RUN COSTS MONEY (a few cents): run it only when the owner
   has agreed. It sends the very requests the server hook sends (built by parts/coach.js, plain HTTP like the hook), one for each
   tier, and prints what came back: status, model, stop reason, tokens, the cost by the price list, and the answer as the app would
   read it. Use it once before the hook is installed, and again after changing a model, the system prompt or the answer schema.

   Run from the project folder, with the key in the environment (never as an argument, never printed):
       ANTHROPIC_API_KEY=... node server/coach_live.js            the small model, then the large one (two requests)
       ANTHROPIC_API_KEY=... node server/coach_live.js photo.jpg  the same, plus a photo of a plate (three requests)
   Exit code 0 only when every answer came back in the expected shape. */
const fs = require('fs');
const path = require('path');
global.VoiceLog = require('../parts/voice.js');
global.FoodKit = require('../parts/food.js');
global.MenuKit = require('../parts/menu.js');
const CK = require('../parts/coach.js');

const KEY = (process.env.ANTHROPIC_API_KEY || '').trim();
if (!KEY) { console.error('ANTHROPIC_API_KEY is not set in the environment.'); process.exit(2); }
const root = path.join(__dirname, '..');
const core = JSON.parse(fs.readFileSync(path.join(root, 'data', 'food-core.json'), 'utf8'));
const cfg = CK.config(JSON.parse(fs.readFileSync(path.join(__dirname, 'pb_hooks', 'coach.json'), 'utf8')));
const catalog = CK.catalog(core.recipes);
const today = new Date().toISOString().slice(0, 10), tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const snap = { today, weekday: 'חמישי', time: '13:10', me: { name: 'בדיקה', sex: 'male', age: 30, height_cm: 178, weight_kg: 82, training_focus: 'בניית שריר', workouts_per_week_target: 4 }, goals: [],
  nutrition: { goal: 'lose', target: { kcal: 2300, p: 165, c: 245, f: 75, training_day: true }, eaten_today: { kcal: 620, p: 38, c: 60, f: 24 }, left_today: { kcal: 1680, p: 127 },
    meals_today: [{ slot: 'b', items: 'ביצה 100g, לחם מלא 60g, קוטג\' 125g', kcal: 620, p: 38 }], last_7_days: { days_logged: 5, avg_kcal: 2250, avg_protein: 150, days_within_target: 4, days_protein_target_met: 3 } },
  PREFS: { kosher: true, diet: 'any', allergies: ['peanut'], dislikes: ['חציל'], weekly_food_budget_ils: 350, meals_per_day: 4 }, memory: ['מתאמן רק בבקרים'],
  pantry: ['חזה עוף 1 ק״ג', 'אורז 500 ג׳', 'ביצה 12 יח׳', 'עגבניה', 'מלפפון', 'שמן זית'], shopping_list: [], menu: { today: [], tomorrow: [] },
  training: { today: { label: 'חזה וכתפיים', rest: false, planned: ['לחיצת חזה במוט', 'לחיצת כתפיים'], done: [{ name: 'לחיצת חזה במוט', sets: '3×8 60 ק״ג' }], left: ['לחיצת כתפיים'] }, this_week: { workouts: 2, sets: 21 }, streak_weeks: 3, recent_sessions: [],
    progress_since_start: [{ exercise: 'לחיצת חזה במוט', first_kg: 50, first_date: '2026-09-01', now_kg: 60, sessions: 14, change_pct: 18 }] }, weigh_ins: [{ d: '2026-11-05', kg: 82.6 }, { d: today, kg: 82 }] };

const ASKS = [
  { name: 'the small model: a short question', o: { text: 'מה כדאי לי לאכול אחרי האימון?' }, want: 'cheap', expect: A => A.say.length > 20 },
  { name: 'the large model: a menu for tomorrow, from the recipe list', o: { text: 'תבנה לי תפריט למחר (' + tomorrow + ') לפי היעדים שלי, ממה שיש לי בבית, בתקציב נמוך. תסביר בקצרה למה בחרת כך.' }, want: 'smart',
    expect: A => A.acts.some(a => a.t === 'plan' && a.days.length >= 1 && a.days[0].meals.some(m => core.recipes.some(r => r.id === m.recipe))) },
];
if (process.argv[2]) {
  const file = process.argv[2], ext = path.extname(file).toLowerCase(), type = ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg');
  ASKS.push({ name: 'the large model: a photo of a plate', o: { text: '', img: { type, data: fs.readFileSync(file).toString('base64') } }, want: 'smart', expect: A => A.say.length > 10 });
}

(async () => {
  let bad = 0, total = 0;
  for (const ask of ASKS) {
    const rq = CK.request(Object.assign({ snap, catalog, hist: [] }, ask.o), cfg);
    const headers = { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2026-10-21' };
    if (rq.betas.length) headers['anthropic-beta'] = rq.betas.join(',');
    const t0 = Date.now();
    let res, j;
    try { res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(rq.body) }); j = await res.json(); }
    catch (e) { console.log('\n== ' + ask.name + '\n   network error: ' + e.message); bad++; continue; }
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    console.log('\n== ' + ask.name + '   [tier ' + rq.tier + ', score ' + rq.score + ', ' + rq.model + ', effort ' + rq.body.output_config.effort + ']');
    if (res.status !== 200) { console.log('   HTTP ' + res.status + ': ' + JSON.stringify(j && j.error)); bad++; continue; }
    const A = CK.reply(j), cost = A.usage ? CK.cost(A.usage, rq.model, cfg.prices) : 0; total += cost;
    console.log('   ' + secs + ' s · answered by ' + j.model + ' · stop ' + j.stop_reason + ' · tokens in ' + (A.usage.tin + A.usage.tcw + A.usage.tcr) + ' (cache write ' + A.usage.tcw + ', cache read ' + A.usage.tcr + ') out ' + A.usage.tout + ' · $' + (cost / 1e6).toFixed(4));
    if (!A.ok) { console.log('   the answer could not be read: ' + A.why); bad++; continue; }
    console.log('   say: ' + A.say.replace(/\s+/g, ' ').slice(0, 400));
    A.acts.forEach(a => console.log('   act: ' + JSON.stringify(a).slice(0, 500)));
    const ok = rq.tier === ask.want && ask.expect(A);
    console.log(ok ? '   OK' : '   NOT AS EXPECTED (tier wanted ' + ask.want + ')'); if (!ok) bad++;
  }
  console.log('\n' + (bad ? bad + ' of ' + ASKS.length + ' not as expected' : 'all ' + ASKS.length + ' as expected') + ' · total cost $' + (total / 1e6).toFixed(4));
  process.exit(bad ? 1 : 0);
})();
