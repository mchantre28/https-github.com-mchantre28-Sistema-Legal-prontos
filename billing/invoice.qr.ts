/**
 * Módulo Billing - Geração de QR Code para Faturas
 */

import type { Invoice } from './invoice.types.js';

/** Forma o payload ATCUD para o QR Code (formato simplificado português) */
function buildQRPayload(invoice: Invoice): string {
  const parts: string[] = [];

  if (invoice.emitente?.nif) {
    parts.push(`NIF:${invoice.emitente.nif}`);
  }
  if (invoice.numero) {
    parts.push(`FT:${invoice.numero}`);
  }
  if (invoice.dataEmissao) {
    parts.push(`DT:${invoice.dataEmissao}`);
  }
  if (invoice.totais?.valorAPagar != null) {
    parts.push(`VT:${invoice.totais.valorAPagar.toFixed(2)}`);
  }
  if (invoice.totais?.retencao && invoice.totais.retencao > 0) {
    parts.push(`RI:${invoice.totais.retencao.toFixed(2)}`);
  }
  if (invoice.atcud) {
    parts.push(`ATCUD:${invoice.atcud}`);
  }

  return parts.join('|');
}

/**
 * Gera QR Code em base64 para a fatura
 * @param invoice - Objeto da fatura
 * @returns String base64 da imagem PNG
 */
export async function generateInvoiceQRCode(invoice: Invoice): Promise<string> {
  const payload = buildQRPayload(invoice);

  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(payload, {
    type: 'image/png',
    margin: 2,
    width: 120,
    errorCorrectionLevel: 'M',
  }).then((dataUrl: string) => {
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    return base64;
  });
}
