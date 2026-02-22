/**
 * Tests unitarios: capa de servicio (frontend) — measurementService.js
 * Usa un adaptador mock en memoria para aislar la lógica del servicio.
 * crypto.randomUUID se stub para que los ids sean predecibles en los tests.
 *
 * @jest-environment jsdom
 */

import { jest, describe, test, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { createMeasurementService } from '../../src/services/measurementService.js';
import { Events } from '../../src/shared/eventBus.js';

// =========================================================
// Stub de crypto.randomUUID (no disponible en Node <19 como global)
// =========================================================

let uuidCounter = 0;

beforeAll(() => {
  if (!globalThis.crypto) globalThis.crypto = {};
  globalThis.crypto.randomUUID = jest.fn(() => `test-uuid-${++uuidCounter}`);
});

afterAll(() => {
  delete globalThis.crypto.randomUUID;
});

beforeEach(() => {
  uuidCounter = 0;
  if (globalThis.crypto?.randomUUID?.mockClear) {
    globalThis.crypto.randomUUID.mockClear();
  }
});

// =========================================================
// Helpers
// =========================================================

/** Crea un adaptador mock en memoria con un array de mediciones iniciales. */
function crearAdaptadorMock(medicionesIniciales = []) {
  let almacen = [...medicionesIniciales];
  return {
    getAll: jest.fn(async () => [...almacen]),
    save: jest.fn(async (mediciones) => { almacen = [...mediciones]; }),
    _getAlmacen: () => almacen,
  };
}

const datosBase = {
  systolic: 120,
  diastolic: 80,
  pulse: 72,
  measuredAt: '2026-02-18T10:00:00.000Z',
};

// =========================================================
// listAll()
// =========================================================

describe('measurementService.listAll (frontend)', () => {
  test('devuelve array vacío si no hay mediciones', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);
    expect(await service.listAll()).toEqual([]);
  });

  test('devuelve las mediciones ordenadas por measuredAt descendente', async () => {
    const mediciones = [
      { id: '1', systolic: 120, diastolic: 80, measuredAt: '2026-01-01T10:00:00.000Z', source: 'manual' },
      { id: '2', systolic: 130, diastolic: 85, measuredAt: '2026-03-01T10:00:00.000Z', source: 'manual' },
      { id: '3', systolic: 110, diastolic: 75, measuredAt: '2026-02-01T10:00:00.000Z', source: 'manual' },
    ];
    const adapter = crearAdaptadorMock(mediciones);
    const service = createMeasurementService(adapter);

    const resultado = await service.listAll();

    expect(resultado[0].id).toBe('2');
    expect(resultado[1].id).toBe('3');
    expect(resultado[2].id).toBe('1');
  });

  test('llama a adapter.getAll exactamente una vez', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);
    await service.listAll();
    expect(adapter.getAll).toHaveBeenCalledTimes(1);
  });
});

// =========================================================
// create()
// =========================================================

describe('measurementService.create (frontend)', () => {
  test('crea una medición con id, source=manual y measuredAt en ISO', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    const medicion = await service.create(datosBase);

    expect(medicion.id).toMatch(/test-uuid/);
    expect(medicion.source).toBe('manual');
    expect(medicion.systolic).toBe(120);
    expect(medicion.diastolic).toBe(80);
    expect(medicion.pulse).toBe(72);
    expect(medicion.measuredAt).toBe(new Date(datosBase.measuredAt).toISOString());
  });

  test('persiste la nueva medición llamando a adapter.save', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    await service.create(datosBase);

    expect(adapter.save).toHaveBeenCalledTimes(1);
    const [medicionesGuardadas] = adapter.save.mock.calls[0];
    expect(medicionesGuardadas).toHaveLength(1);
    expect(medicionesGuardadas[0].source).toBe('manual');
  });

  test('añade al almacén sin perder las mediciones existentes', async () => {
    const existente = { id: 'prev', systolic: 115, diastolic: 75, measuredAt: '2026-01-01T00:00:00.000Z', source: 'manual' };
    const adapter = crearAdaptadorMock([existente]);
    const service = createMeasurementService(adapter);

    await service.create(datosBase);

    expect(adapter._getAlmacen()).toHaveLength(2);
  });

  test('omite pulse cuando no se proporciona', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);
    const { pulse, ...sinPulso } = datosBase;

    const medicion = await service.create(sinPulso);

    expect(medicion.pulse).toBeUndefined();
  });

  test('omite pulse cuando es string vacío', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    const medicion = await service.create({ ...datosBase, pulse: '' });

    expect(medicion.pulse).toBeUndefined();
  });

  test('lanza error si la validación de dominio falla (systolic inválida)', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    await expect(service.create({ ...datosBase, systolic: -1 })).rejects.toThrow('"systolic"');
    expect(adapter.save).not.toHaveBeenCalled();
  });

  test('lanza error si falta measuredAt', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);
    const { measuredAt, ...sinFecha } = datosBase;

    await expect(service.create(sinFecha)).rejects.toThrow('measuredAt');
  });

  test('no llama a adapter.save si la validación falla', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    await expect(service.create({ systolic: 'abc' })).rejects.toThrow();
    expect(adapter.save).not.toHaveBeenCalled();
  });
});

// =========================================================
// create() — CustomEvent Events.MEASUREMENT_SAVED (US-12)
// =========================================================

describe('measurementService.create — evento measurement:saved (US-12)', () => {
  test('despacha el CustomEvent tras guardar correctamente', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    const evento = await new Promise((resolve) => {
      window.addEventListener(Events.MEASUREMENT_SAVED, (e) => resolve(e), { once: true });
      service.create(datosBase);
    });

    expect(evento).toBeInstanceOf(Event);
    expect(evento.type).toBe(Events.MEASUREMENT_SAVED);
  });

  test('el detail del evento contiene la medición guardada', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    const evento = await new Promise((resolve) => {
      window.addEventListener(Events.MEASUREMENT_SAVED, (e) => resolve(e), { once: true });
      service.create(datosBase);
    });

    expect(evento.detail).toMatchObject({
      systolic: datosBase.systolic,
      diastolic: datosBase.diastolic,
      pulse: datosBase.pulse,
      source: 'manual',
    });
    expect(evento.detail.id).toBeTruthy();
  });

  test('NO despacha el evento si la validación de dominio falla', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    const listener = jest.fn();
    window.addEventListener(Events.MEASUREMENT_SAVED, listener, { once: true });

    await expect(service.create({ systolic: -1 })).rejects.toThrow();

    // El evento no debe haberse lanzado
    expect(listener).not.toHaveBeenCalled();

    // Limpiar el listener registrado por si no disparó
    window.removeEventListener(Events.MEASUREMENT_SAVED, listener);
  });

  test('la transición skeleton→gráfica ocurre: al pasar de 1 a 2 mediciones se emite el evento', async () => {
    // Verificamos que añadir una segunda medición (umbral ≥2) sigue emitiendo el evento,
    // lo que permitiría a la gráfica pasar de skeleton a renderizado real.
    const medicionExistente = {
      id: 'prev',
      systolic: 115,
      diastolic: 75,
      measuredAt: '2026-01-01T00:00:00.000Z',
      source: 'manual',
    };
    const adapter = crearAdaptadorMock([medicionExistente]);
    const service = createMeasurementService(adapter);

    const evento = await new Promise((resolve) => {
      window.addEventListener(Events.MEASUREMENT_SAVED, (e) => resolve(e), { once: true });
      service.create(datosBase);
    });

    // El evento se emitió con la segunda medición
    expect(evento.detail.systolic).toBe(datosBase.systolic);
    // El almacén ahora tiene 2 mediciones (supera el umbral)
    expect(adapter._getAlmacen()).toHaveLength(2);
  });
});
