# API Contract

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
