/**
 * Tests de componente: UserSession.svelte (BK-37)
 *
 * Verifica:
 *  1. Estado anónimo: muestra el botón "Iniciar sesión" y llama a requestCode() al pulsarlo.
 *  2. Estado autenticado (con foto): muestra el avatar de imagen y el nombre.
 *  3. Estado autenticado (sin foto): muestra la inicial del nombre.
 *  4. Menú desplegable: se abre al pulsar el botón de avatar.
 *  5. Logout: llama a authService.logout() y navega a #/ al pulsar "Cerrar sesión".
 *  6. Tecla Escape cierra el menú sin hacer logout.
 *  7. Accesibilidad: botones con aria-label.
 *
 * Módulos mockeados:
 *   - ../../src/store/authStore.svelte.js  → objeto authStore controlado por los tests.
 *
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/svelte';
import { tick } from 'svelte';

// ---------------------------------------------------------------------------
// Polyfills de jsdom
// ---------------------------------------------------------------------------
if (typeof globalThis.TransitionEvent === 'undefined') {
  globalThis.TransitionEvent = class TransitionEvent extends Event {
    constructor(type, init = {}) {
      super(type, init);
      this.propertyName = init.propertyName ?? '';
    }
  };
}

// ---------------------------------------------------------------------------
// Mock: authStore.svelte.js
// Se crea con vi.hoisted() para que esté disponible en vi.mock(),
// que Vitest eleva al inicio del fichero.
// ---------------------------------------------------------------------------

const { mockAuthStore } = vi.hoisted(() => {
  /**
   * Estado mutable que los tests pueden ajustar antes de renderizar.
   * Se expone como objeto con getters igual que el authStore real.
   */
  let _sesion = null;
  const mockAuthStore = {
    get isAuthenticated() { return _sesion !== null; },
    get sesion()          { return _sesion; },
    // Helpers para los tests
    _setAnon()              { _sesion = null; },
    _setUser(userProfile)   { _sesion = { tokenData: {}, userProfile }; },
  };
  return { mockAuthStore };
});

vi.mock('../../src/store/authStore.svelte.js', () => ({
  authStore: mockAuthStore,
}));

// ---------------------------------------------------------------------------
// Import del sujeto de prueba (después de los mocks)
// ---------------------------------------------------------------------------
import UserSession from '../../src/components/UserSession/UserSession.svelte';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PERFIL_CON_FOTO = {
  name: 'Ana García',
  picture: 'https://example.com/foto.jpg',
  email: 'ana@example.com',
};

const PERFIL_SIN_FOTO = {
  name: 'Carlos Ruiz',
  picture: '',
  email: 'carlos@example.com',
};

/** Crea un authService mock con todas las funciones espías. */
function crearAuthServiceMock() {
  return {
    requestCode: vi.fn(),
    logout:      vi.fn(),
    handleCallback: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockAuthStore._setAnon();
  // Limpiar el hash para que logout pueda navegar a #/
  window.location.hash = '';
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ===========================================================================
// Estado anónimo
// ===========================================================================

describe('UserSession — estado anónimo', () => {
  test('muestra el botón "Iniciar sesión"', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    const boton = screen.getByRole('button', { name: /iniciar sesión con google/i });
    expect(boton).toBeInTheDocument();
  });

  test('no muestra el botón de avatar ni el menú', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    expect(document.querySelector('.user-session__avatar-btn')).toBeNull();
    expect(document.querySelector('.user-session__menu')).toBeNull();
  });

  test('llama a authService.requestCode() al pulsar el botón de login', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión con google/i }));
    await tick();

    expect(authService.requestCode).toHaveBeenCalledOnce();
  });

  test('el botón de login tiene aria-label descriptivo', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    const boton = screen.getByRole('button', { name: /iniciar sesión con google/i });
    expect(boton).toHaveAttribute('aria-label');
  });
});

// ===========================================================================
// Estado autenticado — con foto de perfil
// ===========================================================================

describe('UserSession — estado autenticado con foto', () => {
  beforeEach(() => {
    mockAuthStore._setUser(PERFIL_CON_FOTO);
  });

  test('muestra la imagen de perfil con alt descriptivo', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    const img = document.querySelector('.user-session__avatar-img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', PERFIL_CON_FOTO.picture);
    expect(img?.getAttribute('alt')).toMatch(/Ana García/);
  });

  test('no muestra la inicial como avatar de texto', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    expect(document.querySelector('.user-session__inicial')).toBeNull();
  });

  test('el botón avatar tiene aria-label con el nombre del usuario', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    const boton = document.querySelector('.user-session__avatar-btn');
    expect(boton?.getAttribute('aria-label')).toMatch(/Ana García/);
  });

  test('no muestra el botón "Iniciar sesión"', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    expect(document.querySelector('.user-session__login-btn')).toBeNull();
  });
});

// ===========================================================================
// Estado autenticado — sin foto (avatar de inicial)
// ===========================================================================

describe('UserSession — estado autenticado sin foto', () => {
  beforeEach(() => {
    mockAuthStore._setUser(PERFIL_SIN_FOTO);
  });

  test('muestra la inicial del nombre como avatar de texto', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    const inicial = document.querySelector('.user-session__inicial');
    expect(inicial).toBeInTheDocument();
    expect(inicial?.textContent).toBe('C');
  });

  test('no muestra imagen de perfil', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    expect(document.querySelector('.user-session__avatar-img')).toBeNull();
  });
});

// ===========================================================================
// Menú desplegable
// ===========================================================================

describe('UserSession — menú desplegable', () => {
  beforeEach(() => {
    mockAuthStore._setUser(PERFIL_CON_FOTO);
  });

  test('el menú está oculto inicialmente', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    expect(document.querySelector('.user-session__menu')).toBeNull();
  });

  test('al pulsar el botón avatar se abre el menú con el nombre', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    fireEvent.click(document.querySelector('.user-session__avatar-btn'));
    await tick();

    const menu = document.querySelector('.user-session__menu');
    expect(menu).toBeInTheDocument();
    expect(menu?.textContent).toContain('Ana García');
  });

  test('al pulsar el botón avatar dos veces, el menú se cierra', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    const btn = document.querySelector('.user-session__avatar-btn');
    fireEvent.click(btn);
    await tick();
    fireEvent.click(btn);
    await tick();

    expect(document.querySelector('.user-session__menu')).toBeNull();
  });

  test('Escape cierra el menú cuando está abierto', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    fireEvent.click(document.querySelector('.user-session__avatar-btn'));
    await tick();

    expect(document.querySelector('.user-session__menu')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    await tick();

    expect(document.querySelector('.user-session__menu')).toBeNull();
  });

  test('Escape no afecta si el menú ya está cerrado', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    fireEvent.keyDown(window, { key: 'Escape' });
    await tick();

    // no debe lanzar error ni mostrar menú
    expect(document.querySelector('.user-session__menu')).toBeNull();
  });
});

// ===========================================================================
// Logout
// ===========================================================================

describe('UserSession — cerrar sesión', () => {
  beforeEach(() => {
    mockAuthStore._setUser(PERFIL_CON_FOTO);
  });

  test('llama a authService.logout() al pulsar "Cerrar sesión"', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    // Abrir el menú
    fireEvent.click(document.querySelector('.user-session__avatar-btn'));
    await tick();

    // Pulsar logout
    fireEvent.click(document.querySelector('.user-session__logout-btn'));
    await tick();

    expect(authService.logout).toHaveBeenCalledOnce();
  });

  test('navega a #/ tras cerrar sesión', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    fireEvent.click(document.querySelector('.user-session__avatar-btn'));
    await tick();
    fireEvent.click(document.querySelector('.user-session__logout-btn'));
    await tick();

    expect(window.location.hash).toBe('#/');
  });

  test('el menú se cierra tras hacer logout', async () => {
    const authService = crearAuthServiceMock();
    render(UserSession, { props: { authService } });
    await tick();

    fireEvent.click(document.querySelector('.user-session__avatar-btn'));
    await tick();
    fireEvent.click(document.querySelector('.user-session__logout-btn'));
    await tick();

    expect(document.querySelector('.user-session__menu')).toBeNull();
  });
});
