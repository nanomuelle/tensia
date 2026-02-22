/**
 * Vista principal — HomeView.
 * Encapsula la orquestación de todos los componentes de la pantalla del dashboard:
 * historial, gráfica y modal de registro de nueva medición.
 *
 * mount() genera todo el HTML interno del contenedor, vacía <main> en
 * index.html y lo rellena al montarse. Expone mount() y unmount() para el router.
 *
 * El formulario de registro NO se monta inline; se presenta dentro de un componente
 * Modal genérico que se instancia al pulsar "Nueva medición" (BK-22 / US-13).
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

    // Montar los componentes (cada uno genera su propio HTML interno)
    historial.mount();
    grafica.mount();

    // Suscribir los componentes al store
    unsubscribeStore = store.subscribe((state) => {
      if (state.cargando) {
        historial.mostrarCargando();
      } else if (state.error) {
        historial.mostrarError();
        const seccionGrafica = containerEl.querySelector('#seccion-grafica');
        if (seccionGrafica) seccionGrafica.hidden = true;
      } else if (!state.mediciones.length) {
        historial.mostrarVacio();
        grafica.update(state.mediciones);
      } else {
        historial.mostrarLista(state.mediciones);
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

    // Desmontar componentes
    historial?.unmount();
    grafica?.unmount();

    historial = null;
    grafica   = null;

    // Limpiar el HTML del contenedor
    if (containerEl) containerEl.innerHTML = '';
  }

  return { mount, unmount };
}

