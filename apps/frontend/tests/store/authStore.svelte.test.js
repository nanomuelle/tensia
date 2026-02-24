/**
 * Tests unitarios: store de sesión — authStore.svelte.js (BK-40)
 *
 * Verifica el estado inicial, la acción login() y la acción logout().
 * Usa el helper get() de svelte/store para leer el valor actual del store.
 *
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { sesion, login, logout } from '../../src/store/authStore.svelte.js';

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
// Limpieza: asegurar sesión anónima antes de cada test
// =========================================================

beforeEach(() => {
  logout();
});

// =========================================================
// Estado inicial
// =========================================================

describe('sesion (store)', () => {
  test('el valor inicial es null (usuario anónimo)', () => {
    expect(get(sesion)).toBeNull();
  });
});

// =========================================================
// login()
// =========================================================

describe('login()', () => {
  test('establece la sesión con tokenData y userProfile', () => {
    login(TOKEN_DATA, USER_PROFILE);

    const estado = get(sesion);
    expect(estado).not.toBeNull();
    expect(estado.tokenData).toEqual(TOKEN_DATA);
    expect(estado.userProfile).toEqual(USER_PROFILE);
  });

  test('la sesión contiene exactamente los datos pasados, sin mutarlos', () => {
    const tokenCopia = { ...TOKEN_DATA };
    const perfilCopia = { ...USER_PROFILE };

    login(tokenCopia, perfilCopia);

    const estado = get(sesion);
    expect(estado.tokenData).toStrictEqual(TOKEN_DATA);
    expect(estado.userProfile).toStrictEqual(USER_PROFILE);
  });

  test('una segunda llamada a login() sobreescribe la sesión anterior', () => {
    const otroToken = { access_token: 'ya29.otro-token', expires_in: 1800 };
    const otroPerfil = { sub: '999', name: 'Otro Usuario', email: 'otro@example.com' };

    login(TOKEN_DATA, USER_PROFILE);
    login(otroToken, otroPerfil);

    const estado = get(sesion);
    expect(estado.tokenData.access_token).toBe('ya29.otro-token');
    expect(estado.userProfile.name).toBe('Otro Usuario');
  });

  test('los suscriptores al store reciben el nuevo estado', () => {
    const valores = [];
    const unsub = sesion.subscribe((v) => valores.push(v));

    login(TOKEN_DATA, USER_PROFILE);

    unsub();

    // El primer valor es el estado en el momento de la suscripción (null por el beforeEach)
    // El segundo es el valor tras login()
    expect(valores).toHaveLength(2);
    expect(valores[0]).toBeNull();
    expect(valores[1].userProfile.name).toBe(USER_PROFILE.name);
  });
});

// =========================================================
// logout()
// =========================================================

describe('logout()', () => {
  test('restablece la sesión a null', () => {
    login(TOKEN_DATA, USER_PROFILE);
    logout();

    expect(get(sesion)).toBeNull();
  });

  test('logout() sobre sesión ya nula no lanza', () => {
    // beforeEach ya llama a logout(), así que la sesión es null aquí
    expect(() => logout()).not.toThrow();
    expect(get(sesion)).toBeNull();
  });

  test('los suscriptores al store reciben null tras logout()', () => {
    login(TOKEN_DATA, USER_PROFILE);

    const valores = [];
    const unsub = sesion.subscribe((v) => valores.push(v));

    logout();
    unsub();

    // Primer valor: sesión activa (por el login() previo a la suscripción)
    // Segundo valor: null (por logout())
    expect(valores).toHaveLength(2);
    expect(valores[0]).not.toBeNull();
    expect(valores[1]).toBeNull();
  });
});
