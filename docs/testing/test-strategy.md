# Test Strategy — Tensia MVP

## Tipos de test

| Tipo | Herramienta | Ubicación | Estado |
|---|---|---|---|
| Unitario backend | Jest | `apps/backend/tests/domain/`, `tests/services/`, `tests/infra/` | ✅ Implementado |
| Integración API | Jest + supertest | `apps/backend/tests/api/` | ✅ Implementado |
| Unitario frontend | Jest + jsdom | `apps/frontend/tests/` | ✅ Implementado |
| Componente frontend | Por decidir | `apps/frontend/tests/` | ❌ Pendiente |
| E2E | Playwright | `apps/frontend/tests/e2e/` | ✅ Implementado (14 tests, 3 flujos) |

## Cobertura

- **Mínima objetivo:** 70 % líneas (Jest, backend + frontend/src)
- **Estado actual:** 94.82 % statements / 96 % branches (101 tests Jest + 14 tests E2E)
- Los tests E2E (Playwright) **no** computan en la cobertura Jest

## Estrategia E2E (ADR-004)

- **Herramienta:** Playwright (`@playwright/test`)
- **Arranque:** Express sirve frontend + API en un único proceso (`SERVE_STATIC=true`)
- **Datos aislados:** `DATA_FILE=data/measurements.e2e.json`
- **Comando:** `npm run test:e2e`
- **Configuración:** `playwright.config.js` (raíz del workspace)
- **Browsers:** Chromium headless (único en MVP)
- **Flujos cubiertos:**
  - TC-09: Registro manual completo (crítico)
  - TC-10: Estado vacío en primera carga
  - TC-11: Banner de error si el backend no responde

## CI

Antes de `npm run test:e2e` añadir:
```bash
npx playwright install --with-deps chromium
```

`data/measurements.e2e.json` debe estar en `.gitignore`.
