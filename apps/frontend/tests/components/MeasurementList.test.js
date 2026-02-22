/**
 * Tests unitarios del componente MeasurementList.
 *
 * Verifica que mount() genera el HTML correcto y que los métodos
 * de estado (mostrarCargando, mostrarError, mostrarVacio, mostrarLista)
 * muestran y ocultan los elementos adecuados.
 *
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { createMeasurementList } from '../../src/components/MeasurementList/MeasurementList.js';

// ---------------------------------------------------------------------------
// Fixture de mediciones de ejemplo
// ---------------------------------------------------------------------------

const medicionesEjemplo = [
  {
    id: 'uuid-1',
    systolic: 130,
    diastolic: 85,
    pulse: 72,
    measuredAt: '2026-02-20T08:30:00.000Z',
    source: 'manual',
  },
  {
    id: 'uuid-2',
    systolic: 120,
    diastolic: 80,
    measuredAt: '2026-02-18T10:00:00.000Z',
    source: 'manual',
  },
];

// ---------------------------------------------------------------------------
// Setup compartido
// ---------------------------------------------------------------------------

let rootEl;
let lista;

beforeEach(() => {
  document.body.innerHTML = '<section id="historial-root"></section>';
  rootEl = document.getElementById('historial-root');
  lista  = createMeasurementList(rootEl);
  lista.mount();
});

// ---------------------------------------------------------------------------
// mount() — estructura del DOM
// ---------------------------------------------------------------------------

describe('mount() — estructura del DOM', () => {
  test('genera el contenedor de estado cargando', () => {
    expect(document.getElementById('estado-cargando')).not.toBeNull();
  });

  test('genera el contenedor de estado error', () => {
    expect(document.getElementById('estado-error')).not.toBeNull();
  });

  test('genera el contenedor de estado vacío', () => {
    expect(document.getElementById('estado-vacio')).not.toBeNull();
  });

  test('genera la lista de mediciones', () => {
    expect(document.getElementById('lista-mediciones')).not.toBeNull();
  });

  test('botón reintentar aparece dentro del estado error', () => {
    expect(document.getElementById('btn-reintentar')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mostrarCargando()
// ---------------------------------------------------------------------------

describe('mostrarCargando()', () => {
  test('muestra el estado cargando', () => {
    lista.mostrarCargando();
    expect(document.getElementById('estado-cargando').hidden).toBe(false);
  });

  test('oculta los demás estados', () => {
    lista.mostrarCargando();
    expect(document.getElementById('estado-error').hidden).toBe(true);
    expect(document.getElementById('estado-vacio').hidden).toBe(true);
    expect(document.getElementById('lista-mediciones').hidden).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// mostrarError()
// ---------------------------------------------------------------------------

describe('mostrarError()', () => {
  test('muestra el estado error', () => {
    lista.mostrarError();
    expect(document.getElementById('estado-error').hidden).toBe(false);
  });

  test('oculta los demás estados', () => {
    lista.mostrarError();
    expect(document.getElementById('estado-cargando').hidden).toBe(true);
    expect(document.getElementById('estado-vacio').hidden).toBe(true);
    expect(document.getElementById('lista-mediciones').hidden).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// mostrarVacio()
// ---------------------------------------------------------------------------

describe('mostrarVacio()', () => {
  test('muestra el estado vacío', () => {
    lista.mostrarVacio();
    expect(document.getElementById('estado-vacio').hidden).toBe(false);
  });

  test('oculta los demás estados', () => {
    lista.mostrarVacio();
    expect(document.getElementById('estado-cargando').hidden).toBe(true);
    expect(document.getElementById('estado-error').hidden).toBe(true);
    expect(document.getElementById('lista-mediciones').hidden).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// mostrarLista()
// ---------------------------------------------------------------------------

describe('mostrarLista()', () => {
  test('muestra la lista de mediciones', () => {
    lista.mostrarLista(medicionesEjemplo);
    expect(document.getElementById('lista-mediciones').hidden).toBe(false);
  });

  test('renderiza tantos elementos <li> como mediciones', () => {
    lista.mostrarLista(medicionesEjemplo);
    const items = document.querySelectorAll('#lista-mediciones li');
    expect(items.length).toBe(medicionesEjemplo.length);
  });

  test('incluye los valores de tensión de la primera medición', () => {
    lista.mostrarLista(medicionesEjemplo);
    const texto = document.getElementById('lista-mediciones').textContent;
    expect(texto).toContain('130');
    expect(texto).toContain('85');
  });

  test('muestra el pulso cuando está presente', () => {
    lista.mostrarLista(medicionesEjemplo);
    const texto = document.getElementById('lista-mediciones').textContent;
    expect(texto).toContain('72');
  });

  test('no muestra pulso cuando el campo es undefined', () => {
    lista.mostrarLista([medicionesEjemplo[1]]); // sin pulse
    const tarjeta = document.querySelector('#lista-mediciones li');
    expect(tarjeta.textContent).not.toContain('ppm');
  });

  test('oculta los demás estados', () => {
    lista.mostrarLista(medicionesEjemplo);
    expect(document.getElementById('estado-cargando').hidden).toBe(true);
    expect(document.getElementById('estado-error').hidden).toBe(true);
    expect(document.getElementById('estado-vacio').hidden).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Callback onReintentar
// ---------------------------------------------------------------------------

describe('onReintentar callback', () => {
  test('llama a onReintentar al pulsar el botón reintentar', () => {
    const onReintentar = jest.fn();

    document.body.innerHTML = '<section id="historial-root-2"></section>';
    const el = document.getElementById('historial-root-2');
    const listaConCb = createMeasurementList(el, { onReintentar });
    listaConCb.mount();
    listaConCb.mostrarError();

    document.getElementById('btn-reintentar').click();

    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// unmount()
// ---------------------------------------------------------------------------

describe('unmount()', () => {
  test('no lanza error al llamar métodos de estado tras unmount()', () => {
    lista.unmount();
    expect(() => lista.mostrarCargando()).not.toThrow();
    expect(() => lista.mostrarError()).not.toThrow();
    expect(() => lista.mostrarVacio()).not.toThrow();
    expect(() => lista.mostrarLista([])).not.toThrow();
  });
});
