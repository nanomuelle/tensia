/**
 * Tests unitarios: router.js (hash-based).
 * Verifica la navegación a rutas válidas, el fallback a '/', la reacción
 * al evento hashchange y que las vistas se desmontan correctamente.
 *
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createRouter } from '../src/router.js';

// =========================================================
// Helpers — fábrica de vistas mock
// =========================================================

function crearVistaMock(nombre = 'vista') {
  return {
    nombre,
    mount: jest.fn(),
    unmount: jest.fn(),
  };
}

function crearFactoriaMock(vista) {
  return jest.fn(() => vista);
}

// =========================================================
// Setup
// =========================================================

let container;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  // Aseguramos hash neutro antes de cada test
  window.location.hash = '';
});

afterEach(() => {
  document.body.removeChild(container);
  // Limpiar listeners de hashchange que pudieran haber quedado
  window.location.hash = '';
});

// =========================================================
// navigate()
// =========================================================

describe('createRouter — navigate()', () => {
  test('monta la vista de la ruta "/" al navegar con hash "#/"', () => {
    const vistaHome = crearVistaMock('home');
    const routes = { '/': crearFactoriaMock(vistaHome) };
    const router = createRouter(routes, container);

    router.navigate('#/');

    expect(vistaHome.mount).toHaveBeenCalledTimes(1);
  });

  test('pasa el contenedor a la fábrica de vista', () => {
    const fabrica = jest.fn(() => crearVistaMock());
    const routes = { '/': fabrica };
    const router = createRouter(routes, container);

    router.navigate('#/');

    expect(fabrica).toHaveBeenCalledWith(container);
  });

  test('ruta desconocida cae al fallback "/"', () => {
    const vistaHome = crearVistaMock('home');
    const routes = { '/': crearFactoriaMock(vistaHome) };
    const router = createRouter(routes, container);

    router.navigate('#/ruta-inexistente');

    expect(vistaHome.mount).toHaveBeenCalledTimes(1);
  });

  test('desmonta la vista anterior antes de montar la nueva', () => {
    const vistaA = crearVistaMock('A');
    const vistaB = crearVistaMock('B');
    const fabA = crearFactoriaMock(vistaA);
    const fabB = crearFactoriaMock(vistaB);

    const routes = { '/': fabA, '/settings': fabB };
    const router = createRouter(routes, container);

    router.navigate('#/');
    router.navigate('#/settings');

    expect(vistaA.unmount).toHaveBeenCalledTimes(1);
    expect(vistaB.mount).toHaveBeenCalledTimes(1);
  });

  test('hash vacío navega a "/"', () => {
    const vistaHome = crearVistaMock('home');
    const routes = { '/': crearFactoriaMock(vistaHome) };
    const router = createRouter(routes, container);

    router.navigate('');

    expect(vistaHome.mount).toHaveBeenCalledTimes(1);
  });

  test('sin argumento usa window.location.hash o navega a "/"', () => {
    const vistaHome = crearVistaMock('home');
    const routes = { '/': crearFactoriaMock(vistaHome) };
    window.location.hash = '#/';

    const router = createRouter(routes, container);
    router.navigate();

    expect(vistaHome.mount).toHaveBeenCalledTimes(1);
  });

  test('no hace nada si no existe la ruta ni el fallback "/"', () => {
    const routes = {};
    const router = createRouter(routes, container);

    // No debe lanzar
    expect(() => router.navigate('#/')).not.toThrow();
  });
});

// =========================================================
// start()
// =========================================================

describe('createRouter — start()', () => {
  test('start() realiza la navegación inicial', () => {
    const vistaHome = crearVistaMock('home');
    const routes = { '/': crearFactoriaMock(vistaHome) };
    window.location.hash = '#/';

    const router = createRouter(routes, container);
    router.start();

    expect(vistaHome.mount).toHaveBeenCalledTimes(1);
  });

  test('start() reacciona a hashchange navegando a la nueva ruta', () => {
    const vistaHome = crearVistaMock('home');
    const vistaSettings = crearVistaMock('settings');
    const routes = {
      '/': crearFactoriaMock(vistaHome),
      '/settings': crearFactoriaMock(vistaSettings),
    };
    window.location.hash = '#/';

    const router = createRouter(routes, container);
    router.start();

    // Simular hashchange a /settings
    window.location.hash = '#/settings';
    window.dispatchEvent(new Event('hashchange'));

    expect(vistaSettings.mount).toHaveBeenCalledTimes(1);
    expect(vistaHome.unmount).toHaveBeenCalledTimes(1);
  });
});
