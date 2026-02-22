/**
 * Punto de entrada de la aplicación Tensia.
 * Crea el servicio, el store y el toast; monta la vista principal.
 *
 * Tras el Paso 12 del plan de refactorización, app.js delega toda la
 * orquestación de componentes en HomeView.
 */

import * as adapter from './infra/localStorageAdapter.js';
import { createMeasurementService } from './services/measurementService.js';
import { createAppStore } from './store/appStore.js';
import { createToast } from './components/Toast/Toast.js';
import { createIosWarning } from './components/IosWarning/IosWarning.js';
import { createHomeView } from './views/HomeView.js';

// Servicio con adaptador inyectado (anónimo → localStorage)
const service = createMeasurementService(adapter);

// Store de estado: fuente única de verdad para mediciones, carga y error
const store = createAppStore(service);

// Toast: disponible de forma transversal para la vista
const toast = createToast(document.getElementById('toast-container'));
toast.mount();

// Aviso iOS/Safari (política ITP de 7 días en localStorage)
createIosWarning(document.getElementById('aviso-ios')).mount();

// Montar la vista principal
createHomeView(document.querySelector('main'), { store, service, toast }).mount();

