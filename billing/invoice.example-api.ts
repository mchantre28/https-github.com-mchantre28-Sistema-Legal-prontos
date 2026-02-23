/**
 * Exemplo: createSignAndSendInvoice com schema em inglês (InvoiceAPI)
 *
 * Requer: certs/assinatura.p12, MAIL_HOST, MAIL_USER, MAIL_PASS
 * Ou execute só createInvoice para gerar PDF local sem assinar/enviar.
 */

import { createSignAndSendInvoice, createInvoice, mapInvoiceAPIToInput } from './invoice.service.js';
import type { InvoiceAPI } from './invoice.api-types.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const exampleInvoice: InvoiceAPI = {
  invoiceNumber: '2026FAC001/1',
  receiptNumber: '2026REC001/1',
  atcud: 'J6VCVWV2-1',
  issueDate: '2026-01-30',
  dueDate: '2026-01-30',
  issuer: {
    name: 'Solicitadora Ana Paula Medina',
    nif: '288 132 335',
    phone: '938057340',
    email: 'anapaulamedina09738@osae.pt',
    iban: 'PT50 0193 0000 10514937886 86',
  },
  client: {
    name: 'Suleimane Djane',
    nif: '326 238 557',
    address: 'Rua Dr. Estevão Vasconcelos, 64, R/C Esquerdo, 8500-590 Portimão',
    email: 'cliente@example.com',
  },
  items: [
    {
      description: 'Assessoria Jurídica - AIMA',
      article: '7',
      quantity: 1,
      unitPrice: 500,
      ivaPercent: 0,
      incidence: 'isento',
      total: 500,
    },
  ],
  totals: {
    services: 500,
    iva: 0,
    retention: 115,
    total: 500,
    amountToPay: 385,
  },
  receipt: {
    date: '2026-01-30',
    amountReceived: 385,
    ivaLiquidated: 0,
    retention: 115,
  },
  observations: 'Artigo 16.º, n.º 6 do CIVA',
};

async function run() {
  const SEND_EMAIL = process.env.SEND_INVOICE_EMAIL === 'true';

  if (SEND_EMAIL) {
    // Cria, assina e envia por email
    const result = await createSignAndSendInvoice(exampleInvoice);
    console.log('Fatura criada, assinada e enviada para', exampleInvoice.client.email);
    console.log('Número:', result.invoiceObject.numero);
  } else {
    // Apenas gera PDF local (para testar sem cert/email)
    const input = mapInvoiceAPIToInput(exampleInvoice);
    const result = await createInvoice(input);
    const outputPath = join(__dirname, 'exemplo-fatura-api.pdf');
    writeFileSync(outputPath, result.pdfBuffer);
    console.log('Fatura gerada:', outputPath);
    console.log('Número:', result.invoiceObject.numero);
    console.log('Para criar+assinar+enviar: SEND_INVOICE_EMAIL=true npm run billing:example-api');
  }
}

run().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
