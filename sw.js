// Emotion Zero - minimal service worker
const CACHE_NAME = "emotion-zero-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/bg_bedroom.jpg",
  "./assets/bg_plaza.jpg",
  "./assets/bg_interrogation.jpg",
  "./assets/ai_face.png",
  "./assets/stills/bedroom_01.jpg",
  "./assets/stills/injection_01.jpg",
  "./assets/stills/plaza_01.jpg",
  "./assets/stills/plaza_crowd_01.jpg",
  "./assets/stills/interrogation_01.jpg",
  "./assets/stills/dossier_01.jpg",
  "./assets/stills/warning_01.jpg",
  "./assets/stills/anomaly_smile_01.jpg"
];

// Install: cache core (ignore failures so missing assets don't break install)
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(CORE.map((u) => cache.add(u)));
    self.skipWaiting();
  })());
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

// Fetch: cache-first for same-origin GET
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;

    try{
      const fresh = await fetch(req);
      // store successful basic responses
      if (fresh && fresh.status === 200 && (fresh.type === "basic" || fresh.type === "cors")) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    }catch(err){
      // Offline fallback: try index for navigations
      if (req.mode === "navigate") {
        const fallback = await cache.match("./index.html");
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
