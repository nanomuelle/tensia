# Decisiones de Arquitectura (ADRs)

---

## ADR-001: JsonFileAdapter como persistencia provisional

**Fecha:** 2026-02-18 · **Estado:** ~~Aceptado~~ **Supersedido por ADR-005**

`JsonFileAdapter` queda únicamente como adaptador de desarrollo y tests de integración. La persistencia de producción es `localStorageAdapter` en el cliente (ADR-005).

---

## ADR-002: Persistencia como adaptador intercambiable

**Fecha:** 2026-02-18 · **Estado:** Aceptado

### Decisión
La persistencia es un **adaptador intercambiable** inyectado en `measurementService`. El servicio nunca instancia el adaptador directamente.

```
measurementService(adapter)
  ├─ anónimo      → localStorageAdapter   (MVP)
  └─ autenticado  → googleDriveAdapter    (post-MVP)
```

### Contratro del adaptador
```js
adapter.getAll()                           → Promise<Measurement[]>
adapter.save(measurements: Measurement[]) → Promise<void>
```

### Consecuencias
- El adaptador puede migrarse (`localStorage` → `googleDriveAdapter`) sin tocar el servicio.
- `measurementService` es testeable de forma aislada inyectando un adaptador mock.
- El backend no gestiona datos de mediciones en el MVP.

---

## ADR-003: Vanilla JS como stack del frontend (MVP inicial)

**Fecha:** 2026-02-18 · **Estado:** ~~Aceptado~~ **Supersedido por ADR-007**

Decisión inicial para el MVP. Supersedido por la migración a Svelte 5 + Vite (ADR-007).

---

## ADR-004: Playwright como herramienta E2E

**Fecha:** 2026-02-18 · **Estado:** Propuesto

### Decisión
Usar **Playwright** (`@playwright/test`) como herramienta E2E, con runner propio separado de Vitest.

Durante los tests E2E:
- Playwright arranca el servidor Express vía bloque `webServer` en `playwright.config.js`.
- `SERVE_STATIC=true` activa la entrega de estáticos desde Express.
- `DATA_FILE=data/measurements.e2e.json` aísla datos E2E.

| Criterio | Playwright | Cypress | Puppeteer |
|---|---|---|---|
| Runner propio | ✅ | ✅ | ❌ |
| Auto-wait nativo | ✅ | ✅ | ❌ |
| CI headless Linux | ✅ nativo | ✅ con Xvfb | ✅ |
| Peso en CI | Ligero | Pesado (Electron) | Medio |

### Consecuencias
- Los tests Vitest no se ven afectados; Playwright usa su propio proceso.
- En CI: `npx playwright install --with-deps chromium` resuelve las dependencias en un paso.

---

## ADR-005: Persistencia en el cliente (PWA + localStorage)

**Fecha:** 2026-02-18 · **Estado:** Aceptado

### Contexto
Tres requisitos condicionan la arquitectura:
1. **Usuarios anónimos** → datos en `localStorage` del dispositivo.
2. **Usuarios Google** → datos en Google Drive del usuario (sin base de datos propia).
3. **Multiplataforma** (web + Android + iOS) → PWA instalable sin tiendas.

`localStorage` es una API exclusiva del navegador; ningún proceso Node puede acceder a él. La lógica de persistencia debe residir en el cliente.

### Decisión
Arquitectura PWA con persistencia completamente en el cliente:

```
Usuario anónimo   → localStorageAdapter  (clave: bp_measurements)
Usuario Google    → googleDriveAdapter   [post-MVP]
Backend           → solo sirve dist/
```

El backend no almacena ni gestiona datos de usuarios.

### Consecuencias
- Sin base de datos propia ni gestión de usuarios en el servidor.
- Funciona offline (Service Worker cachea el shell).
- Instalable en Android e iOS como PWA sin tiendas.
- **Riesgo iOS/Safari ITP:** `localStorage` puede borrarse tras 7 días de inactividad → la UI muestra un aviso informativo en Safari/iOS.
- Los datos modo anónimo están ligados al dispositivo; sin Google Drive no hay sincronización entre dispositivos.

---

## ADR-006: D3.js modular para gráficas

**Fecha:** 2026-02-22 · **Estado:** Aceptado

### Decisión
Usar **D3.js** con imports selectivos (`d3-scale`, `d3-axis`, `d3-shape`, `d3-selection`, ~42 KB gzip total).

Contrato público de `chart.js` (estable):
```js
export function renderChart(container: HTMLElement, measurements: Measurement[]): void
```

### Consecuencias
- SVG accesible e interactivo (tooltips, zoom, bandas de riesgo) sin cambio de herramienta.
- `chart.js` es un módulo D3 puro importado desde el componente `MeasurementChart.svelte`.
- Escalabilidad hacia pulso (3.ª serie), bandas de riesgo y zoom temporal sin dependencias adicionales.

---

## ADR-007: Migración del frontend a Svelte 5 + Vite

**Fecha:** 2026-02-23 · **Estado:** Aceptado _(migración completada)_

### Contexto
Tres features de crecimiento confirmadas hacían insostenible el stack Vanilla JS:
- **Login Google (OAuth 2.0 + PKCE):** rutas protegidas, estado de sesión reactivo.
- **OCR / AI:** estados async complejos; datos externos que requerían escape XSS sistemático.
- **Google Drive:** intercambio de adaptador según sesión, refresh de tokens.

Limitaciones críticas del stack anterior: riesgo XSS estructural por `innerHTML` y ausencia de reactividad declarativa.

### Decisión
Migrar a **Svelte 5 + Vite**.

| Opción | Bundle runtime | XSS safe | Coste migración |
|---|---|---|---|
| Vanilla JS | 0 KB | ⚠️ No | — |
| **Svelte 5** | **~3 KB** | **✅ Sí** | **8-10 j.** |
| Vue 3 | ~22 KB | ✅ Sí | 9-12 j. |
| React | ~45 KB | ✅ Sí | 12-16 j. |

### Consecuencias
- Templates Svelte escapan automáticamente: XSS eliminado estructuralmente.
- Svelte Runes (`$state`, `$derived`) simplifican los estados async de OAuth y OCR.
- Bundle mínimo sin runtime (~3 KB overhead); crítico para PWA en móvil.
- `vite-plugin-pwa` reemplaza el `sw.js` manual con precaching automático.
- Las capas `domain/`, `services/`, `infra/` y `shared/` se mantienen sin cambios.
- El flujo `merge a main → publicar` no cambia (`npm run build` → `dist/`).
- ADR-003 (Vanilla JS) queda **supersedido**.

---

## ADR-008: Arquitectura serverless — eliminación de Express en producción

**Fecha:** 2026-02-24 · **Estado:** Aceptado

### Contexto

ADR-007 (migración a Svelte 5 + Vite) eliminó la última razón para mantener Express como servidor de desarrollo: Vite ya provee su propio servidor de desarrollo y `vite build` genera `dist/` listo para cualquier hosting estático. El análisis de 2026-02-24 confirma que ninguna responsabilidad del backend Express es insustituible en el lado del servidor:

| Responsabilidad actual | ¿Necesita backend propio? | Alternativa client-side / hosting |
|---|---|---|
| Servir ficheros estáticos | ❌ | GitHub Pages / Cloudflare Pages / Vercel |
| Proxy OAuth (`POST /auth/token`) | ❌ | Google Identity Services (GIS) + flujo PKCE como cliente público (RFC 7636) — no requiere `client_secret` |
| Persistencia de mediciones | ❌ (ya en cliente desde ADR-005) | `localStorageAdapter` / `googleDriveAdapter` |
| OCR/AI (post-MVP) | ⚠️ API key protegida | Serverless function (Vercel/Netlify/Cloudflare Workers) — **no Express** |

El único artefacto de `apps/backend/` con valor permanente es `JsonFileAdapter`, que se conserva como utilidad exclusiva de tests de integración locales (ADR-001 supersedido).

Adicionalmente, Google Identity Services (GIS) implementa el flujo PKCE (RFC 7636) directamente en el cliente público: el `code_challenge` se envía en la autorización y el `code_verifier` en el intercambio de código, eliminando la necesidad de `client_secret` en el servidor. BK-30 (proxy OAuth backend) queda por tanto **obsoleto**.

### Decisión

1. **Eliminar Express de producción.** `apps/backend/` pasa a ser exclusivamente una utilidad de dev/tests. No se incluirá en ningún despliegue de producción.
2. **Hosting estático en GitHub Pages** (provisional). El workflow `deploy-pages.yml` ya existente construye con `vite build` y despliega `dist/`.
3. **Autenticación client-side con GIS.** El flujo PKCE completo reside en el cliente (`authService.js`); no hay proxy OAuth en el servidor. Implementado en BK-40 (épica E-04).
4. **Datos en el cliente.** `localStorageAdapter` para usuarios anónimos; `googleDriveAdapter` (post-MVP) para usuarios autenticados. Sin base de datos ni API REST de datos en el servidor.
5. **OCR/AI en post-MVP como serverless function.** Cuando se implemente E-02, el endpoint OCR será una función serverless (Vercel/Netlify/Cloudflare Workers), nunca un servidor Express propio.

Arquitectura resultante:

```
GitHub Pages (hosting estático)
  └─ dist/  ←  vite build
       │
       PWA (Svelte 5 + Service Worker)
         ├─ anónimo      → localStorageAdapter  (localStorage)
         └─ Google login → googleDriveAdapter   [post-MVP]
              │
              │ HTTPS directo (sin proxy)
              ├─ Google Identity Services  (auth PKCE)
              └─ Google Drive API          [post-MVP]

Post-MVP OCR:
  Serverless function (Vercel / Netlify)
    └─ Endpoint OCR/AI  (custodia API key del proveedor AI)
```

### Consecuencias

**Positivas:**
- Sin servidor que mantener, actualizar ni monitorizar en producción.
- Coste de infraestructura cero (GitHub Pages es gratuito para repositorios públicos).
- `apps/backend/` sigue siendo útil para `JsonFileAdapter` y tests de integración locales.
- BK-30 (proxy OAuth) queda obsoleto, simplificando E-01 en ≈1-2 jornadas.
- El flujo PKCE client-side es más seguro que un proxy: no hay `client_secret` que custodiar en el servidor.

**A tener en cuenta:**
- La variable de entorno `GOOGLE_CLIENT_ID` pasa a ser pública (configurada en `VITE_GOOGLE_CLIENT_ID`); esto es correcto para un cliente público PKCE.
- El OCR en post-MVP requerirá una función serverless separada para proteger la API key del proveedor AI.
- GitHub Pages sirve desde subdirectorio (`/tensia/`): `manifest.json` debe usar `"start_url": "./"` y Vite debe configurar `base` con `VITE_BASE_PATH` (ya implementado en `deploy-pages.yml`).
- **Riesgo ITP Safari/iOS** (heredado de ADR-005): sin cambios; la UI ya muestra el aviso informativo.

