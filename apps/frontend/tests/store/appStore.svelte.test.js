/**
 * Tests unitarios del store Svelte: appStore.svelte.js
 *
 * Verifica las transiciones de estado:
 *   - estado inicial de cada store
 *   - cargarMediciones → éxito: mediciones actualizadas, cargando=false, error=null
 *   - cargarMediciones → error: error con mensaje, cargando=false, mediciones vacías
 *   - comportamiento de subscribe (transiciones intermedias)
 *
 * No requiere DOM: svelte/store es un módulo puro.
 *
 * Referencia: docs/product/backlog.md → BK-27, Subtarea 1
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { mediciones, cargando, error, cargarMediciones } from '../../src/store/appStore.svelte.js';

// =========================================================
// Constantes de prueba
// =========================================================

const MEDICIONES_MOCK = [
  { id: '1', systolic: 120, diastolic: 80, measuredAt: '2026-02-18T10:00:00.000Z', source: 'manual' },
  { id: '2', systolic: 130, diastolic: 85, measuredAt: '2026-02-17T09:00:00.000Z', source: 'manual' },
];

// =========================================================
// Helpers
// =========================================================

function crearServicioMock({ listaMediciones = MEDICIONES_MOCK, debeFallar = false } = {}) {
  return {
    listAll: debeFallar
      ? vi.fn().mockRejectedValue(new Error('Error de almacenamiento'))
      : vi.fn().mockResolvedValue(listaMediciones),
  };
}

// =========================================================
// Reset de stores antes de cada test
// (los stores son singletons a nivel de módulo)
// =========================================================

beforeEach(() => {
  mediciones.set([]);
  cargando.set(false);
  error.set(null);
});

// =========================================================
// Estado inicial
// =========================================================

describe('Estado inicial', () => {
  test('mediciones arranca vacío', () => {
    expect(get(mediciones)).toEqual([]);
  });

  test('cargando arranca en false', () => {
    expect(get(cargando)).toBe(false);
  });

  test('error arranca en null', () => {
    expect(get(error)).toBeNull();
  });
});

// =========================================================
// cargarMediciones — transición de éxito
// =========================================================

describe('cargarMediciones — éxito', () => {
  test('pone cargando=true al inicio y false al terminar', async () => {
    const snapshots = [];
    const unsub = cargando.subscribe((v) => snapshots.push(v));

    await cargarMediciones(crearServicioMock());
    unsub();

    // false (valor inicial reset) → true (inicio carga) → false (fin)
    expect(snapshots).toEqual([false, true, false]);
  });

  test('asigna las mediciones devueltas por listAll', async () => {
    await cargarMediciones(crearServicioMock());

    expect(get(mediciones)).toEqual(MEDICIONES_MOCK);
  });

  test('cargando=false y error=null tras la resolución', async () => {
    await cargarMediciones(crearServicioMock());

    expect(get(cargando)).toBe(false);
    expect(get(error)).toBeNull();
  });

  test('limpia error previo antes de cargar', async () => {
    // Simular un error previo
    error.set('error anterior');

    await cargarMediciones(crearServicioMock());

    expect(get(error)).toBeNull();
  });
});

// =========================================================
// cargarMediciones — transición de error
// =========================================================

describe('cargarMediciones — error', () => {
  test('pone cargando=true al inicio y false tras el fallo', async () => {
    const snapshots = [];
    const unsub = cargando.subscribe((v) => snapshots.push(v));

    await cargarMediciones(crearServicioMock({ debeFallar: true }));
    unsub();

    expect(snapshots).toEqual([false, true, false]);
  });

  test('asigna el mensaje de error al store error', async () => {
    await cargarMediciones(crearServicioMock({ debeFallar: true }));

    expect(get(error)).toBe('Error de almacenamiento');
  });

  test('cargando=false tras el fallo', async () => {
    await cargarMediciones(crearServicioMock({ debeFallar: true }));

    expect(get(cargando)).toBe(false);
  });

  test('mediciones permanece vacío tras el fallo', async () => {
    await cargarMediciones(crearServicioMock({ debeFallar: true }));

    expect(get(mediciones)).toEqual([]);
  });
});

// =========================================================
// Comportamiento de subscribe (transiciones intermedias)
// =========================================================

describe('subscribe — transiciones intermedias', () => {
  test('subscribe de mediciones recibe el array final', async () => {
    const valores = [];
    const unsub = mediciones.subscribe((v) => valores.push(v));

    await cargarMediciones(crearServicioMock());
    unsub();

    // Último valor debe ser las mediciones cargadas
    expect(valores[valores.length - 1]).toEqual(MEDICIONES_MOCK);
  });

  test('la función unsubscribe detiene las notificaciones', async () => {
    const handler = vi.fn();
    const unsub = mediciones.subscribe(handler);
    unsub();

    await cargarMediciones(crearServicioMock());

    // Solo se invocó con el valor inicial (subscribe llama al handler inmediatamente)
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('múltiples suscriptores de cargando reciben las mismas transiciones', async () => {
    const snapshotsA = [];
    const snapshotsB = [];

    const unsubA = cargando.subscribe((v) => snapshotsA.push(v));
    const unsubB = cargando.subscribe((v) => snapshotsB.push(v));

    await cargarMediciones(crearServicioMock());

    unsubA();
    unsubB();

    expect(snapshotsA).toEqual(snapshotsB);
    expect(snapshotsA).toEqual([false, true, false]);
  });
});
