/**
 * Lógica de la interfaz — pantalla principal de Tensia.
 * Orquesta los componentes y el store de estado; delega la persistencia
 * al servicio local (ADR-005): en sesión anónima usa localStorageAdapter.
 *
 * Tras el Paso 11 del plan de refactorización, app.js se limita a:
 *   - Crear el servicio y el store.
 *   - Instanciar y montar los componentes.
 *   - Suscribir los componentes al store.
 *   - Gestionar el botón principal "Nueva medición".
 *   - Arrancar la carga inicial a través del store.
 */

import * as adapter from './infra/localStorageAdapter.js';
import { createMeasurementService } from './services/measurementService.js';
import { createAppStore } from './store/appStore.js';
import { createIosWarning } from './components/IosWarning/IosWarning.js';
import { createToast } from './components/Toast/Toast.js';
import { createMeasurementList } from './components/MeasurementList/MeasurementList.js';
import { createMeasurementChart } from './components/MeasurementChart/MeasurementChart.js';
import { createMeasurementForm } from './components/MeasurementForm/MeasurementForm.js';

// Servicio con adaptador inyectado (anónimo → localStorage)
const service = createMeasurementService(adapter);

// Store de estado: fuente única de verdad para mediciones, carga y error
const store = createAppStore(service);

// =========================================================
// Instanciación de componentes
// =========================================================

const toast = createToast(document.getElementById('toast-container'));

const historial = createMeasurementList(
  document.getElementById('historial-root'),
  { onReintentar: () => store.cargarMediciones() },
);

const grafica = createMeasurementChart(
  document.getElementById('seccion-grafica'),
  document.getElementById('chart-mediciones'),
);

const btnNuevaMedicion = document.getElementById('btn-nueva-medicion');

const formulario = createMeasurementForm(
  document.getElementById('formulario-registro'),
  {
    service,
    toast,
    onSuccess: () => store.cargarMediciones(),
    onCerrar:  () => { btnNuevaMedicion.hidden = false; },
  },
);

// =========================================================
// Suscripción de componentes al store
// =========================================================

store.subscribe((state) => {
  if (state.cargando) {
    historial.mostrarCargando();
  } else if (state.error) {
    historial.mostrarError();
    // Ocultar la sección de gráfica en caso de error (igual que antes)
    const seccionGrafica = document.getElementById('seccion-grafica');
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

// =========================================================
// Evento: botón "Nueva medición"
// =========================================================

btnNuevaMedicion.addEventListener('click', () => {
  formulario.abrir();
  btnNuevaMedicion.hidden = true;
});

// =========================================================
// Arranque
// =========================================================
toast.mount();
createIosWarning(document.getElementById('aviso-ios')).mount();
historial.mount();
grafica.mount();
formulario.mount();
store.cargarMediciones();

