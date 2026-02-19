# System Overview

_Última revisión: 2026-02-19 — Actualizado para reflejar ADR-005_

## Arquitectura (MVP)

```
PWA (Frontend — Vanilla JS + Service Worker)
  └─ Usuario anónimo → localStorageAdapter (clave: bp_measurements)
       │
       │ (no hay peticiones HTTP para datos en producción MVP)
       ▼
  Backend (Node.js/Express)
    └─ Servir ficheros estáticos del frontend
         (apps/frontend/public/ y apps/frontend/src/)
```

En el MVP los datos nunca salen del dispositivo del usuario. El backend es un servidor de ficheros estáticos.

## Arquitectura post-MVP (usuario autenticado)

```
PWA (Frontend)
  └─ Usuario Google → googleDriveAdapter
       │
       │ HTTP (solo OAuth y OCR)
       ▼
  Backend (Node.js/Express)
    ├─ Servir ficheros estáticos
    ├─ Proxy OAuth (custodia client_secret)  [post-MVP]
    └─ Endpoint OCR                          [post-MVP]
```

## Principios

- Separación estricta de capas.
- La persistencia es un **adaptador intercambiable** inyectado en el servicio del frontend: `localStorageAdapter` (anónimo) → `googleDriveAdapter` (autenticado).
- El backend **no gestiona ni almacena datos de mediciones** en el MVP.
- La lógica de negocio (validaciones, UUID, ordenación) reside en modules ES del frontend (`domain/`, `services/`).
- Decisiones de arquitectura documentadas en `docs/architecture/decisions.md`.
