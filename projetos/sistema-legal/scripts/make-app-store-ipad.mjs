/**
 * Gera capturas iPad 13" (2064 × 2752) a partir das capturas iPhone 6.5".
 * Tamanho exigido pelo App Store Connect para o ecrã de 13 polegadas.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'resources', 'app-store');
const WIDTH = 2064;
const HEIGHT = 2752;
const BG = { r: 15, g: 23, b: 42, alpha: 1 };

const files = [
  ['iphone-65-1-acesso.png', 'ipad-13-1-acesso.png'],
  ['iphone-65-2-login.png', 'ipad-13-2-login.png'],
  ['iphone-65-3-painel.png', 'ipad-13-3-painel.png'],
  ['iphone-65-4-admin.png', 'ipad-13-4-admin.png'],
];

for (const [srcName, destName] of files) {
  const src = path.join(srcDir, srcName);
  const dest = path.join(srcDir, destName);
  if (!fs.existsSync(src)) {
    throw new Error(`Falta ${srcName}`);
  }

  await sharp(src)
    .resize(WIDTH, HEIGHT, { fit: 'contain', background: BG })
    .png()
    .toFile(dest);

  const meta = await sharp(dest).metadata();
  console.log(destName, `${meta.width}×${meta.height}`);
}

console.log('OK iPad 13" em', srcDir);
