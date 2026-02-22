/**
 * Componente Toast — notificaciones efímeras.
 * Muestra un mensaje que desaparece automáticamente tras un tiempo configurable.
 * Variantes: 'success', 'error', 'info'.
 *
 * mount() crea su propio nodo contenedor y lo anexa a <body> cuando no se
 * proporciona rootEl (Paso 14b). Si se pasa rootEl, lo usa como contenedor
 * (compatible con tests que crean el nodo externamente).
 *
 * @param {HTMLElement} [rootEl] - Contenedor externo opcional. Si se omite,
 *                                 mount() crea y añade #toast-container a <body>.
 * @returns {{ mount: Function, unmount: Function, show: Function }}
 */
export function createToast(rootEl) {
  let containerEl = rootEl ?? null;  // se rellena en mount() si no se proporcionó
  let toastEl     = null;
  let timerId     = null;
  let ownContainer = false;          // indica si el componente creó su propio contenedor

  function mount() {
    // Si no se proporcionó contenedor externo, crear el propio y añadirlo a <body>
    if (!containerEl) {
      containerEl = document.createElement('div');
      containerEl.id = 'toast-container';
      containerEl.setAttribute('aria-live', 'polite');
      containerEl.setAttribute('aria-atomic', 'true');
      document.body.appendChild(containerEl);
      ownContainer = true;
    }

    // Crear el nodo del toast y ocultarlo inicialmente
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.hidden = true;
    containerEl.appendChild(toastEl);
  }

  function unmount() {
    if (timerId) clearTimeout(timerId);
    if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    toastEl = null;
    // Si el componente creó su propio contenedor, eliminarlo también
    if (ownContainer && containerEl && containerEl.parentNode) {
      containerEl.parentNode.removeChild(containerEl);
      containerEl = null;
      ownContainer = false;
    }
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
