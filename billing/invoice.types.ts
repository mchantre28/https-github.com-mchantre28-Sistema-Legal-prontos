/**
 * Módulo Billing - Tipos para Faturas e Recibos
 */

/** Incidência fiscal do item (IVA) */
export type TaxIncidence = 'isento' | 'reduzido' | 'intermedio' | 'normal';

/** Tipo de caso/processo */
export type TipoCaso =
  | 'herança'
  | 'migração'
  | 'registo'
  | 'contrato'
  | 'honorários'
  | 'procuração'
  | 'outro';

/** Dados da entidade emitente (solicitadora) */
export interface InvoiceIssuer {
  nome: string;
  nif: string;
  morada: string;
  codigoPostal: string;
  localidade: string;
  pais?: string;
  email?: string;
  telefone?: string;
  website?: string;
  /** IBAN para pagamentos */
  iban?: string;
  /** Cédula profissional (ex: 9738 para solicitadora) */
  cedula?: string;
  /** Título (Dr., Dra., etc.) */
  titulo?: string;
  /** Sede profissional (pode diferir da morada) */
  sede?: string;
  /** Código de atividade económica (CAE) */
  cae?: string;
  /** Conservatória de registo */
  conservatoria?: string;
  /** Logo em base64 (data:image/...) */
  logoBase64?: string;
  capitalSocial?: string;
  matricula?: string;
}

/** Dados do cliente/contribuinte */
export interface InvoiceClient {
  nome: string;
  nif?: string;
  morada: string;
  codigoPostal: string;
  localidade: string;
  pais?: string;
  email?: string;
  telefone?: string;
  /** Representante legal (quando empresa) */
  representanteLegal?: string;
  /** Número interno do cliente */
  numeroCliente?: string;
}

/** Unidade de medição do item */
export type UnidadeItem = 'acto' | 'hora' | 'dia' | 'unidade' | 'serviço' | 'outro';

/** Item individual da fatura */
export interface InvoiceItem {
  descricao: string;
  artigo?: string;
  quantidade: number;
  incidencia: TaxIncidence;
  precoUnitario: number;
  ivaPercent?: number; // 0, 6, 13, 23, etc.
  total?: number; // calculado
  /** Unidade (acto, hora, dia, etc.) */
  unidade?: UnidadeItem | string;
  /** Desconto em percentagem (0-100) */
  descontoPercent?: number;
  /** Desconto em valor fixo */
  descontoValor?: number;
  /** Referência externa (nº pedido, etc.) */
  referenciaExterna?: string;
}

/** Totais calculados da fatura */
export interface InvoiceTotals {
  subtotal: number;
  iva: number;
  totalComIva: number;
  retencao: number;
  valorAPagar: number;
}

/** Recibo integrado */
export interface InvoiceReceipt {
  numero: string;
  data: string;
  valorRecebido: number;
  formaPagamento?: string;
  /** Referência Multibanco ou outro */
  referencia?: string;
  /** Local do pagamento */
  localPagamento?: string;
  /** Referência do comprovante */
  comprovanteRef?: string;
}

/** Fatura completa */
export interface Invoice {
  /** ATCUD - Código de identificação único */
  atcud?: string;
  /** Número da fatura */
  numero: string;
  /** Data de emissão (ISO) */
  dataEmissao: string;
  /** Data de vencimento (ISO) */
  dataVencimento?: string;
  /** Emitente */
  emitente: InvoiceIssuer;
  /** Cliente */
  cliente: InvoiceClient;
  /** Itens */
  itens: InvoiceItem[];
  /** Totais (calculados) */
  totais?: InvoiceTotals;
  /** Percentagem de retenção na fonte (ex: 23) */
  percentagemRetencao?: number;
  /** Recibo integrado (se aplicável) */
  recibo?: InvoiceReceipt;
  /** Observações */
  observacoes?: string;
  /** Tipo de caso/processo */
  tipoCaso?: TipoCaso;
  /** Entidade (ex: AIMA, IRN, Finanças, IMT) */
  entidade?: string;
  /** Área de atuação (ex: Direito Administrativo, Imigração) */
  areaAtuacao?: string;
  /** Número do processo/caso */
  numeroProcesso?: string;
  /** Objeto do processo (descrição sumária) */
  objetoProcesso?: string;
  /** Referência geral */
  referencia?: string;
  /** Termos de pagamento (ex: "30 dias") */
  termoPagamento?: string;
  /** Local de emissão */
  localEmissao?: string;
  /** ID do honorário associado (integração sistema-legal) */
  honorarioId?: string;
  /** ID do processo associado (herança, migração, etc.) */
  processoId?: string;
  /** Estado (rascunho, emitida, paga) */
  estado?: 'rascunho' | 'emitida' | 'paga' | 'anulada';
  /** QR Code em base64 */
  qrCodeBase64?: string;
  /** Moeda (default: EUR) */
  moeda?: string;
}
