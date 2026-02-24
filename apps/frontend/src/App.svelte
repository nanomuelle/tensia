<!--
  App.svelte — Componente raíz de Tensia (BK-27, BK-36).
  Reemplaza app.js como punto de entrada de la UI.

  Responsabilidades:
  - Montar Toast e IosWarning como subcomponentes Svelte declarativos.
  - Gestionar el callback de Google OAuth 2.0 PKCE (BK-36) antes de arrancar el router.
  - Instanciar el router y arrancar la navegación en onMount.
  - Exponer la instancia de Toast a las vistas hijas mediante bind:this.

  Props:
    service     — instancia de measurementService creada en main.js (inyección de dependencias).
    authService — instancia de authService creada en main.js (BK-36).

  Estrategia de callback OAuth (BK-36):
  ─────────────────────────────────────
  Google redirige al redirect_uri con ?code=...&state=... como query string (no como hash).
  Como la app es una SPA en GitHub Pages sin servidor, el redirect_uri es la propia URL
  base de la app (p. ej. https://nanomuelle.github.io/tensia/).
  En onMount, ANTES de arrancar el router, se detecta ?code= en window.location.search.
  Si está presente, se delega en authService.handleCallback(searchParams):
    - Éxito    → history.replaceState elimina los query params; se navega a #/.
    - Error    → se muestra un toast descriptivo; se limpia la URL y se navega a #/
                 (la app queda en estado anónimo completamente funcional).
  Tras el procesamiento del callback (o si no hay callback), se arranca el router
  mediante createRouter().start().
-->
<script>
  import { onMount } from 'svelte';
  import Toast      from './components/Toast/Toast.svelte';
  import IosWarning from './components/IosWarning/IosWarning.svelte';
  import HomeView   from './views/HomeView.svelte';
  import { createRouter } from './router.js';

  // --- Props ---
  /** Instancia de measurementService inyectada desde main.js. */
  /** Instancia de authService inyectada desde main.js (BK-36). */
  let { service, authService } = $props();

  // --- Referencias a componentes ---
  /** Referencia a la instancia de Toast para pasarla a las vistas. */
  let toast;

  // --- Helpers de mensaje de error ---

  /**
   * Traduce el código de error del callback OAuth a un mensaje en español
   * apto para mostrar en el Toast.
   *
   * @param {Error} err
   * @returns {{ mensaje: string, tipo: 'error'|'info' }}
   */
  function _mensajeDeError(err) {
    const msg = err?.message ?? '';

    if (msg.startsWith('google_auth_error:access_denied')) {
      return { mensaje: 'Has cancelado el inicio de sesión.', tipo: 'info' };
    }
    if (msg.startsWith('google_auth_error:')) {
      return { mensaje: 'Google denegó el acceso. Inténtalo de nuevo.', tipo: 'error' };
    }
    if (msg === 'state_invalido') {
      return {
        mensaje: 'Error de seguridad: el flujo de autenticación caducó. Inténtalo de nuevo.',
        tipo: 'error',
      };
    }
    if (msg.startsWith('intercambio_fallido')) {
      return {
        mensaje: 'No se pudo completar el inicio de sesión. Inténtalo de nuevo.',
        tipo: 'error',
      };
    }
    if (msg.startsWith('userinfo_fallido')) {
      return {
        mensaje: 'No se pudo obtener tu perfil de Google. Inténtalo más tarde.',
        tipo: 'error',
      };
    }
    return { mensaje: 'Error al iniciar sesión. Inténtalo de nuevo.', tipo: 'error' };
  }

  // --- Ciclo de vida ---
  onMount(async () => {
    // ── Gestión del callback OAuth (BK-36) ──────────────────────────────────
    // Detectar ?code= en la URL ANTES de arrancar el router para procesar
    // el retorno de Google sin interferir con la navegación hash-based.
    const searchParams = new URLSearchParams(window.location.search);
    const tieneCallback = searchParams.has('code') || searchParams.has('error');

    if (tieneCallback) {
      try {
        await authService.handleCallback(searchParams);
        // Éxito: limpiar query params manteniendo el hash actual
        history.replaceState(null, '', window.location.pathname);
        // Navegar a la pantalla principal
        window.location.hash = '#/';
      } catch (err) {
        // Error en el callback: informar al usuario y mantener estado anónimo funcional
        const { mensaje, tipo } = _mensajeDeError(err);
        // Limpiar URL antes de mostrar - la ruta no necesita los parámetros OAuth
        history.replaceState(null, '', window.location.pathname);
        window.location.hash = '#/';
        // Toast disponible: se monta con el template antes de que onMount ejecute
        toast?.show(mensaje, tipo, 5000);
      }
    }

    // ── Arrancar el router ────────────────────────────────────────────────
    const routes = {
      '/': { component: HomeView, props: () => ({ service, toast }) },
    };
    createRouter(routes, document.querySelector('main')).start();
  });
</script>

<!-- Notificaciones efímeras (accesibles desde vistas vía prop toast) -->
<Toast bind:this={toast} />

<!-- Aviso informativo Safari/iOS sobre la política ITP de 7 días -->
<IosWarning />

<!-- Contenedor donde el router monta las vistas -->
<main id="app"></main>
