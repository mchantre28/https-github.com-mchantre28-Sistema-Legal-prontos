# Fatura/Recibo — Regras de formatação

## Estrutura do documento (obrigatória)

1. **Cabeçalho da Entidade** — Nome, NIF, contactos, IBAN, morada da sede  
2. **Identificação** — Título "Fatura/Recibo", número (FAT-AAAAMMDD-XXX), data de emissão  
3. **Dados do Cliente** — Nome, NIF, morada completa  
4. **Tabela de Serviços** — Descrição, Art., Qtd, Incidência, Preço Unit., IVA %, Total  
5. **Tabela de Despesas** — Descrição, Valor, IVA %, Total  
6. **Resumo Financeiro** — Serviços/Produtos, Despesas, IVA, Total, Valor a Pagar  
7. **Recibo** — Número, Data, Valor Recebido  
8. **Observações** — Texto livre (ex.: Artigo n.º 53 do CIVA)

## Regras

- **Markdown limpo e estável** — sem quebras inesperadas.  
- **Tabelas alinhadas e legíveis.**  
- **Não inventar valores** — usar apenas os dados fornecidos.  
- **Dados em falta** — pedir apenas o essencial (entidade, cliente, serviços, despesas, observações, confirmação de valor recebido).  
- **Estilo visual** — idêntico ao exemplo de referência do projeto.

## Dados a pedir para gerar uma nova fatura

- Dados da entidade (nome, NIF, contactos, IBAN, sede)  
- Dados do cliente (nome, NIF, morada)  
- Lista de serviços (descrição, artigo, qtd, incidência, preço unit., IVA %, total)  
- Lista de despesas (descrição, valor, IVA %, total)  
- Observações  
- Confirmação se o valor foi recebido (para o bloco Recibo)

Quando o utilizador fornecer estes dados, gerar o documento completo seguindo o `TEMPLATE-FATURA-RECIBO.md`.

## Sincronizar template para o site

Ao fazeres push para o GitHub (depois de alterar `billing/fatura-recibo-template-exato.html`), a GitHub Action atualiza automaticamente `projetos/sistema-legal/fatura-recibo.html`. O resultado vê-se só no site; não é preciso testar noutro local.
