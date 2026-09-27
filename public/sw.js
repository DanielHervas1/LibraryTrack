// Service worker mínimo, escrito a mano (sin Serwist: su plugin de Next todavía depende
// de webpack y Next 16 usa Turbopack por defecto). Cubre lo esencial de una PWA:
// - el "app shell" (estáticos de /_next, iconos) se sirve al instante desde caché
// - páginas visitadas quedan disponibles si se pierde la conexión
// - sin caché y sin red, se muestra /offline en vez de un error del navegador
//
// Ámbito deliberadamente pequeño: no cachea datos de Supabase ni respuestas de /api/*,
// así que el catálogo en sí solo está disponible offline si ya se visitó con conexión.

const VERSION = "v1";
const STATIC_CACHE = `librarytrack-static-${VERSION}`;
const PAGES_CACHE = `librarytrack-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/manifest.webmanifest"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/apple-icon.png"
  );
}

/** Estáticos con hash en el nombre: no cambian, así que cache-first es seguro. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC_CACHE)).put(request, response.clone());
  return response;
}

/** Páginas: red primero para no mostrar contenido desactualizado; caché como respaldo. */
async function networkFirst(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? (await caches.match(OFFLINE_URL));
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Nunca interceptar la API: son datos en vivo, no algo que servir desde caché.
  if (url.pathname.startsWith("/api/")) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }
});
