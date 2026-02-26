/**
 * Módulo Billing - Exemplo de uso completo
 * Assessoria Jurídica – AIMA
 * Valor 500€ + 15€ despesas | IVA 0% | Valor a pagar 515€ (sem retenção)
 * Recibo integrado
 *
 * O logotipo é carregado automaticamente de /assets/logo-solicitadora.png
 */

import { createInvoice } from './invoice.service.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runExample() {
  const result = await createInvoice({
    emitente: {
      nome: 'Ana Paula Medina',
      nif: '288132335',
      morada: 'Rua Melo Antunes, número 34, 3º DTO',
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
    despesas: [
      {
        descricao: 'Emolumentos / Certidão',
        quantidade: 1,
        incidencia: 'isento',
        precoUnitario: 15,
        ivaPercent: 0,
      },
    ],
    observacoes: 'Artigo n.º 53',
    incluirRecibo: true,
    numeroPrefix: 'FAT',
    numeroSequence: 1, // determinístico para exemplo
    template: 'simple', // layout como na foto: fatura limpa e compacta
  });

  const outputPath = join(__dirname, 'exemplo-fatura.pdf');
  writeFileSync(outputPath, result.pdfBuffer);
  console.log('Fatura gerada:', outputPath);
  console.log('Número:', result.invoiceObject.numero);
  console.log('Total:', result.invoiceObject.totais?.totalComIva, '€');
  console.log('Valor a pagar:', result.invoiceObject.totais?.valorAPagar, '€');
}

runExample().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
