# Módulo Billing – Faturas e Recibos

Módulo completo para gerar faturas e recibos integrados em PDF, com suporte a ATCUD, retenção na fonte, IVA e QR Code.

## Requisitos

- Node.js >= 18
- Dependências: `handlebars`, `puppeteer`, `qrcode`

## Instalação

```bash
npm install
```

## Uso

### Importar o serviço principal

```typescript
import { createInvoice } from './billing/index.js';

const result = await createInvoice({
  emitente: {
    nome: 'Empresa Lda.',
    nif: '123456789',
    morada: 'Rua Exemplo, 1',
    codigoPostal: '1000-001',
    localidade: 'Lisboa',
  },
  cliente: {
    nome: 'Cliente Exemplo',
    nif: '987654321',
    morada: 'Av. Cliente, 10',
    codigoPostal: '1000-100',
    localidade: 'Lisboa',
  },
  itens: [
    {
      descricao: 'Assessoria Jurídica',
      artigo: 'AJ-001',
      quantidade: 1,
      incidencia: 'isento',
      precoUnitario: 500,
      ivaPercent: 0,
    },
  ],
  percentagemRetencao: 23,
  incluirRecibo: true,
  observacoes: 'Observações opcionais.',
  tipoCaso: 'honorários',    // opcional: herança, migração, registo, etc.
  entidade: 'AIMA',          // opcional: AIMA, IRN, Finanças, IMT
  areaAtuacao: 'Imigração',  // opcional: área de atuação
  numeroSequence: 1,         // opcional: numeração determinística
});

// result.pdfBuffer - Buffer do PDF
// result.invoiceObject - Objeto da fatura completo
```

### Guardar PDF em disco

```typescript
import { writeFileSync } from 'fs';
const { pdfBuffer } = await createInvoice(data);
writeFileSync('fatura.pdf', pdfBuffer);
```

### Usar apenas cálculos (sem PDF)

```typescript
import { calculateTotals, calculateItemTotal, generateInvoiceNumber } from './billing/index.js';
const totais = calculateTotals(invoice);
const numero = generateInvoiceNumber('FAT', { date: new Date(), sequence: 1 });
```

### Executar exemplo

```bash
npm run billing:example
```

Gera `billing/exemplo-fatura.pdf` com o caso AIMA (500€, 23% retenção, 385€ a pagar).

## Estrutura

| Ficheiro | Descrição |
|----------|-----------|
| `invoice.types.ts` | Interfaces (Invoice, InvoiceItem, etc.) |
| `invoice.calculations.ts` | Funções de cálculo puras |
| `invoice.template.html` | Template Handlebars |
| `invoice.styles.css` | Estilos para PDF |
| `invoice.qr.ts` | Geração de QR Code |
| `invoice.pdf.ts` | Geração de PDF com Puppeteer |
| `invoice.service.ts` | Serviço principal `createInvoice` |
| `invoice.example.ts` | Exemplo completo |
| `logo.svg` / `logo.png` | Logo da solicitadora (opcional) |

## Logo e cabeçalho

O topo de cada fatura mostra automaticamente:
- **Logo** (se `logoPath` ou `emitente.logoBase64` forem definidos)
- **Dados da solicitadora**: nome, contribuinte, Tlm, Email, IBAN
- **V/ n.º contribuinte** do cliente

Para usar a sua logo, coloque `logo.png`, `logo.jpg` ou `logo.svg` na pasta `billing/`, ou passe `logoPath` ao criar a fatura:

```typescript
await createInvoice({
  emitente: { nome: '...', nif: '...', /* ... */ iban: 'PT50 ...' },
  logoPath: 'billing/logo.png',  // opcional
  cliente: { /* ... */ },
  itens: [ /* ... */ ],
});
```

## Tipo de caso, Entidade e Área de atuação

Campos opcionais para adaptar a fatura a cada situação:

| Campo | Valores (tipoCaso) | Exemplo |
|-------|--------------------|---------|
| `tipoCaso` | herança, migração, registo, contrato, honorários, procuração, outro | `'honorários'` |
| `entidade` | texto livre | `'AIMA'`, `'IRN'`, `'Finanças'` |
| `areaAtuacao` | texto livre | `'Imigração / Residência'` |

Quando definidos, aparecem numa secção destacada acima dos dados do cliente.

## Campos disponíveis

### Emitente (obrigatórios: nome, nif, morada, codigoPostal, localidade)
| Campo | Descrição |
|-------|-----------|
| `cedula` | Cédula profissional |
| `titulo` | Dr., Dra., etc. |
| `sede` | Sede profissional |
| `telefone`, `email`, `website` | Contactos |
| `iban` | IBAN para pagamentos |
| `cae` | Código de atividade económica |
| `conservatoria` | Conservatória de registo |

### Cliente (obrigatórios: nome, morada, codigoPostal, localidade)
| Campo | Descrição |
|-------|-----------|
| `nif`, `email`, `telefone` | Identificação e contactos |
| `representanteLegal` | Para empresas |
| `numeroCliente` | Referência interna |

### Itens
| Campo | Descrição |
|-------|-----------|
| `unidade` | acto, hora, dia, unidade, serviço, outro |
| `descontoPercent` | Desconto em % (0-100) |
| `descontoValor` | Desconto em valor fixo |
| `referenciaExterna` | Nº pedido, ref. externa |

### Fatura (metadados)
| Campo | Descrição |
|-------|-----------|
| `numeroProcesso` | Nº do processo/caso |
| `objetoProcesso` | Objeto do processo |
| `referencia` | Referência geral |
| `termoPagamento` | Ex: "30 dias" |
| `localEmissao` | Local de emissão |
| `honorarioId`, `processoId` | IDs para integração |

### Recibo
| Campo | Descrição |
|-------|-----------|
| `formaPagamento` | Multibanco, transferência, etc. |
| `referencia` | Ref. Multibanco |
| `localPagamento` | Local do pagamento |
| `comprovanteRef` | Ref. do comprovante |

## Incidência de IVA (Portugal)

- `isento` → 0%
- `reduzido` → 6%
- `intermedio` → 13%
- `normal` → 23%

O valor `ivaPercent` no item sobrepõe a incidência quando definido.

## Numeração determinística

Para testes ou integração com base de dados, use `numeroSequence` e `dataEmissao`:

```typescript
createInvoice({
  // ...
  dataEmissao: '2025-02-19',
  numeroSequence: 1,
});
// Gera sempre FAT-20250219-001
```

## Funcionalidades

- ATCUD e QR Code com payload português
- Retenção na fonte (ex: 23% para administração pública)
- IVA por incidência ou percentagem explícita
- Recibo integrado
- Numeração automática (formato PREFIX-AAAAMMDD-NNN)
- Layout profissional A4 com Puppeteer

## Schema API (inglês)

Para integração com APIs ou frontends que usam nomes em inglês:

```typescript
import { createInvoice, mapInvoiceAPIToInput } from './billing/index.js';

const dto = {
  invoiceNumber: 'FAT-20250223-001',
  receiptNumber: 'REC-20250223-001',
  issueDate: '2025-02-23',
  dueDate: '2025-03-23',
  issuer: { name: '...', nif: '...', phone: '...', email: '...', iban: '...' },
  client: { name: '...', nif: '...', address: '1000-001 Lisboa', email: '...' },
  items: [{ description: '...', quantity: 1, unitPrice: 500, ivaPercent: 0, total: 500 }],
  totals: { services: 500, iva: 0, retention: 115, total: 500, amountToPay: 385 },
  receipt: { date: '2025-02-23', amountReceived: 385, ivaLiquidated: 0, retention: 115 },
};

const input = mapInvoiceAPIToInput(dto);
const { pdfBuffer } = await createInvoice(input);
```

## Integração com Express

```typescript
import express from 'express';
import { createInvoice } from './billing/index.js';

const app = express();
app.use(express.json());

app.post('/api/faturas/gerar', async (req, res) => {
  try {
    const { pdfBuffer } = await createInvoice(req.body);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="fatura.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});
```
