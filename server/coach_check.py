# -*- coding: utf-8 -*-
"""One real question through the coach hook as it is installed, to see the whole road working: the app's door, the hook, the
Claude API, the answer and the bookkeeping. EVERY RUN COSTS MONEY (about a tenth of a cent: one short question, answered by the
small model), so run it only when the owner has agreed: after an install, after changing the key, a model or the hook.

It signs up a throwaway user, asks, reads the usage row, and the user deletes itself. The usage row stays, owned by nobody, so
the day's total keeps what was spent. It needs no admin password: everything goes through the same doors the app uses.

Usage:  python -I -X utf8 coach_check.py <PB_URL>          e.g.  python -I -X utf8 coach_check.py https://getonekeyai.com
Exit code 0 only when every step passed.
"""
import json, re, secrets, sys, time, urllib.error, urllib.parse, urllib.request

URL = sys.argv[1].rstrip('/')
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
fails = 0

def call(method, path, body=None, token=None):
    req = urllib.request.Request(URL + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json', **({'Authorization': token} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=200) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, (json.loads(raw) if raw else {})
        except ValueError:
            return e.code, {'raw': raw[:200].decode('utf-8', 'replace')}

def check(label, ok, detail=''):
    global fails
    if not ok:
        fails += 1
    print(('PASS  ' if ok else 'FAIL  ') + label + ((' -> ' + str(detail)[:600]) if detail and not ok else ''))
    return ok

st, r = call('GET', '/api/health'); check('server is up', st == 200, (st, r))
st, r = call('GET', '/api/setim/coach')
if not check('the coach hook answers and says it is switched on', st == 200 and r.get('ok') is True and r.get('on') is True, (st, r)):
    print('\nStopped before asking anything: nothing was spent and no user was created.')
    sys.exit(1)
st, r = call('POST', '/api/setim/coach', {'text': 'שלום'}); check('nobody is answered without signing in', r.get('ok') is False and r.get('why') == 'auth', (st, r))

email = 'coachcheck-' + secrets.token_hex(5) + '@example.test'
pw = secrets.token_urlsafe(12)
st, r = call('POST', '/api/collections/users/records', {'email': email, 'password': pw, 'passwordConfirm': pw, 'name': 'coach check'})
if not check('sign up a throwaway user', st == 200, (st, r)):
    sys.exit(1)
st, r = call('POST', '/api/collections/users/auth-with-password', {'identity': email, 'password': pw})
check('sign in', st == 200 and r.get('token'), (st, r))
tok, uid = r.get('token', ''), (r.get('record') or {}).get('id', '')

try:
    st, r = call('GET', '/api/setim/coach', token=tok)
    left0 = r.get('left') or {}
    check('a signed-in person is told how many answers are left today', left0.get('cheap', 0) > 0, r)

    today = time.strftime('%Y-%m-%d', time.gmtime())
    snap = {'today': today, 'me': {'name': 'בדיקה', 'sex': 'male', 'age': 30, 'weight_kg': 80, 'training_focus': 'בניית שריר'},
            'nutrition': {'goal': 'keep', 'target': {'kcal': 2500, 'p': 140}, 'eaten_today': {'kcal': 900, 'p': 45}, 'left_today': {'kcal': 1600, 'p': 95}},
            'training': {'today': {'label': 'רגליים', 'rest': False, 'done': [{'name': 'סקוואט במוט', 'sets': '3×8 80 ק״ג'}]}}}
    t0 = time.time()
    st, r = call('POST', '/api/setim/coach', {'text': 'מה כדאי לי לאכול אחרי האימון?', 'snap': snap, 'hist': []}, tok)
    secs = time.time() - t0
    say = r.get('say') if isinstance(r.get('say'), str) else ''
    ok = st == 200 and r.get('ok') is True and r.get('tier') == 'cheap' and len(say) > 20 and re.search('[א-ת]', say) is not None and isinstance(r.get('acts'), list)
    check('a short question is answered by the real small model, in Hebrew', ok, (st, r))
    if ok:
        print('      %.1f s · %s · score %s' % (secs, r.get('model'), r.get('score')))
        print('      ' + re.sub(r'\s+', ' ', say)[:320])

    f = urllib.parse.quote('user="%s"' % uid)
    st, r = call('GET', '/api/collections/coach_usage/records?perPage=5&filter=' + f, token=tok)
    row = (r.get('items') or [{}])[0]
    ok = st == 200 and len(r.get('items') or []) == 1 and row.get('cheap') == 1 and (row.get('tin') or 0) > 0 and (row.get('tout') or 0) > 0 and (row.get('cost') or 0) > 0
    check('the usage row: one small answer, its tokens and its cost', ok, (st, r))
    if ok:
        print('      tokens in %d, out %d, cost %.4f USD' % (row['tin'], row['tout'], row['cost'] / 1e6))
    st, r = call('GET', '/api/setim/coach', token=tok)
    check('the count of answers left went down by one', (r.get('left') or {}).get('cheap') == left0.get('cheap', 0) - 1, r)
    st2, _ = call('PATCH', '/api/collections/coach_usage/records/' + str(row.get('id')), {'cheap': 0}, tok)
    st3, _ = call('DELETE', '/api/collections/coach_usage/records/' + str(row.get('id')), None, tok)
    check('the person cannot reset or delete the usage row', st2 >= 400 and st3 >= 400, (st2, st3))
finally:
    st, r = call('DELETE', '/api/collections/users/records/' + uid, None, tok)
    check('the throwaway user deletes itself', st in (200, 204), (st, r))
    st, r = call('POST', '/api/collections/users/auth-with-password', {'identity': email, 'password': pw})
    check('and is gone', st == 400, (st, r))

print('\n%s (%d failed)' % ('ALL PASSED' if not fails else 'SOME CHECKS FAILED', fails))
sys.exit(1 if fails else 0)
