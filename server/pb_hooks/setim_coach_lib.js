/* The coach's server side, between PocketBase and the Claude API. Plain ES5, CommonJS: loaded with require() from the hook.
   G is what the handler passes in: {app, os, http, hooks, text, Record, sleep, security}.
   The call to the model is plain HTTP (POST /v1/messages): PocketBase runs hooks in its own small JavaScript engine, which cannot
   load the Anthropic SDK, so the request is built in coach.js (CoachKit.request) and sent with $http.send.
   Answers are always HTTP 200 with {ok, ...}; `why` says what went wrong in one word, and `say` is a sentence for the person.

   Who may spend: only people the owner invited. An invitation is a link that carries a code; it works for one account and for a
   week, and the server keeps only its SHA-256. The first link, for the owner, is made with coach_owner.py; the owner makes the
   others from the app. How much: every person has a number of answers a day (perUser.total, which the owner changes from the
   app), and everyone together has a daily budget in dollars. */
var CATALOG = null;

function readJson(G, name) {
  try { var raw = G.os.readFile(G.hooks + '/' + name); return JSON.parse(typeof raw === 'string' ? raw : G.text(raw)); } catch (e) { return null; }
}
function catalog(G) { if (CATALOG === null) { var c = readJson(G, 'coach_catalog.json'); CATALOG = (c && typeof c.catalog === 'string') ? c.catalog : ''; } return CATALOG; }
function apiKey(G) { var k = ''; try { k = String(G.os.getenv('ANTHROPIC_API_KEY') || ''); } catch (e) { k = ''; } return k.replace(/^\s+|\s+$/g, ''); }
function today() { return new Date().toISOString().slice(0, 10); }
function userOf(e) { try { var a = e.auth; if (a && a.id && !(a.isSuperuser && a.isSuperuser())) return String(a.id); } catch (err) { } return ''; }
function n(rec, f) { var v = 0; try { v = +rec.get(f) || 0; } catch (e) { v = 0; } return v; }
function s(rec, f) { var v = ''; try { v = rec.getString(f) || ''; } catch (e) { v = ''; } return v; }
function bodyOf(e) { var b = {}; try { b = e.requestInfo().body || {}; } catch (err) { b = {}; } return b; }

/* 'owner', 'guest', '' for someone who was not invited, null when the table is not there (an install that was not finished) */
function roleOf(app, userId) {
  try { var rows = app.findRecordsByFilter('coach_access', 'user = {:u}', '', 1, 0, { u: userId }); return rows.length ? (s(rows[0], 'role') === 'owner' ? 'owner' : 'guest') : ''; }
  catch (e) { return null; }
}
/* the knobs: the defaults, then coach.json next to this file, then what the owner set from the app (kept in the database) */
function config(G) {
  var CK = require(G.hooks + '/coach.js'), cfg = CK.config(readJson(G, 'coach.json'));
  try {
    var rows = G.app.findRecordsByFilter('coach_config', 'key = {:k}', '', 1, 0, { k: 'limits' });
    if (rows.length) { var t = n(rows[0], 'total'), u = n(rows[0], 'usd'); if (t >= 1 && t <= 200) cfg.perUser.total = Math.round(t); if (u >= 0.5 && u <= 20) cfg.dailyUsd = u; }
  } catch (e) { }
  return cfg;
}

/* today's bookkeeping: the person's own row, and what everyone together has asked and cost so far */
function used(rec) { return rec ? n(rec, 'cheap') + n(rec, 'smart') + n(rec, 'deep') : 0; }
function usage(app, userId, day) {
  var mine = null, all = 0, count = 0, i;
  var rows = app.findRecordsByFilter('coach_usage', 'day = {:d}', '', 5000, 0, { d: day });
  for (i = 0; i < rows.length; i++) { all += n(rows[i], 'cost'); count += used(rows[i]); if (userId && s(rows[i], 'user') === userId) mine = rows[i]; }
  return { rec: mine, all: all, count: count, rows: rows };
}
function leftOf(cfg, rec) {
  var o = {}, k = ['cheap', 'smart', 'deep', 'img'];
  for (var i = 0; i < k.length; i++) o[k[i]] = Math.max(0, cfg.perUser[k[i]] - (rec ? n(rec, k[i]) : 0));
  o.total = Math.max(0, cfg.perUser.total - used(rec));
  return o;
}
function none() { return { cheap: 0, smart: 0, deep: 0, img: 0, total: 0 }; }
function pending(app) {
  var rows = app.findRecordsByFilter('coach_invites', "used = ''", '', 500, 0, {}), out = [], now = Date.now();
  for (var i = 0; i < rows.length; i++) if (n(rows[i], 'exp') > now) out.push(rows[i]);
  return out;
}

var SAY = {
  he: { auth: 'כדי לדבר עם המאמן צריך להתחבר לחשבון.', off: 'המאמן המלא עוד לא הופעל בשרת. מה שאפשר לענות בלי מודל ממשיך לעבוד.', setup: 'המאמן המלא עוד לא הוגדר בשרת.',
    invite: 'המאמן המלא פתוח כרגע למוזמנים בלבד. מי שקיבל קישור הזמנה פותח אותו, והמאמן נפתח. מה שאפשר לענות בלי מודל ממשיך לעבוד.',
    owner: 'את זה יכול לעשות רק בעל האפליקציה.', code: 'קישור ההזמנה לא מזוהה. מבקשים קישור חדש ממי ששלח.', used: 'קישור ההזמנה הזה כבר נוצל. כל קישור טוב לאדם אחד.',
    expired: 'קישור ההזמנה פג. מבקשים קישור חדש ממי ששלח.', many: 'יש כבר הרבה קישורים שעוד לא נוצלו. מחכים שינוצלו או שיפוגו.',
    quota: 'הגענו למכסת התשובות של היום. מחר היא מתחדשת, ומה שאפשר לענות בלי מודל ממשיך לעבוד.', imgquota: 'הגענו למכסת התמונות של היום. אפשר לכתוב מה היה בצלחת.',
    budget: 'המאמן המלא נח עד מחר. מה שאפשר לענות בלי מודל ממשיך לעבוד.', busy: 'המודל עמוס כרגע. מנסים שוב בעוד רגע.', net: 'לא הצלחתי להגיע למודל. מנסים שוב בעוד רגע.',
    key: 'יש בעיה בחיבור של השרת למודל. בעל האפליקציה צריך לבדוק את המפתח.', bad: 'משהו השתבש בבקשה למודל. מנסים לנסח אחרת.', refusal: 'בזה אני לא יכול לעזור. אפשר לשאול אותי על אימונים, תזונה, המטבח והקניות.',
    long: 'התשובה יצאה ארוכה מדי. אפשר לבקש אותה בחלקים, למשל תפריט לשלושה ימים.', empty: 'לא קיבלתי תשובה מהמודל. מנסים שוב.', big: 'ההודעה ארוכה מדי.' },
  en: { auth: 'Sign in to talk to the coach.', off: 'The full coach is not switched on yet. What the app can answer by itself still works.', setup: 'The full coach is not set up on the server yet.',
    invite: 'The full coach is open to invited people only for now. Open your invitation link and it unlocks. What the app can answer by itself still works.',
    owner: 'Only the owner of the app can do that.', code: 'The invitation link was not recognised. Ask for a new one.', used: 'This invitation link was already used. Each link is good for one person.',
    expired: 'The invitation link has expired. Ask for a new one.', many: 'There are many unused links already. Wait until they are used or expire.',
    quota: 'Today\'s answers are used up. They renew tomorrow.', imgquota: 'Today\'s photos are used up. You can type what was on the plate.', budget: 'The full coach is resting until tomorrow.',
    busy: 'The model is busy right now. Try again in a moment.', net: 'Could not reach the model. Try again in a moment.', key: 'The server cannot reach the model. The owner should check the key.',
    bad: 'Something went wrong with the request. Try phrasing it differently.', refusal: 'I cannot help with that. Ask me about training, food, the kitchen and shopping.',
    long: 'The answer came out too long. Ask for it in parts, for example a menu for three days.', empty: 'No answer came back. Try again.', big: 'The message is too long.' }
};
function fail(e, lang, why, extra) { var o = { ok: false, why: why, say: (SAY[lang] || SAY.he)[why] || SAY.he.bad }; if (extra) for (var k in extra) if (extra[k] != null) o[k] = extra[k]; return e.json(200, o); }

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

/* what the owner sees: who was invited and what each asked today, the links still open, the limits */
function state(G, extra) {
  var cfg = config(G), U = usage(G.app, '', today()), byUser = {}, people = [], i;
  for (i = 0; i < U.rows.length; i++) { var owner = s(U.rows[i], 'user'); if (owner) byUser[owner] = U.rows[i]; }
  var acc = G.app.findRecordsByFilter('coach_access', "id != ''", '', 500, 0, {});
  for (i = 0; i < acc.length; i++) {
    var id = s(acc[i], 'user'), name = '', email = '';
    try { var u = G.app.findRecordById('users', id); name = s(u, 'name'); email = s(u, 'email'); } catch (err) { }
    people.push({ id: id, name: name, email: email, owner: s(acc[i], 'role') === 'owner', today: used(byUser[id]), cost: byUser[id] ? n(byUser[id], 'cost') : 0 });
  }
  var out = { ok: true, people: people, pending: pending(G.app).length, total: cfg.perUser.total, dailyUsd: cfg.dailyUsd, today: { n: U.count, cost: U.all } };
  if (extra) for (var k in extra) out[k] = extra[k];
  return out;
}

module.exports = {
  info: function (e, G) {
    var cfg = config(G), userId = userOf(e), on = !!(cfg.on && apiKey(G)), left = null, role = '';
    if (userId) { role = roleOf(G.app, userId); if (role === null) { on = false; role = ''; } }
    if (on && role) { try { var u = usage(G.app, userId, today()); left = leftOf(cfg, u.rec); if (u.all >= cfg.dailyUsd * 1e6) left = none(); } catch (err) { on = false; } }
    return e.json(200, { ok: true, v: 2, on: on, access: !!role, owner: role === 'owner', left: left, limit: cfg.perUser.total, score: cfg.score });
  },

  post: function (e, G) {
    var CK = require(G.hooks + '/coach.js'), cfg = config(G), b = bodyOf(e);
    var text = String(b.text == null ? '' : b.text), lang = (b.lang === 'en' || (!/[א-ת]/.test(text) && /[a-z]/i.test(text))) ? 'en' : 'he';
    var userId = userOf(e);
    if (!userId) return fail(e, lang, 'auth');
    var key = apiKey(G);
    if (!cfg.on || !key) return fail(e, lang, 'off');
    var role = roleOf(G.app, userId);
    if (role === null) { console.log('setim coach: no coach_access collection'); return fail(e, lang, 'setup'); }
    if (!role) return fail(e, lang, 'invite');
    if (text.length > cfg.maxText * 2) return fail(e, lang, 'big');

    var img = null;
    if (typeof b.img === 'string' && b.img) { var m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+\/=]+)$/.exec(b.img); if (!m || m[2].length > 2800000) return fail(e, lang, 'big'); img = { type: m[1], data: m[2] }; }
    if (!text.replace(/\s+/g, '') && !img) return fail(e, lang, 'bad');
    var snap = (b.snap && typeof b.snap === 'object') ? b.snap : {};
    if (JSON.stringify(snap).length > cfg.maxSnap) return fail(e, lang, 'big');
    var hist = []; if (b.hist && b.hist.length) { for (var i = 0; i < b.hist.length && i < 40; i++) { var h = b.hist[i]; if (h && (h.r === 'u' || h.r === 'a') && typeof h.t === 'string') hist.push({ r: h.r, t: h.t }); } }

    var day = today();
    var o = { text: text, hist: hist, snap: snap, img: img, pref: b.pref === 'eco' || b.pref === 'deep' ? b.pref : '', lastTier: String(b.lastTier || ''), catalog: catalog(G) };
    var rq = CK.request(o, cfg), want = rq.tier, took = null;
    /* The place in today's count is taken before the model is called, inside one transaction, so that requests sent side by
       side cannot all slip under the limit. Out of the stronger answers for today: step down rather than refuse. */
    try {
      G.app.runInTransaction(function (tx) {
        var U = usage(tx, userId, day), left = leftOf(cfg, U.rec), tier = want;
        if (U.all >= cfg.dailyUsd * 1e6) { took = { why: 'budget', left: none() }; return; }
        if (left.total <= 0) { took = { why: 'quota', left: left }; return; }
        if (img && left.img <= 0) { took = { why: 'imgquota', left: left }; return; }
        if (tier === 'deep' && left.deep <= 0) tier = 'smart';
        if (tier === 'smart' && left.smart <= 0) tier = 'cheap';
        if (tier === 'cheap' && left.cheap <= 0) { took = { why: 'quota', left: left }; return; }
        var rec = U.rec;
        if (!rec) { rec = new G.Record(tx.findCollectionByNameOrId('coach_usage')); rec.set('user', userId); rec.set('day', day); }
        rec.set(tier, n(rec, tier) + 1); if (img) rec.set('img', n(rec, 'img') + 1);
        tx.save(rec);
        took = { tier: tier, left: leftOf(cfg, rec) };
      });
    } catch (err) { console.log('setim coach: no coach_usage collection: ' + err); return fail(e, lang, 'setup'); }
    if (!took) return fail(e, lang, 'setup');
    if (took.why) return fail(e, lang, took.why, { left: took.left });
    if (took.tier !== rq.tier) { o.force = took.tier; rq = CK.request(o, cfg); }
    var left = took.left;

    var R = callModel(G, cfg, key, rq);
    var A = R.why ? null : CK.reply(R.j), cost = (A && A.usage) ? CK.cost(A.usage, rq.model, cfg.prices) : 0;
    /* Afterwards the tokens and the cost go onto the row. A declined or cut-off answer was still paid for and stays counted;
       a call that never reached an answer (no connection, a busy model, a bad key) gives its place back. */
    try {
      G.app.runInTransaction(function (tx) {
        var rec = usage(tx, userId, day).rec; if (!rec) return;
        if (R.why) { rec.set(rq.tier, Math.max(0, n(rec, rq.tier) - 1)); if (img) rec.set('img', Math.max(0, n(rec, 'img') - 1)); }
        else {
          if (A.usage) { rec.set('tin', n(rec, 'tin') + A.usage.tin + A.usage.tcw + A.usage.tcr); rec.set('tout', n(rec, 'tout') + A.usage.tout); }
          rec.set('cost', n(rec, 'cost') + cost);
        }
        tx.save(rec); left = leftOf(cfg, rec);
      });
    } catch (err) { console.log('setim coach: could not write the usage row: ' + err); }
    if (R.why) return fail(e, lang, R.why, { left: left });
    console.log('setim coach: ' + rq.tier + ' ' + rq.model + ' score ' + rq.score + ' in ' + (A.usage ? A.usage.tin + A.usage.tcw + A.usage.tcr : 0) + ' out ' + (A.usage ? A.usage.tout : 0) + ' cost ' + (cost / 1e6).toFixed(5));

    if (!A.ok) return fail(e, lang, A.why === 'refusal' ? 'refusal' : (A.why === 'long' ? 'long' : 'empty'), { left: left, tier: rq.tier });
    return e.json(200, { ok: true, say: A.say, acts: A.acts, tier: rq.tier, wanted: want, model: A.model || rq.model, score: rq.score, left: left });
  },

  /* an invitation link is opened: the signed-in person gets the coach. One link, one account. */
  join: function (e, G) {
    var b = bodyOf(e), lang = b.lang === 'en' ? 'en' : 'he', userId = userOf(e);
    if (!userId) return fail(e, lang, 'auth');
    var code = String(b.code == null ? '' : b.code).replace(/^\s+|\s+$/g, '');
    if (!/^[A-Za-z0-9]{16,64}$/.test(code)) return fail(e, lang, 'code');
    var hash = G.security.sha256(code), out = null;
    try {
      G.app.runInTransaction(function (tx) {
        var acc = tx.findRecordsByFilter('coach_access', 'user = {:u}', '', 1, 0, { u: userId }), mine = acc.length ? acc[0] : null;
        var rows = tx.findRecordsByFilter('coach_invites', 'hash = {:h}', '', 1, 0, { h: hash });
        if (!rows.length) { out = { why: 'code' }; return; }
        var inv = rows[0], role = s(inv, 'role') === 'owner' ? 'owner' : 'guest';
        /* a link that was used gives nothing more, not even to the one who used it: someone the owner removed stays removed */
        if (s(inv, 'used')) { out = mine ? { owner: s(mine, 'role') === 'owner' } : { why: 'used' }; return; }
        if (n(inv, 'exp') < Date.now()) { out = { why: 'expired' }; return; }
        /* someone who is already in does not use up a link meant for another person */
        if (mine && (role !== 'owner' || s(mine, 'role') === 'owner')) { out = { owner: s(mine, 'role') === 'owner' }; return; }
        if (!mine) { mine = new G.Record(tx.findCollectionByNameOrId('coach_access')); mine.set('user', userId); mine.set('by', s(inv, 'by')); }
        mine.set('role', role); tx.save(mine);
        inv.set('used', userId); inv.set('used_at', Date.now()); tx.save(inv);
        out = { owner: role === 'owner' };
      });
    } catch (err) { console.log('setim coach: an invitation could not be used: ' + err); return fail(e, lang, 'setup'); }
    if (!out) return fail(e, lang, 'setup');
    if (out.why) return fail(e, lang, out.why);
    return e.json(200, { ok: true, access: true, owner: !!out.owner });
  },

  /* the owner's corner: {do:'state'} | {do:'invite'} | {do:'revoke', user} | {do:'limits', total, dailyUsd} */
  admin: function (e, G) {
    var b = bodyOf(e), lang = b.lang === 'en' ? 'en' : 'he', userId = userOf(e);
    if (!userId) return fail(e, lang, 'auth');
    var role = roleOf(G.app, userId);
    if (role === null) return fail(e, lang, 'setup');
    if (role !== 'owner') return fail(e, lang, 'owner');
    var act = String(b['do'] || 'state'), extra = {};
    try {
      if (act === 'invite') {
        if (pending(G.app).length >= 30) return fail(e, lang, 'many');
        var code = G.security.randomString(24), inv = new G.Record(G.app.findCollectionByNameOrId('coach_invites'));
        inv.set('hash', G.security.sha256(code)); inv.set('role', 'guest'); inv.set('by', userId); inv.set('exp', Date.now() + 7 * 86400000); inv.set('used', ''); inv.set('used_at', 0);
        G.app.save(inv); extra.code = code; extra.exp = n(inv, 'exp');
      } else if (act === 'revoke') {
        var who = String(b.user || ''), rows = who ? G.app.findRecordsByFilter('coach_access', 'user = {:u}', '', 1, 0, { u: who }) : [];
        if (rows.length && s(rows[0], 'role') !== 'owner') G.app['delete'](rows[0]);
      } else if (act === 'limits') {
        var t = Math.round(+b.total), u = +b.dailyUsd;
        if (!(t >= 1 && t <= 200) || !(u >= 0.5 && u <= 20)) return fail(e, lang, 'bad');
        var cr = G.app.findRecordsByFilter('coach_config', 'key = {:k}', '', 1, 0, { k: 'limits' }), c = cr.length ? cr[0] : new G.Record(G.app.findCollectionByNameOrId('coach_config'));
        c.set('key', 'limits'); c.set('total', t); c.set('usd', u); G.app.save(c);
      } else if (act !== 'state') return fail(e, lang, 'bad');
      return e.json(200, state(G, extra));
    } catch (err) { console.log('setim coach: the owner\'s request failed: ' + err); return fail(e, lang, 'setup'); }
  }
};
