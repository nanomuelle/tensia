/**
 * Componente MeasurementChart.
 * Wrapper sobre chart.js (renderChart) que gestiona la sección de gráfica,
 * el ResizeObserver y el ciclo de vida del componente.
 *
 * mount() genera su propio HTML interno dentro de seccionEl (Paso 14c).
 * seccionEl (#seccion-grafica) vive en index.html como contenedor vacío
 * hasta que HomeView lo genere también (Paso 14f).
 *
 * @param {HTMLElement} seccionEl - El elemento #seccion-grafica (vacío al montarse).
 * @returns {{ mount: Function, unmount: Function, update: Function }}
 */

import { renderChart } from '../../chart.js';
import { MIN_MEDICIONES_GRAFICA } from '../../shared/constants.js';

export function createMeasurementChart(seccionEl) {
  let resizeObserver  = null;
  let ultimasMediciones = [];
  let containerEl     = null;  // se captura en mount() tras generar el HTML

  function mount() {
    if (!seccionEl) return;

    // Generar el HTML interno de la sección de gráfica
    seccionEl.innerHTML = `
      <div class="grafica-header">
        <h2 class="grafica__titulo">Evolución</h2>
        <span class="grafica__unidad" aria-hidden="true">mmHg</span>
      </div>
      <div class="grafica__leyenda" aria-hidden="true">
        <span class="leyenda-pill leyenda-pill--sistolica">Sistólica</span>
        <span class="leyenda-pill leyenda-pill--diastolica">Diastólica</span>
      </div>
      <div class="grafica-contenedor">
        <div id="chart-mediciones"></div>
      </div>
    `;

    // Capturar ref al contenedor D3 después de generar el HTML
    containerEl = seccionEl.querySelector('#chart-mediciones');

    // La inicialización del ResizeObserver se difiere hasta el primer update()
    // con datos suficientes, para no observar un contenedor vacío.
  }

  function unmount() {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    containerEl = null;
  }

  /**
   * Actualiza la gráfica con las nuevas mediciones.
   * Equivale a la antigua renderizarGrafica() de app.js.
   *
   * @param {Array} mediciones - Array de mediciones a visualizar.
   */
  function update(mediciones) {
    // Guardar referencia para que ResizeObserver pueda redibujar
    ultimasMediciones = mediciones;

    // Si no existe el DOM esperado, no hacemos nada
    if (!seccionEl || !containerEl) return;

    // Mostrar siempre la sección de gráfica: renderChart decide si dibuja
    // la gráfica real o el skeleton según el número de mediciones.
    seccionEl.hidden = false;

    // Con menos del mínimo de mediciones, renderizar el skeleton y salir
    if (mediciones.length < MIN_MEDICIONES_GRAFICA) {
      renderChart(containerEl, mediciones);
      return;
    }

    // Inicializar ResizeObserver solo cuando hay datos suficientes y la gráfica es visible
    if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (ultimasMediciones.length >= MIN_MEDICIONES_GRAFICA && containerEl) {
          renderChart(containerEl, ultimasMediciones);
        }
      });
      resizeObserver.observe(containerEl);
    }

    // Renderizar usando el módulo de gráficas D3
    renderChart(containerEl, mediciones);
  }

  return { mount, unmount, update };
}
