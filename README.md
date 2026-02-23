# Tensia

Aplicación personal de registro y consulta de mediciones de tensión arterial.
Permite registrar mediciones de forma manual, consultarlas en orden cronológico y visualizarlas en una gráfica de evolución temporal.

**Tecnologías principales:** Svelte 5 + Vite · PWA instalable · D3.js · Node.js/Express · Vitest · Playwright

---

## Arquitectura

```
PWA (Svelte 5 + Vite + Service Worker)
  └─ Usuario anónimo → localStorageAdapter (clave: bp_measurements)
       │
       │ (sin peticiones HTTP para datos en el MVP)
       ▼
  Backend (Node.js/Express)
    └─ Servir ficheros estáticos del frontend
```

Los datos de mediciones viven exclusivamente en el `localStorage` del navegador (ADR-005).
El backend no almacena ni gestiona datos de usuarios en el MVP.

**Post-MVP (planificado):** login con Google OAuth 2.0 + PKCE, sincronización con Google Drive, registro por foto (OCR/AI).

---

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

---

## Instalación

```bash
npm install
```

Copia el fichero de variables de entorno y ajusta si es necesario (solo relevante para el servidor Express y los tests E2E):

```bash
cp .env.example .env
```

---

## Comandos

### `npm run dev`

Arranca el servidor de desarrollo **Vite** con recarga automática (HMR). Frontend disponible en `http://localhost:5173`.

```bash
npm run dev
```

### `npm run build`

Compila el frontend (Svelte + assets) y genera la carpeta `dist/` lista para producción.

```bash
npm run build
```

### `npm run preview`

Previsualiza localmente el bundle de producción generado en `dist/`.

```bash
npm run preview
```

### `npm start`

Arranca el servidor Express que sirve los ficheros estáticos en `http://localhost:3000`. Requiere haber ejecutado `npm run build` previamente.

```bash
npm run build && npm start
```

### `npm test`

Ejecuta todos los tests unitarios e integración con **Vitest** (runner único para backend y frontend).

```bash
npm test
```

### `npm run test:watch`

Ejecuta los tests en modo interactivo. Re-ejecuta automáticamente los tests afectados al guardar cambios.

```bash
npm run test:watch
```

### `npm run test:coverage`

Ejecuta los tests y genera un informe de cobertura en `coverage/`. La cobertura mínima exigida es del **70 %**.

```bash
npm run test:coverage
```

El informe HTML se puede consultar en `coverage/index.html`.

### `npm run test:e2e`

Ejecuta los tests end-to-end con **Playwright**. Playwright arranca el servidor automáticamente según `playwright.config.js`.

```bash
npm run test:e2e
```

---

## Variables de entorno

Estas variables son usadas por el servidor Express (`npm start`) y los tests E2E. En desarrollo con `npm run dev` (Vite) no son necesarias.

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto en el que escucha el servidor Express |
| `DATA_FILE` | `data/measurements.json` | Fichero JSON para tests de integración (`JsonFileAdapter`) |
| `SERVE_STATIC` | `true` | Sirve el frontend estático desde el servidor Express |
| `OPEN_BROWSER` | `true` | Abre el navegador automáticamente al arrancar el servidor |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Svelte 5 + Vite (ES Modules) |
| PWA | `vite-plugin-pwa` (Service Worker con precaching automático) |
| Gráfica | D3.js (módulos selectivos: `d3-scale`, `d3-axis`, `d3-shape`, `d3-selection`) |
| Persistencia MVP | `localStorage` del navegador, gestionado por `localStorageAdapter` en el cliente |
| Backend | Node.js + Express (solo sirve estáticos en el MVP) |
| Tests unitarios / integración | Vitest + `@testing-library/svelte` |
| Tests E2E | Playwright (`@playwright/test`) |

---

## Documentación

La documentación técnica y de producto está en la carpeta `docs/`:

| Documento | Descripción |
|---|---|
| `docs/architecture/system-overview.md` | Arquitectura del sistema |
| `docs/architecture/api-contract.md` | Contrato del adaptador de persistencia |
| `docs/architecture/data-model.md` | Modelo de datos |
| `docs/architecture/decisions.md` | Decisiones de arquitectura (ADRs) |
| `docs/architecture/svelte-migration-plan.md` | Plan de migración Vanilla JS → Svelte 5 (ADR-007) |
| `docs/product/mvp-scope.md` | Alcance del MVP |
| `docs/product/user-stories.md` | User stories |
| `docs/product/backlog.md` | Backlog pendiente |
| `docs/testing/test-strategy.md` | Estrategia de testing |
