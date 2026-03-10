/**
 * Gera QR Code para URL do site (Solicitadora Ana Paula Medina)
 * Uso: node scripts/gerar-qr-website.mjs
 */

import QRCode from 'qrcode';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const URL = 'https://www.anapaulamedinasolicitadora.pt/';
const OUT = join(__dirname, '..', 'qr-anapaulamedinasolicitadora.png');

const buffer = await QRCode.toBuffer(URL, {
  type: 'png',
  margin: 2,
  width: 256,
  errorCorrectionLevel: 'M',
});

writeFileSync(OUT, buffer);
console.log('QR Code gerado:', OUT);
