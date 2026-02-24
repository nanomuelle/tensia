/**
 * main.js — Punto de entrada de la aplicación Tensia (BK-27, BK-36).
 * Instancia el servicio de mediciones y el de autenticación con los adaptadores
 * inyectados, y monta el componente raíz App.svelte en document.body.
 *
 * No contiene lógica de negocio ni manipulación directa del DOM.
 */
import { mount } from 'svelte';
import * as adapter from './infra/localStorageAdapter.js';
import { createMeasurementService } from './services/measurementService.js';
import { createAuthService } from './services/authService.js';
import { authStore } from './store/authStore.svelte.js';
import App from './App.svelte';

// Servicio de mediciones con adaptador inyectado (usuario anónimo → localStorage)
const service = createMeasurementService(adapter);

/**
 * Servicio de autenticación con Google PKCE (BK-36).
 * Requiere un cliente OAuth de tipo "Aplicación de escritorio" en Google Cloud Console,
 * que permite PKCE sin client_secret (cliente público, RFC 7636).
 * Los clientes tipo "Aplicación web" exigen client_secret y no son compatibles con SPAs.
 *
 * El redirect_uri debe coincidir exactamente con el registrado en Google Cloud Console.
 * En local : http://localhost:5173/
 * En GitHub Pages : https://nanomuelle.github.io/tensia/
 * Se configura mediante la variable de entorno VITE_REDIRECT_URI.
 * Fallback: origen + pathname actuales (útil en entornos no configurados).
 */
const authService = createAuthService({
  authStore,
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  // El client_secret de un cliente Desktop es público (no confidencial).
  // Google lo exige en el intercambio de tokens incluso para clientes de escritorio.
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET ?? '',
  redirectUri:
    import.meta.env.VITE_REDIRECT_URI ||
    (window.location.origin + window.location.pathname),
});

// Montar el componente raíz; a partir de aquí todo es Svelte
mount(App, { target: document.body, props: { service, authService } });
