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

module.exports = {
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
