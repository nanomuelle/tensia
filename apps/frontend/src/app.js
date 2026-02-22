/**
 * Lógica de la interfaz — pantalla principal de Tensia.
 * Orquesta los componentes, gestiona los estados de la UI y delega la persistencia
 * al servicio local (ADR-005): en sesión anónima usa localStorageAdapter.
 *
 * Tras el Paso 10 del plan de refactorización, app.js se limita a:
 *   - Crear el servicio con el adaptador inyectado.
 *   - Instanciar y montar los componentes.
 *   - Gestionar el botón principal "Nueva medición".
 *   - Arrancar la carga inicial del historial.
 */

import * as adapter from './infra/localStorageAdapter.js';
import { createMeasurementService } from './services/measurementService.js';
import { createIosWarning } from './components/IosWarning/IosWarning.js';
import { createToast } from './components/Toast/Toast.js';
import { createMeasurementList } from './components/MeasurementList/MeasurementList.js';
import { createMeasurementChart } from './components/MeasurementChart/MeasurementChart.js';
import { createMeasurementForm } from './components/MeasurementForm/MeasurementForm.js';

// Servicio con adaptador inyectado (anónimo → localStorage)
const service = createMeasurementService(adapter);

// =========================================================
// Instanciación de componentes
// =========================================================

const toast = createToast(document.getElementById('toast-container'));

const historial = createMeasurementList(
  document.getElementById('historial-root'),
  { onReintentar: () => cargarMediciones() },
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
    onSuccess:  () => cargarMediciones(),
    onCerrar:   () => { btnNuevaMedicion.hidden = false; },
  },
);

// =========================================================
// Historial: carga
// =========================================================

async function cargarMediciones() {
  historial.mostrarCargando();
  try {
    const mediciones = await service.listAll();
    if (mediciones.length === 0) {
      historial.mostrarVacio();
      // Mostrar skeleton de la gráfica incluso con lista vacía
      grafica.update(mediciones);
    } else {
      grafica.update(mediciones);
      historial.mostrarLista(mediciones);
    }
  } catch {
    historial.mostrarError();
    // En caso de error, ocultamos la sección de gráfica
    const seccionGrafica = document.getElementById('seccion-grafica');
    if (seccionGrafica) seccionGrafica.hidden = true;
  }
}

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
cargarMediciones();

