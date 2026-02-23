# Contratos de la capa de persistencia

_Revisado: 2026-02-23_

---

## Adaptador de persistencia (cliente)

Todo adaptador debe implementar:

```js
adapter.getAll()                           → Promise<Measurement[]>
adapter.save(measurements: Measurement[]) → Promise<void>
```

| Adaptador | Entorno | Ubicación |
|---|---|---|
| `localStorageAdapter` | Producción MVP (usuario anónimo) | `apps/frontend/src/infra/localStorageAdapter.js` |
| `googleDriveAdapter` | Post-MVP (usuario autenticado) | `apps/frontend/src/infra/googleDriveAdapter.js` |
| `JsonFileAdapter` | Tests de integración (solo local) | `apps/backend/src/infra/jsonFileAdapter.js` |

`measurementService` recibe el adaptador por DI; nunca lo instancia directamente (ADR-002).

---

## Endpoints HTTP del backend (MVP)

El backend solo sirve ficheros estáticos. No hay endpoints REST de datos.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/*` | Ficheros estáticos del frontend (`dist/`) |

---

## Endpoints HTTP post-MVP (planificados)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/token` | Proxy OAuth 2.0 — intercambia código por token (custodia `client_secret`) |
| `POST` | `/ocr` | Extrae valores de tensión de una imagen de tensiómetro |

El contrato detallado de estos endpoints se documentará cuando se planifiquen.

---

## Reglas de validación (dominio del cliente)

Implementadas en `apps/frontend/src/domain/measurement.js` y `src/shared/validators.js`.

| Campo | Obligatorio | Tipo | Rango | Regla adicional |
|---|:---:|---|---|---|
| `systolic` | ✅ | entero positivo | 50 – 300 mmHg | Debe ser > `diastolic` |
| `diastolic` | ✅ | entero positivo | 30 – 200 mmHg | Debe ser < `systolic` |
| `pulse` | ❌ | entero positivo | 20 – 300 bpm | Solo si está presente |
| `measuredAt` | ✅ | string ISO 8601 | — | Fecha/hora válida |
| `source` | ✅ (auto) | `"manual"` \| `"photo"` | — | Asignado por el servicio |
