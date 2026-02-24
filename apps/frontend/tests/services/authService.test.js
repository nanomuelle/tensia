/**
 * Tests unitarios: servicio de autenticación Google PKCE — authService.js
 *
 * Cubre el flujo Authorization Code + PKCE completo:
 *   - requestCode(): generación de PKCE, almacenamiento en localStorage y redirección.
 *   - handleCallback(): verificación CSRF, intercambio de tokens, obtención de perfil.
 *   - logout(): delegación en authStore.
 *   - Casos de error: state inválido, error de Google, intercambio fallido, userinfo fallido.
 *
 * Nota: los parámetros PKCE temporales se guardan en localStorage (no sessionStorage) para
 * que sobrevivan cuando el redirect de Google abre un contexto de navegación distinto (PWA).
 *
 * Todas las dependencias externas (fetch, crypto, window.location, authStore) se mockean.
 *
 * @jest-environment jsdom
 */

import { vi, describe, test, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import {
  createAuthService,
  generarCodeVerifier,
  generarCodeChallenge,
  generarState,
} from '../../src/services/authService.js';

// =========================================================
// Constantes de fixtures
// =========================================================

const CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
const REDIRECT_URI = 'http://localhost:5173/';

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
// Mocks de crypto Web API
// =========================================================

// Reemplaza crypto.getRandomValues con bytes predecibles (0x01, 0x02, ...)
function mockGetRandomValues(bytes) {
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = (i + 1) % 256;
  }
  return bytes;
}

// Devuelve un ArrayBuffer fijo como hash SHA-256 ficticio
async function mockDigest(_algorithm, _data) {
  return new Uint8Array(32).fill(0xab).buffer;
}

// Espías guardados para restauración
let spyGetRandomValues;
let spyDigest;

// =========================================================
// Mocks de window.location y sessionStorage
// =========================================================

let locationHref = '';

beforeEach(() => {
  // Mock de crypto usando vi.spyOn (subtle es getter-only en jsdom)
  spyGetRandomValues = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(mockGetRandomValues);
  spyDigest = vi.spyOn(globalThis.crypto.subtle, 'digest').mockImplementation(mockDigest);

  // Mock de window.location.href (jsdom no permite asignar directamente)
  Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
    configurable: true,
  });

  // Limpiar localStorage entre tests (los parámetros PKCE se guardan en localStorage)
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  spyGetRandomValues?.mockRestore();
  spyDigest?.mockRestore();
  vi.restoreAllMocks();
});

// =========================================================
// Mock del authStore
// =========================================================

function crearAuthStoreMock() {
  return {
    login: vi.fn(),
    logout: vi.fn(),
  };
}

// =========================================================
// Helpers PKCE exportados
// =========================================================

describe('helpers PKCE', () => {
  test('generarState() produce un string hexadecimal de 32 chars', () => {
    const state = generarState();
    expect(state).toMatch(/^[0-9a-f]{32}$/);
  });

  test('generarCodeVerifier() produce un string base64url de 43 chars', () => {
    const verifier = generarCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  test('generarCodeChallenge() produce un string base64url a partir del verifier', async () => {
    const verifier = generarCodeVerifier();
    const challenge = await generarCodeChallenge(verifier);
    // base64url sin relleno '='
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge).not.toContain('=');
  });
});

// =========================================================
// requestCode()
// =========================================================

describe('authService.requestCode()', () => {
  test('guarda state y code_verifier en localStorage', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });

    await svc.requestCode();

    expect(localStorage.getItem('auth_state')).toBeTruthy();
    expect(localStorage.getItem('auth_code_verifier')).toBeTruthy();
  });

  test('redirige a la URL de autorización de Google con los parámetros correctos', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });

    await svc.requestCode();

    const href = window.location.href;
    expect(href).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(href).toContain(`client_id=${encodeURIComponent(CLIENT_ID)}`);
    expect(href).toContain(`redirect_uri=${encodeURIComponent(REDIRECT_URI)}`);
    expect(href).toContain('response_type=code');
    expect(href).toContain('code_challenge_method=S256');
    expect(href).toContain('scope=openid+profile+email');
  });

  test('el state en la URL coincide con el guardado en localStorage', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });

    await svc.requestCode();

    const storedState = localStorage.getItem('auth_state');
    expect(window.location.href).toContain(`state=${storedState}`);
  });
});

// =========================================================
// handleCallback()
// =========================================================

describe('authService.handleCallback()', () => {
  /**
   * Prepara el localStorage como si requestCode() ya hubiese sido llamado
   * y devuelve el state almacenado.
   */
  function prepararSesion(state = 'test-state-1234567890') {
    localStorage.setItem('auth_state', state);
    localStorage.setItem('auth_code_verifier', 'test-verifier-abc');
    return state;
  }

  function construirParams(overrides = {}) {
    const defaults = { code: 'auth-code-123', state: prepararSesion() };
    return new URLSearchParams({ ...defaults, ...overrides });
  }

  function mockFetchExitoso() {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => TOKEN_DATA,
        text: async () => JSON.stringify(TOKEN_DATA),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => USER_PROFILE,
      });
  }

  test('intercambia el código por tokens y obtiene el perfil de usuario', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    mockFetchExitoso();

    const resultado = await svc.handleCallback(construirParams());

    expect(resultado.tokenData).toEqual(TOKEN_DATA);
    expect(resultado.userProfile).toEqual(USER_PROFILE);
  });

  test('llama a authStore.login con tokenData y userProfile', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    mockFetchExitoso();

    await svc.handleCallback(construirParams());

    expect(authStore.login).toHaveBeenCalledWith(TOKEN_DATA, USER_PROFILE);
  });

  test('pasa client_id, code y code_verifier en el body del intercambio', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => TOKEN_DATA, text: async () => '' })
      .mockResolvedValueOnce({ ok: true, json: async () => USER_PROFILE });

    await svc.handleCallback(construirParams());

    const [tokenUrl, tokenOpts] = globalThis.fetch.mock.calls[0];
    expect(tokenUrl).toBe('https://oauth2.googleapis.com/token');
    const body = new URLSearchParams(tokenOpts.body);
    expect(body.get('client_id')).toBe(CLIENT_ID);
    expect(body.get('code')).toBe('auth-code-123');
    expect(body.get('code_verifier')).toBe('test-verifier-abc');
    expect(body.get('grant_type')).toBe('authorization_code');
  });

  test('incluye client_secret en el body cuando se proporciona (cliente de escritorio)', async () => {
    const authStore = crearAuthStoreMock();
    const CLIENT_SECRET = 'test-client-secret';
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT_URI });
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => TOKEN_DATA, text: async () => '' })
      .mockResolvedValueOnce({ ok: true, json: async () => USER_PROFILE });

    await svc.handleCallback(construirParams());

    const [, tokenOpts] = globalThis.fetch.mock.calls[0];
    const body = new URLSearchParams(tokenOpts.body);
    expect(body.get('client_secret')).toBe(CLIENT_SECRET);
  });

  test('no incluye client_secret en el body cuando no se proporciona', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => TOKEN_DATA, text: async () => '' })
      .mockResolvedValueOnce({ ok: true, json: async () => USER_PROFILE });

    await svc.handleCallback(construirParams());

    const [, tokenOpts] = globalThis.fetch.mock.calls[0];
    const body = new URLSearchParams(tokenOpts.body);
    expect(body.get('client_secret')).toBeNull();
  });

  test('llama a /userinfo con el access_token del intercambio', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => TOKEN_DATA, text: async () => '' })
      .mockResolvedValueOnce({ ok: true, json: async () => USER_PROFILE });

    await svc.handleCallback(construirParams());

    const [userinfoUrl, userinfoOpts] = globalThis.fetch.mock.calls[1];
    expect(userinfoUrl).toBe('https://www.googleapis.com/oauth2/v3/userinfo');
    expect(userinfoOpts.headers.Authorization).toBe(`Bearer ${TOKEN_DATA.access_token}`);
  });

  test('limpia state y code_verifier de localStorage tras el intercambio', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    mockFetchExitoso();

    await svc.handleCallback(construirParams());

    expect(localStorage.getItem('auth_state')).toBeNull();
    expect(localStorage.getItem('auth_code_verifier')).toBeNull();
  });

  // -------------------------------------------------------
  // Casos de error
  // -------------------------------------------------------

  test('lanza error si Google devuelve parámetro error (ej. acceso denegado)', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    prepararSesion();

    const params = new URLSearchParams({ error: 'access_denied' });

    await expect(svc.handleCallback(params)).rejects.toThrow('google_auth_error:access_denied');
    expect(authStore.login).not.toHaveBeenCalled();
  });

  test('lanza error si el state no coincide (CSRF)', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    prepararSesion('estado-correcto');

    const params = new URLSearchParams({ code: 'auth-code-123', state: 'estado-incorrecto' });

    await expect(svc.handleCallback(params)).rejects.toThrow('state_invalido');
    expect(authStore.login).not.toHaveBeenCalled();
  });

  test('lanza error si state no existe en localStorage', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    // No se llama a prepararSesion() → localStorage vacío

    const params = new URLSearchParams({ code: 'auth-code-123', state: 'cualquier-state' });

    await expect(svc.handleCallback(params)).rejects.toThrow('state_invalido');
  });

  test('lanza error si falta el code en los parámetros', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    const state = prepararSesion();

    const params = new URLSearchParams({ state });

    await expect(svc.handleCallback(params)).rejects.toThrow('codigo_ausente');
  });

  test('lanza error si el intercambio de tokens falla (HTTP 4xx/5xx)', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'invalid_grant',
    });

    await expect(svc.handleCallback(construirParams())).rejects.toThrow('intercambio_fallido:400');
    expect(authStore.login).not.toHaveBeenCalled();
  });

  test('lanza error si la obtención del perfil falla', async () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => TOKEN_DATA, text: async () => '' })
      .mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(svc.handleCallback(construirParams())).rejects.toThrow('userinfo_fallido:401');
    expect(authStore.login).not.toHaveBeenCalled();
  });

  test('usa cadena vacía como detalle cuando text() del token falla', async () => {
    // Cubre el .catch(() => '') en el manejo de errores del intercambio de tokens.
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => { throw new Error('network error'); },
    });

    await expect(svc.handleCallback(construirParams())).rejects.toThrow('intercambio_fallido:500:');
  });
});

// =========================================================
// logout()
// =========================================================

describe('authService.logout()', () => {
  test('delega en authStore.logout()', () => {
    const authStore = crearAuthStoreMock();
    const svc = createAuthService({ authStore, clientId: CLIENT_ID, redirectUri: REDIRECT_URI });

    svc.logout();

    expect(authStore.logout).toHaveBeenCalledOnce();
  });
});
