const CACHE='company-sales-platform-v1';
const ASSETS=['./','./index.html','./assets/styles.css','./assets/app.js','./firebase-config.js','./manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
