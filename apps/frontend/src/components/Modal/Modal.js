/**
 * Componente Modal — genérico y reutilizable.
 *
 * Gestiona el ciclo de vida completo de una ventana modal:
 * - Overlay semitransparente que bloquea el fondo.
 * - Animaciones de apertura y cierre (desktop: fade+slide; mobile: bottom-sheet).
 * - Focus trap: Tab/Shift+Tab ciclan dentro de la modal.
 * - Cierre por ✕, Escape o click en el overlay (respetando estado locked).
 * - Devolución del foco al elemento de origen tras cerrar.
 *
 * Contrato público:
 *   const modal = createModal({ title, onClose, contentFactory, locked? });
 *   modal.open()    → monta en DOM y lanza animación de apertura
 *   modal.close()   → lanza animación de cierre y desmonta del DOM
 *   modal.lock()    → bloquea el cierre (estado "enviando")
 *   modal.unlock()  → desbloquea el cierre
 *
 * @param {object} opciones
 * @param {string}   opciones.title          - Texto del encabezado de la modal.
 * @param {Function} opciones.onClose        - Callback invocado al finalizar el cierre.
 * @param {Function} opciones.contentFactory - Función (contenedorEl) → { unmount }.
 *                                             Monta el contenido y devuelve una función unmount.
 * @param {boolean}  [opciones.locked=false] - Estado inicial de bloqueo.
 * @returns {{ open: Function, close: Function, lock: Function, unlock: Function }}
 */
export function createModal({ title, onClose, contentFactory, locked = false }) {
  let overlayEl    = null;
  let containerEl  = null;
  let btnCerrarEl  = null;
  let _locked      = locked;
  let _estaAbierto = false;
  let openerEl     = null; // elemento que tenía el foco antes de abrir la modal
  let contentUnmount = null;

  // -------------------------------------------------------
  // Focus trap
  // -------------------------------------------------------

  /**
   * Devuelve la lista de elementos focusables activos dentro de la modal.
   * Incluye el botón ✕ aunque esté posicionado en el encabezado.
   * Nota: no se filtra por offsetParent para compatibilidad con entornos de test (jsdom).
   */
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
   * Gestiona Tab y Shift+Tab para mantener el foco dentro de la modal.
   * También intercepta Escape para cerrar si no está bloqueada.
   */
  function _handleKeydown(evento) {
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
        // Shift+Tab: si estamos en el primero, saltar al último
        if (document.activeElement === primero) {
          evento.preventDefault();
          ultimo.focus();
        }
      } else {
        // Tab: si estamos en el último, saltar al primero
        if (document.activeElement === ultimo) {
          evento.preventDefault();
          primero.focus();
        }
      }
    }
  }

  // -------------------------------------------------------
  // Handlers de eventos
  // -------------------------------------------------------

  function _handleOverlayClick(evento) {
    // Cerrar solo si el click fue directamente sobre el overlay (no sobre la modal)
    if (evento.target === overlayEl && !_locked) close();
  }

  function _handleBtnCerrarClick() {
    if (!_locked) close();
  }

  // -------------------------------------------------------
  // Transiciones
  // -------------------------------------------------------

  /** Listener de transitionend al abrir: pone el foco en el primer campo. */
  function _onOpenTransitionEnd(evento) {
    // Esperar la transición de 'transform' u 'opacity' (la que llegue primero)
    if (evento.propertyName !== 'transform' && evento.propertyName !== 'opacity') return;
    const focusables = _getFocusables();
    if (focusables.length) focusables[0].focus();
  }

  /** Listener de transitionend al cerrar: desmonta del DOM y devuelve el foco. */
  function _onCloseTransitionEnd(evento) {
    if (evento.propertyName !== 'transform' && evento.propertyName !== 'opacity') return;

    // Eliminar del DOM
    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
    }

    // Cleanups
    document.removeEventListener('keydown', _handleKeydown);
    if (contentUnmount) {
      contentUnmount();
      contentUnmount = null;
    }
    _estaAbierto = false;

    // Devolver el foco al elemento de origen
    if (openerEl && typeof openerEl.focus === 'function') {
      openerEl.focus();
    }
    openerEl = null;

    if (onClose) onClose();
  }

  // -------------------------------------------------------
  // API pública
  // -------------------------------------------------------

  /** Monta la modal en el DOM y lanza la animación de apertura. */
  function open() {
    if (_estaAbierto) return;
    _estaAbierto = true;

    // Guardar el elemento que tiene el foco actualmente (para restaurarlo al cerrar)
    openerEl = document.activeElement;

    // --- Construir el overlay ---
    overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay';
    overlayEl.setAttribute('aria-hidden', 'true');

    // --- Construir el contenedor de la modal ---
    containerEl = document.createElement('div');
    containerEl.className = 'modal';
    containerEl.setAttribute('role', 'dialog');
    containerEl.setAttribute('aria-modal', 'true');
    containerEl.setAttribute('aria-labelledby', 'modal-titulo');

    containerEl.innerHTML = `
      <div class="modal__handle-wrapper" aria-hidden="true">
        <span class="modal__handle"></span>
      </div>
      <div class="modal__cabecera">
        <h2 class="modal__titulo" id="modal-titulo">${_escaparHTML(title)}</h2>
      </div>
      <div class="modal__contenido"></div>
      <button
        class="modal__btn-cerrar"
        type="button"
        aria-label="Cerrar modal"
      >×</button>
    `;

    btnCerrarEl = containerEl.querySelector('.modal__btn-cerrar');
    const contenidoEl = containerEl.querySelector('.modal__contenido');

    // Insertar en el DOM (fuera del flujo del historial/gráfica para evitar z-index con D3)
    const appEl = document.getElementById('app') || document.body;
    overlayEl.appendChild(containerEl);
    appEl.appendChild(overlayEl);

    // Registrar listeners
    overlayEl.addEventListener('click', _handleOverlayClick);
    document.addEventListener('keydown', _handleKeydown);
    btnCerrarEl.addEventListener('click', _handleBtnCerrarClick);

    // Montar el contenido a través de contentFactory
    if (typeof contentFactory === 'function') {
      const resultado = contentFactory(contenidoEl);
      contentUnmount = resultado?.unmount ?? null;
    }

    // Lanzar animación de apertura en el siguiente frame (doble rAF para garantizar
    // que el navegador haya pintado el estado inicial antes de aplicar la transición)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlayEl.classList.add('modal-overlay--open');
        containerEl.classList.add('modal--open');
        containerEl.addEventListener('transitionend', _onOpenTransitionEnd, { once: true });
      });
    });
  }

  /** Lanza la animación de cierre y desmonta la modal del DOM al finalizar. */
  function close() {
    if (!_estaAbierto || _locked) return;

    // Deshabilitar el botón ✕ durante la transición para evitar doble disparo
    if (btnCerrarEl) btnCerrarEl.style.pointerEvents = 'none';

    overlayEl.classList.remove('modal-overlay--open');
    overlayEl.classList.add('modal-overlay--closing');
    containerEl.classList.remove('modal--open');
    containerEl.classList.add('modal--closing');

    containerEl.addEventListener('transitionend', _onCloseTransitionEnd, { once: true });
  }

  /** Bloquea el cierre (estado "enviando"): deshabilita ✕, Escape y click en overlay. */
  function lock() {
    _locked = true;
    if (btnCerrarEl) {
      btnCerrarEl.disabled = true;
    }
  }

  /** Revierte lock(): vuelve a habilitar el cierre. */
  function unlock() {
    _locked = false;
    if (btnCerrarEl) {
      btnCerrarEl.disabled = false;
    }
  }

  return { open, close, lock, unlock };
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

/** Escapa caracteres HTML especiales para evitar XSS en el título. */
function _escaparHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
