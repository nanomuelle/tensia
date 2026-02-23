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

  /** Callback opcional al pulsar "Reintentar" en el estado de error. */
  let { onReintentar = undefined } = $props();

  /**
   * Estado actual del historial.
   * @type {'cargando'|'error'|'vacio'|'lista'}
   */
  let estado = $state('cargando');

  /** Array de mediciones a rendering cuando estado === 'lista'. */
  let mediciones = $state([]);

  // -------------------------------------------------------
  // API pública — mantiene el mismo contrato que la versión Vanilla JS
  // -------------------------------------------------------

  /** Muestra el indicador de carga. */
  export function mostrarCargando() { estado = 'cargando'; }

  /** Muestra el mensaje de error con botón de reintento. */
  export function mostrarError() { estado = 'error'; }

  /** Muestra el estado vacío (sin mediciones todavía). */
  export function mostrarVacio() { estado = 'vacio'; }

  /**
   * Renderiza la lista de mediciones.
   * @param {Array} m - Array de mediciones a mostrar.
   */
  export function mostrarLista(m) {
    mediciones = m;
    estado = 'lista';
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
