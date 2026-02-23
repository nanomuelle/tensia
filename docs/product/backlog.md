# Backlog — Tensia · Pendiente

_Última revisión: 2026-02-23. BK-24 y BK-25 completados._

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
Estado: ✅ Hecho (2026-02-23) — ver [backlog-done.md](backlog-done.md)
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
Estado: ✅ Hecho (2026-02-23) — ver [backlog-done.md](backlog-done.md)
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

**Descripción:**
Reescribir `MeasurementForm` y `Modal` como Single File Components (`.svelte`) con Svelte 5 Runes. Tras esta fase, ningún componente usa `innerHTML` para construir estructura de UI; el riesgo XSS estructural queda eliminado completamente. `MeasurementForm.svelte` enlaza campos con `bind:value` y gestiona errores con `$state`; `Modal.svelte` mantiene focus trap, animaciones y accesibilidad usando `onMount`/`onDestroy` y `<slot />`. La composición Modal + MeasurementForm se extrae a un componente dedicado `RegistroMedicionModal.svelte` para evitar acoplamiento de la API de snippets de Svelte 5 con el código Vanilla JS de `HomeView.js`.

Prioridad: Alta
Estimación: 2-3 jornadas
Dependencias: BK-25
Estado: Pendiente
Tipo: Tarea técnica (enabler)
Referencia técnica: `docs/architecture/svelte-migration-plan.md` § 3.3 (Fase 2)

---

#### Subtareas técnicas

**1. `MeasurementForm.svelte`** (316 líneas actuales en `MeasurementForm.js`)

- Props: `service: object`, `toast: object`, `onSuccess?: () => void`, `onCerrar?: () => void`.
- Estado interno con `$state`: `systolic`, `diastolic`, `pulse`, `measuredAt` (valores de los campos); `errores` (objeto con claves por campo); `enviando: boolean`.
- `bind:value` en cada `<input>` en lugar de `querySelector` + lectura de `value`.
- La validación sigue delegada en `validarCamposMedicion(campos)` y `prepararDatosMedicion(campos)` de `shared/validators.js` — sin cambios en esa capa.
- Los mensajes de error por campo se muestran con `{#if errores.systolic}` en lugar de `setErrorCampo()` + manipulación directa del DOM.
- `abrir()` exportada (función pública): rellena `measuredAt` con `fechaLocalActual()` y limpia el formulario. El foco lo gestiona `Modal.svelte` (`transitionend` → primer campo).
- `cerrar()` se reemplaza por llamada al callback `onCerrar` desde el handler de submit o de cancelar.
- El bloque `<form novalidate>` pasa de ser `innerHTML` a marcado Svelte declarativo.
- Los estilos de `MeasurementForm.css` (actualmente un placeholder; los estilos reales están en `public/styles/components/`) pasan a `<style>` scoped dentro del SFC. Las clases BEM (`.campo`, `.campo__input`, `.campo__error`, etc.) se conservan.
- La prop `enviando` refleja el estado `btnGuardar.disabled` actual: `<button disabled={enviando}>`.

**2. `Modal.svelte`** (254 líneas actuales en `Modal.js`)

- Props: `title: string`, `locked?: boolean = false`, `onClose?: () => void`.
- API pública exportada (funciones `$bindable` o accedidas via `bind:this` + `export function`): `open()`, `close()`, `lock()`, `unlock()`.
- `<slot />` reemplaza el patrón `contentFactory(contenedorEl)` del `.js` actual.
- Focus trap (`Tab`/`Shift+Tab`) implementado en `onMount` con `addEventListener('keydown', ...)` y limpiado en `onDestroy`.
- Animaciones de apertura/cierre mantenidas: clases `modal-overlay--open`, `modal--open`, `modal--closing` gestionadas con `$state` interno + `transitionend`.
- Devolución del foco al `openerEl` al cerrarse, igual que en la implementación actual.
- Cierre por `Escape`, click en overlay y botón ✕ ya cubiertos en el `.js`; se mantiene la misma lógica con `$derived` para `_locked`.
- `aria-modal`, `role="dialog"`, `aria-labelledby` conservados en el marcado Svelte.
- Los estilos de `Modal.css` pasan a `<style>` scoped del SFC. Las clases `.modal`, `.modal-overlay`, `.modal__btn-cerrar`, etc., se conservan para no romper las transiciones CSS actuales.
- El helper `_escaparHTML` se elimina: Svelte escapa por defecto en `{title}`.

**3. `RegistroMedicionModal.svelte`** (componente nuevo en `components/Modal/`)

Componente de composición que encapsula la integración `Modal + MeasurementForm`:

```svelte
<!-- components/Modal/RegistroMedicionModal.svelte -->
<script>
  import { onMount } from 'svelte';
  import Modal from './Modal.svelte';
  import MeasurementForm from '../MeasurementForm/MeasurementForm.svelte';

  let { service, toast, onClose } = $props();

  let modal;
  let form;

  export function open()  { modal?.open(); }
  export function close() { modal?.close(); }

  onMount(() => { modal?.open(); });
</script>

<Modal bind:this={modal} title="Nueva medición" {onClose}>
  <MeasurementForm
    bind:this={form}
    {service} {toast}
    onSuccess={() => modal?.close()}
    onCerrar={() => modal?.close()}
  />
</Modal>
```

Este componente permite que `HomeView.js` (aún Vanilla JS) lo monte con la API programática de Svelte 5 sin necesidad de API de snippets (`createRawSnippet`):

```js
// HomeView.js (fragmento actualizado)
import { mount, unmount } from 'svelte';
import RegistroMedicionModal from '../components/Modal/RegistroMedicionModal.svelte';

function _abrirModalNuevaMedicion() {
  const target = document.getElementById('app') || document.body;
  modalActiva = mount(RegistroMedicionModal, {
    target,
    props: {
      service,
      toast,
      onClose: () => { modalActiva = null; },
    },
  });
}
```

Al cerrar, `HomeView.js` llama a `unmount(modalActiva)` si es necesario (o el propio componente se desmonta al finalizar la animación de cierre).

**4. Actualizar `HomeView.js`**

- Sustituir `createModal(...)` + `createMeasurementForm(...)` por `mount(RegistroMedicionModal, { target, props })`.
- Eliminar los imports de `createModal` y `createMeasurementForm`.
- En `unmount()` de `HomeView`, llamar a `unmount(modalActiva)` en lugar de `modalActiva.close()`.

**5. Migrar tests de los dos componentes**

Tests actuales en `apps/frontend/tests/components/`:
- `MeasurementForm.test.js` (269 líneas, Jest): reescribir con Vitest + `@testing-library/svelte`.
- `Modal.test.js` (478 líneas, Jest): reescribir con Vitest + `@testing-library/svelte`.
- Añadir tests básicos para `RegistroMedicionModal.svelte`.

Puntos de cobertura mínimos:
- `MeasurementForm`: renderizado de campos, validación con errores inline, submit exitoso invoca `service.create()` + `onSuccess`, submit bloqueado durante `enviando`.
- `Modal`: apertura/cierre, foco en primer elemento focusable tras apertura, Escape cierra, click en overlay cierra, `lock()` impide cierre.

---

#### Criterios de aceptación

- [ ] `MeasurementForm.svelte` existe en `components/MeasurementForm/`; valida los 4 campos igual que la versión actual (mismas reglas de `validators.js`).
- [ ] `Modal.svelte` mantiene focus trap, animaciones de apertura/cierre y accesibilidad (`aria-modal`, `role="dialog"`, devolución de foco).
- [ ] `RegistroMedicionModal.svelte` compone `Modal` + `MeasurementForm` y es montable desde `HomeView.js` con `mount()`.
- [ ] `HomeView.js` no importa `createModal` ni `createMeasurementForm`; usa `mount(RegistroMedicionModal, ...)`.
- [ ] Ningún componente (en los 6 migrados hasta esta fase) usa `innerHTML` con datos de usuario o datos externos.
- [ ] Tests de `MeasurementForm`, `Modal` y `RegistroMedicionModal` pasan con Vitest; cobertura de los componentes migrados ≥ 70 %.
- [ ] `npm test` y `npm run test:e2e` en verde sin regresiones.
- [ ] Los ficheros `.js` originales (`MeasurementForm.js`, `Modal.js`) pueden coexistir temporalmente pero no se usan en el flujo de producción (se eliminan en BK-28).

> ⚠️ **Prerrequisito para OCR/AI (BK-32):** esta fase debe estar completa antes de integrar datos externos de OCR.

---

**BK-27 — Fase 3: Migrar vistas, store y router a Svelte**

**Descripción:**
Reescribir `appStore` como módulo de stores Svelte (`writable` + acciones), `HomeView.js` como `HomeView.svelte`, adaptar `router.js` para montar componentes Svelte en lugar de fábricas Vanilla JS, y crear `App.svelte` + `main.js` como nuevo punto de entrada. Al terminar esta fase, `app.js` y `lib/svelteMount.js` se eliminan y no queda código Vanilla JS en la capa de UI.

**Estado del código al inicio de BK-27 (resultado de BK-26):**
- `app.js` instancia `service`, `store` (pub/sub custom), `toast` y `iosWarning` como componentes Svelte, y arranca el router.
- `router.js` usa fábricas `(el) => createHomeView(el, deps)` que devuelven `{ mount, unmount }`.
- `HomeView.js` monta los 6 componentes Svelte con `svelteMount` / `svelteUnmount` y se suscribe manualmente a `store.subscribe()`.
- `appStore.js` es un pub/sub custom; los componentes no pueden importar stores Svelte reactivos directamente.
- `lib/svelteMount.js` es un adaptador delgado sobre `import { mount, unmount } from 'svelte'`; existe solo para facilitar el mock en tests.

Prioridad: Alta
Estimación: 2-3 jornadas
Dependencias: BK-26
Estado: Pendiente
Tipo: Tarea técnica (enabler)
Referencia técnica: `docs/architecture/svelte-migration-plan.md` § 3.3 (Fase 3)

---

#### Subtareas técnicas

**1. Reescribir `appStore.js` como módulo de stores Svelte**

Crear `apps/frontend/src/store/appStore.svelte.js` y exportar stores individuales más la acción `cargarMediciones`. El servicio se sigue recibiendo por inyección para preservar la testabilidad; se inicializa en `main.js` y se pasa al módulo del store antes del primer uso.

```js
// store/appStore.svelte.js
import { writable } from 'svelte/store';

export const mediciones = writable([]);
export const cargando   = writable(false);
export const error      = writable(null);

/** @param {object} service - instancia de measurementService */
export function cargarMediciones(service) {
  cargando.set(true);
  error.set(null);
  service.listAll()
    .then((datos) => mediciones.set(datos))
    .catch((e)    => error.set(e.message))
    .finally(()   => cargando.set(false));
}
```

> Alternativa preferida si se quiere evitar pasar `service` en cada llamada: inicializar el módulo una sola vez con `init(service)` que guarda la referencia internamente y expone `cargarMediciones()` sin argumentos. Decidir el patrón antes de implementar.

`appStore.js` original se puede dejar como fichero de compatibilidad temporal (re-exporta los stores) o eliminar directamente; se elimina definitivamente en BK-28.

**2. Crear `HomeView.svelte`**

Reescribir `HomeView.js` como componente Svelte 5 que:
- Importa `mediciones`, `cargando`, `error` y `cargarMediciones` del nuevo store.
- Recibe `service` y `toast` como props (pasados desde `App.svelte`).
- Llama a `cargarMediciones()` en `onMount`.
- Usa `$mediciones`, `$cargando`, `$error` reactivamente (sin `store.subscribe()`).
- Monta `MeasurementList`, `MeasurementChart` y `RegistroMedicionModal` como subcomponentes Svelte declarativos (sin `svelteMount`/`svelteUnmount`).
- Gestiona la apertura de la modal con una variable `$state` interna (`let modalAbierta = $state(false)`).

Estructura de `HomeView.svelte`:

```svelte
<script>
  import { onMount } from 'svelte';
  import { mediciones, cargando, error, cargarMediciones } from '../store/appStore.svelte.js';
  import MeasurementList    from '../components/MeasurementList/MeasurementList.svelte';
  import MeasurementChart   from '../components/MeasurementChart/MeasurementChart.svelte';
  import RegistroMedicionModal from '../components/Modal/RegistroMedicionModal.svelte';

  let { service, toast } = $props();

  let modalAbierta = $state(false);

  onMount(() => cargarMediciones(service));

  function abrirModal()  { modalAbierta = true; }
  function cerrarModal() { modalAbierta = false; cargarMediciones(service); }
</script>

<section class="nueva-medicion">
  <button class="btn btn--primario" onclick={abrirModal}>+ Nueva medición</button>
</section>

<div class="dashboard-content" class:dashboard-content--columnas={$mediciones.length >= 1}>
  <section class="grafica-seccion" hidden={$cargando || !!$error || !$mediciones.length}>
    <MeasurementChart measurements={$mediciones} />
  </section>
  <section class="historial">
    <MeasurementList
      measurements={$mediciones}
      {cargando}={$cargando}
      {error}={$error}
      onReintentar={() => cargarMediciones(service)}
    />
  </section>
</div>

{#if modalAbierta}
  <RegistroMedicionModal {service} {toast} onClose={cerrarModal} />
{/if}
```

> El `hidden` y la lógica de `mostrarCargando()` / `mostrarError()` / `mostrarVacio()` / `mostrarLista()` que hoy vive en `HomeView.js` se absorberán en `MeasurementList.svelte` mediante sus props `measurements`, `cargando` y `error`.
> Puede requerir ajustar la API de `MeasurementList.svelte` (BK-25) para aceptar `cargando` y `error` como props en lugar de funciones imperativas.

**3. Adaptar `router.js`**

Cambiar el contrato del mapa de rutas: de `'/': (el) => VanillaViewFactory` a `'/': { component: HomeViewSvelte, props: (deps) => ({...}) }`.

El router usará `mount(Component, { target, props })` / `unmount(instance)` directamente (ya no necesita el shim `svelteMount.js`):

```js
// router.js (fragmento del nuevo contrato)
import { mount, unmount } from 'svelte';

export function createRouter(routes, containerEl) {
  let vistaActual = null;

  function navigate(hash = window.location.hash || '#/') {
    const ruta = hash.replace(/^#/, '') || '/';
    const entry = routes[ruta] ?? routes['/'];
    if (!entry) return;

    if (vistaActual) { unmount(vistaActual); vistaActual = null; }

    const props = typeof entry.props === 'function' ? entry.props() : (entry.props ?? {});
    vistaActual = mount(entry.component, { target: containerEl, props });
  }

  function start() {
    window.addEventListener('hashchange', () => navigate(window.location.hash));
    navigate();
  }

  return { start, navigate };
}
```

Mapa de rutas en `App.svelte` (o `main.js`):

```js
const routes = {
  '/': { component: HomeView, props: () => ({ service, toast }) },
};
```

> El nuevo contrato del router está preparado para rutas protegidas post-BK-29: se puede añadir `guard: () => boolean` a cada entrada.

**4. Crear `App.svelte`**

Componente raíz que:
- Monta `Toast` e `IosWarning` (actualmente en `app.js`).
- Instancia el router y llama a `router.start()` en `onMount`.
- Expone `toast` a las vistas hijas.

```svelte
<!-- App.svelte -->
<script>
  import { onMount } from 'svelte';
  import Toast      from './components/Toast/Toast.svelte';
  import IosWarning from './components/IosWarning/IosWarning.svelte';
  import HomeView   from './views/HomeView.svelte';
  import { createRouter } from './router.js';

  let { service } = $props();

  let toast;

  onMount(() => {
    const routes = {
      '/': { component: HomeView, props: () => ({ service, toast }) },
    };
    createRouter(routes, document.querySelector('main')).start();
  });
</script>

<Toast bind:this={toast} />
<IosWarning />
<main id="app"></main>
```

> El `#aviso-ios` de `index.html` se puede simplificar o integrar en `IosWarning.svelte` directamente.

**5. Crear `main.js` y actualizar `index.html`**

`main.js` es el único punto de entrada; instancia el `service` e invoca `mount(<App />)`:

```js
// src/main.js
import { mount } from 'svelte';
import * as adapter from './infra/localStorageAdapter.js';
import { createMeasurementService } from './services/measurementService.js';
import App from './App.svelte';

const service = createMeasurementService(adapter);
mount(App, { target: document.body, props: { service } });
```

En `index.html` cambiar el `src`:

```diff
-<script type="module" src="src/app.js"></script>
+<script type="module" src="src/main.js"></script>
```

También se puede eliminar el `<div id="aviso-ios">` si `IosWarning.svelte` ya no depende de ese punto de montaje externo.

**6. Eliminar ficheros Vanilla JS obsoletos de UI**

- `apps/frontend/src/app.js` — reemplazado por `main.js` + `App.svelte`.
- `apps/frontend/src/lib/svelteMount.js` — ya no se necesita; el router y las vistas usan `mount`/`unmount` directamente.
- `apps/frontend/src/views/HomeView.js` — reemplazado por `HomeView.svelte`.
- `apps/frontend/src/store/appStore.js` — reemplazado por `appStore.svelte.js`.

> Los ficheros `.js` de componentes (BK-25 y BK-26) ya se eliminaron en sus respectivas fases.

**7. Migrar tests**

| Fichero test actual | Runner actual | Acción en BK-27 |
|---|---|---|
| `tests/store/appStore.test.js` | Jest | Reescribir con Vitest; adaptar a la nueva API de stores Svelte (`subscribe`, `get`) |
| `tests/router.test.js` | Jest | Reescribir con Vitest; adaptar mocks al nuevo contrato `{ component, props }` |
| `tests/components/HomeView.test.js` | Vitest | Reescribir con `@testing-library/svelte`; mockear `appStore.svelte.js` y subcomponentes |

Puntos de cobertura mínimos por fichero:

- **`appStore.svelte.js`**: estado inicial; `cargarMediciones` — transición éxito (mediciones actualizadas, `cargando` false); transición error (`error` con mensaje, `cargando` false).
- **`router.js`**: navega a ruta existente; fallback a `/` en ruta desconocida; llama a `unmount` del componente anterior al navegar; reacciona a `hashchange`.
- **`HomeView.svelte`**: renderiza el botón "Nueva medición"; llama a `cargarMediciones` en `onMount`; muestra `RegistroMedicionModal` al hacer clic en el botón; propaga `onClose` al cerrar la modal.

---

#### Criterios de aceptación

- [ ] `src/main.js` monta `<App />` en `document.body`; `src/app.js` eliminado.
- [ ] `App.svelte` monta `Toast` e `IosWarning` y arranca el router; no contiene lógica de negocio ni manipulación de DOM manual.
- [ ] `HomeView.svelte` existe en `src/views/`; suscribe reactivamente al store sin llamar a `store.subscribe()` explícitamente.
- [ ] `appStore.svelte.js` exporta stores Svelte (`mediciones`, `cargando`, `error`) y la acción `cargarMediciones`; `appStore.js` eliminado.
- [ ] `router.js` usa `mount()`/`unmount()` de Svelte; su contrato de rutas accepta `{ component, props }`.
- [ ] `lib/svelteMount.js` eliminado; ningún fichero lo importa.
- [ ] Cero código Vanilla JS en la capa de UI (vistas y punto de entrada). Solo queda JS puro en `domain/`, `services/`, `infra/` y `shared/`.
- [ ] Tests de `appStore`, `router` y `HomeView` pasan con Vitest; cobertura de los módulos migrados ≥ 70 %.
- [ ] `npm test` (Vitest, coexistencia con Jest mientras no se complete BK-28) y `npm run test:e2e` (Playwright) en verde sin regresiones.

> ⚠️ **Prerrequisito para OAuth (BK-29):** esta fase debe estar completa para soportar rutas protegidas en el router Svelte.

---

**BK-28 — Fase 4: Consolidar tests y limpiar dependencias**

**Descripción:**
Hacer de Vitest el único runner de tests unitarios e integración, eliminando la coexistencia con Jest que se mantiene desde BK-24. Migrar los 9 ficheros de test que aún usan Jest al formato Vitest, unificar la configuración de cobertura y eliminar las dependencias y archivos ya obsoletos.

Prioridad: Alta
Estimación: 2 jornadas
Dependencias: BK-27
Estado: Pendiente
Tipo: Tarea técnica (limpieza)

---

#### Estado del repositorio al inicio de BK-28

Al completar BK-27, el proyecto mantiene **dos runners en paralelo**:

| Runner | Script | Tests que ejecuta |
|---|---|---|
| Vitest | `npm run test:unit` | Componentes Svelte (BK-25/26) + store Svelte + router (BK-27) |
| Jest | `npm test` | Backend + los módulos JS puros del frontend (dominio, servicios, infra, shared, chart) |

**Tests bajo Jest que deben migrarse a Vitest (9 ficheros):**

| Fichero | Entorno Jest actual | Entorno Vitest objetivo |
|---|---|---|
| `apps/backend/tests/infra/jsonFileAdapter.test.js` | `node` | `node` |
| `apps/frontend/tests/chart.test.js` | `jsdom` | `jsdom` |
| `apps/frontend/tests/domain/measurement.test.js` | `node` | `node` |
| `apps/frontend/tests/infra/localStorageAdapter.test.js` | `jsdom` | `jsdom` |
| `apps/frontend/tests/infra/httpAdapter.test.js` | `jsdom` | `jsdom` |
| `apps/frontend/tests/services/measurementService.test.js` | `node` | `node` |
| `apps/frontend/tests/shared/eventBus.test.js` | `jsdom` | `jsdom` |
| `apps/frontend/tests/shared/formatters.test.js` | `node` | `node` |
| `apps/frontend/tests/shared/validators.test.js` | `node` | `node` |

---

#### Subtareas técnicas

**1. Migrar los 9 ficheros de test de Jest a Vitest**

Todos los ficheros usan `import { describe, test, expect, … } from '@jest/globals'`. El cambio es mínimo:

```diff
-import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
+import { describe, test, expect, beforeEach, afterEach } from 'vitest';
```

Donde se usa `jest.fn()` o `jest.spyOn()`, reemplazar por `vi.fn()` / `vi.spyOn()` (misma API).

No hay que cambiar la lógica de los tests; son módulos ES puros.

**2. Anotar el entorno por fichero donde difiere del valor por defecto**

`vitest.config.js` usará `jsdom` como entorno por defecto (hereda de la config actual). Los ficheros que necesitan entorno `node` deben declararlo en la primera línea:

```js
// @vitest-environment node
```

Ficheros que requieren esta anotación (los de la tabla anterior con "node"):
- `apps/backend/tests/infra/jsonFileAdapter.test.js`
- `apps/frontend/tests/domain/measurement.test.js`
- `apps/frontend/tests/services/measurementService.test.js`
- `apps/frontend/tests/shared/formatters.test.js`
- `apps/frontend/tests/shared/validators.test.js`

**3. Actualizar `vitest.config.js`**

Sustituir la lista explícita de `include` por un patrón que cubra todos los tests, y extender `collectCoverageFrom` para incluir los módulos del backend:

```js
// vitest.config.js — BK-28 (runner único)
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',       // predeterminado; los test Node anulan con @vitest-environment
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['apps/**/tests/**/*.test.{js,svelte.js}'],
    coverage: {
      provider: 'v8',
      include: [
        'apps/backend/src/**/*.js',
        'apps/frontend/src/**/*.js',
        'apps/frontend/src/**/*.svelte',
      ],
      exclude: [
        'apps/backend/src/index.js',
        'apps/backend/src/api/app.js',
      ],
      thresholds: { lines: 70 },
    },
  },
});
```

**4. Actualizar scripts en `package.json`**

```diff
  "scripts": {
    "start":   "node apps/backend/src/index.js",
    "dev":     "vite",
    "build":   "vite build",
    "preview": "vite preview",
-   "test":          "node --experimental-vm-modules node_modules/.bin/jest",
-   "test:coverage": "node --experimental-vm-modules node_modules/.bin/jest --coverage",
-   "test:unit":     "vitest run --config vitest.config.js",
-   "test:unit:watch": "vitest --config vitest.config.js",
+   "test":          "vitest run",
+   "test:watch":    "vitest",
+   "test:coverage": "vitest run --coverage",
    "test:e2e":      "playwright test"
  }
```

**5. Eliminar la sección `"jest"` de `package.json`**

Borrar el bloque completo `"jest": { … }` del `package.json`.

**6. Desinstalar Jest y dependencias exclusivas**

```bash
npm uninstall jest jest-environment-jsdom
```

> `nodemon` también se puede quitar en este momento: `npm run dev` usa Vite y `npm start` arranca Express directamente sin recarga automática.
> ```bash
> npm uninstall nodemon
> ```

**7. Eliminar `scripts/build.js`**

```bash
rm scripts/build.js
```

Comprobar que ningún script activo ni ningún workflow de CI referencia el fichero antes de borrarlo.

**8. Actualizar `copilot-instructions.md`**

Sección _Stack tecnológico_ → fila de tests:

```diff
-| Tests | Jest (`--experimental-vm-modules`) para unitarios e integración; Playwright (`@playwright/test`) para E2E (ADR-004) |
+| Tests | Vitest (runner único para unitarios e integración); Playwright (`@playwright/test`) para E2E (ADR-004) |
```

**9. Actualizar `README.md`**

Actualizar la sección de comandos de desarrollo para reflejar los nuevos scripts (`npm test`, `npm run test:watch`, `npm run test:coverage`). Eliminar cualquier mención a `--experimental-vm-modules` o Jest.

---

#### Verificación final

```bash
# Todos los tests en un único runner
npm test

# Con cobertura — debe superar el 70 % global
npm run test:coverage

# E2E sin regresioes
npm run test:e2e

# Confirmar que Jest ya no está instalado
node -e "require('jest')" 2>&1 | grep "Cannot find"
```

---

#### Criterios de aceptación

- [ ] `npm test` ejecuta todos los tests (backend + frontend) con Vitest; cero menciones a Jest en scripts ni en comentarios de configuración.
- [ ] Los 9 ficheros migrados importan desde `vitest` (o usan globals) en lugar de `@jest/globals`.
- [ ] `npm run test:coverage` supera el umbral de cobertura global del 70 % incluyendo el backend.
- [ ] `vitest.config.js` cubre todos los tests con un patrón glob; sin lista explícita de ficheros.
- [ ] `package.json` no contiene el bloque `"jest": { … }` ni scripts que invoquen Jest.
- [ ] `jest` y `jest-environment-jsdom` eliminados de `devDependencies`.
- [ ] `scripts/build.js` eliminado del repositorio; no hay referencias activas a él.
- [ ] `copilot-instructions.md` y `README.md` actualizados con el stack definitivo (Vitest).
- [ ] `npm run test:e2e` (Playwright) sigue en verde sin regresiones.

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
