// Gensaat – Service Worker: das Spiel läuft auch offline; neue Versionen kommen trotzdem sofort.
// Nur eigene alte Versionen löschen: auf primov1x.github.io liegen mehrere Spiele mit eigenem Speicher.
const CACHE = 'gensaat-v3';
const APP = ['./', 'index.html', 'style.css', 'js/data.js', 'js/engine.js', 'js/ui.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('gensaat-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const keep = (req, res) => {
  const copy = res.clone();
  caches.open(CACHE).then(c => c.put(req, copy));
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Schriften ändern sich nie: erst Speicher, dann Netz
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => keep(req, res))));
    return;
  }
  if (url.origin !== location.origin) return;
  // Spiel-Dateien: erst Netz (immer die neue Version; no-cache fragt am Browser-Speicher vorbei nach), offline aus dem Speicher
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => (res.ok ? keep(req, res) : res))
    .catch(() => caches.match(req, { ignoreSearch: true })));
});
