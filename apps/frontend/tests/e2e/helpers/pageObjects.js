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
  // Formulario (ahora dentro del Modal — BK-22)
  // El contenedor del modal no tiene id; el elemento del formulario es #form-medicion
  formulario: '#form-medicion',
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
  // Sección de gráfica y skeleton (US-11)
  seccionGrafica: '#seccion-grafica',
  chartContainer: '#chart-mediciones',
  chartSvg: '#chart-mediciones svg',
  chartSkeleton: '.chart-skeleton',
  chartSkeletonMensaje: '.chart-skeleton__mensaje',
  // Zona de sesión — cabecera (BK-37)
  btnLogin: '.user-session__login-btn',
  avatarBtn: '.user-session__avatar-btn',
  avatarImg: '.user-session__avatar-img',
  avatarInicial: '.user-session__inicial',
  menuSesion: '.user-session__menu',
  menuNombre: '.user-session__nombre',
  btnLogout: '.user-session__logout-btn',
};
