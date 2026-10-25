const CACHE = 'ba-program-shell-v2';
self.addEventListener('install', event => {
  const base = self.registration.scope;
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([
    new URL('./', base).toString(),
    new URL('manifest.json', base).toString(),
    new URL('icon.svg', base).toString(),
  ])));
  self.skipWaiting();
});
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    const home = new URL('./', self.registration.scope).toString();
    event.respondWith(fetch(req).catch(() => caches.match(home)));
  }
});
