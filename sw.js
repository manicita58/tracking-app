const CACHE = 'sistema-v2';

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.add('./')));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

/* El HTML va por red primero: con cache-first, un index.html viejo queda
   servido para siempre y el navegador nunca ve los cambios (así se rompió
   la instalación en Android). El caché queda solo como respaldo offline. */
self.addEventListener('fetch', e=>{
  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request)
        .then(r=>{
          const copy=r.clone();
          caches.open(CACHE).then(c=>c.put('./',copy));
          return r;
        })
        .catch(()=>caches.match('./'))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)));
});
