# Módulo Faturas e Pagamentos — Especificação Firestore

> Plataforma de solicitadoria. Coleções existentes: `clientes`, `honorarios`, `contratos`, `herancas`, `migracoes`, `registos`, `prazos`, `tarefas`, `documentos`, `notificacoes`, `convidados`, `sistema`, `entidades`, `integracoes_externas`, `logs_integracoes`.

---

## Como funciona (resumo)

**Faturas** são os documentos de cobrança emitidos aos clientes. São criadas a partir dos honorários ("Gerar faturas") ou manualmente. Cada fatura tem número, valor total, cliente e estado (pendente, paga, cancelada). O campo `somaPagamentos` é atualizado automaticamente quando se registam pagamentos — quando a soma atinge o valor total, a fatura passa a "paga".

**Pagamentos** são os valores recebidos dos clientes, ligados a uma fatura. Cada pagamento tem valor, data e método (transferência, MB Way, etc.). Podem ser parciais — vários pagamentos até completar o total da fatura.

**Despesas** são gastos internos por processo (taxas, certidões, deslocações). Servem para relatórios de rentabilidade.

**Logs financeiros** guardam auditoria de todas as ações (criar fatura, registar pagamento, anular, etc.).

---

## 1. COLEÇÃO: `faturas`

Cada documento representa uma fatura emitida ao cliente. Suporta itens detalhados, IVA e pagamentos parciais.

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável (gerado por `gerarIdImutavel()`) |
| `numero` | string | sim | Número sequencial da fatura (ex: "FAT-2026-001") |
| `clienteId` | string | sim | Ref: `clientes/{id}` — cliente destinatário |
| `clienteNome` | string | não | Denormalizado para exibição rápida |
| `processoTipo` | string | sim | `heranca` \| `migracao` \| `registo` — tipo do processo |
| `processoId` | string | sim | ID do processo em herancas, migracoes ou registos |
| `processoRef` | string | não | Path Firestore: `herancas/xxx`, `migracoes/xxx`, `registos/xxx` |
| `dataEmissao` | string | sim | ISO 8601 — data de emissão |
| `valorBase` | number | sim | Valor base (sem IVA), em € |
| `valorIva` | number | sim | Valor do IVA, em € |
| `valorTotal` | number | sim | Valor total (base + IVA), em € |
| `estado` | string | sim | `pendente` \| `paga` \| `cancelada` |
| `somaPagamentos` | number | sim | Soma dos pagamentos registados (calculado/atualizado) |
| `itens` | array | sim | Array de objetos com: `descricao`, `quantidade`, `precoUnitario`, `taxaIva`, `valorIva`, `valorTotal` |
| `metodoPagamento` | string | não | `mbway`, `transferencia`, `numerario`, `cartao` — preferência/previsto |
| `notas` | string | não | Observações internas |
| `utilizadorId` | string | não | Quem emitiu (admin ou convidado) |
| `utilizadorNome` | string | não | Nome denormalizado |
| `anexos` | array | não | `[{ id, nome, url, tipo }]` — comprovativos anexados |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete / anulação (default: false) |

### Estrutura de `itens` (exemplo)

```json
{
  "itens": [
    {
      "descricao": "Honorários - processo herança",
      "quantidade": 1,
      "precoUnitario": 500,
      "taxaIva": 23,
      "valorIva": 115,
      "valorTotal": 615
    }
  ]
}
```

### Regras de negócio

- **Não apagar**: Faturas não podem ser eliminadas, apenas anuladas (`estado: cancelada`, `deleted: true`).
- **Estado automático** (atualizar no cliente ou via Cloud Function):
  - `somaPagamentos >= valorTotal` → `estado: "paga"`
  - `somaPagamentos < valorTotal` e não cancelada → `estado: "pendente"`
  - Anulada → `estado: "cancelada"`
- **Validação**: Não permitir fatura sem `clienteId` nem sem `processoId` + `processoTipo`.
- **Valores**: `valorTotal` = `valorBase` + `valorIva`; `valorBase`, `valorIva`, `valorTotal` ≥ 0.
- **Edição**: Faturas com `estado: "paga"` não podem ser alteradas (exceto anulação por gestor).

### Relacionamentos

- **Cliente** → Faturas (1:N): `where('clienteId', '==', id)`
- **Processo** → Faturas (1:N): `where('processoTipo', '==', x).where('processoId', '==', id)`
- **Fatura** → Pagamentos (1:N): subcoleção ou `where('faturaId', '==', id)` na coleção `pagamentos`

---

## 2. COLEÇÃO: `pagamentos`

Cada documento representa um pagamento (total ou parcial) a uma fatura.

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `faturaId` | string | sim | Ref: `faturas/{id}` |
| `faturaNumero` | string | não | Denormalizado |
| `dataPagamento` | string | sim | ISO 8601 — data do pagamento |
| `valor` | number | sim | Valor pago, em € (deve ser > 0) |
| `metodo` | string | sim | `mbway`, `transferencia`, `numerario`, `cartao`, `cheque`, `outro` |
| `comprovativoUrl` | string | não | URL do comprovativo (Firebase Storage ou externo) |
| `comprovativoNome` | string | não | Nome do ficheiro original |
| `utilizadorId` | string | não | Quem registou o pagamento |
| `utilizadorNome` | string | não | Denormalizado |
| `notas` | string | não | Observações |
| `anulado` | boolean | não | true = pagamento anulado (com auditoria) |
| `motivoAnulacao` | string | não | Motivo da anulação (se anulado) |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete |

### Regras de negócio

- **Não apagar**: Pagamentos não podem ser eliminados, apenas anulados (`anulado: true`) com log obrigatório.
- **Validação**: Não permitir pagamento sem `faturaId`; `valor` > 0.
- **Atualização da fatura**: Sempre que um pagamento é criado ou anulado, recalcular `somaPagamentos` na fatura e atualizar `estado`.
- **somaPagamentos** = soma de `pagamentos.valor` onde `faturaId` = X e `anulado != true` e `deleted != true`.

### Relacionamentos

- **Fatura** → Pagamentos (1:N): `where('faturaId', '==', id)`

---

## 3. COLEÇÃO: `despesas`

Despesas internas associadas a processos (taxas, certidões, deslocações, etc.).

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `processoTipo` | string | sim | `heranca` \| `migracao` \| `registo` |
| `processoId` | string | sim | ID do processo |
| `processoRef` | string | não | Path Firestore |
| `descricao` | string | sim | Descrição da despesa |
| `valor` | number | sim | Valor em € (≥ 0) |
| `data` | string | sim | ISO 8601 — data da despesa |
| `tipo` | string | não | `taxa`, `certidao`, `deslocacao`, `fotocopia`, `outro` |
| `comprovativoUrl` | string | não | URL do comprovativo |
| `comprovativoNome` | string | não | Nome do ficheiro |
| `utilizadorId` | string | não | Quem registou |
| `utilizadorNome` | string | não | Denormalizado |
| `anulado` | boolean | não | true = despesa anulada |
| `motivoAnulacao` | string | não | Motivo (se anulado) |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete |

### Regras de negócio

- **Não apagar**: Despesas não podem ser eliminadas, apenas anuladas.
- **Validação**: Não permitir despesa sem `processoId` + `processoTipo`; `valor` ≥ 0.
- **Relatórios**: Usar para relatórios de rentabilidade (receitas vs despesas por processo/cliente).

### Relacionamentos

- **Processo** → Despesas (1:N): `where('processoTipo', '==', x).where('processoId', '==', id)`

---

## 4. COLEÇÃO: `logs_financeiros`

Auditoria completa de todas as ações financeiras.

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `tipo` | string | sim | `fatura_criada`, `fatura_atualizada`, `fatura_cancelada`, `pagamento_registado`, `pagamento_anulado`, `despesa_registada`, `despesa_anulada` |
| `referenciaTipo` | string | sim | `fatura` \| `pagamento` \| `despesa` |
| `referenciaId` | string | sim | ID do documento referenciado |
| `data` | string | sim | ISO 8601 — data da ação |
| `utilizadorId` | string | não | Quem executou |
| `utilizadorNome` | string | não | Denormalizado |
| `detalhes` | string | não | Descrição da ação (ex: "Fatura cancelada por X") |
| `dadosAntes` | map | não | Snapshot dos dados antes da alteração (opcional) |
| `dadosDepois` | map | não | Snapshot dos dados depois (opcional) |
| `createdAt` | string | sim | ISO 8601 |

### Regras de negócio

- **Não apagar nem alterar**: Logs são imutáveis.
- **Criação automática**: Criar log em todas as ações financeiras (criar, atualizar, anular fatura/pagamento/despesa).
- **Cancelamento**: Todo cancelamento/anulação deve gerar log com `detalhes` e `motivoAnulacao`.

---

## 5. RELACIONAMENTOS (Diagrama)

```
clientes (1) ──────────────→ (N) faturas [clienteId]
herancas | migracoes | registos (1) ─→ (N) faturas [processoTipo + processoId]
herancas | migracoes | registos (1) ─→ (N) despesas [processoTipo + processoId]

faturas (1) ───────────────→ (N) pagamentos [faturaId]

faturas (1) ───────────────→ (N) logs_financeiros [referenciaId + referenciaTipo=fatura]
pagamentos (1) ────────────→ (N) logs_financeiros [referenciaId + referenciaTipo=pagamento]
despesas (1) ──────────────→ (N) logs_financeiros [referenciaId + referenciaTipo=despesa]
```

---

## 6. VALIDAÇÕES (Resumo)

| Entidade | Regra |
|----------|-------|
| Fatura | Cliente obrigatório |
| Fatura | Processo obrigatório (processoTipo + processoId) |
| Fatura | Valor total = valor base + valor IVA |
| Fatura | valores ≥ 0 |
| Fatura | Não alterar se estado = "paga" |
| Pagamento | Fatura obrigatória |
| Pagamento | valor > 0 |
| Pagamento | Não apagar, apenas anular |
| Despesa | Processo obrigatório |
| Despesa | valor ≥ 0 |
| Despesa | Não apagar, apenas anular |
| Logs | Nunca apagar nem alterar |
| Geral | Comprovativos em Storage com path: `processos/{processoTipo}/{processoId}/comprovativos/` |

---

## 7. ÍNDICES RECOMENDADOS (Firestore)

```json
{
  "indexes": [
    {
      "collectionGroup": "faturas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clienteId", "order": "ASCENDING" },
        { "fieldPath": "dataEmissao", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "faturas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "processoTipo", "order": "ASCENDING" },
        { "fieldPath": "processoId", "order": "ASCENDING" },
        { "fieldPath": "dataEmissao", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "faturas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "dataEmissao", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "pagamentos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "faturaId", "order": "ASCENDING" },
        { "fieldPath": "dataPagamento", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "despesas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "processoTipo", "order": "ASCENDING" },
        { "fieldPath": "processoId", "order": "ASCENDING" },
        { "fieldPath": "data", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "logs_financeiros",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "referenciaTipo", "order": "ASCENDING" },
        { "fieldPath": "referenciaId", "order": "ASCENDING" },
        { "fieldPath": "data", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "logs_financeiros",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tipo", "order": "ASCENDING" },
        { "fieldPath": "data", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 8. REGRAS DE SEGURANÇA (Firestore Rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Faturas: utilizadores autenticados podem criar/editar
    match /faturas/{docId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
      allow delete: if false;  // Apenas anulação (soft delete)
    }

    // Pagamentos: assistentes podem registar
    match /pagamentos/{docId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
      allow delete: if false;
    }

    // Despesas: utilizadores autenticados
    match /despesas/{docId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
      allow delete: if false;
    }

    // Logs financeiros: apenas leitura e criação
    match /logs_financeiros/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

**Nota**: O Sistema Legal usa sessão local (senha admin). Para desenvolvimento, use `if true` em vez de `request.auth != null`. Em produção com Firebase Auth, use as regras acima. Para controlo por rol (gestor vs assistente), é necessário Firebase Auth com custom claims.

---

## 9. FIREBASE STORAGE — Comprovativos

Estrutura recomendada de paths para comprovativos:

```
/comprovativos/
  /faturas/{faturaId}/{nomeFicheiro}
  /pagamentos/{pagamentoId}/{nomeFicheiro}
  /despesas/{despesaId}/{nomeFicheiro}
```

Regras Storage (exemplo):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /comprovativos/{path=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 10. OBSERVAÇÕES

### Escalabilidade

- **Denormalização**: `clienteNome`, `faturaNumero`, `processoRef` evitam joins em listagens.
- **Paginação**: Usar `limit()` e `startAfter()` em faturas, pagamentos e despesas.
- **somaPagamentos**: Manter calculado na fatura para evitar agregações pesadas. Atualizar na criação/anulação de pagamentos.

### Auditoria

- Todo o histórico em `logs_financeiros`.
- Manter `createdAt` e `updatedAt` em todas as coleções.
- Em anulações, guardar `motivoAnulacao` e `utilizadorId`.

### Compatibilidade com existente

- **Honorários vs Faturas**: A coleção `honorarios` pode coexistir. Faturas são documentos formais com número, itens e IVA. Podem ser geradas a partir de honorários ou criadas manualmente.
- **Processos**: Usar `processoTipo` + `processoId` (como em integracoes_externas) para referenciar herancas, migracoes, registos.

### Sequência de números de fatura

- Implementar contador em `sistema/contadores` (ex: `{ faturas: 1 }`) e incrementar atomicamente ao emitir nova fatura.
- Ou gerar número no cliente (ex: `FAT-${ano}-${pad(seq)}`) e validar unicidade.

---

## 11. CONSTANTES E ENUMS (para o frontend)

```javascript
const FATURA_ESTADOS = ['pendente', 'paga', 'cancelada'];
const METODOS_PAGAMENTO = ['mbway', 'transferencia', 'numerario', 'cartao', 'cheque', 'outro'];
const DESPESA_TIPOS = ['taxa', 'certidao', 'deslocacao', 'fotocopia', 'outro'];
const LOG_FINANCEIRO_TIPOS = [
  'fatura_criada', 'fatura_atualizada', 'fatura_cancelada',
  'pagamento_registado', 'pagamento_anulado',
  'despesa_registada', 'despesa_anulada'
];
```
