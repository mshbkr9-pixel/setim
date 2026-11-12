# -*- coding: utf-8 -*-
"""The built app against the real server, the way a person with two phones would meet it: a target and a meal on the first
phone, signing up, the same data on the second phone, and one question to the coach that needs the model.

Every run creates a throwaway account on the live server, which the test deletes at the end (its documents go with it). The
coach answers invited people only, so without more the test stops after seeing that the new account is refused, and costs
nothing. With the admin's email and password in the environment (EM and PW) it lets the account in and asks one real question:
THAT COSTS MONEY (about a tenth of a cent, the small model), and the usage row stays, owned by nobody. Run it only when the
owner has agreed.

    [EM=... PW=...] python -X utf8 tests/live_v13.py [APP] [PB] [output folder]
    APP  where the app is served from. Default http://127.0.0.1:8793/index.html (the "v13-app" preview). After a deploy,
         https://getonekeyai.com/ checks the published app itself.
    PB   the server. Default https://getonekeyai.com. It matters only when the app runs from localhost (the app then takes
         the server's address from localStorage, gtdev:pb); a published app always talks to its own server.
Exit code 0 only when every check passed."""
import base64, json, os, re, secrets, sys, urllib.error, urllib.parse, urllib.request
from playwright.sync_api import sync_playwright

APP = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8793/index.html'
PBU = (sys.argv[2] if len(sys.argv) > 2 else 'https://getonekeyai.com').rstrip('/')
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out-live')
os.makedirs(OUT, exist_ok=True)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
LOCAL = re.match(r'^https?://(localhost|127\.0\.0\.1)[:/]', APP) is not None
EMAIL = 'uicheck-' + secrets.token_hex(5) + '@example.test'
PW = secrets.token_urlsafe(12)
QUESTION = 'מה כדאי לי לאכול אחרי האימון?'
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')      # one pixel: a stand-in for a picture of a plate
fails, errors = [], []

def check(label, ok, detail=''):
    if not ok:
        fails.append(label)
    print(('PASS  ' if ok else 'FAIL  ') + label + ((' -> ' + str(detail)[:600]) if (detail and not ok) else ''))
    return ok

def api(method, path, body=None, token=None):
    req = urllib.request.Request(PBU + path, method=method, data=json.dumps(body).encode() if body is not None else None,
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
            return e.code, {}

def phone(browser, name):
    ctx = browser.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=2, locale='he-IL', color_scheme='light',
                              user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
    ctx.add_init_script("try{ localStorage.setItem('gt:theme','light'); localStorage.setItem('gt:onboarded','1'); %s }catch(e){}"
                        % ("localStorage.setItem('gtdev:pb','%s');" % PBU if LOCAL else ''))
    page = ctx.new_page()
    posts = []
    page.on('pageerror', lambda e: errors.append('%s pageerror: %s' % (name, e)))
    page.on('console', lambda m: errors.append('%s console: %s' % (name, m.text)) if (m.type == 'error' and 'vibrate' not in m.text) else None)
    page.on('request', lambda r: posts.append(r.url) if (r.method == 'POST' and r.url.endswith('/api/setim/coach')) else None)
    page.goto(APP)
    page.wait_for_function("typeof S !== 'undefined' && S.ex && S.ex.length > 700 && FD.core", timeout=60000)
    page.wait_for_timeout(400)
    return ctx, page, posts

def account(page, mode):
    """the app's own sheet, typed into and tapped like a person would"""
    page.evaluate("m => authSheet(m)", mode); page.wait_for_timeout(800)
    if mode == 'signup':
        page.fill('#sheetBody input[type=text]', 'בדיקה')
    page.fill('#sheetBody input[type=email]', EMAIL)
    page.fill('#sheetBody input[type=password]', PW)
    page.click('#sheetBody .btn:has-text("%s") >> nth=0' % ('הרשמה' if mode == 'signup' else 'כניסה'))
    page.wait_for_function("PB.user && S.storageMode === 'pb'", timeout=45000)

def say(page, text):
    """one sentence in the chat box, and the coach's answer to it (an answer is the second message after the count before)"""
    n = page.evaluate("S.coach.msgs.length")
    page.fill('#dock .askbar textarea', text); page.click('#dock .askbar .go')
    page.wait_for_function("n => !CO.wait && S.coach.msgs.length >= n + 2", arg=n, timeout=120000)
    page.wait_for_timeout(500)
    return page.evaluate("S.coach.msgs.slice(-1)[0]")

created = False
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    try:
        # ---------------- the first phone ----------------
        ctx, page, posts = phone(browser, 'phone 1')
        ev = page.evaluate
        settle = lambda ms=500: page.wait_for_timeout(ms)
        goto = lambda h: (ev("h => { location.hash = h; }", h), settle())
        tabs = ev("[...document.querySelectorAll('#tabbar .tab')].map(t=>t.textContent)")
        check('the app opens with the three sectors', tabs == ['אימונים', 'תזונה', 'המאמן'], tabs)
        check('the app talks to the real server', ev("PB_URL") == PBU, ev("PB_URL"))
        ev("() => { S.profile={...S.profile,name:'בדיקה',weight:80,height:178,age:30,sex:'m',weekly:3}; save('profile',S.profile); render(); }"); settle()

        goto('#food'); page.click('#view .btn:has-text("קובעים יעד")'); settle(); page.click('.typebtn:has-text("ירידה במשקל")'); settle()
        st = ev("({goal:S.nut.goal,T:FoodKit.targets(S.profile,S.nut)})")
        check('a nutrition goal gives a daily target', st['goal'] == 'lose' and 1500 <= st['T']['kcal'] < st['T']['tdee'], st)
        goto('#food'); page.click('#dock .btn'); settle(900)
        box = ev("(() => { const r=document.querySelector('#sheet').getBoundingClientRect(); return {open:Sheet.open,h:Math.round(r.height),top:Math.round(r.top),ways:[...document.querySelectorAll('#sheetBody .fway')].map(e=>e.textContent)}; })()")
        check('the meal sheet opens at its full size, with the three ways in', box['open'] and box['h'] >= 300 and box['top'] >= 0 and box['ways'] == ['תמונה', 'ברקוד', 'חיפוש'], box)
        page.set_input_files('#sheetBody input[type=file]', {'name': 'plate.png', 'mimeType': 'image/png', 'buffer': PNG}); settle(1000)
        st = ev("({pic:!!document.querySelector('#sheetBody .fpic img'),off:[...document.querySelectorAll('#sheetBody .btn')].find(b=>b.textContent.includes('המשך')).disabled,ph:document.querySelector('#sheetBody textarea').placeholder})")
        check('a picture of a meal waits in the sheet, and words can be added to it', st['pic'] and not st['off'] and 'חצי מנה' in st['ph'], st)
        page.screenshot(path=os.path.join(OUT, 'live-0-meal-picture.png'))
        page.click('#sheetBody .fpic .rm'); settle(300)      # the picture is taken off again: reading it needs the model, and this part of the test spends nothing
        page.fill('#sheetBody textarea', 'שתי ביצים ושתי פרוסות לחם')
        page.click('#sheetBody .btn:has-text("המשך")'); settle(1000); page.click('#sheetBody .btn:has-text("אישור")'); settle(1000)
        meals = ev("FoodKit.mealsOf(S.food,todayKey())")
        check('a meal typed in words is in the diary', len(meals) == 1 and len(meals[0]['it']) == 2, meals)
        page.screenshot(path=os.path.join(OUT, 'live-1-food.png'))

        goto('#chat'); n0 = len(posts)
        m = say(page, 'תזכור שאני לא אוהב חציל')
        check('a thing to remember is kept with no model and no request to the server', m.get('tier') == 'local' and 'חציל' in ev("S.nut.no") and len(posts) == n0, [m, posts])

        account(page, 'signup'); created = True
        tok, uid = ev("PB.token"), ev("PB.user.id")
        month = ev("todayKey().slice(0,7)")
        want = ['profile', 'nut', 'coach', 'food-' + month]
        keys = []
        for _ in range(30):
            st, r = api('GET', '/api/collections/docs/records?perPage=200&filter=' + urllib.parse.quote('user="%s"' % uid), token=tok)
            keys = sorted(x['key'] for x in (r.get('items') or []))
            if all(k in keys for k in want):
                break
            settle(700)
        check('signing up sends what was made before the account up to the server, the nutrition documents too', all(k in keys for k in want), keys)
        print('      documents on the server: ' + ', '.join(keys))
        ctx.close()

        # ---------------- the second phone ----------------
        ctx, page, posts = phone(browser, 'phone 2')
        ev = page.evaluate
        settle = lambda ms=500: page.wait_for_timeout(ms)
        goto = lambda h: (ev("h => { location.hash = h; }", h), settle())
        check('a second phone starts empty', ev("FoodKit.mealsOf(S.food,todayKey()).length") == 0 and not ev("!!PB.user"))
        account(page, 'login')
        page.wait_for_function("FoodKit.mealsOf(S.food,todayKey()).length === 1", timeout=45000)
        st = ev("({meals:FoodKit.mealsOf(S.food,todayKey()),goal:S.nut.goal,no:S.nut.no,mem:S.coach.mem.map(x=>x.t),name:S.profile.name})")
        check('after signing in, the second phone has the meal, the goal and what the coach was told',
              len(st['meals'][0]['it']) == 2 and st['goal'] == 'lose' and 'חציל' in st['no'] and any('חציל' in x for x in st['mem']) and st['name'] == 'בדיקה', st)
        goto('#food'); t = ev("document.querySelector('#view').innerText")
        check('the nutrition day shows the target and the meal', 'היעד להיום' in t and ev("document.querySelectorAll('#view .meal').length") == 1, t[:200])
        page.screenshot(path=os.path.join(OUT, 'live-2-second-phone.png'))

        # ---------------- the coach: a new account was not invited ----------------
        tok2, uid2 = ev("PB.token"), ev("PB.user.id")
        st, r = api('GET', '/api/setim/coach', token=tok2)
        check('the server says the coach is on, and that this new account was not invited', r.get('on') is True and r.get('access') is False and r.get('left') is None, r)
        goto('#chat')
        m = say(page, QUESTION)
        st, r = api('GET', '/api/collections/coach_usage/records?perPage=5&filter=' + urllib.parse.quote('user="%s"' % uid2), token=tok2)
        check('someone who was not invited is told so in the chat, and nothing is spent', m.get('why') == 'invite' and 'למוזמנים' in (m.get('t') or '') and st == 200 and not r.get('items'), [m, st, r])
        page.screenshot(path=os.path.join(OUT, 'live-3-not-invited.png'))
        st, r = api('POST', '/api/setim/coach/join', {'code': 'x' * 24}, tok2)
        check('a made-up invitation code opens nothing', r.get('ok') is False and r.get('why') == 'code', r)
        st, r = api('POST', '/api/setim/coach/admin', {'do': 'state'}, tok2)
        check("the owner's corner is closed to this account", r.get('ok') is False and r.get('why') == 'owner', r)

        # ---------------- with the admin's password in the environment: let the account in, and ask one real question ----------------
        if not (os.environ.get('EM') and os.environ.get('PW')):
            print('      (no admin password in the environment: the real question was not asked, and nothing was spent)')
            ctx.close()
            raise SystemExit
        st, a = api('POST', '/api/collections/_superusers/auth-with-password', {'identity': os.environ['EM'], 'password': os.environ['PW']})
        st, r = api('POST', '/api/collections/coach_access/records', {'user': uid2, 'role': 'guest', 'by': ''}, a.get('token', ''))
        check('the admin lets the throwaway account in', st == 200, (st, r))
        ev("(async () => { CO.info = null; CO.infoAt = 0; await coachInfo(true); })()"); settle(600)
        st, r = api('GET', '/api/setim/coach', token=tok2)
        left0 = (r.get('left') or {}).get('total')
        check('now the server says how many answers are left today', r.get('access') is True and isinstance(left0, int) and left0 > 0, r)

        goto('#chat'); n0 = len(posts)
        m = say(page, QUESTION)
        ok = m.get('tier') == 'cheap' and not m.get('why') and len(m.get('t') or '') > 20 and re.search('[א-ת]', m.get('t') or '') is not None
        check('the question is answered by the real small model, in Hebrew, in the chat', ok, m)
        if ok:
            print('      ' + re.sub(r'\s+', ' ', m['t'])[:320])
        check('exactly one request went to the coach on the server', len(posts) - n0 == 1, posts)
        badge = ev("[...document.querySelectorAll('#view .tierb')].map(e=>e.className+'|'+e.innerText.trim()).slice(-1)[0] || ''")
        check('the answer is marked with the model that gave it', 'cheap' in badge and 'מודל מהיר' in badge, badge)
        page.screenshot(path=os.path.join(OUT, 'live-4-chat.png'))
        st, r = api('GET', '/api/setim/coach', token=ev("PB.token"))
        check('the count of answers left went down by one', (r.get('left') or {}).get('total') == (left0 or 0) - 1, r)
        ctx.close()
    except SystemExit:
        pass
    finally:
        browser.close()
        if created:
            st, r = api('POST', '/api/collections/users/auth-with-password', {'identity': EMAIL, 'password': PW})
            tok, uid = r.get('token', ''), (r.get('record') or {}).get('id', '')
            st, r = api('DELETE', '/api/collections/users/records/' + uid, token=tok)
            check('the throwaway account is deleted', st in (200, 204), (st, r))
            st, r = api('POST', '/api/collections/users/auth-with-password', {'identity': EMAIL, 'password': PW})
            check('and is gone', st == 400, (st, r))

check('no errors in the browser console', not errors, errors[:6])
print('\n%s (%d failed)' % ('ALL PASSED' if not fails else 'SOME CHECKS FAILED', len(fails)))
sys.exit(1 if fails else 0)
