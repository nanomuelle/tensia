# Backlog — Tensia · Pendiente

_Última revisión: 2026-02-24. Stack definitivo: Svelte 5 + Vite + Vitest. Próximos sprints: E-01 Login Google → E-02 OCR/AI → E-03 Persistencia Google._

> Los ítems ya implementados están en [backlog-done.md](backlog-done.md).
> El detalle de cada épica está en la carpeta [`backlog/`](backlog/).

---

## Resumen de épicas pendientes

| ID | Épica | Ítems | Estado |
|---|---|---|---|
| E-01 | [Login con Google](backlog/e01-login-google.md) | BK-29, BK-30 | Pendiente |
| E-02 | [Registro por foto (OCR / AI)](backlog/e02-ocr-ai.md) | BK-32, BK-33, BK-34 | Post-MVP confirmado |
| E-03 | [Persistencia con cuenta Google](backlog/e03-persistencia-google.md) | BK-35, BK-31 | Bloqueado por E-01 + assessment |
| — | [Post-MVP sin épica](backlog/post-mvp.md) | BK-17 | Baja prioridad |

---

## Épica E-01 — Login con Google

**Objetivo:** Autenticación con Google (scopes `openid`, `profile`). Muestra nombre y foto del usuario en la UI. La persistencia multi-dispositivo se aborda en E-03.

> Requiere BK-26 ✅ y BK-27 ✅. El usuario anónimo sigue usando `localStorageAdapter`.

| BK | Descripción | Estimación | Estado |
|---|---|---|---|
| BK-29 | Flujo OAuth 2.0 PKCE + lectura de perfil | 3-4 jornadas | Pendiente |
| BK-30 | Backend: proxy OAuth `POST /auth/token` | 1-2 jornadas | Pendiente |

→ Detalle completo: [backlog/e01-login-google.md](backlog/e01-login-google.md)

---

## Épica E-02 — Registro por foto (OCR / AI)

**Objetivo:** El usuario fotografía su tensiómetro y la app extrae los valores automáticamente para corrección antes de guardar.

> Independiente de E-01. No iniciar sin confirmación explícita.

| BK | Descripción | Estimación | Estado |
|---|---|---|---|
| BK-32 | UI: componente de captura de imagen | 2-3 jornadas | Pendiente |
| BK-33 | Backend: endpoint OCR + integración AI | 3-4 jornadas | Pendiente |
| BK-34 | Integración OCR en el formulario de registro | 2 jornadas | Pendiente |

→ Detalle completo: [backlog/e02-ocr-ai.md](backlog/e02-ocr-ai.md)

---

## Épica E-03 — Persistencia con cuenta Google

**Objetivo:** Mediciones en la nube para el usuario autenticado, con acceso multi-dispositivo y migración desde `localStorage`.

> ⏸ Bloqueado: requiere E-01 completada y BK-35 (assessment) cerrado.

| BK | Descripción | Estimación | Estado |
|---|---|---|---|
| BK-35 | Assessment: alternativas de persistencia con Google | 1 jornada | Pendiente |
| BK-31 | Implementar adaptador elegido + migración de datos | 2-3 jornadas | Bloqueado por BK-35 |

→ Detalle completo: [backlog/e03-persistencia-google.md](backlog/e03-persistencia-google.md)

---

## Post-MVP sin épica

| BK | Descripción | Prioridad | Estado |
|---|---|---|---|
| BK-17 | Recordatorios / notificaciones | Baja | Pendiente |

→ Detalle completo: [backlog/post-mvp.md](backlog/post-mvp.md)
