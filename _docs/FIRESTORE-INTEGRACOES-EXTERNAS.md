# Módulo Integrações Externas — Especificação Firestore

> Adaptado ao Sistema Legal existente. Coleções atuais: `clientes`, `honorarios`, `contratos`, `herancas`, `migracoes`, `registos`, `prazos`, `tarefas`, `documentos`, `notificacoes`, `convidados`, `sistema`.

---

## Como funciona (resumo)

**Entidades** são o catálogo de instituições com quem a solicitadora trabalha: Finanças (AT), IRN, Conservatórias, IMT, Câmaras Municipais, Segurança Social, Embaixadas, etc. São apenas referências — não guardam interações. Na primeira utilização o sistema pode popular automaticamente com a lista predefinida.

**Integrações externas** são as interações reais com essas entidades: cada documento representa um pedido, uma consulta, uma reclamação, um envio de documentação, etc. Está sempre ligado a uma entidade, um cliente e um processo. Guarda estado (enviado, pendente, concluído), datas, canal (online, presencial, email), anexos enviados/recebidos.

**Logs de integrações** fazem auditoria de todas as alterações.

---

## 1. COLEÇÃO: `entidades`

Registo de todas as entidades externas com quem a solicitadora interage (Finanças, IRN, IMT, etc.).

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável (gerado por `gerarIdImutavel()`) |
| `nome` | string | sim | Nome da entidade (ex: "Finanças (AT)") |
| `tipo` | string | sim | Tipo: `financas`, `conservatoria`, `imt`, `camara_municipal`, `seguranca_social`, `banco`, `embaixada_consulado`, `registo_online`, `outra` |
| `sigla` | string | não | Sigla (ex: "AT", "IRN") |
| `contactos` | map | não | `{ telefone, email, morada }` |
| `website` | string | não | URL do portal/site |
| `portalUrl` | string | não | URL do portal de submissão online |
| `ativo` | boolean | sim | `true` = visível; `false` = desativado (nunca apagar, apenas desativar) |
| `notas` | string | não | Observações internas |
| `ordem` | number | não | Ordem de exibição (menor = primeiro) |
| `createdAt` | timestamp/string | sim | ISO 8601 |
| `updatedAt` | timestamp/string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete (default: false) |

### Regras de negócio
- **Não apagar**: Sempre usar `ativo: false` em vez de delete.
- **Tipos permitidos**: Validar contra lista fixa.
- **Compatibilidade**: O campo `entidade` em heranças, migrações, registos, tarefas e documentos pode referenciar `entidades.id` (ou manter o id antigo `financas_at` como compatível).

### Relação com existente
- `ENTIDADES_PORTUGAL` no frontend passa a ser populada a partir desta coleção (com fallback para a constante se vazia).

---

## 2. COLEÇÃO: `integracoes_externas`

Cada documento representa uma interação real com uma entidade (pedido, resposta, etc.).

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `entidadeId` | string | sim | Ref: `entidades/{id}` — ID do documento em `entidades` |
| `entidadeNome` | string | não | Denormalizado para exibição rápida |
| `clienteId` | string | sim | Ref: cliente associado (obrigatório) |
| `clienteNome` | string | não | Denormalizado |
| `processoTipo` | string | sim | `heranca` \| `migracao` \| `registo` — tipo do processo |
| `processoId` | string | sim | ID do processo em `herancas`, `migracoes` ou `registos` |
| `processoRef` | string | não | Path Firestore: `herancas/xxx` ou `migracoes/xxx` (para queries) |
| `tipoInteracao` | string | sim | Ex: `pedido`, `consulta`, `reclamacao`, `renovacao`, `certificacao` |
| `descricao` | string | sim | Descrição da interação |
| `estado` | string | sim | `enviado`, `pendente`, `concluido`, `indeferido`, `cancelado` |
| `dataEnvio` | string | não | ISO 8601 — data de envio |
| `dataResposta` | string | não | ISO 8601 — data de resposta recebida |
| `prazoResposta` | string | não | ISO 8601 — prazo legal esperado |
| `canal` | string | sim | `online`, `presencial`, `email`, `portal`, `correio` |
| `referenciaExterna` | string | não | Ex: nº do pedido no portal da entidade |
| `anexosEnvio` | array | não | `[{ id, nome, url, tipo }]` — documentos enviados |
| `anexosResposta` | array | não | `[{ id, nome, url, tipo }]` — documentos recebidos |
| `comprovativoPagamento` | string | não | URL ou base64 do comprovativo |
| `taxaPaga` | number | não | Valor da taxa paga (€) |
| `utilizadorId` | string | não | Quem criou/alterou (admin ou convidado) |
| `utilizadorNome` | string | não | Nome denormalizado |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete |

### Validações
- Não permitir integração sem `clienteId`.
- Não permitir integração sem `entidadeId`.
- `estado` deve ser um dos valores permitidos.
- Se `taxaPaga` > 0, considerar criar despesa/honorário associado (regra de negócio opcional).

### Relacionamentos
- **Entidade** → Integrações (1:N): `where('entidadeId', '==', id)`
- **Processo** → Integrações: `where('processoTipo', '==', 'heranca').where('processoId', '==', id)`
- **Cliente** → Integrações: `where('clienteId', '==', id)`

---

## 3. COLEÇÃO: `logs_integracoes`

Auditoria completa de todas as ações nas integrações.

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `integracaoId` | string | sim | Ref: `integracoes_externas/{id}` |
| `acao` | string | sim | Ex: `criar`, `atualizar`, `alterar_estado`, `anexar`, `registar_resposta` |
| `data` | string | sim | ISO 8601 |
| `utilizadorId` | string | não | Quem fez a ação |
| `utilizadorNome` | string | não | Nome denormalizado |
| `detalhes` | map | não | Dados adicionais (ex: `{ estadoAnterior, estadoNovo }`) |
| `createdAt` | string | sim | ISO 8601 |

### Regras de negócio
- **Não apagar**: Logs são imutáveis, nunca deletar.
- Criar log automaticamente em cada `criar`, `atualizar`, `alterar_estado`.

---

## 4. RELACIONAMENTOS

```
clientes (1) ──────────────→ (N) integracoes_externas [clienteId]
entidades (1) ─────────────→ (N) integracoes_externas [entidadeId]
herancas | migracoes | registos (1) ─→ (N) integracoes_externas [processoId + processoTipo]
integracoes_externas (1) ──→ (N) logs_integracoes [integracaoId]
```

---

## 5. ÍNDICES RECOMENDADOS (Firestore)

```json
{
  "indexes": [
    {
      "collectionGroup": "integracoes_externas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clienteId", "order": "ASCENDING" },
        { "fieldPath": "dataEnvio", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "integracoes_externas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "entidadeId", "order": "ASCENDING" },
        { "fieldPath": "dataEnvio", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "integracoes_externas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "dataEnvio", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "integracoes_externas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "processoTipo", "order": "ASCENDING" },
        { "fieldPath": "processoId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "logs_integracoes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "integracaoId", "order": "ASCENDING" },
        { "fieldPath": "data", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 6. REGRAS DE SEGURANÇA (Firestore Rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Entidades: apenas admin pode criar/editar
    match /entidades/{docId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
      allow delete: if false;  // Nunca apagar, apenas desativar
    }

    // Integrações externas: admin e convidados autorizados (por cliente)
    match /integracoes_externas/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if false;  // Soft delete apenas
    }

    // Logs: apenas leitura, criação pelo backend/client
    match /logs_integracoes/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

---

## 7. OBSERVAÇÕES

### Escalabilidade
- Usar denormalização (`clienteNome`, `entidadeNome`) para evitar joins em listagens.
- Paginação em `integracoes_externas` com `limit()` e `startAfter()`.

### Auditoria
- Todo o histórico em `logs_integracoes`.
- Manter `updatedAt` em todas as coleções.

### Compatibilidade
- O campo `entidade` em heranças, migrações, registos, tarefas e documentos continua a guardar o id (ex: `financas_at`). A coleção `entidades` pode usar o mesmo id no campo `id` para mapeamento.
