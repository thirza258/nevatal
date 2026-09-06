/*
 * Nevatal's service worker: an installable shell, and nothing else.
 *
 * What it deliberately does NOT do is cache /api/. Those responses carry the
 * session and the answers generated with someone's own key, and a cache in
 * front of them could serve one person's generation to the next person to open
 * the app on a shared device. Only the static shell is cached.
 *
 * Bump VERSION to retire an old cache.
 */

const VERSION = 'nevatal-shell-v1';
const SHELL_URL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(['/', SHELL_URL, '/manifest.webmanifest']))
      // A shell we cannot pre-cache is not a reason to refuse to install; the
      // first navigation will fill it.
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== VERSION).map((name) => caches.delete(name)))
      )
      .then(() => self.clients.claim())
  );
});

const isFingerprinted = (url) => url.pathname.startsWith('/assets/');

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // The API is never cached: session, keys and generated answers.
  if (url.pathname.startsWith('/api/')) return;

  // Vite fingerprints everything under /assets/, so those URLs never change
  // meaning and can be served from the cache immediately.
  if (isFingerprinted(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // Everything else — the shell, the logo, the manifest — comes from the
  // network when there is one, and from the cache when there is not.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(VERSION).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(async () => {
        const hit = await caches.match(request);
        if (hit) return hit;
        if (request.mode === 'navigate') {
          const shell = await caches.match(SHELL_URL);
          if (shell) return shell;
        }
        return Response.error();
      })
  );
});
