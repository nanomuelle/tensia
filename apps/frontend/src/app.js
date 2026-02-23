/**
 * Punto de entrada de la aplicación Tensia.
 * Crea el servicio, el store, el toast y arranca el router.
 *
 * BK-25: Toast e IosWarning se montan como componentes Svelte 5 mediante
 * la API programática mount(). Los demás componentes siguen siendo Vanilla JS
 * hasta completar la migración (BK-26, BK-27).
 */

import { mount } from 'svelte';
import * as adapter from './infra/localStorageAdapter.js';
import { createMeasurementService } from './services/measurementService.js';
import { createAppStore } from './store/appStore.js';
import Toast from './components/Toast/Toast.svelte';
import IosWarning from './components/IosWarning/IosWarning.svelte';
import { createHomeView } from './views/HomeView.js';
import { createRouter } from './router.js';

// Servicio con adaptador inyectado (anónimo → localStorage)
const service = createMeasurementService(adapter);

// Store de estado: fuente única de verdad para mediciones, carga y error
const store = createAppStore(service);

// Toast: se monta en <body>; expone show() a través del return de mount()
const toast = mount(Toast, { target: document.body });

// Aviso iOS/Safari (política ITP de 7 días en localStorage)
mount(IosWarning, { target: document.getElementById('aviso-ios') });

// Mapa de rutas: hash → fábrica de vista
const routes = {
  '/': (el) => createHomeView(el, { store, service, toast }),
};

// Arrancar el router (registra hashchange y monta la vista inicial)
createRouter(routes, document.querySelector('main')).start();


