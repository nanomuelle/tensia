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
// Raíz del frontend (apps/frontend/) desde apps/backend/src/api/
const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', 'apps', 'frontend');

/**
 * Crea y configura la aplicación Express.
 * En el MVP sirve únicamente los ficheros estáticos del frontend.
 *
 * @returns {import('express').Application}
 */
export function createApp() {
  const app = express();

  // --- Servicio de ficheros estáticos del frontend (ADR-005) ---
  // Se necesitan dos montajes:
  //   1. apps/frontend/public/ → sirve index.html, styles.css en http://localhost:3000/
  //   2. apps/frontend/        → sirve src/app.js, src/infra/*, src/domain/*, src/services/*
  //      (el HTML los referencia como /src/app.js → el navegador resuelve /src/app.js)
  app.use(express.static(path.join(FRONTEND_ROOT, 'public')));
  app.use(express.static(FRONTEND_ROOT));

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
