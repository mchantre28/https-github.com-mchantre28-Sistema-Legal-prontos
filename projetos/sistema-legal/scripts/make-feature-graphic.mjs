import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'resources', 'play-store');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'feature-graphic-1024x500.png');
const logoSrc = path.join(root, 'assets', 'logo-solicitadora.png');

const W = 1024;
const H = 500;

const bgSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="0" width="8" height="${H}" fill="#c9a227"/>
  <text x="520" y="210" fill="#f8fafc" font-family="Georgia, serif" font-size="56" font-weight="700">Sistema Legal</text>
  <text x="520" y="270" fill="#cbd5e1" font-family="Segoe UI, Arial, sans-serif" font-size="26">Ana Paula Medina - Solicitadora</text>
  <text x="520" y="320" fill="#94a3b8" font-family="Segoe UI, Arial, sans-serif" font-size="22">Gestao de clientes e processos</text>
</svg>`);

const logoSize = 280;
const logo = await sharp(logoSrc)
  .resize(logoSize, logoSize, {
    fit: 'contain',
    background: { r: 243, g: 244, b: 246, alpha: 1 },
  })
  .png()
  .toBuffer();

const plate = await sharp({
  create: {
    width: 320,
    height: 320,
    channels: 3,
    background: '#F3F4F6',
  },
})
  .png()
  .toBuffer();

await sharp(bgSvg)
  .composite([
    { input: plate, left: 80, top: 90 },
    { input: logo, left: 100, top: 110 },
  ])
  .png()
  .toFile(out);

console.log('OK', out);
