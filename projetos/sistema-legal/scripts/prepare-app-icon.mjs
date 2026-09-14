/**
 * Gera resources/icon-only.png com a marca a preencher o quadrado.
 * Corta o fundo vazio da logo e deixa só uma margem mínima para
 * os cantos arredondados do iOS/Android não comerem o monograma.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const out = path.join(root, 'resources', 'icon-only.png');
const size = 1024;
const fill = 0.98;
const bg = { r: 243, g: 244, b: 246 };

const candidates = [
  path.join(root, 'assets', 'logo-solicitadora.png'),
  path.join(root, 'resources', 'icon-source.png'),
];

const src = candidates.find((p) => fs.existsSync(p));
if (!src) {
  console.error('Logo nao encontrada.');
  process.exit(1);
}

const trimmed = await sharp(src)
  .trim({ threshold: 40 })
  .png()
  .toBuffer();

const logoSize = Math.round(size * fill);
const logoBuf = await sharp(trimmed)
  .resize(logoSize, logoSize, {
    fit: 'contain',
    background: { ...bg, alpha: 1 },
  })
  .png()
  .toBuffer();

const left = Math.round((size - logoSize) / 2);
const top = Math.round((size - logoSize) / 2);

await sharp({
  create: {
    width: size,
    height: size,
    channels: 3,
    background: bg,
  },
})
  .composite([{ input: logoBuf, left, top }])
  .png()
  .toFile(out);

console.log(`Icone gerado: ${out}`);
console.log(`Fonte: ${src}`);
console.log(`Preenchimento: ${Math.round(fill * 100)}% do quadrado apos corte do fundo`);

