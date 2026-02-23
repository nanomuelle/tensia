# Data Model

Local Storage Key: `bp_measurements`

```json
{
  "version": "1.0",
  "measurements": Measurement[]
}
```

## Estructura de Measurement

| Campo        | Tipo                    | Requerido | Descripción                                      |
|--------------|-------------------------|-----------|--------------------------------------------------|
| `id`         | string (UUID v4)        | sí        | Generado automáticamente                         |
| `systolic`   | number (entero positivo)| sí        | Presión sistólica en mmHg                        |
| `diastolic`  | number (entero positivo)| sí        | Presión diastólica en mmHg                       |
| `pulse`      | number (entero positivo)| no        | Frecuencia cardíaca en bpm                       |
| `measuredAt` | string (ISO 8601)       | sí        | Fecha y hora de la medición                      |
| `source`     | `"manual"` \| `"photo"` | sí        | Origen del registro                              |

---

## Rangos de validación clínicamente plausibles

Los rangos se definen según las guías de la **Organización Mundial de la Salud (OMS/WHO)**
y el **National Health Service (NHS, UK)**, y corresponden a los límites fisiológicamente
posibles para una persona en condición de autorrealizar una medición doméstica.

| Campo      | Mínimo | Máximo | Unidad | Criterio de referencia                                                                 |
|------------|--------|--------|--------|----------------------------------------------------------------------------------------|
| `systolic` | 50     | 300    | mmHg   | <50: shock severo (persona incapaz de automedirse). >300: imposible fisiológicamente.  |
| `diastolic`| 30     | 200    | mmHg   | <30: colapso circulatorio. >200: imposible fisiológicamente.                           |
| `pulse`    | 20     | 300    | bpm    | <20: incompatible con perfusión consciente. >300: incompatible con gasto cardíaco útil.|

**Fuentes:**
- OMS — *Hypertension Fact Sheet* (septiembre 2025): https://www.who.int/news-room/fact-sheets/detail/hypertension
- NHS — *Blood pressure test* (noviembre 2025): https://www.nhs.uk/conditions/blood-pressure-test/

**Regla adicional obligatoria:** `systolic` debe ser siempre **mayor** que `diastolic`.

---

## Reglas de validación aplicadas

Validación implementada en el cliente: `domain/measurement.js` (negocio) y `shared/validators.js` (presentación).

| Regla | Implementado |
|---|:---:|
| `systolic` requerido | ✅ |
| `diastolic` requerido | ✅ |
| `measuredAt` requerido | ✅ |
| Valores enteros positivos | ✅ |
| `systolic` en rango [50, 300] | ✅ |
| `diastolic` en rango [30, 200] | ✅ |
| `pulse` en rango [20, 300] (si hay) | ✅ |
| `systolic` > `diastolic` | ✅ |
| `measuredAt` formato ISO 8601 válido | ✅ |
