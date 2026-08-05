/**
 * Copia ic_launcher.png -> ic_launcher_foreground.png em todos os mipmap-*.
 * Necessário após `npm run icons:android` quando se usa icon-only (logo com fundo).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

const dirs = fs.readdirSync(resDir).filter((d) => d.startsWith('mipmap-'));
let updated = 0;

for (const dir of dirs) {
  const launcher = path.join(resDir, dir, 'ic_launcher.png');
  const foreground = path.join(resDir, dir, 'ic_launcher_foreground.png');
  if (fs.existsSync(launcher)) {
    fs.copyFileSync(launcher, foreground);
    updated++;
  }
}

console.log(`Adaptive icon foreground: ${updated} densidade(s) actualizada(s).`);
