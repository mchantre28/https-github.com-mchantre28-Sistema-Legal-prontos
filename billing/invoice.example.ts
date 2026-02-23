/**
 * Módulo Billing - Exemplo de uso completo
 * Assessoria Jurídica – AIMA
 * Valor 500€ | IVA 0% | Retenção 115€ | Valor a pagar 385€
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
    tipoCaso: 'honorários',
    entidade: 'AIMA',
    areaAtuacao: 'Imigração / Residência',
    numeroProcesso: 'AIMA/2024/001',
    objetoProcesso: 'Pedido de autorização de residência',
    termoPagamento: '30 dias',
    localEmissao: 'Lisboa',
    cliente: {
      nome: 'AIMA - Alto Comissariado para as Migrações',
      nif: '506507738',
      morada: 'Rua Alvarez Cabral, 2',
      codigoPostal: '1200-019',
      localidade: 'Lisboa',
      pais: 'Portugal',
      email: 'geral@aima.gov.pt',
    },
    itens: [
      {
        descricao: 'Assessoria Jurídica – AIMA',
        artigo: 'AJ-001',
        quantidade: 1,
        incidencia: 'isento',
        precoUnitario: 500,
        ivaPercent: 0,
      },
    ],
    percentagemRetencao: 23,
    observacoes: 'Serviços de assessoria jurídica prestados no âmbito do contrato ref. AIMA/2024.',
    incluirRecibo: true,
    numeroPrefix: 'FAT',
    numeroSequence: 1, // determinístico para exemplo
    // template: 'simple', // descomente para layout com QR no footer à direita
  });

  const outputPath = join(__dirname, 'exemplo-fatura.pdf');
  writeFileSync(outputPath, result.pdfBuffer);
  console.log('Fatura gerada:', outputPath);
  console.log('Número:', result.invoiceObject.numero);
  console.log('Total:', result.invoiceObject.totais?.totalComIva, '€');
  console.log('Retenção:', result.invoiceObject.totais?.retencao, '€');
  console.log('Valor a pagar:', result.invoiceObject.totais?.valorAPagar, '€');
}

runExample().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
