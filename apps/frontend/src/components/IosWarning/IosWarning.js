/**
 * Componente IosWarning.
 * Muestra el aviso informativo sobre la política ITP de Safari/iOS
 * (localStorage puede borrarse tras 7 días de inactividad).
 *
 * El HTML del aviso (#aviso-ios y #btn-cerrar-aviso-ios) vive en index.html.
 * Este módulo solo encapsula la detección de plataforma y la lógica de visibilidad.
 *
 * @param {HTMLElement} rootEl - El elemento #aviso-ios.
 * @returns {{ mount: Function, unmount: Function }}
 */
export function createIosWarning(rootEl) {
  // Referencia al botón de cierre
  const btnCerrar = rootEl
    ? rootEl.querySelector('#btn-cerrar-aviso-ios') ??
      document.getElementById('btn-cerrar-aviso-ios')
    : null;

  /** Detecta si el navegador es Safari o un dispositivo iOS. */
  function esPlataformaAfectada() {
    const ua = navigator.userAgent;
    const esIOS = /iP(hone|od|ad)/.test(ua);
    const esSafari = /^((?!chrome|android).)*safari/i.test(ua);
    return esIOS || esSafari;
  }

  /** Manejador del click en el botón de cierre. */
  function onCerrar() {
    if (rootEl) rootEl.hidden = true;
  }

  function mount() {
    if (!rootEl) return;
    if (esPlataformaAfectada()) {
      rootEl.hidden = false;
    }
    if (btnCerrar) {
      btnCerrar.addEventListener('click', onCerrar);
    }
  }

  function unmount() {
    if (btnCerrar) {
      btnCerrar.removeEventListener('click', onCerrar);
    }
  }

  return { mount, unmount };
}
