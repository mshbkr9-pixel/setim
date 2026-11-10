/* service worker: app shell cached, data bundles cache-first, page network-first */
const V='setim-v5';
const SHELL=['./','./index.html','./anim.js','./manifest.json','./data/exercises.json','./icons/icon-192.png','./icons/icon-512.png','./fonts/heebo-hebrew.woff2','./fonts/heebo-latin.woff2','./fonts/frank-hebrew.woff2','./fonts/frank-latin.woff2','./fonts/rubik-hebrew.woff2','./fonts/rubik-latin.woff2'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url); if(e.request.method!=='GET'||u.origin!==location.origin) return;
  if(u.pathname.endsWith('/')||u.pathname.endsWith('index.html')){ e.respondWith(fetch(e.request).then(r=>{ const c=r.clone(); caches.open(V).then(x=>x.put(e.request,c)); return r; }).catch(()=>caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{ if(r.ok&&(u.pathname.includes('/data/')||u.pathname.includes('/icons/')||u.pathname.includes('/fonts/')||u.pathname.endsWith('.json'))){ const c=r.clone(); caches.open(V).then(x=>x.put(e.request,c)); } return r; })));
});
