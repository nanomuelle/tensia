/**
 * Genera los iconos PNG mínimos requeridos por el manifest.json de la PWA.
 * Crea un PNG de color sólido (azul corporativo #2563eb) en cada tamaño.
 * Ejecución: node scripts/generate-icons.js
 *
 * No requiere dependencias externas: usa zlib nativo de Node.js.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'apps', 'frontend', 'public', 'icons');

// Color corporativo: #2563eb → R=37, G=99, B=235
const R = 37, G = 99, B = 235;

// ---- Utilidades PNG ----

function crc32(buf) {
  const table = buildCrcTable();
  let crc = 0xffffffff;
  for (const byte of buf) crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function buildCrcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function makePng(size) {
  // Cabecera PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);   // width
  ihdr.writeUInt32BE(size, 4);   // height
  ihdr[8] = 8;                    // bit depth
  ihdr[9] = 2;                    // color type: RGB
  // compression, filter, interlace = 0

  // IDAT: una fila = filtro (0x00) + R G B × size, repetida size veces
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(rowSize * size);
  for (let y = 0; y < size; y++) {
    const offset = y * rowSize;
    raw[offset] = 0; // filtro None
    for (let x = 0; x < size; x++) {
      raw[offset + 1 + x * 3 + 0] = R;
      raw[offset + 1 + x * 3 + 1] = G;
      raw[offset + 1 + x * 3 + 2] = B;
    }
  }

  const idat = deflateSync(raw);
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', iend),
  ]);
}

// ---- Generación ----

mkdirSync(ICONS_DIR, { recursive: true });

for (const size of [192, 512]) {
  const outPath = join(ICONS_DIR, `icon-${size}.png`);
  writeFileSync(outPath, makePng(size));
  console.log(`✅ Generado: ${outPath} (${size}×${size}px, #2563eb)`);
}
