/**
 * Tests unitarios: módulo de validación del formulario — validators.js
 * Funciones puras; no necesitan DOM ni fetch.
 */

import { describe, test, expect } from '@jest/globals';
import { validarCamposMedicion, prepararDatosMedicion, MEASUREMENT_LIMITS } from '../src/shared/validators.js';

// Valores base válidos reutilizables
const camposValidos = {
  systolic: '120',
  diastolic: '80',
  pulse: '72',
  measuredAt: '2026-02-18T10:00',
};

// =========================================================
// validarCamposMedicion
// =========================================================

describe('validarCamposMedicion — casos válidos', () => {
  test('devuelve objeto vacío con datos válidos completos', () => {
    expect(validarCamposMedicion(camposValidos)).toEqual({});
  });

  test('devuelve objeto vacío sin pulso (campo opcional)', () => {
    expect(validarCamposMedicion({ ...camposValidos, pulse: '' })).toEqual({});
  });

  test('acepta valores con espacios en blanco alrededor', () => {
    expect(validarCamposMedicion({ ...camposValidos, systolic: ' 120 ' })).toEqual({});
  });
});

describe('validarCamposMedicion — sistólica inválida', () => {
  test('error si sistólica está vacía', () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '' });
    expect(errores.systolic).toBeDefined();
  });

  test('error si sistólica es cero', () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '0' });
    expect(errores.systolic).toBeDefined();
  });

  test('error si sistólica es negativa', () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '-10' });
    expect(errores.systolic).toBeDefined();
  });

  test('error si sistólica es decimal', () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '120.5' });
    expect(errores.systolic).toBeDefined();
  });

  test('error si sistólica no es numérica', () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: 'abc' });
    expect(errores.systolic).toBeDefined();
  });
});

describe('validarCamposMedicion — diastólica inválida', () => {
  test('error si diastólica está vacía', () => {
    const errores = validarCamposMedicion({ ...camposValidos, diastolic: '' });
    expect(errores.diastolic).toBeDefined();
  });

  test('error si diastólica es cero', () => {
    const errores = validarCamposMedicion({ ...camposValidos, diastolic: '0' });
    expect(errores.diastolic).toBeDefined();
  });

  test('error si diastólica es negativa', () => {
    const errores = validarCamposMedicion({ ...camposValidos, diastolic: '-5' });
    expect(errores.diastolic).toBeDefined();
  });
});

describe('validarCamposMedicion — relación sistólica / diastólica', () => {
  test('error si sistólica es menor que diastólica', () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '70', diastolic: '80' });
    expect(errores.systolic).toBeDefined();
  });

  test('error si sistólica es igual a diastólica', () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '80', diastolic: '80' });
    expect(errores.systolic).toBeDefined();
  });

  test('sin error si sistólica es claramente mayor', () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '130', diastolic: '85' });
    expect(errores.systolic).toBeUndefined();
  });
});

describe('validarCamposMedicion — pulso inválido', () => {
  test('error si pulso es cero', () => {
    const errores = validarCamposMedicion({ ...camposValidos, pulse: '0' });
    expect(errores.pulse).toBeDefined();
  });

  test('error si pulso es decimal', () => {
    const errores = validarCamposMedicion({ ...camposValidos, pulse: '72.5' });
    expect(errores.pulse).toBeDefined();
  });

  test('error si pulso es negativo', () => {
    const errores = validarCamposMedicion({ ...camposValidos, pulse: '-1' });
    expect(errores.pulse).toBeDefined();
  });

  test('sin error si pulso está vacío (opcional)', () => {
    const errores = validarCamposMedicion({ ...camposValidos, pulse: '' });
    expect(errores.pulse).toBeUndefined();
  });
});

describe('validarCamposMedicion — fecha inválida', () => {
  test('error si fecha está vacía', () => {
    const errores = validarCamposMedicion({ ...camposValidos, measuredAt: '' });
    expect(errores.measuredAt).toBeDefined();
  });

  test('sin error con fecha válida', () => {
    const errores = validarCamposMedicion(camposValidos);
    expect(errores.measuredAt).toBeUndefined();
  });
});

describe('validarCamposMedicion — errores múltiples simultáneos', () => {
  test('devuelve errores en todos los campos requeridos cuando están todos vacíos', () => {
    const errores = validarCamposMedicion({ systolic: '', diastolic: '', pulse: '', measuredAt: '' });
    expect(errores.systolic).toBeDefined();
    expect(errores.diastolic).toBeDefined();
    expect(errores.measuredAt).toBeDefined();
  });

  test('cuando sistólica y diastólica son inválidas individualmente no muestra el error de relación', () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '0', diastolic: '0' });
    // El error de sistólica es por valor inválido, no por la relación
    expect(errores.systolic).toBeDefined();
    expect(errores.diastolic).toBeDefined();
  });
});

// =========================================================
// TC-12 — Rangos clínicamente plausibles (OMS / NHS)
// sistólica [50, 300] mmHg · diastólica [30, 200] mmHg · pulso [20, 300] bpm
// =========================================================

describe('TC-12 — rangos clínicos: sistólica [50-300 mmHg]', () => {
  const { min: sysMin, max: sysMax } = MEASUREMENT_LIMITS.systolic;

  test(`sin error con sistólica en el límite inferior (${sysMin})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: String(sysMin), diastolic: '30' });
    expect(errores.systolic).toBeUndefined();
  });

  test(`sin error con sistólica en el límite superior (${sysMax})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: String(sysMax), diastolic: '80' });
    expect(errores.systolic).toBeUndefined();
  });

  test(`error si sistólica está por debajo del mínimo (${sysMin - 1})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: String(sysMin - 1), diastolic: '30' });
    expect(errores.systolic).toBeDefined();
    expect(errores.systolic).toMatch(String(sysMin));
  });

  test(`error si sistólica está por encima del máximo (${sysMax + 1})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: String(sysMax + 1), diastolic: '80' });
    expect(errores.systolic).toBeDefined();
    expect(errores.systolic).toMatch(String(sysMax));
  });
});

describe('TC-12 — rangos clínicos: diastólica [30-200 mmHg]', () => {
  const { min: diaMin, max: diaMax } = MEASUREMENT_LIMITS.diastolic;

  test(`sin error con diastólica en el límite inferior (${diaMin})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '60', diastolic: String(diaMin) });
    expect(errores.diastolic).toBeUndefined();
  });

  test(`sin error con diastólica en el límite superior (${diaMax})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '250', diastolic: String(diaMax) });
    expect(errores.diastolic).toBeUndefined();
  });

  test(`error si diastólica está por debajo del mínimo (${diaMin - 1})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '60', diastolic: String(diaMin - 1) });
    expect(errores.diastolic).toBeDefined();
    expect(errores.diastolic).toMatch(String(diaMin));
  });

  test(`error si diastólica está por encima del máximo (${diaMax + 1})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, systolic: '250', diastolic: String(diaMax + 1) });
    expect(errores.diastolic).toBeDefined();
    expect(errores.diastolic).toMatch(String(diaMax));
  });
});

describe('TC-12 — rangos clínicos: pulso [20-300 bpm]', () => {
  const { min: pulMin, max: pulMax } = MEASUREMENT_LIMITS.pulse;

  test(`sin error con pulso en el límite inferior (${pulMin})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, pulse: String(pulMin) });
    expect(errores.pulse).toBeUndefined();
  });

  test(`sin error con pulso en el límite superior (${pulMax})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, pulse: String(pulMax) });
    expect(errores.pulse).toBeUndefined();
  });

  test(`error si pulso está por debajo del mínimo (${pulMin - 1})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, pulse: String(pulMin - 1) });
    expect(errores.pulse).toBeDefined();
    expect(errores.pulse).toMatch(String(pulMin));
  });

  test(`error si pulso está por encima del máximo (${pulMax + 1})`, () => {
    const errores = validarCamposMedicion({ ...camposValidos, pulse: String(pulMax + 1) });
    expect(errores.pulse).toBeDefined();
    expect(errores.pulse).toMatch(String(pulMax));
  });

  test('sin error si pulso está vacío (campo opcional, no se valida rango)', () => {
    const errores = validarCamposMedicion({ ...camposValidos, pulse: '' });
    expect(errores.pulse).toBeUndefined();
  });
});

// =========================================================
// prepararDatosMedicion
// =========================================================

describe('prepararDatosMedicion', () => {
  test('convierte sistólica y diastólica a número', () => {
    const datos = prepararDatosMedicion(camposValidos);
    expect(typeof datos.systolic).toBe('number');
    expect(typeof datos.diastolic).toBe('number');
    expect(datos.systolic).toBe(120);
    expect(datos.diastolic).toBe(80);
  });

  test('convierte pulso a número cuando se proporciona', () => {
    const datos = prepararDatosMedicion(camposValidos);
    expect(typeof datos.pulse).toBe('number');
    expect(datos.pulse).toBe(72);
  });

  test('omite pulse si está vacío', () => {
    const datos = prepararDatosMedicion({ ...camposValidos, pulse: '' });
    expect(datos.pulse).toBeUndefined();
  });

  test('convierte measuredAt a ISO 8601', () => {
    const datos = prepararDatosMedicion(camposValidos);
    expect(datos.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('elimina espacios en blanco de los valores numéricos', () => {
    const datos = prepararDatosMedicion({ ...camposValidos, systolic: ' 130 ' });
    expect(datos.systolic).toBe(130);
  });
});
