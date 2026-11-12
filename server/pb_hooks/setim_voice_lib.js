/* Storage glue between PocketBase and VoiceLog.serve (voice.js). Plain ES5, CommonJS: it is loaded with require() from the hook.
   G is what the handler passes in: {app, security, os, hooks, text, Record}.
   The answer is always HTTP 200 with {ok, say}: a phone shortcut shows an error screen for anything else, and the person
   should hear what went wrong instead. */
var CAT = null;        // the exercise names, read once per runtime

function catalog(G) {
  if (CAT) return CAT;
  var raw = G.os.readFile(G.hooks + '/exnames.json');
  CAT = JSON.parse(typeof raw === 'string' ? raw : G.text(raw));
  return CAT;
}

/* a json field can come back as text, as raw bytes or already as an object, depending on the PocketBase version */
function readJson(G, rec) {
  var s = '';
  try { s = rec.getString('data'); } catch (e) { s = ''; }
  if (s && (s.charAt(0) === '{' || s.charAt(0) === '[')) { try { return JSON.parse(s); } catch (e) { } }
  var v = rec.get('data');
  if (v == null) return null;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch (e) { return null; } }
  try { var t = G.text(v); if (t && (t.charAt(0) === '{' || t.charAt(0) === '[')) return JSON.parse(t); } catch (e) { }
  try { return JSON.parse(JSON.stringify(v)); } catch (e) { return null; }
}

/* v14: the numbers of a day, sent by a phone shortcut that reads the phone's health app (which the watch fills):
     POST /api/setim/voice  {key, kind:'health', date?, steps?, hr?, kcal?, sleep?}   ->   {ok, say}
   They wait in the "hinbox" document, one item for each date; the app takes them into the body's document when it is opened, and there the
   newer version of a day wins. Nothing else of the person is read or written here. A week back at most, thirty posts an hour. */
function dayNum(s) { return Math.round(Date.parse(s + 'T12:00:00Z') / 86400000); }
function health(e, G, body, userId, he) {
  var VL = require(G.hooks + '/voice.js'), now = Date.now(), today = VL.israelDate(now);
  var date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date || '')) ? String(body.date) : today;
  if (!(dayNum(today) - dayNum(date) <= 7 && dayNum(date) - dayNum(today) <= 1)) date = today;
  var num = function (v, lo, hi) { if (v == null || v === '') return null; v = +String(v).replace(',', '.'); return (isFinite(v) && v >= lo && v <= hi) ? v : null; };
  var st = num(body.steps, 1, 150000), hr = num(body.hr, 25, 230), kc = num(body.kcal, 1, 15000), sl = num(body.sleep, 0.5, 24);
  if (st == null && hr == null && kc == null && sl == null) return e.json(200, { ok: false, why: 'empty', say: he ? 'לא הגיע מספר מהשעון. בודקים שהקיצור מורשה לקרוא את נתוני הבריאות.' : 'No number arrived from the watch. Check that the shortcut may read the health data.' });
  var recs = G.app.findRecordsByFilter('docs', "user = {:u} && key = 'hinbox'", '', 1, 0, { u: userId });
  var rec = recs.length ? recs[0] : null, box = (rec && readJson(G, rec)) || {};
  if (!box.items) box.items = [];
  box.hits = (box.hits || []).filter(function (t) { return now - t < 3600000; });
  if (box.hits.length >= 30) return e.json(200, { ok: false, why: 'busy', say: he ? 'יותר מדי עדכונים בשעה אחת. מנסים שוב מאוחר יותר.' : 'Too many updates in one hour. Try again later.' });
  box.hits.push(now);
  var it = { id: 'h' + date, d: date, at: now }, parts = [];
  if (st != null) { it.st = Math.round(st); parts.push(he ? it.st + ' צעדים' : it.st + ' steps'); }
  if (hr != null) { it.hr = Math.round(hr); parts.push(he ? 'דופק ' + it.hr : 'heart rate ' + it.hr); }
  if (kc != null) { it.kc = Math.round(kc); parts.push(he ? it.kc + ' קלוריות' : it.kc + ' calories'); }
  if (sl != null) { it.sl = Math.round(sl * 4) / 4; parts.push(he ? it.sl + ' שעות שינה' : it.sl + ' hours of sleep'); }
  box.items = box.items.filter(function (x) { return x && x.d && x.d !== date && dayNum(today) - dayNum(x.d) <= 30; });
  box.items.push(it);
  if (!rec) { rec = new G.Record(G.app.findCollectionByNameOrId('docs')); rec.set('user', userId); rec.set('key', 'hinbox'); }
  rec.set('data', box);
  G.app.save(rec);
  return e.json(200, { ok: true, say: (he ? 'נשלח לסטים: ' : 'Sent to Setim: ') + parts.join(', ') + '.', item: it });
}

module.exports = {
  /* is the server side switched on, and where are the ready-made shortcuts. siri.json sits next to this file:
     {"shortcut": "https://www.icloud.com/shortcuts/...", "health": "https://www.icloud.com/shortcuts/..."}
     shortcut: the one that logs a set by voice; health: the one that sends the day's steps and heart rate (v14). An empty or odd value means "not yet" */
  info: function (e, G) {
    var link = '', hlink = '', good = function (u) { return typeof u === 'string' && /^https:\/\/www\.icloud\.com\/shortcuts\/[0-9a-zA-Z]{16,64}\/?$/.test(u); };
    try {
      var raw = G.os.readFile(G.hooks + '/siri.json');
      var cfg = JSON.parse(typeof raw === 'string' ? raw : G.text(raw));
      if (cfg && good(cfg.shortcut)) link = cfg.shortcut;
      if (cfg && good(cfg.health)) hlink = cfg.health;
    } catch (err) { link = ''; hlink = ''; }
    return e.json(200, { ok: true, v: 3, shortcut: link, health: hlink });
  },

  post: function (e, G) {
    var VL = require(G.hooks + '/voice.js');
    var body = {};
    try { body = e.requestInfo().body || {}; } catch (err) { body = {}; }
    var text = String(body.text == null ? '' : body.text);
    var he = /[א-ת]/.test(text) || body.lang === 'he' || (!text && body.lang !== 'en');
    var key = String(body.key == null ? '' : body.key).replace(/^\s+|\s+$/g, '');
    if (!key) { try { key = String(e.request.header.get('X-Setim-Key') || ''); } catch (err) { key = ''; } }

    var userId = '';
    if (/^stm_[a-z0-9]{20,60}$/.test(key)) {
      try { userId = G.app.findFirstRecordByData('voice_keys', 'hash', G.security.sha256(key)).getString('user'); } catch (err) { userId = ''; }
    }
    if (!userId) {
      return e.json(200, { ok: false, why: 'key', say: he ? 'הקוד האישי לא מזוהה. פותחים את סטים, נכנסים לרישום בקול, ומעתיקים את הקוד לקיצור.' : 'The personal code was not recognised. Open the app, go to voice logging, and copy the code into the shortcut.' });
    }
    if (body.kind === 'health') return health(e, G, body, userId, he);      // the watch's numbers: their own inbox, never the sets' one

    var recs = G.app.findRecordsByFilter('docs', "user = {:u} && (key ~ 'log-%' || key = 'vinbox' || key = 'vdone' || key = 'deck' || key = 'week' || key = 'days')", '', 2000, 0, { u: userId });
    var byKey = {}, i;
    for (i = 0; i < recs.length; i++) byKey[recs[i].getString('key')] = recs[i];

    var io = {
      catalog: catalog(G),
      get: function (k) { return byKey[k] ? readJson(G, byKey[k]) : null; },
      logs: function () { var out = {}, k; for (k in byKey) { if (k.indexOf('log-') === 0) { var d = readJson(G, byKey[k]); if (d) out[k.slice(4)] = d; } } return out; },
      put: function (k, data) {
        var rec = byKey[k];
        if (!rec) { rec = new G.Record(G.app.findCollectionByNameOrId('docs')); rec.set('user', userId); rec.set('key', k); byKey[k] = rec; }
        rec.set('data', data);
        G.app.save(rec);
      }
    };
    var res;
    try {
      res = VL.serve({ text: text, date: body.date, lang: body.lang === 'he' || body.lang === 'en' ? body.lang : '', now: Date.now(), src: 'siri' }, io);
    } catch (err) {
      console.log('setim voice error: ' + err);
      res = { ok: false, why: 'server', say: he ? 'משהו השתבש בשרת. הסט לא נרשם, מנסים שוב.' : 'Something went wrong on the server. The set was not logged, try again.' };
    }
    return e.json(200, res);
  }
};
