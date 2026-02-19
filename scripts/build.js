/**
 * Script de build para la publicación estática de Tensia.
 *
 * Combina los dos directorios que Express sirve como estáticos:
 *   - apps/frontend/public/ → dist/        (index.html, styles.css, sw.js, manifest.json, icons/)
 *   - apps/frontend/src/    → dist/src/    (módulos ES del frontend)
 *
 * Si la variable de entorno BASE_PATH está definida (ej. "/tensia"),
 * parchea las rutas absolutas en index.html, sw.js y manifest.json
 * para que funcionen correctamente en subdirectorios (GitHub Pages).
 *
 * Uso:
 *   node scripts/build.js                         # sin base path (servidor propio en raíz)
 *   BASE_PATH=/tensia node scripts/build.js        # para GitHub Pages
 */

import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const DIST      = join(ROOT, 'dist');
const BASE_PATH = (process.env.BASE_PATH ?? '').replace(/\/$/, ''); // sin slash final
// BUILD_ID se usa para versionar el nombre de la caché del Service Worker.
// En GitHub Actions se pasa el SHA corto del commit; en local se usa un timestamp.
const BUILD_ID  = (process.env.BUILD_ID ?? Date.now().toString()).slice(0, 8);

// --- 1. Limpiar y crear directorio de salida ---
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// --- 2. Copiar ficheros estáticos ---
// public/ → dist/
cpSync(join(ROOT, 'apps', 'frontend', 'public'), DIST, { recursive: true });
// src/ → dist/src/
cpSync(join(ROOT, 'apps', 'frontend', 'src'), join(DIST, 'src'), { recursive: true });

// --- 3. Parchear rutas absolutas si se despliega en subdirectorio ---
if (BASE_PATH) {
  console.log(`Parcheando rutas con BASE_PATH="${BASE_PATH}"…`);

  // --- index.html ---
  let html = readFileSync(join(DIST, 'index.html'), 'utf8');

  // Inyectar <base href> justo después de <head> para que las rutas relativas funcionen
  html = html.replace(
    /(<head[^>]*>)/,
    `$1\n    <base href="${BASE_PATH}/">`,
  );

  // El SW debe registrarse con la ruta absoluta correcta
  html = html.replace(
    "navigator.serviceWorker.register('/sw.js')",
    `navigator.serviceWorker.register('${BASE_PATH}/sw.js')`,
  );

  writeFileSync(join(DIST, 'index.html'), html, 'utf8');

  // --- sw.js: parchear SHELL_URLS (rutas absolutas) ---
  let sw = readFileSync(join(DIST, 'sw.js'), 'utf8');

  // Reemplaza cada URL absoluta del array SHELL_URLS
  // Ejemplo: '/' → '/tensia/'  ,  '/styles.css' → '/tensia/styles.css'
  sw = sw.replace(
    /(['"])(\/(?:styles\.css|src\/[^'"]+|manifest\.json)?)\1/g,
    (match, quote, url) => {
      const patched = url === '/' ? `${BASE_PATH}/` : `${BASE_PATH}${url}`;
      return `${quote}${patched}${quote}`;
    },
  );

  writeFileSync(join(DIST, 'sw.js'), sw, 'utf8');

  // --- manifest.json: ajustar start_url ---
  const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
  manifest.start_url = `${BASE_PATH}/`;
  writeFileSync(join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

// --- 4. Versionar CACHE_NAME en sw.js con el BUILD_ID ---
// Permite que el navegador detecte un Service Worker nuevo en cada despliegue
// y elimine automáticamente la caché antigua (via evento activate).
let swFinal = readFileSync(join(DIST, 'sw.js'), 'utf8');
swFinal = swFinal.replace(
  /const CACHE_NAME = 'tensia-shell-[^']*';/,
  `const CACHE_NAME = 'tensia-shell-${BUILD_ID}';`,
);
writeFileSync(join(DIST, 'sw.js'), swFinal, 'utf8');

console.log(`✓ Build completado → dist/  (BASE_PATH="${BASE_PATH || '(raíz)'}", BUILD_ID="${BUILD_ID}")`);
