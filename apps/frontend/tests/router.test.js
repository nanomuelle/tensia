/**
 * Tests unitarios: router.js (hash-based).
 * Verifica la navegación a rutas válidas, el fallback a '/', la reacción
 * al evento hashchange y que los componentes Svelte se montan/desmontan correctamente.
 *
 * Runner: Vitest + jsdom.
 * La API programática de Svelte (mount/unmount) se mockea con vi.mock.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock de 'svelte' antes de importar el módulo bajo test.
// mount devuelve un objeto sentinel único por llamada para que unmount pueda verificarse.
vi.mock('svelte', () => ({
  mount:   vi.fn((_component, _opts) => ({ __instancia: Symbol('instancia') })),
  unmount: vi.fn(),
}));

import { mount, unmount } from 'svelte';
import { createRouter } from '../src/router.js';

// =========================================================
// Helpers — componentes Svelte falsos
// =========================================================

/** Crea un objeto que simula un componente Svelte importado (solo necesita identidad). */
function crearComponenteMock(nombre = 'Componente') {
  return { __nombre: nombre };
}

/** Crea una entrada de ruta con props opcionales. */
function crearEntrada(component, props = {}) {
  return { component, props };
}

// =========================================================
// Setup
// =========================================================

let container;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  window.location.hash = '';
  // Reiniciar los mocks entre tests
  mount.mockClear();
  unmount.mockClear();
});

afterEach(() => {
  document.body.removeChild(container);
  window.location.hash = '';
});

// =========================================================
// navigate()
// =========================================================

describe('createRouter — navigate()', () => {
  test('llama a mount con el componente y el contenedor correctos al navegar a "#/"', () => {
    const HomeView = crearComponenteMock('HomeView');
    const routes = { '/': crearEntrada(HomeView, { service: 'srv' }) };
    const router = createRouter(routes, container);

    router.navigate('#/');

    expect(mount).toHaveBeenCalledTimes(1);
    expect(mount).toHaveBeenCalledWith(HomeView, { target: container, props: { service: 'srv' } });
  });

  test('props como función: se evalúa en el momento de navegar', () => {
    const HomeView = crearComponenteMock('HomeView');
    const propsFn = vi.fn(() => ({ service: 'srv-dinamico' }));
    const routes = { '/': { component: HomeView, props: propsFn } };
    const router = createRouter(routes, container);

    router.navigate('#/');

    expect(propsFn).toHaveBeenCalledTimes(1);
    expect(mount).toHaveBeenCalledWith(HomeView, { target: container, props: { service: 'srv-dinamico' } });
  });

  test('ruta desconocida cae al fallback "/"', () => {
    const HomeView = crearComponenteMock('HomeView');
    const routes = { '/': crearEntrada(HomeView) };
    const router = createRouter(routes, container);

    router.navigate('#/ruta-inexistente');

    expect(mount).toHaveBeenCalledTimes(1);
    expect(mount.mock.calls[0][0]).toBe(HomeView);
  });

  test('llama a unmount sobre la instancia anterior antes de montar la nueva', () => {
    const instanciaA = { __instancia: 'A' };
    mount.mockReturnValueOnce(instanciaA);

    const CompA = crearComponenteMock('A');
    const CompB = crearComponenteMock('B');
    const routes = {
      '/':         crearEntrada(CompA),
      '/settings': crearEntrada(CompB),
    };
    const router = createRouter(routes, container);

    router.navigate('#/');
    router.navigate('#/settings');

    expect(unmount).toHaveBeenCalledTimes(1);
    expect(unmount).toHaveBeenCalledWith(instanciaA);
    expect(mount).toHaveBeenCalledTimes(2);
  });

  test('hash vacío navega a "/"', () => {
    const HomeView = crearComponenteMock('HomeView');
    const routes = { '/': crearEntrada(HomeView) };
    const router = createRouter(routes, container);

    router.navigate('');

    expect(mount).toHaveBeenCalledTimes(1);
    expect(mount.mock.calls[0][0]).toBe(HomeView);
  });

  test('sin argumento usa window.location.hash o navega a "/"', () => {
    const HomeView = crearComponenteMock('HomeView');
    const routes = { '/': crearEntrada(HomeView) };
    window.location.hash = '#/';

    const router = createRouter(routes, container);
    router.navigate();

    expect(mount).toHaveBeenCalledTimes(1);
  });

  test('no hace nada si no existe la ruta ni el fallback "/"', () => {
    const routes = {};
    const router = createRouter(routes, container);

    expect(() => router.navigate('#/')).not.toThrow();
    expect(mount).not.toHaveBeenCalled();
  });

  test('guard que devuelve false bloquea la navegación', () => {
    const HomeView = crearComponenteMock('HomeView');
    const routes = {
      '/': { component: HomeView, props: {}, guard: () => false },
    };
    const router = createRouter(routes, container);

    router.navigate('#/');

    expect(mount).not.toHaveBeenCalled();
  });

  test('guard que devuelve true permite la navegación', () => {
    const HomeView = crearComponenteMock('HomeView');
    const routes = {
      '/': { component: HomeView, props: {}, guard: () => true },
    };
    const router = createRouter(routes, container);

    router.navigate('#/');

    expect(mount).toHaveBeenCalledTimes(1);
  });
});

// =========================================================
// start()
// =========================================================

describe('createRouter — start()', () => {
  test('realiza la navegación inicial al arrancar', () => {
    const HomeView = crearComponenteMock('HomeView');
    const routes = { '/': crearEntrada(HomeView) };
    window.location.hash = '#/';

    const router = createRouter(routes, container);
    router.start();

    expect(mount).toHaveBeenCalledTimes(1);
    expect(mount.mock.calls[0][0]).toBe(HomeView);
  });

  test('reacciona a hashchange navegando al nuevo componente y desmontando el anterior', () => {
    const instanciaHome = { __instancia: 'home' };
    mount.mockReturnValueOnce(instanciaHome);

    const HomeView     = crearComponenteMock('HomeView');
    const SettingsView = crearComponenteMock('SettingsView');
    const routes = {
      '/':         crearEntrada(HomeView),
      '/settings': crearEntrada(SettingsView),
    };
    window.location.hash = '#/';

    // Interceptar el handler registrado en hashchange para invocarlo directamente
    // y evitar que listeners de otros tests interfieran.
    let handlerHashChange;
    const addEventListenerOriginal = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((tipo, handler, opts) => {
      if (tipo === 'hashchange') handlerHashChange = handler;
      addEventListenerOriginal(tipo, handler, opts);
    });

    const router = createRouter(routes, container);
    router.start();

    // Restaurar el spy para no contaminar otros tests
    window.addEventListener.mockRestore();

    // Simular hashchange actualizando el hash y llamando al handler directamente
    window.location.hash = '#/settings';
    handlerHashChange();

    expect(unmount).toHaveBeenCalledWith(instanciaHome);
    expect(mount).toHaveBeenCalledTimes(2);
    expect(mount.mock.calls[1][0]).toBe(SettingsView);
  });
});
