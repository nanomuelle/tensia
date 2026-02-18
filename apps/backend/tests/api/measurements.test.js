/**
 * Tests de integración: API REST de mediciones.
 * Usa supertest para hacer peticiones HTTP reales contra la app Express.
 * Usa un adaptador en memoria para evitar dependencias del sistema de archivos.
 */

import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/api/app.js';

// --- Adaptador en memoria para tests ---

function crearAdaptadorMemoria(medicionesIniciales = []) {
  let almacen = [...medicionesIniciales];
  return {
    getAll: async () => [...almacen],
    save: async (mediciones) => {
      almacen = [...mediciones];
    },
  };
}

// Medición de ejemplo para rellenar el almacén en tests de lectura
const medicionEjemplo = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  systolic: 120,
  diastolic: 80,
  pulse: 72,
  measuredAt: '2026-02-18T10:00:00.000Z',
  source: 'manual',
};

// Body válido para crear una medición
const bodyValido = {
  systolic: 125,
  diastolic: 82,
  pulse: 68,
  measuredAt: '2026-02-18T12:00:00.000Z',
};

// --- Tests GET /measurements ---

describe('GET /measurements', () => {
  test('responde 200 con array vacío si no hay mediciones', async () => {
    const app = createApp(crearAdaptadorMemoria([]));
    const res = await request(app).get('/measurements');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('responde 200 con las mediciones existentes', async () => {
    const app = createApp(crearAdaptadorMemoria([medicionEjemplo]));
    const res = await request(app).get('/measurements');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(medicionEjemplo.id);
  });

  test('devuelve los campos esperados del modelo de datos', async () => {
    const app = createApp(crearAdaptadorMemoria([medicionEjemplo]));
    const res = await request(app).get('/measurements');

    const m = res.body[0];
    expect(m).toHaveProperty('id');
    expect(m).toHaveProperty('systolic');
    expect(m).toHaveProperty('diastolic');
    expect(m).toHaveProperty('measuredAt');
    expect(m).toHaveProperty('source');
  });

  test('devuelve las mediciones ordenadas por fecha descendente', async () => {
    const mediciones = [
      { ...medicionEjemplo, id: 'id-1', measuredAt: '2026-01-01T10:00:00.000Z' },
      { ...medicionEjemplo, id: 'id-2', measuredAt: '2026-03-01T10:00:00.000Z' },
      { ...medicionEjemplo, id: 'id-3', measuredAt: '2026-02-01T10:00:00.000Z' },
    ];
    const app = createApp(crearAdaptadorMemoria(mediciones));
    const res = await request(app).get('/measurements');

    expect(res.body[0].id).toBe('id-2');
    expect(res.body[1].id).toBe('id-3');
    expect(res.body[2].id).toBe('id-1');
  });
});

// --- Tests POST /measurements ---

describe('POST /measurements', () => {
  test('responde 201 con la medición creada al recibir datos válidos', async () => {
    const app = createApp(crearAdaptadorMemoria([]));
    const res = await request(app).post('/measurements').send(bodyValido);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.source).toBe('manual');
    expect(res.body.systolic).toBe(bodyValido.systolic);
    expect(res.body.diastolic).toBe(bodyValido.diastolic);
  });

  test('la medición creada tiene todos los campos del modelo de datos', async () => {
    const app = createApp(crearAdaptadorMemoria([]));
    const res = await request(app).post('/measurements').send(bodyValido);

    const m = res.body;
    expect(m).toHaveProperty('id');
    expect(m).toHaveProperty('systolic');
    expect(m).toHaveProperty('diastolic');
    expect(m).toHaveProperty('measuredAt');
    expect(m).toHaveProperty('source', 'manual');
  });

  test('responde 400 si falta systolic', async () => {
    const app = createApp(crearAdaptadorMemoria([]));
    const { systolic, ...sinSystolic } = bodyValido;
    const res = await request(app).post('/measurements').send(sinSystolic);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('responde 400 si falta diastolic', async () => {
    const app = createApp(crearAdaptadorMemoria([]));
    const { diastolic, ...sinDiastolic } = bodyValido;
    const res = await request(app).post('/measurements').send(sinDiastolic);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('responde 400 si falta measuredAt', async () => {
    const app = createApp(crearAdaptadorMemoria([]));
    const { measuredAt, ...sinFecha } = bodyValido;
    const res = await request(app).post('/measurements').send(sinFecha);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('responde 400 si systolic no es positivo', async () => {
    const app = createApp(crearAdaptadorMemoria([]));
    const res = await request(app)
      .post('/measurements')
      .send({ ...bodyValido, systolic: 0 });

    expect(res.status).toBe(400);
  });

  test('responde 400 si systolic es menor que diastolic', async () => {
    const app = createApp(crearAdaptadorMemoria([]));
    const res = await request(app)
      .post('/measurements')
      .send({ ...bodyValido, systolic: 70, diastolic: 80 });

    expect(res.status).toBe(400);
  });

  test('responde 400 si measuredAt tiene formato inválido', async () => {
    const app = createApp(crearAdaptadorMemoria([]));
    const res = await request(app)
      .post('/measurements')
      .send({ ...bodyValido, measuredAt: 'no-es-fecha' });

    expect(res.status).toBe(400);
  });

  test('acepta medición sin pulse (campo opcional)', async () => {
    const app = createApp(crearAdaptadorMemoria([]));
    const { pulse, ...sinPulse } = bodyValido;
    const res = await request(app).post('/measurements').send(sinPulse);

    expect(res.status).toBe(201);
    expect(res.body.pulse).toBeUndefined();
  });
});

// --- Tests rutas no encontradas ---

describe('Rutas no encontradas', () => {
  test('responde 404 para una ruta inexistente', async () => {
    const app = createApp(crearAdaptadorMemoria([]));
    const res = await request(app).get('/ruta-inexistente');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
