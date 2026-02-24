/**
 * Servicio de autenticación con Google — flujo Authorization Code + PKCE.
 *
 * Implementa el flujo OAuth 2.0 complet amenté en el cliente (ADR-008, BK-40).
 * No requiere client_secret ni proxy backend: la protección CSRF recae en el
 * parámetro `state` aleatorio y la verificación del `code_verifier` (RFC 7636).
 *
 * La biblioteca Google Identity Services (GIS) se carga desde CDN en index.html
 * y proporciona el botón de Sign-In; el intercambio de código se realiza directamente
 * contra los endpoints de token de Google.
 *
 * Uso:
 *   const authSvc = createAuthService({ authStore, clientId, redirectUri });
 *   await authSvc.requestCode();                  // redirige a Google
 *   await authSvc.handleCallback(searchParams);   // en la página de retorno
 *   authSvc.logout();
 *
 * @module services/authService
 */

// -------------------------------------------------------
// Constantes de endpoints de Google OAuth 2.0
// -------------------------------------------------------

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

/**
 * Clave para el state CSRF en localStorage.
 * Se usa localStorage (no sessionStorage) para que el valor sobreviva cuando
 * el flujo OAuth abre un contexto de navegación distinto al volver de Google
 * (p.ej. PWA instalada que abre Chrome Custom Tab).
 */
const SK_STATE = 'auth_state';
/**
 * Clave para el code_verifier PKCE en localStorage.
 * Mismo motivo que SK_STATE: debe sobrevivir al cambio de contexto.
 */
const SK_VERIFIER = 'auth_code_verifier';

// -------------------------------------------------------
// Helpers PKCE (RFC 7636)
// -------------------------------------------------------

/**
 * Codifica un ArrayBuffer en base64url (sin relleno '=').
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function base64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Genera un code_verifier aleatorio de 32 bytes (base64url → 43 chars).
 * @returns {string}
 */
export function generarCodeVerifier() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes.buffer);
}

/**
 * Genera el code_challenge = BASE64URL(SHA-256(verifier)).
 * @param {string} verifier
 * @returns {Promise<string>}
 */
export async function generarCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64url(hash);
}

/**
 * Genera un state aleatorio de 16 bytes en hex para protección CSRF.
 * @returns {string}
 */
export function generarState() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// -------------------------------------------------------
// Factory del servicio
// -------------------------------------------------------

/**
 * Crea una instancia del servicio de autenticación.
 *
 * @param {object} opciones
 * @param {object} opciones.authStore    - Store de sesión (BK-29); debe exponer login(tokenData, userProfile) y logout().
 * @param {string} opciones.clientId     - Client ID de Google (VITE_GOOGLE_CLIENT_ID).
 * @param {string} opciones.clientSecret - Client Secret del cliente de escritorio (VITE_GOOGLE_CLIENT_SECRET).
 *                                         En clientes de escritorio (Desktop app) Google sigue requiriendo el secret
 *                                         en el intercambio de tokens; al ser un cliente público, incluirlo en
 *                                         el código de la SPA es aceptable (no es confidencial).
 * @param {string} opciones.redirectUri  - URI de retorno OAuth registrada en Google Console.
 * @returns {{ requestCode: Function, handleCallback: Function, logout: Function }}
 */
export function createAuthService({ authStore, clientId, clientSecret = '', redirectUri }) {
  /**
   * Inicia el flujo de autorización de Google con PKCE.
   * Genera state y code_verifier, los guarda en localStorage, y redirige a Google.
   * Se usa localStorage (no sessionStorage) para que los valores persistan si el
   * redirect de Google se abre en un contexto de navegación diferente (PWA, Custom Tab).
   *
   * @returns {Promise<void>}
   */
  async function requestCode() {
    const state = generarState();
    const codeVerifier = generarCodeVerifier();
    const codeChallenge = await generarCodeChallenge(codeVerifier);

    localStorage.setItem(SK_STATE, state);
    localStorage.setItem(SK_VERIFIER, codeVerifier);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    window.location.href = `${GOOGLE_AUTH_URL}?${params}`;
  }

  /**
   * Procesa el callback de Google tras la redirección.
   * Verifica el state (CSRF), intercambia el código por tokens y obtiene el perfil.
   * Delega el estado autenticado en authStore.login().
   *
   * @param {URLSearchParams} searchParams - Parámetros de la URL de retorno.
   * @returns {Promise<{ tokenData: object, userProfile: object }>}
   * @throws {Error} Si el state no coincide, el code está ausente, o el intercambio falla.
   */
  async function handleCallback(searchParams) {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      throw new Error(`google_auth_error:${errorParam}`);
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      throw new Error('codigo_ausente');
    }

    // Verificación CSRF
    const storedState = localStorage.getItem(SK_STATE);
    if (!storedState || state !== storedState) {
      localStorage.removeItem(SK_STATE);
      localStorage.removeItem(SK_VERIFIER);
      throw new Error('state_invalido');
    }

    const codeVerifier = localStorage.getItem(SK_VERIFIER);
    localStorage.removeItem(SK_STATE);
    localStorage.removeItem(SK_VERIFIER);

    // Intercambio de código por tokens directamente con Google.
    // Google requiere client_secret incluso en clientes de escritorio (Desktop app);
    // en ese tipo de cliente no es confidencial y es seguro incluirlo en la SPA.
    const tokenParams = {
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    };
    if (clientSecret) tokenParams.client_secret = clientSecret;

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenParams).toString(),
    });

    if (!tokenResponse.ok) {
      const detalle = await tokenResponse.text().catch(() => '');
      throw new Error(`intercambio_fallido:${tokenResponse.status}:${detalle}`);
    }

    const tokenData = await tokenResponse.json();

    // Obtención del perfil de usuario
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error(`userinfo_fallido:${userInfoResponse.status}`);
    }

    const userProfile = await userInfoResponse.json();

    // Delegar en el store de sesión (BK-29)
    authStore.login(tokenData, userProfile);

    return { tokenData, userProfile };
  }

  /**
   * Cierra la sesión delegando en authStore.logout().
   */
  function logout() {
    authStore.logout();
  }

  return { requestCode, handleCallback, logout };
}
