# Plan de migración: Vanilla JS → Svelte 5 + Vite

_Fecha: 2026-02-23_  
_Decisión: ADR-007 (Aceptado)_  
_Referencia: [docs/architecture/lit-element-assessment.md](lit-element-assessment.md)_

---

## 1. Objetivos

1. Eliminar el riesgo XSS estructural de `innerHTML` antes de integrar datos de OCR y
   Google Drive.
2. Introducir reactividad declarativa para gestionar los estados async complejos de OAuth,
   OCR/AI y Google Drive sin bugs de sincronización de UI.
3. Mantener el bundle mínimo (PWA en móvil) y el flujo `merge a main → publicar` sin
   cambios para el equipo.
4. Preservar al 100 % las capas de negocio y persistencia ya implementadas y testadas.

---

## 2. Qué no cambia

| Módulo / decisión | Impacto |
|---|---|
| `domain/measurement.js` | Sin cambios |
| `services/measurementService.js` | Sin cambios |
| `infra/localStorageAdapter.js` | Sin cambios |
| `infra/httpAdapter.js` | Sin cambios |
| `shared/validators.js` | Sin cambios |
| `shared/formatters.js` | Sin cambios |
| `shared/constants.js` | Sin cambios |
| `chart.js` (módulo D3) | Sin cambios; se importa desde el componente Svelte |
| Contrato del adaptador `getAll / save` | Sin cambios (ADR-002) |
| `deploy-pages.yml` (GitHub Actions) | Sin cambios |
| Playwright E2E | Sin cambios (ADR-004) |
| `manifest.json` + Service Worker | Reemplazado por `vite-plugin-pwa`; funcionalidad idéntica |

---

## 3. Estructura resultante

### 3.1 Árbol de directorios (tras migración completa)

```
apps/frontend/
  index.html                ← shell Vite (mínimo: <div id="app"> + <script type="module" src="/src/main.js">)
  vite.config.js            ← configuración Vite + svelte() + pwa()
  src/
    main.js                 ← punto de entrada: monta <App /> en #app, inicializa service y store
    App.svelte              ← root component: inicializa Toast, IosWarning, Router
    router.js               ← router hash-based (adaptado de router.js actual)

    domain/
      measurement.js        ← sin cambios
    services/
      measurementService.js ← sin cambios
    infra/
      localStorageAdapter.js  ← sin cambios
      httpAdapter.js          ← sin cambios
    store/
      appStore.svelte.js    ← appStore reescrito como Svelte store (~30 LOC)
      sessionStore.js       ← nuevo: estado de sesión OAuth [post-MVP]
    views/
      HomeView.svelte       ← orquesta componentes de la pantalla principal
      LoginView.svelte      ← nueva [post-MVP]
    components/
      MeasurementForm/
        MeasurementForm.svelte
        MeasurementForm.css
      MeasurementList/
        MeasurementList.svelte
      MeasurementChart/
        MeasurementChart.svelte
      Toast/
        Toast.svelte
        Toast.css
      IosWarning/
        IosWarning.svelte
        IosWarning.css
      Modal/
        Modal.svelte
        Modal.css
    shared/
      validators.js         ← sin cambios
      formatters.js         ← sin cambios
      constants.js          ← sin cambios
      eventBus.js           ← sin cambios (o sustituido por Svelte events/stores)
  tests/
    domain/                 ← sin cambios (Vitest, misma API)
    services/               ← sin cambios
    infra/                  ← sin cambios
    shared/                 ← sin cambios
    store/                  ← reescrito con Vitest (misma cobertura)
    components/             ← reescrito con Vitest + @testing-library/svelte
    e2e/                    ← sin cambios (Playwright)
```

### 3.2 Nueva estructura de `vite.config.js`

```js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: 'apps/frontend',
  base: process.env.VITE_BASE_PATH ?? '/',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      // manifest y workbox se configuran aquí — reemplaza manifest.json y sw.js manuales
    }),
  ],
});
```

> `VITE_BASE_PATH` sustituye a la variable `BASE_PATH` actual; en GitHub Actions se pasa
> como `VITE_BASE_PATH: ${{ steps.pages.outputs.base_path }}`.

### 3.3 Cambios en `package.json`

**Añadir a `dependencies` / `devDependencies`:**

```json
{
  "devDependencies": {
    "svelte": "^5.0.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "vitest": "^2.0.0",
    "@testing-library/svelte": "^5.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^25.0.0"
  }
}
```

**Cambiar scripts:**

```json
{
  "scripts": {
    "dev":            "vite",
    "build":          "vite build",
    "preview":        "vite preview",
    "test":           "vitest run",
    "test:watch":     "vitest",
    "test:coverage":  "vitest run --coverage",
    "test:e2e":       "playwright test"
  }
}
```

> Jest, `jest-environment-jsdom` y `nodemon` pasan a devDependencies opcionales o se
> eliminan según la fase de migración.

---

## 4. Plan de migración por fases

La migración es **incremental**: en cada fase la app se puede desplegar en producción.
Los componentes no migrados aún coexisten con los migrados durante la transición.

---

### Fase 0 — Integrar Vite sin migrar componentes

**Objetivo:** validar que la tubería `npm run build → dist/ → GitHub Actions` sigue
funcionando. La app sigue en Vanilla JS; Vite solo sirve los ficheros.

**Tareas técnicas:**

1. Añadir `vite`, `@sveltejs/vite-plugin-svelte`, `vite-plugin-pwa` a `devDependencies`.
2. Crear `apps/frontend/vite.config.js` con `base` configurado.
3. Ajustar `apps/frontend/index.html` para Vite (mover a raíz de `apps/frontend/`,
   convertir `<script>` a `type="module"`).
4. Reemplazar `"build": "node scripts/build.js"` por `"build": "vite build"`.
5. Ajustar `deploy-pages.yml`: cambiar `BASE_PATH` por `VITE_BASE_PATH`.
6. Verificar que `npm run build` produce `dist/` equivalente al actual.
7. Verificar que los tests Jest existentes siguen pasando (`npm test`).
8. Abrir PR, merge a main, verificar despliegue en GitHub Pages.

**Criterio de salida:** GitHub Pages sirve la misma app que hoy, construida con Vite.

---

### Fase 1 — Migrar componentes hoja

**Objetivo:** reescribir los 4 componentes sin dependencias de otros componentes propios.
Orden recomendado: `Toast` → `IosWarning` → `MeasurementList` → `MeasurementChart`.

**Por cada componente `X`:**

1. Crear `X.svelte` con `<script>`, markup declarativo y `<style>` scoped.
2. El componente recibe sus dependencias como props Svelte (`export let service`, etc.)
   o mediante el store importado directamente.
3. Eliminar el patrón `createX(el, opts)` + `mount()` / `unmount()`. En Svelte el ciclo
   de vida es `onMount` / `onDestroy` (hooks de ciclo de vida).
4. Reescribir los tests del componente con Vitest + @testing-library/svelte.
5. Actualizar la importación en `HomeView.js` (temporalmente puede mezclar Svelte y
   Vanilla; se limpiará en Fase 3).

**Patrón de componente Svelte resultante (ejemplo `Toast`):**

```svelte
<!-- Toast.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  // lógica interna con $state (Svelte 5 Runes)
  let mensaje = $state('');
  let visible = $state(false);
  let tipo    = $state('success');

  export function show(msg, t = 'success') {
    mensaje = msg;
    tipo = t;
    visible = true;
    setTimeout(() => { visible = false; }, 3000);
  }
</script>

{#if visible}
  <div class="toast toast--{tipo}" role="status">{mensaje}</div>
{/if}

<style>
  /* estilos del componente */
</style>
```

**Criterio de salida:** los 4 componentes hoja funcionan como `.svelte`; tests de
componentes en verde con Vitest.

---

### Fase 2 — Migrar componentes compuestos

**Objetivo:** reescribir `MeasurementForm` y `Modal`.

**Tareas técnicas:**

1. `MeasurementForm.svelte`: los campos del formulario se enlazan con `bind:value`. La
   validación sigue delegada en `validators.js` (sin cambios). Los errores por campo se
   gestionan con `$state` reactivo en lugar de `querySelector` + `setErrorCampo`.
2. `Modal.svelte`: el focus trap, las animaciones y el ciclo de vida de `contentFactory`
   se expresan con `onMount` / `onDestroy` y slots Svelte (`<slot />`).
3. Actualizar `HomeView.js` (aún Vanilla JS) para instanciar los nuevos `.svelte` como
   isla (usando la API de montaje programático de Svelte: `new Modal({ target, props })`).
4. Reescribir tests de `Modal` y `MeasurementForm` con Vitest + @testing-library/svelte.

**Criterio de salida:** los 6 componentes son Svelte; `HomeView` aún es Vanilla JS pero
los monta como componentes Svelte.

---

### Fase 3 — Migrar vistas, store y router

**Objetivo:** completar la migración eliminando el último código Vanilla JS de UI.

**Tareas técnicas:**

1. **`appStore.svelte.js`**: reescribir `createAppStore` como store Svelte.

   ```js
   // appStore.svelte.js
   import { writable, derived } from 'svelte/store';
   import { createMeasurementService } from '../services/measurementService.js';
   import * as adapter from '../infra/localStorageAdapter.js';

   const service = createMeasurementService(adapter);

   export const mediciones  = writable([]);
   export const cargando    = writable(false);
   export const error       = writable(null);

   export async function cargarMediciones() {
     cargando.set(true);
     error.set(null);
     try {
       mediciones.set(await service.listAll());
     } catch (e) {
       error.set(e.message);
     } finally {
       cargando.set(false);
     }
   }
   ```

   Los componentes importan directamente `mediciones`, `cargando`, `error` como stores
   reactivos. No es necesario suscribirse manualmente.

2. **`HomeView.svelte`**: reescribir como componente Svelte que importa y orquesta los
   subcomponentes ahora también Svelte.

3. **`router.js`**: adaptar el router hash-based para montar/desmontar componentes Svelte
   en lugar de instancias de función constructora.

4. **`App.svelte`** + **`main.js`**: crear el punto de entrada mínimo que monta `<App />`
   en `#app`.

5. **Eliminar** `apps/frontend/public/` y `apps/frontend/src/app.js` (reemplazados por
   `index.html` Vite + `main.js`).

6. Reescribir test de `appStore` con Vitest.

**Criterio de salida:** cero código Vanilla JS de UI. Solo queda JS puro en las capas de
dominio, servicios e infra.

---

### Fase 4 — Limpieza y consolidación de tests

**Objetivo:** cobertura de tests equivalente a la actual (≥ 70 %) con Vitest como único
runner de unitarios/integración.

**Tareas técnicas:**

1. Configurar `vitest.config.js` (puede derivar de `vite.config.js`) con entorno `jsdom`
   para los tests de componentes.
2. Verificar que todos los tests de `domain/`, `services/`, `infra/` y `shared/` pasan en
   Vitest sin cambios (misma API `describe/it/expect`).
3. Ajustar el reporting de cobertura para GitHub Actions (Vitest produce lcov por defecto,
   compatible con la configuración actual).
4. Eliminar `jest`, `jest-environment-jsdom`, `babel-jest` de `devDependencies`.
5. Eliminar `scripts/build.js` (reemplazado por `vite build`).
6. Eliminar `apps/frontend/public/sw.js` manual (reemplazado por `vite-plugin-pwa`).
7. Actualizar `README.md` y `copilot-instructions.md` con el nuevo stack.

**Criterio de salida:** `npm test` (Vitest) y `npm run test:e2e` (Playwright) en verde,
cobertura ≥ 70 %, cero referencias a Jest en el repositorio.

---

## 5. Estrategia de coexistencia durante la migración

Durante las fases 1 y 2, Vanilla JS y Svelte coexisten:

```
app.js (Vanilla JS)
  └── router.js (Vanilla JS)
        └── HomeView.js (Vanilla JS)
              ├── Toast.svelte          ← migrado Fase 1
              ├── IosWarning.svelte     ← migrado Fase 1
              ├── MeasurementList.svelte ← migrado Fase 1
              ├── MeasurementChart.svelte ← migrado Fase 1
              ├── MeasurementForm.svelte  ← migrado Fase 2
              └── Modal.svelte          ← migrado Fase 2
```

Los componentes Svelte se montan programáticamente desde `HomeView.js` usando la API de
montaje de Svelte 5 (`mount(Component, { target, props })`). Esto elimina la necesidad de
un paso de refactorización "big bang".

---

## 6. Gestión de la seguridad durante la migración

| Momento | Acción |
|---|---|
| **Antes de Fase 1** | Documentar los puntos de `innerHTML` actuales con riesgo XSS: `MeasurementList.mostrarLista()`, `MeasurementForm.mount()`. No introducir nuevos `innerHTML` en ningún componente hasta que ese componente esté migrado a Svelte. |
| **Durante Fase 1** | `MeasurementList.svelte` elimina el `innerHTML` y pasa a usar `{#each}`. El riesgo XSS en la lista desaparece. |
| **Durante Fase 2** | `MeasurementForm.svelte` elimina el `innerHTML` del formulario. |
| **Antes de implementar OCR/AI** | La Fase 2 debe estar completa para que los datos externos nunca pasen por `innerHTML`. |

---

## 7. Plan para el Product Owner — ítems de backlog propuestos

Esta sección propone los ítems de backlog que el PO necesita para planificar los próximos
sprints. Están ordenados por dependencia técnica.

> El PO decide el **sprint de ejecución**, la **prioridad definitiva** y el **contenido
> exacto** de cada user story. Estos ítems son propuestas del arquitecto basadas en las
> dependencias técnicas identificadas.

---

### Épica: Migración a Svelte 5 + Vite (fundación técnica)

**Objetivo de la épica:** preparar el frontend para soportar OAuth, OCR/AI y Google Drive
con un stack seguro, reactivo y mantenible.

---

#### BK-24 — Fase 0: Integrar Vite como build tool

**Tipo:** Tarea técnica (enabler)  
**Estimación:** 1-2 jornadas  
**Dependencias:** ninguna

**Descripción:**  
Sustituir `scripts/build.js` por `vite build` sin migrar ningún componente. Verificar que
el flujo `merge a main → GitHub Actions → GitHub Pages` sigue produciendo la misma app.

**Criterios de aceptación:**
- [ ] `npm run build` usa Vite y produce `dist/` equivalente al actual.
- [ ] `deploy-pages.yml` funciona sin cambiar el YAML.
- [ ] Todos los tests existentes siguen pasando.
- [ ] La app desplegada en GitHub Pages es funcionalmente idéntica a la versión anterior.
- [ ] `vite dev` arranca el servidor de desarrollo local.

---

#### BK-25 — Fase 1: Migrar componentes hoja a Svelte

**Tipo:** Tarea técnica (enabler)  
**Estimación:** 3-4 jornadas  
**Dependencias:** BK-24

**Descripción:**  
Reescribir `Toast`, `IosWarning`, `MeasurementList` y `MeasurementChart` como Single File
Components `.svelte`. Reescribir sus tests con Vitest + @testing-library/svelte.

**Criterios de aceptación:**
- [ ] Los 4 componentes funcionan como `.svelte` montados desde `HomeView.js` (aún Vanilla JS).
- [ ] Ninguno de los 4 componentes usa `innerHTML` con datos externos.
- [ ] Tests de los 4 componentes en verde con Vitest; cobertura ≥ 70 %.
- [ ] Sin regresiones en tests E2E (Playwright).

---

#### BK-26 — Fase 2: Migrar MeasurementForm y Modal a Svelte

**Tipo:** Tarea técnica (enabler)  
**Estimación:** 2-3 jornadas  
**Dependencias:** BK-25

**Descripción:**  
Reescribir `MeasurementForm` y `Modal` como `.svelte`. Tras esta fase, ningún componente
usa `innerHTML` con datos externos; el riesgo XSS queda eliminado de la UI.

**Criterios de aceptación:**
- [ ] `MeasurementForm.svelte` valida campos igual que la versión actual.
- [ ] `Modal.svelte` mantiene focus trap, animaciones y accesibilidad (`aria-modal`).
- [ ] Sin `innerHTML` con datos de usuario en ningún componente.
- [ ] Tests de `MeasurementForm` y `Modal` en verde con Vitest.
- [ ] Suite E2E completa en verde.

---

#### BK-27 — Fase 3: Migrar vistas, store y router a Svelte

**Tipo:** Tarea técnica (enabler)  
**Estimación:** 2-3 jornadas  
**Dependencias:** BK-26

**Descripción:**  
Reescribir `appStore`, `HomeView`, `router` y crear `App.svelte` + `main.js`. Eliminar el
último código Vanilla JS de UI. Migrar `appStore` test a Vitest.

**Criterios de aceptación:**
- [ ] `main.js` monta `<App />` en `#app`; cero Vanilla JS en la capa de UI.
- [ ] El store reactivo Svelte sustituye a `createAppStore` sin cambiar el comportamiento.
- [ ] El router hash-based funciona para la ruta `/` y estructura para futuras rutas.
- [ ] Tests del store en verde con Vitest.
- [ ] Suite E2E completa en verde.

---

#### BK-28 — Fase 4: Consolidar tests y limpiar dependencias

**Tipo:** Tarea técnica de limpieza  
**Estimación:** 2 jornadas  
**Dependencias:** BK-27

**Descripción:**  
Vitest como único runner de tests unitarios/integración. Eliminar Jest y `scripts/build.js`.
Migrar `vite-plugin-pwa` para reemplazar `sw.js` manual. Actualizar documentación.

**Criterios de aceptación:**
- [ ] `npm test` usa Vitest; cero referencias a Jest en el repositorio.
- [ ] Cobertura total ≥ 70 % con Vitest.
- [ ] `sw.js` manual reemplazado por `vite-plugin-pwa`; PWA sigue instalable en Android e iOS.
- [ ] `copilot-instructions.md` y `README.md` actualizados con el nuevo stack.
- [ ] `scripts/build.js` eliminado.

---

### Épica: Login con Google (OAuth 2.0 + PKCE)

> ⚠️ **Dependencia técnica**: esta épica requiere que BK-26 esté completado (sin
> `innerHTML` en componentes de UI) y BK-27 completado (router Svelte con suporte de
> rutas protegidas).

**Objetivo:** el usuario puede autenticarse con su cuenta de Google para persistir sus
datos en Google Drive y acceder desde cualquier dispositivo.

---

#### BK-29 — Vista de login y flujo PKCE client-side

**Tipo:** Feature  
**Estimación:** 3-4 jornadas  
**Dependencias:** BK-27

**Descripción:**  
Implementar el flujo de autorización OAuth 2.0 con PKCE completamente en el cliente:
generación del `code_verifier`/`code_challenge`, redirección a Google, recepción del
código de autorización en la URL de callback, intercambio por token (vía proxy backend),
almacenamiento seguro del token.

**Criterios de aceptación:**
- [ ] El usuario puede hacer login con Google desde la app.
- [ ] El `code_verifier` nunca sale del cliente.
- [ ] El `client_secret` nunca llega al cliente (reside en el proxy backend).
- [ ] El token se almacena en `sessionStorage` (no `localStorage`) para limitar la superficie.
- [ ] El usuario autenticado ve su nombre/foto en la UI.
- [ ] La ruta `/` es accesible sin login (usuario anónimo).

---

#### BK-30 — Backend: endpoint proxy OAuth

**Tipo:** Feature (backend)  
**Estimación:** 1-2 jornadas  
**Dependencias:** BK-29

**Descripción:**  
Añadir un endpoint `POST /auth/token` al backend Express que recibe el `code` y el
`code_verifier` del cliente, realiza el intercambio con Google (usando `client_secret`
guardado en variable de entorno) y devuelve los tokens al cliente.

**Criterios de aceptación:**
- [ ] `client_secret` solo existe en variables de entorno del servidor; no aparece en el bundle.
- [ ] El endpoint acepta `{ code, code_verifier, redirect_uri }` y devuelve `{ access_token, refresh_token, expires_in }`.
- [ ] Tests unitarios del endpoint en verde.
- [ ] El endpoint no almacena tokens en base de datos.

---

#### BK-31 — Rutas protegidas y persistencia condicional de adaptador

**Tipo:** Feature  
**Estimación:** 2 jornadas  
**Dependencias:** BK-29, BK-30

**Descripción:**  
Implementar `sessionStore` en Svelte para distribuir el estado de sesión. Lógica de
selección de adaptador: usuario anónimo → `localStorageAdapter`; usuario autenticado →
`googleDriveAdapter`. Incluir flujo de migración de datos: al hacer login por primera vez,
ofrecer importar las mediciones de `localStorage` a Google Drive.

**Criterios de aceptación:**
- [ ] El servicio `measurementService` recibe el adaptador correcto según el estado de sesión.
- [ ] Al hacer login con mediciones existentes en `localStorage`, se propone importarlas.
- [ ] Al cerrar sesión, los datos de Google Drive no quedan accesibles sin autenticación.
- [ ] El cambio de adaptador no requiere recargar la página.

---

### Épica: OCR / AI — Lectura de imagen de tensiómetro

> ⚠️ **Dependencia técnica**: esta épica requiere BK-26 completado (cero `innerHTML` con
> datos externos, ya que el texto extraído por OCR es un dato externo no confiable).

**Objetivo:** el usuario puede fotografiar su tensiómetro y la app extrae y prerrellena
los valores automáticamente, mostrándolos para corrección antes de guardar.

---

#### BK-32 — UI: componente de captura de imagen

**Tipo:** Feature  
**Estimación:** 2-3 jornadas  
**Dependencias:** BK-26

**Descripción:**  
Nuevo componente `ImageCapture.svelte` que permite al usuario seleccionar una foto desde
la galería o capturar con la cámara. Gestiona los estados del flujo: `idle` → `capturada`
→ `enviando` → `procesando` → `confirmando` → `error`.

**Criterios de aceptación:**
- [ ] El usuario puede seleccionar una imagen desde su dispositivo.
- [ ] En móvil, el input `<input type="file" accept="image/*" capture>` abre la cámara.
- [ ] Los estados del flujo se muestran en la UI con mensajes claros.
- [ ] Ningún dato de la imagen se muestra con `innerHTML`.

---

#### BK-33 — Backend: endpoint OCR + integración AI

**Tipo:** Feature (backend)  
**Estimación:** 3-4 jornadas  
**Dependencias:** BK-32

**Descripción:**  
Añadir endpoint `POST /ocr` al backend Express que recibe la imagen (multipart/form-data),
la envía a la API de AI elegida (p.ej. Google Cloud Vision, OpenAI Vision, Tesseract local)
y devuelve `{ systolic, diastolic, pulse }` extraídos.

**Criterios de aceptación:**
- [ ] El endpoint acepta `multipart/form-data` con el campo `image`.
- [ ] Devuelve `{ systolic, diastolic, pulse }` o un error descriptivo si no se reconocen valores.
- [ ] Los valores devueltos son números enteros positivos validados antes de devolverse.
- [ ] La API key del servicio de AI se gestiona como variable de entorno del servidor.
- [ ] Tests unitarios del endpoint con imagen de prueba.

---

#### BK-34 — Integración OCR en el formulario de registro

**Tipo:** Feature  
**Estimación:** 2 jornadas  
**Dependencias:** BK-32, BK-33

**Descripción:**  
Integrar `ImageCapture.svelte` en el flujo de `MeasurementForm.svelte`: tras el
reconocimiento, los valores se prerrellanan en el formulario y el usuario puede
corregirlos antes de guardar. La ruta de guardado es la misma que el registro manual.

**Criterios de aceptación:**
- [ ] Los valores extraídos por OCR aparecen en los campos del formulario.
- [ ] El usuario puede corregir cualquier valor antes de guardar.
- [ ] Si el OCR falla, el formulario queda vacío y se muestra un mensaje de error.
- [ ] El guardado final usa el mismo flujo de validación que el registro manual.

---

## 8. Cronograma orientativo

| Sprint | BKs | Descripción | Resultado |
|---|---|---|---|
| Sprint N (actual) | — | MVP completo en producción | App funcionando en GitHub Pages |
| Sprint N+1 | BK-24, BK-25 | Vite + componentes hoja | Build pipeline migrado; 4 componentes en Svelte |
| Sprint N+2 | BK-26, BK-27 | Componentes compuestos + vistas | UI 100 % Svelte; XSS eliminado |
| Sprint N+3 | BK-28 | Limpieza de tests y dependencias | Vitest único runner; PWA con `vite-plugin-pwa` |
| Sprint N+4 | BK-29, BK-30 | OAuth client-side + proxy backend | Login con Google funcional |
| Sprint N+5 | BK-31 | Google Drive adapter + migración de datos | Datos sincronizados multi-dispositivo |
| Sprint N+6 | BK-32, BK-33 | UI de captura + endpoint OCR/AI | Captura de imagen con reconocimiento |
| Sprint N+7 | BK-34 | Integración OCR en formulario | Registro por foto completo |

> El cronograma es orientativo. El PO puede reordenar sprints excepto donde hay dependencias
> técnicas obligatorias (indicadas en cada ítem de backlog).

---

## 9. Preguntas para el Product Owner

Las siguientes decisiones son necesarias antes o durante la planificación:

| # | Pregunta | Impacto técnico |
|---|---|---|
| 1 | ¿La app con login debe seguir funcionando sin login (modo anónimo)? | Condiciona el diseño del router y del flujo de selección de adaptador (BK-31) |
| 2 | ¿El usuario puede tener ambos modos activos simultáneamente (datos locales + datos en Drive)? | Afecta al flujo de migración de datos en BK-31 |
| 3 | ¿Se requiere logout con borrado de datos locales? | Afecta al flujo de cierre de sesión (BK-31) |
| 4 | ¿Qué proveedor de AI/OCR se prefiere? (Google Cloud Vision, OpenAI Vision, Tesseract local…) | Determina el coste operacional del endpoint OCR (BK-33) |
| 5 | ¿Debe el endpoint OCR funcionar sin autenticación o solo para usuarios con login? | Condiciona si BK-33 depende de BK-29 o puede desarrollarse en paralelo |

---

_Ver también: [ADR-007](decisions.md#adr-007-migración-del-frontend-a-svelte-5--vite) · [lit-element-assessment.md](lit-element-assessment.md) · [system-overview.md](system-overview.md)_
