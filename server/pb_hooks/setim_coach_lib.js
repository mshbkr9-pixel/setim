/* The coach's server side, between PocketBase and the Claude API. Plain ES5, CommonJS: loaded with require() from the hook.
   G is what the handler passes in: {app, os, http, hooks, text, Record, sleep}.
   The call to the model is plain HTTP (POST /v1/messages): PocketBase runs hooks in its own small JavaScript engine, which cannot
   load the Anthropic SDK, so the request is built in coach.js (CoachKit.request) and sent with $http.send.
   Answers are always HTTP 200 with {ok, ...}; `why` says what went wrong in one word, and `say` is a sentence for the person. */
var CATALOG = null;

function readJson(G, name) {
  try { var raw = G.os.readFile(G.hooks + '/' + name); return JSON.parse(typeof raw === 'string' ? raw : G.text(raw)); } catch (e) { return null; }
}
function catalog(G) { if (CATALOG === null) { var c = readJson(G, 'coach_catalog.json'); CATALOG = (c && typeof c.catalog === 'string') ? c.catalog : ''; } return CATALOG; }
function apiKey(G) { var k = ''; try { k = String(G.os.getenv('ANTHROPIC_API_KEY') || ''); } catch (e) { k = ''; } return k.replace(/^\s+|\s+$/g, ''); }
function today() { return new Date().toISOString().slice(0, 10); }
function userOf(e) { try { var a = e.auth; if (a && a.id && !(a.isSuperuser && a.isSuperuser())) return String(a.id); } catch (err) { } return ''; }
function n(rec, f) { var v = 0; try { v = +rec.get(f) || 0; } catch (e) { v = 0; } return v; }

/* today's bookkeeping: the person's own row, and what everyone together has cost so far */
function usage(G, userId, day) {
  var mine = null, all = 0, i;
  var rows = G.app.findRecordsByFilter('coach_usage', 'day = {:d}', '', 5000, 0, { d: day });
  for (i = 0; i < rows.length; i++) { all += n(rows[i], 'cost'); if (rows[i].getString('user') === userId) mine = rows[i]; }
  return { rec: mine, all: all };
}
function leftOf(cfg, rec) {
  var o = {}, k = ['cheap', 'smart', 'deep', 'img'];
  for (var i = 0; i < k.length; i++) o[k[i]] = Math.max(0, cfg.perUser[k[i]] - (rec ? n(rec, k[i]) : 0));
  return o;
}
var SAY = {
  he: { auth: 'כדי לדבר עם המאמן צריך להתחבר לחשבון.', off: 'המאמן המלא עוד לא הופעל בשרת. מה שאפשר לענות בלי מודל ממשיך לעבוד.', setup: 'המאמן המלא עוד לא הוגדר בשרת.',
    quota: 'הגענו למכסת התשובות של היום. מחר היא מתחדשת, ומה שאפשר לענות בלי מודל ממשיך לעבוד.', imgquota: 'הגענו למכסת התמונות של היום. אפשר לכתוב מה היה בצלחת.',
    budget: 'המאמן המלא נח עד מחר. מה שאפשר לענות בלי מודל ממשיך לעבוד.', busy: 'המודל עמוס כרגע. מנסים שוב בעוד רגע.', net: 'לא הצלחתי להגיע למודל. מנסים שוב בעוד רגע.',
    key: 'יש בעיה בחיבור של השרת למודל. בעל האפליקציה צריך לבדוק את המפתח.', bad: 'משהו השתבש בבקשה למודל. מנסים לנסח אחרת.', refusal: 'בזה אני לא יכול לעזור. אפשר לשאול אותי על אימונים, תזונה, המטבח והקניות.',
    long: 'התשובה יצאה ארוכה מדי. אפשר לבקש אותה בחלקים, למשל תפריט לשלושה ימים.', empty: 'לא קיבלתי תשובה מהמודל. מנסים שוב.', big: 'ההודעה ארוכה מדי.' },
  en: { auth: 'Sign in to talk to the coach.', off: 'The full coach is not switched on yet. What the app can answer by itself still works.', setup: 'The full coach is not set up on the server yet.',
    quota: 'Today\'s answers are used up. They renew tomorrow.', imgquota: 'Today\'s photos are used up. You can type what was on the plate.', budget: 'The full coach is resting until tomorrow.',
    busy: 'The model is busy right now. Try again in a moment.', net: 'Could not reach the model. Try again in a moment.', key: 'The server cannot reach the model. The owner should check the key.',
    bad: 'Something went wrong with the request. Try phrasing it differently.', refusal: 'I cannot help with that. Ask me about training, food, the kitchen and shopping.',
    long: 'The answer came out too long. Ask for it in parts, for example a menu for three days.', empty: 'No answer came back. Try again.', big: 'The message is too long.' }
};
function fail(e, lang, why, extra) { var o = { ok: false, why: why, say: (SAY[lang] || SAY.he)[why] || SAY.he.bad }; if (extra) for (var k in extra) o[k] = extra[k]; return e.json(200, o); }

function callModel(G, cfg, key, rq) {
  var headers = { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2026-10-21' };
  if (rq.betas && rq.betas.length) headers['anthropic-beta'] = rq.betas.join(',');
  var res = null, tries = 0, status = 0, j = null, body = rq.body;
  while (tries < 2) {
    tries++;
    try { res = G.http.send({ url: cfg.apiUrl || 'https://api.anthropic.com/v1/messages', method: 'POST', body: JSON.stringify(body), headers: headers, timeout: cfg.timeout }); }
    catch (err) { return { why: 'net' }; }
    status = res.statusCode; j = null;
    try { j = res.json; } catch (err2) { j = null; }
    if (!j && res.raw) { try { j = JSON.parse(typeof res.raw === 'string' ? res.raw : G.text(res.raw)); } catch (err3) { j = null; } }
    if (status === 200) return { j: j };
    if (status === 400 && body.output_config && body.output_config.format && tries < 2) {
      /* the answer's shape was not accepted: ask once more without it, with the shape described in words */
      console.log('setim coach: 400 with the answer schema, trying once without it: ' + ((j && j.error && j.error.message) || ''));
      body = JSON.parse(JSON.stringify(body)); delete body.output_config.format;
      var last = body.messages[body.messages.length - 1];
      last.content.push({ type: 'text', text: 'Reply with one JSON object and nothing else: {"say": "...", "acts": [...]}, with the actions exactly as the system prompt describes them.' });
      continue;
    }
    if ((status === 429 || status >= 500) && tries < 2) { try { G.sleep(1500); } catch (err4) { } continue; }
    break;
  }
  console.log('setim coach: the model answered ' + status + ' ' + ((j && j.error && (j.error.type + ': ' + j.error.message)) || ''));
  return { why: (status === 401 || status === 403) ? 'key' : ((status === 429 || status >= 500) ? 'busy' : 'bad') };
}

module.exports = {
  info: function (e, G) {
    var CK = require(G.hooks + '/coach.js'), cfg = CK.config(readJson(G, 'coach.json')), userId = userOf(e), on = !!(cfg.on && apiKey(G)), left = null;
    if (on && userId) { try { var u = usage(G, userId, today()); left = leftOf(cfg, u.rec); if (u.all >= cfg.dailyUsd * 1e6) left = { cheap: 0, smart: 0, deep: 0, img: 0 }; } catch (err) { on = false; } }
    return e.json(200, { ok: true, v: 1, on: on, left: left, score: cfg.score });
  },

  post: function (e, G) {
    var CK = require(G.hooks + '/coach.js'), cfg = CK.config(readJson(G, 'coach.json'));
    var b = {}; try { b = e.requestInfo().body || {}; } catch (err) { b = {}; }
    var text = String(b.text == null ? '' : b.text), lang = (b.lang === 'en' || (!/[א-ת]/.test(text) && /[a-z]/i.test(text))) ? 'en' : 'he';
    var userId = userOf(e);
    if (!userId) return fail(e, lang, 'auth');
    var key = apiKey(G);
    if (!cfg.on || !key) return fail(e, lang, 'off');
    if (text.length > cfg.maxText * 2) return fail(e, lang, 'big');

    var img = null;
    if (typeof b.img === 'string' && b.img) { var m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+\/=]+)$/.exec(b.img); if (!m || m[2].length > 2800000) return fail(e, lang, 'big'); img = { type: m[1], data: m[2] }; }
    if (!text.replace(/\s+/g, '') && !img) return fail(e, lang, 'bad');
    var snap = (b.snap && typeof b.snap === 'object') ? b.snap : {};
    if (JSON.stringify(snap).length > cfg.maxSnap) return fail(e, lang, 'big');
    var hist = []; if (b.hist && b.hist.length) { for (var i = 0; i < b.hist.length && i < 40; i++) { var h = b.hist[i]; if (h && (h.r === 'u' || h.r === 'a') && typeof h.t === 'string') hist.push({ r: h.r, t: h.t }); } }

    var day = today(), U;
    try { U = usage(G, userId, day); } catch (err) { console.log('setim coach: no coach_usage collection: ' + err); return fail(e, lang, 'setup'); }
    var left = leftOf(cfg, U.rec);
    if (U.all >= cfg.dailyUsd * 1e6) return fail(e, lang, 'budget', { left: { cheap: 0, smart: 0, deep: 0, img: 0 } });
    if (img && left.img <= 0) return fail(e, lang, 'imgquota', { left: left });

    var o = { text: text, hist: hist, snap: snap, img: img, pref: b.pref === 'eco' || b.pref === 'deep' ? b.pref : '', lastTier: String(b.lastTier || ''), catalog: catalog(G) };
    var rq = CK.request(o, cfg), want = rq.tier;
    /* out of the stronger answers for today: step down rather than refuse */
    if (rq.tier === 'deep' && left.deep <= 0) { o.force = 'smart'; rq = CK.request(o, cfg); }
    if (rq.tier === 'smart' && left.smart <= 0) { o.force = 'cheap'; rq = CK.request(o, cfg); }
    if (rq.tier === 'cheap' && left.cheap <= 0) return fail(e, lang, 'quota', { left: left });

    var R = callModel(G, cfg, key, rq);
    if (R.why) return fail(e, lang, R.why, { left: left });
    var A = CK.reply(R.j), cost = A.usage ? CK.cost(A.usage, rq.model, cfg.prices) : 0;

    /* the bookkeeping is written whatever the answer was: a declined or cut-off answer was still paid for */
    try {
      var rec = U.rec;
      if (!rec) { rec = new G.Record(G.app.findCollectionByNameOrId('coach_usage')); rec.set('user', userId); rec.set('day', day); }
      rec.set(rq.tier, n(rec, rq.tier) + 1); if (img) rec.set('img', n(rec, 'img') + 1);
      if (A.usage) { rec.set('tin', n(rec, 'tin') + A.usage.tin + A.usage.tcw + A.usage.tcr); rec.set('tout', n(rec, 'tout') + A.usage.tout); }
      rec.set('cost', n(rec, 'cost') + cost);
      G.app.save(rec); left = leftOf(cfg, rec);
    } catch (err) { console.log('setim coach: could not write the usage row: ' + err); }
    console.log('setim coach: ' + rq.tier + ' ' + rq.model + ' score ' + rq.score + ' in ' + (A.usage ? A.usage.tin + A.usage.tcw + A.usage.tcr : 0) + ' out ' + (A.usage ? A.usage.tout : 0) + ' cost ' + (cost / 1e6).toFixed(5));

    if (!A.ok) return fail(e, lang, A.why === 'refusal' ? 'refusal' : (A.why === 'long' ? 'long' : 'empty'), { left: left, tier: rq.tier });
    return e.json(200, { ok: true, say: A.say, acts: A.acts, tier: rq.tier, wanted: want, model: A.model || rq.model, score: rq.score, left: left });
  }
};
