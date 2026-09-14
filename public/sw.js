const CACHE = "ketolance-v1";
const OFFLINE_URL = "/encuesta/offline";

// Recursos que se cachean al instalar
const PRECACHE = [
  "/",
  "/manifest.json",
  "/imagen-ketolance.jpg",
  "/encuesta/offline",
  "/globals.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo intercepta GET de mismo origen
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Recursos estáticos — cache first
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/imagen-ketolance.jpg" ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ?? fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Páginas /encuesta — network first, fallback offline
  if (url.pathname.startsWith("/encuesta")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) =>
            cached ?? caches.match(OFFLINE_URL)
          )
        )
    );
    return;
  }
});
