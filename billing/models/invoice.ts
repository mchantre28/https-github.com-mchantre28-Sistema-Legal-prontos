/**
 * Modelo de Fatura — Firestore-ready
 * Serviços + Despesas com IVA (Art.53) e Retenção
 */

import type { Client } from './client.js';

/** Tipo de IVA do serviço */
export type IvaType = 'isento_art53' | 'taxa_normal';

/** Tipo de IVA da despesa */
export type ExpenseIvaType = 'isento' | 'taxa_normal';

/** Serviço faturado (linha da tabela de serviços) */
export interface InvoiceService {
  id: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  iva: IvaType;
  /** Apenas serviços com aplicarRetencao=true entram na base de retenção */
  aplicarRetencao: boolean;
}

/** Despesa faturada (emolumentos, certidões, deslocações, etc.) */
export interface InvoiceExpense {
  id: string;
  descricao: string;
  valor: number;
  iva: ExpenseIvaType;
}

/** Totais calculados pela função pura calculateInvoiceTotals */
export interface InvoiceTotals {
  subtotalServicos: number;
  subtotalDespesas: number;
  ivaTotal: number;
  retencaoTotal: number;
  totalPagar: number;
}

/** Entrada para cálculo (sem totais) */
export interface InvoiceDraft {
  servicos: InvoiceService[];
  despesas: InvoiceExpense[];
  retencaoAplicavel: boolean;
  ivaExemption: 'ARTIGO_53' | null;
  ivaTaxaNormal: number;
  retencaoPercent: number;
}

/** Invoice completa com totais calculados */
export interface Invoice extends InvoiceDraft {
  id: string;
  clienteId: string;
  /** Snapshot dos dados do cliente na data da fatura */
  clienteSnapshot: Client;
  totais: InvoiceTotals;
  criadoEm: Date;
}
