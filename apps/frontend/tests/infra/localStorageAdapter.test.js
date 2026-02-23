/**
 * Tests unitarios: adaptador de persistencia — localStorageAdapter.js
 * Verifica el contrato getAll() / save() usando el localStorage de jsdom.
 *
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { getAll, save } from '../../src/infra/localStorageAdapter.js';

const STORAGE_KEY = 'bp_measurements';

// Limpia el localStorage antes de cada test para garantizar aislamiento
beforeEach(() => {
  localStorage.clear();
});

// =========================================================
// getAll()
// =========================================================

describe('localStorageAdapter.getAll', () => {
  test('devuelve [] si localStorage está vacío', async () => {
    const resultado = await getAll();
    expect(resultado).toEqual([]);
  });

  test('devuelve [] si la clave no existe', async () => {
    localStorage.removeItem(STORAGE_KEY);
    const resultado = await getAll();
    expect(resultado).toEqual([]);
  });

  test('devuelve [] si el JSON almacenado está corrupto', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken json{{');
    const resultado = await getAll();
    expect(resultado).toEqual([]);
  });

  test('devuelve [] si measurements no es un array', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: '1.0', measurements: null }));
    const resultado = await getAll();
    expect(resultado).toEqual([]);
  });

  test('devuelve las mediciones almacenadas', async () => {
    const mediciones = [
      { id: 'a1', systolic: 120, diastolic: 80, measuredAt: '2026-02-18T10:00:00.000Z', source: 'manual' },
      { id: 'a2', systolic: 130, diastolic: 85, measuredAt: '2026-02-19T10:00:00.000Z', source: 'manual' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: '1.0', measurements: mediciones }));

    const resultado = await getAll();

    expect(resultado).toHaveLength(2);
    expect(resultado[0].id).toBe('a1');
    expect(resultado[1].id).toBe('a2');
  });

  test('devuelve una copia independiente (no la misma referencia)', async () => {
    const mediciones = [{ id: 'x', systolic: 120, diastolic: 80, measuredAt: '2026-01-01T00:00:00.000Z', source: 'manual' }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: '1.0', measurements: mediciones }));

    const resultado = await getAll();
    resultado.push({ id: 'inyectado' });

    // Una segunda lectura no debe ver el ítem inyectado
    const resultado2 = await getAll();
    expect(resultado2).toHaveLength(1);
  });
});

// =========================================================
// save()
// =========================================================

describe('localStorageAdapter.save', () => {
  test('persiste las mediciones en localStorage', async () => {
    const mediciones = [
      { id: 'b1', systolic: 115, diastolic: 75, measuredAt: '2026-02-18T08:00:00.000Z', source: 'manual' },
    ];

    await save(mediciones);

    const raw = localStorage.getItem(STORAGE_KEY);
    const data = JSON.parse(raw);
    expect(data.version).toBe('1.0');
    expect(data.measurements).toHaveLength(1);
    expect(data.measurements[0].id).toBe('b1');
  });

  test('sobreescribe el contenido anterior completo', async () => {
    await save([{ id: 'orig', systolic: 120, diastolic: 80, measuredAt: '2026-01-01T00:00:00.000Z', source: 'manual' }]);
    await save([{ id: 'nuevo', systolic: 130, diastolic: 85, measuredAt: '2026-01-02T00:00:00.000Z', source: 'manual' }]);

    const resultado = await getAll();
    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('nuevo');
  });

  test('persiste un array vacío sin error', async () => {
    await expect(save([])).resolves.toBeUndefined();
    const resultado = await getAll();
    expect(resultado).toEqual([]);
  });
});

// =========================================================
// Ciclo completo: save → getAll
// =========================================================

describe('localStorageAdapter — ciclo completo', () => {
  test('guarda y recupera varias mediciones manteniendo todos los campos', async () => {
    const mediciones = [
      { id: 'c1', systolic: 120, diastolic: 80, pulse: 72, measuredAt: '2026-02-18T10:00:00.000Z', source: 'manual' },
      { id: 'c2', systolic: 135, diastolic: 88, measuredAt: '2026-02-19T09:00:00.000Z', source: 'manual' },
    ];

    await save(mediciones);
    const recuperadas = await getAll();

    expect(recuperadas).toHaveLength(2);
    expect(recuperadas[0]).toEqual(mediciones[0]);
    expect(recuperadas[1]).toEqual(mediciones[1]);
  });
});
