/**
 * Módulo Billing - Funções de cálculo puras e determinísticas
 */

import type { Invoice, InvoiceItem, InvoiceTotals } from './invoice.types.js';

/** Arredonda a 2 casas decimais */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Percentagem de IVA por incidência (Portugal) */
const IVA_POR_INCIDENCIA: Record<string, number> = {
  isento: 0,
  reduzido: 6,
  intermedio: 13,
  normal: 23,
};

/**
 * Calcula o total de um item (quantidade * preço - descontos)
 */
export function calculateItemTotal(item: InvoiceItem): number {
  const qtd = Number(item.quantidade) || 0;
  const preco = Number(item.precoUnitario) || 0;
  let total = round2(qtd * preco);
  const descPercent = Number(item.descontoPercent) || 0;
  const descValor = Number(item.descontoValor) || 0;
  if (descPercent > 0) total = round2(total * (1 - descPercent / 100));
  if (descValor > 0) total = round2(Math.max(0, total - descValor));
  return total;
}

/**
 * Obtém a percentagem de IVA do item (explícita ou por incidência)
 */
export function getItemIvaPercent(item: InvoiceItem): number {
  if (typeof item.ivaPercent === 'number') return item.ivaPercent;
  return IVA_POR_INCIDENCIA[item.incidencia] ?? 0;
}

/**
 * Calcula a retenção na fonte sobre o subtotal
 */
export function calculateRetention(invoice: Invoice, subtotal?: number): number {
  const percent = Number(invoice.percentagemRetencao) || 0;
  if (percent <= 0) return 0;

  const base = subtotal ?? (invoice.totais?.subtotal ?? 0);
  return round2(base * (percent / 100));
}

/**
 * Calcula os totais da fatura
 */
export function calculateTotals(invoice: Invoice): InvoiceTotals {
  let subtotal = 0;
  let totalIva = 0;

  for (const item of invoice.itens) {
    const itemTotal = calculateItemTotal(item);
    const ivaPercent = getItemIvaPercent(item);
    const ivaItem = round2(itemTotal * (ivaPercent / 100));
    subtotal = round2(subtotal + itemTotal);
    totalIva = round2(totalIva + ivaItem);
  }

  const totalComIva = round2(subtotal + totalIva);
  const retencao = calculateRetention(invoice, subtotal);
  const valorAPagar = round2(Math.max(0, totalComIva - retencao));

  return {
    subtotal,
    iva: totalIva,
    totalComIva,
    retencao,
    valorAPagar,
  };
}

/**
 * Calcula o valor a pagar (total com IVA - retenção)
 */
export function calculateAmountToPay(
  invoice: Invoice,
  totalComIva?: number,
  retencao?: number
): number {
  const totais = invoice.totais ?? calculateTotals(invoice);
  const total = totalComIva ?? totais.totalComIva;
  const ret = retencao ?? totais.retencao;
  return round2(Math.max(0, total - ret));
}

/**
 * Gera número de fatura (formato: PREFIX-AAAAMMDD-NNN)
 * Determinístico quando date e sequence são fornecidos
 * @param prefix - Prefixo (ex: FAT, REC)
 * @param options - Data e/ou sequência para saída determinística
 */
export function generateInvoiceNumber(
  prefix: string,
  options?: { date?: Date; sequence?: number }
): string {
  const date = options?.date ?? new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const seq =
    typeof options?.sequence === 'number' && options.sequence >= 1
      ? Math.min(999, Math.floor(options.sequence))
      : Math.floor(Date.now() % 999) + 1;
  const p = (prefix || 'FAT').toUpperCase().substring(0, 3);
  return `${p}-${year}${month}${day}-${String(seq).padStart(3, '0')}`;
}

/**
 * Gera número de recibo (formato: PREFIX-AAAAMMDD-NNN)
 * Determinístico quando date e sequence são fornecidos
 */
export function generateReceiptNumber(
  prefix: string,
  options?: { date?: Date; sequence?: number }
): string {
  return generateInvoiceNumber(prefix || 'REC', options);
}

/**
 * Prepara itens com total calculado
 */
export function prepareInvoiceItems(itens: InvoiceItem[]): InvoiceItem[] {
  return itens.map((item) => ({
    ...item,
    total: calculateItemTotal(item),
  }));
}
