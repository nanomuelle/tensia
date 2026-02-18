# Architectural Decisions (ADR)

## ADR-001: Uso de Local Storage como persistencia en el MVP

**Fecha:** 2026-02-18
**Estado:** Aceptado

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
