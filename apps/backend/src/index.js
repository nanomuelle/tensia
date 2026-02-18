/**
 * Punto de entrada del servidor backend de Tensia.
 * Carga configuración, instancia el adaptador de persistencia y arranca el servidor.
 */

import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JsonFileAdapter } from './infra/jsonFileAdapter.js';
import { createApp } from './api/app.js';

// Ruta absoluta a la raíz del proyecto (tres niveles arriba de apps/backend/src/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_PROYECTO = path.resolve(__dirname, '..', '..', '..');

const PORT = process.env.PORT ?? 3000;
const DATA_FILE = path.resolve(RAIZ_PROYECTO, process.env.DATA_FILE ?? 'data/measurements.json');

// Instancia del adaptador de persistencia (inyectado en la app)
const adapter = new JsonFileAdapter(DATA_FILE);

const app = createApp(adapter);

app.listen(PORT, () => {
  console.log(`[Tensia] Servidor escuchando en http://localhost:${PORT}`);
  console.log(`[Tensia] Usando archivo de datos: ${DATA_FILE}`);
});
