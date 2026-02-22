/**
 * Vista principal — HomeView.
 * Encapsula la orquestación de todos los componentes de la pantalla del dashboard:
 * historial, gráfica, formulario de registro y el botón "Nueva medición".
 *
 * mount() genera todo el HTML interno del contenedor (Paso 14f), vacía <main> en
 * index.html y lo rellena al montarse. Expone mount() y unmount() para el router.
 *
 * @param {HTMLElement} containerEl - Elemento contenedor vacío de la vista (<main>).
 * @param {{
 *   store:   object,
 *   service: object,
 *   toast:   object
 * }} deps
 * @returns {{ mount: Function, unmount: Function }}
 */

import { createMeasurementList } from '../components/MeasurementList/MeasurementList.js';
import { createMeasurementChart } from '../components/MeasurementChart/MeasurementChart.js';
import { createMeasurementForm } from '../components/MeasurementForm/MeasurementForm.js';

export function createHomeView(containerEl, { store, service, toast }) {
  // Instancias internas de componentes (se crean en mount)
  let historial  = null;
  let grafica    = null;
  let formulario = null;
  let unsubscribeStore = null;
  let cleanupBtnNueva  = null;

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------

  function mount() {
    // Generar la estructura HTML de la vista dentro del contenedor
    containerEl.innerHTML = `
      <section class="nueva-medicion">
        <button
          id="btn-nueva-medicion"
          class="btn btn--primario"
          aria-label="Registrar nueva medición"
        >
          + Nueva medición
        </button>
      </section>

      <section
        id="formulario-registro"
        class="formulario-registro"
        aria-label="Registro de medición manual"
        hidden
      ></section>

      <section id="seccion-grafica" class="grafica-seccion" hidden></section>

      <section id="historial-root" class="historial"></section>
    `;

    const btnNuevaMedicion = containerEl.querySelector('#btn-nueva-medicion');

    // Crear instancias de componentes con referencias a los contenedores recién creados
    historial = createMeasurementList(
      containerEl.querySelector('#historial-root'),
      { onReintentar: () => store.cargarMediciones() },
    );

    grafica = createMeasurementChart(
      containerEl.querySelector('#seccion-grafica'),
    );

    formulario = createMeasurementForm(
      containerEl.querySelector('#formulario-registro'),
      {
        service,
        toast,
        onSuccess: () => store.cargarMediciones(),
        onCerrar:  () => { if (btnNuevaMedicion) btnNuevaMedicion.hidden = false; },
      },
    );

    // Montar todos los componentes (cada uno genera su propio HTML interno)
    historial.mount();
    grafica.mount();
    formulario.mount();

    // Suscribir los componentes al store
    unsubscribeStore = store.subscribe((state) => {
      if (state.cargando) {
        historial.mostrarCargando();
      } else if (state.error) {
        historial.mostrarError();
        // Ocultar la sección de gráfica en caso de error
        const seccionGrafica = containerEl.querySelector('#seccion-grafica');
        if (seccionGrafica) seccionGrafica.hidden = true;
      } else if (!state.mediciones.length) {
        historial.mostrarVacio();
        // Mostrar skeleton de la gráfica incluso con lista vacía
        grafica.update(state.mediciones);
      } else {
        historial.mostrarLista(state.mediciones);
        grafica.update(state.mediciones);
      }
    });

    // Listener del botón "Nueva medición"
    function handleNuevaMedicion() {
      formulario.abrir();
      if (btnNuevaMedicion) btnNuevaMedicion.hidden = true;
    }
    if (btnNuevaMedicion) {
      btnNuevaMedicion.addEventListener('click', handleNuevaMedicion);
      cleanupBtnNueva = () => btnNuevaMedicion.removeEventListener('click', handleNuevaMedicion);
    }

    // Disparar la carga inicial
    store.cargarMediciones();
  }

  function unmount() {
    // Desuscribir del store
    unsubscribeStore?.();
    unsubscribeStore = null;

    // Limpiar el listener del botón principal
    cleanupBtnNueva?.();
    cleanupBtnNueva = null;

    // Desmontar componentes
    historial?.unmount();
    grafica?.unmount();
    formulario?.unmount();

    historial  = null;
    grafica    = null;
    formulario = null;

    // Limpiar el HTML del contenedor
    if (containerEl) containerEl.innerHTML = '';
  }

  return { mount, unmount };
}
