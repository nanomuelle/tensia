# Backlog — Tensia · Pendiente

_Última revisión: 2026-02-23._

> Los ítems ya implementados están en [backlog-done.md](backlog-done.md).

---

## Épica: Migración a Svelte 5 + Vite (fundación técnica)

**Objetivo:** preparar el frontend para soportar OAuth, OCR/AI y Google Drive con un stack seguro, reactivo y mantenible. Eliminar el riesgo XSS estructural de `innerHTML` antes de integrar datos externos.

> Referencia técnica completa: `docs/architecture/svelte-migration-plan.md` (ADR-007).

---

**BK-24 — Fase 0: Integrar Vite como build tool**
Descripción: Sustituir `scripts/build.js` por `vite build` sin migrar ningún componente. Verificar que el flujo `merge a main → GitHub Actions → GitHub Pages` sigue produciendo la misma app. Instalar `vite`, `@sveltejs/vite-plugin-svelte` y `vite-plugin-pwa`; crear `vite.config.js`; ajustar `index.html` y `deploy-pages.yml` (`BASE_PATH` → `VITE_BASE_PATH`).
Prioridad: Alta
Estimación: 1-2 jornadas
Dependencias: ninguna
Estado: Pendiente
Tipo: Tarea técnica (enabler)

Criterios de aceptación:
- [ ] `npm run build` usa Vite y produce `dist/` equivalente al actual.
- [ ] `deploy-pages.yml` funciona sin cambiar el YAML.
- [ ] Todos los tests existentes siguen pasando.
- [ ] La app desplegada en GitHub Pages es funcionalmente idéntica a la versión anterior.
- [ ] `vite dev` arranca el servidor de desarrollo local.

---

**BK-25 — Fase 1: Migrar componentes hoja a Svelte**
Descripción: Reescribir `Toast`, `IosWarning`, `MeasurementList` y `MeasurementChart` como Single File Components `.svelte`. Reescribir sus tests con Vitest + @testing-library/svelte. Los componentes se montan desde `HomeView.js` (aún Vanilla JS) usando la API programática de Svelte 5 (`mount(Component, { target, props })`).
Prioridad: Alta
Estimación: 3-4 jornadas
Dependencias: BK-24
Estado: Pendiente
Tipo: Tarea técnica (enabler)

Criterios de aceptación:
- [ ] Los 4 componentes funcionan como `.svelte` montados desde `HomeView.js` (aún Vanilla JS).
- [ ] Ninguno de los 4 componentes usa `innerHTML` con datos externos.
- [ ] Tests de los 4 componentes en verde con Vitest; cobertura ≥ 70 %.
- [ ] Sin regresiones en tests E2E (Playwright).

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
