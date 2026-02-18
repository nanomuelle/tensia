/**
 * Page Objects para los tests E2E de Tensia.
 * Centraliza los selectores y acciones comunes para evitar duplicación en los specs.
 *
 * Uso: importar en cada spec y construir con la página de Playwright.
 *   import { AppPage } from '../helpers/pageObjects.js';
 *   const app = new AppPage(page);
 */

// Selectores definidos como constantes para facilitar el mantenimiento
// cuando cambie el HTML del frontend.
// Referencia: apps/frontend/public/index.html
export const SELECTORS = {
  // Acción principal
  btnNuevaMedicion: '#btn-nueva-medicion',
  // Formulario
  formulario: '#formulario-registro',
  inputSistolica: '#input-systolic',
  inputDiastolica: '#input-diastolic',
  inputPulso: '#input-pulse',
  inputFecha: '#input-fecha',
  errorFormulario: '#error-formulario',
  btnGuardar: '#btn-guardar',
  btnCancelar: '#btn-cancelar',
  // Historial
  listaMediciones: '#lista-mediciones',
  // Estados del historial
  estadoCargando: '#estado-cargando',
  estadoError: '#estado-error',
  estadoVacio: '#estado-vacio',
  btnReintentar: '#btn-reintentar',
};
