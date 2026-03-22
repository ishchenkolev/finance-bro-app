self.addEventListener('install', (e) => {
 e.waitUntil(
   caches.open('finbro-v1').then((cache) => cache.addAll([
     '/',
     '/static/style.css',
     '/static/script.js',
     '/static/icons/icon-192.png',
     '/static/icons/icon-512.png'
   ])),
 );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
