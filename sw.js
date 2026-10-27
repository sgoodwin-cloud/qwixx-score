// Bump VERSION whenever the app changes, together with APP_VERSION in index.html, to the same number:
// the install checks they match.
const VERSION = 'qwixx-score-v3';
// Every file the app needs offline. Add any new file here.
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './fonts/barlow-semi-condensed-latin-500-normal.woff2', './fonts/barlow-semi-condensed-latin-600-normal.woff2',
  './fonts/barlow-semi-condensed-latin-700-normal.woff2', './fonts/barlow-semi-condensed-latin-800-normal.woff2'
];

// cache: 'reload' skips the phone's web cache, so a new version never stores stale files (Swipe Snake v5 lesson).
// Install: fetch every file fresh and store it under its plain address.
// - cache: 'reload' skips the phone's own web cache.
// - ?v=<VERSION> makes each address new to GitHub Pages' CDN, which can otherwise serve the
//   previous version's files for a few minutes after a deploy (Pocket Factory got stuck that way).
// - Check index.html really is this version. If not (e.g. just after a deploy, before GitHub has
//   finished publishing), wait and try again with a fresh address, up to 4 times; only then fail.
//   A failed install can leave an iPhone refusing to retry the same sw.js (lesson from Flip 7 v4), so it's
//   worth trying hard here.
const APP_VERSION = VERSION.replace('qwixx-score-v', '');
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt) await new Promise(r => setTimeout(r, 3000 * attempt));
      try {
        const c = await caches.open(VERSION);
        await Promise.all(CORE.map(async u => {
          const res = await fetch(new Request(`${u}?v=${VERSION}&try=${attempt}`, { cache: 'reload' }));
          if (!res.ok) throw new Error(`${u}: ${res.status}`);
          await c.put(u, res);
        }));
        const page = await (await c.match('./index.html')).text();
        if (page.includes(`APP_VERSION = '${APP_VERSION}'`)) return;
      } catch (err) { /* network hiccup: try again */ }
      await caches.delete(VERSION);
    }
    throw new Error('could not fetch this version\'s files; will retry on the next update check');
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

// Cache-first, filling the cache as we go; fall back to the app page when offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
