/**
 * Módulo Billing - Geração de PDF com Puppeteer
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Invoice } from './invoice.types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Gera PDF da fatura
 * @param invoice - Objeto fatura completo (com HTML renderizado ou template preenchido)
 * @param htmlContent - HTML completo já renderizado (opcional)
 * @param cssContent - CSS completo (opcional)
 * @returns Buffer do PDF
 */
/** Caminhos comuns do Chrome/Edge no Windows (fallback quando Puppeteer não tem browser) */
const CHROME_PATHS_WIN = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean) as string[];

function findSystemBrowser(): string | undefined {
  for (const p of CHROME_PATHS_WIN) {
    if (p && existsSync(p)) return p;
  }
  return undefined;
}

export async function generateInvoicePDF(
  invoice: Invoice,
  htmlContent: string,
  cssContent: string
): Promise<Buffer> {
  const puppeteer = await import('puppeteer');
  const fullHtml = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fatura</title>
  <style>${cssContent}</style>
</head>
<body>
${htmlContent}
</body>
</html>`;

  const launchOpts: Parameters<typeof puppeteer.default.launch>[0] = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  let browser;
  try {
    browser = await puppeteer.default.launch(launchOpts);
  } catch {
    const exe = findSystemBrowser();
    if (exe) {
      launchOpts.executablePath = exe;
      browser = await puppeteer.default.launch(launchOpts);
    } else {
      throw new Error(
        'Chrome/Edge não encontrado. Instale o Chrome ou execute: npx puppeteer browsers install chrome'
      );
    }
  }

  try {
    const page = await browser!.newPage();
    await page.setContent(fullHtml, {
      waitUntil: 'load',
      timeout: 10000,
    });

    const pdfData = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
    });

    return Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData as ArrayBufferView | ArrayBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Carrega template e CSS do disco (para uso com paths relativos)
 */
export function loadInvoiceAssets(): { template: string; css: string } {
  const billingDir = join(__dirname);
  let template: string;
  let css: string;
  try {
    template = readFileSync(join(billingDir, 'invoice.template.html'), 'utf-8');
  } catch {
    template = '';
  }
  try {
    css = readFileSync(join(billingDir, 'invoice.styles.css'), 'utf-8');
  } catch {
    css = '';
  }
  return { template, css };
}
