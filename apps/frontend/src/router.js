import { mount, unmount } from 'svelte';

/**
 * Router hash-based mínimo.
 * Escucha el evento 'hashchange' y monta/desmonta componentes Svelte según la ruta activa.
 *
 * Las rutas se expresan como pares:
 *   { '/': { component: HomeView, props: () => ({ service, toast }) } }
 *
 * Si la ruta solicitada no existe en el mapa, cae al fallback '/'.
 * Preparado para rutas protegidas post-BK-29: cada entrada puede incluir
 * un guard opcional `guard: () => boolean`.
 *
 * @param {Record<string, { component: object, props?: object|Function, guard?: Function }>} routes
 *   Mapa de ruta → descriptor de vista Svelte.
 * @param {HTMLElement} containerEl - Contenedor donde se montan los componentes.
 * @returns {{ start: Function, navigate: Function }}
 */
export function createRouter(routes, containerEl) {
  let vistaActual = null;

  /**
   * Navega a la ruta indicada por el hash.
   * Desmonta el componente actual (si existe) y monta el nuevo.
   * @param {string} [hash] - Hash de la URL (p.ej. '#/', '#/settings').
   *                          Por defecto usa window.location.hash o '#/'.
   */
  function navigate(hash = window.location.hash || '#/') {
    const ruta = hash.replace(/^#/, '') || '/';
    const entry = routes[ruta] ?? routes['/'];
    if (!entry) return;

    // Guard opcional: si devuelve false no se navega
    if (typeof entry.guard === 'function' && !entry.guard()) return;

    if (vistaActual !== null) {
      unmount(vistaActual);
      vistaActual = null;
    }

    const props = typeof entry.props === 'function' ? entry.props() : (entry.props ?? {});
    vistaActual = mount(entry.component, { target: containerEl, props });
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
