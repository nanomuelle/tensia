# Architectural Decisions (ADR)

## ADR-001: Uso de Local Storage como persistencia en el MVP

**Fecha:** 2026-02-18
**Estado:** ~~Aceptado~~ **Supersedido por ADR-005** (2026-02-18)

> ⚠️ Este ADR queda supersedido. La persistencia de producción pasa al cliente (`localStorage` en el frontend). `JsonFileAdapter` se mantiene únicamente para entornos de desarrollo y tests de integración.

### Contexto
El MVP no requiere multiusuario ni sincronización de datos entre dispositivos.
Montar una base de datos o integrar Google Drive añadiría complejidad innecesaria para validar el producto.

### Decisión
Usar un archivo JSON en disco (servidor) como mecanismo de persistencia para el MVP,
gestionado mediante un adaptador intercambiable inyectado en los servicios (`JsonFileAdapter`).

### Consecuencias
- Sin configuración externa: el servidor lee y escribe un único fichero `data/measurements.json`.
- El adaptador es intercambiable sin modificar servicios ni controllers (ADR-002 garantiza esto).
- Limitación: no escala a múltiples usuarios ni a acceso concurrente. Aceptable para uso personal.

---

## ADR-002: Arquitectura frontend/backend desacoplada

**Fecha:** 2026-02-18
**Estado:** Aceptado

### Contexto
Si el frontend accediera directamente a la persistencia, cualquier cambio de storage
(Local Storage → Google Drive → base de datos) implicaría refactorizar también el frontend.
Además, el OCR post-MVP y la autenticación futura residen en el backend.

### Decisión
El frontend solo se comunica con el backend vía HTTP (API REST).
La capa de persistencia es un adaptador interno del backend, invisible para el frontend.

### Consecuencias
- El contrato API (`docs/architecture/api-contract.md`) es el único punto de acoplamiento entre capas.
- El frontend puede desarrollarse y testearse de forma independiente con mocks del API.
- La persistencia puede migrarse (Google Drive, SQLite, PostgreSQL) sin tocar el frontend.

---

## ADR-003: Vanilla JS como stack del frontend para el MVP

**Fecha:** 2026-02-18
**Estado:** Aceptado

### Contexto
El alcance del MVP del frontend es una sola pantalla con dos funciones:
1. Formulario para registrar una medición manual.
2. Listado de mediciones ordenadas por fecha.

No hay routing, no hay autenticación, no hay estado complejo compartido entre vistas.
El backend ya maneja toda la lógica de negocio y validación.
Las features de crecimiento (OCR, gráficas) son post-MVP y no están priorizadas.

Se evaluaron tres opciones:

| Opción | Build tooling | Dependencias extra | Adecuación al MVP |
|---|---|---|---|
| **Vanilla JS + fetch** | No necesario | 0 | ✅ Óptimo |
| Svelte + Vite | Requerido | Svelte, Vite | Overkill para 1 pantalla |
| Vue 3 (CDN) | Opcional | Vue (~40 KB) | Overkill para 1 pantalla |

### Decisión
Usar **Vanilla JS** con la API `fetch` nativa para consumir el backend.
Sin frameworks, sin paso de compilación. Los ficheros se sirven estáticamente
desde `apps/frontend/public/`.

Estructura mínima:
```
apps/frontend/
  public/
    index.html       ← única página
    app.js           ← lógica de la UI (fetch, DOM)
    styles.css       ← estilos
  src/
    api.js           ← módulo de acceso al backend (fetch wrapper)
  tests/
```

### Consecuencias
- **Ventajas:** setup inmediato, cero dependencias, bundle mínimo, compatible con cualquier servidor estático.
- **Desventaja:** sin reactividad declarativa; añadir features complejas (OCR live preview, gráficas interactivas) requerirá más código imperativo.
- **Camino de migración:** si el UI crece más allá del MVP, se recomienda migrar a **Svelte + Vite** por su bundle compilado mínimo y su sintaxis cercana a HTML/JS nativo. La separación `src/api.js` facilita esta migración.
- El contrato con el backend no cambia; solo cambia cómo se renderiza el frontend.

---

## ADR-004: Playwright como herramienta E2E y estrategia de arranque combinado

**Fecha:** 2026-02-18
**Estado:** Propuesto

### Contexto

El QA Engineer debe implementar el flujo E2E crítico TC-09 (registro manual completo) y
los flujos secundarios TC-10 (estado vacío) y TC-11 (error de backend).

Restricciones del entorno:

- El frontend es Vanilla JS estático, sin build step ni framework.
- El backend es Node.js/Express (ES Modules) en el puerto 3000.
- El equipo ya usa Jest (89 tests, 96 % cobertura) con `--experimental-vm-modules`.
- Los tests E2E deben ejecutarse en CI Linux headless.
- Alcance MVP: 1–3 flujos E2E; la simplicidad de setup es prioritaria.

Se evaluaron tres herramientas:

| Herramienta | Runner propio | Integración Jest | Headless Linux | Auto-wait | Setup MVP |
|---|---|---|---|---|---|
| **Playwright** | Sí (`@playwright/test`) | Opcional (`jest-playwright`) | ✅ Nativo | ✅ Sí | Mínimo |
| Cypress | Sí (Cypress Test Runner) | ❌ Incompatible | ✅ Con Xvfb o `--headless` | ✅ Sí | Pesado (Electron) |
| Puppeteer | No (usa Jest o Mocha) | ✅ `jest-puppeteer` | ✅ Con `--no-sandbox` | ❌ Manual | Medio |

**Playwright** destaca porque:
1. Instala sus propios binarios de navegador (`npx playwright install chromium`), sin dependencias del sistema en CI.
2. Su runner `@playwright/test` es completamente independiente de Jest: cero riesgo de conflicto con la config Jest existente (que usa `--experimental-vm-modules` y `testMatch`).
3. Auto-wait nativo: espera automáticamente que los elementos sean visibles/interactivos y que las peticiones fetch completen, lo que es crítico para el patrón "guardar → DOM se actualiza sin recarga" del TC-09.
4. API mínima para el MVP: `goto`, `fill`, `click`, `expect(locator).toBeVisible()`.
5. Primera clase en CI: `npx playwright install --with-deps chromium` resuelve todo en un paso.

**Cypress** se descarta por su runner Electron (más pesado en CI) y por la imposibilidad de integrarlo con la config Jest existente en el mismo `package.json` sin configuración adicional.

**Puppeteer** se descarta por requerir auto-wait manual para las actualizaciones de DOM asíncronas, lo que añade fragilidad a tests que validan renders tras fetch.

### Decisión

Usar **Playwright** (`@playwright/test`) como herramienta E2E, con su propio runner separado de Jest.

**Estrategia de arranque — servidor combinado:**

El backend Express servirá también los ficheros estáticos del frontend
(`apps/frontend/public/`) mediante `express.static`. Esto elimina la necesidad de un
segundo proceso servidor en los tests y evita configuración CORS adicional.
El backend dev implementará esta extensión en `apps/backend/src/api/app.js`
condicionada a una variable de entorno `SERVE_STATIC=true`.

Durante los tests E2E:
- `SERVE_STATIC=true` activa el servidor de estáticos en el propio Express.
- `DATA_FILE=data/measurements.e2e.json` aísla los datos E2E del archivo de datos de desarrollo.
- Playwright arranfca el servidor mediante el bloque `webServer` de `playwright.config.js`
  y espera a que `http://localhost:3000` responda antes de lanzar los tests.

URL única durante los E2E: `http://localhost:3000`
- Frontend: `http://localhost:3000/`
- API:      `http://localhost:3000/measurements`

**Ubicación de los tests:**
```
apps/frontend/tests/e2e/          ← specs y helpers
playwright.config.js              ← en la raíz del workspace
```

**Script npm:**
```
"test:e2e": "playwright test"
```

### Consecuencias

- Los tests Jest existentes no se ven afectados: `testMatch` de Jest excluye `*.spec.js`
  en `e2e/` porque Playwright usa su propio proceso.
- La cobertura Jest (96 %) permanece intacta; los tests E2E no se contabilizan en ella.
- El backend requiere un cambio menor (añadir `express.static` condicional), que el backend dev implementa.
- El archivo `data/measurements.e2e.json` debe añadirse a `.gitignore`.
- En CI basta con añadir `npx playwright install --with-deps chromium` antes de `playwright test`.
- Si el alcance E2E crece (post-MVP: OCR, gráficas), Playwright escala sin cambios de herramienta.

---

## ADR-005: Arquitectura de persistencia para PWA multiplataforma (anónimo + Google Drive)

**Fecha:** 2026-02-18
**Estado:** Aceptado

### Contexto

Han surgido tres requisitos que no estaban contemplados en ADR-001 y que condicionan la arquitectura de persistencia a largo plazo:

1. **Usuarios anónimos** (sin login) → sus datos deben vivir en `localStorage` del propio dispositivo. No existe ningún servidor que los almacene.
2. **Usuarios autenticados con Google** → sus datos deben sincronizarse en Google Drive del propio usuario. El objetivo explícito es **no gestionar ninguna base de datos propia**, ni de usuarios ni de datos personales.
3. **Multiplataforma** (web + Android + iOS) con el **mínimo coste de despliegue** y sin publicar en tiendas de aplicaciones.

Restricción técnica fundamental: `localStorage` es una API exclusiva del DOM del navegador. **Un proceso Node.js en un servidor no puede leer ni escribir en el `localStorage` de ningún cliente**. Cualquier estrategia que use `localStorage` exige que la lógica de persistencia resida en el cliente, no en el servidor.

La única tecnología que satisface simultáneamente los tres requisitos (sin tiendas, multiplataforma, instalable) es una **Progressive Web App (PWA)**: funciona como web en el navegador, puede instalarse en la pantalla de inicio de Android e iOS sin pasar por sus tiendas, y admite uso offline mediante Service Worker.

El ADR-001 eligió `JsonFileAdapter` (fichero JSON en disco del servidor) como solución provisional por simplicidad. Esa decisión sigue siendo válida para el entorno de desarrollo y para los tests de integración actuales, pero **no es la dirección de producción** a largo plazo.

---

### Opciones analizadas

#### Opción A — PWA con persistencia completamente en el cliente ✅ Recomendada

```
PWA (Frontend — Vanilla JS + Service Worker)
  ├─ Usuario anónimo   → localStorage  (clave: bp_measurements)
  └─ Usuario Google    → Google Drive API (llamada REST desde el cliente)
                          OAuth 2.0 con flujo PKCE (sin client_secret en servidor)

Backend mínimo (Node.js/Express) — rol reducido:
  ├─ Servir los ficheros estáticos del frontend
  ├─ Proxy OAuth (custodia el client_secret de Google de forma segura)  [post-MVP]
  └─ Endpoint OCR                                                        [post-MVP]
```

La lógica de negocio (validaciones, generación de UUID, ordenación) migra al frontend como módulos ES, manteniendo la misma separación por capas pero dentro del cliente:

```
apps/frontend/src/
  domain/
    measurement.js          ← validaciones (migradas desde backend)
  services/
    measurementService.js   ← lógica de aplicación
  infra/
    localStorageAdapter.js  ← implementa getAll() / save()
    googleDriveAdapter.js   ← implementa getAll() / save()  [post-MVP]
  api.js                    ← fetch al backend (solo OCR y OAuth en post-MVP)
  app.js                    ← orquestación UI
```

**Interfaz del adaptador de persistencia (cliente):**

```js
// Mismo contrato que JsonFileAdapter, pero ejecutado en el navegador
adapter.getAll()                          → Promise<Measurement[]>
adapter.save(measurements: Measurement[]) → Promise<void>
```

El `measurementService` del frontend recibe el adaptador por inyección de dependencias: en sesión anónima recibe `localStorageAdapter`; en sesión autenticada recibirá `googleDriveAdapter`.

**Ventajas:**
- Sin base de datos propia, sin gestión de usuarios, sin infraestructura de servidor para datos.
- Funciona offline (Service Worker cachea el shell de la app y gestiona la cola de escrituras).
- Instalable en Android e iOS como PWA sin tiendas.
- Despliegue: los ficheros estáticos pueden alojarse en GitHub Pages, Netlify o cualquier CDN; Node.js es opcional salvo para OAuth y OCR.
- Migración futura a Google Drive sin cambiar el contrato de la aplicación: solo se sustituye el adaptador.

**Desventajas:**
- La lógica de dominio en el cliente es más difícil de testear de forma aislada (requiere `jest-environment-jsdom` o equivalente).
- El flujo OAuth 2.0 con PKCE es más complejo de implementar que el flujo con `client_secret` en servidor.
- En iOS (Safari/WebKit), el `localStorage` de una PWA puede borrarse si la app no se usa durante **más de 7 días** (política ITP de Apple). El usuario debe ser informado.
- Los datos del modo anónimo quedan ligados a un dispositivo y navegador concretos; no hay sincronización entre dispositivos sin Google Drive.

---

#### Opción B — Backend como proxy de persistencia ❌ Descartada

El servidor Node.js actuaría como intermediario: recibiría peticiones del frontend y decidiría dónde persistir. Descartada porque:

- El backend **no puede acceder al `localStorage` del usuario**: son espacios de memoria completamente separados.
- Añadir un servidor entre cliente y Google Drive introduce latencia, coste de hosting continuo y un punto de fallo adicional, sin aportar valor para los requisitos dados.
- Rompe la premisa de "no gestionar datos personales en nuestros servidores".

---

#### Opción C — Mantener `JsonFileAdapter` como persistencia de producción ❌ No alineada

Válida como herramienta de desarrollo y testing, pero no cumple los requisitos:

- Los datos quedan en el servidor, no en el dispositivo del usuario (incumple req. 1 y 2).
- No funciona como PWA offline.
- Requiere un servidor Node.js activo con acceso al sistema de ficheros (complica el despliegue).
- No hay camino directo hacia Google Drive sin refactorizar la capa de persistencia completa.

---

### Tabla comparativa

| Criterio | Opción A (PWA + localStorage) | Opción B (proxy backend) | Opción C (JsonFileAdapter) |
|---|:---:|:---:|:---:|
| Datos en el dispositivo del usuario | ✅ | ❌ | ❌ |
| Sin base de datos propia en servidor | ✅ | ✅ | ✅ |
| Escalable a Google Drive | ✅ solo cambia el adaptador | ⚠️ refactor | ⚠️ refactor |
| Multiplataforma sin tiendas (PWA) | ✅ | ❌ | ❌ |
| Funciona offline | ✅ con Service Worker | ❌ | ❌ |
| Complejidad de implementación | Media | Alta | Baja (status quo) |
| Coste de hosting | Mínimo (CDN gratuito) | Servidor siempre activo | Servidor siempre activo |
| Riesgo pérdida de datos en iOS/Safari | ⚠️ ITP 7 días | N/A | N/A |

---

### Impacto sobre ADRs existentes

| ADR | Estado actual | Impacto |
|---|---|---|
| ADR-001 (JsonFileAdapter) | Aceptado | **Supersedido parcialmente**: pasa a ser adaptador de desarrollo/tests; no es la persistencia de producción |
| ADR-002 (frontend/backend desacoplados) | Aceptado | **Se mantiene en espíritu**: el frontend sigue sin conocer detalles de storage, pero la capa de persistencia es ahora un módulo del cliente, no un servidor externo |
| ADR-003 (Vanilla JS) | Aceptado | **Se mantiene**: Vanilla JS es compatible con PWA y Service Worker |
| ADR-004 (Playwright E2E) | Propuesto | **Requiere revisión**: los tests E2E deberán mockear `localStorage` en vez de usar `measurements.e2e.json` en disco |

---

### Impacto sobre componentes actuales

| Componente | Estado actual | Con ADR-005 aceptado |
|---|---|---|
| `apps/backend/src/infra/jsonFileAdapter.js` | Adaptador de producción | Solo desarrollo y tests de integración |
| `apps/backend/src/services/measurementService.js` | En backend | El equivalente migra al frontend |
| `apps/backend/src/controllers/measurementController.js` | En backend | Eliminable a largo plazo |
| `apps/backend/src/domain/measurement.js` | En backend | Se replica en el frontend |
| `apps/frontend/src/api.js` | fetch a localhost:3000 | Llama a módulo local de persistencia (no a fetch para datos) |
| Service Worker | Inexistente | Nuevo: offline + instalabilidad PWA |
| `localStorageAdapter.js` | Inexistente | Nuevo módulo en `apps/frontend/src/infra/` |
| `googleDriveAdapter.js` | Inexistente | Nuevo módulo post-MVP en `apps/frontend/src/infra/` |

---

### Hoja de ruta propuesta (para que el PO priorice)

**Fase 1 — MVP (anónimo, sin login):**
1. Crear `localStorageAdapter.js` en el frontend con la interfaz `getAll()` / `save()`.
2. Migrar `measurementService` y `validateMeasurement` al frontend.
3. Adaptar `app.js` para usar el servicio local en vez de `fetch` al backend para datos.
4. Configurar PWA básica: `manifest.json` + Service Worker de cache del shell.
5. El backend queda reducido a servidor de estáticos (sin endpoints de datos activos).
6. Actualizar tests frontend para cubrir la lógica de dominio migrada (`jest-environment-jsdom`).

**Fase 2 — Post-MVP (usuario autenticado con Google):**
1. Implementar flujo OAuth 2.0 con PKCE desde el frontend.
2. Crear `googleDriveAdapter.js` con la misma interfaz que `localStorageAdapter.js`.
3. El backend añade un endpoint proxy OAuth para custodiar el `client_secret`.
4. Lógica de selección de adaptador según estado de sesión (anónimo → localStorage, autenticado → Google Drive).
5. Flujo de migración de datos: exportar de `localStorage` e importar en Google Drive al hacer login por primera vez.

---

### Decisiones del PO (2026-02-18)

| # | Pregunta | Decisión |
|---|---|---|
| 1 | ¿El MVP usa ya `localStorage` en producción? | ✅ **Sí.** El MVP implementa `localStorage` directamente. `JsonFileAdapter` queda solo para desarrollo y tests. |
| 2 | ¿La instalación como PWA es requisito del MVP? | ✅ **Sí.** `manifest.json` y Service Worker básico son parte del alcance del MVP. |
| 3 | ¿Se acepta la limitación de iOS Safari (borrado tras 7 días)? | ✅ **Sí, se acepta.** Medida de mitigación: mostrar un aviso informativo en la UI cuando el navegador es Safari/iOS, explicando la limitación y recomendando usar la app con regularidad. |
| 4 | ¿Hay que migrar datos de `JsonFileAdapter` → `localStorage`? | ❌ **No.** No se requiere migración de datos previos. |
