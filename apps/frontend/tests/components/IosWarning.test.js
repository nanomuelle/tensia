/**
 * Tests unitarios: componente IosWarning.svelte (Vitest + @testing-library/svelte)
 * Verifica la detección de plataforma Safari/iOS y el comportamiento del botón de cierre.
 * Migrado de Jest en BK-25.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import IosWarning from '../../src/components/IosWarning/IosWarning.svelte';

// =========================================================
// Constantes de User-Agent
// =========================================================

const UA_CHROME    = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA_SAFARI_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const UA_IPHONE    = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const UA_IPAD      = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15';

let uaOriginal;

function setUA(ua) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
}

// =========================================================
// Setup
// =========================================================

beforeEach(() => {
  uaOriginal = navigator.userAgent;
});

afterEach(() => {
  setUA(uaOriginal);
});

// =========================================================
// Detección de plataforma
// =========================================================

describe('IosWarning — detección de plataforma', () => {
  test('no muestra el aviso en Chrome/Linux (plataforma no afectada)', async () => {
    setUA(UA_CHROME);
    render(IosWarning);
    await tick();
    expect(document.querySelector('.aviso-ios')).toBeNull();
  });

  test('muestra el aviso en Safari macOS', async () => {
    setUA(UA_SAFARI_MAC);
    render(IosWarning);
    await tick();
    expect(document.querySelector('.aviso-ios')).toBeInTheDocument();
  });

  test('muestra el aviso en iPhone (iOS)', async () => {
    setUA(UA_IPHONE);
    render(IosWarning);
    await tick();
    expect(document.querySelector('.aviso-ios')).toBeInTheDocument();
  });

  test('muestra el aviso en iPad (iOS)', async () => {
    setUA(UA_IPAD);
    render(IosWarning);
    await tick();
    expect(document.querySelector('.aviso-ios')).toBeInTheDocument();
  });
});

// =========================================================
// Contenido del aviso
// =========================================================

describe('IosWarning — contenido', () => {
  test('el aviso contiene el texto sobre los 7 días', async () => {
    setUA(UA_SAFARI_MAC);
    render(IosWarning);
    await tick();
    expect(screen.getByText(/7 días/)).toBeInTheDocument();
  });

  test('el botón tiene aria-label="Cerrar aviso"', async () => {
    setUA(UA_SAFARI_MAC);
    render(IosWarning);
    await tick();
    const btn = screen.getByRole('button', { name: 'Cerrar aviso' });
    expect(btn).toBeInTheDocument();
  });
});

// =========================================================
// Botón de cierre
// =========================================================

describe('IosWarning — botón cerrar', () => {
  test('click en el botón oculta el aviso (Safari)', async () => {
    setUA(UA_SAFARI_MAC);
    render(IosWarning);
    await tick();
    expect(document.querySelector('.aviso-ios')).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: 'Cerrar aviso' });
    await fireEvent.click(btn);
    await tick();


    expect(document.querySelector('.aviso-ios')).toBeNull();
  });
});
