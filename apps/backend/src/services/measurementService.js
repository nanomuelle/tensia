/**
 * Capa de servicio: lógica de aplicación para mediciones de tensión arterial.
 * Recibe el adaptador de persistencia por inyección de dependencias.
 * No conoce Express (no recibe ni devuelve req/res).
 */

import { v4 as uuidv4 } from 'uuid';
import { validateMeasurement } from '../domain/measurement.js';

/**
 * Crea una instancia del servicio de mediciones.
 *
 * @param {object} adapter - Adaptador de persistencia con métodos getAll() y save().
 * @returns {{ listAll: Function, create: Function }}
 */
export function createMeasurementService(adapter) {
  /**
   * Devuelve todas las mediciones ordenadas por fecha de medición descendente.
   *
   * @returns {Promise<Array>}
   */
  async function listAll() {
    const mediciones = await adapter.getAll();
    return mediciones.sort(
      (a, b) => new Date(b.measuredAt) - new Date(a.measuredAt),
    );
  }

  /**
   * Crea y persiste una nueva medición manual.
   * Valida los datos antes de guardar; lanza un Error si son inválidos.
   *
   * @param {object} data - Datos de la medición (systolic, diastolic, pulse?, measuredAt).
   * @returns {Promise<object>} La medición creada con id y source asignados.
   * @throws {Error} Si la validación de negocio falla.
   */
  async function create(data) {
    // Validación en la capa de dominio
    validateMeasurement(data);

    const nuevaMedicion = {
      id: uuidv4(),
      systolic: Number(data.systolic),
      diastolic: Number(data.diastolic),
      ...(data.pulse !== undefined &&
        data.pulse !== null &&
        data.pulse !== '' && { pulse: Number(data.pulse) }),
      measuredAt: new Date(data.measuredAt).toISOString(),
      source: 'manual',
    };

    const mediciones = await adapter.getAll();
    mediciones.push(nuevaMedicion);
    await adapter.save(mediciones);

    return nuevaMedicion;
  }

  return { listAll, create };
}
