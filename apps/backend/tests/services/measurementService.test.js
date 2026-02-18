/**
 * Tests unitarios: capa de servicio — createMeasurementService.
 * Usa un adaptador mock (en memoria) para aislar la lógica del servicio.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { createMeasurementService } from '../../src/services/measurementService.js';

// --- Helpers ---

/** Crea un adaptador mock en memoria con un array de mediciones iniciales. */
function crearAdaptadorMock(medicionesIniciales = []) {
  let almacen = [...medicionesIniciales];
  return {
    getAll: jest.fn(async () => [...almacen]),
    save: jest.fn(async (mediciones) => {
      almacen = [...mediciones];
    }),
    _getAlmacen: () => almacen,
  };
}

/** Datos base para crear una medición válida. */
const datosBase = {
  systolic: 120,
  diastolic: 80,
  pulse: 72,
  measuredAt: '2026-02-18T10:00:00.000Z',
};

// --- Tests ---

describe('measurementService.listAll', () => {
  test('devuelve array vacío si no hay mediciones', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);
    const resultado = await service.listAll();
    expect(resultado).toEqual([]);
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

    expect(resultado[0].id).toBe('2'); // Más reciente
    expect(resultado[1].id).toBe('3');
    expect(resultado[2].id).toBe('1'); // Más antigua
  });

  test('no modifica el orden del almacén original', async () => {
    const mediciones = [
      { id: '1', systolic: 120, diastolic: 80, measuredAt: '2026-01-01T10:00:00.000Z', source: 'manual' },
      { id: '2', systolic: 130, diastolic: 85, measuredAt: '2026-03-01T10:00:00.000Z', source: 'manual' },
    ];
    const adapter = crearAdaptadorMock(mediciones);
    const service = createMeasurementService(adapter);

    await service.listAll();

    // La segunda llamada al adaptador sigue devolviendo los datos originales
    const almacen = adapter._getAlmacen();
    expect(almacen[0].id).toBe('1');
  });
});

describe('measurementService.create', () => {
  test('crea una medición con id (UUID) y source "manual"', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    const resultado = await service.create(datosBase);

    expect(resultado.id).toBeDefined();
    expect(typeof resultado.id).toBe('string');
    expect(resultado.source).toBe('manual');
  });

  test('convierte los campos numéricos a número', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    const resultado = await service.create({ ...datosBase, systolic: '120', diastolic: '80' });

    expect(typeof resultado.systolic).toBe('number');
    expect(typeof resultado.diastolic).toBe('number');
  });

  test('convierte measuredAt a formato ISO 8601', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    const resultado = await service.create(datosBase);

    expect(resultado.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('incluye pulse si se proporciona', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    const resultado = await service.create({ ...datosBase, pulse: 72 });

    expect(resultado.pulse).toBe(72);
  });

  test('omite pulse si no se proporciona', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);
    const { pulse, ...sinPulse } = datosBase;

    const resultado = await service.create(sinPulse);

    expect(resultado.pulse).toBeUndefined();
  });

  test('llama a adapter.save con la medición añadida', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);

    await service.create(datosBase);

    expect(adapter.save).toHaveBeenCalledTimes(1);
    const [medicionesGuardadas] = adapter.save.mock.calls[0];
    expect(medicionesGuardadas).toHaveLength(1);
    expect(medicionesGuardadas[0].source).toBe('manual');
  });

  test('acumula mediciones existentes al crear una nueva', async () => {
    const existente = {
      id: 'existente-id',
      systolic: 110,
      diastolic: 70,
      measuredAt: '2026-01-01T09:00:00.000Z',
      source: 'manual',
    };
    const adapter = crearAdaptadorMock([existente]);
    const service = createMeasurementService(adapter);

    await service.create(datosBase);

    const [medicionesGuardadas] = adapter.save.mock.calls[0];
    expect(medicionesGuardadas).toHaveLength(2);
  });

  test('lanza error si los datos son inválidos (falta systolic)', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);
    const { systolic, ...sinSystolic } = datosBase;

    await expect(service.create(sinSystolic)).rejects.toThrow('systolic');
  });

  test('no guarda nada si la validación falla', async () => {
    const adapter = crearAdaptadorMock([]);
    const service = createMeasurementService(adapter);
    const { systolic, ...sinSystolic } = datosBase;

    await expect(service.create(sinSystolic)).rejects.toThrow();
    expect(adapter.save).not.toHaveBeenCalled();
  });
});
