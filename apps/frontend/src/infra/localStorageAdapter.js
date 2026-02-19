/**
 * Adaptador de persistencia en localStorage para uso anónimo (MVP).
 * Implementa el contrato de adaptadores: getAll() y save().
 *
 * Clave de almacenamiento: bp_measurements
 * Formato: { version: "1.0", measurements: [...] }
 *
 * Aviso iOS/Safari (política ITP de Apple):
 *   El contenido de localStorage puede borrarse si la PWA no se usa durante más de 7 días.
 *   La UI muestra un aviso informativo en Safari/iOS (ver index.html).
 */

const STORAGE_KEY = 'bp_measurements';

/**
 * Obtiene todas las mediciones almacenadas en localStorage.
 *
 * @returns {Promise<Array>} Array de mediciones. Vacío si no hay datos.
 */
export async function getAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data.measurements) ? data.measurements : [];
  } catch {
    // JSON corrupto: se trata como sin datos
    return [];
  }
}

/**
 * Persiste el array completo de mediciones en localStorage.
 * Reemplaza el contenido anterior; el llamante es responsable de pasar el array completo.
 *
 * @param {Array} mediciones - Array de objetos de medición.
 * @returns {Promise<void>}
 */
export async function save(mediciones) {
  const data = { version: '1.0', measurements: mediciones };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
