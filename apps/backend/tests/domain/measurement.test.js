/**
 * Tests unitarios: capa de dominio — validateMeasurement.
 */

import { describe, test, expect } from '@jest/globals';
import { validateMeasurement } from '../../src/domain/measurement.js';

describe('validateMeasurement', () => {
  // Datos base válidos reutilizables
  const datosValidos = {
    systolic: 120,
    diastolic: 80,
    measuredAt: '2026-02-18T10:00:00.000Z',
  };

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
