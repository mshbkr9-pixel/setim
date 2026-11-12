# -*- coding: utf-8 -*-
"""Makes the first invitation link of the coach, the one for the owner, or lets one account in by its id.

The coach answers only people who were invited. The owner invites people from the app, but someone has to make the owner:
this script puts one invitation with the role "owner" into the database and prints its link. Whoever opens the link while
signed in becomes the owner. It works once, and for a week. Only the SHA-256 of the code is stored.

The admin's email and password come from the environment (EM and PW), never from the command line:
    python -I -X utf8 coach_owner.py <PB_URL> link [site]
        prints an owner link. `site` is the address the app is opened at (default: PB_URL).
    python -I -X utf8 coach_owner.py <PB_URL> grant <user id> [owner|guest]
        lets that account in directly, with no link (for the checks that run against the live server).
"""
import hashlib, json, os, secrets, string, sys, time, urllib.error, urllib.request

URL = sys.argv[1].rstrip('/')
DO = sys.argv[2] if len(sys.argv) > 2 else ''
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def call(method, path, body=None, token=None):
    req = urllib.request.Request(URL + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json', **({'Authorization': token} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b'{}')
        except ValueError:
            return e.code, {}

st, auth = call('POST', '/api/collections/_superusers/auth-with-password', {'identity': os.environ.get('EM', ''), 'password': os.environ.get('PW', '')})
if st != 200:
    print('admin login failed:', st)
    sys.exit(1)
tok = auth['token']

if DO == 'link':
    site = (sys.argv[3] if len(sys.argv) > 3 else URL).rstrip('/')
    code = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(24))
    row = {'hash': hashlib.sha256(code.encode()).hexdigest(), 'role': 'owner', 'by': '', 'exp': int((time.time() + 7 * 86400) * 1000), 'used': '', 'used_at': 0}
    st, r = call('POST', '/api/collections/coach_invites/records', row, tok)
    if st != 200:
        print('the invitation could not be stored:', st, r)
        sys.exit(1)
    print(site + '/#join-' + code)
elif DO == 'grant' and len(sys.argv) > 3:
    role = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] in ('owner', 'guest') else 'guest'
    st, r = call('POST', '/api/collections/coach_access/records', {'user': sys.argv[3], 'role': role, 'by': ''}, tok)
    print('access given (%s)' % role if st == 200 else ('could not give access: %s %s' % (st, r)))
    sys.exit(0 if st == 200 else 1)
else:
    print(__doc__)
    sys.exit(2)
