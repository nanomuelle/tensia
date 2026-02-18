/**
 * Punto de entrada del servidor backend de Tensia.
 * Carga configuración, instancia el adaptador de persistencia y arranca el servidor.
 */

import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
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
  const url = `http://localhost:${PORT}`;
  console.log(`[Tensia] Servidor escuchando en ${url}`);
  console.log(`[Tensia] Usando archivo de datos: ${DATA_FILE}`);

  if (process.env.OPEN_BROWSER === 'true') {
    // Apertura del navegador multiplataforma (Linux: xdg-open, macOS: open, Windows: start)
    const cmd =
      process.platform === 'win32'
        ? `start ${url}`
        : process.platform === 'darwin'
          ? `open ${url}`
          : `xdg-open ${url}`;
    exec(cmd, (err) => {
      if (err) console.log(`[Tensia] Abre manualmente en el navegador: ${url}`);
    });
  }
});
