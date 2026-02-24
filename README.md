# Tensia

Aplicación personal de registro y consulta de mediciones de tensión arterial.
Permite registrar mediciones de forma manual, consultarlas en orden cronológico y visualizarlas en una gráfica de evolución temporal.

**Tecnologías principales:** Svelte 5 + Vite · PWA instalable · D3.js · Vitest · Playwright

---

## Arquitectura

```
GitHub Pages (estáticos)
┌─────────────────────────────────────────────────────────┐
│   PWA (Svelte 5 + Service Worker)                       │
│                                                         │
│  authService (GIS)  ──▶  accounts.google.com            │
│                     ──▶  oauth2.googleapis.com/token    │
│                                                         │
│  usuario anónimo    ──▶  localStorageAdapter            │
│  usuario Google     ──▶  googleDriveAdapter [post-MVP]  │
└─────────────────────────────────────────────────────────┘
```

Los datos de mediciones viven en el `localStorage` del navegador (ADR-005). No hay servidor Express en producción (ADR-008). El directorio `apps/backend/` se conserva exclusivamente para tests de integración locales con `JsonFileAdapter`.

**Post-MVP (planificado):** sincronización con Google Drive, registro por foto (OCR/AI como serverless function).

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

### `npm run start:dev`

Arranca el servidor Express de desarrollo en `http://localhost:3000`. **Solo para entorno local con `JsonFileAdapter`.** Requiere haber ejecutado `npm run build` previamente. No se usa en producción (ADR-008).

```bash
npm run build && npm run start:dev
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

Copiar `.env.example` a `.env`. Solo son necesarias para desarrollo local con `npm run start:dev` y tests de integración. El flujo normal (`npm run dev`, `npm run build`, `npm run preview`, `npm test`, `npm run test:e2e`) **no requiere ninguna de estas variables**.

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | — | Client ID de Google para el flujo OAuth 2.0 + PKCE (requerido en E-01) |
| `PORT` | `3000` | *(solo dev)* Puerto del servidor Express local |
| `DATA_FILE` | `data/measurements.json` | *(solo dev/tests)* Fichero JSON para `JsonFileAdapter` |
| `SERVE_STATIC` | `true` | *(solo dev)* Sirve el frontend desde el servidor Express local |
| `OPEN_BROWSER` | `true` | *(solo dev)* Abre el navegador al arrancar `start:dev` |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Svelte 5 + Vite (ES Modules) |
| PWA | `vite-plugin-pwa` (Service Worker con precaching automático) |
| Gráfica | D3.js (módulos selectivos: `d3-scale`, `d3-axis`, `d3-shape`, `d3-selection`) |
| Persistencia MVP | `localStorage` del navegador, gestionado por `localStorageAdapter` en el cliente |
| Backend (dev) | Node.js + Express (solo tests de integración locales — ADR-008) |
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
