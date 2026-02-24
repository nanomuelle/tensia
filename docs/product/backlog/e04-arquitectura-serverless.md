# Épica E-04 — Arquitectura serverless: eliminación del backend

**Estado:** Pendiente  
**Fecha de refinamiento:** 2026-02-24  
**Sprint:** Previo a E-01 (bloqueante)

**Objetivo:** Eliminar el servidor Express como dependencia de producción y desplegar la app como PWA completamente serverless en GitHub Pages. Como consecuencia directa, el item BK-30 (proxy OAuth backend) queda reemplazado por BK-40 (Google Identity Services client-side), simplificando E-01.

---

## Contexto

El assessment de 2026-02-24 concluye que ninguna responsabilidad del backend Express es insustituible en el cliente:

| Responsabilidad actual | ¿Necesita backend? | Alternativa |
|---|---|---|
| Servir ficheros estáticos | ❌ | GitHub Pages / Cloudflare Pages / Vercel |
| Proxy OAuth `POST /auth/token` | ❌ | Google Identity Services + PKCE (cliente público, RFC 7636) |
| Persistencia de mediciones | ❌ (ya en cliente) | `localStorageAdapter` / `googleDriveAdapter` |
| OCR/AI (post-MVP) | ⚠️ API key protegida | Serverless function (Vercel/Netlify) — **no Express** |

La única pieza del `apps/backend/` con valor permanente es `JsonFileAdapter`, que se mantiene como utilidad exclusiva de tests de integración locales.

---

## Estado del arte (2026-02-24)

Análisis del repositorio antes de iniciar la épica. Permite saber qué está ya alineado y qué queda por hacer:

| Artefacto | Estado actual | Acción requerida |
|---|---|---|
| `deploy-pages.yml` | ✅ Completo. No invoca el backend, gestiona `VITE_BASE_PATH` y despliega `dist/`. Solo falta activar Pages en Settings. | BK-39: activar en Settings → Pages |
| `playwright.config.js` — `webServer` | ✅ Ya usa `vite preview --port 3000` desde la migración a Svelte 5. | — |
| `playwright.config.js` — comentario de cabecera | ❌ Describe el arranque con Express + `SERVE_STATIC=true`. Desactualizado. | BK-42: reescribir comentario |
| `manifest.json` `start_url` | ❌ Valor `"/"`. Debe ser `"./"` para funcionar desde subdirectorio de GitHub Pages. | BK-39: cambiar a `"./"` |
| `package.json` script `start` | ❌ `node apps/backend/src/index.js`. Apunta al servidor Express en producción. | BK-41: renombrar a `start:dev` |
| `package.json` dependencias `express`/`dotenv` | ❌ En `dependencies` (producción). Deben estar en `devDependencies`. | BK-41: mover a `devDependencies` |
| `apps/backend/` | ✅ Solo se usa en tests de integración. `JsonFileAdapter` sigue siendo útil y sus tests están en verde. | Conservar, no eliminar |

---

**Impacto sobre E-01:**

- BK-30 (proxy backend OAuth) queda **obsoleto** y se elimina del backlog.
- Se añade **BK-40** como su reemplazo client-side. E-01 pasa a tener la dependencia BK-40 en lugar de BK-30.
- El flujo PKCE de BK-36 pasa a llamar directamente al endpoint de tokens de Google en lugar de al proxy.

---

## Items de la épica

| BK | Descripción | Estimación | Estado |
|---|---|---|---|
| BK-38 | ADR-008: documentar decisión de arquitectura serverless | 0,5 j. | ✅ Completado |
| BK-39 | Activar GitHub Pages como hosting provisional | 0,5 j. | ✅ Completado |
| BK-40 | Reemplazar proxy OAuth por Google Identity Services (GIS) client-side | 1-2 j. | ✅ Completado (2026-02-24) |
| BK-41 | Eliminar servidor Express de producción / aislar `apps/backend/` a dev | 1 j. | ✅ Completado (2026-02-24) |
| BK-42 | Actualizar scripts npm, CI/CD y documentación sin dependencia del servidor | 0,5 j. | Pendiente |

---

## BK-38 — ADR-008: arquitectura serverless

**Descripción:** Crear el ADR-008 en `docs/architecture/decisions.md` documentando la decisión de eliminar el servidor Express de producción. Actualizar `docs/architecture/system-overview.md` y `docs/architecture/api-contract.md` para reflejar la arquitectura sin backend: hosting estático, GIS para auth, `googleDriveAdapter` para persistencia, serverless function para OCR.

**Prioridad:** Alta  
**Estimación:** 0,5 jornadas  
**Dependencias:** Assessment de 2026-02-24 (completado)  
**Estado:** ✅ Completado (2026-02-24)  
**Tipo:** Arquitectura / documentación

**Criterios de aceptación:**
- [x] ADR-008 creado con contexto, decisión y consecuencias. Estructura mínima esperada:
  - *Contexto:* ADR-007 (migración a Svelte 5) dejó sin valor propio al servidor Express; GitHub Pages resuelve el hosting; GIS PKCE elimina la necesidad de `client_secret` en servidor.
  - *Decisión:* eliminar Express de producción; hosting estático en GitHub Pages (provisional); auth vía GIS directo al cliente; datos en `localStorageAdapter` / `googleDriveAdapter`; OCR como serverless function en post-MVP.
  - *Consecuencias:* sin servidor que mantener en producción; `apps/backend/` queda como utilidad dev/tests; la función serverless OCR no es Express y puede alojarse en Vercel/Netlify.
- [x] `system-overview.md` refleja la arquitectura sin Express en producción.
- [x] `api-contract.md` elimina `POST /auth/token` del backend y lo reemplaza por la sección "Flujo GIS client-side".
- [x] BK-30 marcado como **Obsoleto (reemplazado por BK-40)** en el backlog de E-01.

---

## BK-39 — Activar GitHub Pages como hosting provisional

**Descripción:** Habilitar el despliegue de la app en GitHub Pages. El workflow `deploy-pages.yml` ya está completo: construye con `vite build`, pasa `VITE_BASE_PATH` al build para que Vite ajuste las rutas al subdirectorio, y despliega `dist/` con `actions/deploy-pages`. Solo quedan **dos acciones**: (a) corregir `start_url` en `manifest.json` de `"/"` a `"./"` para que la instalación como PWA funcione desde subdirectorios; (b) activar GitHub Pages en el repositorio: Settings → Pages → Source → "GitHub Actions". La variable `VITE_BASE_PATH` ya se consume en `vite.config.js` mediante `process.env.VITE_BASE_PATH`; verificar que la opción `base` del plugin PWA también la respeta.

**Prioridad:** Alta  
**Estimación:** 0,5 jornadas (incluye validación E2E de la URL desplegada)  
**Dependencias:** —  
**Estado:** ✅ Completado (código 2026-02-24 — pendiente activación manual de GitHub Pages en Settings)  
**Tipo:** Infraestructura / configuración

**Criterios de aceptación:**
- [x] `manifest.json` tiene `"start_url": "./"` y `"scope": "./"`. *(2026-02-24)*
- [x] `vite.config.js` — `base: process.env.VITE_BASE_PATH ?? '/'` ya correctamente configurado; `manifest: false` delega `start_url`/`scope` al `manifest.json` manual. *(2026-02-24)*
- [x] El repositorio tiene Pages configurado con "Source: GitHub Actions". *(acción manual en GitHub Settings → Pages)*
- [x] El workflow `deploy-pages.yml` se ejecuta en push a `main` sin errores (ya está completo; no requiere modificaciones).
- [x] La app es accesible en `https://nanomuelle.github.io/tensia/`.
- [ ] El Service Worker generado por `vite-plugin-pwa` se registra correctamente en la URL de GitHub Pages (sin errores de scope en DevTools).
- [ ] La instalación como PWA en Android/Chrome funciona desde la URL de GitHub Pages (icono de instalación visible).

---

## BK-40 — Reemplazar proxy OAuth por Google Identity Services (GIS) client-side

**Descripción:** Implementar el flujo de autenticación Google completamente en el cliente usando la biblioteca oficial **Google Identity Services** (`https://accounts.google.com/gsi/client`). GIS gestiona PKCE internamente para clientes públicos (SPA), por lo que no se necesita `client_secret` ni proxy de servidor. Crear `apps/frontend/src/services/authService.js` que encapsule la inicialización de GIS, el inicio del flujo de login (`requestCode()`), el intercambio del código de autorización directamente con el endpoint de tokens de Google, y la llamada a `userinfo`. Exponer `login()`, `logout()` y `handleCallback()`.

`authService.js` es un **módulo ES puro** (sin Svelte runes) que sigue el mismo patrón de las capas `services/` e `infra/` existentes. Delega el estado de sesión en `authStore.svelte.js` (BK-29, E-01), que sí usa runes de Svelte 5 (`$state`). Este item **reemplaza BK-30 y supercede el paso 4 del flujo de BK-36** (que apuntaba al proxy backend).

**Prioridad:** Alta  
**Estimación:** 1-2 jornadas  
**Dependencias:** BK-38 (ADR documentado)  
**Estado:** ✅ Completado (2026-02-24)  

**Artefactos entregados:**
- `apps/frontend/src/services/authService.js` — flujo PKCE completo (`requestCode`, `handleCallback`, `logout`).
- `apps/frontend/src/store/authStore.svelte.js` — store mínimo de sesión (BK-29 completará el estado reactivo).
- `apps/frontend/tests/services/authService.test.js` — 18 tests unitarios en verde.
- `apps/frontend/index.html` — `<script>` GIS desde CDN añadido.
- `apps/frontend/src/shared/eventBus.js` — eventos `AUTH_LOGIN` / `AUTH_LOGOUT` añadidos.
- `.env.example` — `VITE_GOOGLE_CLIENT_ID` documentado.
- [x] `authService.js` no importa ni depende de ningún módulo del backend.
- [x] `GOOGLE_CLIENT_ID` se expone como variable de entorno Vite (`VITE_GOOGLE_CLIENT_ID`). No existe `GOOGLE_CLIENT_SECRET` en el cliente.
- [x] La biblioteca GIS se carga desde CDN (`<script>` en `index.html`) o como import dinámico.
- [x] `requestCode()` inicia el flujo de consentimiento de Google y redirige al callback.
- [x] `handleCallback(searchParams)` lee `code` y `state`, verifica `state` (CSRF), e intercambia el código directamente con `https://oauth2.googleapis.com/token` usando `code_verifier`.
- [x] `handleCallback` llama a `https://www.googleapis.com/oauth2/v3/userinfo` con el `access_token` obtenido.
- [x] Tras el intercambio exitoso, delega en `authStore.login(tokenData, userProfile)` (BK-29).
- [x] Gestión de errores: cancelación, `state` inválido, código expirado → toast informativo + estado anónimo funcional.
- [x] `VITE_GOOGLE_CLIENT_ID` añadido a `.env.example` con comentario explicativo.
- [x] Tests unitarios del servicio en verde (`fetch` y biblioteca GIS mockeados).

**Nota de seguridad:** el `client_id` de Google para clientes públicos (SPA) es intencionalmente público; la protección CSRF recae en el parámetro `state` aleatorio y la verificación del `code_verifier`.

---

## BK-41 — Eliminar servidor Express de producción / aislar `apps/backend/` a dev

**Descripción:** Quitar `apps/backend/` del flujo de producción. El objetivo es que el bundle desplegado y el proceso de arranque de la app no dependan en absoluto de Node/Express. Cambios concretos en `package.json` raíz:

- Renombrar el script `"start": "node apps/backend/src/index.js"` a `"start:dev"` (solo para desarrollo local con servidor Express).
- Mover `express` y `dotenv` de `dependencies` a `devDependencies` (actualmente están en `dependencies`, lo que los incluye en el bundle de producción).
- Conservar `apps/backend/` como paquete exclusivo de desarrollo y tests de integración (`JsonFileAdapter`).
- El workflow `deploy-pages.yml` ya no invoca el backend; no requiere cambios.
- El bloque `webServer` de `playwright.config.js` ya usa `vite preview --port 3000` (correcto desde la migración Svelte 5); no requiere cambios.

**Prioridad:** Media  
**Estimación:** 1 jornada  
**Dependencias:** BK-39 (GitHub Pages funcional), BK-40 (auth sin proxy)  
**Estado:** ✅ Completado (2026-02-24)  
**Tipo:** Refactor / deuda técnica

**Criterios de aceptación:**
- [x] `package.json` no tiene un script `start` que arranque Express; el script equivalente se llama `start:dev` y solo se usa en desarrollo.
- [x] `express` y `dotenv` figuran en `devDependencies`, no en `dependencies`.
- [x] `apps/backend/` sigue presente en el repositorio y sus tests de integración (`JsonFileAdapter`) pasan en verde.
- [x] El workflow `deploy-pages.yml` no ejecuta ningún paso relacionado con el backend (verificado: sin regresión).
- [x] `README.md` actualizado: arquitectura serverless, comandos `npm run dev`, `npm run build`, `npm run preview`, `npm test`, `npm run test:e2e`. Sin mención a `node apps/backend/src/index.js` en el flujo normal.
- [x] `SERVE_STATIC` y `DATA_FILE` marcadas como solo-dev en `.env.example`.

---

## BK-42 — Actualizar scripts npm, CI/CD y documentación

**Descripción:** Limpiar los artefactos que aún asumen la existencia del backend Express.

Cambio concreto de mayor prioridad:
- **`playwright.config.js` — comentario de cabecera (líneas 1-9):** actualmente describe "El backend Express arranca con SERVE_STATIC=true…". Debe reemplazarse por una descripción que refleje que el bloque `webServer` usa `vite preview --port 3000` (esto ya es así en el código; solo el comentario es incorrecto).

Otros cambios:
- Referencias al puerto 3000 en la documentación: sustituir "Express en :3000" por "`vite preview` en :3000".
- `docs/testing/test-strategy.md`: actualizar la descripción del arranque E2E para reflejar `vite preview`.

**Prioridad:** Baja  
**Estimación:** 0,5 jornadas  
**Dependencias:** BK-41  
**Estado:** Pendiente  
**Tipo:** Mantenimiento / documentación

**Criterios de aceptación:**
- [ ] `playwright.config.js` — el comentario de cabecera (bloque JSDoc inicial) describe correctamente el arranque con `vite preview`, sin mención a Express ni a `SERVE_STATIC`.
- [ ] `playwright.config.js` — el bloque `webServer` ya es correcto (`vite preview --port 3000`); verificar que no haya regresión.
- [ ] `docs/testing/test-strategy.md` describe el arranque E2E con `vite preview`.
- [ ] `README.md` describe únicamente los comandos de desarrollo necesarios: `npm run dev`, `npm run build`, `npm test`, `npm run test:e2e`.
- [ ] No hay referencias a `SERVE_STATIC` ni `DATA_FILE` fuera del contexto de dev/tests locales.

---

## Impacto sobre otras épicas

| Épica | Impacto |
|---|---|
| **E-01 — Login Google** | BK-30 (proxy) eliminado. BK-36 actualiza el paso 4 para llamar directamente a Google. Dependencia simplificada: BK-40 reemplaza BK-30. |
| **E-02 — OCR/AI** | BK-33 se reformula: el endpoint OCR pasa a ser una **serverless function** (Vercel/Netlify), no un endpoint Express. Sin cambio de scope, solo de tecnología de despliegue. |
| **E-03 — Persistencia Google** | Sin cambio. `googleDriveAdapter` ya estaba diseñado como adaptador client-side. |

---

## Diagrama de arquitectura objetivo

```
GitHub Pages / Cloudflare Pages / Vercel (estáticos)
┌─────────────────────────────────────────────────────────┐
│   PWA (Svelte 5 + Service Worker)                       │
│                                                         │
│  authService (GIS)  ──▶  accounts.google.com            │
│                     ──▶  oauth2.googleapis.com/token    │
│                     ──▶  googleapis.com/oauth2/userinfo │
│                                                         │
│  usuario anónimo    ──▶  localStorageAdapter            │
│  usuario Google     ──▶  googleDriveAdapter             │
│                          ──▶  drive.googleapis.com      │
└─────────────────────────────────────────────────────────┘

Serverless function (solo OCR — E-02, post-MVP)
┌─────────────────────────────────────────────────────────┐
│  POST /ocr   →  Google Cloud Vision / OpenAI Vision     │
│  API key en variable de entorno del proveedor           │
└─────────────────────────────────────────────────────────┘
```

---

## Estimación total

| BK | Tarea | Estimación |
|---|---|---|
| BK-38 | ADR-008 + actualización de docs de arquitectura | 0,5 j. |
| BK-39 | GitHub Pages: fix `manifest.json` + activación | 0,5 j. |
| BK-40 | Google Identity Services client-side | 1-2 j. |
| BK-41 | Eliminar Express de producción | 1 j. |
| BK-42 | Scripts, CI/CD y documentación | 0,5 j. |
| **Total** | | **3,5–4,5 jornadas** |

---

## Secuencia recomendada

```
BK-38 (ADR) → BK-39 (Pages) → BK-40 (GIS) → BK-41 (eliminar Express) → BK-42 (limpieza)
```

BK-38 y BK-39 pueden hacerse en paralelo. BK-40 depende de BK-38 (ADR documentado antes de implementar). BK-41 no debe cerrarse hasta que BK-40 esté en verde (la auth funciona sin proxy). BK-42 es la tarea de cierre.
