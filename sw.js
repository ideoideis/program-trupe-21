/* Service worker unic pentru paginile trupelor. Programul funcționează
   și offline. Datele (program.js) vin de pe site-ul master
   program-intern-21: network-first, ocolind cache-ul HTTP (revalidare
   cu ETag), cu fallback la cache. Fonturi/imagini: cache-first. */
const CACHE = 'pt21-1'; /* bump la orice schimbare de assets/fonturi */
const PROGRAM = 'https://ideoideis.github.io/program-intern-21/program.js';
const ASSETS = [
  'shared/schedule.css',
  'shared/schedule.js',
  'fonts/soehne-buch.woff2',
  'fonts/soehne-halbfett.woff2',
  'assets/eticheta-rosie.png',
  'assets/favicon.png',
  'assets/apple-touch-icon.png',
  PROGRAM,
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === location.origin;
  const isProgram = req.url.startsWith(PROGRAM);
  if (!sameOrigin && !isProgram) return;
  const fresh = req.mode === 'navigate' || isProgram || req.url.includes('schedule.js');
  if (fresh) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then(r => {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put(req, cp));
        return r;
      }).catch(() =>
        caches.match(req).then(r => r || Response.error())
      )
    );
  } else {
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(rr => {
        const cp = rr.clone();
        caches.open(CACHE).then(c => c.put(req, cp));
        return rr;
      }))
    );
  }
});
