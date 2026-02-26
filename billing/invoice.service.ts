/**
 * Módulo Billing - Serviço principal de faturas
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import type { Invoice, InvoiceItem } from './invoice.types.js';
import {
  calculateTotals,
  prepareInvoiceItems,
  getItemIvaPercent,
  generateInvoiceNumber,
  generateReceiptNumber,
} from './invoice.calculations.js';
import { generateInvoiceQRCode } from './invoice.qr.js';
import { generateInvoicePDF } from './invoice.pdf.js';
import { loadLogoBase64 } from './invoice.logo.js';
import { signInvoicePdfWithP12 } from './invoice.sign.js';
import { sendInvoiceEmail } from './invoice.email.js';
import { mapInvoiceAPIToInput } from './invoice.adapter.js';
import type { InvoiceAPI } from './invoice.api-types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function isInvoiceAPI(data: CreateInvoiceInput | InvoiceAPI): data is InvoiceAPI {
  return 'invoiceNumber' in data && 'issuer' in data && 'client' in data;
}

/** Opções de email para createSignAndSendInvoice */
export interface CreateSignAndSendInvoiceOptions {
  /** Destinatário (default: cliente.email) */
  to?: string;
  /** Assunto (default: "Fatura {numero}") */
  subject?: string;
  /** Corpo texto (default: mensagem padrão) */
  text?: string;
  /** Corpo HTML (opcional) */
  html?: string;
}

/** Dados de entrada para criar fatura */
export interface CreateInvoiceInput {
  emitente: Invoice['emitente'];
  /** Caminho para ficheiro logo (png/jpg) - carrega e converte para base64 */
  logoPath?: string;
  cliente: Invoice['cliente'];
  itens: InvoiceItem[];
  /** Despesas (emolumentos, certidões, deslocações, etc.) — tabela separada no PDF */
  despesas?: InvoiceItem[];
  percentagemRetencao?: number;
  atcud?: string;
  numero?: string;
  dataEmissao?: string;
  dataVencimento?: string;
  observacoes?: string;
  /** Tipo de caso (herança, migração, registo, etc.) */
  tipoCaso?: 'herança' | 'migração' | 'registo' | 'contrato' | 'honorários' | 'procuração' | 'outro';
  /** Entidade (AIMA, IRN, Finanças, IMT, etc.) */
  entidade?: string;
  /** Área de atuação */
  areaAtuacao?: string;
  /** Número do processo/caso */
  numeroProcesso?: string;
  /** Objeto do processo */
  objetoProcesso?: string;
  /** Referência geral */
  referencia?: string;
  /** Termos de pagamento (ex: "30 dias") */
  termoPagamento?: string;
  /** Local de emissão */
  localEmissao?: string;
  /** Menções legais (Art.53 CIVA, retenção CIRS). Se omitido, pode ser inferido de observacoes */
  mencoesLegais?: string;
  /** ID honorário/processo (integração) */
  honorarioId?: string;
  processoId?: string;
  incluirRecibo?: boolean;
  /** Assinar PDF com certificado P12 (requer certs/assinatura.p12) */
  assinarPdf?: boolean;
  /** Dados extras do recibo (formaPagamento, referencia, localPagamento, comprovanteRef) */
  recibo?: Partial<{ formaPagamento: string; referencia: string; localPagamento: string; comprovanteRef: string }>;
  numeroPrefix?: string;
  /** Sequência para numeração determinística (1-999) */
  numeroSequence?: number;
  /** Template: "default" (completo, QR no footer) ou "simple" (layout compacto, QR no footer) */
  template?: 'default' | 'simple';
}

/** Resultado da criação de fatura */
export interface CreateInvoiceResult {
  pdfBuffer: Buffer;
  invoiceObject: Invoice;
}

/** Valida dados mínimos da fatura */
function validateInvoiceData(data: CreateInvoiceInput): void {
  if (!data.emitente?.nome) throw new Error('Emitente nome é obrigatório');
  if (!data.cliente?.nome) throw new Error('Cliente nome é obrigatório');
  if (!data.itens?.length && !data.despesas?.length) {
    throw new Error('Pelo menos um item (serviço ou despesa) é obrigatório');
  }

  for (const item of data.itens) {
    if (!item.descricao) throw new Error('Item sem descrição');
    if (!item.quantidade || item.quantidade <= 0) throw new Error('Item com quantidade inválida');
    if (item.precoUnitario == null || item.precoUnitario < 0)
      throw new Error('Item com preço unitário inválido');
  }
}

/** Formata valor em EUR */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

/** Formata NIF: 288132335 → 288 132 335 */
function formatNif(nif: string): string {
  const s = String(nif || '').replace(/\s/g, '');
  if (s.length >= 9) {
    return s.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return s || '__________';
}

/** Regista helpers Handlebars */
function registerHandlebarsHelpers(): void {
  Handlebars.registerHelper('formatCurrency', (value: number) => formatCurrency(value ?? 0));
  Handlebars.registerHelper('formatDate', (isoDate: string) => {
    if (!isoDate) return '';
    const [y, m, d] = String(isoDate).split(/[-/]/);
    return d && m && y ? `${d}/${m}/${y}` : isoDate;
  });
  Handlebars.registerHelper('formatNif', formatNif);
  const TIPO_CASO_LABELS: Record<string, string> = {
    herança: 'Herança',
    migração: 'Migração',
    registo: 'Registo',
    contrato: 'Contrato',
    honorários: 'Honorários',
    procuração: 'Procuração',
    outro: 'Outro',
  };
  Handlebars.registerHelper('formatTipoCaso', (val: string) =>
    TIPO_CASO_LABELS[val || ''] || String(val || '').replace(/^./, (c) => c.toUpperCase())
  );
  const UNIDADE_LABELS: Record<string, string> = {
    acto: 'Acto',
    hora: 'Hora',
    dia: 'Dia',
    unidade: 'Unidade',
    serviço: 'Serviço',
    outro: 'Outro',
  };
  Handlebars.registerHelper('formatUnidade', (val: string) =>
    UNIDADE_LABELS[val || ''] || String(val || '').replace(/^./, (c) => c.toUpperCase())
  );
}

/** Carrega e compila template HTML */
function loadAndCompileTemplate(templateName: 'default' | 'simple' = 'default'): Handlebars.TemplateDelegate {
  const filename = templateName === 'simple' ? 'invoice.template-simple.html' : 'invoice.template.html';
  const source = readFileSync(join(__dirname, filename), 'utf-8');
  return Handlebars.compile(source);
}

/** Carrega CSS */
function loadStyles(templateName: 'default' | 'simple' = 'default'): string {
  const filename = templateName === 'simple' ? 'invoice.styles-simple.css' : 'invoice.styles.css';
  return readFileSync(join(__dirname, filename), 'utf-8');
}

/** Prepara itens com total e ivaPercent para template */
function prepareItemsForTemplate(itens: InvoiceItem[]): InvoiceItem[] {
  const prepared = prepareInvoiceItems(itens);
  return prepared.map((item) => ({
    ...item,
    ivaPercent: getItemIvaPercent(item),
  }));
}

/**
 * Cria fatura completa: valida, calcula, gera QR, renderiza HTML e PDF
 */
export async function createInvoice(data: CreateInvoiceInput): Promise<CreateInvoiceResult> {
  validateInvoiceData(data);

  const dataEmissao = data.dataEmissao ?? new Date().toISOString().split('T')[0];
  const numOpts =
    data.dataEmissao || data.numeroSequence != null
      ? {
          date: data.dataEmissao ? new Date(data.dataEmissao) : undefined,
          sequence: data.numeroSequence,
        }
      : undefined;
  const numero =
    data.numero ??
    generateInvoiceNumber(data.numeroPrefix ?? 'FAT', numOpts);
  const numeroRecibo = data.incluirRecibo
    ? generateReceiptNumber(data.numeroPrefix ?? 'REC', numOpts)
    : undefined;

  const itensPreparados = prepareItemsForTemplate(data.itens ?? []);
  const despesasPreparadas = prepareItemsForTemplate(data.despesas ?? []);

  const emitente = { ...data.emitente };

  const subtotalServicos = itensPreparados.reduce((s, i) => s + (i.total ?? 0), 0);
  const subtotalDespesas = despesasPreparadas.reduce((s, i) => s + (i.total ?? 0), 0);

  const invoice: Invoice = {
    atcud: data.atcud,
    numero,
    dataEmissao,
    dataVencimento: data.dataVencimento,
    emitente,
    cliente: data.cliente,
    itens: itensPreparados,
    percentagemRetencao: data.percentagemRetencao,
    observacoes: data.observacoes,
    tipoCaso: data.tipoCaso,
    entidade: data.entidade,
    areaAtuacao: data.areaAtuacao,
    numeroProcesso: data.numeroProcesso,
    objetoProcesso: data.objetoProcesso,
    referencia: data.referencia,
    termoPagamento: data.termoPagamento,
    localEmissao: data.localEmissao,
    honorarioId: data.honorarioId,
    processoId: data.processoId,
    moeda: 'EUR',
  };

  const totaisServicos = calculateTotals(invoice);
  if (despesasPreparadas.length > 0) {
    const ivaDespesas = despesasPreparadas.reduce((acc, d) => {
      const total = d.total ?? 0;
      const ivaPct = typeof d.ivaPercent === 'number' ? d.ivaPercent : 0;
      return acc + total * (ivaPct / 100);
    }, 0);
    invoice.totais = {
      subtotal: totaisServicos.subtotal + subtotalDespesas,
      iva: totaisServicos.iva + Math.round(ivaDespesas * 100) / 100,
      totalComIva: 0,
      retencao: totaisServicos.retencao,
      valorAPagar: 0,
    };
    invoice.totais.totalComIva = Math.round((invoice.totais.subtotal + invoice.totais.iva) * 100) / 100;
    invoice.totais.valorAPagar = Math.max(0, invoice.totais.totalComIva - invoice.totais.retencao);
  } else {
    invoice.totais = totaisServicos;
  }

  if (data.incluirRecibo && invoice.totais) {
    invoice.recibo = {
      numero: numeroRecibo!,
      data: dataEmissao,
      valorRecebido: invoice.totais.valorAPagar,
      formaPagamento: data.recibo?.formaPagamento,
      referencia: data.recibo?.referencia,
      localPagamento: data.recibo?.localPagamento,
      comprovanteRef: data.recibo?.comprovanteRef,
    };
  }

  invoice.qrCodeBase64 = await generateInvoiceQRCode(invoice);

  // Fatura com logotipo: ana.png (em assets/) ou fallback logo-solicitadora.
  const logo = loadLogoBase64();

  const issuer = {
    name: emitente.nome,
    nif: formatNif(emitente.nif),
    phone: emitente.telefone || '',
    email: emitente.email || '',
    iban: emitente.iban || '',
    cedula: emitente.cedula || '',
    titulo: emitente.titulo || '',
    sede: emitente.sede || '',
    cae: emitente.cae || '',
    conservatoria: emitente.conservatoria || '',
  };

  const hasCaseMeta = !!(
    data.tipoCaso ||
    data.entidade ||
    data.areaAtuacao ||
    data.numeroProcesso ||
    data.objetoProcesso ||
    data.referencia
  );
  const hasUnidade = itensPreparados.some((i) => i.unidade);
  const hasDesconto = itensPreparados.some((i) => i.descontoPercent || i.descontoValor);
  const hasDespesas = despesasPreparadas.length > 0;

  const templateVariant = data.template ?? 'default';

  registerHandlebarsHelpers();
  const template = loadAndCompileTemplate(templateVariant);
  const templateData = {
    ...invoice,
    itens: itensPreparados,
    despesas: despesasPreparadas,
    hasDespesas,
    subtotalServicos,
    subtotalDespesas,
    logo,
    issuer,
    hasCaseMeta,
    hasUnidade,
    hasDesconto,
    mencoesLegais: data.mencoesLegais,
  };
  const htmlContent = template(templateData);

  const cssContent = loadStyles(templateVariant);

  let pdfBuffer = await generateInvoicePDF(invoice, htmlContent, cssContent);

  if (data.assinarPdf) {
    pdfBuffer = await signInvoicePdfWithP12(pdfBuffer);
  }

  return { pdfBuffer, invoiceObject: invoice };
}

/**
 * Cria fatura, assina com P12 e envia por email.
 * Requer: certs/assinatura.p12 e variáveis MAIL_* configuradas.
 * Aceita CreateInvoiceInput (PT) ou InvoiceAPI (EN).
 */
export async function createSignAndSendInvoice(
  data: CreateInvoiceInput | InvoiceAPI,
  emailOptions?: CreateSignAndSendInvoiceOptions
): Promise<CreateInvoiceResult> {
  const input = isInvoiceAPI(data) ? mapInvoiceAPIToInput(data) : data;
  const result = await createInvoice({
    ...input,
    assinarPdf: true,
  });

  const to = emailOptions?.to ?? input.cliente?.email;
  if (!to) {
    throw new Error('Cliente sem email. Indique cliente.email ou emailOptions.to');
  }

  await sendInvoiceEmail({
    to,
    subject: emailOptions?.subject ?? `Fatura ${result.invoiceObject.numero}`,
    text:
      emailOptions?.text ??
      'Segue em anexo a sua fatura assinada digitalmente.',
    html: emailOptions?.html,
    pdfBuffer: result.pdfBuffer,
    filename: `fatura-${result.invoiceObject.numero}.pdf`,
  });

  return result;
}

/**
 * Converte schema API (inglês) para CreateInvoiceInput
 */
export { mapInvoiceAPIToInput } from './invoice.adapter.js';
