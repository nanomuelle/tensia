/**
 * Composición de la aplicación Express.
 * Con ADR-005, el backend MVP solo sirve los ficheros estáticos del frontend.
 * Los endpoints de datos (/measurements) han sido eliminados; la persistencia
 * es responsabilidad del cliente (localStorageAdapter en el frontend).
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Directorio de build del frontend (dist/) desde apps/backend/src/api/
// El backend sirve la build compilada de Vite, que incluye el SW correcto y las
// variables de entorno (VITE_REDIRECT_URI) incrustadas en tiempo de compilación.
// Para desarrollo integrado: npm run build && npm run start:dev
const DIST_ROOT = path.resolve(__dirname, '..', '..', '..', '..', 'dist');

/**
 * Crea y configura la aplicación Express.
 * En el MVP sirve únicamente los ficheros estáticos del frontend.
 *
 * @returns {import('express').Application}
 */
export function createApp() {
  const app = express();

  // --- Servicio de ficheros estáticos del frontend (ADR-005) ---
  // Sirve la build compilada de Vite desde dist/.
  // Los assets tienen hashes en el nombre, el SW precachea todo automáticamente.
  app.use(express.static(DIST_ROOT));

  // --- SPA fallback: devolver index.html para cualquier GET que no sea un asset ---
  // Necesario para que el callback de Google OAuth (?code=...&state=...) llegue
  // siempre a la SPA, independientemente de si el Service Worker está activo.
  app.get('*', (req, res, next) => {
    // Solo para peticiones de navegación (no assets con extensión)
    if (req.path.includes('.')) return next();
    res.sendFile(path.join(DIST_ROOT, 'index.html'));
  });

  // --- Manejo de rutas no encontradas (404) ---
  app.use((req, res) => {
    res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
  });

  // --- Manejo de errores globales ---
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('Error no controlado:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });

  return app;
}
