# -*- coding: utf-8 -*-
"""Creates/updates the PocketBase schema for the "setim" app (idempotent).

Usage:  python -I -X utf8 pb_schema.py <PB_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>

Schema:
  users       (auth, built-in)  — email + password sign-up, no verification required.
  docs        (base)            — one row per (user, key): user -> users, key text, data json.
                                  Rules: a signed-in user sees and edits only their own rows.
  voice_keys  (base)            — one row per personal voice code: user -> users, hash = sha256 of the code.
                                  The code itself is never stored here. A signed-in user creates, lists and deletes
                                  their own rows; nobody edits one. The hook /api/setim/voice looks a code up by its hash.
"""
import json, sys, urllib.request, urllib.error

URL, EMAIL, PW = sys.argv[1].rstrip('/'), sys.argv[2], sys.argv[3]

def call(method, path, body=None, token=None):
    req = urllib.request.Request(URL + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json', **({'Authorization': token} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'{}')

st, auth = call('POST', '/api/collections/_superusers/auth-with-password', {'identity': EMAIL, 'password': PW})
assert st == 200, ('admin login failed', st, auth)
tok = auth['token']

OWN = '@request.auth.id != "" && user = @request.auth.id'
USER = {'name': 'user', 'type': 'relation', 'required': True, 'collectionId': '_pb_users_auth_', 'maxSelect': 1, 'cascadeDelete': True}
docs = {
    'name': 'docs', 'type': 'base',
    'fields': [
        USER,
        {'name': 'key', 'type': 'text', 'required': True, 'max': 120},
        {'name': 'data', 'type': 'json', 'required': True, 'maxSize': 1500000},
        {'name': 'created', 'type': 'autodate', 'onCreate': True},
        {'name': 'updated', 'type': 'autodate', 'onCreate': True, 'onUpdate': True},
    ],
    'indexes': ['CREATE UNIQUE INDEX idx_docs_user_key ON docs (user, key)'],
    'listRule': OWN, 'viewRule': OWN, 'createRule': OWN, 'updateRule': OWN, 'deleteRule': OWN,
}
voice_keys = {
    'name': 'voice_keys', 'type': 'base',
    'fields': [
        USER,
        {'name': 'hash', 'type': 'text', 'required': True, 'min': 64, 'max': 64, 'pattern': '^[a-f0-9]{64}$'},
        {'name': 'label', 'type': 'text', 'max': 40},
        {'name': 'created', 'type': 'autodate', 'onCreate': True},
    ],
    'indexes': ['CREATE UNIQUE INDEX idx_voice_keys_hash ON voice_keys (hash)', 'CREATE INDEX idx_voice_keys_user ON voice_keys (user)'],
    'listRule': OWN, 'viewRule': OWN, 'createRule': OWN, 'updateRule': None, 'deleteRule': OWN,
}
for coll in (docs, voice_keys):
    name = coll['name']
    st, existing = call('GET', '/api/collections/' + name, token=tok)
    if st == 200:
        st2, res = call('PATCH', '/api/collections/' + name, coll, token=tok)
        print(name, 'collection updated' if st2 == 200 else ('update failed', st2, res))
    else:
        st2, res = call('POST', '/api/collections', coll, token=tok)
        print(name, 'collection created' if st2 == 200 else ('create failed', st2, res))

# users: make sure password auth is on, and signing up does not require a verified email
st, users = call('GET', '/api/collections/users', token=tok)
assert st == 200, ('users collection missing', st)
patch = {'passwordAuth': {'enabled': True, 'identityFields': ['email']},
         'createRule': '', 'listRule': 'id = @request.auth.id', 'viewRule': 'id = @request.auth.id',
         'updateRule': 'id = @request.auth.id', 'deleteRule': 'id = @request.auth.id'}
st, res = call('PATCH', '/api/collections/users', patch, token=tok)
print('users collection updated' if st == 200 else ('users patch failed', st, res))
print('health:', call('GET', '/api/health')[0])
