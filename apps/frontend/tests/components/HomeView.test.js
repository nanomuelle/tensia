/**
 * Tests unitarios: HomeView.svelte (Vitest + @testing-library/svelte — BK-27)
 *
 * Verifica los comportamientos clave de la vista del dashboard:
 *   1. Renderiza el botón "Nueva medición".
 *   2. Llama a cargarMediciones(service) en onMount.
 *   3. Muestra RegistroMedicionModal al pulsar el botón.
 *   4. Al llamar onClose (vía cierre modal), oculta la modal y recarga el store.
 *   5. Aplica/retira la clase --columnas en respuesta al store de mediciones.
 *   6. Visibilidad de la sección de gráfica según estado del store.
 *
 * Módulos mockeados:
 *   - appStore.svelte.js  → stores minimales + cargarMediciones vi.fn
 *   - chart.js            → renderChart vi.fn (evita errores D3 en jsdom)
 *
 * Referencia: docs/product/backlog.md → BK-27, Subtarea 2
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';

// ---------------------------------------------------------------------------
// Polyfill TransitionEvent (jsdom no lo incluye de forma nativa)
// ---------------------------------------------------------------------------
if (typeof globalThis.TransitionEvent === 'undefined') {
  globalThis.TransitionEvent = class TransitionEvent extends Event {
    constructor(type, init = {}) {
      super(type, init);
      this.propertyName = init.propertyName ?? '';
    }
  };
}

// Polyfill ResizeObserver  (jsdom no lo implementa)
globalThis.ResizeObserver = class {
  observe()    {}
  unobserve()  {}
  disconnect() {}
};

// ---------------------------------------------------------------------------
// Mock: chart.js (evita dependencias D3 en jsdom)
// ---------------------------------------------------------------------------
vi.mock('../../src/chart.js', () => ({ renderChart: vi.fn() }));

// ---------------------------------------------------------------------------
// Mock: appStore.svelte.js
// Los stores se crean con vi.hoisted() para que estén disponibles dentro de
// vi.mock(), el cual es hoistado al inicio del fichero por Vitest.
// ---------------------------------------------------------------------------

/**
 * Implementación mínima de store Svelte compatible con el contrato
 * subscribe/set y con el operador $store de Svelte 5.
 */
const { medicionesStore, cargandoStore, errorStore, mockCargarMediciones } =
  vi.hoisted(() => {
    function crearStore(valorInicial) {
      let valor = valorInicial;
      const subs = new Set();
      return {
        subscribe(fn) {
          subs.add(fn);
          fn(valor);           // llamada síncrona con el valor actual (contrato Svelte)
          return () => subs.delete(fn);
        },
        set(v) {
          valor = v;
          subs.forEach((fn) => fn(valor));
        },
      };
    }

    // vi.fn() está disponible en vi.hoisted()
    return {
      medicionesStore:       crearStore([]),
      cargandoStore:         crearStore(false),
      errorStore:            crearStore(null),
      mockCargarMediciones:  vi.fn(),
    };
  });

vi.mock('../../src/store/appStore.svelte.js', () => ({
  mediciones:       medicionesStore,
  cargando:         cargandoStore,
  error:            errorStore,
  cargarMediciones: mockCargarMediciones,
}));

// ---------------------------------------------------------------------------
// Import del componente bajo prueba (siempre después de los mocks)
// ---------------------------------------------------------------------------
import HomeView from '../../src/views/HomeView.svelte';

// ---------------------------------------------------------------------------
// Fixtures y helpers
// ---------------------------------------------------------------------------

function crearMedicion(id = 'uuid-1') {
  return {
    id,
    systolic:   120,
    diastolic:  80,
    pulse:      72,
    measuredAt: '2026-02-18T10:00:00.000Z',
    source:     'manual',
  };
}

const mockService = { create: vi.fn(), listAll: vi.fn() };
const mockToast   = { show: vi.fn(), mostrar: vi.fn() };

function resetearStores() {
  medicionesStore.set([]);
  cargandoStore.set(false);
  errorStore.set(null);
}

/** Dispara transitionend en .modal para completar la animación de cierre. */
async function completarAnimacionCierre() {
  const modalEl = document.querySelector('.modal');
  if (!modalEl) return;
  modalEl.dispatchEvent(
    new TransitionEvent('transitionend', { bubbles: true, propertyName: 'transform' }),
  );
  await tick();
}

// ---------------------------------------------------------------------------
// Setup compartido
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetearStores();
  mockCargarMediciones.mockClear();
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Estructura inicial
// ---------------------------------------------------------------------------

describe('Estructura inicial', () => {
  test('renderiza el botón "Nueva medición"', () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    expect(screen.getByRole('button', { name: /nueva medición/i })).toBeInTheDocument();
  });

  test('renderiza el contenedor del dashboard (#dashboard-content)', () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    expect(document.getElementById('dashboard-content')).toBeInTheDocument();
  });

  test('renderiza la sección del historial (#historial-root)', () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    expect(document.getElementById('historial-root')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// onMount — carga inicial
// ---------------------------------------------------------------------------

describe('onMount — carga inicial', () => {
  test('llama a cargarMediciones con el service al montar', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    await tick();
    expect(mockCargarMediciones).toHaveBeenCalledTimes(1);
    expect(mockCargarMediciones).toHaveBeenCalledWith(mockService);
  });
});

// ---------------------------------------------------------------------------
// Modal de nueva medición
// ---------------------------------------------------------------------------

describe('Modal de nueva medición', () => {
  test('no muestra la modal (role="dialog") al cargar', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    await tick();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  test('muestra la modal al pulsar el botón', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });

    fireEvent.click(screen.getByRole('button', { name: /nueva medición/i }));
    await tick(); // Svelte monta RegistroMedicionModal
    await tick(); // onMount de RegistroMedicionModal llama modal.open() → _visible = true
    await tick(); // Svelte actualiza el DOM con el overlay

    expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
  });

  test('cierra la modal al completar la animación de cierre', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });

    // Abrir
    fireEvent.click(screen.getByRole('button', { name: /nueva medición/i }));
    await tick(); await tick(); await tick();
    expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();

    // Cerrar via botón ✕
    const btnCerrar = document.querySelector('[aria-label="Cerrar modal"]');
    expect(btnCerrar).not.toBeNull();
    fireEvent.click(btnCerrar);
    await completarAnimacionCierre();

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  test('llama a cargarMediciones de nuevo al cerrar la modal (onClose)', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    await tick();

    const llamadasAntes = mockCargarMediciones.mock.calls.length;

    // Abrir y cerrar
    fireEvent.click(screen.getByRole('button', { name: /nueva medición/i }));
    await tick(); await tick(); await tick();
    fireEvent.click(document.querySelector('[aria-label="Cerrar modal"]'));
    await completarAnimacionCierre();

    expect(mockCargarMediciones.mock.calls.length).toBeGreaterThan(llamadasAntes);
  });
});

// ---------------------------------------------------------------------------
// Layout de dos columnas — toggle de clase
// ---------------------------------------------------------------------------

describe('Layout de columnas — toggle de clase', () => {
  test('con 0 mediciones: clase --columnas ausente', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    await tick();
    expect(document.getElementById('dashboard-content')
      .classList.contains('dashboard-content--columnas')).toBe(false);
  });

  test('con ≥ 1 medición: clase --columnas presente', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    medicionesStore.set([crearMedicion()]);
    await tick();
    expect(document.getElementById('dashboard-content')
      .classList.contains('dashboard-content--columnas')).toBe(true);
  });

  test('al pasar de ≥ 1 medición a 0: clase --columnas retirada', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });

    medicionesStore.set([crearMedicion()]);
    await tick();
    expect(document.getElementById('dashboard-content')
      .classList.contains('dashboard-content--columnas')).toBe(true);

    medicionesStore.set([]);
    await tick();
    expect(document.getElementById('dashboard-content')
      .classList.contains('dashboard-content--columnas')).toBe(false);
  });

  test('en estado cargando con mediciones vacías: clase --columnas ausente', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    cargandoStore.set(true);
    medicionesStore.set([]);
    await tick();
    expect(document.getElementById('dashboard-content')
      .classList.contains('dashboard-content--columnas')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Sección de gráfica — visibilidad
// ---------------------------------------------------------------------------

describe('Sección de gráfica — visibilidad', () => {
  test('oculta cuando cargando=true', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    cargandoStore.set(true);
    await tick();
    expect(document.getElementById('seccion-grafica').hidden).toBe(true);
  });

  test('oculta cuando hay error', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    errorStore.set('Error al leer');
    await tick();
    expect(document.getElementById('seccion-grafica').hidden).toBe(true);
  });

  test('visible cuando mediciones está vacío (muestra el skeleton)', async () => {
    // Con 0 mediciones la sección es visible; MeasurementChart muestra el skeleton
    // internamente. Comportamiento definido en US-11 y confirmado por los tests E2E.
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    await tick();
    expect(document.getElementById('seccion-grafica').hidden).toBe(false);
  });

  test('visible cuando hay mediciones sin error ni carga', async () => {
    render(HomeView, { props: { service: mockService, toast: mockToast } });
    medicionesStore.set([crearMedicion(), crearMedicion('uuid-2')]);
    cargandoStore.set(false);
    errorStore.set(null);
    await tick();
    expect(document.getElementById('seccion-grafica').hidden).toBe(false);
  });
});
