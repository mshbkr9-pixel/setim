# -*- coding: utf-8 -*-
"""Tiny in-memory stand-in for the PocketBase endpoints the app uses (local testing only).
Run: python -I -X utf8 mock_pb.py   (listens on 127.0.0.1:8090)
"""
import json, secrets, urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer

USERS = {}   # email -> {id,email,name,password}
TOKENS = {}  # token -> user id
DOCS = {}    # id -> {id,user,key,data}

def uid(): return secrets.token_hex(8)

class H(BaseHTTPRequestHandler):
    def _send(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(data)))
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.end_headers(); self.wfile.write(data)
    def do_OPTIONS(self): self._send(204, {})
    def _body(self):
        n = int(self.headers.get('Content-Length') or 0); return json.loads(self.rfile.read(n) or b'{}')
    def _auth(self):
        return TOKENS.get(self.headers.get('Authorization', ''))
    def log_message(self, *a): pass
    def do_POST(self):
        p = urllib.parse.urlparse(self.path); b = self._body()
        if p.path == '/api/collections/users/records':
            e = (b.get('email') or '').lower()
            if not e or '@' not in e: return self._send(400, {'message': 'Failed to create record.', 'data': {'email': {'code': 'validation_required'}}})
            if e in USERS: return self._send(400, {'message': 'Failed to create record.', 'data': {'email': {'code': 'validation_not_unique'}}})
            if len(b.get('password', '')) < 8: return self._send(400, {'message': 'Failed to create record.', 'data': {'password': {'code': 'validation_length_out_of_range'}}})
            u = {'id': uid(), 'email': e, 'name': b.get('name', ''), 'password': b['password']}; USERS[e] = u
            return self._send(200, {k: v for k, v in u.items() if k != 'password'})
        if p.path == '/api/collections/users/auth-with-password':
            u = USERS.get((b.get('identity') or '').lower())
            if not u or u['password'] != b.get('password'): return self._send(400, {'message': 'Failed to authenticate.', 'data': {}})
            t = secrets.token_urlsafe(24); TOKENS[t] = u['id']
            return self._send(200, {'token': t, 'record': {k: v for k, v in u.items() if k != 'password'}})
        if p.path == '/api/collections/users/auth-refresh':
            me = self._auth()
            if not me: return self._send(401, {'message': 'The request requires valid record authorization token.'})
            u = next(x for x in USERS.values() if x['id'] == me)
            return self._send(200, {'token': self.headers['Authorization'], 'record': {k: v for k, v in u.items() if k != 'password'}})
        if p.path == '/api/collections/docs/records':
            me = self._auth()
            if not me or b.get('user') != me: return self._send(400, {'message': 'Failed to create record.', 'data': {'user': {'code': 'validation_invalid'}}})
            if any(d for d in DOCS.values() if d['user'] == me and d['key'] == b.get('key')):
                return self._send(400, {'message': 'Failed to create record.', 'data': {'key': {'code': 'validation_not_unique'}}})
            d = {'id': uid(), 'user': me, 'key': b['key'], 'data': b['data']}; DOCS[d['id']] = d
            return self._send(200, d)
        self._send(404, {'message': 'not found'})
    def do_PATCH(self):
        p = urllib.parse.urlparse(self.path); b = self._body(); me = self._auth()
        if p.path.startswith('/api/collections/docs/records/'):
            d = DOCS.get(p.path.rsplit('/', 1)[1])
            if not d or d['user'] != me: return self._send(404, {'message': "The requested resource wasn't found."})
            d['data'] = b.get('data'); return self._send(200, d)
        self._send(404, {'message': 'not found'})
    def do_GET(self):
        p = urllib.parse.urlparse(self.path); q = urllib.parse.parse_qs(p.query)
        if p.path == '/api/health': return self._send(200, {'code': 200, 'message': 'API is healthy.'})
        if p.path == '/api/collections/docs/records':
            me = self._auth(); items = [d for d in DOCS.values() if d['user'] == me]  # rules: only own rows
            f = q.get('filter', [''])[0]
            if 'key="' in f: k = f.split('key="')[1].split('"')[0]; items = [d for d in items if d['key'] == k]
            return self._send(200, {'page': 1, 'perPage': 500, 'totalPages': 1, 'totalItems': len(items), 'items': items})
        self._send(404, {'message': 'not found'})

if __name__ == '__main__':
    print('mock PocketBase on http://127.0.0.1:8090'); HTTPServer(('127.0.0.1', 8090), H).serve_forever()
