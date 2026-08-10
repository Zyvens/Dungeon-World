const CACHE = "dungeon-world-v1.0.0-ui7";
const BASE = self.registration.scope;
const CORE = [
  "",
  "index.html",
  "gameplay.html",
  "styles.css",
  "gameplay.css",
  "image-actions.css",
  "config.js",
  "auth.js",
  "data-api.js",
  "github-pages-adapter.js",
  "classes.js",
  "class-rules.js",
  "sheet-enhancements.js",
  "sheet-media-refresh.js",
  "gameplay-tab.js",
  "gameplay-status.js",
  "gameplay-enhancements.js",
  "app.js",
  "gameplay.js",
  "manifest.webmanifest",
  "icon.svg"
].map((path) => new URL(path, BASE).href);
const FALLBACK = new URL("index.html", BASE).href;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || caches.match(FALLBACK);
      })
  );
});
