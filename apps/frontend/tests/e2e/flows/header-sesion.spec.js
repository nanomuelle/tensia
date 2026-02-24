/**
 * [BK-37] — Cabecera: botón Login / avatar de perfil de usuario
 *
 * Cubre los criterios de aceptación de BK-37:
 *   - En estado anónimo: botón "Iniciar sesión con Google" visible con aria-label correcto.
 *   - En estado autenticado (foto disponible): avatar con imagen y alt descriptivo.
 *   - En estado autenticado (sin foto): se muestra la inicial del nombre.
 *   - El menú desplegable: se abre al pulsar el avatar, muestra nombre y botón "Cerrar sesión".
 *   - "Cerrar sesión" revierte la UI al estado anónimo sin recargar la página.
 *   - Accesibilidad: aria-label en el botón avatar; alt en la imagen.
 *
 * Estrategia de simulación de sesión autenticada:
 *   Se usa page.addInitScript() para pre-poblar sessionStorage (clave "auth_session")
 *   antes de la carga del módulo authStore. Así el store se rehidrata con la sesión
 *   simulada y el componente UserSession renderiza el estado autenticado sin ejecutar
 *   el flujo OAuth real.
 *
 * Referencia: docs/product/backlog/e01-login-google.md#bk-37
 *             apps/frontend/src/components/UserSession/UserSession.svelte
 *             apps/frontend/src/store/authStore.svelte.js (clave SK_SESSION = 'auth_session')
 */
import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/pageObjects.js';

// ── Datos de sesión de prueba ──────────────────────────────────────────────

/** Sesión simulada con foto de perfil. */
const SESION_CON_FOTO = {
  tokenData: {
    access_token: 'test-access-token',
    token_type: 'Bearer',
    expires_in: 3600,
  },
  userProfile: {
    sub: '112233445566778899',
    name: 'Ana García',
    picture: 'https://lh3.googleusercontent.com/a/test-avatar',
    email: 'ana.garcia@example.com',
  },
};

/** Sesión simulada sin foto de perfil (la app debe mostrar la inicial). */
const SESION_SIN_FOTO = {
  tokenData: {
    access_token: 'test-access-token-2',
    token_type: 'Bearer',
    expires_in: 3600,
  },
  userProfile: {
    sub: '998877665544332211',
    name: 'Carlos López',
    picture: '',
    email: 'carlos.lopez@example.com',
  },
};

// ── Helper: pre-pobla sessionStorage antes de que cargue el módulo authStore ──

/**
 * Inyecta la sesión de prueba en sessionStorage antes de la carga de la app.
 * @param {import('@playwright/test').Page} page
 * @param {object} sesion
 */
async function inyectarSesion(page, sesion) {
  await page.addInitScript((sesionData) => {
    sessionStorage.setItem('auth_session', JSON.stringify(sesionData));
  }, sesion);
}

// ── Estado anónimo ─────────────────────────────────────────────────────────

test.describe('BK-37 — Estado anónimo', () => {
  test('muestra el botón "Iniciar sesión con Google"', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(SELECTORS.btnLogin)).toBeVisible();
  });

  test('el botón tiene aria-label "Iniciar sesión con Google"', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(SELECTORS.btnLogin)).toHaveAttribute(
      'aria-label',
      'Iniciar sesión con Google',
    );
  });

  test('no muestra el botón de avatar en estado anónimo', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(SELECTORS.avatarBtn)).toBeHidden();
  });

  test('no muestra el menú de usuario en estado anónimo', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(SELECTORS.menuSesion)).toBeHidden();
  });
});

// ── Estado autenticado con foto de perfil ──────────────────────────────────

test.describe('BK-37 — Estado autenticado con foto de perfil', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesion(page, SESION_CON_FOTO);
  });

  test('muestra el botón de avatar en lugar del botón de login', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(SELECTORS.avatarBtn)).toBeVisible();
    await expect(page.locator(SELECTORS.btnLogin)).toBeHidden();
  });

  test('el botón de avatar tiene aria-label que incluye el nombre del usuario', async ({ page }) => {
    await page.goto('/');

    const ariaLabel = await page.locator(SELECTORS.avatarBtn).getAttribute('aria-label');
    expect(ariaLabel).toContain('Ana García');
  });

  test('la imagen de avatar tiene alt descriptivo con el nombre del usuario', async ({ page }) => {
    await page.goto('/');

    const alt = await page.locator(SELECTORS.avatarImg).getAttribute('alt');
    expect(alt).toContain('Ana García');
  });

  test('la imagen de avatar tiene el src de la foto del perfil', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(SELECTORS.avatarImg)).toHaveAttribute(
      'src',
      SESION_CON_FOTO.userProfile.picture,
    );
  });

  test('no muestra la inicial cuando hay foto de perfil', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(SELECTORS.avatarInicial)).toBeHidden();
  });
});

// ── Estado autenticado sin foto de perfil ─────────────────────────────────

test.describe('BK-37 — Estado autenticado sin foto de perfil', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesion(page, SESION_SIN_FOTO);
  });

  test('muestra la inicial del nombre cuando no hay foto', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(SELECTORS.avatarInicial)).toBeVisible();
    await expect(page.locator(SELECTORS.avatarInicial)).toContainText('C');
  });

  test('no muestra la imagen de avatar cuando no hay foto', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(SELECTORS.avatarImg)).toBeHidden();
  });
});

// ── Menú desplegable ───────────────────────────────────────────────────────

test.describe('BK-37 — Menú desplegable de usuario', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesion(page, SESION_CON_FOTO);
  });

  test('el menú no está visible antes de pulsar el avatar', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(SELECTORS.menuSesion)).toBeHidden();
  });

  test('el menú se abre al pulsar el botón de avatar', async ({ page }) => {
    await page.goto('/');

    await page.locator(SELECTORS.avatarBtn).click();

    await expect(page.locator(SELECTORS.menuSesion)).toBeVisible();
  });

  test('el menú muestra el nombre del usuario', async ({ page }) => {
    await page.goto('/');

    await page.locator(SELECTORS.avatarBtn).click();

    await expect(page.locator(SELECTORS.menuNombre)).toContainText('Ana García');
  });

  test('el menú muestra el botón "Cerrar sesión"', async ({ page }) => {
    await page.goto('/');

    await page.locator(SELECTORS.avatarBtn).click();

    await expect(page.locator(SELECTORS.btnLogout)).toBeVisible();
    await expect(page.locator(SELECTORS.btnLogout)).toContainText('Cerrar sesión');
  });

  test('el menú se cierra al pulsar Escape', async ({ page }) => {
    await page.goto('/');

    await page.locator(SELECTORS.avatarBtn).click();
    await expect(page.locator(SELECTORS.menuSesion)).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator(SELECTORS.menuSesion)).toBeHidden();
  });
});

// ── Cerrar sesión ──────────────────────────────────────────────────────────

test.describe('BK-37 — Cerrar sesión', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesion(page, SESION_CON_FOTO);
  });

  test('pulsar "Cerrar sesión" revierte la UI al estado anónimo sin recargar', async ({ page }) => {
    await page.goto('/');

    // Verificar estado autenticado
    await expect(page.locator(SELECTORS.avatarBtn)).toBeVisible();

    // Abrir menú y cerrar sesión
    await page.locator(SELECTORS.avatarBtn).click();
    await page.locator(SELECTORS.btnLogout).click();

    // El botón de login debe aparecer sin recarga de página
    await expect(page.locator(SELECTORS.btnLogin)).toBeVisible();
    await expect(page.locator(SELECTORS.avatarBtn)).toBeHidden();
  });

  test('tras cerrar sesión, el menú desaparece', async ({ page }) => {
    await page.goto('/');

    await page.locator(SELECTORS.avatarBtn).click();
    await page.locator(SELECTORS.btnLogout).click();

    await expect(page.locator(SELECTORS.menuSesion)).toBeHidden();
  });

  test('tras cerrar sesión, sessionStorage queda limpio', async ({ page }) => {
    await page.goto('/');

    await page.locator(SELECTORS.avatarBtn).click();
    await page.locator(SELECTORS.btnLogout).click();

    const sesionAlmacenada = await page.evaluate(() =>
      sessionStorage.getItem('auth_session'),
    );
    expect(sesionAlmacenada).toBeNull();
  });
});
