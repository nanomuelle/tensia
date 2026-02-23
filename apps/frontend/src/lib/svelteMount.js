/**
 * Adaptador delgado sobre la API programática de Svelte 5.
 * Centraliza los imports de mount/unmount para facilitar el mock en tests
 * sin necesidad de interceptar el módulo 'svelte' completo.
 *
 * Uso: import { svelteMount, svelteUnmount } from '../lib/svelteMount.js';
 */
export { mount as svelteMount, unmount as svelteUnmount } from 'svelte';
