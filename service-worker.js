const CACHE='sublicuentas-socios-web-mobilefix-20260925-2';
const SHELL=['./','./index.html','./assets/app.css','./assets/panel-web-20260925.css','./assets/core.js','./assets/operations.js','./assets/catalog-aula.js','./assets/panel-web-20260925.js','./assets/messaging.js','./assets/robot-socios.webp','./assets/icon-192.png','./assets/icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function networkFirst(req,fallback){
  try{const r=await fetch(req,{cache:'no-store'});if(r&&r.ok){const c=await caches.open(CACHE);c.put(req,r.clone())}return r}catch(_){return (await caches.match(req))||(fallback?await caches.match(fallback):Response.error())}
}
async function cacheFirst(req){
  const cached=await caches.match(req);if(cached)return cached;
  const r=await fetch(req);if(r&&r.ok){const c=await caches.open(CACHE);c.put(req,r.clone())}return r;
}
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){event.respondWith(networkFirst(req,'./index.html'));return}
  const path=url.pathname.toLowerCase();
  if(/\.(?:js|css|webmanifest|json)$/.test(path)){event.respondWith(networkFirst(req));return}
  if(/\.(?:png|jpe?g|webp|svg|ico)$/.test(path)){event.respondWith(cacheFirst(req));return}
  event.respondWith(networkFirst(req));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const existing=list.find(c=>'focus' in c);return existing?existing.focus():clients.openWindow('./');
  }));
});
