/**
 * Copia o frontend estático para www/ (webDir do Capacitor).
 */
import { cpSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const root = join(import.meta.dirname, '..');
const www = join(root, 'www');

const dirs = ['assets', 'branding'];
const files = [
  'index.html',
  '404.html',
  'cliente.html',
  'admin.html',
  'fatura-recibo.html',
  'script.js',
  'styles.css',
  'api.js',
  'app.js',
  'auth-guard.js',
  'admin.js',
  'cliente.js',
  'manifest.json',
  'logo-data.js',
  'serve.json',
  '.nojekyll'
];

if (existsSync(www)) rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

for (const f of files) {
  const src = join(root, f);
  if (existsSync(src)) cpSync(src, join(www, f));
}

for (const d of dirs) {
  const src = join(root, d);
  if (existsSync(src)) cpSync(src, join(www, d), { recursive: true });
}

console.log('www/ atualizado para Capacitor.');
