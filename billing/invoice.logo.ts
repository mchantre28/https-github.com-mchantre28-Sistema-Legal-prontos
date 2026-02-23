/**
 * Módulo Billing - Carregamento do logotipo da solicitadora
 * Suporta /assets/logo-solicitadora.png ou .svg
 * Cache em memória para evitar leituras repetidas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cachedLogo: string | null = null;

const LOGO_CANDIDATES = [
  path.resolve(__dirname, '..', 'assets', 'logo-solicitadora.png'),
  path.resolve(__dirname, '..', 'assets', 'logo-solicitadora.svg'),
];

/**
 * Carrega o logotipo da solicitadora e converte para base64.
 * Usa cache em memória para múltiplas faturas.
 * @returns data:image/png;base64,... ou data:image/svg+xml;base64,... ou string vazia
 */
export function loadLogoBase64(): string {
  if (cachedLogo) return cachedLogo;

  for (const logoPath of LOGO_CANDIDATES) {
    if (fs.existsSync(logoPath)) {
      const base64 = fs.readFileSync(logoPath, 'base64');
      const mime = logoPath.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/png';
      cachedLogo = `data:${mime};base64,${base64}`;
      return cachedLogo;
    }
  }
  return '';
}
