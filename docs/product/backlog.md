# Backlog — Tensia · Pendiente

_Última revisión: 2026-02-23._

> Los ítems ya implementados están en [backlog-done.md](backlog-done.md).

---

## Épica: Migración a Svelte 5 + Vite (fundación técnica)

**Objetivo:** preparar el frontend para soportar OAuth, OCR/AI y Google Drive con un stack seguro, reactivo y mantenible. Eliminar el riesgo XSS estructural de `innerHTML` antes de integrar datos externos.

> Referencia técnica completa: `docs/architecture/svelte-migration-plan.md` (ADR-007).

---

**BK-24 — Fase 0: Integrar Vite como build tool**
Descripción: Sustituir `scripts/build.js` por `vite build` sin migrar ningún componente a Svelte. Verificar que el flujo `merge a main → GitHub Actions → GitHub Pages` sigue produciendo la misma app. Los componentes siguen siendo Vanilla JS; Vite solo toma el rol de bundler y servidor de desarrollo. Como efecto secundario necesario, `vite-plugin-pwa` reemplaza el `sw.js` manual porque el Service Worker actual tiene URLs hardcodeadas a `/src/app.js`, `/src/router.js`, etc., que dejan de existir individualmente al bundlear.
Prioridad: Alta
Estimación: 1-2 jornadas
Dependencias: ninguna
Estado: Pendiente
Tipo: Tarea técnica (enabler)
Referencia técnica: `docs/architecture/svelte-migration-plan.md` §§ 3.2, 3.3, 4 (Fase 0)

---

### Contexto técnico

**¿Por qué Vite y no seguir con `scripts/build.js`?**
El build actual copia ficheros sin transformar. Para poder montar componentes Svelte (fases 1-3) necesitamos un bundler con soporte de `.svelte`. Vite es el bundler oficial del ecosistema Svelte y el elegido en ADR-007.

**Problema con el `sw.js` manual:**
El SW actual lista explícitamente rutas como `/src/app.js`, `/src/chart.js`, etc. Cuando Vite bundlea la app, esos ficheros se emiten a `dist/assets/app-[hash].js` y ya no existen en esas rutas. Por tanto el SW falla al intentar precargar la caché. La solución es `vite-plugin-pwa` (Workbox): genera el SW automáticamente con las URLs reales del bundle de cada build.

**D3 y el importmap CDN:**
El `importmap` en `index.html` redirige `d3-selection`, `d3-scale`, etc., a jsDelivr porque la app actual no tiene bundler. Con Vite, el bundler resuelve esos imports desde `node_modules` (las dependencias D3 ya están en `package.json`). El `importmap` se elimina.

---

### Tareas técnicas (ordenadas)

#### 1. Instalar dependencias

```bash
npm install --save-dev vite @sveltejs/vite-plugin-svelte vite-plugin-pwa
```

> `@sveltejs/vite-plugin-svelte` se instala ahora pero no se configura hasta BK-25. Su presencia no rompe nada en Phase 0.

#### 2. Crear `vite.config.js` en la raíz del repositorio

```js
// vite.config.js  (raíz del repo — junto a package.json)
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: 'apps/frontend',           // index.html vive aquí tras el paso 3
  base: process.env.VITE_BASE_PATH ?? '/',
  build: {
    outDir: '../../dist',          // relativo al root → dist/ en la raíz del repo
    emptyOutDir: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // manifest.json manual: lo gestionamos nosotros (en public/)
      manifest: false,
      workbox: {
        // Precachear todos los assets generados por Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
    }),
  ],
});
```

> El plugin `svelte()` se añadirá en BK-25. En Phase 0 no se incluye para no confundir al desarrollador.

#### 3. Mover `index.html` al root de Vite

Vite exige que `index.html` esté en `root` (`apps/frontend/`). El directorio `apps/frontend/public/` pasa a ser el directorio de activos estáticos de Vite (se copia tal cual a `dist/`).

```bash
mv apps/frontend/public/index.html apps/frontend/index.html
```

A continuación, aplicar estos cambios en el fichero movido `apps/frontend/index.html`:

**a) Eliminar el bloque `<script type="importmap">` completo** (D3 pasa a resolverse desde `node_modules` por Vite):

```diff
-    <script type="importmap">
-    {
-      "imports": {
-        "d3-selection": "https://cdn.jsdelivr.net/npm/d3-selection@3/+esm",
-        "d3-scale":     "https://cdn.jsdelivr.net/npm/d3-scale@4/+esm",
-        "d3-axis":      "https://cdn.jsdelivr.net/npm/d3-axis@3/+esm",
-        "d3-shape":     "https://cdn.jsdelivr.net/npm/d3-shape@3/+esm"
-      }
-    }
-    </script>
```

**b) El tag `<script type="module" src="src/app.js">` se conserva** — Vite lo considera el entry point y lo bundlea.

**c) Eliminar el bloque de registro manual del Service Worker** — `vite-plugin-pwa` con `registerType: 'autoUpdate'` lo inyecta automáticamente en el bundle:

```diff
-    <script>
-      if ('serviceWorker' in navigator) {
-        navigator.serviceWorker.register('/sw.js').catch((err) => {
-          console.warn('[Tensia] No se pudo registrar el Service Worker:', err);
-        });
-      }
-    </script>
```

**d) Ajustar la referencia a la hoja de estilos** — `styles/main.css` vive en `public/styles/`, Vite lo copia sin transformar, la ruta sigue siendo válida:

```html
<!-- sin cambios -->
<link rel="stylesheet" href="styles/main.css" />
```

#### 4. Eliminar `apps/frontend/public/sw.js`

`vite-plugin-pwa` genera `dist/sw.js` automáticamente. Si se deja el manual en `public/`, Vite lo copiará a `dist/sw.js` **sobrescribiendo** el generado por Workbox. Se debe eliminar:

```bash
rm apps/frontend/public/sw.js
```

> Si hay tests que importan `sw.js` directamente, eliminarlos o adaptarlos (el SW generado por Workbox no es testeable unitariamente).

#### 5. Actualizar scripts en `package.json`

```diff
  "scripts": {
    "start": "SERVE_STATIC=true OPEN_BROWSER=true node apps/backend/src/index.js",
-   "dev":   "SERVE_STATIC=true OPEN_BROWSER=true nodemon apps/backend/src/index.js",
+   "dev":   "vite",
    "build": "vite build",
+   "preview": "vite preview",
    "test":           "node --experimental-vm-modules node_modules/.bin/jest",
    "test:coverage":  "node --experimental-vm-modules node_modules/.bin/jest --coverage",
    "test:e2e":       "playwright test"
  }
```

> `nodemon` sigue en `devDependencies` (se elimina en BK-28). El servidor Express con `npm start` sigue disponible para stubs de API locales si se necesita.
>
> `vite` arranca el servidor de desarrollo en `http://localhost:5173` sirviendo `apps/frontend/` como raíz.

#### 6. Actualizar `deploy-pages.yml`

Cambiar la variable de entorno en el paso _"Build del sitio estático"_:

```diff
      - name: Build del sitio estático
        run: npm run build
        env:
-         BASE_PATH: ${{ steps.pages.outputs.base_path }}
-         BUILD_ID: ${{ github.sha }}
+         VITE_BASE_PATH: ${{ steps.pages.outputs.base_path }}
```

> `BUILD_ID` ya no es necesario: Vite genera nombres de fichero con hash de contenido (`app-[hash].js`), lo que invalida la caché del navegador automáticamente.

#### 7. Verificación local antes de abrir PR

```bash
# Build limpio
npm run build

# Comprobar que dist/ tiene la estructura esperada:
#   dist/index.html
#   dist/assets/app-[hash].js
#   dist/assets/[hash].css  (si extrae CSS)
#   dist/manifest.json
#   dist/sw.js              ← generado por vite-plugin-pwa
#   dist/styles/main.css    ← copiado de public/
#   dist/icons/             ← copiado de public/
ls -R dist/

# Vista previa local del build (no el servidor Express)
npm run preview

# Tests Jest (deben seguir en verde sin cambios)
npm test

# Tests E2E contra el preview server (ajustar baseURL en playwright.config.js si apunta a :3000)
npm run test:e2e
```

---

### Posibles problemas y soluciones

| Problema | Causa | Solución |
|---|---|---|
| SW no precachea nada | `globPatterns` no coincide con la salida de Vite | Inspeccionar `dist/` y ajustar el patrón en `workbox.globPatterns` |
| Error `Cannot find module 'd3-selection'` en Jest | Jest no usa Vite; necesita resolver D3 de `node_modules` | Asegurarse de que D3 está en `dependencies` (ya lo está); el `moduleNameMapper` de Jest no debe interferir |
| Playwright falla con `ERR_CONNECTION_REFUSED` | `baseURL` en `playwright.config.js` apunta a `:3000` (Express) pero `vite preview` usa `:4173` | Actualizar `baseURL` o arrancar el Preview server en el puerto correcto con `--port 3000` |
| `start_url` incorrecto en GitHub Pages | `manifest.json` tiene `start_url: "/"` sin el base path | Añadir `manifest: { start_url: '/' }` en la config de `VitePWA` y dejar que Vite ajuste el `base` — o parchear manualmente `manifest.json` como hacía `scripts/build.js` |
| `public/sw.js` sobrescribe el SW generado | El fichero manual sigue en `public/` | Confirmar que se ha eliminado en el paso 4 |

---

### Criterios de aceptación

- [ ] `npm run build` usa Vite y produce `dist/` con `index.html`, `assets/app-[hash].js`, `sw.js` (generado por Workbox) y los activos estáticos de `public/`.
- [ ] `npm run preview` sirve la app en local y esta funciona igual que la versión actual (registro manual, listado, gráfica, aviso iOS).
- [ ] `deploy-pages.yml` despliega sin cambiar la lógica del YAML (solo la variable de entorno).
- [ ] La app desplegada en GitHub Pages es funcionalmente idéntica a la versión anterior (PWA instalable, uso offline, `start_url` correcto).
- [ ] Todos los tests Jest existentes siguen pasando (`npm test`).
- [ ] Los tests E2E Playwright pasan contra el build de Vite.
- [ ] `vite` (`npm run dev`) arranca el servidor de desarrollo en `:5173` sin errores.
- [ ] No hay referencias a `scripts/build.js` en ningún script activo (puede mantenerse como fichero histórico hasta BK-28).

---

**BK-25 — Fase 1: Migrar componentes hoja a Svelte**

**Descripción:**
Reescribir los 4 componentes sin dependencias de otros componentes propios como Single File Components (`.svelte`) con Svelte 5 Runes.
Orden de migración: `Toast` → `IosWarning` → `MeasurementList` → `MeasurementChart`.

Los componentes dejan de usar el patrón `createX(el, opts)` + `mount()` / `unmount()` de Vanilla JS. El ciclo de vida pasa a `onMount` / `onDestroy` de Svelte. En esta fase `HomeView.js` sigue siendo Vanilla JS y monta los nuevos `.svelte` mediante la API programática de Svelte 5: `mount(Component, { target, props })`.

Para cada componente se deben reescribir también sus tests: de Jest + jsdom a Vitest + `@testing-library/svelte`.

Prioridad: Alta
Estimación: 3-4 jornadas
Dependencias: BK-24
Estado: Pendiente
Tipo: Tarea técnica (enabler)
Referencia técnica: `docs/architecture/svelte-migration-plan.md` § 3.3 (Fase 1)

---

#### Subtareas técnicas

**1. Instalar dependencias de test (si no están ya en BK-24)**
```bash
npm install --save-dev @testing-library/svelte vitest jsdom
```

**2. `Toast.svelte`** (80 líneas actuales en `Toast.js`)
- Estado interno: `mensaje`, `visible`, `tipo` → `$state` de Svelte 5.
- Exponer `show(msg, tipo = 'success')` como función pública del componente.
- Autoocultarse tras 3 s con `setTimeout` dentro de `show`.
- Los estilos de `Toast.css` pasan a `<style>` scoped del SFC.
- El subscriptor de `eventBus` ('toast:show') puede mantenerse en un `onMount` o eliminarse si `HomeView` llama directamente a `show`.

**3. `IosWarning.svelte`** (60 líneas actuales en `IosWarning.js`)
- Prop `show: boolean`; la lógica de detección de Safari/iOS (`navigator.userAgent`) se mantiene en el componente o se extrae a `shared/`.
- `{#if show}` reemplaza al `classList.toggle` manual.
- Los estilos de `IosWarning.css` pasan a `<style>` scoped.

**4. `MeasurementList.svelte`** (161 líneas actuales en `MeasurementList.js`)
- Eliminar el `innerHTML` con plantilla de filas (**riesgo XSS eliminado en esta fase**).
- Prop `measurements: Measurement[]`; usar `{#each measurements as m}` para renderizar la tabla.
- Emitir evento `eliminar` al padre mediante `createEventDispatcher()` o callback prop.
- Los estilos actuales del componente pasan a `<style>` scoped.

**5. `MeasurementChart.svelte`** (93 líneas actuales en `MeasurementChart.js`)
- Prop `measurements: Measurement[]`.
- Renderizado D3 dentro de `onMount` (acceso a DOM) y actualizado con `$effect` cuando el prop cambia.
- La lógica D3 de `chart.js` puede permanecer separada; el componente la invoca pasando el elemento SVG/contenedor.
- Los estilos del gráfico pasan a `<style>` scoped o a `MeasurementChart.css` (CSS global si D3 necesita selectores no scoped).

**6. Actualizar `HomeView.js`**
- Sustituir cada `createX(el, opts)` + `.mount()` por `import { mount } from 'svelte'; mount(XComponent, { target: el, props: {...} })`.
- Los 4 componentes se montan como islas Svelte dentro de la vista Vanilla JS.

**7. Migrar tests de los 4 componentes**
- Ficheros actuales en `apps/frontend/tests/components/` (Jest): `Toast.test.js`, `IosWarning.test.js`, `MeasurementList.test.js`, `MeasurementChart.test.js`.
- Reescribir con Vitest + `@testing-library/svelte`: `render`, `screen`, `fireEvent`, `waitFor`.
- Eliminar las importaciones de Jest globals; usar `import { describe, it, expect } from 'vitest'`.

---

#### Criterios de aceptación

- [ ] `Toast.svelte`, `IosWarning.svelte`, `MeasurementList.svelte` y `MeasurementChart.svelte` existen en sus respectivos directorios de `components/`.
- [ ] `HomeView.js` monta los 4 componentes mediante la API programática de Svelte 5 (`mount`).
- [ ] `MeasurementList.svelte` y cualquier otro componente migrado no usan `innerHTML` con datos de usuario.
- [ ] Los 4 archivos `.js` originales pueden coexistir temporalmente (se eliminan en BK-28), pero no se usan en el flujo de producción.
- [ ] Tests de los 4 componentes pasan con Vitest; cobertura de los componentes migrados ≥ 70 %.
- [ ] `npm test` (Vitest, coexistencia con Jest si aún no se migró todo) y `npm run test:e2e` (Playwright) en verde sin regresiones.

---

**BK-26 — Fase 2: Migrar MeasurementForm y Modal a Svelte**
Descripción: Reescribir `MeasurementForm` y `Modal` como `.svelte`. Tras esta fase, ningún componente usa `innerHTML` con datos externos; el riesgo XSS queda eliminado de la UI. `MeasurementForm.svelte` usa `bind:value`; `Modal.svelte` gestiona focus trap, animaciones y ciclo de vida con `onMount`/`onDestroy` y `<slot />`.
Prioridad: Alta
Estimación: 2-3 jornadas
Dependencias: BK-25
Estado: Pendiente
Tipo: Tarea técnica (enabler)

Criterios de aceptación:
- [ ] `MeasurementForm.svelte` valida campos igual que la versión actual.
- [ ] `Modal.svelte` mantiene focus trap, animaciones y accesibilidad (`aria-modal`).
- [ ] Sin `innerHTML` con datos de usuario en ningún componente.
- [ ] Tests de `MeasurementForm` y `Modal` en verde con Vitest.
- [ ] Suite E2E completa en verde.

> ⚠️ **Prerrequisito para OCR/AI (BK-32):** esta fase debe estar completa antes de integrar datos externos de OCR.

---

**BK-27 — Fase 3: Migrar vistas, store y router a Svelte**
Descripción: Reescribir `appStore` como Svelte store (`writable`/`derived`), `HomeView` como `HomeView.svelte`, adaptar `router.js` para montar componentes Svelte, y crear `App.svelte` + `main.js` como nuevo punto de entrada. Eliminar el último código Vanilla JS de UI.
Prioridad: Alta
Estimación: 2-3 jornadas
Dependencias: BK-26
Estado: Pendiente
Tipo: Tarea técnica (enabler)

Criterios de aceptación:
- [ ] `main.js` monta `<App />` en `#app`; cero Vanilla JS en la capa de UI.
- [ ] El store reactivo Svelte sustituye a `createAppStore` sin cambiar el comportamiento observable.
- [ ] El router hash-based funciona para la ruta `#/` y está preparado para rutas protegidas.
- [ ] Tests del store en verde con Vitest.
- [ ] Suite E2E completa en verde.

> ⚠️ **Prerrequisito para OAuth (BK-29):** esta fase debe estar completa para soportar rutas protegidas.

---

**BK-28 — Fase 4: Consolidar tests y limpiar dependencias**
Descripción: Vitest como único runner de tests unitarios/integración. Eliminar Jest, `jest-environment-jsdom`, `babel-jest` y `scripts/build.js`. Migrar `vite-plugin-pwa` para reemplazar `sw.js` manual. Actualizar `README.md` y `copilot-instructions.md` con el nuevo stack.
Prioridad: Alta
Estimación: 2 jornadas
Dependencias: BK-27
Estado: Pendiente
Tipo: Tarea técnica (limpieza)

Criterios de aceptación:
- [ ] `npm test` usa Vitest; cero referencias a Jest en el repositorio.
- [ ] Cobertura total ≥ 70 % con Vitest.
- [ ] `sw.js` manual reemplazado por `vite-plugin-pwa`; PWA sigue instalable en Android e iOS.
- [ ] `copilot-instructions.md` y `README.md` actualizados con el nuevo stack.
- [ ] `scripts/build.js` eliminado.

---

## Épica: Login con Google (OAuth 2.0 + PKCE)

**Objetivo:** el usuario puede autenticarse con su cuenta de Google para persistir sus datos en Google Drive y acceder desde cualquier dispositivo.

> ⚠️ **Dependencia técnica:** requiere BK-26 completado (sin `innerHTML`) y BK-27 completado (router Svelte con soporte de rutas protegidas).

---

**BK-29 — Vista de login y flujo OAuth 2.0 PKCE client-side**
Descripción: Implementar el flujo de autorización OAuth 2.0 con PKCE completamente en el cliente: generación de `code_verifier`/`code_challenge`, redirección a Google, recepción del código de autorización en la URL de callback, intercambio por token (vía proxy backend), almacenamiento del token en `sessionStorage`.
Prioridad: Media
Estimación: 3-4 jornadas
Dependencias: BK-27
Estado: Pendiente
Tipo: Feature

Criterios de aceptación:
- [ ] El usuario puede hacer login con Google desde la app.
- [ ] El `code_verifier` nunca sale del cliente.
- [ ] El `client_secret` nunca llega al cliente (reside en el proxy backend).
- [ ] El token se almacena en `sessionStorage` (no `localStorage`) para limitar la superficie de exposición.
- [ ] El usuario autenticado ve su nombre/foto en la UI.
- [ ] La ruta `#/` es accesible sin login (usuario anónimo).

---

**BK-30 — Backend: endpoint proxy OAuth (`POST /auth/token`)**
Descripción: Añadir endpoint `POST /auth/token` al backend Express que recibe `{ code, code_verifier, redirect_uri }` del cliente, realiza el intercambio con Google usando `client_secret` (variable de entorno) y devuelve `{ access_token, refresh_token, expires_in }`. El endpoint no almacena tokens.
Prioridad: Media
Estimación: 1-2 jornadas
Dependencias: BK-29
Estado: Pendiente
Tipo: Feature (backend)

Criterios de aceptación:
- [ ] `client_secret` solo existe en variables de entorno del servidor; no aparece en el bundle.
- [ ] El endpoint acepta `{ code, code_verifier, redirect_uri }` y devuelve `{ access_token, refresh_token, expires_in }`.
- [ ] Tests unitarios del endpoint en verde.
- [ ] El endpoint no almacena tokens en base de datos.

---

**BK-31 — Rutas protegidas y persistencia condicional de adaptador**
Descripción: Implementar `sessionStore` en Svelte para distribuir el estado de sesión. Lógica de selección de adaptador: usuario anónimo → `localStorageAdapter`; usuario autenticado → `googleDriveAdapter`. Incluir flujo de migración de datos al hacer login por primera vez (importar mediciones de `localStorage` a Google Drive).
Prioridad: Media
Estimación: 2 jornadas
Dependencias: BK-29, BK-30
Estado: Pendiente
Tipo: Feature

Criterios de aceptación:
- [ ] `measurementService` recibe el adaptador correcto según el estado de sesión.
- [ ] Al hacer login con mediciones existentes en `localStorage`, se propone importarlas a Google Drive.
- [ ] Al cerrar sesión, los datos de Google Drive no quedan accesibles sin autenticación.
- [ ] El cambio de adaptador no requiere recargar la página.

---

## Épica: OCR / AI — Lectura de imagen de tensiómetro

**Objetivo:** el usuario puede fotografiar su tensiómetro y la app extrae y prerrellena los valores automáticamente, mostrándolos para corrección antes de guardar.

> ⚠️ **Dependencia técnica:** requiere BK-26 completado (cero `innerHTML` con datos externos; el texto extraído por OCR es un dato externo no confiable).

---

**BK-32 — UI: componente de captura de imagen**
Descripción: Nuevo componente `ImageCapture.svelte` que permite seleccionar una foto desde la galería o capturar con la cámara (`<input type="file" accept="image/*" capture>`). Gestiona los estados del flujo: `idle` → `capturada` → `enviando` → `procesando` → `confirmando` → `error`.
Prioridad: Alta (cuando se abra el sprint)
Estimación: 2-3 jornadas
Dependencias: BK-26
Estado: Pendiente
Tipo: Feature
Referencia: US-02

Criterios de aceptación:
- [ ] El usuario puede seleccionar una imagen desde su dispositivo.
- [ ] En móvil, el input abre la cámara directamente.
- [ ] Los estados del flujo se muestran en la UI con mensajes claros.
- [ ] Ningún dato de la imagen se muestra con `innerHTML`.

---

**BK-33 — Backend: endpoint OCR + integración AI (`POST /ocr`)**
Descripción: Añadir endpoint `POST /ocr` al backend Express que recibe la imagen (multipart/form-data), la envía al servicio de AI elegido y devuelve `{ systolic, diastolic, pulse }`. La API key del servicio de AI se gestiona como variable de entorno.
Prioridad: Alta (cuando se abra el sprint)
Estimación: 3-4 jornadas
Dependencias: BK-32
Estado: Pendiente
Tipo: Feature (backend)
Referencia: US-02

Criterios de aceptación:
- [ ] El endpoint acepta `multipart/form-data` con el campo `image`.
- [ ] Devuelve `{ systolic, diastolic, pulse }` o un error descriptivo si no se reconocen valores.
- [ ] Los valores devueltos son números enteros positivos validados antes de devolverse.
- [ ] La API key del servicio de AI se gestiona como variable de entorno del servidor.
- [ ] Tests unitarios del endpoint con imagen de prueba.

---

**BK-34 — Integración OCR en el formulario de registro**
Descripción: Integrar `ImageCapture.svelte` en el flujo de `MeasurementForm.svelte`: tras el reconocimiento, los valores se prerrellanan en los campos y el usuario puede corregirlos antes de guardar. Si el OCR falla, el formulario queda vacío con mensaje de error. El guardado usa el mismo flujo de validación del registro manual.
Prioridad: Alta (cuando se abra el sprint)
Estimación: 2 jornadas
Dependencias: BK-32, BK-33
Estado: Pendiente
Tipo: Feature
Referencia: US-02

Criterios de aceptación:
- [ ] Los valores extraídos por OCR aparecen en los campos del formulario.
- [ ] El usuario puede corregir cualquier valor antes de guardar.
- [ ] Si el OCR falla, el formulario queda vacío y se muestra un mensaje de error.
- [ ] El guardado final usa el mismo flujo de validación que el registro manual.

---

## Post-MVP (no iniciar sin confirmación)

**BK-13 — Registro por foto (OCR)**
Descripción: El usuario sube una foto del tensiómetro; la app extrae los valores y los muestra editables antes de guardar. Descompuesto en BK-32 (UI captura), BK-33 (endpoint OCR/AI) y BK-34 (integración en formulario). No iniciar hasta que BK-26 esté completado.
Prioridad: Alta (cuando se abra el siguiente sprint)
Estado: Pendiente — ver épica OCR/AI (BK-32, BK-33, BK-34)
Referencia: US-02, CA-02

**BK-14 — Gráficas de evolución temporal** → _Movido al Sprint MVP (2026-02-22)_

**BK-15 — Autenticación con Google OAuth**
Descripción: Login opcional para persistencia multi-dispositivo vía Google Drive. Descompuesto en BK-29 (flujo PKCE client-side) y BK-30 (endpoint proxy backend). No iniciar hasta que BK-27 esté completado.
Prioridad: Media
Estado: Pendiente — ver épica OAuth (BK-29, BK-30, BK-31)

**BK-16 — Persistencia en Google Drive**
Descripción: Adaptador de persistencia alternativo al `localStorage` local, con migración de datos al hacer login. Descompuesto en BK-31. No iniciar hasta que BK-30 esté completado.
Prioridad: Media
Estado: Pendiente — ver BK-31

**BK-17 — Recordatorios / notificaciones**
Descripción: Alertar al usuario para tomar la tensión periódicamente.
Prioridad: Baja
Estado: Pendiente
