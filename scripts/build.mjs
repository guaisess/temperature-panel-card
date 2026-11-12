// Script de build: concatena los ficheros de src/ en un único JS para HACS.
// Versión: 2026.11.1
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// Orden de concatenación (dependencias primero)
const ficheros = ['config', 'i18n', 'color-scale', 'history-service', 'stats', 'sparkline-chart', 'styles', 'card', 'editor', 'index'];
const cuerpo = ficheros
  .map((f) => readFileSync(new URL(`../src/${f}.js`, import.meta.url), 'utf8'))
  .join('\n');
mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('../dist/temperature-panel-card.js', import.meta.url), `(() => {\n${cuerpo}\n})();\n`);
console.log('dist/temperature-panel-card.js generado');
