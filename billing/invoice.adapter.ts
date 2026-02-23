/**
 * Módulo Billing - Adaptador API (schema inglês) → formato interno
 */

import type { CreateInvoiceInput } from './invoice.service.js';
import type { InvoiceAPI } from './invoice.api-types.js';

/** Mapeia incidência da API para TaxIncidence interno */
function mapIncidence(incidence?: string | number): 'isento' | 'reduzido' | 'intermedio' | 'normal' {
  if (typeof incidence === 'number') return 'isento';
  const v = String(incidence || '').toLowerCase();
  if (v === 'reduzido' || v === 'reduced') return 'reduzido';
  if (v === 'intermedio' || v === 'intermediate') return 'intermedio';
  if (v === 'normal') return 'normal';
  return 'isento';
}

/**
 * Converte InvoiceAPI (schema inglês) para CreateInvoiceInput (formato interno)
 */
export function mapInvoiceAPIToInput(dto: InvoiceAPI): CreateInvoiceInput {
  const [codigoPostal, localidade] = parseAddress(dto.client.address);

  return {
    emitente: {
      nome: dto.issuer.name,
      nif: dto.issuer.nif.replace(/\s/g, ''),
      morada: '-',
      codigoPostal: codigoPostal || '-',
      localidade: localidade || '-',
      telefone: dto.issuer.phone,
      email: dto.issuer.email,
      iban: dto.issuer.iban,
    },
    cliente: {
      nome: dto.client.name,
      nif: dto.client.nif?.replace(/\s/g, '') || '',
      morada: dto.client.address,
      codigoPostal: codigoPostal || '',
      localidade: localidade || '',
      email: dto.client.email,
    },
    itens: dto.items.map((i) => ({
      descricao: i.description,
      artigo: i.article,
      quantidade: i.quantity,
      precoUnitario: i.unitPrice,
      ivaPercent: i.ivaPercent,
      incidencia: mapIncidence(i.incidence),
      total: i.total,
    })),
    numero: dto.invoiceNumber,
    dataEmissao: dto.issueDate,
    dataVencimento: dto.dueDate,
    atcud: dto.atcud,
    observacoes: dto.observations,
    incluirRecibo: !!dto.receipt,
    percentagemRetencao: dto.totals.services > 0 && dto.totals.retention > 0
      ? Math.round((dto.totals.retention / dto.totals.services) * 100) || 23
      : 0,
  };
}

/** Extrai código postal e localidade de uma morada (PT: "1000-001 Lisboa" ou "... 8500-590 Portimão") */
function parseAddress(address: string): [string, string] {
  const trimmed = (address || '').trim();
  let match = trimmed.match(/^(\d{4}-\d{3})\s+(.+)$/);
  if (match) return [match[1], match[2].trim()];
  match = trimmed.match(/,?\s*(\d{4}-\d{3})\s+([^,]+)$/);
  if (match) return [match[1], match[2].trim()];
  return ['', trimmed || ''];
}
