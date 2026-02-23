/**
 * Vista principal — HomeView.
 * Encapsula la orquestación de todos los componentes de la pantalla del dashboard:
 * historial, gráfica y modal de registro de nueva medición.
 *
 * mount() genera todo el HTML interno del contenedor, vacía <main> en
 * index.html y lo rellena al montarse. Expone mount() y unmount() para el router.
 *
 * BK-25: MeasurementList y MeasurementChart son ahora componentes Svelte 5
 * montados como islas mediante la API programática mount(). HomeView sigue
 * siendo Vanilla JS hasta BK-27.
 *
 * @param {HTMLElement} containerEl - Elemento contenedor vacío de la vista (<main>).
 * @param {{
 *   store:   object,
 *   service: object,
 *   toast:   object
 * }} deps
 * @returns {{ mount: Function, unmount: Function }}
 */

import { svelteMount, svelteUnmount } from '../lib/svelteMount.js';
import MeasurementList from '../components/MeasurementList/MeasurementList.svelte';
import MeasurementChart from '../components/MeasurementChart/MeasurementChart.svelte';
import { createMeasurementForm } from '../components/MeasurementForm/MeasurementForm.js';
import { createModal } from '../components/Modal/Modal.js';

export function createHomeView(containerEl, { store, service, toast }) {
  // Instancias internas de componentes persistentes (se crean en mount)
  let historial  = null;
  let grafica    = null;
  let unsubscribeStore = null;
  let cleanupBtnNueva  = null;

  // Referencia a la instancia de modal activa (null cuando no hay modal abierta)
  let modalActiva = null;

  // -------------------------------------------------------
  // Helpers: modal de nueva medición
  // -------------------------------------------------------

  /**
   * Crea y abre la modal de registro de nueva medición.
   * Se usa un proxy de servicio para interceptar create() y activar
   * el estado locked de la modal mientras la operación está en curso.
   */
  function _abrirModalNuevaMedicion() {
    modalActiva = createModal({
      title: 'Nueva medición',

      onClose: () => {
        modalActiva = null;
      },

      contentFactory: (contenedorEl) => {
        // Proxy del servicio que envuelve create() con lock/unlock de la modal,
        // siguiendo el patrón de composición de HomeView (ADR-005, BK-22)
        const servicioConLock = {
          ...service,
          async create(datos) {
            modalActiva?.lock();
            try {
              return await service.create(datos);
            } finally {
              modalActiva?.unlock();
            }
          },
        };

        const formulario = createMeasurementForm(contenedorEl, {
          service: servicioConLock,
          toast,
          onSuccess: () => {
            // Primero cerrar la modal, luego actualizar el store
            modalActiva?.close();
            store.cargarMediciones();
          },
          onCerrar: () => {
            modalActiva?.close();
          },
        });

        formulario.mount();
        // abrir() rellena la fecha actual; el foco lo gestiona la Modal (transitionend)
        formulario.abrir();

        return { unmount: formulario.unmount };
      },
    });

    modalActiva.open();
  }

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------

  function mount() {
    // Generar la estructura HTML de la vista dentro del contenedor.
    // El formulario ya no tiene sección estática: vive dentro de la Modal (BK-22).
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

      <div class="dashboard-content" id="dashboard-content">
        <section id="seccion-grafica" class="grafica-seccion" hidden></section>
        <section id="historial-root" class="historial"></section>
      </div>
    `;

    const btnNuevaMedicion = containerEl.querySelector('#btn-nueva-medicion');

    // Crear instancias de componentes Svelte como islas dentro de los contenedores recién creados
    historial = svelteMount(MeasurementList, {
      target: containerEl.querySelector('#historial-root'),
      props:  { onReintentar: () => store.cargarMediciones() },
    });

    grafica = svelteMount(MeasurementChart, {
      target: containerEl.querySelector('#seccion-grafica'),
    });

    // Suscribir los componentes al store
    unsubscribeStore = store.subscribe((state) => {
      const dashboardContent = containerEl.querySelector('#dashboard-content');

      // Layout dos columnas: solo con ≥ 1 medición (esqueleto o gráfica real)
      if (dashboardContent) {
        dashboardContent.classList.toggle(
          'dashboard-content--columnas',
          state.mediciones.length >= 1,
        );
      }

      if (state.cargando) {
        historial.mostrarCargando();
        // La sección de gráfica permanece oculta mientras carga
      } else if (state.error) {
        historial.mostrarError();
        const seccionGrafica = containerEl.querySelector('#seccion-grafica');
        if (seccionGrafica) seccionGrafica.hidden = true;
      } else {
        // Estado vacío o con datos: mostrar sección de gráfica (skeleton o real)
        const seccionGrafica = containerEl.querySelector('#seccion-grafica');
        if (seccionGrafica) seccionGrafica.hidden = false;

        if (!state.mediciones.length) {
          historial.mostrarVacio();
        } else {
          historial.mostrarLista(state.mediciones);
        }
        grafica.update(state.mediciones);
      }
    });

    // Listener del botón "Nueva medición": abre la modal
    function handleNuevaMedicion() {
      _abrirModalNuevaMedicion();
    }
    if (btnNuevaMedicion) {
      btnNuevaMedicion.addEventListener('click', handleNuevaMedicion);
      cleanupBtnNueva = () => btnNuevaMedicion.removeEventListener('click', handleNuevaMedicion);
    }

    // Disparar la carga inicial
    store.cargarMediciones();
  }

  function unmount() {
    // Cerrar la modal si estuviera abierta al desmontar la vista
    if (modalActiva) {
      modalActiva.close();
      modalActiva = null;
    }

    // Desuscribir del store
    unsubscribeStore?.();
    unsubscribeStore = null;

    // Limpiar el listener del botón principal
    cleanupBtnNueva?.();
    cleanupBtnNueva = null;

    // Desmontar islas Svelte (MeasurementList y MeasurementChart)
    if (historial) { svelteUnmount(historial); historial = null; }
    if (grafica)   { svelteUnmount(grafica);   grafica   = null; }

    // Limpiar el HTML del contenedor
    if (containerEl) containerEl.innerHTML = '';
  }

  return { mount, unmount };
}

