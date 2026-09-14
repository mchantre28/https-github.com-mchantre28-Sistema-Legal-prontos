/**
 * Gera resources/icon-only.png com a marca a preencher o quadrado
 * e o mesmo cinzento da logo em todo o fundo.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const out = path.join(root, 'resources', 'icon-only.png');
const size = 1024;

const candidates = [
  path.join(root, 'assets', 'logo-solicitadora.png'),
  path.join(root, 'resources', 'icon-source.png'),
];

const src = candidates.find((p) => fs.existsSync(p));
if (!src) {
  console.error('Logo nao encontrada.');
  process.exit(1);
}

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const sample = (x, y) => {
  const i = (y * info.width + x) * info.channels;
  return [data[i], data[i + 1], data[i + 2]];
};

const corners = [sample(0, 0), sample(info.width - 1, 0), sample(0, info.height - 1)];
const bg = {
  r: Math.round(corners.reduce((s, c) => s + c[0], 0) / corners.length),
  g: Math.round(corners.reduce((s, c) => s + c[1], 0) / corners.length),
  b: Math.round(corners.reduce((s, c) => s + c[2], 0) / corners.length),
};

const trimmed = await sharp(src)
  .trim({ threshold: 40 })
  .png()
  .toBuffer();

const fill = 0.98;
const logoSize = Math.round(size * fill);
const logoBuf = await sharp(trimmed)
  .flatten({ background: bg })
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

const hex = '#' + [bg.r, bg.g, bg.b].map((n) => n.toString(16).padStart(2, '0')).join('');
console.log(`Icone gerado: ${out}`);
console.log(`Fonte: ${src}`);
console.log(`Cinzento: ${hex} (${bg.r},${bg.g},${bg.b})`);
console.log('Preenchimento: logo completa, fundo no cinzento da marca');
