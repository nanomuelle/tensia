# API Contract

_Última revisión: 2026-02-19 — Actualizado para reflejar ADR-005_

> ⚠️ **Contexto de uso:** Con ADR-005, estos endpoints **no se usan en producción MVP**.
> Los datos viven en `localStorage` del cliente; no hay llamadas HTTP para datos en el flujo de usuario anónimo.
> Estos endpoints se mantienen **únicamente** para entornos de desarrollo y tests de integración (`jsonFileAdapter` + supertest).

## GET /measurements

Devuelve todas las mediciones ordenadas por `measuredAt` descendente.

Response `200 OK`:
```json
[
  {
    "id": "uuid-v4",
    "systolic": 120,
    "diastolic": 80,
    "pulse": 72,
    "measuredAt": "2026-02-18T10:00:00.000Z",
    "source": "manual"
  }
]
```

---

## POST /measurements

Crea una nueva medición. Los datos son validados en la capa de dominio antes de persistirse.

Request body:
```json
{
  "systolic": 120,
  "diastolic": 80,
  "pulse": 72,
  "measuredAt": "2026-02-18T10:00:00.000Z"
}
```

Response `201 Created`:
```json
{
  "id": "uuid-v4",
  "systolic": 120,
  "diastolic": 80,
  "pulse": 72,
  "measuredAt": "2026-02-18T10:00:00.000Z",
  "source": "manual"
}
```

Response `400 Bad Request` — cuando los datos no superan la validación:
```json
{ "error": "Mensaje descriptivo del error de validación." }
```

### Reglas de validación del POST

| Campo        | Obligatorio | Tipo             | Rango válido          | Regla adicional                    |
|--------------|:-----------:|------------------|-----------------------|------------------------------------|
| `systolic`   | ✅          | entero positivo  | 50 – 300 mmHg         | Debe ser > `diastolic`             |
| `diastolic`  | ✅          | entero positivo  | 30 – 200 mmHg         | Debe ser < `systolic`              |
| `pulse`      | ❌          | entero positivo  | 20 – 300 bpm          | Solo validado si está presente     |
| `measuredAt` | ✅          | string ISO 8601  | —                     | Fecha/hora válida                  |

Los rangos se basan en las guías de la OMS y el NHS (ver `data-model.md`).
