/**
 * Copia billing/fatura-recibo-template-exato.html para projetos/sistema-legal/fatura-recibo.html
 * e ajusta o caminho do logo (../assets/ → assets/) para funcionar no deploy.
 *
 * Executar antes de cada commit quando alterares o template da fatura:
 *   npm run sync-fatura
 * ou: node scripts/sync-fatura-sistema-legal.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const src = join(root, 'billing', 'fatura-recibo-template-exato.html');
const dest = join(root, 'projetos', 'sistema-legal', 'fatura-recibo.html');

let html = readFileSync(src, 'utf-8');

// Ajustar caminho do logo: na raiz do repo é ../assets/; em sistema-legal é assets/
html = html.replace(/src="\.\.\/assets\/([^"]+)"/g, 'src="assets/$1"');

mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, html, 'utf-8');

console.log('Fatura sincronizada: billing/fatura-recibo-template-exato.html → projetos/sistema-legal/fatura-recibo.html');
