/**
 * Service Worker de Tensia — caché del shell de la aplicación.
 * Estrategia: cache-first para los recursos estáticos del shell.
 * Las peticiones a la API (/measurements) se dejan pasar a la red (sin cachear).
 *
 * En uso anónimo (ADR-005) los datos viven en localStorage,
 * por lo que la app funciona completamente offline una vez instalada.
 */

const CACHE_NAME = 'tensia-shell-v1';

/** Recursos estáticos del shell que se cachean al instalar el SW. */
const SHELL_URLS = [
  '/',
  '/styles.css',
  '/src/app.js',
  '/src/validators.js',
  '/src/infra/localStorageAdapter.js',
  '/src/domain/measurement.js',
  '/src/services/measurementService.js',
  '/manifest.json',
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

// --- Fetch: cache-first para el shell, red para el resto ---
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET al mismo origen
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Las rutas de la API van siempre a la red (en MVP no se usan para datos,
  // pero se mantiene por compatibilidad con entornos de desarrollo/tests)
  if (url.pathname.startsWith('/measurements')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached ?? fetch(event.request),
    ),
  );
});
