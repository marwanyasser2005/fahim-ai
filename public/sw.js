const CACHE = 'fahim-shell-v4-brand';
const SHELL = ['/', '/mobile-app', '/manifest.webmanifest', '/brand/fahim-icon.svg', '/brand/fahim-icon-transparent.png', '/brand/fahim-app-icon.svg', '/brand/fahim-app-icon-512.png', '/fonts/cairo-arabic.woff2', '/fonts/cairo-latin.woff2', '/fonts/noto-kufi-arabic-variable.ttf'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') || request.headers.has('authorization')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => { if (response.ok && ['/','/mobile-app','/how-it-works','/pricing','/about'].includes(url.pathname)) caches.open(CACHE).then((cache) => cache.put(request, response.clone())); return response; }).catch(() => caches.match(request).then((cached) => cached || caches.match('/'))));
    return;
  }
  if (['style', 'script', 'font', 'image'].includes(request.destination)) event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone())); return response; })));
});
