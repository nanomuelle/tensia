/**
 * Componente MeasurementChart.
 * Wrapper sobre chart.js (renderChart) que gestiona la sección de gráfica,
 * el ResizeObserver y el ciclo de vida del componente.
 *
 * El HTML (#seccion-grafica y #chart-mediciones) vive en index.html.
 *
 * @param {HTMLElement} seccionEl   - El elemento #seccion-grafica.
 * @param {HTMLElement} containerEl - El elemento #chart-mediciones donde D3 inserta el SVG.
 * @returns {{ mount: Function, unmount: Function, update: Function }}
 */

import { renderChart } from '../../chart.js';
import { MIN_MEDICIONES_GRAFICA } from '../../shared/constants.js';

export function createMeasurementChart(seccionEl, containerEl) {
  let resizeObserver = null;
  let ultimasMediciones = [];

  function mount() {
    // La inicialización del ResizeObserver se difiere hasta el primer update()
    // con datos suficientes, para no observar un contenedor vacío.
  }

  function unmount() {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
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
