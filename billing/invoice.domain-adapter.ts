/**
 * Adaptador: Invoice (domínio: servicos + despesas) → CreateInvoiceInput (PDF)
 * Converte o modelo de domínio para o formato do gerador de PDF
 */

import type { CreateInvoiceInput } from './invoice.service.js';
import type { Invoice as DomainInvoice, Client } from './models/invoice.js';
import type { InvoiceClient } from './invoice.types.js';
import { calculateInvoiceTotals } from './utils/calculateInvoiceTotals.js';

function formatMorada(client: Client): string {
  const m = client.morada;
  const partes = [m.rua, m.numero, m.andar].filter(Boolean);
  const linha1 = partes.join(', ');
  const linha2 = [m.codigoPostal, m.localidade, m.pais].filter(Boolean).join(' ');
  return linha2 ? `${linha1}, ${linha2}` : linha1;
}

function formatNif(nif: string): string {
  const s = String(nif || '').replace(/\s/g, '');
  if (s.length >= 9) return s.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  return s || '';
}

/** Mapeia cliente do domínio para InvoiceClient (formato PDF) */
function mapCliente(c: Client): InvoiceClient {
  return {
    nome: c.nome,
    nif: formatNif(c.nif),
    morada: formatMorada(c),
    codigoPostal: c.morada.codigoPostal,
    localidade: c.morada.localidade,
    pais: c.morada.pais,
    email: c.email,
    telefone: c.telefone,
    representanteLegal: c.representanteLegal,
  };
}

/** Gera menções legais a partir da fatura de domínio */
function buildMencoesLegais(inv: DomainInvoice): string {
  const partes: string[] = [];
  if (inv.ivaExemption === 'ARTIGO_53') {
    partes.push('Isento de IVA ao abrigo do Art.º 53 do CIVA.');
  }
  if (inv.retencaoAplicavel && inv.totais.retencaoTotal > 0) {
    partes.push(
      'Foi deduzida retenção na fonte nos termos do n.º 1 do Art.º 101.º do CIRS.'
    );
  }
  return partes.join(' ');
}

/**
 * Converte fatura de domínio para CreateInvoiceInput (gerador de PDF).
 * Serviços e despesas são achatados numa lista única de itens.
 */
export function domainInvoiceToCreateInput(
  domainInvoice: DomainInvoice,
  emitente: CreateInvoiceInput['emitente'],
  opts?: Partial<CreateInvoiceInput>
): CreateInvoiceInput {
  const totais = domainInvoice.totais;

  const itens = [
    ...domainInvoice.servicos.map((s) => ({
      descricao: s.descricao,
      artigo: '',
      quantidade: s.quantidade,
      precoUnitario: s.precoUnitario,
      incidencia: s.iva === 'isento_art53' ? 'isento' as const : 'normal' as const,
      ivaPercent: s.iva === 'isento_art53' ? 0 : 23,
    })),
    ...domainInvoice.despesas.map((d) => ({
      descricao: `[Despesa] ${d.descricao}`,
      artigo: '',
      quantidade: 1,
      precoUnitario: d.valor,
      incidencia: d.iva === 'isento' ? 'isento' as const : 'normal' as const,
      ivaPercent: d.iva === 'isento' ? 0 : 23,
    })),
  ];

  return {
    emitente,
    cliente: mapCliente(domainInvoice.clienteSnapshot),
    itens,
    percentagemRetencao: domainInvoice.retencaoPercent,
    mencoesLegais: buildMencoesLegais(domainInvoice),
    ...opts,
  };
}
