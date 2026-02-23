# Test Strategy — Tensia

_Última revisión: 2026-02-23 — Stack de testing consolidado: Vitest como runner único (BK-28). Tests E2E: 5 flujos incluido layout-columnas (BK-23)._

## Resumen ejecutivo

| Capa | Tests | Cobertura | Estado |
|---|---|---|---|
| Unitario + componente (Vitest) | > 100 tests | > 70 % líneas | ✅ Objetivo cumplido |
| E2E (Playwright) | 5 flujos (≥ 34 tests) | Flujos críticos | ✅ Implementado |

---

## Tipos de test y herramientas

| Tipo | Herramienta | Ubicación |
|---|---|---|
| Unitario backend (infra `JsonFileAdapter`) | Vitest — entorno Node | `apps/backend/tests/infra/jsonFileAdapter.test.js` |
| Unitario frontend (dominio, servicio, adaptadores, shared, store) | Vitest — entorno Node | `apps/frontend/tests/domain/`, `services/`, `infra/`, `shared/`, `store/` |
| Componente frontend (Svelte + jsdom) | Vitest + `@testing-library/svelte` | `apps/frontend/tests/components/` |
| E2E | Playwright (`@playwright/test`) | `apps/frontend/tests/e2e/flows/` |

> **Por qué no hay tests de integración con supertest:** la lógica de negocio y persistencia residen en el cliente (`localStorageAdapter`). Los endpoints HTTP de datos fueron eliminados en ADR-005. El único test de backend cubre la infraestructura de desarrollo (`JsonFileAdapter`).

---

## Cobertura (Vitest)

- **Umbral mínimo:** 70 % de líneas sobre `apps/frontend/src/**` + `apps/backend/src/infra/**`
- **Comando:** `npm run test:coverage`
- **Estado:** > 70 % — objetivo cumplido desde BK-09; mantenido en todas las fases de migración
- Los tests E2E (Playwright) **no** computan en la cobertura de Vitest

---

## Estrategia E2E

- **Herramienta:** Playwright (`@playwright/test`) — configurado en `playwright.config.js` (raíz)
- **Arranque:** Express sirve los ficheros estáticos del frontend; los tests levantan el servidor automáticamente
- **Aislamiento de datos:** cada test usa `localStorage` del contexto de Playwright, aislado por sesión; no hay base de datos compartida
- **Browser:** Chromium headless
- **Comando:** `npm run test:e2e`
- **Flujos cubiertos:**

| Spec | Caso(s) | Tests |
|---|---|---|
| `registro-manual.spec.js` | TC-09 — Registro manual completo | 6 |
| `estado-vacio.spec.js` | TC-10 — Estado vacío en primera carga | 3 |
| `error-backend.spec.js` | TC-11 — Banner de error (`localStorage` bloqueado) | 5 |
| `skeleton-grafica.spec.js` | TC-13 — Skeleton cuando no hay datos suficientes | 15 |
| `layout-columnas.spec.js` | TC-15 — Layout gráfica + historial en columnas (US-14) | 6 |

---

## Comandos de referencia

```bash
npm test                   # Vitest — todos los tests unitarios y de componente
npm run test:watch         # Vitest en modo observación
npm run test:coverage      # Vitest con informe de cobertura v8
npm run test:e2e           # Playwright E2E (requiere servidor activo o webServer config)
```

> **CI — instalar browsers antes de E2E:**
> ```bash
> npx playwright install --with-deps chromium
> ```
