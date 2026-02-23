/**
 * main.js — Punto de entrada de la aplicación Tensia (BK-27).
 * Sustituye app.js: instancia el servicio con el adaptador inyectado
 * y monta el componente raíz App.svelte en document.body.
 *
 * No contiene lógica de negocio ni manipulación directa del DOM.
 */
import { mount } from 'svelte';
import * as adapter from './infra/localStorageAdapter.js';
import { createMeasurementService } from './services/measurementService.js';
import App from './App.svelte';

// Servicio con adaptador inyectado (usuario anónimo → localStorage)
const service = createMeasurementService(adapter);

// Montar el componente raíz; a partir de aquí todo es Svelte
mount(App, { target: document.body, props: { service } });
