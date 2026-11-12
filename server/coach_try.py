# -*- coding: utf-8 -*-
"""End-to-end check of the coach hook against a real PocketBase, with no request to the Claude API and no cost: this script is
also the stand-in for that API. It listens on 127.0.0.1:<port>, answers in the shape of POST /v1/messages, and looks at what the
hook sent. The hook must have been started with that address in its coach.json ("apiUrl") and with ANTHROPIC_API_KEY=try-key;
`coach_setup.sh --try` does both, with small limits (cheap 3, smart 1, deep 1, img 1) so that the limits can be seen working.

Usage:  python -I -X utf8 coach_try.py <PB_URL> <stand-in port>
        e.g.  python -I -X utf8 coach_try.py http://127.0.0.1:8099 8098       (what coach_setup.sh --try runs)
        python -I -X utf8 coach_try.py <PB_URL> <stand-in port> --spent
        the second pass of coach_setup.sh --try, after it has set a daily budget smaller than what the first pass cost:
        a new person must be refused, although the person who spent has deleted the account. The day's count has to
        outlive the account, or deleting accounts would be a way around the budget.

It needs no admin password: everything goes through the same doors the app uses. The test user deletes itself at the end.
Exit code 0 only when every step passed.
"""
import json, secrets, sys, threading, urllib.error, urllib.parse, urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

URL, PORT = sys.argv[1].rstrip('/'), int(sys.argv[2])
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
        msg = {'id': 'msg_try', 'type': 'message', 'role': 'assistant', 'model': body.get('model'), 'stop_reason': 'end_turn',
               'content': [{'type': 'thinking', 'thinking': '', 'signature': 'x'}, {'type': 'text', 'text': json.dumps(out, ensure_ascii=False)}],
               'usage': {'input_tokens': 1500, 'cache_read_input_tokens': 2000, 'output_tokens': 200}}
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

st, r = call('GET', '/api/health'); check('server is up', st == 200, (st, r))
st, r = call('GET', '/api/setim/coach'); check('coach hook answers, and says it is switched on', st == 200 and r.get('ok') is True and r.get('on') is True and r.get('left') is None, (st, r))
st, r = call('POST', '/api/setim/coach', {'text': 'שלום'}); check('nobody is answered without signing in', st == 200 and r.get('ok') is False and r.get('why') == 'auth' and not seen, (st, r))

email = 'coachtry-' + secrets.token_hex(5) + '@example.test'
pw = secrets.token_urlsafe(12)
st, r = call('POST', '/api/collections/users/records', {'email': email, 'password': pw, 'passwordConfirm': pw, 'name': 'coach try'})
check('sign up a throwaway user', st == 200, (st, r))
st, r = call('POST', '/api/collections/users/auth-with-password', {'identity': email, 'password': pw})
check('sign in', st == 200 and r.get('token'), (st, r))
tok, uid = r.get('token', ''), (r.get('record') or {}).get('id', '')
ask = lambda body: call('POST', '/api/setim/coach', body, tok)

if '--spent' in sys.argv[3:]:
    st, r = call('GET', '/api/setim/coach', token=tok)
    check("the day's spending is still counted after the account that spent it was deleted", r.get('on') is True and r.get('left') == {'cheap': 0, 'smart': 0, 'deep': 0, 'img': 0}, r)
    st, r = ask({'text': 'מה כדאי לי לאכול אחרי האימון?'})
    check('over the daily budget for everyone the hook says so and sends nothing', r.get('ok') is False and r.get('why') == 'budget' and not seen, (r, len(seen)))
    st, r = call('DELETE', '/api/collections/users/records/' + uid, None, tok); check('the throwaway user deletes itself', st in (200, 204), (st, r))
    srv.shutdown()
    print('\n%s (%d failed, %d requests reached the stand-in)' % ('ALL PASSED' if not fails else 'SOME CHECKS FAILED', fails, len(seen)))
    sys.exit(1 if fails else 0)

st, r = ask({'text': 'מה כדאי לי לאכול אחרי האימון?', 'snap': {'today': '2026-11-12', 'me': {'name': 'ניסיון'}}, 'hist': [{'r': 'u', 't': 'היי'}, {'r': 'a', 't': 'היי.'}]})
check('a short question is answered through the small model', st == 200 and r.get('ok') is True and r.get('say') == 'תשובת ניסיון' and r.get('tier') == 'cheap' and r.get('acts') == [], (st, r))
q = seen[-1] if seen else {}
check('the hook sent a well-formed request: key in a header, API version, model, effort, the answer schema, a cached system prompt',
      q.get('key') == 'try-key' and q.get('version') == '2026-10-21' and q.get('beta') is None and q.get('path') == '/v1/messages'
      and q['body']['model'] == 'claude-haiku-5-5' and q['body']['output_config']['effort'] == 'low' and q['body']['output_config']['format']['type'] == 'json_schema'
      and q['body']['system'][0]['cache_control'] == {'type': 'ephemeral'} and 'chicken-rice-salad' in q['body']['system'][0]['text']
      and [m['role'] for m in q['body']['messages']] == ['user', 'assistant', 'user'] and q['body']['messages'][-1]['content'][0]['text'].startswith('DATA'), q)
st, r = ask({'text': 'תבנה לי תפריט לשבוע בתקציב של 350 שקל ותזכור את זה'})
check('a plan with a budget goes to the large model, with the fallback opt-in, and an action comes back checked', r.get('ok') is True and r.get('tier') == 'smart' and seen[-1]['body']['model'] == 'claude-opus-5-5'
      and seen[-1]['body'].get('fallbacks') == 'default' and seen[-1]['beta'] == 'server-side-fallback-2026-07-01' and r.get('acts') == [{'t': 'remember', 'text': 'בדיקה'}], (r, seen[-1]['beta']))
st, r = ask({'text': 'תבנה לי תפריט לשבוע בתקציב של 350 שקל'})
check('past the limit for the large model, the answer steps down to the small one', r.get('ok') is True and r.get('tier') == 'cheap' and r.get('wanted') == 'smart' and seen[-1]['body']['model'] == 'claude-haiku-5-5', r)
st, r = ask({'text': '', 'img': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=='})
check('a photo is sent as an image block', r.get('ok') is True and any(b.get('type') == 'image' and b['source']['media_type'] == 'image/jpeg' for b in seen[-1]['body']['messages'][-1]['content']), r)
n = len(seen)
st, r = ask({'text': 'ועוד שאלה קצרה'}); check('past the daily limit the hook says so and sends nothing', r.get('ok') is False and r.get('why') == 'quota' and len(seen) == n, (r, len(seen), n))
st, r = ask({'text': 'x' * 5000}); check('an oversized message is refused before the model', r.get('why') == 'big' and len(seen) == n, r)

f = urllib.parse.quote('user="%s"' % uid)
st, r = call('GET', '/api/collections/coach_usage/records?perPage=5&filter=' + f, token=tok)
row = (r.get('items') or [{}])[0]
check('the usage row: three small answers, one large, one photo, tokens and a cost', st == 200 and len(r.get('items') or []) == 1 and row.get('cheap') == 3 and row.get('smart') == 1 and row.get('img') == 1 and row.get('tin') == 4 * 3500 and row.get('tout') == 800 and row.get('cost', 0) > 0, (st, r))
st, r = call('GET', '/api/setim/coach', token=tok); check('the app can ask how many answers are left', r.get('left') == {'cheap': 0, 'smart': 0, 'deep': 1, 'img': 0}, r)
st2, r2 = call('PATCH', '/api/collections/coach_usage/records/' + str(row.get('id')), {'cheap': 0}, tok)
st3, r3 = call('POST', '/api/collections/coach_usage/records', {'user': uid, 'day': '2026-01-01', 'cheap': 0}, tok)
st4, r4 = call('DELETE', '/api/collections/coach_usage/records/' + str(row.get('id')), None, tok)
check('a person cannot reset, add or delete their own usage row', st2 >= 400 and st3 >= 400 and st4 >= 400, (st2, st3, st4))

st, r = call('DELETE', '/api/collections/users/records/' + uid, None, tok); check('the throwaway user deletes itself', st in (200, 204), (st, r))
srv.shutdown()
print('\n%s (%d failed, %d requests reached the stand-in)' % ('ALL PASSED' if not fails else 'SOME CHECKS FAILED', fails, len(seen)))
sys.exit(1 if fails else 0)
