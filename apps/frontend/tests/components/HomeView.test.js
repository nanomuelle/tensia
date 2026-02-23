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
 * Migrado de Jest a Vitest en BK-25 (HomeView.js ahora importa .svelte).
 * Referencia: docs/product/backlog.md#BK-23
 *             docs/design/screens.md#layout-gráfica--historial-en-columnas
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// ─── Mocks de módulos Svelte que HomeView monta como islas ───────────────────

// API pública que HomeView usa de MeasurementList
const listaMock = {
  mostrarCargando: vi.fn(),
  mostrarError: vi.fn(),
  mostrarVacio: vi.fn(),
  mostrarLista: vi.fn(),
};

// API pública que HomeView usa de MeasurementChart
const graficaMock = {
  update: vi.fn(),
};

vi.mock('../../src/components/MeasurementList/MeasurementList.svelte', () => ({
  default: function MeasurementList() {},
}));

vi.mock('../../src/components/MeasurementChart/MeasurementChart.svelte', () => ({
  default: function MeasurementChart() {},
}));

// Mockear el adaptador delgado svelteMount.js (no el módulo 'svelte' completo).
// Esto evita que el mock afecte a las APIs internas que usa jsdom/parse5.
vi.mock('../../src/lib/svelteMount.js', () => ({
  svelteMount:   vi.fn(),
  svelteUnmount: vi.fn(),
}));

// Mock de MeasurementForm (Vanilla JS, no migrado aún)
vi.mock('../../src/components/MeasurementForm/MeasurementForm.js', () => ({
  createMeasurementForm: vi.fn(() => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    abrir: vi.fn(),
  })),
}));

// Mock de Modal (Vanilla JS, no migrado aún)
vi.mock('../../src/components/Modal/Modal.js', () => ({
  createModal: vi.fn(() => ({
    open: vi.fn(),
    close: vi.fn(),
    lock: vi.fn(),
    unlock: vi.fn(),
  })),
}));

// ─── Imports (tras los mocks) ─────────────────────────────────────────────────

import { svelteMount as svelteMountMock } from '../../src/lib/svelteMount.js';
import { createHomeView } from '../../src/views/HomeView.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Crea un mock del store que expone el callback de suscripción
 * para dispararlo manualmente en los tests.
 */
function crearStoreMock() {
  let callbackSuscripcion = null;

  const store = {
    subscribe: vi.fn((cb) => {
      callbackSuscripcion = cb;
      return vi.fn(); // función de desuscripción
    }),
    cargarMediciones: vi.fn(),
  };

  function emitirEstado(estado) {
    if (callbackSuscripcion) {
      callbackSuscripcion(estado);
    }
  }

  return { store, emitirEstado };
}

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
  // Configurar mount() para que devuelva el mock correcto según el componente
  svelteMountMock.mockImplementation((Component, _opts) => {
    const name = Component?.name ?? '';
    if (name === 'MeasurementList') return listaMock;
    if (name === 'MeasurementChart') return graficaMock;
    return {};
  });

  document.body.innerHTML = '<main id="app"></main>';
  containerEl = document.getElementById('app');

  const mockSetup = crearStoreMock();
  storeMock    = mockSetup.store;
  emitirEstado = mockSetup.emitirEstado;

  vista = createHomeView(containerEl, {
    store:   storeMock,
    service: {},
    toast:   { mostrar: vi.fn(), show: vi.fn() },
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
    emitirEstado({
      cargando: false,
      error: null,
      mediciones: [crearMedicion('uuid-1')],
    });
    expect(getDashboardContent().classList.contains('dashboard-content--columnas')).toBe(true);

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
