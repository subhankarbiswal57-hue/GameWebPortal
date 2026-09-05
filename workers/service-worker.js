const CACHE = 'wgp-v1';
// Paths match vercel.json's rewrite of "/" -> apps/portal/index.html,
// so caching keys align with how the shell is actually served.
const SHELL = [
  '/',
  '/apps/portal/css/tokens.css',
  '/apps/portal/css/layout.css',
  '/apps/portal/css/components/nav.css',
  '/apps/portal/css/components/card.css',
  '/games/index.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
