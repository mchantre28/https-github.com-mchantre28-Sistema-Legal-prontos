/**
 * Módulo Billing - API Types (schema em inglês)
 * Interface alternativa para integração com APIs ou frontends
 */

export interface InvoiceIssuerAPI {
  name: string;
  nif: string;
  phone: string;
  email: string;
  iban: string;
}

export interface InvoiceClientAPI {
  name: string;
  nif?: string;
  address: string;
  email?: string;
}

export interface InvoiceItemAPI {
  description: string;
  article?: string;
  quantity: number;
  unitPrice: number;
  ivaPercent?: number;
  /** Tax incidence: "isento" | "reduzido" | "intermedio" | "normal", ou valor numérico (tratado como isento) */
  incidence?: string | number;
  total?: number;
}

export interface InvoiceTotalsAPI {
  services: number;
  iva: number;
  retention: number;
  total: number;
  amountToPay: number;
}

export interface InvoiceReceiptAPI {
  date: string;
  amountReceived: number;
  ivaLiquidated: number;
  retention: number;
}

export interface InvoiceAPI {
  invoiceNumber: string;
  receiptNumber?: string;
  atcud?: string;
  issueDate: string;
  dueDate: string;
  issuer: InvoiceIssuerAPI;
  client: InvoiceClientAPI;
  items: InvoiceItemAPI[];
  totals: InvoiceTotalsAPI;
  receipt?: InvoiceReceiptAPI;
  observations?: string;
  qrCodeData?: string;
}
