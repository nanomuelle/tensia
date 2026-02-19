/**
 * Composición de la aplicación Express.
 * Une todas las capas (service, controller, router) mediante inyección de dependencias.
 * Exporta createApp para que pueda instanciarse con distintos adaptadores (producción, test, etc.).
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMeasurementService } from '../services/measurementService.js';
import { createMeasurementController } from '../controllers/measurementController.js';
import { createMeasurementRouter } from '../routes/measurementRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Raíz del frontend (apps/frontend/) desde apps/backend/src/api/
const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', 'apps', 'frontend');

/**
 * Crea y configura la aplicación Express.
 *
 * @param {object} adapter - Adaptador de persistencia inyectado (JsonFileAdapter u otro).
 * @returns {import('express').Application}
 */
export function createApp(adapter) {
  const app = express();

  // --- Servicio de ficheros estáticos del frontend ---
  // Con ADR-005, el backend sirve siempre los ficheros estáticos del frontend.
  // Su rol en producción MVP es exclusivamente este.
  // Se necesitan dos montajes:
  //   1. apps/frontend/public/ → sirve index.html, styles.css en http://localhost:3000/
  //   2. apps/frontend/        → sirve src/app.js, src/infra/*, src/domain/*, src/services/*
  //      (el HTML los referencia como /src/app.js → el navegador resuelve /src/app.js)
  // La variable SERVE_STATIC=true se mantiene para compatibilidad con Playwright (ADR-004),
  // pero en producción ya no es necesaria porque siempre está activo.
  app.use(express.static(path.join(FRONTEND_ROOT, 'public')));
  app.use(express.static(FRONTEND_ROOT));

  // --- Middlewares globales ---
  app.use(express.json());

  // CORS: solo relevante para entornos de desarrollo y tests de integración donde el frontend
  // se sirve desde un origen distinto al backend (ej. Live Server en VS Code, api.test.js).
  // En producción MVP el frontend lo sirve el propio Express, por lo que no hay petición cross-origin.
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // --- Composición de capas ---
  const service = createMeasurementService(adapter);
  const controller = createMeasurementController(service);
  const router = createMeasurementRouter(controller);

  app.use('/', router);

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
