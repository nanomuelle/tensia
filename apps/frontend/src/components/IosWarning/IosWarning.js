/**
 * Componente IosWarning.
 * Muestra el aviso informativo sobre la política ITP de Safari/iOS
 * (localStorage puede borrarse tras 7 días de inactividad).
 *
 * mount() genera su propio HTML dentro de rootEl (Paso 14a).
 *
 * @param {HTMLElement} rootEl - El elemento contenedor #aviso-ios (vacío en index.html).
 * @returns {{ mount: Function, unmount: Function }}
 */
export function createIosWarning(rootEl) {
  // Referencia al botón de cierre (se captura en mount() tras generar el HTML)
  let btnCerrar = null;

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

    // Generar el HTML interno del aviso
    rootEl.innerHTML = `
      <span>⚠️ En Safari/iOS los datos pueden borrarse si no usas la app durante 7 días.</span>
      <button
        id="btn-cerrar-aviso-ios"
        class="aviso-ios__cerrar"
        aria-label="Cerrar aviso"
      >✕</button>
    `;

    // Capturar ref al botón tras generar el HTML
    btnCerrar = rootEl.querySelector('#btn-cerrar-aviso-ios');

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
      btnCerrar = null;
    }
  }

  return { mount, unmount };
}
