# -*- coding: utf-8 -*-
"""A look at the coach hook as it is installed, through the same doors the app uses.

Without more it costs nothing: it signs up a throwaway user and looks at what the server tells it. Where the coach answers
invited people only, it sees that someone who was not invited is refused and that nothing was spent. Where the coach is open
to everyone, it sees that the new account has the coach, within dollars of its own, and asks nothing. Then the user deletes
itself.

It goes on to one real question, to see the whole road working (the hook, the Claude API, the answer and the bookkeeping), in
one of two ways. Where the coach is for invited people: with the admin's email and password in the environment (EM and PW), the
admin lets the throwaway user in. Where the coach is open to everyone: with PAY=1 in the environment. THAT COSTS MONEY (about a
tenth of a cent: one short question, answered by the small model), so run it that way only when the owner has agreed: after an
install, after changing the key, a model or the hook. The usage row stays, owned by nobody, so the day's total keeps what was
spent.

Usage:  [EM=... PW=... | PAY=1] python -I -X utf8 coach_check.py <PB_URL>          e.g.  python -I -X utf8 coach_check.py https://getonekeyai.com
Exit code 0 only when every step passed.
"""
import json, os, re, secrets, sys, time, urllib.error, urllib.parse, urllib.request

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
mine = '/api/collections/coach_usage/records?perPage=5&filter=' + urllib.parse.quote('user="%s"' % uid)

try:
    # ---------------- a new account: refused where the coach is for invited people, let in where it is open to everyone ----------------
    st, r = call('GET', '/api/setim/coach', token=tok)
    is_open = r.get('open') is True
    if is_open:
        usd = r.get('usd') or {}
        check('the coach is open to everyone: a new account has it, within dollars of its own', r.get('on') is True and r.get('access') is True and r.get('owner') is False
              and (r.get('left') or {}).get('total', 0) > 0 and usd.get('cap', 0) > 0 and usd.get('used') == 0 and usd.get('out') is False, r)
        if usd.get('cap'):
            print('      each person: %s USD (counted over: %s) · answers a day: %s' % (usd.get('cap'), usd.get('per'), r.get('limit')))
        st2, r2 = call('GET', mine, token=tok)
        check('and looking costs nothing', st2 == 200 and not r2.get('items'), (st2, r2))
    else:
        check('a new account was not invited, and the server says so', r.get('on') is True and r.get('access') is False and r.get('owner') is False and r.get('left') is None, r)
        st, r = call('POST', '/api/setim/coach', {'text': 'מה כדאי לי לאכול אחרי האימון?'}, tok)
        st2, r2 = call('GET', mine, token=tok)
        check('its question is refused, and nothing is spent', r.get('ok') is False and r.get('why') == 'invite' and st2 == 200 and not r2.get('items'), (r, st2, r2))
    st, r = call('POST', '/api/setim/coach/join', {'code': 'x' * 24}, tok); check('a made-up invitation code opens nothing', r.get('why') == 'code', r)
    st, r = call('POST', '/api/setim/coach/admin', {'do': 'state'}, tok); check("the owner's corner is closed to it", r.get('why') == 'owner', r)
    codes = [call('GET', '/api/collections/%s/records' % c, token=tok)[0] for c in ('coach_access', 'coach_invites', 'coach_config')]
    st5, r5 = call('POST', '/api/collections/coach_access/records', {'user': uid, 'role': 'owner'}, tok)
    check('it cannot read the lists of who is invited, or write itself in', all(c >= 400 for c in codes) and st5 >= 400, (codes, st5))

    # ---------------- one real question: let in by the admin, or, where the coach is open, simply asked ----------------
    if (is_open and os.environ.get('PAY') == '1') or (not is_open and os.environ.get('EM') and os.environ.get('PW')):
        if not is_open:
            st, a = call('POST', '/api/collections/_superusers/auth-with-password', {'identity': os.environ['EM'], 'password': os.environ['PW']})
            st, r = call('POST', '/api/collections/coach_access/records', {'user': uid, 'role': 'guest', 'by': ''}, a.get('token', ''))
            check('the admin lets the throwaway user in', st == 200, (st, r))
        st, r = call('GET', '/api/setim/coach', token=tok)
        left0 = r.get('left') or {}
        check('now it is told how many answers are left today', r.get('access') is True and left0.get('total', 0) > 0 and r.get('limit', 0) > 0, r)

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

        st, r = call('GET', mine, token=tok)
        row = (r.get('items') or [{}])[0]
        ok = st == 200 and len(r.get('items') or []) == 1 and row.get('cheap') == 1 and (row.get('tin') or 0) > 0 and (row.get('tout') or 0) > 0 and (row.get('cost') or 0) > 0
        check('the usage row: one small answer, its tokens and its cost', ok, (st, r))
        if ok:
            print('      tokens in %d, out %d, cost %.4f USD' % (row['tin'], row['tout'], row['cost'] / 1e6))
        st, r = call('GET', '/api/setim/coach', token=tok)
        check('the count of answers left went down by one', (r.get('left') or {}).get('total') == left0.get('total', 0) - 1, r)
        if r.get('usd'):
            check("and the cost is on the person's own count, with nothing left of what was put aside", 0 < r['usd'].get('used', 0) < 0.01 and abs(r['usd']['used'] - row.get('cost', 0) / 1e6) < 0.0001, (r.get('usd'), row.get('cost')))
        st2, _ = call('PATCH', '/api/collections/coach_usage/records/' + str(row.get('id')), {'cheap': 0}, tok)
        st3, _ = call('DELETE', '/api/collections/coach_usage/records/' + str(row.get('id')), None, tok)
        check('the person cannot reset or delete the usage row', st2 >= 400 and st3 >= 400, (st2, st3))
    else:
        print('      (%s: the real question was not asked, and nothing was spent)' % ('no PAY=1 in the environment' if is_open else 'no admin password in the environment'))
finally:
    st, r = call('DELETE', '/api/collections/users/records/' + uid, None, tok)
    check('the throwaway user deletes itself', st in (200, 204), (st, r))
    st, r = call('POST', '/api/collections/users/auth-with-password', {'identity': email, 'password': pw})
    check('and is gone', st == 400, (st, r))

print('\n%s (%d failed)' % ('ALL PASSED' if not fails else 'SOME CHECKS FAILED', fails))
sys.exit(1 if fails else 0)
