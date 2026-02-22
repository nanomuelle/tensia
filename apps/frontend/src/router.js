/**
 * Router hash-based mínimo.
 * Escucha el evento 'hashchange' y monta/desmonta vistas según la ruta activa.
 *
 * Las rutas se expresan como pares { '/': viewFactory, '/settings': viewFactory }.
 * Si la ruta solicitada no existe en el mapa, cae al fallback '/'.
 *
 * @param {Record<string, Function>} routes    - Mapa de ruta → fábrica de vista.
 * @param {HTMLElement}              containerEl - Contenedor donde se montan las vistas.
 * @returns {{ start: Function, navigate: Function }}
 */
export function createRouter(routes, containerEl) {
  let vistaActual = null;

  /**
   * Navega a la ruta indicada por el hash.
   * Desmonta la vista actual (si existe) y monta la nueva.
   * @param {string} [hash] - Hash de la URL (p.ej. '#/', '#/settings').
   *                          Por defecto usa window.location.hash o '#/'.
   */
  function navigate(hash = window.location.hash || '#/') {
    const ruta = hash.replace(/^#/, '') || '/';
    const ViewFactory = routes[ruta] ?? routes['/'];
    if (!ViewFactory) return;

    vistaActual?.unmount();
    vistaActual = ViewFactory(containerEl);
    vistaActual.mount();
  }

  /**
   * Registra el listener de hashchange y realiza la navegación inicial.
   * Llamar una sola vez al arranque de la aplicación.
   */
  function start() {
    window.addEventListener('hashchange', () => navigate(window.location.hash));
    navigate();
  }

  return { start, navigate };
}
