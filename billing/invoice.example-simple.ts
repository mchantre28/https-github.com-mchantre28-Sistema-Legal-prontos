/**
 * Exemplo: template "simple" - layout com QR no footer à direita
 */

import { createInvoice } from './invoice.service.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  const result = await createInvoice({
    emitente: {
      nome: 'Ana Paula Medina',
      nif: '288132335',
      morada: 'Rua Melo Antunes, 34',
      codigoPostal: '2526-728',
      localidade: 'Vialonga',
      pais: 'Portugal',
      email: 'anapaulamedina09738@osae.pt',
      telefone: '938057340',
      iban: 'PT50 0193 0000 10514937886 86',
      titulo: 'Dra.',
      cedula: '9738',
      sede: 'Av. Aquilino Ribeiro Machado, n.º 8, 1800-399 Lisboa',
    },
    cliente: {
      nome: 'Suleimane Djane',
      nif: '326238557',
      morada: 'Rua Dr. Estevão Vasconcelos, 64',
      codigoPostal: '8500-590',
      localidade: 'Portimão',
      pais: 'Portugal',
      email: 'cliente@example.com',
    },
    itens: [
      {
        descricao: 'Assessoria Jurídica - AIMA',
        artigo: '7',
        quantidade: 1,
        incidencia: 'isento',
        precoUnitario: 500,
        ivaPercent: 0,
      },
    ],
    percentagemRetencao: 23,
    observacoes: 'Artigo n.º 53',
    incluirRecibo: true,
    numeroSequence: 1,
    template: 'simple',
  });

  const outputPath = join(__dirname, 'exemplo-fatura-simple.pdf');
  writeFileSync(outputPath, result.pdfBuffer);
  console.log('Fatura (template simple) gerada:', outputPath);
  console.log('Número:', result.invoiceObject.numero);
}

run().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
