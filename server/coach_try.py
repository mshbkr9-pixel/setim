# -*- coding: utf-8 -*-
"""End-to-end check of the coach hook against a real PocketBase, with no request to the Claude API and no cost: this script is
also the stand-in for that API. It listens on 127.0.0.1:<port>, answers in the shape of POST /v1/messages, and looks at what the
hook sent. The hook must have been started with that address in its coach.json ("apiUrl") and with ANTHROPIC_API_KEY=try-key;
`coach_setup.sh --try` does both, with small limits (cheap 3, smart 1, deep 1, img 1) so that the limits can be seen working.

Usage:  TRY_OWNER_CODE=<code> python -I -X utf8 coach_try.py <PB_URL> <stand-in port>
        e.g.  python -I -X utf8 coach_try.py http://127.0.0.1:8099 8098       (what coach_setup.sh --try runs)
        TRY_OWNER_CODE=<code> python -I -X utf8 coach_try.py <PB_URL> <stand-in port> --spent
        the second pass of coach_setup.sh --try. The first pass ends by spending more than the day's budget, and its
        people delete their accounts. A new person must still be refused: the day's count has to outlive the account,
        or deleting accounts would be a way around the budget.

TRY_OWNER_CODE is the code of an owner's invitation link, made with coach_owner.py (coach_setup.sh --try makes one for each
pass). Apart from that the script needs no admin password: everything goes through the same doors the app uses. The test users
delete themselves at the end. Exit code 0 only when every step passed.
"""
import json, os, re, secrets, sys, threading, urllib.error, urllib.parse, urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

URL, PORT = sys.argv[1].rstrip('/'), int(sys.argv[2])
OWNER_CODE = os.environ.get('TRY_OWNER_CODE', '')
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
fails, seen = 0, []

class FakeClaude(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get('content-length') or 0)) or b'{}')
        seen.append({'path': self.path, 'key': self.headers.get('x-api-key'), 'version': self.headers.get('anthropic-version'), 'beta': self.headers.get('anthropic-beta'), 'body': body})
        last = body['messages'][-1]['content']
        text = [b for b in last if b.get('type') == 'text'][-1]['text'] if isinstance(last, list) else str(last)
        out = {'say': 'תשובת ניסיון', 'acts': [{'t': 'remember', 'text': 'בדיקה'}] if 'תזכור' in text else []}
        # one question is made to cost about ten dollars, more than any daily budget the owner may set, so that the budget can be seen closing the door;
        # another about 45 cents, most of the half dollar a person gets in the part about the coach being open to everyone
        msg = {'id': 'msg_try', 'type': 'message', 'role': 'assistant', 'model': body.get('model'), 'stop_reason': 'end_turn',
               'content': [{'type': 'thinking', 'thinking': '', 'signature': 'x'}, {'type': 'text', 'text': json.dumps(out, ensure_ascii=False)}],
               'usage': {'input_tokens': 100000000 if 'יקרה מאוד' in text else (4500000 if 'יקרה קצת' in text else 1500), 'cache_read_input_tokens': 2000, 'output_tokens': 200}}
        raw = json.dumps(msg, ensure_ascii=False).encode('utf-8')
        self.send_response(200); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(raw))); self.end_headers(); self.wfile.write(raw)

srv = HTTPServer(('127.0.0.1', PORT), FakeClaude)
threading.Thread(target=srv.serve_forever, daemon=True).start()

def call(method, path, body=None, token=None):
    req = urllib.request.Request(URL + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json', **({'Authorization': token} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
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
    print(('PASS  ' if ok else 'FAIL  ') + label + ((' -> ' + str(detail)[:500]) if detail and not ok else ''))

def person(name):
    """a throwaway account, signed in"""
    email, pw = 'coachtry-' + secrets.token_hex(5) + '@example.test', secrets.token_urlsafe(12)
    st, r = call('POST', '/api/collections/users/records', {'email': email, 'password': pw, 'passwordConfirm': pw, 'name': name})
    st2, r2 = call('POST', '/api/collections/users/auth-with-password', {'identity': email, 'password': pw})
    return {'ok': st == 200 and st2 == 200 and bool(r2.get('token')), 'tok': r2.get('token', ''), 'id': (r2.get('record') or {}).get('id', ''), 'name': name}
ask = lambda who, body: call('POST', '/api/setim/coach', body, who['tok'])[1]
info = lambda who: call('GET', '/api/setim/coach', token=who['tok'])[1]
join = lambda who, code: call('POST', '/api/setim/coach/join', {'code': code}, who['tok'])[1]
admin = lambda who, body: call('POST', '/api/setim/coach/admin', body, who['tok'])[1]
def leave(*people):
    ok = True
    for who in people:
        st, r = call('DELETE', '/api/collections/users/records/' + who['id'], None, who['tok']); ok = ok and st in (200, 204)
    return ok
def finish():
    srv.shutdown()
    print('\n%s (%d failed, %d requests reached the stand-in)' % ('ALL PASSED' if not fails else 'SOME CHECKS FAILED', fails, len(seen)))
    sys.exit(1 if fails else 0)

st, r = call('GET', '/api/health'); check('server is up', st == 200, (st, r))
st, r = call('GET', '/api/setim/coach'); check('coach hook answers, and says it is switched on, and for invited people only', st == 200 and r.get('ok') is True and r.get('on') is True and r.get('open') is False and r.get('access') is False and r.get('left') is None and r.get('usd') is None, (st, r))
st, r = call('POST', '/api/setim/coach', {'text': 'שלום'}); check('nobody is answered without signing in', st == 200 and r.get('ok') is False and r.get('why') == 'auth' and not seen, (st, r))

if '--spent' in sys.argv[3:]:
    P = person('late'); check('sign up a throwaway user, and let it in with an owner link', P['ok'] and join(P, OWNER_CODE).get('ok') is True, P['ok'])
    r = info(P)
    check("the day's spending is still counted after the accounts that spent it were deleted", r.get('on') is True and r.get('left') == {'cheap': 0, 'smart': 0, 'deep': 0, 'img': 0, 'total': 0}, r)
    r = ask(P, {'text': 'מה כדאי לי לאכול אחרי האימון?'})
    check('over the daily budget for everyone the hook says so and sends nothing', r.get('ok') is False and r.get('why') == 'budget' and not seen, (r, len(seen)))
    check('the throwaway user deletes itself', leave(P))
    finish()

# ---------------- who may ask ----------------
S, O, H = person('guest'), person('owner'), person('second')
check('sign up three throwaway users', S['ok'] and O['ok'] and H['ok'])
r = ask(S, {'text': 'מה כדאי לי לאכול אחרי האימון?'}); r2 = info(S)
check('someone who signed up but was not invited is told so, and nothing is sent', r.get('ok') is False and r.get('why') == 'invite' and not seen and r2.get('access') is False and r2.get('left') is None, (r, r2))
check('a made-up code opens nothing', join(S, 'x' * 24).get('why') == 'code' and join(S, 'short').get('why') == 'code')
r = join(O, OWNER_CODE); check("the owner's link makes one owner", r.get('ok') is True and r.get('owner') is True and info(O).get('owner') is True, r)
check("the owner's link cannot be used a second time, and the owner's corner is closed to everyone else", join(S, OWNER_CODE).get('why') == 'used' and admin(S, {'do': 'state'}).get('why') == 'owner' and call('POST', '/api/setim/coach/admin', {'do': 'state'})[1].get('why') == 'auth')
inv = admin(O, {'do': 'invite'})
check('the owner makes an invitation link', inv.get('ok') is True and re.match(r'^[A-Za-z0-9]{24}$', inv.get('code') or '') is not None and inv.get('pending') == 1, inv)
r = join(S, inv.get('code', '')); check('the invited person opens it and is in', r.get('ok') is True and r.get('owner') is False and info(S).get('access') is True, r)
check('the same link does not let a second person in', join(H, inv.get('code', '')).get('why') == 'used' and ask(H, {'text': 'שלום'}).get('why') == 'invite' and not seen)

# ---------------- asking, and the limits of each kind ----------------
r = ask(S, {'text': 'מה כדאי לי לאכול אחרי האימון?', 'snap': {'today': '2026-11-12', 'me': {'name': 'ניסיון'}}, 'hist': [{'r': 'u', 't': 'היי'}, {'r': 'a', 't': 'היי.'}]})
check('a short question is answered through the small model', r.get('ok') is True and r.get('say') == 'תשובת ניסיון' and r.get('tier') == 'cheap' and r.get('acts') == [], r)
q = seen[-1] if seen else {}
check('the hook sent a well-formed request: key in a header, API version, model, effort, the answer schema, a cached system prompt',
      q.get('key') == 'try-key' and q.get('version') == '2026-10-21' and q.get('beta') is None and q.get('path') == '/v1/messages'
      and q['body']['model'] == 'claude-haiku-5-5' and q['body']['output_config']['effort'] == 'low' and q['body']['output_config']['format']['type'] == 'json_schema'
      and q['body']['system'][0]['cache_control'] == {'type': 'ephemeral'} and 'chicken-rice-salad' in q['body']['system'][0]['text']
      and [m['role'] for m in q['body']['messages']] == ['user', 'assistant', 'user'] and q['body']['messages'][-1]['content'][0]['text'].startswith('DATA'), q)
r = ask(S, {'text': 'תבנה לי תפריט לשבוע בתקציב של 350 שקל ותזכור את זה'})
check('a plan with a budget goes to the large model, with the fallback opt-in, and an action comes back checked', r.get('ok') is True and r.get('tier') == 'smart' and seen[-1]['body']['model'] == 'claude-opus-5-5'
      and seen[-1]['body'].get('fallbacks') == 'default' and seen[-1]['beta'] == 'server-side-fallback-2026-07-01' and r.get('acts') == [{'t': 'remember', 'text': 'בדיקה'}], (r, seen[-1]['beta']))
r = ask(S, {'text': 'תבנה לי תפריט לשבוע בתקציב של 350 שקל'})
check('past the limit for the large model, the answer steps down to the small one', r.get('ok') is True and r.get('tier') == 'cheap' and r.get('wanted') == 'smart' and seen[-1]['body']['model'] == 'claude-haiku-5-5', r)
r = ask(S, {'text': '', 'img': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=='})
check('a photo is sent as an image block', r.get('ok') is True and any(b.get('type') == 'image' and b['source']['media_type'] == 'image/jpeg' for b in seen[-1]['body']['messages'][-1]['content']), r)
n = len(seen)
r = ask(S, {'text': 'ועוד שאלה קצרה'}); check('past the limit of a kind the hook says so and sends nothing', r.get('ok') is False and r.get('why') == 'quota' and len(seen) == n, (r, len(seen), n))
r = ask(S, {'text': 'x' * 5000}); check('an oversized message is refused before the model', r.get('why') == 'big' and len(seen) == n, r)

f = urllib.parse.quote('user="%s"' % S['id'])
st, r = call('GET', '/api/collections/coach_usage/records?perPage=5&filter=' + f, token=S['tok'])
row = (r.get('items') or [{}])[0]
check('the usage row: three small answers, one large, one photo, tokens and a cost', st == 200 and len(r.get('items') or []) == 1 and row.get('cheap') == 3 and row.get('smart') == 1 and row.get('img') == 1 and row.get('tin') == 4 * 3500 and row.get('tout') == 800 and row.get('cost', 0) > 0, (st, r))
# three answers of the small model (1500 tokens in, 2000 read from the cache, 200 out: 270 millionths of a dollar each) and one of the large (10,400)
check('the cost on the row is what the answers cost: nothing is left of what was put aside for them', row.get('cost') == 3 * 270 + 10400, row.get('cost'))
r = info(S); check('an invited person sees dollars of their own, and what they used of them', (r.get('usd') or {}).get('cap') == 2 and (r.get('usd') or {}).get('per') == 'all' and (r.get('usd') or {}).get('used') == 0.0112 and (r.get('usd') or {}).get('out') is False and info(O).get('usd') is None, r)
r = info(S); check('the app can ask how many answers are left', r.get('left') == {'cheap': 0, 'smart': 0, 'deep': 1, 'img': 0, 'total': 16} and r.get('limit') == 20, r)
st2, r2 = call('PATCH', '/api/collections/coach_usage/records/' + str(row.get('id')), {'cheap': 0}, S['tok'])
st3, r3 = call('POST', '/api/collections/coach_usage/records', {'user': S['id'], 'day': '2026-01-01', 'cheap': 0}, S['tok'])
st4, r4 = call('DELETE', '/api/collections/coach_usage/records/' + str(row.get('id')), None, S['tok'])
check('a person cannot reset, add or delete their own usage row', st2 >= 400 and st3 >= 400 and st4 >= 400, (st2, st3, st4))
codes = [call('GET', '/api/collections/%s/records' % c, token=S['tok'])[0] for c in ('coach_access', 'coach_invites', 'coach_config')]
st5, r5 = call('POST', '/api/collections/coach_access/records', {'user': H['id'], 'role': 'owner'}, H['tok'])
check('nobody can read the lists of who is invited, or write themselves in', all(c >= 400 for c in codes) and st5 >= 400 and info(H).get('access') is False, (codes, st5))

# ---------------- the owner's corner ----------------
st_ = admin(O, {'do': 'state'}); mine = [p for p in st_.get('people') or [] if p.get('id') == S['id']]
check('the owner sees who is in and what each asked today', st_.get('ok') is True and len(st_.get('people') or []) == 2 and len(mine) == 1 and mine[0].get('today') == 4 and mine[0].get('name') == 'guest' and '@' in (mine[0].get('email') or '')
      and (st_.get('today') or {}).get('n') == 4 and st_.get('total') == 20 and st_.get('dailyUsd') == 3, st_)
check('limits outside the allowed range are refused', admin(O, {'do': 'limits', 'total': 0, 'dailyUsd': 3}).get('why') == 'bad' and admin(O, {'do': 'limits', 'total': 20, 'dailyUsd': 500}).get('why') == 'bad' and admin(S, {'do': 'limits', 'total': 99, 'dailyUsd': 3}).get('why') == 'owner')
inv2 = admin(O, {'do': 'invite'}); join(H, inv2.get('code', ''))
r = admin(O, {'do': 'limits', 'total': 1, 'dailyUsd': 3}); n = len(seen)
a1, a2 = ask(H, {'text': 'שאלה ראשונה'}), ask(H, {'text': 'שאלה שנייה'})
check('the owner sets one answer a day for each person, and the second question of the day is refused', r.get('total') == 1 and info(H).get('limit') == 1 and a1.get('ok') is True and a2.get('why') == 'quota' and (a2.get('left') or {}).get('total') == 0 and len(seen) == n + 1, (r, a1, a2))
r = admin(O, {'do': 'limits', 'total': 20, 'dailyUsd': 3}); check('and raises it again', r.get('total') == 20 and ask(H, {'text': 'שאלה שלישית'}).get('ok') is True, r)
r = admin(O, {'do': 'revoke', 'user': H['id']}); n = len(seen)
check('someone the owner removes gets no more answers, and the old link does not let them back in', len(r.get('people') or []) == 2 and ask(H, {'text': 'ועוד אחת'}).get('why') == 'invite' and join(H, inv2.get('code', '')).get('why') == 'used' and len(seen) == n, r)
check('the owner cannot be removed', len(admin(O, {'do': 'revoke', 'user': O['id']}).get('people') or []) == 2 and info(O).get('owner') is True)

# ---------------- open to everyone, each person within dollars of their own ----------------
N = person('new'); n = len(seen)
check('before the coach is opened, a new account is refused like any other that was not invited', N['ok'] and ask(N, {'text': 'שאלה'}).get('why') == 'invite' and len(seen) == n)
check('the gate takes only what makes sense, and only from the owner', admin(O, {'do': 'gate', 'open': True, 'userUsd': 0.1}).get('why') == 'bad' and admin(O, {'do': 'gate', 'open': 'yes', 'userUsd': 2}).get('why') == 'bad' and admin(N, {'do': 'gate', 'open': True, 'userUsd': 2}).get('why') == 'owner' and info(N).get('access') is False)
r = admin(O, {'do': 'gate', 'open': True, 'userUsd': 0.5}); r2 = info(N)
check('the owner opens the coach to everyone, with half a dollar for each person', r.get('ok') is True and r.get('open') is True and r.get('userUsd') == 0.5 and r.get('total') == 20 and r.get('dailyUsd') == 3
      and r2.get('open') is True and r2.get('access') is True and r2.get('owner') is False and r2.get('usd') == {'cap': 0.5, 'used': 0, 'per': 'all', 'out': False} and (r2.get('left') or {}).get('total') == 20, (r, r2))
check('someone who is not signed in is told that it is open, and still not answered', call('GET', '/api/setim/coach')[1].get('open') is True and call('POST', '/api/setim/coach', {'text': 'שלום'})[1].get('why') == 'auth')
a1 = ask(N, {'text': 'שאלה יקרה קצת'}); u1 = (info(N).get('usd') or {})
check('a person who was never invited is answered, and the cost goes onto their own count', a1.get('ok') is True and a1.get('tier') == 'cheap' and len(seen) == n + 1 and 0.44 < u1.get('used', 0) < 0.46 and u1.get('out') is False, (a1, u1))
a2 = ask(N, {'text': 'תבנה לי תפריט לשבוע בתקציב של 350 שקל'})
check('with too little left for the large model, the answer steps down to the small one', a2.get('ok') is True and a2.get('tier') == 'cheap' and a2.get('wanted') == 'smart' and seen[-1]['body']['model'] == 'claude-haiku-5-5', a2)
a3 = ask(N, {'text': 'ועוד שאלה יקרה קצת'}); n = len(seen); a4 = ask(N, {'text': 'ועוד אחת'}); r = info(N)
check('past their own dollars the person is told so, and nothing more is sent', a3.get('ok') is True and a4.get('ok') is False and a4.get('why') == 'spent' and 'המכסה שלך' in (a4.get('say') or '') and len(seen) == n
      and (r.get('usd') or {}).get('out') is True and (r.get('usd') or {}).get('used') == 0.5 and r.get('left') == {'cheap': 0, 'smart': 0, 'deep': 0, 'img': 0, 'total': 0}, (a3, a4, r))
st_ = admin(O, {'do': 'state'}); new = [p for p in st_.get('people') or [] if p.get('id') == N['id']]
check('the owner sees that person on the list of who asked today, marked as not invited', len(new) == 1 and new[0].get('invited') is False and new[0].get('today') == 3 and all(p.get('invited') is True for p in st_.get('people') if p.get('id') in (S['id'], O['id'])), st_)
n = len(seen); r = ask(H, {'text': 'ואני?'})
check("each person's dollars are their own: someone else is still answered", r.get('ok') is True and len(seen) == n + 1, r)
r = admin(O, {'do': 'gate', 'open': False, 'userUsd': 0.5}); n = len(seen)
check('the owner closes it again, and those who were not invited are refused', r.get('open') is False and ask(H, {'text': 'ועכשיו?'}).get('why') == 'invite' and info(N).get('access') is False and info(S).get('access') is True and len(seen) == n, r)
check('the new user deletes itself', leave(N))

# ---------------- the daily budget for everyone (the last thing: after it nobody is answered until tomorrow) ----------------
n = len(seen); r = ask(O, {'text': 'שאלה יקרה מאוד'}); r2 = ask(S, {'text': 'ועוד שאלה'}); r3 = info(S)
check("once the day's budget for everyone is spent, the next person is refused and nothing more is sent", r.get('ok') is True and r2.get('why') == 'budget' and len(seen) == n + 1
      and r3.get('left') == {'cheap': 0, 'smart': 0, 'deep': 0, 'img': 0, 'total': 0}, (r, r2, r3))

check('the throwaway users delete themselves', leave(S, H, O))
finish()
