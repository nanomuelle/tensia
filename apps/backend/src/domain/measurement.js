/**
 * Capa de dominio: validaciones de negocio para una medición de tensión arterial.
 * No depende de Express ni de ningún adaptador externo.
 */

/**
 * Valida los datos de una medición.
 * Lanza un Error con mensaje descriptivo si los datos son inválidos.
 *
 * @param {object} data - Datos crudos de la medición (provenientes del request o de otro origen).
 * @throws {Error} Si algún campo requerido falta o tiene un valor inválido.
 */
export function validateMeasurement(data) {
  // --- Campos requeridos ---
  if (data.systolic === undefined || data.systolic === null) {
    throw new Error('El campo "systolic" (sistólica) es obligatorio.');
  }
  if (data.diastolic === undefined || data.diastolic === null) {
    throw new Error('El campo "diastolic" (diastólica) es obligatorio.');
  }
  if (!data.measuredAt) {
    throw new Error('El campo "measuredAt" (fecha de medición) es obligatorio.');
  }

  // --- Validaciones de tipo y valor: sistólica ---
  const systolic = Number(data.systolic);
  if (!Number.isInteger(systolic) || systolic <= 0) {
    throw new Error('"systolic" debe ser un número entero positivo.');
  }

  // --- Validaciones de tipo y valor: diastólica ---
  const diastolic = Number(data.diastolic);
  if (!Number.isInteger(diastolic) || diastolic <= 0) {
    throw new Error('"diastolic" debe ser un número entero positivo.');
  }

  // --- Validación lógica: sistólica > diastólica ---
  if (systolic <= diastolic) {
    throw new Error('"systolic" debe ser mayor que "diastolic".');
  }

  // --- Validaciones de tipo y valor: pulso (opcional) ---
  if (data.pulse !== undefined && data.pulse !== null && data.pulse !== '') {
    const pulse = Number(data.pulse);
    if (!Number.isInteger(pulse) || pulse <= 0) {
      throw new Error('"pulse" debe ser un número entero positivo.');
    }
  }

  // --- Validación de fecha ISO 8601 ---
  const fecha = new Date(data.measuredAt);
  if (isNaN(fecha.getTime())) {
    throw new Error('"measuredAt" debe ser una fecha válida en formato ISO 8601.');
  }
}
