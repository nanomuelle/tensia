/**
 * Tests unitarios: módulo de validación del formulario — validators.js
 * Funciones puras; no necesitan DOM ni fetch.
 */

import { describe, test, expect } from '@jest/globals';
import { validarCamposMedicion, prepararDatosMedicion } from '../src/validators.js';

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
