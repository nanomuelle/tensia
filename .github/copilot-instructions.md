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
| Distribución | PWA (manifest.json + Service Worker) — instalable en Android e iOS sin tiendas (ADR-005) |
| Persistencia MVP | `localStorage` del navegador, gestionado desde el **frontend** mediante `localStorageAdapter` (ADR-005) |
| Persistencia post-MVP (usuario autenticado) | Google Drive API desde el cliente, mismo contrato de adaptador (ADR-005) |
| Persistencia desarrollo/tests | `JsonFileAdapter` (fichero JSON en disco) — solo entorno local y tests de integración (ADR-001 supersedido) |
| OCR (post-MVP) | Por decidir |
| Auth (post-MVP) | Google OAuth 2.0 con PKCE |

---

## Arquitectura

Arquitectura en capas con persistencia en el cliente (ADR-005):

```
PWA (Frontend — Vanilla JS + Service Worker)
  ├─ Usuario anónimo   → localStorageAdapter  (bp_measurements)
  └─ Usuario Google    → googleDriveAdapter    [post-MVP]
       │
       │ HTTP (solo para OCR y proxy OAuth en post-MVP)
       ▼
  Backend (Node.js/Express)
    ├─ Servir ficheros estáticos del frontend
    ├─ Proxy OAuth [post-MVP]
    └─ Endpoint OCR [post-MVP]
```

**Estructura de la capa de persistencia (cliente):**

```
apps/frontend/src/
  domain/
    measurement.js          ← validaciones de negocio
  services/
    measurementService.js   ← lógica de aplicación (recibe adaptador por inyección)
  infra/
    localStorageAdapter.js  ← implementa getAll() / save()  [MVP]
    googleDriveAdapter.js   ← implementa getAll() / save()  [post-MVP]
```

**Reglas críticas:**
- La capa de persistencia es un **adaptador intercambiable** inyectado en el servicio: en sesión anónima se usa `localStorageAdapter`; en sesión autenticada, `googleDriveAdapter`.
- El **backend no gestiona ni almacena datos de mediciones**; su rol en el MVP es únicamente servir los ficheros estáticos.
- En iOS (Safari/WebKit), el `localStorage` de una PWA puede borrarse tras 7 días de inactividad (política ITP). La UI debe mostrar un aviso informativo en Safari/iOS.
- Las decisiones de arquitectura se documentan como ADRs en `docs/architecture/decisions.md`.

---

## Estructura de carpetas

```
apps/
  backend/
    src/
      index.js          ← punto de entrada (solo sirve estáticos, ADR-005)
      api/              ← configuración de Express
      infra/            ← adaptadores externos (JsonFileAdapter — solo dev/tests)
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

> ⚠️ **Solo para desarrollo y tests.** Con ADR-005, estos endpoints no se usan en el flujo de usuario anónimo en producción. Los datos viven en `localStorage` del cliente. Se mantienen exclusivamente para tests de integración con `JsonFileAdapter`.

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
- Persistencia en `localStorage` del navegador (gestionada desde el frontend mediante `localStorageAdapter`)
- Listado de mediciones
- PWA instalable: `manifest.json` + Service Worker básico (cache del shell, uso offline)
- Aviso informativo en Safari/iOS sobre la limitación de 7 días de `localStorage`
- Arquitectura frontend/backend desacoplada
- Tests básicos (cobertura mínima 70 %)

**Excluido del MVP (no implementar sin confirmación):**
- Registro por foto (OCR) — **confirmado Post-MVP**
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
