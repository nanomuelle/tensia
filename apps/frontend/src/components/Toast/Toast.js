/**
 * Componente Toast — notificaciones efímeras.
 * Muestra un mensaje que desaparece automáticamente tras un tiempo configurable.
 * Variantes: 'success', 'error', 'info'.
 *
 * @param {HTMLElement} rootEl - El contenedor #toast-container que vive en index.html.
 * @returns {{ mount: Function, unmount: Function, show: Function }}
 */
export function createToast(rootEl) {
  // Nodo interno del toast actual (se reutiliza entre llamadas)
  let toastEl = null;
  let timerId = null;

  function mount() {
    if (!rootEl) return;
    // Crear el nodo del toast y ocultarlo inicialmente
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.hidden = true;
    rootEl.appendChild(toastEl);
  }

  function unmount() {
    if (timerId) clearTimeout(timerId);
    if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    toastEl = null;
  }

  /**
   * Muestra el toast con el mensaje indicado.
   * @param {string} mensaje           - Texto a mostrar.
   * @param {'success'|'error'|'info'} [tipo='success'] - Variante visual.
   * @param {number} [duracionMs=3000] - Tiempo antes de ocultarse automáticamente.
   */
  function show(mensaje, tipo = 'success', duracionMs = 3000) {
    if (!toastEl) return;

    // Cancelar ocultación previa si hubiera
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }

    // Actualizar contenido y variante
    toastEl.textContent = mensaje;
    toastEl.className = `toast toast--${tipo}`;
    toastEl.hidden = false;

    // Auto-ocultar tras duracionMs
    timerId = setTimeout(() => {
      if (toastEl) toastEl.hidden = true;
      timerId = null;
    }, duracionMs);
  }

  return { mount, unmount, show };
}
