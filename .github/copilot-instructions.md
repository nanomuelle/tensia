# Copilot Instructions — Tensia

## Descripción del proyecto

**Tensia** es una aplicación personal de registro y consulta de mediciones de tensión arterial.
El usuario puede registrar mediciones de forma manual o mediante una foto de un tensiómetro (OCR).
En el MVP el uso es **anónimo**: no hay login ni cuentas de usuario.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js (ES Modules o CJS), `dotenv`, `nodemon` |
| Frontend | Vanilla JS + fetch (ES Modules), sin framework (ADR-003) |
| Persistencia MVP | Local Storage del navegador (gestionado desde el backend vía adaptador) |
| Persistencia futura | Intercambiable: Google Drive, base de datos, etc. (ADR-001) |
| OCR (post-MVP) | Por decidir |
| Auth (post-MVP) | Google OAuth |

---

## Arquitectura

Tres capas estrictamente separadas:

```
Frontend (UI)
     │  HTTP
     ▼
Backend (API REST)
     │  Adaptador
     ▼
Capa de Persistencia (Local Storage → intercambiable)
```

**Reglas críticas:**
- El **frontend nunca accede directamente** a la capa de persistencia.
- La capa de persistencia es un **adaptador intercambiable** (inyección de dependencias).
- Las decisiones de arquitectura se documentan como ADRs en `docs/architecture/decisions.md`.

---

## Estructura de carpetas

```
apps/
  backend/
    src/
      index.js          ← punto de entrada
      api/              ← definición de rutas y middlewares HTTP
      controllers/      ← reciben request, delegan a services
      domain/           ← entidades, validaciones de negocio
      infra/            ← adaptadores externos (persistencia, OCR, Drive)
      routes/           ← registro de rutas
      services/         ← lógica de aplicación
    tests/
  frontend/
    src/
    tests/
docs/
  architecture/         ← system-overview, api-contract, data-model, decisions (ADRs)
  design/               ← screens, ux-flow
  product/              ← mvp-scope, user-stories, backlog
  testing/              ← test-strategy, test-cases, acceptance-criteria
.github/
  agents/               ← agentes de Copilot por rol
  copilot-instructions.md
```

---

## Modelo de datos

**Clave de almacenamiento:** `bp_measurements`

```json
{
  "version": "1.0",
  "measurements": [
    {
      "id": "uuid-v4",
      "systolic": 120,
      "diastolic": 80,
      "pulse": 72,
      "measuredAt": "2026-02-18T10:00:00.000Z",
      "source": "manual"
    }
  ]
}
```

| Campo | Tipo | Requerido | Valores |
|---|---|---|---|
| `id` | string (UUID v4) | sí | generado automáticamente |
| `systolic` | number (entero positivo) | sí | |
| `diastolic` | number (entero positivo) | sí | |
| `pulse` | number (entero positivo) | no | |
| `measuredAt` | string (ISO 8601) | sí | |
| `source` | string enum | sí | `manual` \| `photo` |

---

## Contrato API (MVP)

### `GET /measurements`

Devuelve todas las mediciones ordenadas por `measuredAt` descendente.

```
200 OK
[
  { "id": "...", "systolic": 120, "diastolic": 80, "pulse": 72, "measuredAt": "...", "source": "manual" },
  ...
]
```

### `POST /measurements`

Crea una nueva medición.

```
Body: { "systolic": 120, "diastolic": 80, "pulse": 72, "measuredAt": "2026-02-18T10:00:00.000Z" }

201 Created
{ "id": "...", "systolic": 120, "diastolic": 80, "pulse": 72, "measuredAt": "...", "source": "manual" }
```

Errores de validación → `400 Bad Request` con mensaje descriptivo.

---

## Alcance del MVP

**Incluido:**
- Registro de medición manual
- Registro de medición por foto (OCR extrae valores, usuario puede editarlos antes de guardar)
- Persistencia en Local Storage
- Listado de mediciones
- Arquitectura frontend/backend desacoplada
- Tests básicos (cobertura mínima 70%)

**Excluido del MVP (no implementar sin confirmación):**
- Login / autenticación
- Google Drive
- Recordatorios o notificaciones
- Gráficas de evolución
- Diagnóstico médico o alertas clínicas

---

## Convenciones de código

- **Separación estricta por capa**: un controller no contiene lógica de negocio; un service no conoce `req`/`res`.
- **Inyección de dependencias** para el adaptador de persistencia: los services reciben el adaptador, no lo instancian.
- **Validación en dominio o servicio**, no en el controller.
- Archivos en **camelCase** (`measurementService.js`), clases en **PascalCase**.
- Comentarios en **español** (idioma del proyecto).
- No usar `async/await` y callbacks mezclados en el mismo módulo.

---

## Testing

| Tipo | Ubicación | Herramienta sugerida |
|---|---|---|
| Unitario backend | `apps/backend/tests/` | Jest |
| Integración API | `apps/backend/tests/` | Jest + supertest |
| Componente frontend | `apps/frontend/tests/` | Por decidir |
| E2E (1 flujo crítico) | `apps/frontend/tests/e2e/` | Por decidir |

Cobertura mínima objetivo: **70%**.

---

## Agentes disponibles

| Agente | Fichero | Rol |
|---|---|---|
| Product Owner | `.github/agents/product-owner.agent.md` | User stories, backlog, MVP scope |
| Arquitecto | `.github/agents/architect.agent.md` | Arquitectura, ADRs, contratos API, esquemas |
| Backend Dev | `.github/agents/backend-dev.agent.md` | API REST, lógica de negocio, persistencia |
| Frontend Dev | `.github/agents/frontend-dev.agent.md` | UI, formularios, consumo de API |
| Diseñador UX/UI | `.github/agents/designer.agent.md` | Wireframes, flujos, accesibilidad |
| QA | `.github/agents/qa.agent.md` | Plan de testing, tests, criterios de aceptación |

---

## Documentación de referencia

- Arquitectura del sistema: `docs/architecture/system-overview.md`
- Contrato API: `docs/architecture/api-contract.md`
- Modelo de datos: `docs/architecture/data-model.md`
- Decisiones (ADRs): `docs/architecture/decisions.md`
- Alcance MVP: `docs/product/mvp-scope.md`
- User stories: `docs/product/user-stories.md`
- Backlog: `docs/product/backlog.md`
- Pantallas: `docs/design/screens.md`
- Flujo UX: `docs/design/ux-flow.md`
- Estrategia de testing: `docs/testing/test-strategy.md`
- Casos de prueba: `docs/testing/test-cases.md`
- Criterios de aceptación: `docs/testing/aceptance-criteria.md`
