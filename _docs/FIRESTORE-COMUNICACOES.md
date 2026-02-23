# Módulo Comunicações — Especificação Firestore

> Plataforma de solicitadoria. Registo de todas as interações com clientes, entidades externas e comunicações internas. Coleções existentes: `clientes`, `honorarios`, `contratos`, `herancas`, `migracoes`, `registos`, `entidades`, `integracoes_externas`, `faturas`, `pagamentos`, `despesas`, etc.

---

## 1. COLEÇÃO: `comunicacoes`

Cada documento representa uma comunicação real associada a um processo (email, telefonema, reunião, mensagem interna).

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável (gerado por `gerarIdImutavel()`) |
| `processoTipo` | string | sim | `heranca` \| `migracao` \| `registo` — tipo do processo |
| `processoId` | string | sim | ID do processo em herancas, migracoes ou registos |
| `processoRef` | string | não | Path Firestore: `herancas/xxx`, `migracoes/xxx`, `registos/xxx` |
| `clienteId` | string | não | Ref: `clientes/{id}` — obrigatório exceto para mensagens internas |
| `clienteNome` | string | não | Denormalizado para exibição rápida |
| `tipo` | string | sim | `email`, `telefonema`, `reuniao`, `mensagem_interna` |
| `direcao` | string | sim | `entrada`, `saida`, `interna` |
| `assunto` | string | condicional | Obrigatório para email; recomendado para reunião |
| `mensagem` | string | condicional | Conteúdo / resumo. Obrigatório para telefonema (resumo) |
| `participantes` | array | condicional | Obrigatório para reunião: `[{ nome, cargo, entidade? }]` |
| `dataReuniao` | string | condicional | ISO 8601 — obrigatório para reunião |
| `duracaoMinutos` | number | não | Duração em minutos (reunião, telefonema) |
| `meio` | string | sim | `telefone`, `email`, `presencial`, `whatsapp`, `portal`, `videoconferencia`, `outro` |
| `entidadeId` | string | não | Ref: `entidades/{id}` — se envolver entidade externa (Finanças, IRN, etc.) |
| `entidadeNome` | string | não | Denormalizado |
| `anexos` | array | não | `[{ id, nome, url, tipoMime, tamanho }]` — metadados inline ou ref a anexos_comunicacao |
| `oculto` | boolean | não | true = oculto para fins internos (nunca apagar, apenas ocultar) |
| `utilizadorId` | string | não | Quem registou (admin ou convidado) |
| `utilizadorNome` | string | não | Denormalizado |
| `data` | string | sim | ISO 8601 — data/hora da comunicação |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete (default: false) |

### Regras de negócio

- **Processo obrigatório**: Toda comunicação deve estar ligada a um processo (`processoTipo` + `processoId`).
- **Não apagar**: Comunicações não podem ser eliminadas, apenas marcadas como `oculto: true` ou `deleted: true`.
- **Mensagens internas**: Devem ter `tipo: mensagem_interna` e `direcao: interna`; não visíveis para clientes.
- **Emails**: `assunto` obrigatório. Emails enviados pela plataforma devem ser registados automaticamente.
- **Telefonemas**: `mensagem` (resumo) obrigatório.
- **Reuniões**: `participantes` e `dataReuniao` obrigatórios.
- **Edição**: Comunicações com `direcao: entrada` (ex: emails recebidos) não devem ser editáveis pelo utilizador — apenas adição de notas internas em campo separado.

### Relacionamentos

- **Processo** → Comunicações (1:N): `where('processoTipo', '==', x).where('processoId', '==', id)`
- **Cliente** → Comunicações (1:N): `where('clienteId', '==', id)`
- **Entidade** → Comunicações (1:N): `where('entidadeId', '==', id)`
- **Comunicação** → Anexos (1:N): via `anexos_comunicacao` com `comunicacaoId`

---

## 2. COLEÇÃO: `anexos_comunicacao`

Metadados dos ficheiros anexados a comunicações. O ficheiro em si fica em Firebase Storage.

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `comunicacaoId` | string | sim | Ref: `comunicacoes/{id}` |
| `processoTipo` | string | sim | Denormalizado para controlo de permissões |
| `processoId` | string | sim | Denormalizado |
| `url` | string | sim | URL no Firebase Storage (path inclui processo) |
| `nomeFicheiro` | string | sim | Nome original do ficheiro |
| `tipoMime` | string | sim | Ex: `application/pdf`, `image/jpeg` |
| `tamanho` | number | sim | Tamanho em bytes |
| `dataUpload` | string | sim | ISO 8601 |
| `utilizadorId` | string | não | Quem fez upload |
| `utilizadorNome` | string | não | Denormalizado |
| `createdAt` | string | sim | ISO 8601 |

### Regras de negócio

- **Comunicação obrigatória**: Não permitir anexo sem `comunicacaoId`.
- **Storage**: Path recomendado: `comunicacoes/{processoTipo}/{processoId}/{comunicacaoId}/{id}_{nomeFicheiro}`
- **Permissões**: Acesso a anexos deve seguir as permissões do processo associado.

### Relacionamentos

- **Comunicação** → Anexos (1:N): `where('comunicacaoId', '==', id)`

---

## 3. COLEÇÃO: `logs_comunicacoes`

Auditoria completa de todas as ações no módulo Comunicações.

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `comunicacaoId` | string | sim | Ref: `comunicacoes/{id}` |
| `acao` | string | sim | `criado`, `editado`, `ocultado`, `desocultado`, `anexo_adicionado`, `anexo_removido`, `nota_adicionada` |
| `data` | string | sim | ISO 8601 |
| `utilizadorId` | string | não | Quem fez a ação |
| `utilizadorNome` | string | não | Denormalizado |
| `detalhes` | string | não | Descrição da ação |
| `dadosExtra` | map | não | Ex: `{ anexoId, nomeFicheiro }` |
| `createdAt` | string | sim | ISO 8601 |

### Regras de negócio

- **Não apagar nem alterar**: Logs são imutáveis.
- **Criação automática**: Criar log em todas as ações relevantes (criar, editar, ocultar, anexar, remover anexo).

### Relacionamentos

- **Comunicação** → Logs (1:N): `where('comunicacaoId', '==', id)`

---

## 4. RELACIONAMENTOS (Diagrama)

```
herancas | migracoes | registos (1) ─→ (N) comunicacoes [processoTipo + processoId]
clientes (1) ──────────────────────→ (N) comunicacoes [clienteId]
entidades (1) ──────────────────────→ (N) comunicacoes [entidadeId]

comunicacoes (1) ──────────────────→ (N) anexos_comunicacao [comunicacaoId]
comunicacoes (1) ──────────────────→ (N) logs_comunicacoes [comunicacaoId]
```

---

## 5. VALIDAÇÕES (Resumo)

| Entidade | Regra |
|----------|-------|
| Comunicação | Processo obrigatório (processoTipo + processoId) |
| Comunicação | tipo obrigatório e deve ser: email, telefonema, reuniao, mensagem_interna |
| Comunicação | direcao obrigatória: entrada, saida, interna |
| Comunicação | Mensagem interna → direcao = "interna" |
| Comunicação | Email → assunto obrigatório |
| Comunicação | Telefonema → mensagem (resumo) obrigatório |
| Comunicação | Reunião → participantes e dataReuniao obrigatórios |
| Comunicação | Emails com direcao=entrada não editáveis (exceto nota interna) |
| Comunicação | Não apagar, apenas ocultar |
| Anexo | comunicacaoId obrigatório |
| Anexo | Path em Storage deve incluir processo |
| Log | Nunca apagar nem alterar |

---

## 6. ÍNDICES RECOMENDADOS (Firestore)

```json
{
  "collectionGroup": "comunicacoes",
  "fields": [
    { "fieldPath": "processoTipo", "order": "ASCENDING" },
    { "fieldPath": "processoId", "order": "ASCENDING" },
    { "fieldPath": "data", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "comunicacoes",
  "fields": [
    { "fieldPath": "clienteId", "order": "ASCENDING" },
    { "fieldPath": "data", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "comunicacoes",
  "fields": [
    { "fieldPath": "tipo", "order": "ASCENDING" },
    { "fieldPath": "data", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "comunicacoes",
  "fields": [
    { "fieldPath": "entidadeId", "order": "ASCENDING" },
    { "fieldPath": "data", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "anexos_comunicacao",
  "fields": [
    { "fieldPath": "comunicacaoId", "order": "ASCENDING" },
    { "fieldPath": "dataUpload", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "logs_comunicacoes",
  "fields": [
    { "fieldPath": "comunicacaoId", "order": "ASCENDING" },
    { "fieldPath": "data", "order": "DESCENDING" }
  ]
}
```

---

## 7. REGRAS DE SEGURANÇA (Firestore Rules)

```
match /comunicacoes/{docId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth != null;
  allow delete: if false;  // Apenas ocultar (soft delete)
}
match /anexos_comunicacao/{docId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth != null;
  allow delete: if false;
}
match /logs_comunicacoes/{docId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update, delete: if false;  // Imutável
}
```

**Nota**: O Sistema Legal usa sessão local (senha admin). Para desenvolvimento, use `if true`. Para controlo por processo (apenas utilizadores envolvidos), é necessário Firebase Auth com custom claims e verificação de acesso ao processo.

---

## 8. FIREBASE STORAGE — Anexos

Estrutura recomendada de paths:

```
/comunicacoes/
  /{processoTipo}/
    /{processoId}/
      /{comunicacaoId}/
        /{anexoId}_{nomeFicheiro}
```

Exemplo: `/comunicacoes/herancas/abc123/comm-xyz/file.pdf`

Regras Storage (exemplo):

```
match /comunicacoes/{path=**} {
  allow read, write: if request.auth != null;
}
```

---

## 9. OBSERVAÇÕES

### Escalabilidade

- **Denormalização**: `clienteNome`, `entidadeNome`, `processoRef` evitam joins em listagens.
- **Paginação**: Usar `limit()` e `startAfter()` em comunicacoes.
- **Filtros**: Índices cobrem processo, cliente, tipo, entidade, data.

### Auditoria

- Todo o histórico em `logs_comunicacoes`.
- Manter `createdAt` e `updatedAt` em comunicacoes e anexos.
- Campo `oculto` permite esconder sem perder histórico.

### Compatibilidade

- **Integrações vs Comunicações**: `integracoes_externas` regista interações formais com entidades (pedidos, respostas). `comunicacoes` regista todos os contactos (emails, chamadas, reuniões). Podem coexistir e cruzar-se via `entidadeId` e `processoId`.
- **Processos**: Usar `processoTipo` + `processoId` (herancas, migracoes, registos) como nos outros módulos.

### Notas internas em comunicações recebidas

- Para emails recebidos (`direcao: entrada`) que não devem ser editados, adicionar campo opcional `notasInternas` (string) onde o utilizador pode acrescentar observações.

---

## 10. CONSTANTES E ENUMS (para o frontend)

```javascript
const COMUNICACAO_TIPOS = ['email', 'telefonema', 'reuniao', 'mensagem_interna'];
const COMUNICACAO_DIRECAO = ['entrada', 'saida', 'interna'];
const COMUNICACAO_MEIO = ['telefone', 'email', 'presencial', 'whatsapp', 'portal', 'videoconferencia', 'outro'];
const LOG_COMUNICACAO_ACOES = ['criado', 'editado', 'ocultado', 'desocultado', 'anexo_adicionado', 'anexo_removido', 'nota_adicionada'];
```
