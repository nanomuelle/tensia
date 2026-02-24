<!--
  UserSession.svelte — Zona de sesión en la cabecera (BK-37).

  Estado anónimo : botón "Iniciar sesión con Google".
  Estado autenticado : avatar (foto o inicial del nombre) + menú desplegable
                       con el nombre del usuario y "Cerrar sesión".

  Props:
    authService — instancia de authService inyectada desde App.svelte.

  El componente no contiene lógica PKCE: delega en authService.requestCode()
  para iniciar el flujo y en authService.logout() para cerrar sesión.
  Se suscribe a authStore reactivamente mediante $derived.
-->
<script>
  import { authStore } from '../../store/authStore.svelte.js';

  // ── Props ─────────────────────────────────────────────────────────────────
  /** Instancia de authService inyectada desde App.svelte. */
  let { authService } = $props();

  // ── Estado del menú desplegable ───────────────────────────────────────────
  let menuAbierto = $state(false);

  // ── Derivados del store de sesión ─────────────────────────────────────────
  let isAuthenticated = $derived(authStore.isAuthenticated);
  let sesion          = $derived(authStore.sesion);
  let nombre          = $derived(sesion?.userProfile?.name ?? '');
  let foto            = $derived(sesion?.userProfile?.picture ?? '');
  /** Inicial del nombre para el avatar de texto (cuando no hay foto). */
  let inicial         = $derived(nombre ? nombre.charAt(0).toUpperCase() : '?');

  // ── Acciones ──────────────────────────────────────────────────────────────

  /** Alterna la visibilidad del menú de usuario. */
  function toggleMenu() {
    menuAbierto = !menuAbierto;
  }

  /**
   * Cierra la sesión, oculta el menú y navega a la pantalla principal.
   * Delega en authService.logout() (que llama a authStore.logout()).
   */
  function cerrarSesion() {
    menuAbierto = false;
    authService.logout();
    window.location.hash = '#/';
  }

  /**
   * Cierra el menú al pulsar fuera del componente (Escape o clic exterior).
   * @param {KeyboardEvent} e
   */
  function alTecla(e) {
    if (e.key === 'Escape' && menuAbierto) menuAbierto = false;
  }
</script>

<svelte:window onkeydown={alTecla} />

{#if isAuthenticated}
  <!-- ── Estado autenticado ── -->
  <div class="user-session">
    <!-- Botón avatar que abre el menú desplegable -->
    <button
      class="user-session__avatar-btn"
      aria-label="Menú de usuario — {nombre}"
      aria-expanded={menuAbierto}
      aria-haspopup="true"
      onclick={toggleMenu}
    >
      {#if foto}
        <img
          class="user-session__avatar-img"
          src={foto}
          alt="Foto de perfil de {nombre}"
          width="32"
          height="32"
        />
      {:else}
        <span class="user-session__inicial" aria-hidden="true">{inicial}</span>
      {/if}
    </button>

    {#if menuAbierto}
      <!-- Menú desplegable con nombre y opción de cerrar sesión -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="user-session__menu"
        role="menu"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
      >
        <span class="user-session__nombre" role="menuitem" tabindex="-1">{nombre}</span>
        <hr class="user-session__separador" />
        <button
          class="user-session__logout-btn"
          role="menuitem"
          onclick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </div>
    {/if}
  </div>
{:else}
  <!-- ── Estado anónimo ── -->
  <button
    class="user-session__login-btn"
    aria-label="Iniciar sesión con Google"
    onclick={() => authService.requestCode()}
  >
    <svg
      class="user-session__google-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      aria-hidden="true"
      width="18"
      height="18"
    >
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
    Iniciar sesión
  </button>
{/if}
