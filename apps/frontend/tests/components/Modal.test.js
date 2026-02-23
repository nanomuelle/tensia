/**
 * Tests unitarios: componente Modal (BK-22 / US-13)
 *
 * Verifica el comportamiento del componente genérico Modal en aislamiento,
 * usando un contentFactory stub. Los tests cubren:
 * - open() / close(): ciclo de vida en el DOM
 * - Focus trap: Tab/Shift+Tab ciclan dentro de la modal
 * - Escape: cierra en estado normal; no cierra en locked
 * - Click en overlay: cierra en estado normal; no cierra en locked
 * - Devolución del foco al opener al cerrar
 * - lock() / unlock(): estado del botón ✕
 *
 * Referencia: docs/product/backlog.md#BK-22
 *             docs/design/screens.md#modal-formulario-registro
 *
 * @jest-environment jsdom
 */

import {
  vi,
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
} from 'vitest';
import { createModal } from '../../src/components/Modal/Modal.js';

// Polyfill de TransitionEvent para jsdom (no lo incluye de forma nativa)
if (typeof globalThis.TransitionEvent === 'undefined') {
  globalThis.TransitionEvent = class TransitionEvent extends Event {
    constructor(type, init = {}) {
      super(type, init);
      this.propertyName = init.propertyName || '';
    }
  };
}

// =========================================================
// Helpers de test
// =========================================================

/**
 * Avanza los requestAnimationFrame pendientes de forma síncrona.
 * El componente Modal usa un doble rAF para lanzar la animación.
 */
function flushRaf() {
  vi.runAllTimers();
}

/**
 * Dispara el evento transitionend en el contenedor de la modal
 * para simular la finalización de una transición CSS.
 * @param {'transform'|'opacity'} propertyName
 */
function disparaTransitionEnd(propertyName = 'transform') {
  const modalEl = document.querySelector('.modal');
  if (!modalEl) return;
  modalEl.dispatchEvent(
    new TransitionEvent('transitionend', {
      bubbles: true,
      propertyName,
    }),
  );
}

/**
 * Crea un elemento focusable (botón) e inserta un contenedor con id="app" en el DOM.
 * @returns {HTMLElement} El botón "opener" que actuará como origin del foco.
 */
function configurarDOM() {
  document.body.innerHTML = '';
  const appEl = document.createElement('div');
  appEl.id = 'app';
  document.body.appendChild(appEl);

  const opener = document.createElement('button');
  opener.id = 'btn-opener';
  opener.textContent = '+ Nueva medición';
  document.body.appendChild(opener);
  return opener;
}

/**
 * ContentFactory stub: crea dos inputs focusables dentro del contenedor.
 * Devuelve { unmount } con un spy.
 */
function contentFactoryStub(unmountSpy) {
  return (contenedorEl) => {
    contenedorEl.innerHTML = `
      <input id="campo-a" type="text" />
      <input id="campo-b" type="text" />
      <button id="btn-guardar" type="button">Guardar</button>
    `;
    return { unmount: unmountSpy };
  };
}

// =========================================================
// Setup / Teardown
// =========================================================

let openerEl;
let unmountSpy;

beforeEach(() => {
  // Fake timers para controlar requestAnimationFrame
  vi.useFakeTimers();

  openerEl   = configurarDOM();
  unmountSpy = vi.fn();
});

afterEach(() => {
  // Limpiar el DOM para el siguiente test
  document.body.innerHTML = '';
  vi.useRealTimers();
});

// =========================================================
// open(): inserción en el DOM
// =========================================================

describe('createModal — open()', () => {
  test('inserta el overlay en #app', () => {
    const modal = createModal({
      title: 'Nueva medición',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    openerEl.focus();
    modal.open();

    // El overlay debe estar en el DOM desde el momento de open()
    expect(document.querySelector('.modal-overlay')).not.toBeNull();
    expect(document.getElementById('app').contains(document.querySelector('.modal-overlay'))).toBe(true);
  });

  test('inserta el contenedor .modal dentro del overlay', () => {
    const modal = createModal({
      title: 'Nueva medición',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();

    const overlay = document.querySelector('.modal-overlay');
    expect(overlay.querySelector('.modal')).not.toBeNull();
  });

  test('el contenedor tiene role="dialog" y aria-modal="true"', () => {
    const modal = createModal({
      title: 'Nueva medición',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();

    const containerEl = document.querySelector('.modal');
    expect(containerEl.getAttribute('role')).toBe('dialog');
    expect(containerEl.getAttribute('aria-modal')).toBe('true');
  });

  test('el título aparece en el encabezado con id="modal-titulo"', () => {
    const modal = createModal({
      title: 'Nueva medición',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();

    const titulo = document.querySelector('#modal-titulo');
    expect(titulo).not.toBeNull();
    expect(titulo.textContent.trim()).toBe('Nueva medición');
  });

  test('invoca contentFactory con el contenedor de contenido', () => {
    const factorySpy = vi.fn().mockReturnValue({ unmount: unmountSpy });
    const modal = createModal({
      title: 'Test',
      contentFactory: factorySpy,
    });
    modal.open();

    expect(factorySpy).toHaveBeenCalledTimes(1);
    // El argumento debe ser un HTMLElement
    expect(factorySpy.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
  });

  test('añade la clase modal--open tras el doble rAF', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();

    // Antes del rAF: la clase no debe estar todavía
    expect(document.querySelector('.modal').classList.contains('modal--open')).toBe(false);

    flushRaf();

    expect(document.querySelector('.modal').classList.contains('modal--open')).toBe(true);
  });

  test('segunda llamada a open() no duplica el overlay', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    modal.open(); // segunda llamada: debe ignorarse

    expect(document.querySelectorAll('.modal-overlay').length).toBe(1);
  });
});

// =========================================================
// close(): desmontaje del DOM
// =========================================================

describe('createModal — close()', () => {
  test('elimina el overlay del DOM tras transitionend', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    flushRaf();

    modal.close();
    expect(document.querySelector('.modal-overlay')).not.toBeNull(); // aún ahí

    disparaTransitionEnd('transform');

    expect(document.querySelector('.modal-overlay')).toBeNull(); // ya eliminado
  });

  test('añade la clase modal--closing al cerrar', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    flushRaf();

    modal.close();

    expect(document.querySelector('.modal').classList.contains('modal--closing')).toBe(true);
  });

  test('invoca el unmount del contenido al cerrar', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    flushRaf();

    modal.close();
    disparaTransitionEnd('transform');

    expect(unmountSpy).toHaveBeenCalledTimes(1);
  });

  test('invoca el callback onClose al cerrar', () => {
    const onClose = vi.fn();
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
      onClose,
    });
    modal.open();
    flushRaf();

    modal.close();
    disparaTransitionEnd('transform');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('se puede volver a abrir después de cerrar', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });

    modal.open();
    flushRaf();
    modal.close();
    disparaTransitionEnd('transform');

    // Segunda apertura
    modal.open();
    expect(document.querySelector('.modal-overlay')).not.toBeNull();
  });
});

// =========================================================
// Focus trap: Tab / Shift+Tab
// =========================================================

describe('createModal — focus trap', () => {
  test('Tab en el último elemento focusable salta al primero', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    flushRaf();

    // Obtener los focusables: campo-a, campo-b, btn-guardar, modal__btn-cerrar
    const focusables = Array.from(
      document.querySelector('.modal').querySelectorAll(
        'input:not([disabled]), button:not([disabled])',
      ),
    );
    const ultimo = focusables[focusables.length - 1];
    ultimo.focus();

    const tabEvento = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
    });
    document.dispatchEvent(tabEvento);

    expect(document.activeElement).toBe(focusables[0]);
  });

  test('Shift+Tab en el primer elemento focusable salta al último', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    flushRaf();

    const focusables = Array.from(
      document.querySelector('.modal').querySelectorAll(
        'input:not([disabled]), button:not([disabled])',
      ),
    );
    const primero = focusables[0];
    primero.focus();

    const shiftTabEvento = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
    });
    document.dispatchEvent(shiftTabEvento);

    expect(document.activeElement).toBe(focusables[focusables.length - 1]);
  });
});

// =========================================================
// Escape: cierra / no cierra según estado locked
// =========================================================

describe('createModal — tecla Escape', () => {
  test('Escape cierra la modal en estado normal', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    flushRaf();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    disparaTransitionEnd('transform');

    expect(document.querySelector('.modal-overlay')).toBeNull();
  });

  test('Escape NO cierra la modal en estado locked', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    flushRaf();
    modal.lock();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    // El overlay sigue en el DOM
    expect(document.querySelector('.modal-overlay')).not.toBeNull();
  });
});

// =========================================================
// Click en overlay: cierra / no cierra según estado locked
// =========================================================

describe('createModal — click en overlay', () => {
  test('click en el overlay cierra la modal en estado normal', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    flushRaf();

    // Simular click directo sobre el overlay (no sobre la modal)
    document.querySelector('.modal-overlay').dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    disparaTransitionEnd('transform');

    expect(document.querySelector('.modal-overlay')).toBeNull();
  });

  test('click en el overlay NO cierra la modal en estado locked', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    flushRaf();
    modal.lock();

    document.querySelector('.modal-overlay').dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );

    expect(document.querySelector('.modal-overlay')).not.toBeNull();
  });
});

// =========================================================
// Devolución del foco al opener
// =========================================================

describe('createModal — devolución del foco al opener', () => {
  test('el foco retorna al opener tras cerrar', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    openerEl.focus();
    modal.open();
    flushRaf();

    modal.close();
    disparaTransitionEnd('transform');

    expect(document.activeElement).toBe(openerEl);
  });
});

// =========================================================
// lock() / unlock(): botón ✕
// =========================================================

describe('createModal — lock() / unlock()', () => {
  test('lock() deshabilita el botón ✕', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    flushRaf();

    modal.lock();

    expect(document.querySelector('.modal__btn-cerrar').disabled).toBe(true);
  });

  test('unlock() vuelve a habilitar el botón ✕ tras lock()', () => {
    const modal = createModal({
      title: 'Test',
      contentFactory: contentFactoryStub(unmountSpy),
    });
    modal.open();
    flushRaf();

    modal.lock();
    modal.unlock();

    expect(document.querySelector('.modal__btn-cerrar').disabled).toBe(false);
  });
});
