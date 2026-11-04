# -*- coding: utf-8 -*-
"""One-off: add PocketBase sign-up / sign-in / per-user sync to the standalone (GitHub Pages) build."""
PB_CODE = r"""
/* ---------- accounts & sync (standalone build): PocketBase REST, no SDK ---------- */
const PB_URL = (location.hostname==='localhost'||location.hostname==='127.0.0.1') ? 'http://127.0.0.1:8090' : 'https://setim.2-24-161-2.sslip.io';
const PB = { token:'', user:null, ids:{},
  load(){ try{ const a=JSON.parse(localStorage.getItem('gt:auth')||'null'); if(a&&a.token){ this.token=a.token; this.user=a.user; } }catch(e){} },
  store(){ try{ localStorage.setItem('gt:auth',JSON.stringify({token:this.token,user:this.user})); }catch(e){} },
  async req(method,path,body){ let r; try{ r=await fetch(PB_URL+path,{method,headers:{'Content-Type':'application/json',...(this.token?{Authorization:this.token}:{})},body:body!==undefined?JSON.stringify(body):undefined}); }catch(e){ throw Object.assign(new Error('network'),{status:0}); } const j=await r.json().catch(()=>({})); if(!r.ok) throw Object.assign(new Error(j.message||('HTTP '+r.status)),{status:r.status,data:j.data||{}}); return j; },
  async signup(email,pw,name){ await this.req('POST','/api/collections/users/records',{email,password:pw,passwordConfirm:pw,name}); return this.login(email,pw); },
  async login(email,pw){ const j=await this.req('POST','/api/collections/users/auth-with-password',{identity:email,password:pw}); this.token=j.token; this.user=j.record; this.ids={}; this.store(); return j; },
  async refresh(){ if(!this.token) return false; try{ const j=await this.req('POST','/api/collections/users/auth-refresh'); this.token=j.token; this.user=j.record; this.store(); return true; }catch(e){ if(e.status===401||e.status===403||e.status===404) this.logout(); return false; } },
  logout(){ this.token=''; this.user=null; this.ids={}; try{ localStorage.removeItem('gt:auth'); }catch(e){} },
  async pullAll(){ const out={}; let page=1; for(;;){ const j=await this.req('GET',`/api/collections/docs/records?perPage=500&page=${page}&filter=${encodeURIComponent('user="'+this.user.id+'"')}`); (j.items||[]).forEach(it=>{ this.ids[it.key]=it.id; out[it.key]=it.data; }); if(page>=(j.totalPages||1)) break; page++; } return out; },
  async push(key,data){ if(this.ids[key]) return this.req('PATCH','/api/collections/docs/records/'+this.ids[key],{data}); try{ const j=await this.req('POST','/api/collections/docs/records',{user:this.user.id,key,data}); this.ids[key]=j.id; return j; }catch(e){ if(e.status===400){ const j=await this.req('GET',`/api/collections/docs/records?perPage=1&filter=${encodeURIComponent('user="'+this.user.id+'" && key="'+key+'"')}`); const it=(j.items||[])[0]; if(it){ this.ids[key]=it.id; return this.req('PATCH','/api/collections/docs/records/'+it.id,{data}); } } throw e; } }
};
function pbError(e){ if(!e) return 'משהו השתבש'; if(e.status===0) return 'אין חיבור לשרת. בדוק/י את האינטרנט ונסה/י שוב.'; if(e.status===400){ const d=e.data||{}; if(d.email) return d.email.code==='validation_not_unique'?'האימייל הזה כבר רשום. נסה/י להתחבר.':'כתובת האימייל לא תקינה.'; if(d.password) return 'הסיסמה צריכה להיות באורך 8 תווים לפחות.'; if(/authenticate/i.test(e.message)) return 'אימייל או סיסמה שגויים.'; return 'הפרטים לא תקינים.'; } if(e.status===429) return 'יותר מדי ניסיונות. נסה/י בעוד דקה.'; return 'השרת לא זמין כרגע ('+(e.status||'')+').'; }
async function initPB(){
  PB.load(); if(!PB.token) return;
  const ok=await PB.refresh(); if(!ok){ S.storageMode='local'; return; }
  try{ await syncFromCloud(); }catch(e){ console.warn('sync failed',e); }
}
async function syncFromCloud(){
  const cloud=await PB.pullAll(); const keys=Object.keys(cloud);
  if(keys.length){ Object.keys(S.logs).forEach(k=>delete S.logs[k]); keys.forEach(k=>{ applyDoc(k,cloud[k]); try{ localStorage.setItem('gt:'+k,JSON.stringify(cloud[k])); }catch(e){} }); }
  else { const local=[]; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k.startsWith('gt:')&&!['gt:auth','gt:hideBanner'].includes(k)) local.push(k.slice(3)); } }catch(e){} for(const k of local){ try{ await PB.push(k,JSON.parse(localStorage.getItem('gt:'+k))); }catch(e){} } }
  S.storageMode='pb'; if(!S.profile.name && PB.user?.name){ S.profile.name=PB.user.name.split(' ')[0]; save('profile',S.profile); }
  render();
}
function authSheet(mode='login'){
  const body=h('div'); let m=mode;
  const email=h('input',{type:'email',inputmode:'email',autocomplete:'email',placeholder:'you@example.com'}), pw=h('input',{type:'password',autocomplete:m==='login'?'current-password':'new-password',placeholder:'8 תווים לפחות'}), name=h('input',{type:'text',autocomplete:'name',placeholder:'איך לקרוא לך'});
  const err=h('div',{class:'banner',style:'display:none'}); const btn=h('button',{class:'btn'}); const title=h('h2'); const nameFld=h('div',{class:'fld'},h('label',{},'שם'),name); const sw=h('button',{class:'btn sec2',style:'margin-top:8px'});
  function paint(){ title.textContent=m==='login'?'כניסה לחשבון':'יצירת חשבון'; btn.textContent=m==='login'?'כניסה':'הרשמה'; sw.textContent=m==='login'?'אין לי חשבון, להרשמה':'יש לי חשבון, לכניסה'; nameFld.style.display=m==='login'?'none':''; err.style.display='none'; }
  sw.addEventListener('click',()=>{ m=m==='login'?'signup':'login'; paint(); });
  btn.addEventListener('click',async()=>{ const e=email.value.trim().toLowerCase(), p=pw.value; if(!e||!p){ err.textContent='מלא/י אימייל וסיסמה.'; err.style.display=''; return; } btn.disabled=true; btn.textContent='רגע…'; try{ if(m==='signup') await PB.signup(e,p,name.value.trim()); else await PB.login(e,p); Sheet.close(); toast(m==='signup'?'החשבון נוצר. ברוך/ה הבא/ה!':'התחברת'); haptic(12); S.storageMode='pb'; render(); await syncFromCloud(); }catch(ex){ err.textContent=pbError(ex); err.style.display=''; btn.disabled=false; paint(); } });
  body.append(title,h('p',{class:'small muted',style:'margin:0 0 12px;line-height:1.5'},'החשבון שומר את האימונים, הפרופיל והמכון שלך ומסנכרן בין כל המכשירים. כל משתמש רואה רק את הנתונים שלו.'),nameFld,h('div',{class:'fld'},h('label',{},'אימייל'),email),h('div',{class:'fld'},h('label',{},'סיסמה'),pw),err,btn,sw);
  paint(); Sheet.show(body); setTimeout(()=>email.focus(),350);
}
function signOut(){ PB.logout(); S.storageMode='local'; toast('יצאת מהחשבון. הנתונים נשארים במכשיר הזה.'); render(); }
"""

EDITS = [
 # 1. PB client after STANDALONE const
 ("let installPrompt=null;", PB_CODE.strip()+"\nlet installPrompt=null;"),
 # 2. save(): push to PocketBase in standalone mode
 ("  try{ localStorage.setItem('gt:'+key, JSON.stringify(obj)); }catch(e){}\n  if(!S.db || !S.uid) return;",
  "  try{ localStorage.setItem('gt:'+key, JSON.stringify(obj)); }catch(e){}\n  if(STANDALONE){ if(!PB.user) return; const run=async()=>{ try{ await PB.push(key,obj); }catch(e){ if(e.status===401||e.status===403){ PB.logout(); S.storageMode='local'; renderBanner(); toast('ההתחברות פגה. התחבר/י שוב כדי להמשיך לסנכרן.'); } } }; writeQ[key]=(writeQ[key]||Promise.resolve()).then(run); return writeQ[key]; }\n  if(!S.db || !S.uid) return;"),
 # 3. home banner in standalone mode
 ("__BANNER_LINE__",
  "  if(STANDALONE){ if(PB.user) return h('span'); return h('div',{class:'banner blue',style:'align-items:center'},ic('cloud'),h('span',{class:'grow'},'התחבר/י כדי לשמור את האימונים בחשבון ולסנכרן בין מכשירים.'),h('button',{class:'btn sm',style:'width:auto;padding:8px 12px;font-size:13px',onclick:()=>authSheet('login')},'כניסה')); }"),
 # 4. profile status + buttons
 ("const st=STANDALONE?'הנתונים נשמרים במכשיר הזה':",
  "const st=STANDALONE?(PB.user?`מחובר/ת · ${PB.user.email} · מסונכרן בין מכשירים`:'לא מחובר/ת · הנתונים נשמרים במכשיר הזה'):"),
 ("h('button',{class:'btn sm sec2',html:I('edit')+'<span>פרטים</span>',onclick:editProfileSheet}),file)));",
  "h('button',{class:'btn sm sec2',html:I('edit')+'<span>פרטים</span>',onclick:editProfileSheet}),STANDALONE?(PB.user?h('button',{class:'btn sm sec2',onclick:signOut},'יציאה'):h('button',{class:'btn sm',onclick:()=>authSheet('login')},'כניסה / הרשמה')):null,file)));"),
 # 5. boot
 ("  if(!STANDALONE) initCloud(); else { S.loaded=true; render(); if('serviceWorker' in navigator){ try{ navigator.serviceWorker.register('sw.js'); }catch(e){} } }",
  "  if(!STANDALONE) initCloud(); else { S.loaded=true; render(); initPB(); if('serviceWorker' in navigator){ try{ navigator.serviceWorker.register('sw.js'); }catch(e){} } }"),
]
for p in ('index.template.html', 'index.html'):
    s = open(p, encoding='utf-8').read()
    for a, b in EDITS:
        if a == '__BANNER_LINE__':
            lines = s.split(chr(10)); idx = [i for i, l in enumerate(lines) if l.startswith("  if(STANDALONE){ try{ if(localStorage.getItem('gt:hideBanner'))")]
            assert len(idx) == 1, (p, 'banner line', len(idx)); lines[idx[0]] = b; s = chr(10).join(lines); continue
        assert s.count(a) == 1, (p, s.count(a), a[:80])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
print('auth edits ok')
