# Estrutura do PDF da Fatura — Pseudo-código

## Layout geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. CABEÇALHO — Dados da solicitadora                                    │
│    Logo | Nome, NIF, Cédula, Tlm, Email, Sede, IBAN                      │
│    V/ n.º contribuinte: [NIF do cliente]                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. META DO DOCUMENTO                                                     │
│    Fatura/Recibo Nº FAT-AAAAMMDD-NNN  |  Data  |  ATCUD  |  Vencimento   │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. BLOCO CLIENTE (morada completa)                                      │
│    Nome | NIF | Morada (rua, número, andar, CP localidade, país)        │
├─────────────────────────────────────────────────────────────────────────┤
│ 4. TABELA DE SERVIÇOS                                                    │
│    Descrição | Art. | Qtd | Incidência | Preço Unit. | IVA % | Total    │
│    ... (múltiplas linhas)                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ 5. TABELA DE DESPESAS (se existir)                                      │
│    Descrição | Valor | IVA % | Total                                    │
│    ... (emolumentos, certidões, deslocações, etc.)                      │
├─────────────────────────────────────────────────────────────────────────┤
│ 6. RESUMO DE TOTAIS                                                     │
│    Serviços/Produtos: €                                                 │
│    Despesas: €                                                           │
│    IVA: €                                                               │
│    Total (antes da retenção): €                                         │
│    [SE retencaoAplicavel] Retenção na fonte (X%): -€                    │
│    Valor a pagar: €                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ 7. MENÇÕES LEGAIS (conforme aplicável)                                  │
│    [SE ivaExemption === 'ARTIGO_53']                                     │
│    "Isento de IVA ao abrigo do Art.º 53 do CIVA."                       │
│                                                                         │
│    [SE retencaoTotal > 0]                                                │
│    "Foi deduzida retenção na fonte nos termos do n.º 1 do Art.º 101.º   │
│     do CIRS."                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│ 8. RECIBO (se incluirRecibo)                                             │
│    Nº REC-... | Data | Valor recebido                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ 9. OBSERVAÇÕES (opcional)                                                │
├─────────────────────────────────────────────────────────────────────────┤
│ 10. FOOTER — QR Code                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Pseudo-código do gerador

```typescript
function renderInvoicePDF(invoice: Invoice, emitente: InvoiceIssuer): string {
  const totais = calculateInvoiceTotals(invoice);

  const mencoesLegais: string[] = [];

  // Menção obrigatória quando Art. 53 ativo
  if (invoice.ivaExemption === 'ARTIGO_53') {
    mencoesLegais.push('Isento de IVA ao abrigo do Art.º 53 do CIVA.');
  }

  // Menção de retenção quando aplicável
  if (invoice.retencaoAplicavel && totais.retencaoTotal > 0) {
    mencoesLegais.push(
      'Foi deduzida retenção na fonte nos termos do n.º 1 do Art.º 101.º do CIRS.'
    );
  }

  return template({
    logo: emitente.logoBase64,
    issuer: mapIssuer(emitente),
    cliente: mapClienteSnapshot(invoice.clienteSnapshot),
    servicos: invoice.servicos.map(mapService),
    despesas: invoice.despesas.map(mapDespesa),
    totais: totais,
    mencoesLegais: mencoesLegais.join(' '),
    observacoes: invoice.observacoes,
    ...
  });
}
```

## Variáveis do template Handlebars

| Variável      | Tipo   | Descrição                                   |
|---------------|--------|---------------------------------------------|
| `logo`        | string | Logo em base64                               |
| `issuer`      | object | Dados da solicitadora                       |
| `cliente`     | object | clienteSnapshot com morada formatada        |
| `servicos`    | array  | Serviços para tabela                        |
| `despesas`    | array  | Despesas para tabela                        |
| `totais`      | object | subtotalServicos, subtotalDespesas, ivaTotal, retencaoTotal, totalPagar |
| `mencoesLegais` | string | Texto das menções (Art.53, retenção)      |
| `ivaExempt`   | bool   | ivaExemption === 'ARTIGO_53'                 |
| `hasRetencao` | bool   | retencaoTotal > 0                           |
