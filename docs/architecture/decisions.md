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

