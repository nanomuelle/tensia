/**
 * Capa de controller: recibe el request HTTP, delega al servicio y devuelve la respuesta.
 * No contiene lógica de negocio; solo coordina request → servicio → response.
 */

/**
 * Crea una instancia del controller de mediciones.
 *
 * @param {object} service - Servicio de mediciones con métodos listAll() y create().
 * @returns {{ getAll: Function, create: Function }}
 */
export function createMeasurementController(service) {
  /**
   * GET /measurements
   * Devuelve todas las mediciones ordenadas por fecha descendente.
   */
  async function getAll(req, res) {
    try {
      const mediciones = await service.listAll();
      res.status(200).json(mediciones);
    } catch (error) {
      res.status(500).json({ error: 'Error interno al obtener las mediciones.' });
    }
  }

  /**
   * POST /measurements
   * Crea una nueva medición con los datos del body.
   * Responde 400 si la validación falla.
   */
  async function create(req, res) {
    try {
      const nuevaMedicion = await service.create(req.body);
      res.status(201).json(nuevaMedicion);
    } catch (error) {
      // Errores de validación de negocio → 400
      res.status(400).json({ error: error.message });
    }
  }

  return { getAll, create };
}
