import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname } from 'path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'resources', 'play-store');
fs.mkdirSync(outDir, { recursive: true });

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(root, p.replace(/^\//, ''));
  if (!existsSync(file) || !file.startsWith(root)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const type = mime[extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  res.end(readFileSync(file));
});

await new Promise((resolve) => server.listen(8765, resolve));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
});
const page = await context.newPage();

await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
await page.screenshot({
  path: path.join(outDir, 'screenshot-1-acesso.png'),
  type: 'png',
});

const adminBtn = page.locator('button:has-text("Administrador"), a:has-text("Administrador")').first();
if (await adminBtn.count()) {
  await adminBtn.click();
  await page.waitForTimeout(1200);
}

const email = page.locator('input[type="email"], #email, input[name="email"]').first();
const pass = page.locator('input[type="password"], #password, input[name="password"]').first();
if (await email.count()) {
  await email.fill('solicitadora@sistema-legal.pt');
}

await page.screenshot({
  path: path.join(outDir, 'screenshot-2-login.png'),
  type: 'png',
});

await browser.close();
server.close();
console.log('OK screenshots em', outDir);
