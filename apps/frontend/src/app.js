/**
 * Punto de entrada de la aplicación Tensia.
 * Crea el servicio, el store, el toast y arranca el router.
 *
 * Tras el Paso 13 del plan de refactorización, app.js delega la navegación
 * en el router hash-based; las vistas se montan/desmontan automáticamente.
 */

import * as adapter from './infra/localStorageAdapter.js';
import { createMeasurementService } from './services/measurementService.js';
import { createAppStore } from './store/appStore.js';
import { createToast } from './components/Toast/Toast.js';
import { createIosWarning } from './components/IosWarning/IosWarning.js';
import { createHomeView } from './views/HomeView.js';
import { createRouter } from './router.js';

// Servicio con adaptador inyectado (anónimo → localStorage)
const service = createMeasurementService(adapter);

// Store de estado: fuente única de verdad para mediciones, carga y error
const store = createAppStore(service);

// Toast: disponible de forma transversal para todos las vistas
const toast = createToast(document.getElementById('toast-container'));
toast.mount();

// Aviso iOS/Safari (política ITP de 7 días en localStorage)
createIosWarning(document.getElementById('aviso-ios')).mount();

// Mapa de rutas: hash → fábrica de vista
const routes = {
  '/': (el) => createHomeView(el, { store, service, toast }),
};

// Arrancar el router (registra hashchange y monta la vista inicial)
createRouter(routes, document.querySelector('main')).start();

