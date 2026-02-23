// @vitest-environment node
/**
 * Tests unitarios: shared/formatters.js
 * Módulo puro — entorno node es suficiente.
 */

import { describe, test, expect } from 'vitest';
import { fechaLocalActual, formatearFecha } from '../../src/shared/formatters.js';

describe('fechaLocalActual()', () => {
  test('devuelve una cadena con formato YYYY-MM-DDTHH:MM:SS', () => {
    const resultado = fechaLocalActual();
    // Verifica la forma exacta: 19 caracteres, separador T en posición 10 y : en 13 y 16
    expect(typeof resultado).toBe('string');
    expect(resultado).toHaveLength(19);
    expect(resultado).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  test('el valor corresponde aproximadamente a la hora actual', () => {
    const antes = Date.now();
    const resultado = fechaLocalActual();
    const despues = Date.now();

    // Reconstruir timestamp desde el string local no es trivial;
    // comprobamos que los primeros 4 caracteres sean el año actual.
    const anioActual = new Date().getFullYear().toString();
    expect(resultado.slice(0, 4)).toBe(anioActual);

    // El resultado no debe diferir más de 2 segundos del momento actual
    // Convertimos la cadena a fecha usando offset del sistema
    const offsetMs = new Date().getTimezoneOffset() * 60000;
    const fechaResultado = new Date(resultado + 'Z').getTime() + offsetMs;
    expect(fechaResultado).toBeGreaterThanOrEqual(antes - 1000);
    expect(fechaResultado).toBeLessThanOrEqual(despues + 1000);
  });
});

describe('formatearFecha', () => {
  test('es una instancia de Intl.DateTimeFormat', () => {
    expect(formatearFecha).toBeInstanceOf(Intl.DateTimeFormat);
  });

  test('formatea una fecha en español', () => {
    // Fecha fija para resultado determinista
    const fecha = new Date('2026-02-18T10:00:00.000Z');
    const resultado = formatearFecha.format(fecha);
    // Debe ser una cadena no vacía
    expect(typeof resultado).toBe('string');
    expect(resultado.length).toBeGreaterThan(0);
  });
});
