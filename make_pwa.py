# -*- coding: utf-8 -*-
"""One-off: generate PWA icons/manifest/service worker and patch the app for standalone (GitHub Pages) mode."""
import os
from PIL import Image, ImageDraw

def icon(size):
    im = Image.new('RGBA', (size, size), (11, 12, 16, 255))
    s = size / 180
    for r, alpha in ((95, 28), (75, 40), (55, 55)):
        g = Image.new('RGBA', (size, size), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
        gd.ellipse([120*s-r*s, 30*s-r*s, 120*s+r*s, 30*s+r*s], fill=(255, 107, 74, alpha)); im = Image.alpha_composite(im, g)
    d = ImageDraw.Draw(im); col = (255, 122, 80, 255); w = int(12*s)
    d.line([(38*s, 90*s), (142*s, 90*s)], fill=col, width=w)
    for x, y0, y1 in ((52, 66, 114), (128, 66, 114), (68, 58, 122), (112, 58, 122)):
        d.line([(x*s, y0*s), (x*s, y1*s)], fill=col, width=w)
    return im

os.makedirs('icons', exist_ok=True)
for sz in (180, 192, 512):
    icon(sz).save(f'icons/icon-{sz}.png')
m = Image.new('RGBA', (512, 512), (11, 12, 16, 255)); m.paste(icon(360), (76, 76)); m.save('icons/icon-maskable-512.png')
print('icons ok')

open('manifest.json', 'w', encoding='utf-8').write('''{
  "name": "סטים — מעקב אימונים",
  "short_name": "סטים",
  "description": "מעקב סטים, משקלים והתקדמות בחדר הכושר, עם 701 תרגילים, תוכניות ומדריכים.",
  "lang": "he", "dir": "rtl",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0B0C10",
  "theme_color": "#0B0C10",
  "icons": [
    {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]
}
''')
open('sw.js', 'w', encoding='utf-8').write('''/* service worker: app shell cached, data bundles cache-first, page network-first */
const V='setim-v2';
const SHELL=['./','./index.html','./manifest.json','./data/exercises.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url); if(e.request.method!=='GET'||u.origin!==location.origin) return;
  if(u.pathname.endsWith('/')||u.pathname.endsWith('index.html')){ e.respondWith(fetch(e.request).then(r=>{ const c=r.clone(); caches.open(V).then(x=>x.put(e.request,c)); return r; }).catch(()=>caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{ if(r.ok&&(u.pathname.includes('/data/')||u.pathname.includes('/icons/')||u.pathname.endsWith('.json'))){ const c=r.clone(); caches.open(V).then(x=>x.put(e.request,c)); } return r; })));
});
''')

OLD_ICON = """<link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Crect width='180' height='180' rx='40' fill='%230B0C10'/%3E%3Cpath d='M38 90h104M52 66v48M128 66v48M68 58v64M112 58v64' stroke='%23FF6B4A' stroke-width='12' stroke-linecap='round'/%3E%3C/svg%3E">"""
NEW_ICON = """<link rel="manifest" href="manifest.json">\n<link rel="apple-touch-icon" href="icons/icon-180.png">\n<link rel="icon" href="icons/icon-192.png">"""
EDITS = [
 (OLD_ICON, NEW_ICON),
 ("const S = {ex:[],byId:{}",
  "const STANDALONE = !(window.claude && typeof window.claude.use==='function');\nlet installPrompt=null; window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installPrompt=e; if(route.page==='install') render(); });\nconst S = {ex:[],byId:{}"),
 ("  if(S.storageMode!=='cloud' && S.loaded) return h('div',{class:'banner blue',html:I('cloud')+'<span>לא מחובר/ת לחשבון. הנתונים נשמרים בדפדפן הזה בלבד. התחבר/י ל-Claude כדי לשמור בין מכשירים.</span>'});",
  "  if(STANDALONE){ try{ if(localStorage.getItem('gt:hideBanner')) return h('span'); }catch(e){} return h('div',{class:'banner blue',html:I('phone')+'<span class=\"grow\">הנתונים נשמרים במכשיר הזה. כדי להעביר למכשיר אחר: פרופיל ← ייצוא גיבוי.</span>'},h('button',{style:'color:inherit;font-weight:900;padding:0 4px','aria-label':'סגור',onclick:ev=>{ try{ localStorage.setItem('gt:hideBanner','1'); }catch(e){} ev.currentTarget.parentElement.remove(); }},'\\u2715')); }\n  if(S.storageMode!=='cloud' && S.loaded) return h('div',{class:'banner blue',html:I('cloud')+'<span>לא מחובר/ת לחשבון. הנתונים נשמרים בדפדפן הזה בלבד. התחבר/י ל-Claude כדי לשמור בין מכשירים.</span>'});"),
 ("const st=S.storageMode==='cloud'?(S.canWrite===false?'מחובר/ת · צפייה בלבד בקישור הזה':'מחובר/ת · הנתונים נשמרים בחשבון שלך'):'לא מחובר/ת · נשמר בדפדפן הזה בלבד';",
  "const st=STANDALONE?'הנתונים נשמרים במכשיר הזה':S.storageMode==='cloud'?(S.canWrite===false?'מחובר/ת · צפייה בלבד בקישור הזה':'מחובר/ת · הנתונים נשמרים בחשבון שלך'):'לא מחובר/ת · נשמר בדפדפן הזה בלבד';"),
 ("h('p',{class:'small muted',style:'margin:0 0 10px;line-height:1.6'},'כל מי שנכנס לקישור עם החשבון שלו מקבל פרופיל נפרד ורואה רק את הנתונים שלו. כדי שחברים יוכלו לשמור אימונים, שתפ/י את הקישור ברמת Contributor.')",
  "h('p',{class:'small muted',style:'margin:0 0 10px;line-height:1.6'},STANDALONE?'שלח/י את הקישור לחברים. כל אחד מקבל את האפליקציה על המכשיר שלו, עם הפרופיל והנתונים שלו. מומלץ להוסיף למסך הבית.':'כל מי שנכנס לקישור עם החשבון שלו מקבל פרופיל נפרד ורואה רק את הנתונים שלו. כדי שחברים יוכלו לשמור אימונים, שתפ/י את הקישור ברמת Contributor.')"),
 ("  wrap.append(h('div',{class:'banner blue',html:I('info')+'<span>האפליקציה רצה בתוך claude.ai, ולכן ההתחברות והשמירה בענן ממשיכות לעבוד גם מהאייקון במסך הבית.</span>'}));",
  "  if(STANDALONE){ if(installPrompt) wrap.append(h('button',{class:'btn',style:'margin-bottom:12px',html:I('phone')+'<span>התקן עכשיו</span>',onclick:async()=>{ try{ installPrompt.prompt(); const r=await installPrompt.userChoice; if(r&&r.outcome==='accepted'){ toast('הותקן'); installPrompt=null; render(); } }catch(e){} }})); if(matchMedia('(display-mode: standalone)').matches) wrap.append(h('div',{class:'banner good',html:I('check')+'<span>האפליקציה כבר מותקנת ורצה ממסך הבית.</span>'})); }\n  else wrap.append(h('div',{class:'banner blue',html:I('info')+'<span>האפליקציה רצה בתוך claude.ai, ולכן ההתחברות והשמירה בענן ממשיכות לעבוד גם מהאייקון במסך הבית.</span>'}));"),
 ("step(1,'פתח/י את הקישור ב-Safari','אם האפליקציה נפתחה בתוך אפליקציית Claude, לחץ/י על הכפתור \"פתח בדפדפן\".')",
  "step(1,'פתח/י את הקישור ב-Safari',STANDALONE?'דווקא Safari, לא Chrome: רק הוא יודע להתקין אפליקציות באייפון.':'אם האפליקציה נפתחה בתוך אפליקציית Claude, לחץ/י על הכפתור \"פתח בדפדפן\".')"),
 ("  if(window.claude && typeof claude.use==='function') initCloud(); else { S.loaded=true; render(); }",
  "  if(!STANDALONE) initCloud(); else { S.loaded=true; render(); if('serviceWorker' in navigator){ try{ navigator.serviceWorker.register('sw.js'); }catch(e){} } }"),
]
for p in ('index.template.html', 'index.html'):
    s = open(p, encoding='utf-8').read()
    for a, b in EDITS:
        assert s.count(a) == 1, (p, s.count(a), a[:70])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
print('app edits ok')
