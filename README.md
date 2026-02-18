# Tensia

Aplicación personal de registro y consulta de mediciones de tensión arterial.
Permite registrar mediciones de forma manual y consultarlas en orden cronológico.

---

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

---

## Instalación

```bash
npm install
```

Copia el fichero de variables de entorno y ajusta los valores si es necesario:

```bash
cp .env.example .env
```

---

## Comandos

### `npm start`

Arranca la aplicación en **modo producción**. Levanta el servidor backend, sirve el frontend estático y abre automáticamente el navegador en `http://localhost:3000`.

```bash
npm start
```

### `npm run dev`

Arranca la aplicación en **modo desarrollo** con recarga automática ante cambios (nodemon). Al igual que `start`, sirve el frontend y abre el navegador.

```bash
npm run dev
```

### `npm test`

Ejecuta todos los tests unitarios e de integración con Jest.

```bash
npm test
```

### `npm run test:coverage`

Ejecuta los tests y genera un informe de cobertura en `coverage/`. La cobertura mínima exigida es del **70 %**.

```bash
npm run test:coverage
```

El informe HTML se puede consultar en `coverage/lcov-report/index.html`.

### `npm run test:e2e`

Ejecuta los tests end-to-end con Playwright. Requiere que el servidor esté levantado o que Playwright lo gestione según la configuración de `playwright.config.js`.

```bash
npm run test:e2e
```

---

## Variables de entorno

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto en el que escucha el servidor |
| `DATA_FILE` | `data/measurements.json` | Ruta al archivo JSON de persistencia |
| `SERVE_STATIC` | `true` | Sirve el frontend estático desde el backend |
| `OPEN_BROWSER` | `true` | Abre el navegador automáticamente al arrancar |

Los scripts `start` y `dev` activan `SERVE_STATIC` y `OPEN_BROWSER` de forma automática; no es necesario configurarlos en el `.env` para el flujo habitual de desarrollo.

---

## Documentación

La documentación técnica y de producto está en la carpeta `docs/`:

| Documento | Descripción |
|---|---|
| `docs/architecture/system-overview.md` | Arquitectura del sistema |
| `docs/architecture/api-contract.md` | Contrato de la API REST |
| `docs/architecture/data-model.md` | Modelo de datos |
| `docs/architecture/decisions.md` | Decisiones de arquitectura (ADRs) |
| `docs/product/mvp-scope.md` | Alcance del MVP |
| `docs/product/user-stories.md` | User stories |
| `docs/testing/test-strategy.md` | Estrategia de testing |
