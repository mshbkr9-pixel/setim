/* Local stand-in for the PocketBase endpoints the app uses, for testing on this computer only. Everything is kept in memory.
   Run:  node server/mock_pb.js      (listens on 127.0.0.1:8090, where the app looks when it is opened from localhost)
         node server/mock_pb.js 8094 (another port, for a run beside another session's; the app is pointed at it with the
                                      localStorage key gtdev:pb)
   It also has the coach side: /api/setim/coach runs the real server/pb_hooks/setim_coach_lib.js, and the Claude API is played by
   fakeClaude() below, so nothing here costs money. POST /__test/coach sets how the stand-in behaves; GET shows what it was sent.
   Unlike mock_pb.py it also has the voice side: the voice_keys collection, and /api/setim/voice, which calls the real
   server/pb_hooks/setim_voice_lib.js with a small imitation of the PocketBase objects it uses. So the same glue and the same
   understanding (voice.js) run here and on the server; only PocketBase itself is imitated. */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const HOOKS = path.join(__dirname, 'pb_hooks');
const lib = require(path.join(HOOKS, 'setim_voice_lib.js'));
const coachLib = require(path.join(HOOKS, 'setim_coach_lib.js'));
const PORT = +(process.env.PORT || process.argv[2] || 8090);      // node server/mock_pb.js 8094 runs a second one beside another session's

const USERS = {};   // email -> {id,email,name,password}
const TOKENS = {};  // token -> user id
const DOCS = {};    // id -> {id,user,key,data}
const VKEYS = {};   // id -> {id,user,hash,label}
const USAGE = {};   // id -> {id,user,day,cheap,smart,deep,img,tin,tout,cost}
const ACCESS = {};  // id -> {id,user,role,by}          who was invited to the coach
const INVITES = {}; // id -> {id,hash,role,by,exp,used,used_at}
const CONFIG = {};  // id -> {id,key,total,usd}        the owner's limits
let TEST_LINK = '';   // set through POST /__test/shortcut, only in this stand-in
const COACH = { mode: '', calls: [], cfg: null };   // set through POST /__test/coach: how the stand-in model behaves, and the knobs for a test

/* ---- a stand-in for the Claude API. It answers in the shape of POST /v1/messages, so the real request-building and
        answer-checking code runs against it, and no test ever costs money. With SETIM_LIVE=1 and ANTHROPIC_API_KEY set in the
        environment the same door sends the request to the real API instead (curl, the key passed on stdin, never in the
        command line): that is for a short try-out the owner has agreed to, since every such call is paid for. ---- */
function fakeClaude(body) {
  const last = body.messages[body.messages.length - 1];
  const blocks = Array.isArray(last.content) ? last.content : [{ type: 'text', text: String(last.content) }];
  const hasImg = blocks.some(b => b.type === 'image');
  const text = (blocks.filter(b => b.type === 'text').pop() || {}).text || '';
  const sys = (body.system && body.system[0] && body.system[0].text) || '';
  const ids = slot => sys.split('\n').map(l => l.split(' | ')).filter(p => p.length >= 7 && p[2].split(',').includes(slot)).map(p => p[0]);
  COACH.calls.push({ model: body.model, effort: body.output_config && body.output_config.effort, max_tokens: body.max_tokens, fallbacks: body.fallbacks || '', format: !!(body.output_config && body.output_config.format), cached: !!(body.system && body.system[0] && body.system[0].cache_control), img: hasImg, text, messages: body.messages.length });
  if (COACH.mode === 'busy') return { statusCode: 529, json: { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } } };
  if (COACH.mode === 'schema400' && body.output_config && body.output_config.format) return { statusCode: 400, json: { type: 'error', error: { type: 'invalid_request_error', message: 'output_config.format.schema: unsupported' } } };
  const usage = { input_tokens: Math.round(JSON.stringify(body.messages).length / 3), cache_read_input_tokens: Math.round(sys.length / 3), output_tokens: 180 };
  if (COACH.mode === 'refuse') return { statusCode: 200, json: { id: 'msg_x', type: 'message', role: 'assistant', model: body.model, content: [], stop_reason: 'refusal', stop_details: { type: 'refusal', category: null }, usage } };
  let out;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (hasImg) out = { say: 'בתמונה נראים אורז וחזה עוף. הכנתי לרישום, הכמויות הן הערכה.', acts: [{ t: 'meal', slot: 'l', date: '', title: '', items: [{ name: 'אורז', grams: 180, kcal: 234, p: 4.9, c: 50, f: 0.5, est: true }, { name: 'חזה עוף', grams: 150, kcal: 264, p: 49.5, c: 0, f: 5.7, est: true }] }] };
  else if (/המבורגר/.test(text)) out = { say: 'הכנתי לרישום: המבורגר בלחמנייה וצ׳יפס. הכמויות הן הערכה.', acts: [{ t: 'meal', slot: 'l', date: '', title: 'המבורגר וצ׳יפס', items: [{ name: 'המבורגר בלחמנייה', grams: 220, kcal: 560, p: 30, c: 40, f: 30, est: true }, { name: 'צ׳יפס', grams: 120, kcal: 370, p: 4, c: 45, f: 19, est: true }] }] };
  else if (/תפריט/.test(text)) out = { say: 'הכנתי תפריט למחר לפי היעדים שלך.', acts: [{ t: 'plan', days: [{ date: tomorrow, meals: ['b', 'l', 'd'].map(s => ({ slot: s, recipe: ids(s)[0] || '', servings: 1, title: ids(s)[0] ? '' : 'ארוחה', kcal: 500, p: 35 })) }] }] };
  else if (/תזכור עליי/.test(text)) out = { say: 'רשמתי לעצמי.', acts: [{ t: 'remember', text: 'מעדיף אימונים בבוקר' }] };
  else out = { say: 'תשובת בדיקה מ-' + body.model + ': ' + text.slice(0, 60), acts: [] };
  return { statusCode: 200, json: { id: 'msg_x', type: 'message', role: 'assistant', model: body.model, content: [{ type: 'thinking', thinking: '', signature: 'x' }, { type: 'text', text: JSON.stringify(out) }], stop_reason: 'end_turn', usage } };
}
function liveClaude(opts) {
  const { spawnSync } = require('child_process');
  const cfg = ['url = "' + opts.url + '"', 'request = "POST"', 'silent', 'max-time = ' + (opts.timeout || 150)].concat(Object.keys(opts.headers).map(h => 'header = "' + h + ': ' + String(opts.headers[h]).replace(/"/g, '') + '"')).concat(['data-binary = "@' + path.join(require('os').tmpdir(), 'setim-coach-body.json').replace(/\\/g, '/') + '"', 'write-out = "\\n%{http_code}"']).join('\n');
  fs.writeFileSync(path.join(require('os').tmpdir(), 'setim-coach-body.json'), opts.body);
  const r = spawnSync('curl', ['-K', '-'], { input: cfg, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  try { fs.unlinkSync(path.join(require('os').tmpdir(), 'setim-coach-body.json')); } catch (e) { }
  const out = String(r.stdout || ''), cut = out.lastIndexOf('\n'), status = +out.slice(cut + 1) || 0;
  let json = null; try { json = JSON.parse(out.slice(0, cut)); } catch (e) { json = null; }
  if (json && json.usage) console.log('LIVE call: ' + json.model + ' in ' + json.usage.input_tokens + ' cache-read ' + (json.usage.cache_read_input_tokens || 0) + ' out ' + json.usage.output_tokens + ' stop ' + json.stop_reason);
  COACH.calls.push({ live: true, status, model: json && json.model, stop: json && json.stop_reason, usage: json && json.usage });
  return { statusCode: status, json };
}
const LIVE = process.env.SETIM_LIVE === '1' && !!process.env.ANTHROPIC_API_KEY;
const uid = () => crypto.randomBytes(8).toString('hex');
const pub = u => ({ id: u.id, email: u.email, name: u.name });

/* ---- the few PocketBase objects the hook touches ---- */
class Rec {
  constructor(coll, obj) { this.coll = typeof coll === 'string' ? coll : coll.name; this.o = obj || {}; }
  get(f) { const v = this.o[f]; return f === 'data' && v != null ? Buffer.from(JSON.stringify(v)) : v; }     // a json field arrives as raw bytes
  getString(f) { const v = this.o[f]; return v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); }
  set(f, v) { this.o[f] = f === 'data' ? JSON.parse(JSON.stringify(v)) : v; }
}
const COACH_STORES = { coach_usage: USAGE, coach_access: ACCESS, coach_invites: INVITES, coach_config: CONFIG };
const storeOf = coll => coll === 'voice_keys' ? VKEYS : (COACH_STORES[coll] || DOCS);
/* the handful of filters the coach hook uses: `field = {:param}`, `field = ''`, `id != ''` */
const matches = (o, filter, p) => filter.split('&&').every(part => { const m = /^\s*(\w+)\s*(!?=)\s*(?:\{:(\w+)\}|'')\s*$/.exec(part); if (!m) throw new Error('a filter this stand-in does not know: ' + filter);
  const want = m[3] ? p[m[3]] : '', cur = o[m[1]] == null ? '' : o[m[1]]; return m[2] === '=' ? cur === want : cur !== want; });
const G = {
  hooks: HOOKS, Record: Rec,
  text: b => Buffer.from(b).toString('utf8'),
  os: {
    readFile: p => (TEST_LINK && /siri\.json$/.test(p)) ? Buffer.from(JSON.stringify({ shortcut: TEST_LINK })) : ((COACH.cfg && /coach\.json$/.test(p)) ? Buffer.from(JSON.stringify(COACH.cfg)) : fs.readFileSync(p)),
    getenv: n => n === 'ANTHROPIC_API_KEY' ? (LIVE ? process.env.ANTHROPIC_API_KEY : (COACH.mode === 'nokey' ? '' : 'stand-in-key')) : (process.env[n] || '')
  },
  http: { send: opts => LIVE ? liveClaude(opts) : fakeClaude(JSON.parse(opts.body)) },
  sleep: () => { },
  security: { sha256: s => crypto.createHash('sha256').update(s).digest('hex'), randomString: k => crypto.randomBytes(k).toString('hex').slice(0, k) },
  app: {
    findFirstRecordByData(coll, field, value) { const hit = Object.values(storeOf(coll)).find(o => o[field] === value); if (!hit) throw new Error('sql: no rows in result set'); return new Rec(coll, hit); },
    findRecordsByFilter(coll, filter, sort, limit, offset, params) {
      if (COACH_STORES[coll]) return Object.values(COACH_STORES[coll]).filter(o => matches(o, filter, params || {})).map(o => new Rec(coll, o));
      return Object.values(DOCS).filter(d => d.user === params.u && (d.key.startsWith('log-') || ['vinbox', 'vdone', 'deck', 'week', 'days'].includes(d.key))).map(d => new Rec('docs', d));
    },
    findRecordById(coll, id) { const hit = Object.values(USERS).find(x => x.id === id); if (!hit) throw new Error('sql: no rows in result set'); return new Rec(coll, hit); },
    findCollectionByNameOrId(name) { return { name }; },
    save(rec) { if (!rec.o.id) rec.o.id = uid(); storeOf(rec.coll)[rec.o.id] = rec.o; },
    delete(rec) { delete storeOf(rec.coll)[rec.o.id]; },
    runInTransaction(fn) { return fn(G.app); }
  }
};

function send(res, code, body) {
  const data = code === 204 ? '' : JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Setim-Key', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS' });
  res.end(data);
}
const list = items => ({ page: 1, perPage: 500, totalPages: 1, totalItems: items.length, items });

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const p = u.pathname; const me = TOKENS[req.headers.authorization || ''];
  let raw = '';
  req.on('data', c => { raw += c; });
  req.on('end', () => {
    let b = {}; try { b = raw ? JSON.parse(raw) : {}; } catch (e) { b = {}; }
    const filter = u.searchParams.get('filter') || '';
    try {
      if (req.method === 'OPTIONS') return send(res, 204);
      if (p === '/api/health') return send(res, 200, { code: 200, message: 'API is healthy.' });

      if (p === '/__test/shortcut' && req.method === 'POST') { TEST_LINK = String(b.link || ''); return send(res, 200, { link: TEST_LINK }); }
      if (p === '/api/setim/voice' && req.method === 'GET') return lib.info({ json: (code, body) => send(res, code, body) }, G);
      if (p === '/api/setim/voice' && req.method === 'POST') {
        const e = { requestInfo: () => ({ body: b }), request: { header: { get: n => req.headers[String(n).toLowerCase()] || '' } }, json: (code, body) => send(res, code, body) };
        return lib.post(e, G);
      }
      if (p === '/__test/coach' && req.method === 'POST') {
        COACH.mode = String(b.mode || ''); if ('cfg' in b) COACH.cfg = b.cfg || null;
        if (b.reset) { COACH.calls.length = 0; [USAGE, ACCESS, INVITES, CONFIG].forEach(st => Object.keys(st).forEach(k => delete st[k])); }
        /* what a real server gets from coach_owner.py: letting the signed-in account in, or a link (owner or guest) to open */
        const out = { mode: COACH.mode };
        if (b.grant && me) { Object.keys(ACCESS).forEach(k => { if (ACCESS[k].user === me) delete ACCESS[k]; }); const id = uid(); ACCESS[id] = { id, user: me, role: b.grant === 'owner' ? 'owner' : 'guest', by: '' }; }
        if (b.invite) { const code = G.security.randomString(24), id = uid(); INVITES[id] = { id, hash: G.security.sha256(code), role: b.invite === 'owner' ? 'owner' : 'guest', by: '', exp: Date.now() + 7 * 86400000, used: '', used_at: 0 }; out.code = code; }
        return send(res, 200, out);
      }
      if (p === '/__test/coach' && req.method === 'GET') return send(res, 200, { mode: COACH.mode, live: LIVE, calls: COACH.calls, usage: Object.values(USAGE), access: Object.values(ACCESS), invites: Object.values(INVITES).length, config: Object.values(CONFIG) });
      if (p === '/api/setim/coach' || p === '/api/setim/coach/join' || p === '/api/setim/coach/admin') {
        const e = { auth: me ? { id: me } : null, requestInfo: () => ({ body: b }), json: (code, body) => send(res, code, body) };
        if (p.endsWith('/join')) return req.method === 'POST' ? coachLib.join(e, G) : send(res, 404, { message: 'not found' });
        if (p.endsWith('/admin')) return req.method === 'POST' ? coachLib.admin(e, G) : send(res, 404, { message: 'not found' });
        return req.method === 'GET' ? coachLib.info(e, G) : coachLib.post(e, G);
      }

      if (p === '/api/collections/users/records' && req.method === 'POST') {
        const email = String(b.email || '').toLowerCase();
        if (!email || !email.includes('@')) return send(res, 400, { message: 'Failed to create record.', data: { email: { code: 'validation_required' } } });
        if (USERS[email]) return send(res, 400, { message: 'Failed to create record.', data: { email: { code: 'validation_not_unique' } } });
        if (String(b.password || '').length < 8) return send(res, 400, { message: 'Failed to create record.', data: { password: { code: 'validation_length_out_of_range' } } });
        USERS[email] = { id: uid(), email, name: b.name || '', password: b.password }; return send(res, 200, pub(USERS[email]));
      }
      if (p === '/api/collections/users/auth-with-password') {
        const usr = USERS[String(b.identity || '').toLowerCase()];
        if (!usr || usr.password !== b.password) return send(res, 400, { message: 'Failed to authenticate.', data: {} });
        const t = crypto.randomBytes(24).toString('base64url'); TOKENS[t] = usr.id; return send(res, 200, { token: t, record: pub(usr) });
      }
      if (p === '/api/collections/users/auth-refresh') {
        if (!me) return send(res, 401, { message: 'The request requires valid record authorization token.' });
        return send(res, 200, { token: req.headers.authorization, record: pub(Object.values(USERS).find(x => x.id === me)) });
      }

      if (p.startsWith('/api/collections/users/records/') && req.method === 'DELETE') {          // rule: a person can delete only their own account; their rows go with it
        const id = p.split('/').pop(); if (!me || me !== id) return send(res, 404, { message: "The requested resource wasn't found." });
        for (const store of [DOCS, VKEYS, ACCESS]) Object.keys(store).forEach(k => { if (store[k].user === id) delete store[k]; });
        Object.keys(USAGE).forEach(k => { if (USAGE[k].user === id) USAGE[k].user = ''; });          // a usage row stays, owned by nobody: the day's spending is not erased with the account
        Object.keys(USERS).forEach(k => { if (USERS[k].id === id) delete USERS[k]; }); Object.keys(TOKENS).forEach(k => { if (TOKENS[k] === id) delete TOKENS[k]; });
        return send(res, 204);
      }

      if (p.startsWith('/api/collections/coach_usage/records')) {          // rule: a person may read their own rows; only the hook writes them
        if (p === '/api/collections/coach_usage/records' && req.method === 'GET') return send(res, 200, list(Object.values(USAGE).filter(d => d.user === me)));
        return send(res, req.method === 'GET' ? 404 : 403, { message: 'Only superusers can perform this action.' });
      }
      for (const [name, store] of [['docs', DOCS], ['voice_keys', VKEYS]]) {
        const base = '/api/collections/' + name + '/records';
        if (p === base && req.method === 'GET') {
          let items = Object.values(store).filter(d => d.user === me);          // rule: only the person's own rows
          const m = /key="([^"]+)"/.exec(filter); if (m) items = items.filter(d => d.key === m[1]);
          return send(res, 200, list(items));
        }
        if (p === base && req.method === 'POST') {
          if (!me || b.user !== me) return send(res, 400, { message: 'Failed to create record.', data: { user: { code: 'validation_invalid' } } });
          if (name === 'docs' && Object.values(store).some(d => d.user === me && d.key === b.key)) return send(res, 400, { message: 'Failed to create record.', data: { key: { code: 'validation_not_unique' } } });
          if (name === 'voice_keys' && !/^[a-f0-9]{64}$/.test(String(b.hash || ''))) return send(res, 400, { message: 'Failed to create record.', data: { hash: { code: 'validation_invalid' } } });
          const rec = name === 'docs' ? { id: uid(), user: me, key: b.key, data: b.data } : { id: uid(), user: me, hash: b.hash, label: b.label || '' };
          store[rec.id] = rec; return send(res, 200, rec);
        }
        if (p.startsWith(base + '/')) {
          const rec = store[p.slice(base.length + 1)];
          if (!rec || rec.user !== me) return send(res, 404, { message: "The requested resource wasn't found." });
          if (req.method === 'PATCH' && name === 'docs') { rec.data = b.data; return send(res, 200, rec); }
          if (req.method === 'DELETE') { delete store[rec.id]; return send(res, 204); }
          if (req.method === 'GET') return send(res, 200, rec);
        }
      }
      send(res, 404, { message: 'not found' });
    } catch (err) { console.error(err); send(res, 500, { message: String(err) }); }
  });
}).listen(PORT, '127.0.0.1', () => console.log('mock PocketBase with voice on http://127.0.0.1:' + PORT));
