<!--
  Modal.svelte — Componente modal genérico y reutilizable (Svelte 5 Runes).

  Gestiona el ciclo de vida completo:
  - Overlay semitransparente que bloquea el fondo.
  - Animaciones de apertura y cierre (desktop: fade+slide; mobile: bottom-sheet).
  - Focus trap: Tab/Shift+Tab ciclan dentro de la modal.
  - Cierre por ✕, Escape o click en el overlay (respetando estado locked).
  - Devolución del foco al elemento de origen tras cerrar.

  Props:
    title    — Texto del encabezado de la modal.
    locked   — Estado inicial de bloqueo (por defecto: false).
    onClose  — Callback invocado al finalizar la animación de cierre.

  API pública (accesible via bind:this):
    open()   — Monta en DOM y lanza la animación de apertura.
    close()  — Lanza la animación de cierre; al terminar desmonta y llama onClose.
    lock()   — Bloquea el cierre (estado "enviando").
    unlock() — Desbloquea el cierre.
-->
<script>
  import { onMount, onDestroy } from 'svelte';

  // --- Props ---
  let { title, locked = false, onClose } = $props();

  // --- Estado interno ---
  let _locked      = $state(locked);
  let _visible     = $state(false);   // controla si el overlay está en el DOM
  let _overlayOpen    = $state(false); // clase modal-overlay--open
  let _overlayClosing = $state(false); // clase modal-overlay--closing
  let _modalOpen      = $state(false); // clase modal--open
  let _modalClosing   = $state(false); // clase modal--closing
  let _estaAbierto = $state(false);

  // Referencias al DOM
  let overlayEl   = $state(null);
  let containerEl = $state(null);
  let btnCerrarEl = $state(null);

  // Elemento que tenía el foco antes de abrir (para restaurarlo al cerrar)
  let openerEl = null;

  // -------------------------------------------------------
  // Focus trap
  // -------------------------------------------------------

  /** Devuelve los elementos focusables activos dentro de la modal. */
  function _getFocusables() {
    if (!containerEl) return [];
    return Array.from(
      containerEl.querySelectorAll(
        'input:not([disabled]), button:not([disabled]), select:not([disabled]),' +
        'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      )
    );
  }

  /**
   * Gestiona Tab/Shift+Tab para mantener el foco dentro de la modal.
   * Intercepta Escape para cerrar si no está bloqueada.
   */
  function _handleKeydown(evento) {
    if (!_estaAbierto) return;

    if (evento.key === 'Escape') {
      if (!_locked) close();
      return;
    }

    if (evento.key === 'Tab') {
      const focusables = _getFocusables();
      if (!focusables.length) {
        evento.preventDefault();
        return;
      }
      const primero = focusables[0];
      const ultimo  = focusables[focusables.length - 1];

      if (evento.shiftKey) {
        // Shift+Tab desde el primero → saltar al último
        if (document.activeElement === primero) {
          evento.preventDefault();
          ultimo.focus();
        }
      } else {
        // Tab desde el último → saltar al primero
        if (document.activeElement === ultimo) {
          evento.preventDefault();
          primero.focus();
        }
      }
    }
  }

  onMount(() => {
    document.addEventListener('keydown', _handleKeydown);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', _handleKeydown);
  });

  // -------------------------------------------------------
  // Transiciones
  // -------------------------------------------------------

  /** Tras la transición de apertura: mueve el foco al primer elemento focusable. */
  function _onOpenTransitionEnd(evento) {
    // Ignorar eventos que burbujean desde elementos hijos; solo reaccionar
    // al transitionend del propio contenedor de la modal.
    if (evento.target !== containerEl) return;
    if (evento.propertyName !== 'transform' && evento.propertyName !== 'opacity') return;
    // Eliminar el listener manualmente (no usamos once:true para que los
    // eventos de hijos no lo consuman antes de que llegue el del contenedor).
    containerEl.removeEventListener('transitionend', _onOpenTransitionEnd);
    const focusables = _getFocusables();
    if (focusables.length) focusables[0].focus();
  }

  /** Tras la transición de cierre: limpia el estado, devuelve el foco y llama onClose. */
  function _onCloseTransitionEnd(evento) {
    // Ignorar eventos que burbujean desde elementos hijos (inputs, botones…).
    if (evento.target !== containerEl) return;
    if (evento.propertyName !== 'transform' && evento.propertyName !== 'opacity') return;
    // Guardar referencia antes de que Svelte desmonte el elemento tras _visible=false.
    const el = containerEl;
    el.removeEventListener('transitionend', _onCloseTransitionEnd);

    _visible        = false;
    _overlayClosing = false;
    _modalClosing   = false;
    _estaAbierto    = false;

    // Restaurar el foco al elemento de origen
    if (openerEl && typeof openerEl.focus === 'function') {
      openerEl.focus();
    }
    openerEl = null;

    if (onClose) onClose();
  }

  // -------------------------------------------------------
  // API pública
  // -------------------------------------------------------

  /** Muestra la modal y lanza la animación de apertura. */
  export function open() {
    if (_estaAbierto) return;
    _estaAbierto    = true;
    openerEl        = document.activeElement;
    _visible        = true;
    _overlayOpen    = false;
    _overlayClosing = false;
    _modalOpen      = false;
    _modalClosing   = false;

    // Doble rAF: garantiza que el navegador pinte el estado inicial antes de la transición
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        _overlayOpen = true;
        _modalOpen   = true;
        if (containerEl) {
          // Sin once:true: eliminamos el listener manualmente dentro del handler
          // para que eventos de hijos (que burbujean) no lo consuman.
          containerEl.addEventListener('transitionend', _onOpenTransitionEnd);
        }
      });
    });
  }

  /** Lanza la animación de cierre y desmonta al finalizar. */
  export function close() {
    if (!_estaAbierto || _locked) return;

    // Deshabilitar el botón ✕ durante la transición para evitar doble disparo
    if (btnCerrarEl) btnCerrarEl.style.pointerEvents = 'none';

    _overlayOpen    = false;
    _overlayClosing = true;
    _modalOpen      = false;
    _modalClosing   = true;

    if (containerEl) {
      // Sin once:true: eliminamos el listener manualmente dentro del handler
      // para que eventos de hijos (que burbujean) no lo consuman.
      containerEl.addEventListener('transitionend', _onCloseTransitionEnd);
    }
  }

  /** Bloquea el cierre (estado "enviando"): deshabilita ✕, Escape y click en overlay. */
  export function lock() {
    _locked = true;
  }

  /** Revierte lock(): vuelve a habilitar el cierre. */
  export function unlock() {
    _locked = false;
  }

  // -------------------------------------------------------
  // Handlers de eventos
  // -------------------------------------------------------

  function handleOverlayClick(evento) {
    // Cerrar solo si el click fue directamente sobre el overlay (no sobre la modal)
    if (evento.target === overlayEl && !_locked) close();
  }

  function handleBtnCerrarClick() {
    if (!_locked) close();
  }
</script>

<!-- ========================================================
     Marcado de la modal
     Solo se renderiza mientras _visible sea true.
     ======================================================== -->
{#if _visible}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    bind:this={overlayEl}
    class="modal-overlay"
    class:modal-overlay--open={_overlayOpen}
    class:modal-overlay--closing={_overlayClosing}
    aria-hidden="true"
    onclick={handleOverlayClick}
  >
    <div
      bind:this={containerEl}
      class="modal"
      class:modal--open={_modalOpen}
      class:modal--closing={_modalClosing}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >
      <!-- Handle visual (bottom-sheet, solo móvil) -->
      <div class="modal__handle-wrapper" aria-hidden="true">
        <span class="modal__handle"></span>
      </div>

      <!-- Cabecera -->
      <div class="modal__cabecera">
        <h2 class="modal__titulo" id="modal-titulo">{title}</h2>
      </div>

      <!-- Contenido inyectado mediante slot -->
      <div class="modal__contenido">
        <slot />
      </div>

      <!-- Botón de cierre ✕ (al final del DOM → último en el orden de tabulación) -->
      <button
        bind:this={btnCerrarEl}
        class="modal__btn-cerrar"
        type="button"
        aria-label="Cerrar modal"
        disabled={_locked}
        onclick={handleBtnCerrarClick}
      >×</button>
    </div>
  </div>
{/if}

<style>
  /* =========================================================
     Modal — Componente genérico
     Animaciones: fade+slide en desktop/tablet; bottom-sheet en móvil.
     ========================================================= */

  /* -------------------------------------------------------
     Overlay
     ------------------------------------------------------- */

  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0);
    transition: background-color 180ms ease-out;
    /* Bloquear interacción con el fondo mientras no esté abierta */
    pointer-events: none;
  }

  .modal-overlay--open {
    background-color: rgba(0, 0, 0, 0.45);
    pointer-events: auto;
    transition: background-color 180ms ease-out;
  }

  .modal-overlay--closing {
    background-color: rgba(0, 0, 0, 0);
    pointer-events: none;
    transition: background-color 200ms ease-in;
  }

  /* -------------------------------------------------------
     Contenedor de la modal — Desktop / Tablet (≥ 640 px)
     ------------------------------------------------------- */

  .modal {
    position: relative;
    z-index: 201;
    width: 100%;
    max-width: 480px;
    min-width: 320px;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    padding: 24px;
    outline: none;

    /* Estado inicial (antes de abrir): desplazado + transparente */
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 180ms ease-out, transform 180ms ease-out;
  }

  .modal--open {
    opacity: 1;
    transform: translateY(0);
  }

  .modal--closing {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 200ms ease-in, transform 200ms ease-in;
  }

  /* -------------------------------------------------------
     Contenedor de la modal — Móvil Bottom Sheet (< 640 px)
     ------------------------------------------------------- */

  @media (max-width: 639px) {
    .modal-overlay {
      align-items: flex-end;
      justify-content: stretch;
    }

    .modal {
      width: 100%;
      max-width: 100%;
      min-width: unset;
      border-radius: 16px 16px 0 0;
      box-shadow: none;
      padding: 16px 16px 20px;

      /* Estado inicial bottom-sheet: fuera de pantalla por abajo */
      opacity: 1;
      transform: translateY(100%);
      transition: transform 260ms cubic-bezier(0.32, 0.72, 0, 1),
                  opacity 180ms ease-out 20ms;
    }

    .modal--open {
      opacity: 1;
      transform: translateY(0);
    }

    .modal--closing {
      opacity: 0;
      transform: translateY(100%);
      transition: transform 240ms ease-in,
                  opacity 200ms ease-in 40ms;
    }

    /* Mostrar handle en móvil */
    .modal__handle-wrapper {
      display: flex !important;
    }
  }

  /* -------------------------------------------------------
     Handle visual (bottom-sheet, solo móvil)
     ------------------------------------------------------- */

  .modal__handle-wrapper {
    display: none; /* oculto en desktop */
    justify-content: center;
    margin-bottom: 8px;
  }

  .modal__handle {
    display: block;
    width: 40px;
    height: 4px;
    background-color: #d1d5db;
    border-radius: 2px;
    margin-top: 8px;
  }

  /* -------------------------------------------------------
     Cabecera
     ------------------------------------------------------- */

  .modal__cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    /* Espacio extra a la derecha para que el título no solape el botón ✕ */
    padding-right: 36px;
  }

  .modal__titulo {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1c1c1e;
    line-height: 1.3;
  }

  /* -------------------------------------------------------
     Botón de cierre ✕
     Posicionado en la esquina superior derecha del contenedor.
     Está al final del DOM para ser el último en el orden de tabulación.
     ------------------------------------------------------- */

  .modal__btn-cerrar {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.375rem;
    color: #6b7280;
    padding: 0;
    line-height: 1;
    transition: color 0.12s ease, background-color 0.12s ease;
    /* Garantizar que esté por encima del contenido de la modal */
    z-index: 1;
  }

  .modal__btn-cerrar:hover:not(:disabled) {
    color: #111827;
    background-color: rgba(0, 0, 0, 0.05);
  }

  .modal__btn-cerrar:focus-visible {
    outline: 2px solid #1a73e8;
    outline-offset: 2px;
  }

  .modal__btn-cerrar:disabled {
    color: #d1d5db;
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* -------------------------------------------------------
     Área de contenido
     ------------------------------------------------------- */

  .modal__contenido {
    /* El contenido (MeasurementForm) gestiona su propio espaciado interno */
  }

  /* El formulario embebido en la modal no necesita título propio */
  .modal__contenido :global(.formulario__titulo) {
    display: none;
  }

  /* En móvil, el formulario puede ser scrollable si el contenido supera la pantalla */
  @media (max-width: 639px) {
    .modal__contenido {
      max-height: calc(100dvh - 140px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }
</style>
