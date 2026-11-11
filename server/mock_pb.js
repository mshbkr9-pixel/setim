/* Local stand-in for the PocketBase endpoints the app uses, for testing on this computer only. Everything is kept in memory.
   Run:  node server/mock_pb.js      (listens on 127.0.0.1:8090, where the app looks when it is opened from localhost)
   Unlike mock_pb.py it also has the voice side: the voice_keys collection, and /api/setim/voice, which calls the real
   server/pb_hooks/setim_voice_lib.js with a small imitation of the PocketBase objects it uses. So the same glue and the same
   understanding (voice.js) run here and on the server; only PocketBase itself is imitated. */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const HOOKS = path.join(__dirname, 'pb_hooks');
const lib = require(path.join(HOOKS, 'setim_voice_lib.js'));
const PORT = +(process.env.PORT || 8090);

const USERS = {};   // email -> {id,email,name,password}
const TOKENS = {};  // token -> user id
const DOCS = {};    // id -> {id,user,key,data}
const VKEYS = {};   // id -> {id,user,hash,label}
let TEST_LINK = '';   // set through POST /__test/shortcut, only in this stand-in
const uid = () => crypto.randomBytes(8).toString('hex');
const pub = u => ({ id: u.id, email: u.email, name: u.name });

/* ---- the few PocketBase objects the hook touches ---- */
class Rec {
  constructor(coll, obj) { this.coll = typeof coll === 'string' ? coll : coll.name; this.o = obj || {}; }
  get(f) { const v = this.o[f]; return f === 'data' && v != null ? Buffer.from(JSON.stringify(v)) : v; }     // a json field arrives as raw bytes
  getString(f) { const v = this.o[f]; return v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); }
  set(f, v) { this.o[f] = f === 'data' ? JSON.parse(JSON.stringify(v)) : v; }
}
const G = {
  hooks: HOOKS, Record: Rec,
  text: b => Buffer.from(b).toString('utf8'),
  os: { readFile: p => (TEST_LINK && /siri\.json$/.test(p)) ? Buffer.from(JSON.stringify({ shortcut: TEST_LINK })) : fs.readFileSync(p) },
  security: { sha256: s => crypto.createHash('sha256').update(s).digest('hex') },
  app: {
    findFirstRecordByData(coll, field, value) { const hit = Object.values(coll === 'voice_keys' ? VKEYS : DOCS).find(o => o[field] === value); if (!hit) throw new Error('sql: no rows in result set'); return new Rec(coll, hit); },
    findRecordsByFilter(coll, filter, sort, limit, offset, params) { return Object.values(DOCS).filter(d => d.user === params.u && (d.key.startsWith('log-') || ['vinbox', 'vdone', 'deck', 'week', 'days'].includes(d.key))).map(d => new Rec('docs', d)); },
    findCollectionByNameOrId(name) { return { name }; },
    save(rec) { if (!rec.o.id) rec.o.id = uid(); (rec.coll === 'voice_keys' ? VKEYS : DOCS)[rec.o.id] = rec.o; }
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
        for (const store of [DOCS, VKEYS]) Object.keys(store).forEach(k => { if (store[k].user === id) delete store[k]; });
        Object.keys(USERS).forEach(k => { if (USERS[k].id === id) delete USERS[k]; }); Object.keys(TOKENS).forEach(k => { if (TOKENS[k] === id) delete TOKENS[k]; });
        return send(res, 204);
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
