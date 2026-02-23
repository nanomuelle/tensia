<!--
  MeasurementList.svelte — Historial de mediciones.
  Gestiona los estados: cargando | error | vacio | lista.
  Elimina el riesgo XSS de inferHTML usando {#each} declarativo (BK-25).

  API pública (compatible con el contrato de la versión Vanilla JS):
    mostrarCargando() / mostrarError() / mostrarVacio() / mostrarLista(m)

  Se monta desde HomeView.js:
    historial = mount(MeasurementList, { target: historialRootEl, props: { onReintentar } });
    historial.mostrarCargando();
-->
<script>
  import { formatearFecha } from '../../shared/formatters.js';

  /**
   * Props.
   * Las props declarativas permiten el uso reactivo desde HomeView.svelte (BK-27).
   * La API imperativa (mostrarX) se mantiene para compatibilidad con HomeView.js
   * hasta su eliminación en BK-28.
   */
  let {
    onReintentar   = undefined,
    // Props declarativas (HomeView.svelte)
    measurements:  measurementsProp = undefined,
    cargando:      cargandoProp     = undefined,
    error:         errorProp        = undefined,
  } = $props();

  // -------------------------------------------------------
  // Estado interno (API imperativa — HomeView.js)
  // -------------------------------------------------------

  /** @type {'cargando'|'error'|'vacio'|'lista'} */
  let _estadoImpl      = $state('cargando');
  let _medicionesImpl  = $state([]);

  // -------------------------------------------------------
  // API reactiva derivada
  // Si se pasan props declarativas, éstas tienen prioridad; en caso contrario
  // se usa el estado imperativo interno para compatibilidad con HomeView.js.
  // -------------------------------------------------------

  const _usarDeclarativo = $derived(
    measurementsProp !== undefined ||
    cargandoProp     !== undefined ||
    errorProp        !== undefined
  );

  /** Estado efectivo del componente. */
  const estado = $derived(
    _usarDeclarativo
      ? (cargandoProp
          ? 'cargando'
          : errorProp
            ? 'error'
            : (measurementsProp?.length ? 'lista' : 'vacio'))
      : _estadoImpl
  );

  /** Mediciones efectivas a renderizar. */
  const mediciones = $derived(
    _usarDeclarativo ? (measurementsProp ?? []) : _medicionesImpl
  );

  // -------------------------------------------------------
  // API pública imperativa (backward compat con HomeView.js — se elimina en BK-28)
  // -------------------------------------------------------

  /** Muestra el indicador de carga. */
  export function mostrarCargando() { _estadoImpl = 'cargando'; }

  /** Muestra el mensaje de error con botón de reintento. */
  export function mostrarError() { _estadoImpl = 'error'; }

  /** Muestra el estado vacío (sin mediciones todavía). */
  export function mostrarVacio() { _estadoImpl = 'vacio'; }

  /**
   * Renderiza la lista de mediciones.
   * @param {Array} m - Array de mediciones a mostrar.
   */
  export function mostrarLista(m) {
    _medicionesImpl = m;
    _estadoImpl     = 'lista';
  }
</script>

<h2 class="historial__titulo">Historial</h2>

{#if estado === 'cargando'}
  <div
    id="estado-cargando"
    class="estado estado--cargando"
    aria-live="polite"
    aria-label="Cargando"
  >
    <span class="spinner" aria-hidden="true"></span>
    <span>Cargando mediciones…</span>
  </div>

{:else if estado === 'error'}
  <div id="estado-error" class="estado estado--error" role="alert">
    <span>⚠️ No se pudieron cargar las mediciones.</span>
    <button id="btn-reintentar" class="btn btn--secundario" onclick={onReintentar}>
      Reintentar
    </button>
  </div>

{:else if estado === 'vacio'}
  <div id="estado-vacio" class="estado estado--vacio">
    <p>Sin mediciones todavía.</p>
    <p>Pulsa "Nueva medición" para registrar la primera.</p>
  </div>

{:else}
  <ul
    id="lista-mediciones"
    class="lista-mediciones"
    role="list"
    aria-label="Historial de mediciones"
  >
    {#each mediciones as m (m.id)}
      <li class="tarjeta" role="listitem">
        <span class="tarjeta__fecha">{formatearFecha.format(new Date(m.measuredAt))}</span>
        <div class="tarjeta__valores">
          <span
            class="tarjeta__tension"
            aria-label="Tensión: {m.systolic} sobre {m.diastolic} milímetros de mercurio"
          >
            {m.systolic} / {m.diastolic}
          </span>
          <span class="tarjeta__unidad" aria-hidden="true">mmHg</span>
          {#if m.pulse}
            <span
              class="tarjeta__pulso"
              aria-label="Pulso: {m.pulse} pulsaciones por minuto"
            >💓 {m.pulse} ppm</span>
          {/if}
        </div>
      </li>
    {/each}
  </ul>
{/if}
