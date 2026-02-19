/**
 * Tests unitarios: capa de dominio (frontend) — validateMeasurement.
 * Módulo puro, entorno node es suficiente.
 */

import { describe, test, expect } from '@jest/globals';
import { validateMeasurement, MEASUREMENT_LIMITS } from '../../src/domain/measurement.js';

// Datos base válidos reutilizables
const datosValidos = {
  systolic: 120,
  diastolic: 80,
  measuredAt: '2026-02-18T10:00:00.000Z',
};

describe('validateMeasurement (frontend/domain)', () => {

  // --- Casos válidos ---

  test('no lanza error con datos mínimos válidos', () => {
    expect(() => validateMeasurement(datosValidos)).not.toThrow();
  });

  test('no lanza error cuando pulse es un entero positivo válido', () => {
    expect(() => validateMeasurement({ ...datosValidos, pulse: 72 })).not.toThrow();
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

  // --- Tipo y valor: sistólica ---

  test('lanza error si systolic es cero', () => {
    expect(() => validateMeasurement({ ...datosValidos, systolic: 0 })).toThrow('"systolic"');
  });

  test('lanza error si systolic es negativo', () => {
    expect(() => validateMeasurement({ ...datosValidos, systolic: -10 })).toThrow('"systolic"');
  });

  test('lanza error si systolic es decimal', () => {
    expect(() => validateMeasurement({ ...datosValidos, systolic: 120.5 })).toThrow('"systolic"');
  });

  test(`lanza error si systolic < ${MEASUREMENT_LIMITS.systolic.min}`, () => {
    expect(() => validateMeasurement({ ...datosValidos, systolic: MEASUREMENT_LIMITS.systolic.min - 1 })).toThrow();
  });

  test(`lanza error si systolic > ${MEASUREMENT_LIMITS.systolic.max}`, () => {
    expect(() => validateMeasurement({ ...datosValidos, systolic: MEASUREMENT_LIMITS.systolic.max + 1 })).toThrow();
  });

  // --- Tipo y valor: diastólica ---

  test('lanza error si diastolic es cero', () => {
    expect(() => validateMeasurement({ ...datosValidos, diastolic: 0 })).toThrow('"diastolic"');
  });

  test(`lanza error si diastolic < ${MEASUREMENT_LIMITS.diastolic.min}`, () => {
    expect(() => validateMeasurement({ ...datosValidos, diastolic: MEASUREMENT_LIMITS.diastolic.min - 1 })).toThrow();
  });

  test(`lanza error si diastolic > ${MEASUREMENT_LIMITS.diastolic.max}`, () => {
    expect(() => validateMeasurement({ ...datosValidos, diastolic: MEASUREMENT_LIMITS.diastolic.max + 1 })).toThrow();
  });

  // --- Validación lógica: sys > dia ---

  test('lanza error si systolic === diastolic', () => {
    expect(() => validateMeasurement({ ...datosValidos, systolic: 80, diastolic: 80 })).toThrow();
  });

  test('lanza error si systolic < diastolic', () => {
    expect(() => validateMeasurement({ ...datosValidos, systolic: 70, diastolic: 80 })).toThrow();
  });

  // --- Tipo y valor: pulso (opcional) ---

  test('lanza error si pulse es decimal', () => {
    expect(() => validateMeasurement({ ...datosValidos, pulse: 70.5 })).toThrow('"pulse"');
  });

  test('lanza error si pulse es cero', () => {
    expect(() => validateMeasurement({ ...datosValidos, pulse: 0 })).toThrow('"pulse"');
  });

  test(`lanza error si pulse < ${MEASUREMENT_LIMITS.pulse.min}`, () => {
    expect(() => validateMeasurement({ ...datosValidos, pulse: MEASUREMENT_LIMITS.pulse.min - 1 })).toThrow();
  });

  test(`lanza error si pulse > ${MEASUREMENT_LIMITS.pulse.max}`, () => {
    expect(() => validateMeasurement({ ...datosValidos, pulse: MEASUREMENT_LIMITS.pulse.max + 1 })).toThrow();
  });

  test('no lanza error si pulse es null (campo omitido)', () => {
    expect(() => validateMeasurement({ ...datosValidos, pulse: null })).not.toThrow();
  });

  test('no lanza error si pulse es string vacío (campo omitido)', () => {
    expect(() => validateMeasurement({ ...datosValidos, pulse: '' })).not.toThrow();
  });

  // --- Fecha ---

  test('lanza error si measuredAt no es fecha válida', () => {
    expect(() => validateMeasurement({ ...datosValidos, measuredAt: 'no-es-fecha' })).toThrow('measuredAt');
  });

  test('no lanza error con fecha ISO 8601 válida', () => {
    expect(() => validateMeasurement({ ...datosValidos, measuredAt: '2026-02-18T10:00:00.000Z' })).not.toThrow();
  });
});
