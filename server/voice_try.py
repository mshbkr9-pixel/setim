# -*- coding: utf-8 -*-
"""End-to-end check of the voice hook: signs up a throwaway user, gives it a journal and a voice code, speaks to
/api/setim/voice the way the phone shortcut does, and looks at what the server stored.

Usage:  python -I -X utf8 voice_try.py <PB_URL>
        e.g. the local stand-in (node server/mock_pb.js):  python -I -X utf8 voice_try.py http://127.0.0.1:8090
        or a temporary PocketBase started by voice_setup.sh --try

It needs no admin password: everything goes through the same doors the app uses. The test user deletes itself at the end
(with its documents and its code). Run it against a temporary instance, or accept one extra user for a few seconds.
Exit code 0 only when every step passed.
"""
import hashlib, json, secrets, sys, urllib.error, urllib.parse, urllib.request

URL = sys.argv[1].rstrip('/')
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
fails = 0

def call(method, path, body=None, token=None):
    req = urllib.request.Request(URL + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json', **({'Authorization': token} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
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
    print(('PASS  ' if ok else 'FAIL  ') + label + ((' -> ' + str(detail)) if detail and not ok else ''))

def say(key, text, **extra):
    st, r = call('POST', '/api/setim/voice', dict({'key': key, 'text': text}, **extra))
    return st, r

def doc(token, uid, key):
    f = urllib.parse.quote('user="%s" && key="%s"' % (uid, key))
    st, r = call('GET', '/api/collections/docs/records?perPage=1&filter=' + f, token=token)
    items = r.get('items') or []
    return items[0]['data'] if items else None

st, r = call('GET', '/api/health'); check('server is up', st == 200, (st, r))
st, r = call('GET', '/api/setim/voice'); check('voice hook answers', st == 200 and r.get('ok') is True, (st, r))

email = 'voicetry-' + secrets.token_hex(5) + '@example.test'
pw = secrets.token_urlsafe(12)
st, r = call('POST', '/api/collections/users/records', {'email': email, 'password': pw, 'passwordConfirm': pw, 'name': 'voice try'})
check('sign up a throwaway user', st == 200, (st, r))
st, r = call('POST', '/api/collections/users/auth-with-password', {'identity': email, 'password': pw})
check('sign in', st == 200 and r.get('token'), (st, r))
tok, uid = r.get('token', ''), (r.get('record') or {}).get('id', '')

log = {'sessions': [{'d': '2025-01-06', 'sets': [{'r': 10, 'w': 57.5, 't': True}, {'r': 9, 'w': 57.5, 't': True}]}]}
st, r = call('POST', '/api/collections/docs/records', {'user': uid, 'key': 'log-bench-press', 'data': log}, tok)
check('a journal document exists', st == 200, (st, r))

key = 'stm_' + ''.join(secrets.choice('abcdefghijklmnopqrstuvwxyz0123456789') for _ in range(40))
st, r = call('POST', '/api/collections/voice_keys/records', {'user': uid, 'hash': hashlib.sha256(key.encode()).hexdigest(), 'label': 'try'}, tok)
check('a voice code is registered (only its hash is sent)', st == 200, (st, r))
st, r = call('POST', '/api/collections/voice_keys/records', {'user': uid, 'hash': 'not-a-hash', 'label': 'bad'}, tok)
check('a malformed hash is refused', st == 400, (st, r))

st, r = say(key, 'לחיצת חזה במוט 10 חזרות 60 קילו')
check('a Hebrew sentence is logged', st == 200 and r.get('ok') is True and 'נרשם' in r.get('say', '') and 'שיא חדש' in r.get('say', ''), (st, r))
st, r = say(key, 'עוד סט')
check('"another set" continues the same exercise', st == 200 and r.get('ok') is True and 'סט 2' in r.get('say', ''), (st, r))
st, r = say(key, 'squat, 5 reps, 100 kilos')
check('an English sentence is logged and answered in English', st == 200 and r.get('ok') is True and r.get('say', '').startswith('Logged'), (st, r))

inbox = doc(tok, uid, 'vinbox')
check('the inbox is a real JSON document with three items', isinstance(inbox, dict) and len(inbox.get('items', [])) == 3, inbox)
if isinstance(inbox, dict) and inbox.get('items'):
    it = inbox['items'][0]
    check('an item carries the exercise, the date and the set', it.get('ex') == 'bench-press' and it.get('sets') == [{'r': 10, 'w': 60}] and len(it.get('d', '')) == 10, it)
check('the journal document itself was not touched', doc(tok, uid, 'log-bench-press') == log)

st, r = say(key, 'בטל')
check('"undo" removes the last waiting item', st == 200 and r.get('ok') is True, (st, r))
inbox = doc(tok, uid, 'vinbox') or {}
check('two items are left', len(inbox.get('items', [])) == 2, inbox)

ids = {it['id']: 1 for it in inbox.get('items', [])}
st, r = call('POST', '/api/collections/docs/records', {'user': uid, 'key': 'vdone', 'data': {'ids': ids, 'last': []}}, tok)
check('the app marks the items as taken', st == 200, (st, r))
st, r = say(key, 'בטל')
check('an item the app already took cannot be undone by voice', st == 200 and r.get('ok') is False and 'כבר נכנס' in r.get('say', ''), (st, r))

st, r = say('stm_' + 'a' * 40, 'squat 5 reps 100 kilos')
check('an unknown code is refused with a spoken explanation', st == 200 and r.get('ok') is False and r.get('why') == 'key', (st, r))
st, r = say(key, 'בלה בלה בלה')
check('nonsense is not logged', st == 200 and r.get('ok') is False, (st, r))
st, r = call('GET', '/api/collections/voice_keys/records?perPage=5', token=None)
check('voice codes cannot be listed without signing in', st in (200, 400, 401, 403) and not (r.get('items') or []), (st, r))

# ---- v14: the day's numbers from the phone's health app (the watch fills it) ----
st, r = call('GET', '/api/setim/voice')
check('the info answer has a place for the health shortcut', st == 200 and r.get('v') == 3 and 'health' in r, (st, r))
st, r = call('POST', '/api/setim/voice', {'key': key, 'kind': 'health', 'steps': 9412, 'hr': 58, 'kcal': '540', 'sleep': 7.5})
check('steps, a heart rate, calories and sleep from the watch are taken', st == 200 and r.get('ok') is True and '9412' in r.get('say', '') and (r.get('item') or {}).get('st') == 9412 and r['item'].get('hr') == 58 and r['item'].get('kc') == 540 and r['item'].get('sl') == 7.5, (st, r))
hb = doc(tok, uid, 'hinbox') or {}
check('they wait in an inbox of their own, one item for the day', len(hb.get('items', [])) == 1 and hb['items'][0].get('st') == 9412 and len(hb['items'][0].get('d', '')) == 10, hb)
st, r = call('POST', '/api/setim/voice', {'key': key, 'kind': 'health', 'steps': 10020})
hb = doc(tok, uid, 'hinbox') or {}
check('a later reading of the same day takes its place', st == 200 and r.get('ok') is True and len(hb.get('items', [])) == 1 and hb['items'][0].get('st') == 10020, (r, hb))
st, r = call('POST', '/api/setim/voice', {'key': key, 'kind': 'health', 'steps': 999999, 'hr': 500})
check('numbers that make no sense are refused, with words to say', st == 200 and r.get('ok') is False and r.get('why') == 'empty' and r.get('say'), (st, r))
st, r = call('POST', '/api/setim/voice', {'key': key, 'kind': 'health', 'steps': 5000, 'date': '2020-01-01'})
hb = doc(tok, uid, 'hinbox') or {}
check('a date far in the past is taken as today', st == 200 and r.get('ok') is True and len(hb.get('items', [])) == 1 and hb['items'][0].get('st') == 5000, (r, hb))
st, r = call('POST', '/api/setim/voice', {'key': 'stm_' + 'a' * 40, 'kind': 'health', 'steps': 5000})
check('an unknown code is refused here too', st == 200 and r.get('ok') is False and r.get('why') == 'key', (st, r))
check('the inbox of the sets was not touched by any of it', len((doc(tok, uid, 'vinbox') or {}).get('items', [])) == 2)
st, r = say(key, 'עשיתי 10,000 צעדים')
check('a spoken sentence about steps is sent to the app and is not stored as a set', st == 200 and r.get('ok') is False and r.get('why') == 'app' and len((doc(tok, uid, 'vinbox') or {}).get('items', [])) == 2, (st, r))

st, r = call('DELETE', '/api/collections/users/records/' + uid, token=tok)
check('the throwaway user deletes itself', st in (200, 204), (st, r))

print('\n%s (%d failed)' % ('ALL PASSED' if not fails else 'SOME STEPS FAILED', fails))
sys.exit(1 if fails else 0)
