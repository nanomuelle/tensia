/**
 * Tests unitarios: store de sesión — authStore.svelte.js (BK-29)
 *
 * Verifica el estado inicial, las acciones login() / logout(), la derivada
 * isAuthenticated, la persistencia en sessionStorage y la rehydratación
 * automática al importar el módulo.
 *
 * sessionStorage está disponible en el entorno jsdom de Vitest.
 *
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { authStore, login, logout } from '../../src/store/authStore.svelte.js';

// =========================================================
// Fixtures
// =========================================================

const TOKEN_DATA = {
  access_token: 'ya29.test-access-token',
  id_token: 'test.id.token',
  expires_in: 3600,
  token_type: 'Bearer',
};

const USER_PROFILE = {
  sub: '123456789',
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://example.com/photo.jpg',
};

// =========================================================
// Limpieza: sesión anónima + sessionStorage limpios antes de cada test
// =========================================================

beforeEach(() => {
  sessionStorage.clear();
  logout();
});

// =========================================================
// Estado inicial
// =========================================================

describe('estado inicial', () => {
  test('sesion es null (usuario anónimo)', () => {
    expect(authStore.sesion).toBeNull();
  });

  test('isAuthenticated es false', () => {
    expect(authStore.isAuthenticated).toBe(false);
  });
});

// =========================================================
// login()
// =========================================================

describe('login()', () => {
  test('establece la sesión con tokenData y userProfile', () => {
    login(TOKEN_DATA, USER_PROFILE);

    expect(authStore.sesion).not.toBeNull();
    expect(authStore.sesion.tokenData).toEqual(TOKEN_DATA);
    expect(authStore.sesion.userProfile).toEqual(USER_PROFILE);
  });

  test('la sesión contiene exactamente los datos pasados, sin mutarlos', () => {
    const tokenCopia = { ...TOKEN_DATA };
    const perfilCopia = { ...USER_PROFILE };

    login(tokenCopia, perfilCopia);

    expect(authStore.sesion.tokenData).toStrictEqual(TOKEN_DATA);
    expect(authStore.sesion.userProfile).toStrictEqual(USER_PROFILE);
  });

  test('una segunda llamada a login() sobreescribe la sesión anterior', () => {
    const otroToken = { access_token: 'ya29.otro-token', expires_in: 1800 };
    const otroPerfil = { sub: '999', name: 'Otro Usuario', email: 'otro@example.com' };

    login(TOKEN_DATA, USER_PROFILE);
    login(otroToken, otroPerfil);

    expect(authStore.sesion.tokenData.access_token).toBe('ya29.otro-token');
    expect(authStore.sesion.userProfile.name).toBe('Otro Usuario');
  });

  test('isAuthenticated pasa a true tras login()', () => {
    login(TOKEN_DATA, USER_PROFILE);

    expect(authStore.isAuthenticated).toBe(true);
  });
});

// =========================================================
// logout()
// =========================================================

describe('logout()', () => {
  test('restablece la sesión a null', () => {
    login(TOKEN_DATA, USER_PROFILE);
    logout();

    expect(authStore.sesion).toBeNull();
  });

  test('isAuthenticated vuelve a false tras logout()', () => {
    login(TOKEN_DATA, USER_PROFILE);
    logout();

    expect(authStore.isAuthenticated).toBe(false);
  });

  test('logout() sobre sesión ya nula no lanza', () => {
    // beforeEach ya llama a logout(), así que la sesión es null aquí
    expect(() => logout()).not.toThrow();
    expect(authStore.sesion).toBeNull();
  });
});

// =========================================================
// Persistencia en sessionStorage
// =========================================================

describe('persistencia en sessionStorage', () => {
  test('login() guarda la sesión serializada bajo la clave auth_session', () => {
    login(TOKEN_DATA, USER_PROFILE);

    const raw = sessionStorage.getItem('auth_session');
    expect(raw).not.toBeNull();

    const guardado = JSON.parse(raw);
    expect(guardado.tokenData).toEqual(TOKEN_DATA);
    expect(guardado.userProfile).toEqual(USER_PROFILE);
  });

  test('logout() elimina la entrada auth_session de sessionStorage', () => {
    login(TOKEN_DATA, USER_PROFILE);
    logout();

    expect(sessionStorage.getItem('auth_session')).toBeNull();
  });

  test('logout() sobre sesión nula no lanza aunque no haya entrada en sessionStorage', () => {
    sessionStorage.clear();

    expect(() => logout()).not.toThrow();
  });

  test('login() sobreescribe la sesión previa en sessionStorage', () => {
    const otroToken = { access_token: 'ya29.nuevo' };
    const otroPerfil = { sub: '999', name: 'Nuevo' };

    login(TOKEN_DATA, USER_PROFILE);
    login(otroToken, otroPerfil);

    const guardado = JSON.parse(sessionStorage.getItem('auth_session'));
    expect(guardado.tokenData.access_token).toBe('ya29.nuevo');
  });
});

// =========================================================
// Rehydratación automática desde sessionStorage
// =========================================================

describe('rehydratación', () => {
  test('al importar el módulo con sessionStorage relleno, sesion se restaura', async () => {
    // Precondición: sessionStorage contiene una sesión previa
    sessionStorage.setItem(
      'auth_session',
      JSON.stringify({ tokenData: TOKEN_DATA, userProfile: USER_PROFILE })
    );

    // Recargar el módulo para simular una apertura nueva de la app
    vi.resetModules();
    const { authStore: freshStore } = await import('../../src/store/authStore.svelte.js');

    expect(freshStore.sesion).not.toBeNull();
    expect(freshStore.sesion.tokenData).toEqual(TOKEN_DATA);
    expect(freshStore.sesion.userProfile).toEqual(USER_PROFILE);
    expect(freshStore.isAuthenticated).toBe(true);

    // Limpiar para no afectar a las importaciones del resto del fichero
    vi.resetModules();
  });

  test('al importar el módulo con sessionStorage vacío, sesion es null', async () => {
    // beforeEach ya limpió sessionStorage
    vi.resetModules();
    const { authStore: freshStore } = await import('../../src/store/authStore.svelte.js');

    expect(freshStore.sesion).toBeNull();
    expect(freshStore.isAuthenticated).toBe(false);

    vi.resetModules();
  });

  test('JSON corrupto en sessionStorage no lanza y devuelve sesión nula', async () => {
    sessionStorage.setItem('auth_session', '{json_invalido:::}');

    vi.resetModules();
    const { authStore: freshStore } = await import('../../src/store/authStore.svelte.js');

    expect(freshStore.sesion).toBeNull();

    vi.resetModules();
  });
});
