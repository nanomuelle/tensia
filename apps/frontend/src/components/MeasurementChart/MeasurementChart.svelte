<!--
  MeasurementChart.svelte — Wrapper D3 del gráfico de evolución.
  Gestiona ResizeObserver y el ciclo de vida del gráfico.

  API pública (compatible con el contrato de la versión Vanilla JS):
    update(mediciones) — renderiza o actualiza la gráfica.

  La visibilidad de la sección contenedora (#seccion-grafica) la gestiona
  HomeView.js directamente. Este componente solo renderiza el contenido interior.

  Se monta desde HomeView.js:
    grafica = mount(MeasurementChart, { target: seccionGraficaEl });
    grafica.update(mediciones);
-->
<script>
  import { onDestroy } from 'svelte';
  import { renderChart } from '../../chart.js';
  import { MIN_MEDICIONES_GRAFICA } from '../../shared/constants.js';

  /** Referencia al div contenedor de D3 (bind:this). */
  let containerEl;

  /** Último array de mediciones (para que ResizeObserver pueda redibujar). */
  let ultimasMediciones = [];

  /** Instancia del ResizeObserver activa. */
  let resizeObserver = null;

  /**
   * Actualiza la gráfica con las nuevas mediciones.
   * Con menos del mínimo, renderChart dibuja el skeleton.
   * @param {Array} nuevasMediciones
   */
  export function update(nuevasMediciones) {
    ultimasMediciones = nuevasMediciones;

    // containerEl puede ser null si el DOM aún no se ha montado
    if (!containerEl) return;

    // Inicializar ResizeObserver solo cuando hay datos suficientes
    if (
      !resizeObserver &&
      nuevasMediciones.length >= MIN_MEDICIONES_GRAFICA &&
      typeof ResizeObserver !== 'undefined'
    ) {
      resizeObserver = new ResizeObserver(() => {
        if (ultimasMediciones.length >= MIN_MEDICIONES_GRAFICA && containerEl) {
          renderChart(containerEl, ultimasMediciones);
        }
      });
      resizeObserver.observe(containerEl);
    }

    renderChart(containerEl, nuevasMediciones);
  }

  onDestroy(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  });
</script>

<div class="grafica-header">
  <h2 class="grafica__titulo">Evolución</h2>
  <span class="grafica__unidad" aria-hidden="true">mmHg</span>
</div>
<div class="grafica__leyenda" aria-hidden="true">
  <span class="leyenda-pill leyenda-pill--sistolica">Sistólica</span>
  <span class="leyenda-pill leyenda-pill--diastolica">Diastólica</span>
</div>
<div class="grafica-contenedor">
  <div id="chart-mediciones" bind:this={containerEl}></div>
</div>
