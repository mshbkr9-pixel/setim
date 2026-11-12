# -*- coding: utf-8 -*-
"""A look at the published app after a deploy, with NO account. A new person opens the site on a phone, goes through the one setup
and looks at the two sectors. Everything stays in this headless browser's own storage: the script signs nobody up, costs nothing, and
sends the server only the reads the app itself makes. It lists every request that is not a GET, so that "nothing was written" is seen
and not assumed. (tests/live_v13.py is the other kind: it makes a throwaway account on the live server.)

    python -X utf8 tests/live_look.py [SITE] [output folder]
    SITE  the published app, ending with "/". Default https://getonekeyai.com/
The page and sw.js that the site serves are compared with the commit that is checked out here (git show HEAD:...), so run it from
the commit that was deployed. Exit code 0 only when every check passed. Screenshots are for the eye."""
import hashlib, os, re, subprocess, sys, urllib.error, urllib.request
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[1] if len(sys.argv) > 1 else 'https://getonekeyai.com/'
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'tests', 'out-look')
os.makedirs(OUT, exist_ok=True)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
fails, errors, writes, api = [], [], [], []

def check(label, ok, detail=''):
    if not ok:
        fails.append(label)
    print(('PASS  ' if ok else 'FAIL  ') + label + ((' -> ' + str(detail)[:600]) if (detail and not ok) else ''))

def blob(path):
    """The file as the commit holds it (the working copy has Windows line endings; the site has the commit's)."""
    return subprocess.run(['git', '-c', 'core.autocrlf=false', 'show', 'HEAD:' + path], cwd=ROOT, capture_output=True, check=True).stdout

def fetch(path):
    req = urllib.request.Request(URL + path, headers={'Cache-Control': 'no-cache', 'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b''

md5 = lambda b: hashlib.md5(b).hexdigest()
PAGE, SW = blob('index.html'), blob('sw.js')
CACHE = (re.search(rb'setim-v\d+', SW) or [b''])[0].decode()

# ---- the files themselves, from outside ----
st, raw = fetch('')
check('the site answers 200 and serves the page of this commit', st == 200 and md5(raw) == md5(PAGE), [st, len(raw), md5(raw), 'commit: ' + md5(PAGE)])
st, raw = fetch('sw.js')
check('sw.js is the one of this commit (cache %s)' % CACHE, st == 200 and md5(raw) == md5(SW) and CACHE != '', [st, md5(raw), 'commit: ' + md5(SW)])
st, raw = fetch('api/health')
check('the server behind it answers', st == 200, st)

UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
READY = "typeof S !== 'undefined' && S.ex && S.ex.length > 700"
CARD = "({top:!!document.querySelector('#view .px-top'),goal:(document.querySelector('#view .px-goal')||{innerText:''}).innerText.replace(/\\n/g,' | '),say:[...document.querySelectorAll('#view .px-say span')].map(e=>e.textContent),tiles:[...document.querySelectorAll('#view .px-n')].map(e=>e.innerText.replace(/\\n/g,' '))})"

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=2, locale='he-IL', color_scheme='light', user_agent=UA)
    ctx.add_init_script("try{ localStorage.setItem('gt:theme','light'); window.SpeechRecognition=undefined; window.webkitSpeechRecognition=undefined; }catch(e){}")
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append('pageerror: %s' % e))
    page.on('console', lambda m: errors.append('console: %s' % m.text) if (m.type == 'error' and 'vibrate' not in m.text) else None)
    def seen(r):
        if '/api/' in r.url:
            api.append(r.method + ' ' + r.url.split('?')[0])
        if r.method != 'GET':
            writes.append(r.method + ' ' + r.url.split('?')[0])
    page.on('request', seen)
    ev = page.evaluate
    settle = lambda ms=450: page.wait_for_timeout(ms)
    shot = lambda name: page.screenshot(path=os.path.join(OUT, name + '.png'))
    view = lambda: ev("document.querySelector('#view').innerText")

    # ---- a new person: the opening screen, the one setup ----
    page.goto(URL); page.wait_for_function(READY); page.wait_for_selector('.onb.on'); settle(500)
    t = ev("document.querySelector('.onb').innerText")
    check('a new person sees the opening screen with one way in', 'מתחילים' in t and ev("document.querySelectorAll('.onb .typebtn').length") == 0, t[:200])
    tabs = ev("[...document.querySelectorAll('#tabbar .tab')].map(t=>t.textContent)")
    check('the tab bar: fitness, nutrition, the coach', tabs == ['כושר', 'תזונה', 'המאמן'], tabs)
    shot('1-opening')
    page.click('.onb .btn:has-text("מתחילים")'); settle(700)
    st = ev("({page:route.page,first:GW.first,tiles:document.querySelectorAll('.gtile').length})")
    check('"מתחילים" opens the one setup', st == {'page': 'goalnew', 'first': True, 'tiles': 8}, st)
    page.click('.gtile:has-text("לרדת במשקל")'); settle()
    check('then the screen about the body', ev("GW.sub") == 'body' and 'כמה פרטים עליך' in view())
    page.fill('.gwiz input[aria-label="גיל בשנים"]', '35'); page.fill('.gwiz input[aria-label="גובה בסנטימטרים"]', '180'); page.fill('.gwiz input[aria-label="משקל בקילוגרם"]', '90')
    page.click('.gwiz .seg[aria-label="אימונים בשבוע"] button:has-text("4")'); settle(250)
    page.click('.gwiz .btn:has-text("המשך")'); settle()
    page.fill('.gwiz .fld:has-text("לאיזה משקל") input', '82'); page.click('.gwiz .btn:has-text("בונים את התוכנית")'); settle()
    t = view()
    check('the plan says what the goal means for training and for the plate', '4 אימונים בשבוע' in t and 'קק״ל' in t and 'חלבון' in t, t[:400])
    shot('2-plan')
    page.click('.gwiz .btn:has-text("מתחילים")'); settle(1500)
    st = ev("({page:route.page,goals:S.goals.list.length,by:S.nut.by,days:Object.values(S.week.days).filter(d=>d&&d.ex&&d.ex.length).length})")
    check('one tap later: the goal, the plate that follows it, a first week', st == {'page': 'home', 'goals': 1, 'by': 'goal', 'days': 4}, st)
    page.wait_for_timeout(9000); ev("document.querySelectorAll('#pop .prban').forEach(e=>e.remove())")      # the achievement banners leave by themselves

    # ---- the two sectors ----
    st = ev(CARD)
    check('fitness opens with the card: the goal and what is left', st['top'] and 'לרדת ל-82' in st['goal'] and 'נשארו' in st['goal'], st)
    print('      fitness card:', st)
    shot('3-fitness')
    page.click('#view .px-n:has-text("צעדים היום")'); settle(900)
    page.fill('#sheetBody input[aria-label="צעדים"]', '10000'); page.fill('#sheetBody input[aria-label="דופק במנוחה"]', '62'); page.click('#sheetBody .btn:has-text("שמור")'); settle(900)
    st = ev("({day:S.sig.day[todayKey()],tiles:[...document.querySelectorAll('#view .px-n')].map(e=>e.innerText.replace(/\\n/g,' '))})")
    check('steps and heart rate are written in one sheet and show on the card', st['day']['st'] == 10000 and st['day']['hr'] == 62 and any('10,000' in x for x in st['tiles']), st)
    shot('4-fitness-with-steps')
    ev("h => { location.hash = h; }", '#food'); page.wait_for_function("FD.core"); settle(900)
    st = ev(CARD); nums = ev("({today:nutT(todayKey()).kcal,goal:nutGoal(),rate:nutBase().rate})")
    check('nutrition opens with the same goal, and a target that follows it', st['top'] and 'לרדת ל-82' in st['goal'] and nums['goal'] == 'lose' and nums['rate'] > 0 and (format(nums['today'], ',') + ' קק״ל') in view(), [st, nums])
    print('      nutrition card:', st, nums)
    shot('5-nutrition')
    ev("h => { location.hash = h; }", '#coach'); settle(900)
    t = view()
    check('the coach tab opens', ev("route.page") == 'coach' and len(t) > 40, t[:200])
    shot('6-coach')

    # ---- what is underneath ----
    sw = ev("(async () => { try{ await navigator.serviceWorker.ready; return {keys:await caches.keys()}; }catch(e){ return {err:String(e)}; } })()")
    check('the service worker of this version took over (cache %s)' % CACHE, CACHE in (sw.get('keys') or []), sw)
    info = ev("(async () => { try{ const a=await fetch('/api/setim/coach').then(r=>r.json()); const v=await fetch('/api/setim/voice').then(r=>r.json()); return {coach_v:a.v,coach_on:a.on,voice_ok:v.ok,siri_link:!!v.shortcut,health_link:!!v.health}; }catch(e){ return {err:String(e)}; } })()")
    print('      what the server supports today:', info)
    ctx.close(); b.close()

check('no script errors on the way', not errors, errors)
check('nothing but reads was sent anywhere', not writes, writes)
print('      requests to the server:', sorted(set(api)))
print('\n%d failed' % len(fails) if fails else '\nall passed')
sys.exit(1 if fails else 0)
