/**
 * Tests unitarios: cliente HTTP del frontend — infra/httpAdapter.js
 * Se mockea global.fetch para probar el módulo sin red real.
 * @jest-environment node
 */

import { vi, describe, test, expect, beforeEach } from 'vitest';
import { getMediciones, crearMedicion } from '../../src/infra/httpAdapter.js';

// =========================================================
// Helpers
// =========================================================

/**
 * Crea un mock de Response compatible con la Fetch API.
 */
function mockResponse({ ok = true, status = 200, body = {} } = {}) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

// =========================================================
// Setup
// =========================================================

beforeEach(() => {
  global.fetch = vi.fn();
});

// =========================================================
// getMediciones
// =========================================================

describe('getMediciones', () => {
  test('llama a fetch con la URL correcta', async () => {
    global.fetch.mockResolvedValue(mockResponse({ body: [] }));
    await getMediciones();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/measurements');
  });

  test('devuelve el array de mediciones cuando la respuesta es 200', async () => {
    const mediciones = [
      { id: 'abc', systolic: 120, diastolic: 80, measuredAt: '2026-01-01T10:00:00.000Z', source: 'manual' },
    ];
    global.fetch.mockResolvedValue(mockResponse({ body: mediciones }));
    const resultado = await getMediciones();
    expect(resultado).toEqual(mediciones);
  });

  test('lanza un error cuando la respuesta no es 2xx', async () => {
    global.fetch.mockResolvedValue(mockResponse({ ok: false, status: 500, body: {} }));
    await expect(getMediciones()).rejects.toThrow();
  });

  test('propaga el error si fetch lanza (sin red)', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));
    await expect(getMediciones()).rejects.toThrow('Network error');
  });
});

// =========================================================
// crearMedicion
// =========================================================

describe('crearMedicion', () => {
  const datosMedicion = {
    systolic: 120,
    diastolic: 80,
    pulse: 72,
    measuredAt: '2026-02-18T10:00:00.000Z',
  };

  test('llama a fetch con POST y la URL correcta', async () => {
    const medicionCreada = { id: 'uuid-1', ...datosMedicion, source: 'manual' };
    global.fetch.mockResolvedValue(mockResponse({ status: 201, body: medicionCreada }));
    await crearMedicion(datosMedicion);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/measurements',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('envía Content-Type: application/json', async () => {
    const medicionCreada = { id: 'uuid-1', ...datosMedicion, source: 'manual' };
    global.fetch.mockResolvedValue(mockResponse({ status: 201, body: medicionCreada }));
    await crearMedicion(datosMedicion);
    const [, opciones] = global.fetch.mock.calls[0];
    expect(opciones.headers['Content-Type']).toBe('application/json');
  });

  test('envía el cuerpo serializado como JSON', async () => {
    const medicionCreada = { id: 'uuid-1', ...datosMedicion, source: 'manual' };
    global.fetch.mockResolvedValue(mockResponse({ status: 201, body: medicionCreada }));
    await crearMedicion(datosMedicion);
    const [, opciones] = global.fetch.mock.calls[0];
    expect(JSON.parse(opciones.body)).toEqual(datosMedicion);
  });

  test('devuelve la medición creada cuando la respuesta es 201', async () => {
    const medicionCreada = { id: 'uuid-1', ...datosMedicion, source: 'manual' };
    global.fetch.mockResolvedValue(mockResponse({ status: 201, body: medicionCreada }));
    const resultado = await crearMedicion(datosMedicion);
    expect(resultado).toEqual(medicionCreada);
  });

  test('lanza el campo "error" del cuerpo cuando la respuesta es 400', async () => {
    global.fetch.mockResolvedValue(
      mockResponse({ ok: false, status: 400, body: { error: 'La sistólica debe ser mayor que la diastólica.' } })
    );
    await expect(crearMedicion(datosMedicion)).rejects.toThrow(
      'La sistólica debe ser mayor que la diastólica.'
    );
  });

  test('lanza mensaje genérico cuando la respuesta no-2xx no trae campo error', async () => {
    global.fetch.mockResolvedValue(
      mockResponse({ ok: false, status: 500, body: {} })
    );
    await expect(crearMedicion(datosMedicion)).rejects.toThrow();
  });

  test('propaga el error si fetch lanza (sin red)', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));
    await expect(crearMedicion(datosMedicion)).rejects.toThrow('Network error');
  });
});
