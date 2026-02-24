/**
 * Catálogo de eventos de dominio de la aplicación.
 * Fuente única de verdad para los nombres de CustomEvent.
 * Evita errores de tipado y facilita refactorizaciones.
 */
export const Events = {
  MEASUREMENT_SAVED: 'measurement:saved',
  /** Emitido por authService tras un login exitoso (BK-40). */
  AUTH_LOGIN:  'auth:login',
  /** Emitido por authService.logout() (BK-40). */
  AUTH_LOGOUT: 'auth:logout',
};

/**
 * Emite un evento de dominio en window.
 * @param {string} eventName - Uno de los valores de Events.
 * @param {*} [detail]       - Dato adjunto al evento.
 */
export function emit(eventName, detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

/**
 * Escucha un evento de dominio.
 * Devuelve una función para eliminar el listener (cleanup).
 * @param {string}   eventName
 * @param {Function} handler
 * @returns {Function} Función de limpieza: llamarla para desregistrar el listener.
 */
export function on(eventName, handler) {
  window.addEventListener(eventName, handler);
  return () => window.removeEventListener(eventName, handler);
}
