/**
 * Punto de entrada del servidor backend de Tensia.
 * Con ADR-005, el backend MVP solo sirve los ficheros estáticos del frontend.
 * No gestiona persistencia de mediciones (responsabilidad del cliente).
 */

import 'dotenv/config';
import { exec } from 'node:child_process';
import { createApp } from './api/app.js';

const PORT = process.env.PORT ?? 3000;

const app = createApp();

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`[Tensia] Servidor escuchando en ${url}`);

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
