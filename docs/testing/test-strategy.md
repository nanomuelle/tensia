# Test Strategy — Tensia MVP

_Última revisión: 2026-02-19 — Actualizado para reflejar ADR-005_

## Tipos de test

| Tipo | Herramienta | Ubicación | Estado |
|---|---|---|---|
| Unitario backend (infra) | Jest | `apps/backend/tests/infra/` | ✅ Implementado (`jsonFileAdapter` — dev/tests) |
| Unitario frontend | Jest + jsdom | `apps/frontend/tests/` | ✅ Implementado |
| Componente frontend | Jest + jsdom | `apps/frontend/tests/formulario.test.js` | ✅ Implementado (BK-11, TC-07, TC-08) |
| E2E | Playwright | `apps/frontend/tests/e2e/` | ✅ Implementado (14 tests, 3 flujos) |

> **Nota ADR-005:** Los tests de integración API (Jest + supertest) y los tests unitarios de `domain/`, `services/` y `controllers/` del backend fueron eliminados al aplicar ADR-005. La lógica de negocio reside ahora en el frontend y está cubierta por sus propios tests unitarios.

## Cobertura

- **Mínima objetivo:** 70 % líneas (Jest, frontend/src + backend/src/infra)
- **Estado actual:** 115 tests, 7 suites — cobertura global > 70 % (objetivo cumplido)
- Los tests E2E (Playwright) **no** computan en la cobertura Jest

## Estrategia E2E (ADR-004)

- **Herramienta:** Playwright (`@playwright/test`)
- **Arranque:** Express sirve los ficheros estáticos del frontend en un único proceso
- **Datos aislados:** los tests E2E usan `localStorage` del navegador de Playwright (aislado por sesión)
- **Comando:** `npm run test:e2e`
- **Configuración:** `playwright.config.js` (raíz del workspace)
- **Browsers:** Chromium headless (único en MVP)
- **Flujos cubiertos:**
  - TC-09: Registro manual completo (crítico)
  - TC-10: Estado vacío en primera carga
  - TC-11: Banner de error si el almacenamiento local falla (localStorage bloqueado)

## CI

Antes de `npm run test:e2e` añadir:
```bash
npx playwright install --with-deps chromium
```
