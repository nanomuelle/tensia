/**
 * Capa de dominio: validaciones de negocio para una medición de tensión arterial.
 * No depende de Express ni de ningún adaptador externo.
 *
 * Rangos clínicamente plausibles basados en:
 *   - OMS (WHO) — Hypertension Fact Sheet (sept. 2025)
 *     https://www.who.int/news-room/fact-sheets/detail/hypertension
 *   - NHS — Blood pressure test (nov. 2025)
 *     https://www.nhs.uk/conditions/blood-pressure-test/
 */

/** Límites fisiológicamente posibles para automedición doméstica (en mmHg y bpm). */
export const MEASUREMENT_LIMITS = {
  systolic:  { min: 50,  max: 300 }, // mmHg
  diastolic: { min: 30,  max: 200 }, // mmHg
  pulse:     { min: 20,  max: 300 }, // bpm
};

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
  const { min: sysMin, max: sysMax } = MEASUREMENT_LIMITS.systolic;
  if (systolic < sysMin || systolic > sysMax) {
    throw new Error(`"systolic" debe estar entre ${sysMin} y ${sysMax} mmHg (OMS/NHS).`);
  }

  // --- Validaciones de tipo y valor: diastólica ---
  const diastolic = Number(data.diastolic);
  if (!Number.isInteger(diastolic) || diastolic <= 0) {
    throw new Error('"diastolic" debe ser un número entero positivo.');
  }
  const { min: diaMin, max: diaMax } = MEASUREMENT_LIMITS.diastolic;
  if (diastolic < diaMin || diastolic > diaMax) {
    throw new Error(`"diastolic" debe estar entre ${diaMin} y ${diaMax} mmHg (OMS/NHS).`);
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
    const { min: pulMin, max: pulMax } = MEASUREMENT_LIMITS.pulse;
    if (pulse < pulMin || pulse > pulMax) {
      throw new Error(`"pulse" debe estar entre ${pulMin} y ${pulMax} bpm (OMS/NHS).`);
    }
  }

  // --- Validación de fecha ISO 8601 ---
  const fecha = new Date(data.measuredAt);
  if (isNaN(fecha.getTime())) {
    throw new Error('"measuredAt" debe ser una fecha válida en formato ISO 8601.');
  }
}
