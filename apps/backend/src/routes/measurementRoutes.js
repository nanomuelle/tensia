/**
 * Capa de rutas: registra los endpoints de la API de mediciones.
 * Recibe el controller por inyección de dependencias.
 */

import { Router } from 'express';

/**
 * Crea y devuelve un router de Express con las rutas de mediciones.
 *
 * @param {object} controller - Controller con métodos getAll() y create().
 * @returns {Router}
 */
export function createMeasurementRouter(controller) {
  const router = Router();

  // GET /measurements → lista todas las mediciones
  router.get('/measurements', controller.getAll);

  // POST /measurements → crea una nueva medición
  router.post('/measurements', controller.create);

  return router;
}
