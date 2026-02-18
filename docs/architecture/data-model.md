# Data Model

Local Storage Key: bp_measurements

{
  version: "1.0",
  measurements: Measurement[]
}

Measurement:
- id: uuid
- systolic: number
- diastolic: number
- pulse?: number
- measuredAt: ISO date
- source: manual | photo
