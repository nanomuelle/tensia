/**
 * Store de estado de la aplicación — Svelte stores (writable).
 *
 * Sustituye al pub/sub custom de appStore.js (eliminado en BK-28).
 * Los componentes Svelte suscriben reactivamente con $mediciones, $cargando, $error.
 *
 * Sin dependencias de DOM: módulo puro, directamente testeable.
 *
 * Uso:
 *   import { mediciones, cargando, error, cargarMediciones } from './appStore.svelte.js';
 *   onMount(() => cargarMediciones(service));
 */

import { writable } from 'svelte/store';

// -------------------------------------------------------
// Stores públicos
// -------------------------------------------------------

/** @type {import('svelte/store').Writable<import('../domain/measurement.js').Measurement[]>} */
export const mediciones = writable([]);

/** @type {import('svelte/store').Writable<boolean>} */
export const cargando = writable(false);

/** @type {import('svelte/store').Writable<string|null>} */
export const error = writable(null);

// -------------------------------------------------------
// Acciones
// -------------------------------------------------------

/**
 * Carga todas las mediciones del servicio e impacta los stores.
 * Transicciones de estado:
 *   cargando=true, error=null  →  (éxito) mediciones=[...], cargando=false
 *                              →  (error) error=mensaje,    cargando=false
 *
 * @param {object} service - Instancia de measurementService (inyectada).
 */
export function cargarMediciones(service) {
  cargando.set(true);
  error.set(null);

  return service
    .listAll()
    .then((datos) => mediciones.set(datos))
    .catch((e) => error.set(e.message))
    .finally(() => cargando.set(false));
}
