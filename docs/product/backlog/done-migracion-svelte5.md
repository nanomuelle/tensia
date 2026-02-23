# Épica: Migración a Svelte 5 + Vite — Completados

_Ítems del sprint de migración al stack definitivo (Svelte 5 + Vite + Vitest), completados._

---

**BK-24 — Fase 0: Integrar Vite como build tool**
Descripción: Sustituir `scripts/build.js` por `vite build`. `vite.config.js` creado en la raíz con `root: 'apps/frontend'`, `outDir: '../../dist'` y `vite-plugin-pwa` (Workbox). `index.html` movido de `apps/frontend/public/` a `apps/frontend/`. `sw.js` manual eliminado de `public/` (reemplazado por el SW generado por Workbox). `importmap` de D3 CDN eliminado (D3 se resuelve desde `node_modules`). Scripts de `package.json` actualizados: `dev → vite`, `build → vite build`, `preview → vite preview`. Variable de entorno en `deploy-pages.yml` cambiada a `VITE_BASE_PATH`. Todos los tests Jest (196) siguen en verde.
Prioridad: Alta
Estado: Hecho (2026-02-23)
Referencia técnica: `docs/architecture/svelte-migration-plan.md` §§ 3.2, 3.3, 4 (Fase 0)

---

**BK-25 — Fase 1: Migrar componentes hoja a Svelte**
Descripción: Los 4 componentes hoja reescritos como Single File Components de Svelte 5 Runes: `Toast.svelte`, `IosWarning.svelte`, `MeasurementList.svelte`, `MeasurementChart.svelte`. `MeasurementList.svelte` elimina el riesgo XSS al sustituir `innerHTML` por `{#each}`. `app.js` actualizado para montar `Toast` e `IosWarning` con la API programática `mount()` de Svelte. `HomeView.js` actualizado para montar `MeasurementList` y `MeasurementChart` como islas Svelte mediante el adaptador `src/lib/svelteMount.js`. Vitest configurado (`vitest.config.js`, `vitest.setup.js`) con `@testing-library/svelte`, `jsdom` y `resolve.conditions: ['browser']`. Tests de los 4 componentes reescritos a Vitest (47 tests). `HomeView.test.js` migrado a Vitest (10 tests). Suite completa: 47 tests Vitest + 196 tests Jest, todos pasando, sin regresiones.
Prioridad: Alta
Estado: Hecho (2026-02-23)
Referencia técnica: `docs/architecture/svelte-migration-plan.md` § 3.3 (Fase 1)

---

**BK-26 — Fase 2: Migrar MeasurementForm y Modal a Svelte**
Descripción: `MeasurementForm.svelte` y `Modal.svelte` reescritos como SFCs con Svelte 5 Runes. Nuevo `RegistroMedicionModal.svelte` como componente de composición que encapsula la integración Modal + MeasurementForm, montable desde `HomeView.js` con la API programática de Svelte 5 (`mount()`). Ningún componente usa `innerHTML` con datos de usuario; riesgo XSS estructural eliminado completamente. `HomeView.js` actualizado para usar `mount(RegistroMedicionModal, ...)` en lugar de `createModal`/`createMeasurementForm`. Tests de `MeasurementForm`, `Modal` y `RegistroMedicionModal` migrados a Vitest + `@testing-library/svelte`.
Prioridad: Alta
Estado: Hecho (2026-02-23)
Referencia técnica: `docs/architecture/svelte-migration-plan.md` § 3.3 (Fase 2)

---

**BK-27 — Fase 3: Migrar vistas, store y router a Svelte**
Descripción: `appStore.svelte.js` creado con stores Svelte (`writable`: `mediciones`, `cargando`, `error`) y acción `cargarMediciones`. `HomeView.svelte` creado; suscribe reactivamente con `$mediciones`/`$cargando`/`$error` sin `store.subscribe()` explícito. `router.js` adaptado al contrato `{ component, props }` con `mount()`/`unmount()` de Svelte. `App.svelte` y `main.js` creados como nuevo punto de entrada. Ficheros eliminados: `app.js`, `lib/svelteMount.js`, `views/HomeView.js`, `store/appStore.js`. Cero Vanilla JS en la capa de UI. Tests de `appStore`, `router` y `HomeView` migrados a Vitest.
Prioridad: Alta
Estado: Hecho (2026-02-23)
Referencia técnica: `docs/architecture/svelte-migration-plan.md` § 3.3 (Fase 3)

---

**BK-28 — Fase 4: Consolidar tests y limpiar dependencias**
Descripción: Vitest como runner único. Los 9 ficheros de test bajo Jest migrados a Vitest (`import` desde `vitest`, `vi.fn()`/`vi.spyOn()`, anotación `@vitest-environment node` en 5 ficheros de entorno Node). `vitest.config.js` actualizado con patrón glob único `apps/**/tests/**/*.test.{js,svelte.js}` y cobertura v8 con umbral 70 % incluyendo backend. Scripts actualizados: `test → vitest run`, `test:watch → vitest`, `test:coverage → vitest run --coverage`. Bloque `"jest"` eliminado de `package.json`. `jest` y `jest-environment-jsdom` desinstalados. `nodemon` desinstalado. `scripts/build.js` eliminado. `copilot-instructions.md` y `README.md` actualizados con el stack definitivo (Vitest).
Prioridad: Alta
Estado: Hecho (2026-02-23)
Tipo: Tarea técnica (limpieza)
