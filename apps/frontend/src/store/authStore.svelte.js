/**
 * Store de sesión de autenticación — Svelte 5 Runes (BK-29).
 *
 * Gestiona el estado reactivo de la sesión de Google con Svelte 5 `$state`
 * y `$derived`. Persiste la sesión en `sessionStorage` (clave `auth_session`)
 * para que sobreviva recargas de página. Se rehidrata automáticamente al
 * importarse por primera vez.
 *
 * Uso:
 *   import { authStore, login, logout } from './authStore.svelte.js';
 *   authStore.sesion          → null | { tokenData, userProfile }
 *   authStore.isAuthenticated → true | false
 *
 * Sin dependencias de DOM, de la UI ni del adaptador de persistencia.
 *
 * @module store/authStore.svelte
 */

/** Clave de sessionStorage para la sesión persistida */
const SK_SESSION = 'auth_session';

// -------------------------------------------------------
// Rehydratación inicial desde sessionStorage
// -------------------------------------------------------

/**
 * Lee y deserializa la sesión almacenada en sessionStorage.
 * Devuelve null si no existe o si el JSON está corrompido.
 *
 * @returns {{ tokenData: object, userProfile: object } | null}
 */
function _rehydratar() {
  try {
    const raw = sessionStorage.getItem(SK_SESSION);
    if (raw) return JSON.parse(raw);
  } catch {
    // sessionStorage no disponible o JSON inválido — sesión anónima
  }
  return null;
}

// -------------------------------------------------------
// Estado reactivo (Svelte 5 Runes)
// -------------------------------------------------------

/**
 * Estado de la sesión activa.
 * null   → usuario anónimo (sin autenticar)
 * objeto → { tokenData: object, userProfile: object }
 */
let _sesion = $state(_rehydratar());

/**
 * Derivado: true cuando hay una sesión activa.
 * Se actualiza automáticamente al cambiar `_sesion`.
 */
let _isAuthenticated = $derived(_sesion !== null);

// -------------------------------------------------------
// Store público (solo lectura mediante getters)
// -------------------------------------------------------

// -------------------------------------------------------
// Acciones
// -------------------------------------------------------

/**
 * Establece la sesión activa tras un intercambio de tokens exitoso.
 * Persiste los datos en sessionStorage (clave `auth_session`).
 * Llamado por authService.handleCallback() (BK-36).
 *
 * @param {object} tokenData    - Respuesta del endpoint de tokens de Google (access_token, id_token, etc.).
 * @param {object} userProfile  - Perfil del usuario desde /userinfo (sub, name, picture, email).
 */
export function login(tokenData, userProfile) {
  const sesionData = { tokenData, userProfile };
  _sesion = sesionData;
  try {
    sessionStorage.setItem(SK_SESSION, JSON.stringify(sesionData));
  } catch {
    // sessionStorage no disponible (modo privado en algunos navegadores)
  }
}

/**
 * Cierra la sesión, vuelve al estado anónimo y elimina la entrada de sessionStorage.
 * Llamado por authService.logout() (BK-36).
 */
export function logout() {
  _sesion = null;
  try {
    sessionStorage.removeItem(SK_SESSION);
  } catch {
    // sessionStorage no disponible
  }
}

// -------------------------------------------------------
// Store público (solo lectura mediante getters + acciones)
// -------------------------------------------------------

/**
 * Objeto de estado reactivo del store de autenticación.
 * Los getters exponen `_sesion` e `_isAuthenticated` de forma inmutable.
 * Las acciones `login` y `logout` se incluyen para que `authService` pueda
 * recibir el store por inyección sin importar las funciones por separado
 * (BK-36: `createAuthService({ authStore, … })`).
 *
 * @type {{
 *   readonly sesion: { tokenData: object, userProfile: object } | null,
 *   readonly isAuthenticated: boolean,
 *   login: (tokenData: object, userProfile: object) => void,
 *   logout: () => void
 * }}
 */
export const authStore = {
  /** Sesión activa o null si el usuario es anónimo. */
  get sesion() {
    return _sesion;
  },
  /** true cuando hay sesión activa, false en caso contrario. */
  get isAuthenticated() {
    return _isAuthenticated;
  },
  /** @see login */
  login,
  /** @see logout */
  logout,
};
