/**
 * Store de sesión de autenticación — implementación mínima (BK-40).
 *
 * Expone el estado reactivo de la sesión de Google y las acciones login/logout.
 * BK-29 (E-01) completará este store añadiendo:
 *   - Persistencia del token en sessionStorage y renovación silenciosa.
 *   - Rehydratación automática al arrancar la app.
 *   - Integración con el componente de cabecera (avatar y nombre).
 *
 * Uso:
 *   import { sesion, login, logout } from './authStore.svelte.js';
 *   $sesion   → null (anónimo) | { tokenData, userProfile }
 *
 * @module store/authStore.svelte
 */

import { writable } from 'svelte/store';

// -------------------------------------------------------
// Stores públicos
// -------------------------------------------------------

/**
 * Estado de la sesión activa.
 * null   → usuario anónimo (sin autenticar)
 * objeto → { tokenData: object, userProfile: object }
 *
 * @type {import('svelte/store').Writable<{ tokenData: object, userProfile: object } | null>}
 */
export const sesion = writable(null);

// -------------------------------------------------------
// Acciones
// -------------------------------------------------------

/**
 * Establece la sesión activa tras un intercambio de tokens exitoso.
 * Llamado por authService.handleCallback() (BK-40).
 *
 * @param {object} tokenData    - Respuesta del endpoint de tokens de Google (access_token, id_token, etc.).
 * @param {object} userProfile  - Perfil del usuario desde /userinfo (sub, name, picture, email).
 */
export function login(tokenData, userProfile) {
  sesion.set({ tokenData, userProfile });
}

/**
 * Cierra la sesión y vuelve al estado anónimo.
 * Llamado por authService.logout() (BK-40).
 */
export function logout() {
  sesion.set(null);
}
