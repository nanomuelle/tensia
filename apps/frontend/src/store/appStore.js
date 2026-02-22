/**
 * Store de estado de la aplicación (pub/sub).
 * Centraliza el estado de las mediciones y notifica a sus suscriptores
 * cuando cambia, eliminando la necesidad de que app.js orqueste directamente
 * las actualizaciones de los componentes.
 *
 * Sin dependencias de DOM: es un módulo puro y directamente testeable.
 *
 * @param {object} measurementService - Servicio de mediciones (inyectado).
 * @returns {{ getState, subscribe, cargarMediciones }}
 */
export function createAppStore(measurementService) {
  // Estado interno — nunca se muta directamente; solo se reasigna
  let state = { mediciones: [], cargando: false, error: null };

  // Mapa de suscriptores: clave 'state' → Set de handlers
  const listeners = new Map();

  // -------------------------------------------------------
  // Lectura del estado
  // -------------------------------------------------------

  /** Devuelve una copia superficial del estado actual. */
  function getState() {
    return { ...state };
  }

  // -------------------------------------------------------
  // Suscripción
  // -------------------------------------------------------

  /**
   * Registra un handler que será invocado cada vez que el estado cambie.
   * @param {Function} handler - Recibe el nuevo estado como argumento.
   * @returns {Function} Función de cleanup: llamarla para desregistrar el handler.
   */
  function subscribe(handler) {
    if (!listeners.has('state')) listeners.set('state', new Set());
    listeners.get('state').add(handler);
    return () => listeners.get('state').delete(handler);
  }

  // -------------------------------------------------------
  // Acciones
  // -------------------------------------------------------

  /**
   * Carga las mediciones del servicio y actualiza el estado.
   * Notifica a los suscriptores al inicio (cargando=true) y al final.
   */
  async function cargarMediciones() {
    state = { ...state, cargando: true, error: null };
    _notify();

    try {
      const mediciones = await measurementService.listAll();
      state = { ...state, mediciones, cargando: false };
    } catch (err) {
      state = { ...state, error: err.message, cargando: false };
    }

    _notify();
  }

  // -------------------------------------------------------
  // Notificación interna
  // -------------------------------------------------------

  function _notify() {
    listeners.get('state')?.forEach((fn) => fn(getState()));
  }

  return { getState, subscribe, cargarMediciones };
}
