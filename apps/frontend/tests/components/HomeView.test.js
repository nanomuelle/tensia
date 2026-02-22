/**
 * Tests unitarios: HomeView — layout de dos columnas (BK-23 / US-14)
 *
 * Verifica que la clase `dashboard-content--columnas` se añade y retira
 * correctamente sobre `.dashboard-content` en respuesta al estado del store:
 *
 * 1. Con 0 mediciones → clase ausente (columna única)
 * 2. Con ≥ 1 medición → clase presente (dos columnas en ≥ 768 px)
 * 3. Al pasar de ≥ 1 a 0 mediciones → clase retirada
 *
 * Referencia: docs/product/backlog.md#BK-23
 *             docs/design/screens.md#layout-gráfica--historial-en-columnas
 *
 * @jest-environment jsdom
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// ─── Mocks de módulos (deben declararse antes del import dinámico) ────────────

// Mock de MeasurementList
jest.unstable_mockModule(
  '../../src/components/MeasurementList/MeasurementList.js',
  () => ({
    createMeasurementList: jest.fn(() => ({
      mount: jest.fn(),
      unmount: jest.fn(),
      mostrarCargando: jest.fn(),
      mostrarError: jest.fn(),
      mostrarVacio: jest.fn(),
      mostrarLista: jest.fn(),
    })),
  }),
);

// Mock de MeasurementChart
jest.unstable_mockModule(
  '../../src/components/MeasurementChart/MeasurementChart.js',
  () => ({
    createMeasurementChart: jest.fn(() => ({
      mount: jest.fn(),
      unmount: jest.fn(),
      update: jest.fn(),
    })),
  }),
);

// Mock de MeasurementForm
jest.unstable_mockModule(
  '../../src/components/MeasurementForm/MeasurementForm.js',
  () => ({
    createMeasurementForm: jest.fn(() => ({
      mount: jest.fn(),
      unmount: jest.fn(),
      abrir: jest.fn(),
    })),
  }),
);

// Mock de Modal
jest.unstable_mockModule(
  '../../src/components/Modal/Modal.js',
  () => ({
    createModal: jest.fn(() => ({
      open: jest.fn(),
      close: jest.fn(),
      lock: jest.fn(),
      unlock: jest.fn(),
    })),
  }),
);

// ─── Imports (tras los mocks) ─────────────────────────────────────────────────

const { createHomeView } = await import('../../src/views/HomeView.js');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Crea un mock del store que expone el callback de suscripción
 * para dispararlo manualmente en los tests.
 */
function crearStoreMock() {
  let callbackSuscripcion = null;

  const store = {
    subscribe: jest.fn((cb) => {
      callbackSuscripcion = cb;
      // Devuelve función de desuscripción
      return jest.fn();
    }),
    cargarMediciones: jest.fn(),
  };

  /**
   * Simula un cambio de estado en el store notificando al suscriptor.
   * @param {object} estado
   */
  function emitirEstado(estado) {
    if (callbackSuscripcion) {
      callbackSuscripcion(estado);
    }
  }

  return { store, emitirEstado };
}

/**
 * Medición mínima válida de ejemplo.
 */
function crearMedicion(id = 'uuid-1') {
  return {
    id,
    systolic: 120,
    diastolic: 80,
    pulse: 72,
    measuredAt: '2026-02-18T10:00:00.000Z',
    source: 'manual',
  };
}

// ─── Setup compartido ─────────────────────────────────────────────────────────

let containerEl;
let storeMock;
let emitirEstado;
let vista;

beforeEach(() => {
  document.body.innerHTML = '<main id="app"></main>';
  containerEl = document.getElementById('app');

  const mockSetup = crearStoreMock();
  storeMock  = mockSetup.store;
  emitirEstado = mockSetup.emitirEstado;

  vista = createHomeView(containerEl, {
    store: storeMock,
    service: {},
    toast: { mostrar: jest.fn() },
  });

  vista.mount();
});

afterEach(() => {
  vista.unmount();
  document.body.innerHTML = '';
});

// ─── Helper de acceso al contenedor de layout ─────────────────────────────────

function getDashboardContent() {
  return containerEl.querySelector('#dashboard-content');
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('mount() — estructura del layout', () => {
  test('genera el contenedor .dashboard-content con id dashboard-content', () => {
    const el = getDashboardContent();
    expect(el).not.toBeNull();
    expect(el.classList.contains('dashboard-content')).toBe(true);
  });

  test('la sección de gráfica está dentro de .dashboard-content', () => {
    const seccionGrafica = containerEl.querySelector('#dashboard-content #seccion-grafica');
    expect(seccionGrafica).not.toBeNull();
  });

  test('la sección de historial está dentro de .dashboard-content', () => {
    const historialRoot = containerEl.querySelector('#dashboard-content #historial-root');
    expect(historialRoot).not.toBeNull();
  });
});

describe('layout de columnas — toggle de clase', () => {
  test('con 0 mediciones: .dashboard-content no tiene la clase --columnas', () => {
    emitirEstado({ cargando: false, error: null, mediciones: [] });
    expect(getDashboardContent().classList.contains('dashboard-content--columnas')).toBe(false);
  });

  test('con 1 medición: .dashboard-content tiene la clase --columnas', () => {
    emitirEstado({
      cargando: false,
      error: null,
      mediciones: [crearMedicion('uuid-1')],
    });
    expect(getDashboardContent().classList.contains('dashboard-content--columnas')).toBe(true);
  });

  test('con 2 mediciones: .dashboard-content tiene la clase --columnas', () => {
    emitirEstado({
      cargando: false,
      error: null,
      mediciones: [crearMedicion('uuid-1'), crearMedicion('uuid-2')],
    });
    expect(getDashboardContent().classList.contains('dashboard-content--columnas')).toBe(true);
  });

  test('al pasar de ≥ 1 medición a 0: la clase --columnas se retira', () => {
    // Primero con 1 medición → clase presente
    emitirEstado({
      cargando: false,
      error: null,
      mediciones: [crearMedicion('uuid-1')],
    });
    expect(getDashboardContent().classList.contains('dashboard-content--columnas')).toBe(true);

    // Luego con 0 mediciones → clase retirada
    emitirEstado({ cargando: false, error: null, mediciones: [] });
    expect(getDashboardContent().classList.contains('dashboard-content--columnas')).toBe(false);
  });

  test('con estado cargando (mediciones vacías): clase --columnas ausente', () => {
    emitirEstado({ cargando: true, error: null, mediciones: [] });
    expect(getDashboardContent().classList.contains('dashboard-content--columnas')).toBe(false);
  });

  test('con estado error (mediciones vacías): clase --columnas ausente', () => {
    emitirEstado({ cargando: false, error: 'Error al leer', mediciones: [] });
    expect(getDashboardContent().classList.contains('dashboard-content--columnas')).toBe(false);
  });
});

describe('unmount()', () => {
  test('limpia el contenedor (innerHTML vacío)', () => {
    vista.unmount();
    expect(containerEl.innerHTML).toBe('');
  });
});
