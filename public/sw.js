// OFFLINE PLAY (errata 291). Tyler, 2026-11-11: "I'm about to get on a flight that may not have wifi, and I
// was hoping to play it on the plane." This service worker is registered only by offline.html, never by the
// game, so nothing changes for anyone who has not asked for an offline copy. offline.html fills the cache;
// this answers from it when the network is gone.
//
// Data (the page and every content JSON) is network-first: online, the game is always the latest deploy;
// offline, it is the copy that was saved. Art, sound and the bundle are cache-first and refreshed in the
// background when the network answers, so a later deploy reaches an offline copy within one visit.
const CACHE = 'consolation-offline-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

function gamePageKey(url) {
  const scope = new URL(self.registration.scope);
  if (url.pathname === scope.pathname || url.pathname === `${scope.pathname}index.html`) {
    return new URL('index.html', scope).href;
  }
  return null;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const pageKey = request.mode === 'navigate' ? gamePageKey(url) : null;
  const isData = pageKey !== null || request.mode === 'navigate' || url.pathname.endsWith('.json');
  const key = pageKey ?? new URL(url.pathname, url.origin).href;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (isData) {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(key, response.clone());
        return response;
      } catch (error) {
        const saved = await cache.match(key);
        if (saved) return saved;
        throw error;
      }
    }
    const saved = await cache.match(key);
    const fresh = fetch(request).then(async (response) => {
      if (response.ok && response.type === 'basic') await cache.put(key, response.clone());
      return response;
    });
    if (saved) {
      event.waitUntil(fresh.catch(() => undefined));
      return saved;
    }
    return fresh;
  })());
});
