const CACHE = "taskflow-v3";

// Install: cache only the guaranteed-static shell files
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      // Only cache files we know exist as real static assets
      Promise.allSettled([
        c.add("/"),
        c.add("/manifest.json"),
        c.add("/manifest.webmanifest"),
        c.add("/icons/icon.svg"),
        c.add("/icons/icon-192.png"),
        c.add("/icons/icon-512.png"),
      ]),
    ),
  );
  self.skipWaiting();
});

// Activate: delete old caches and take control immediately
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: network-first with dynamic caching fallback
self.addEventListener("fetch", (e) => {
  // Ignore non-GET, cross-origin, and browser-extension requests
  if (
    e.request.method !== "GET" ||
    !e.request.url.startsWith(self.location.origin) ||
    e.request.url.includes("chrome-extension")
  )
    return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Dynamically cache successful same-origin responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request)),
  );
});
