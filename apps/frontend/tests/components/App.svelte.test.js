/**
 * Tests de integración: App.svelte — gestión del callback OAuth 2.0 (BK-36)
 *
 * Verifica que App.svelte detecta correctamente el callback de Google
 * (?code= / ?error= en query params), delega en authService.handleCallback()
 * y gestiona los distintos errores mostrando toasts descriptivos.
 *
 * Módulos mockeados:
 *   - router.js  → createRouter vi.fn (evita que el router monte HomeView)
 *   - chart.js   → renderChart vi.fn (evita errores de D3 en jsdom)
 *
 * IosWarning y Toast se renderizan realmente (compatibles con jsdom).
 *
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';

// ─────────────────────────────────────────────────────────────────────────────
// Polyfills necesarios para jsdom
// ─────────────────────────────────────────────────────────────────────────────

globalThis.ResizeObserver = class {
  observe()    {}
  unobserve()  {}
  disconnect() {}
};

if (typeof globalThis.TransitionEvent === 'undefined') {
  globalThis.TransitionEvent = class TransitionEvent extends Event {
    constructor(type, init = {}) {
      super(type, init);
      this.propertyName = init.propertyName ?? '';
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mocks de módulos
// ─────────────────────────────────────────────────────────────────────────────

// El router se mockea para que no intente montar HomeView ni navegar realmente.
vi.mock('../../src/router.js', () => ({
  createRouter: vi.fn(() => ({ start: vi.fn() })),
}));

// chart.js usa D3 que no funciona en jsdom.
vi.mock('../../src/chart.js', () => ({ renderChart: vi.fn() }));

// ─────────────────────────────────────────────────────────────────────────────
// Import del sujeto de prueba (después de los mocks)
// ─────────────────────────────────────────────────────────────────────────────
import App from '../../src/App.svelte';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Crea un authService mock con handleCallback configurable. */
function crearAuthServiceMock({
  callbackResult = Promise.resolve({ tokenData: {}, userProfile: {} }),
} = {}) {
  return {
    handleCallback: vi.fn().mockReturnValue(callbackResult),
    requestCode:    vi.fn(),
    logout:         vi.fn(),
  };
}

/** Servicio de mediciones stub (no se usa en estas pruebas). */
const serviceMock = {
  listAll: vi.fn().mockResolvedValue([]),
  create:  vi.fn(),
};

/**
 * Reemplaza window.location con un objeto controlable.
 * @param {string} search   - ej. '?code=abc&state=xyz'
 * @param {string} pathname - ej. '/'
 */
function mockLocation(search = '', pathname = '/') {
  Object.defineProperty(window, 'location', {
    value: {
      search,
      pathname,
      hash: '',
      origin: 'http://localhost',
      href: `http://localhost${pathname}${search}`,
    },
    writable:     true,
    configurable: true,
  });
}

/**
 * Avanza varios ciclos de microtareas para permitir que la cadena async de
 * onMount (await handleCallback → catch → toast.show → Svelte reactivity) se
 * complete y el DOM refleje los cambios de estado.
 */
async function drainMicrotasks(n = 5) {
  for (let i = 0; i < n; i++) await tick();
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite de pruebas
// ─────────────────────────────────────────────────────────────────────────────

describe('App.svelte — gestión del callback OAuth (BK-36)', () => {
  beforeEach(() => {
    mockLocation('');
    vi.spyOn(history, 'replaceState').mockImplementation(() => {});
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  // ─── Sin callback ──────────────────────────────────────────────────────────

  test('sin parámetros de callback, no llama a authService.handleCallback', async () => {
    mockLocation('');
    const authService = crearAuthServiceMock();
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    expect(authService.handleCallback).not.toHaveBeenCalled();
  });

  test('sin callback, arranca el router normalmente', async () => {
    mockLocation('');
    const { createRouter } = await import('../../src/router.js');
    const authService = crearAuthServiceMock();
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    expect(createRouter).toHaveBeenCalled();
  });

  // ─── Callback exitoso ──────────────────────────────────────────────────────

  test('con ?code= en la URL, llama a handleCallback con los params correctos', async () => {
    mockLocation('?code=auth-code-123&state=state-abc');
    const authService = crearAuthServiceMock();
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    expect(authService.handleCallback).toHaveBeenCalledOnce();
    const params = authService.handleCallback.mock.calls[0][0];
    expect(params).toBeInstanceOf(URLSearchParams);
    expect(params.get('code')).toBe('auth-code-123');
    expect(params.get('state')).toBe('state-abc');
  });

  test('callback exitoso: llama a history.replaceState para limpiar la URL', async () => {
    mockLocation('?code=auth-code-123&state=state-abc');
    const authService = crearAuthServiceMock();
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    expect(history.replaceState).toHaveBeenCalledWith(null, '', '/');
  });

  test('callback exitoso: no muestra ningún toast de error', async () => {
    mockLocation('?code=auth-code-123&state=state-abc');
    const authService = crearAuthServiceMock();
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    expect(screen.queryByRole('status')).toBeNull();
  });

  // ─── Error: acceso denegado por el usuario ─────────────────────────────────

  test('error access_denied: muestra toast de tipo info con mensaje de cancelación', async () => {
    mockLocation('?error=access_denied');
    const authService = crearAuthServiceMock({
      callbackResult: Promise.reject(new Error('google_auth_error:access_denied')),
    });
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    const toast = screen.getByRole('status');
    expect(toast.textContent).toContain('cancelado');
    expect(toast.className).toContain('toast--info');
  });

  test('error access_denied: llama a history.replaceState para limpiar la URL', async () => {
    mockLocation('?error=access_denied');
    const authService = crearAuthServiceMock({
      callbackResult: Promise.reject(new Error('google_auth_error:access_denied')),
    });
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    expect(history.replaceState).toHaveBeenCalledWith(null, '', '/');
  });

  // ─── Error: state inválido (CSRF) ──────────────────────────────────────────

  test('error state_invalido: muestra toast de tipo error con mención a seguridad', async () => {
    mockLocation('?code=abc&state=tampered');
    const authService = crearAuthServiceMock({
      callbackResult: Promise.reject(new Error('state_invalido')),
    });
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    const toast = screen.getByRole('status');
    expect(toast.textContent).toContain('seguridad');
    expect(toast.className).toContain('toast--error');
  });

  // ─── Error: intercambio de tokens fallido ──────────────────────────────────

  test('error intercambio_fallido: muestra toast de tipo error', async () => {
    mockLocation('?code=expired-code&state=state-xyz');
    const authService = crearAuthServiceMock({
      callbackResult: Promise.reject(new Error('intercambio_fallido:400:invalid_grant')),
    });
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    const toast = screen.getByRole('status');
    expect(toast.textContent).toContain('completar');
    expect(toast.className).toContain('toast--error');
  });

  // ─── Error: fallo al obtener el perfil ─────────────────────────────────────

  test('error userinfo_fallido: muestra toast de tipo error con mención al perfil', async () => {
    mockLocation('?code=code-ok&state=state-ok');
    const authService = crearAuthServiceMock({
      callbackResult: Promise.reject(new Error('userinfo_fallido:401')),
    });
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    const toast = screen.getByRole('status');
    expect(toast.textContent).toContain('perfil');
    expect(toast.className).toContain('toast--error');
  });

  // ─── Error: otro error de Google ──────────────────────────────────────────

  test('error google_auth_error genérico: muestra toast de tipo error', async () => {
    mockLocation('?error=server_error');
    const authService = crearAuthServiceMock({
      callbackResult: Promise.reject(new Error('google_auth_error:server_error')),
    });
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    const toast = screen.getByRole('status');
    expect(toast.className).toContain('toast--error');
  });

  // ─── Error indeterminado ──────────────────────────────────────────────────

  test('error desconocido: muestra toast de error genérico', async () => {
    mockLocation('?code=abc&state=xyz');
    const authService = crearAuthServiceMock({
      callbackResult: Promise.reject(new Error('unexpected_error')),
    });
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    const toast = screen.getByRole('status');
    expect(toast.textContent).toContain('Error al iniciar sesión');
    expect(toast.className).toContain('toast--error');
  });

  // ─── Con ?error= (sin code) ───────────────────────────────────────────────

  test('?error= en la URL también activa el procesamiento del callback', async () => {
    mockLocation('?error=access_denied');
    const authService = crearAuthServiceMock({
      callbackResult: Promise.reject(new Error('google_auth_error:access_denied')),
    });
    render(App, { props: { service: serviceMock, authService } });
    await drainMicrotasks();
    expect(authService.handleCallback).toHaveBeenCalledOnce();
  });
});
