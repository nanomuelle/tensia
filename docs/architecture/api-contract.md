# API Contract

## GET /measurements
Response 200:
[
  {
    id: string,
    systolic: number,
    diastolic: number,
    pulse?: number,
    measuredAt: string,
    source: "manual" | "photo"
  }
]

---

## POST /measurements
Body:
{
  systolic: number,
  diastolic: number,
  pulse?: number,
  measuredAt: string
}

Response 201:
{
  id: string,
  ...
}
