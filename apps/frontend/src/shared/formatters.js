/**
 * Utilidades de formato de presentación.
 * Módulo puro — no depende del DOM.
 */

/** Formateador de fecha localizado en español. */
export const formatearFecha = new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * Genera el valor para un input[type="datetime-local"] con la fecha actual en hora local,
 * incluyendo segundos para evitar timestamps idénticos (BUG-01).
 * @returns {string} Cadena con formato "YYYY-MM-DDTHH:MM:SS"
 */
export function fechaLocalActual() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 19);
}
