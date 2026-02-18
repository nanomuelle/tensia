/**
 * Tests unitarios: capa de dominio — validateMeasurement.
 */

import { describe, test, expect } from '@jest/globals';
import { validateMeasurement, MEASUREMENT_LIMITS } from '../../src/domain/measurement.js';

// Datos base válidos reutilizables (nivel de módulo para ser accesibles en todos los describe)
const datosValidos = {
  systolic: 120,
  diastolic: 80,
  measuredAt: '2026-02-18T10:00:00.000Z',
};

describe('validateMeasurement', () => {

  // --- Casos válidos ---

  test('no lanza error con datos mínimos válidos', () => {
    expect(() => validateMeasurement(datosValidos)).not.toThrow();
  });

  test('no lanza error cuando pulse es un entero positivo válido', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, pulse: 72 }),
    ).not.toThrow();
  });

  test('no lanza error cuando pulse no se proporciona', () => {
    expect(() => validateMeasurement({ ...datosValidos })).not.toThrow();
  });

  // --- Campos requeridos ausentes ---

  test('lanza error si falta systolic', () => {
    const { systolic, ...sinSystolic } = datosValidos;
    expect(() => validateMeasurement(sinSystolic)).toThrow('systolic');
  });

  test('lanza error si falta diastolic', () => {
    const { diastolic, ...sinDiastolic } = datosValidos;
    expect(() => validateMeasurement(sinDiastolic)).toThrow('diastolic');
  });

  test('lanza error si falta measuredAt', () => {
    const { measuredAt, ...sinFecha } = datosValidos;
    expect(() => validateMeasurement(sinFecha)).toThrow('measuredAt');
  });

  // --- Tipos y valores inválidos ---

  test('lanza error si systolic no es entero positivo (cero)', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: 0 }),
    ).toThrow('"systolic"');
  });

  test('lanza error si systolic es negativo', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: -10 }),
    ).toThrow('"systolic"');
  });

  test('lanza error si systolic es decimal', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: 120.5 }),
    ).toThrow('"systolic"');
  });

  test('lanza error si diastolic es cero', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, diastolic: 0 }),
    ).toThrow('"diastolic"');
  });

  test('lanza error si diastolic es negativo', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, diastolic: -5 }),
    ).toThrow('"diastolic"');
  });

  // --- Validación lógica sistólica > diastólica ---

  test('lanza error si systolic es menor que diastolic', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: 70, diastolic: 80 }),
    ).toThrow();
  });

  test('lanza error si systolic es igual a diastolic', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: 80, diastolic: 80 }),
    ).toThrow();
  });

  // --- Pulso inválido ---

  test('lanza error si pulse es cero', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, pulse: 0 }),
    ).toThrow('"pulse"');
  });

  test('lanza error si pulse es decimal', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, pulse: 72.5 }),
    ).toThrow('"pulse"');
  });

  test('no lanza error si pulse es null (se ignora)', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, pulse: null }),
    ).not.toThrow();
  });

  // --- Fecha inválida ---

  test('lanza error si measuredAt no es una fecha válida', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, measuredAt: 'no-es-fecha' }),
    ).toThrow('measuredAt');
  });

  test('acepta una fecha ISO 8601 sin milisegundos', () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, measuredAt: '2026-02-18T10:00:00Z' }),
    ).not.toThrow();
  });
});

// =========================================================
// TC-12 — Rangos clínicamente plausibles (OMS / NHS)
// sistólica [50, 300] mmHg · diastólica [30, 200] mmHg · pulso [20, 300] bpm
// =========================================================

describe('TC-12 — rangos clínicos: sistólica [50-300 mmHg]', () => {
  const { min: sysMin, max: sysMax } = MEASUREMENT_LIMITS.systolic;

  test(`acepta sistólica en el límite inferior (${sysMin})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: sysMin, diastolic: 30 }),
    ).not.toThrow();
  });

  test(`acepta sistólica en el límite superior (${sysMax})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: sysMax, diastolic: 80 }),
    ).not.toThrow();
  });

  test(`rechaza sistólica por debajo del mínimo (${sysMin - 1})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: sysMin - 1, diastolic: 30 }),
    ).toThrow(`${sysMin}`);
  });

  test(`rechaza sistólica por encima del máximo (${sysMax + 1})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: sysMax + 1, diastolic: 80 }),
    ).toThrow(`${sysMax}`);
  });
});

describe('TC-12 — rangos clínicos: diastólica [30-200 mmHg]', () => {
  const { min: diaMin, max: diaMax } = MEASUREMENT_LIMITS.diastolic;

  test(`acepta diastólica en el límite inferior (${diaMin})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: 60, diastolic: diaMin }),
    ).not.toThrow();
  });

  test(`acepta diastólica en el límite superior (${diaMax})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: 250, diastolic: diaMax }),
    ).not.toThrow();
  });

  test(`rechaza diastólica por debajo del mínimo (${diaMin - 1})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: 60, diastolic: diaMin - 1 }),
    ).toThrow(`${diaMin}`);
  });

  test(`rechaza diastólica por encima del máximo (${diaMax + 1})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, systolic: 250, diastolic: diaMax + 1 }),
    ).toThrow(`${diaMax}`);
  });
});

describe('TC-12 — rangos clínicos: pulso [20-300 bpm]', () => {
  const { min: pulMin, max: pulMax } = MEASUREMENT_LIMITS.pulse;

  test(`acepta pulso en el límite inferior (${pulMin})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, pulse: pulMin }),
    ).not.toThrow();
  });

  test(`acepta pulso en el límite superior (${pulMax})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, pulse: pulMax }),
    ).not.toThrow();
  });

  test(`rechaza pulso por debajo del mínimo (${pulMin - 1})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, pulse: pulMin - 1 }),
    ).toThrow(`${pulMin}`);
  });

  test(`rechaza pulso por encima del máximo (${pulMax + 1})`, () => {
    expect(() =>
      validateMeasurement({ ...datosValidos, pulse: pulMax + 1 }),
    ).toThrow(`${pulMax}`);
  });

  test('no valida pulso cuando no se proporciona (campo opcional)', () => {
    expect(() => validateMeasurement({ ...datosValidos })).not.toThrow();
  });
});
