/**
 * Adaptador de persistencia: archivo JSON en disco.
 * Implementa la interfaz del repositorio de mediciones para el MVP.
 * Es intercambiable por otro adaptador (Google Drive, base de datos, etc.) sin modificar los servicios.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/** Estructura vacía que se usa al inicializar el archivo por primera vez. */
const ESTRUCTURA_INICIAL = {
  version: '1.0',
  measurements: [],
};

export class JsonFileAdapter {
  /**
   * @param {string} filePath - Ruta absoluta o relativa al archivo JSON de datos.
   */
  constructor(filePath) {
    this.filePath = filePath;
  }

  /**
   * Lee el archivo y devuelve el array de mediciones.
   * Si el archivo no existe, lo inicializa con la estructura vacía y devuelve [].
   *
   * @returns {Promise<Array>}
   */
  async getAll() {
    if (!existsSync(this.filePath)) {
      await this._inicializar();
      return [];
    }

    const contenido = await readFile(this.filePath, 'utf-8');
    const datos = JSON.parse(contenido);
    return datos.measurements ?? [];
  }

  /**
   * Sobreescribe el array completo de mediciones en el archivo.
   *
   * @param {Array} measurements - Array completo de mediciones a persistir.
   * @returns {Promise<void>}
   */
  async save(measurements) {
    const datos = {
      version: '1.0',
      measurements,
    };
    await writeFile(this.filePath, JSON.stringify(datos, null, 2), 'utf-8');
  }

  /**
   * Inicializa el archivo con la estructura vacía.
   * Crea los directorios intermedios si no existen.
   *
   * @returns {Promise<void>}
   */
  async _inicializar() {
    const { mkdir } = await import('node:fs/promises');
    const dir = path.dirname(this.filePath);
    await mkdir(dir, { recursive: true });
    await writeFile(
      this.filePath,
      JSON.stringify(ESTRUCTURA_INICIAL, null, 2),
      'utf-8',
    );
  }
}
