/**
 * Módulo de validación de formulario — capa de presentación.
 * Funciones puras: reciben valores planos y devuelven objetos de error.
 * No dependen del DOM ni de fetch; son directamente testeables en cualquier entorno.
 *
 * La validación de negocio definitiva siempre la aplica el backend (400).
 * Este módulo solo evita peticiones innecesarias con datos manifiestamente inválidos.
 *
 * Rangos clínicamente plausibles basados en:
 *   - OMS (WHO) — Hypertension Fact Sheet (sept. 2025)
 *   - NHS — Blood pressure test (nov. 2025)
 */

/** Límites fisiológicamente posibles para automedición doméstica. */
export const MEASUREMENT_LIMITS = {
  systolic:  { min: 50,  max: 300 }, // mmHg
  diastolic: { min: 30,  max: 200 }, // mmHg
  pulse:     { min: 20,  max: 300 }, // bpm
};

/**
 * Valida los valores del formulario de registro manual.
 *
 * @param {{ systolic: string, diastolic: string, pulse: string, measuredAt: string }} campos
 *        Valores en cadena, tal como los devuelve `input.value`.
 * @returns {{ systolic?: string, diastolic?: string, pulse?: string, measuredAt?: string }}
 *          Objeto con los mensajes de error por campo. Vacío si todo es válido.
 */
export function validarCamposMedicion({ systolic, diastolic, pulse, measuredAt }) {
  const errores = {};

  // --- Sistólica ---
  const sys = systolic.trim();
  if (!sys) {
    errores.systolic = 'La sistólica es obligatoria.';
  } else if (!Number.isInteger(Number(sys)) || Number(sys) <= 0) {
    errores.systolic = 'Introduce un número entero positivo.';
  } else {
    const { min, max } = MEASUREMENT_LIMITS.systolic;
    if (Number(sys) < min || Number(sys) > max) {
      errores.systolic = `La sistólica debe estar entre ${min} y ${max} mmHg.`;
    }
  }

  // --- Diastólica ---
  const dia = diastolic.trim();
  if (!dia) {
    errores.diastolic = 'La diastólica es obligatoria.';
  } else if (!Number.isInteger(Number(dia)) || Number(dia) <= 0) {
    errores.diastolic = 'Introduce un número entero positivo.';
  } else {
    const { min, max } = MEASUREMENT_LIMITS.diastolic;
    if (Number(dia) < min || Number(dia) > max) {
      errores.diastolic = `La diastólica debe estar entre ${min} y ${max} mmHg.`;
    }
  }

  // --- Sistólica > Diastólica (solo si ambas son individualmente válidas) ---
  if (!errores.systolic && !errores.diastolic && Number(sys) <= Number(dia)) {
    errores.systolic = 'La sistólica debe ser mayor que la diastólica.';
  }

  // --- Pulso (opcional) ---
  const pul = pulse.trim();
  if (pul) {
    if (!Number.isInteger(Number(pul)) || Number(pul) <= 0) {
      errores.pulse = 'Introduce un número entero positivo.';
    } else {
      const { min, max } = MEASUREMENT_LIMITS.pulse;
      if (Number(pul) < min || Number(pul) > max) {
        errores.pulse = `El pulso debe estar entre ${min} y ${max} bpm.`;
      }
    }
  }

  // --- Fecha ---
  if (!measuredAt) {
    errores.measuredAt = 'La fecha y hora son obligatorias.';
  }

  return errores;
}

/**
 * Transforma los valores del formulario en el objeto de datos listo para el POST.
 * Solo llamar cuando `validarCamposMedicion` haya devuelto un objeto vacío.
 *
 * @param {{ systolic: string, diastolic: string, pulse: string, measuredAt: string }} campos
 * @returns {{ systolic: number, diastolic: number, pulse?: number, measuredAt: string }}
 */
export function prepararDatosMedicion({ systolic, diastolic, pulse, measuredAt }) {
  const datos = {
    systolic: Number(systolic.trim()),
    diastolic: Number(diastolic.trim()),
    measuredAt: new Date(measuredAt).toISOString(),
  };
  const pul = pulse.trim();
  if (pul) datos.pulse = Number(pul);
  return datos;
}
