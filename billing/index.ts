/**
 * Módulo Billing - Faturas e Recibos
 * Ponto de entrada principal
 */

// Tipos
export type {
  TaxIncidence,
  TipoCaso,
  UnidadeItem,
  Invoice,
  InvoiceItem,
  InvoiceTotals,
  InvoiceReceipt,
  InvoiceIssuer,
  InvoiceClient,
} from './invoice.types.js';

// Cálculos
export {
  calculateItemTotal,
  calculateTotals,
  calculateRetention,
  calculateAmountToPay,
  generateInvoiceNumber,
  generateReceiptNumber,
  prepareInvoiceItems,
  getItemIvaPercent,
} from './invoice.calculations.js';

// Serviço principal
export {
  createInvoice,
  createSignAndSendInvoice,
  mapInvoiceAPIToInput,
  type CreateInvoiceInput,
  type CreateInvoiceResult,
  type CreateSignAndSendInvoiceOptions,
} from './invoice.service.js';

// API Types (schema inglês)
export type {
  InvoiceAPI,
  InvoiceIssuerAPI,
  InvoiceClientAPI,
  InvoiceItemAPI,
  InvoiceTotalsAPI,
  InvoiceReceiptAPI,
} from './invoice.api-types.js';

// QR Code
export { generateInvoiceQRCode } from './invoice.qr.js';

// PDF
export {
  generateInvoicePDF,
  loadInvoiceAssets,
} from './invoice.pdf.js';

// Logo
export { loadLogoBase64 } from './invoice.logo.js';

// Assinatura digital
export { signInvoicePdfWithP12 } from './invoice.sign.js';

// Email
export {
  sendInvoiceEmail,
  type SendInvoiceEmailParams,
} from './invoice.email.js';
