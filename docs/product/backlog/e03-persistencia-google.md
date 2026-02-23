# Épica E-03 — Persistencia con cuenta Google

**Estado:** ⏸ Pendiente de assessment (BK-35). No iniciar BK-31 hasta tener BK-35 cerrado.

**Objetivo:** El usuario autenticado puede persistir sus mediciones en la nube usando su cuenta de Google, con acceso multi-dispositivo y migración automática desde `localStorage` al hacer login por primera vez.

> ⚠️ **Dependencias:** requiere E-01 completada (token de acceso disponible en sesión) y BK-35 completado (alternativa de persistencia elegida).
> Los scopes adicionales de Google (p. ej. `https://www.googleapis.com/auth/drive.appdata`) se añadirán a BK-29 una vez cerrado el assessment.

---

## BK-35 — Assessment: alternativas de persistencia con cuenta Google

Descripción: Evaluar y documentar las alternativas de persistencia en la nube para usuario autenticado. Candidatas principales: (a) Google Drive API `appdata` folder (client-side, sin backend de datos); (b) Google Drive API con proxy backend; (c) backend propio con base de datos, autenticado por Google OAuth. Criterios de evaluación: complejidad de implementación, privacidad del usuario, coste operativo, offline-first, independencia de plataforma. Resultado: documento de recomendación en `docs/architecture/decisions.md` (nuevo ADR).
Prioridad: Media
Estimación: 1 jornada
Dependencias: E-01 completada
Estado: Pendiente
Tipo: Investigación / ADR

Criterios de aceptación:
- [ ] Documento con comparativa de al menos 2 alternativas (pros/contras/complejidad/coste).
- [ ] Alternativa recomendada claramente justificada.
- [ ] Scopes adicionales de Google necesarios identificados.
- [ ] ADR creado en `docs/architecture/decisions.md`.

---

## BK-31 — Implementar adaptador de persistencia elegido + migración de datos

Descripción: Implementar el adaptador de persistencia elegido en BK-35 (p. ej. `googleDriveAdapter`) con el mismo contrato `getAll()` / `save()` que `localStorageAdapter`. Implementar `sessionStore` en Svelte para distribuir el estado de login. Lógica de selección de adaptador: usuario anónimo → `localStorageAdapter`; usuario autenticado → adaptador elegido. Flujo de migración al hacer login por primera vez: si hay mediciones en `localStorage`, proponer importarlas al nuevo almacén.
Prioridad: Media
Estimación: 2-3 jornadas
Dependencias: BK-29, BK-30, BK-35
Estado: Pendiente
Tipo: Feature

Criterios de aceptación:
- [ ] El adaptador implementado cumple el contrato `getAll()` / `save()`.
- [ ] `measurementService` recibe el adaptador correcto según el estado de sesión (inyección de dependencias).
- [ ] Al hacer login con mediciones existentes en `localStorage`, se propone importarlas al nuevo almacén.
- [ ] Al cerrar sesión, los datos del almacén en la nube no quedan accesibles sin autenticación.
- [ ] El cambio de adaptador no requiere recargar la página.
- [ ] Tests unitarios del nuevo adaptador en verde.
