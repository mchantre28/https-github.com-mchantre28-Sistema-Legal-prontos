/**
 * Cálculo centralizado dos totais da fatura
 * FUNÇÃO PURA: não muta o input, retorna apenas InvoiceTotals
 *
 * Regras:
 * - IVA: isento quando ivaExemption === 'ARTIGO_53' ou serviço.iva === 'isento_art53'
 * - Retenção: apenas quando retencaoAplicavel E serviço.aplicarRetencao
 * - Retenção aplica-se apenas sobre a base de serviços (não despesas)
 */

import type { InvoiceDraft, InvoiceTotals } from '../models/invoice.js';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateInvoiceTotals(draft: InvoiceDraft): InvoiceTotals {
  const {
    servicos,
    despesas,
    ivaExemption,
    ivaTaxaNormal,
    retencaoPercent,
    retencaoAplicavel,
  } = draft;

  // Subtotal serviços
  const subtotalServicos = round2(
    servicos.reduce((acc, s) => acc + s.quantidade * s.precoUnitario, 0)
  );

  // Subtotal despesas
  const subtotalDespesas = round2(despesas.reduce((acc, d) => acc + d.valor, 0));

  // IVA serviços — isento quando Art.53 aplicável ou item isento
  const ivaServicos = servicos.reduce((acc, s) => {
    if (ivaExemption === 'ARTIGO_53' || s.iva === 'isento_art53') return acc;
    return acc + s.quantidade * s.precoUnitario * (ivaTaxaNormal / 100);
  }, 0);

  // IVA despesas
  const ivaDespesas = despesas.reduce((acc, d) => {
    if (d.iva === 'isento') return acc;
    return acc + d.valor * (ivaTaxaNormal / 100);
  }, 0);

  const ivaTotal = round2(ivaServicos + ivaDespesas);

  // Base para retenção: apenas serviços com aplicarRetencao, só se retencaoAplicavel
  const baseParaRetencao = servicos.reduce((acc, s) => {
    if (!retencaoAplicavel || !s.aplicarRetencao) return acc;
    return acc + s.quantidade * s.precoUnitario;
  }, 0);

  const retencaoTotal = round2(baseParaRetencao * (retencaoPercent / 100));

  const totalBruto = round2(subtotalServicos + subtotalDespesas + ivaTotal);
  const totalPagar = round2(Math.max(0, totalBruto - retencaoTotal));

  return {
    subtotalServicos,
    subtotalDespesas,
    ivaTotal,
    retencaoTotal,
    totalPagar,
  };
}
