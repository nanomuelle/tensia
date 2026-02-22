/**
 * Tests unitarios del store de estado: appStore.js
 *
 * Verifica las transiciones de estado:
 *   - cargando → mediciones (éxito)
 *   - cargando → error (fallo del servicio)
 *   - suscripción/desuscripción de handlers
 *
 * No requiere DOM: el store es un módulo puro.
 *
 * Referencia: docs/architecture/frontend-refactor-workplan.md#Paso-11
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { createAppStore } from '../../src/store/appStore.js';

// =========================================================
// Helpers
// =========================================================

const MEDICIONES_MOCK = [
  { id: '1', systolic: 120, diastolic: 80, measuredAt: '2026-02-18T10:00:00.000Z', source: 'manual' },
  { id: '2', systolic: 130, diastolic: 85, measuredAt: '2026-02-17T09:00:00.000Z', source: 'manual' },
];

function crearServicioMock({ mediciones = MEDICIONES_MOCK, debeFallar = false } = {}) {
  return {
    listAll: debeFallar
      ? jest.fn().mockRejectedValue(new Error('Error de almacenamiento'))
      : jest.fn().mockResolvedValue(mediciones),
  };
}

// =========================================================
// Estado inicial
// =========================================================

describe('Estado inicial', () => {
  test('getState() devuelve mediciones vacías, cargando=false y error=null', () => {
    const store = createAppStore(crearServicioMock());
    const state = store.getState();

    expect(state.mediciones).toEqual([]);
    expect(state.cargando).toBe(false);
    expect(state.error).toBeNull();
  });
});

// =========================================================
// cargarMediciones — transición de éxito
// =========================================================

describe('cargarMediciones — éxito', () => {
  test('notifica cargando=true antes de resolver', async () => {
    const servicio = crearServicioMock();
    const store = createAppStore(servicio);
    const snapshots = [];

    store.subscribe((s) => snapshots.push({ ...s }));

    await store.cargarMediciones();

    // Primera notificación: inicio de carga
    expect(snapshots[0].cargando).toBe(true);
    expect(snapshots[0].error).toBeNull();
    expect(snapshots[0].mediciones).toEqual([]);
  });

  test('notifica mediciones y cargando=false tras la resolución', async () => {
    const servicio = crearServicioMock();
    const store = createAppStore(servicio);
    const snapshots = [];

    store.subscribe((s) => snapshots.push({ ...s }));

    await store.cargarMediciones();

    // Segunda notificación: carga completada
    const ultimo = snapshots[snapshots.length - 1];
    expect(ultimo.cargando).toBe(false);
    expect(ultimo.error).toBeNull();
    expect(ultimo.mediciones).toEqual(MEDICIONES_MOCK);
  });

  test('getState() refleja las mediciones cargadas', async () => {
    const servicio = crearServicioMock();
    const store = createAppStore(servicio);

    await store.cargarMediciones();

    const { mediciones, cargando, error } = store.getState();
    expect(mediciones).toEqual(MEDICIONES_MOCK);
    expect(cargando).toBe(false);
    expect(error).toBeNull();
  });
});

// =========================================================
// cargarMediciones — transición de error
// =========================================================

describe('cargarMediciones — error', () => {
  test('notifica cargando=true antes de rechazar', async () => {
    const servicio = crearServicioMock({ debeFallar: true });
    const store = createAppStore(servicio);
    const snapshots = [];

    store.subscribe((s) => snapshots.push({ ...s }));

    await store.cargarMediciones();

    expect(snapshots[0].cargando).toBe(true);
  });

  test('notifica error y cargando=false tras el fallo', async () => {
    const servicio = crearServicioMock({ debeFallar: true });
    const store = createAppStore(servicio);
    const snapshots = [];

    store.subscribe((s) => snapshots.push({ ...s }));

    await store.cargarMediciones();

    const ultimo = snapshots[snapshots.length - 1];
    expect(ultimo.cargando).toBe(false);
    expect(ultimo.error).toBe('Error de almacenamiento');
    expect(ultimo.mediciones).toEqual([]);
  });

  test('getState() refleja el error y mediciones vacías', async () => {
    const servicio = crearServicioMock({ debeFallar: true });
    const store = createAppStore(servicio);

    await store.cargarMediciones();

    const { mediciones, cargando, error } = store.getState();
    expect(mediciones).toEqual([]);
    expect(cargando).toBe(false);
    expect(typeof error).toBe('string');
  });
});

// =========================================================
// subscribe / unsubscribe
// =========================================================

describe('subscribe / unsubscribe', () => {
  test('el handler se invoca dos veces por cargarMediciones (inicio y fin)', async () => {
    const servicio = crearServicioMock();
    const store = createAppStore(servicio);
    const handler = jest.fn();

    store.subscribe(handler);
    await store.cargarMediciones();

    expect(handler).toHaveBeenCalledTimes(2);
  });

  test('la función de cleanup desregistra el handler', async () => {
    const servicio = crearServicioMock();
    const store = createAppStore(servicio);
    const handler = jest.fn();

    const unsubscribe = store.subscribe(handler);
    unsubscribe();

    await store.cargarMediciones();

    expect(handler).not.toHaveBeenCalled();
  });

  test('múltiples suscriptores reciben la misma notificación', async () => {
    const servicio = crearServicioMock();
    const store = createAppStore(servicio);
    const handlerA = jest.fn();
    const handlerB = jest.fn();

    store.subscribe(handlerA);
    store.subscribe(handlerB);

    await store.cargarMediciones();

    // Cada handler debe haberse llamado 2 veces (inicio y fin)
    expect(handlerA).toHaveBeenCalledTimes(2);
    expect(handlerB).toHaveBeenCalledTimes(2);
  });

  test('getState() devuelve una copia: no se puede mutar el estado interno', async () => {
    const servicio = crearServicioMock();
    const store = createAppStore(servicio);

    await store.cargarMediciones();

    const state1 = store.getState();
    state1.mediciones = [];          // intento de mutación externa
    state1.cargando = true;

    const state2 = store.getState(); // nuevo getState() no se ve afectado
    expect(state2.mediciones).toEqual(MEDICIONES_MOCK);
    expect(state2.cargando).toBe(false);
  });
});
