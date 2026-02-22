/**
 * Service Worker de Tensia — caché del shell de la aplicación.
 * Estrategia: cache-first para los recursos estáticos del shell.
 * Las peticiones a la API (/measurements) se dejan pasar a la red (sin cachear).
 *
 * En uso anónimo (ADR-005) los datos viven en localStorage,
 * por lo que la app funciona completamente offline una vez instalada.
 */

// v5: eliminado shim validators.js; la validación vive en shared/validators.js (Paso 16)
const CACHE_NAME = 'tensia-shell-v5';

/** Recursos estáticos del shell que se cachean al instalar el SW. */
const SHELL_URLS = [
  '/',
  '/styles/main.css',
  '/src/app.js',
  '/src/chart.js',
  '/src/infra/localStorageAdapter.js',
  '/src/domain/measurement.js',
  '/src/services/measurementService.js',
  '/manifest.json',
  // D3 submódulos desde CDN jsDelivr (importmap en index.html — ADR-006)
  'https://cdn.jsdelivr.net/npm/d3-selection@3/+esm',
  'https://cdn.jsdelivr.net/npm/d3-scale@4/+esm',
  'https://cdn.jsdelivr.net/npm/d3-axis@3/+esm',
  'https://cdn.jsdelivr.net/npm/d3-shape@3/+esm',
];

// --- Instalación: precaché del shell ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
  );
  // Activa el nuevo SW sin esperar a que se cierren las pestañas existentes
  self.skipWaiting();
});

// --- Activación: limpieza de cachés antiguas ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  // Toma el control inmediato de las pestañas abiertas
  self.clients.claim();
});

// --- Fetch: cache-first para el shell + CDN D3, red para el resto ---
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // Las rutas de la API van siempre a la red (en MVP no se usan para datos,
  // pero se mantiene por compatibilidad con entornos de desarrollo/tests)
  if (url.origin === self.location.origin && url.pathname.startsWith('/measurements')) {
    return;
  }

  // Para recursos del mismo origen o CDN D3 cacheados: cache-first
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached ?? fetch(event.request),
    ),
  );
});
