/**
 * Capa de servicio (frontend): lógica de aplicación para mediciones de tensión arterial.
 * Recibe el adaptador de persistencia por inyección de dependencias (ADR-005).
 * No depende del DOM ni de fetch.
 *
 * Portado del backend (apps/backend/src/services/measurementService.js).
 * Usa crypto.randomUUID() nativo del navegador en lugar de la librería uuid.
 */

import { validateMeasurement } from '../domain/measurement.js';
import { emit, Events } from '../shared/eventBus.js';

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
      id: crypto.randomUUID(),
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

    // Notificar a observadores de que se ha guardado una medición (US-12).
    // El CustomEvent permite que la gráfica y la lista se actualicen
    // automáticamente sin que el formulario los llame directamente.
    emit(Events.MEASUREMENT_SAVED, nuevaMedicion);

    return nuevaMedicion;
  }

  return { listAll, create };
}
