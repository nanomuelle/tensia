/**
 * Módulo de acceso HTTP al backend de Tensia.
 *
 * ⚠️  USO SOLO EN DESARROLLO Y TESTS (ADR-005)
 * Con ADR-005, en producción MVP los datos viven en localStorage del cliente.
 * Este módulo ya no se usa en los flujos de la UI de producción.
 * Se mantiene para:
 *   - Tests de integración con el backend (api.test.js)
 *   - Entornos de desarrollo donde se quiere inspeccionar la API REST directamente
 *   - Compatibilidad con posibles herramientas de depuración
 *
 * Post-MVP (usuario autenticado): será sustituido por googleDriveAdapter.
 */

const BASE_URL = 'http://localhost:3000';

/**
 * Obtiene todas las mediciones del backend, ordenadas por fecha descendente.
 *
 * @returns {Promise<Array>} Array de mediciones.
 * @throws {Error} Si la respuesta no es 2xx.
 */
export async function getMediciones() {
  const respuesta = await fetch(`${BASE_URL}/measurements`);
  if (!respuesta.ok) {
    throw new Error(`Error al obtener mediciones: ${respuesta.status}`);
  }
  return respuesta.json();
}

/**
 * Crea una nueva medición en el backend.
 *
 * @param {{ systolic: number, diastolic: number, pulse?: number, measuredAt: string }} datos
 * @returns {Promise<object>} La medición creada con id y source asignados.
 * @throws {Error} Con el mensaje del backend si la validación falla (400) u otro error.
 */
export async function crearMedicion(datos) {
  const respuesta = await fetch(`${BASE_URL}/measurements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });

  const cuerpo = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(cuerpo.error ?? `Error del servidor: ${respuesta.status}`);
  }

  return cuerpo;
}
