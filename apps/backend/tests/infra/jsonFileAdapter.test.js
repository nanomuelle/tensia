/**
 * Tests unitarios: capa de infraestructura — JsonFileAdapter.
 * Usa un directorio temporal para no contaminar el sistema de archivos real.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { JsonFileAdapter } from '../../src/infra/jsonFileAdapter.js';

// --- Setup: directorio temporal para cada test ---

let dirTemp;
let rutaArchivo;

beforeEach(async () => {
  dirTemp = await mkdtemp(path.join(os.tmpdir(), 'tensia-test-'));
  rutaArchivo = path.join(dirTemp, 'measurements.json');
});

afterEach(async () => {
  await rm(dirTemp, { recursive: true, force: true });
});

// --- Tests ---

describe('JsonFileAdapter.getAll', () => {
  test('devuelve array vacío e inicializa el archivo si no existe', async () => {
    const adapter = new JsonFileAdapter(rutaArchivo);
    const resultado = await adapter.getAll();

    expect(resultado).toEqual([]);

    // Verifica que se creó el archivo con la estructura correcta
    const contenido = JSON.parse(await readFile(rutaArchivo, 'utf-8'));
    expect(contenido.version).toBe('1.0');
    expect(contenido.measurements).toEqual([]);
  });

  test('devuelve las mediciones existentes en el archivo', async () => {
    const mediciones = [
      {
        id: 'test-id',
        systolic: 120,
        diastolic: 80,
        measuredAt: '2026-02-18T10:00:00.000Z',
        source: 'manual',
      },
    ];
    const datos = { version: '1.0', measurements: mediciones };
    const { writeFile } = await import('node:fs/promises');
    await writeFile(rutaArchivo, JSON.stringify(datos), 'utf-8');

    const adapter = new JsonFileAdapter(rutaArchivo);
    const resultado = await adapter.getAll();

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('test-id');
  });
});

describe('JsonFileAdapter.save', () => {
  test('persiste el array de mediciones en el archivo', async () => {
    const adapter = new JsonFileAdapter(rutaArchivo);
    const mediciones = [
      {
        id: 'nuevo-id',
        systolic: 130,
        diastolic: 85,
        measuredAt: '2026-02-18T11:00:00.000Z',
        source: 'manual',
      },
    ];

    await adapter.save(mediciones);

    const contenido = JSON.parse(await readFile(rutaArchivo, 'utf-8'));
    expect(contenido.version).toBe('1.0');
    expect(contenido.measurements).toHaveLength(1);
    expect(contenido.measurements[0].id).toBe('nuevo-id');
  });

  test('sobreescribe el contenido previo al guardar', async () => {
    const adapter = new JsonFileAdapter(rutaArchivo);

    await adapter.save([{ id: 'id-1', systolic: 120, diastolic: 80, measuredAt: '2026-01-01T10:00:00.000Z', source: 'manual' }]);
    await adapter.save([{ id: 'id-2', systolic: 130, diastolic: 85, measuredAt: '2026-02-01T10:00:00.000Z', source: 'manual' }]);

    const contenido = JSON.parse(await readFile(rutaArchivo, 'utf-8'));
    expect(contenido.measurements).toHaveLength(1);
    expect(contenido.measurements[0].id).toBe('id-2');
  });

  test('puede guardar un array vacío', async () => {
    const adapter = new JsonFileAdapter(rutaArchivo);
    await adapter.save([]);

    const contenido = JSON.parse(await readFile(rutaArchivo, 'utf-8'));
    expect(contenido.measurements).toEqual([]);
  });
});

describe('JsonFileAdapter — ciclo completo getAll/save', () => {
  test('getAll devuelve lo mismo que se guardó con save', async () => {
    const adapter = new JsonFileAdapter(rutaArchivo);
    const medicion = {
      id: 'ciclo-id',
      systolic: 115,
      diastolic: 75,
      pulse: 68,
      measuredAt: '2026-02-18T09:00:00.000Z',
      source: 'manual',
    };

    await adapter.save([medicion]);
    const resultado = await adapter.getAll();

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toEqual(medicion);
  });

  test('inicializa el directorio si no existe (subdirectorios)', async () => {
    const rutaProfunda = path.join(dirTemp, 'subdir', 'nested', 'measurements.json');
    const adapter = new JsonFileAdapter(rutaProfunda);

    const resultado = await adapter.getAll();
    expect(resultado).toEqual([]);

    const contenido = JSON.parse(await readFile(rutaProfunda, 'utf-8'));
    expect(contenido.version).toBe('1.0');
  });
});
