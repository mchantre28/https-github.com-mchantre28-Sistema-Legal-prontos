/**
 * Aplica a logo AR ao ícone e ao splash iOS (substitui o X do Capacitor).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const bg = { r: 243, g: 244, b: 246 };
const src = path.join(root, 'resources', 'icon-only.png');

if (!fs.existsSync(src)) {
  console.error('Falta resources/icon-only.png. Corre primeiro: npm run icons:prepare');
  process.exit(1);
}

const iconDir = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
const splashDir = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');

const iconOut = path.join(iconDir, 'AppIcon-512@2x.png');
await sharp(src)
  .resize(1024, 1024, { fit: 'cover' })
  .flatten({ background: bg })
  .png()
  .toFile(iconOut);

const splashBuf = await sharp(src)
  .resize(2732, 2732, { fit: 'cover' })
  .flatten({ background: bg })
  .png()
  .toBuffer();

for (const name of [
  'splash-2732x2732.png',
  'splash-2732x2732-1.png',
  'splash-2732x2732-2.png',
]) {
  fs.writeFileSync(path.join(splashDir, name), splashBuf);
}

console.log(`Ícone iOS: ${iconOut}`);
console.log(`Splash iOS: 3 ficheiros em ${splashDir}`);
