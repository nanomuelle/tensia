# Backlog — Tensia · Implementado

_Histórico de ítems completados o eliminados. Última revisión: 2026-02-24._

> Los ítems pendientes están en [backlog.md](backlog.md).
> El detalle de cada grupo está en la carpeta [`backlog/`](backlog/).

---

## Resumen de sprints completados

| Sprint | Fichero | Ítems | Estado |
|---|---|---|---|
| Sprint MVP | [done-sprint-mvp.md](backlog/done-sprint-mvp.md) | BK-01–BK-14 (BK-03 y BK-04 eliminados) | ✅ Hecho |
| Mejoras de UX | [done-ux-mejoras.md](backlog/done-ux-mejoras.md) | BK-20–BK-23 | ✅ Hecho |
| Migración Svelte 5 + Vite | [done-migracion-svelte5.md](backlog/done-migracion-svelte5.md) | BK-24–BK-28 | ✅ Hecho |

---

## Sprint MVP (BK-01–BK-14)

| BK | Descripción | Estado |
|---|---|---|
| BK-01 | Estructura base del proyecto | ✅ Hecho |
| BK-02 | Modelo de datos y dominio | ✅ Hecho |
| BK-03 | API REST: POST /measurements | ❌ Eliminado (ADR-005) |
| BK-04 | API REST: GET /measurements | ❌ Eliminado (ADR-005) |
| BK-05 | Persistencia en `localStorage` (ADR-005) | ✅ Hecho |
| BK-06 | UI: formulario de registro manual | ✅ Hecho |
| BK-07 | UI: listado de mediciones | ✅ Hecho |
| BK-08 | Tests unitarios backend (infra) | ✅ Hecho |
| BK-09 | Tests unitarios frontend (> 70 % cobertura) | ✅ Hecho |
| BK-10 | Tests E2E flujos críticos (Playwright) | ✅ Hecho |
| BK-11 | Tests de componente: validaciones de formulario | ✅ Hecho |
| BK-12 | Corrección BUG-01: ordenación no determinista | ✅ Hecho |
| BK-14 | Gráficas de evolución temporal (D3.js) | ✅ Hecho |
| BK-18 | Migrar chart.js a D3.js modular + tests | ✅ Hecho |
| BK-19 | Skeleton de gráfica sin datos suficientes | ✅ Hecho |

→ Detalle completo: [backlog/done-sprint-mvp.md](backlog/done-sprint-mvp.md)

---

## Mejoras de UX (BK-20–BK-23)

| BK | Descripción | Estado |
|---|---|---|
| BK-20 | Diseño: modal del formulario de registro | ✅ Hecho |
| BK-21 | Diseño: layout gráfica + historial en columnas | ✅ Hecho |
| BK-22 | Implementar modal del formulario de registro | ✅ Hecho |
| BK-23 | Implementar layout gráfica + historial en columnas | ✅ Hecho |

→ Detalle completo: [backlog/done-ux-mejoras.md](backlog/done-ux-mejoras.md)

---

## Migración Svelte 5 + Vite (BK-24–BK-28)

| BK | Descripción | Estado |
|---|---|---|
| BK-24 | Fase 0: Integrar Vite como build tool | ✅ Hecho |
| BK-25 | Fase 1: Migrar componentes hoja a Svelte | ✅ Hecho |
| BK-26 | Fase 2: Migrar MeasurementForm y Modal a Svelte | ✅ Hecho |
| BK-27 | Fase 3: Migrar vistas, store y router a Svelte | ✅ Hecho |
| BK-28 | Fase 4: Consolidar tests y limpiar dependencias | ✅ Hecho |

→ Detalle completo: [backlog/done-migracion-svelte5.md](backlog/done-migracion-svelte5.md)
