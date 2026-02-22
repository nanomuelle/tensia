# API Contract

_Última revisión: 2026-02-22 — Actualizado para reflejar refactorización del frontend_

## Contexto

Con **ADR-005**, el backend MVP no gestiona datos de mediciones. Su único rol es servir los ficheros estáticos del frontend. **No existen endpoints HTTP de datos en producción.**

Los datos viven exclusivamente en el cliente (`localStorage`). El contrato de acceso a datos es la **interfaz del adaptador de persistencia**, no una API REST.

---

## Contrato del adaptador de persistencia (cliente)

Todo adaptador de persistencia del frontend debe implementar esta interfaz:

```js
adapter.getAll()                           → Promise<Measurement[]>
adapter.save(measurements: Measurement[]) → Promise<void>
```

### Implementaciones

| Adaptador | Entorno | Ubicación |
|---|---|---|
| `localStorageAdapter` | Producción MVP (usuario anónimo) | `apps/frontend/src/infra/localStorageAdapter.js` |
| `googleDriveAdapter` | Post-MVP (usuario autenticado) | `apps/frontend/src/infra/googleDriveAdapter.js` |
| `JsonFileAdapter` | Desarrollo y tests de integración | `apps/backend/src/infra/jsonFileAdapter.js` |

El `measurementService` del frontend recibe el adaptador por inyección de dependencias y nunca lo instancia directamente.

---

## Endpoints HTTP del backend (MVP)

El backend expone únicamente recursos estáticos:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/*` | Sirve los ficheros estáticos del frontend (`apps/frontend/public/`, `apps/frontend/src/`) |

No hay endpoints REST de datos activos en producción.

---

## Endpoints HTTP post-MVP (planificados)

Se añadirán cuando se implemente autenticación y OCR (ver `decisions.md` ADR-005):

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/token` | Proxy OAuth 2.0 — intercambia código por token custodiando el `client_secret` |
| `POST` | `/ocr` | Extrae valores de tensión de una imagen de tensiómetro |

El contrato detallado de estos endpoints se documentará en este fichero cuando se planifiquen.

---

## Reglas de validación de mediciones (dominio del cliente)

La validación reside en `apps/frontend/src/domain/measurement.js` y `apps/frontend/src/shared/validators.js`.

| Campo | Obligatorio | Tipo | Rango válido | Regla adicional |
|---|:---:|---|---|---|
| `systolic` | ✅ | entero positivo | 50 – 300 mmHg | Debe ser > `diastolic` |
| `diastolic` | ✅ | entero positivo | 30 – 200 mmHg | Debe ser < `systolic` |
| `pulse` | ❌ | entero positivo | 20 – 300 bpm | Solo validado si está presente |
| `measuredAt` | ✅ | string ISO 8601 | — | Fecha/hora válida |
| `source` | ✅ (auto) | enum | `manual` \| `photo` | Asignado por el servicio, no por el usuario |

Los rangos se basan en las guías de la OMS y el NHS (ver `data-model.md`).
