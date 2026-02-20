# Estrutura Completa Firestore — Plataforma de Solicitadoria

> Documento mestre que consolida e melhora toda a estrutura de dados. Mantém compatibilidade com o existente (herancas, migracoes, registos, clienteId, processoTipo+processoId).

---

## Índice
1. [Clientes e Representantes](#1-clientes-e-representantes)
2. [Processos e Tarefas](#2-processos-e-tarefas)
3. [Documentos](#3-documentos)
4. [Entidades e Integrações Externas](#4-entidades-e-integrações-externas)
5. [Comunicações](#5-comunicações)
6. [Financeiro](#6-financeiro)
7. [Utilizadores e Auditoria](#7-utilizadores-e-auditoria)
8. [Configurações](#8-configurações)
9. [Relacionamentos](#9-relacionamentos)
10. [Índices, Rules e Observações](#10-índices-rules-e-observações)

---

# 1. CLIENTES E REPRESENTANTES

## 1.1 Coleção: `clientes` (MELHORADA)

**Campos existentes + novos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `tipo` | string | sim | `particular` \| `empresa` — **NOVO** |
| `nome` | string | sim | Nome completo (particular) ou contacto principal |
| `razaoSocial` | string | não | Razão social (se tipo=empresa) — **NOVO** |
| `nif` | string | não | NIF |
| `email` | string | não | Email principal |
| `telefone` | string | não | Telefone principal |
| `contactos` | map | não | `{ emailAlternativo, telefoneAlternativo }` — **NOVO** |
| `morada` | string | não | Morada / endereco |
| `documentosIdentificacao` | array | não | `[{ tipo, url, validade }]` — **NOVO** |
| `ativo` | boolean | sim | true = ativo; false = desativado |
| `status` | string | não | Alias de ativo (ativo/inativo) — compatibilidade |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete |

**Regras:** Clientes tipo=empresa podem ter representantes. Não apagar, apenas desativar.

---

## 1.2 Coleção: `representantes` (NOVA)

Para empresas — pessoas que representam o cliente jurídico.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `clienteEmpresaId` | string | sim | Ref: `clientes/{id}` (cliente com tipo=empresa) |
| `clienteEmpresaNome` | string | não | Denormalizado |
| `nome` | string | sim | Nome completo |
| `nif` | string | não | NIF do representante |
| `cargo` | string | não | Cargo na empresa |
| `contactoEmail` | string | não | Email de contacto |
| `contactoTelefone` | string | não | Telefone |
| `poderes` | array | não | `["assinar contratos", "representar em tribunal"]` |
| `documentoIdentificacaoUrl` | string | não | URL do documento de identificação |
| `procuracaoUrl` | string | não | URL da procuração |
| `validadeProcuracao` | string | não | ISO 8601 — data de validade |
| `ativo` | boolean | sim | true = ativo |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete |

**Regras:** Alertas automáticos quando `validadeProcuracao` < 30 dias. Não apagar, apenas desativar.

---

# 2. PROCESSOS E TAREFAS

## 2.1 Processos: `herancas`, `migracoes`, `registos` (MANTIDO + MELHORADO)

**Nota:** O sistema usa 3 coleções (herancas, migracoes, registos) em vez de uma única `processos`. Cada uma é um tipo de processo. Mantém-se para compatibilidade.

**Campos existentes + novos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `numeroInterno` | string | não | Nº interno do processo — **NOVO** |
| `clienteId` | string | sim | Ref: clientes |
| `clienteNome` | string | não | Denormalizado |
| `tipo` | string | sim | heranca \| migracao \| registo |
| `tipoProcesso` | string | não | Alias — **para tipos_de_processos** |
| `estado` | string | sim | Em aberto, Concluído, Suspenso, etc. |
| `status` | string | não | Alias de estado |
| `prioridade` | string | não | baixa \| media \| alta |
| `dataAbertura` | string | sim | ISO 8601 — data de abertura |
| `dataConclusao` | string | não | ISO 8601 — quando concluído |
| `solicitadorResponsavel` | string | não | Ref: utilizadores ou nome — **NOVO** |
| `descricao` | string | não | Descrição do processo |
| `notas` | string | não | Notas internas |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete |

**Coleções:** `herancas`, `migracoes`, `registos` — mesma estrutura, tipo implícito pelo nome da coleção.

---

## 2.2 Coleção: `tarefas` (MELHORADA — alinhada com tarefas_do_processo)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `processoTipo` | string | sim | heranca \| migracao \| registo — **NOVO** |
| `processoId` | string | sim | Ref ao processo |
| `clienteId` | string | não | Para filtro convidados — mantido |
| `descricao` | string | sim | Descrição da tarefa |
| `titulo` | string | não | Título curto |
| `estado` | string | sim | aberta \| em_curso \| concluida \| cancelada |
| `status` | string | não | Alias (concluida = concluida) |
| `concluida` | boolean | não | true se concluída |
| `prazo` | string | não | ISO 8601 — data limite |
| `dataLimite` | string | não | Alias de prazo |
| `responsavelId` | string | não | Ref: utilizadores — **NOVO** |
| `anexos` | array | não | `[{ url, nome }]` |
| `dataCriacao` | string | sim | ISO 8601 |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete |

**Regras:** Toda tarefa deve estar ligada a um processo (processoTipo + processoId).

---

## 2.3 Coleção: `prazos` (MELHORADA — alinhada com prazos_legais)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `processoTipo` | string | sim | heranca \| migracao \| registo — **NOVO** |
| `processoId` | string | sim | Ref ao processo |
| `clienteId` | string | não | Para filtro — mantido |
| `tipoPrazo` | string | sim | legal \| interno \| judicial \| outro — **MELHORADO** |
| `dataLimite` | string | sim | ISO 8601 |
| `entidadeRelacionada` | string | não | Finanças, IRN, etc. — **NOVO** |
| `alertaGerado` | boolean | não | true se alerta já foi enviado — **NOVO** |
| `descricao` | string | não | Descrição do prazo |
| `status` | string | sim | ativo \| cumprido \| ultrapassado \| cancelado |
| `prioridade` | string | não | baixa \| media \| alta |
| `referenciaId` | string | não | Ref a tarefa/documento |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete |

**Regras:** Alertas automáticos X dias antes de `dataLimite`. `alertaGerado` evita duplicados.

---

# 3. DOCUMENTOS

## 3.1 Coleção: `documentos` (MELHORADA)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `processoTipo` | string | sim | heranca \| migracao \| registo |
| `processoId` | string | sim | Ref ao processo |
| `clienteId` | string | não | Para filtro |
| `tipoDocumento` | string | sim | Certidão, Contrato, Procuração, etc. |
| `url` | string | sim | URL no Storage |
| `nomeFicheiro` | string | não | Nome original |
| `dataEmissao` | string | não | ISO 8601 |
| `validade` | string | não | ISO 8601 — data de validade |
| `entidadeEmissora` | string | não | Finanças, Conservatória, etc. |
| `versao` | number | não | Número da versão |
| `utilizadorId` | string | não | Quem carregou |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete |

---

## 3.2 Coleção: `modelos_de_documentos` (NOVA)

Templates para geração de documentos.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `nome` | string | sim | Nome do modelo |
| `tipoProcesso` | string | não | heranca \| migracao \| registo \| geral |
| `conteudoTemplate` | string | sim | HTML ou texto com placeholders |
| `versao` | number | sim | 1, 2, 3... |
| `ativo` | boolean | sim | true = disponível |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete |

---

# 4. ENTIDADES E INTEGRAÇÕES EXTERNAS

*(Ver `FIRESTORE-INTEGRACOES-EXTERNAS.md` — mantido)*

- **entidades**: Catálogo Finanças, IRN, IMT, Câmaras, etc.
- **integracoes_externas**: Interações com entidades (pedidos, respostas)
- **logs_integracoes**: Auditoria

---

# 5. COMUNICAÇÕES

*(Ver `FIRESTORE-COMUNICACOES.md` — mantido)*

- **comunicacoes**: Emails, telefonemas, reuniões, mensagens internas
- **anexos_comunicacao**: Metadados dos anexos
- **logs_comunicacoes**: Auditoria

---

# 6. FINANCEIRO

*(Ver `FIRESTORE-FATURAS-PAGAMENTOS.md` — mantido)*

- **faturas**: Faturas emitidas
- **pagamentos**: Pagamentos (totais/parciais)
- **despesas**: Despesas por processo
- **logs_financeiros**: Auditoria

---

# 7. UTILIZADORES E AUDITORIA

## 7.1 Coleção: `utilizadores` (NOVA)

Utilizadores internos da plataforma (solicitadores, assistentes, etc.). O sistema atual usa `admin` (senha no sistema/config) e `convidados` (acesso por cliente). Esta coleção estende para múltiplos utilizadores.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID (pode ser Firebase Auth UID) |
| `nome` | string | sim | Nome completo |
| `email` | string | sim | Email (login) |
| `funcao` | string | sim | solicitador \| assistente \| administrativo \| gestor |
| `ativo` | boolean | sim | true = pode aceder |
| `createdAt` | string | sim | ISO 8601 |
| `updatedAt` | string | sim | ISO 8601 |
| `deleted` | boolean | não | Soft delete |

**Nota:** Migração gradual. `convidados` continua para acesso externo por código. `utilizadores` para equipa interna quando Firebase Auth for usado.

---

## 7.2 Coleção: `auditoria` (EXISTENTE — MELHORADA)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | ID imutável |
| `acao` | string | sim | criar, editar, apagar, login, etc. |
| `modulo` | string | sim | clientes, herancas, faturas, etc. |
| `referenciaId` | string | não | ID do documento afetado |
| `referenciaTipo` | string | não | Tipo do documento |
| `data` | string | sim | ISO 8601 |
| `utilizadorId` | string | não | Quem fez a ação |
| `utilizadorNome` | string | não | Denormalizado |
| `detalhes` | string | não | Descrição livre |
| `dadosAntes` | map | não | Snapshot (opcional) |
| `dadosDepois` | map | não | Snapshot (opcional) |
| `createdAt` | string | sim | ISO 8601 |

**Regras:** Logs nunca apagados. Criar em todas as ações críticas.

---

# 8. CONFIGURAÇÕES

## 8.1 Coleção: `tipos_de_processos`

Catálogo de tipos (configurável).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID (ex: heranca, migracao, registo) |
| `nome` | string | Nome para exibição |
| `ordem` | number | Ordem na UI |
| `ativo` | boolean | true = disponível |

---

## 8.2 Coleção: `tipos_de_documentos`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID |
| `nome` | string | Certidão, Procuração, etc. |
| `ordem` | number | Ordem |
| `ativo` | boolean | true |

---

## 8.3 Coleção: `estados_de_processo`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID |
| `nome` | string | Em aberto, Concluído, etc. |
| `cor` | string | Hex para UI |
| `ordem` | number | Ordem |
| `ativo` | boolean | true |

---

## 8.4 Coleção: `checklists`

Checklists por tipo de processo (ex: documentos necessários para herança).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID |
| `nome` | string | Nome do checklist |
| `tipoProcesso` | string | heranca \| migracao \| registo |
| `itens` | array | `[{ descricao, obrigatorio }]` |
| `ativo` | boolean | true |

---

## 8.5 Coleção: `tabelas_de_prazos`

Prazos legais por tipo de processo/entidade.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID |
| `tipoProcesso` | string | heranca \| migracao \| registo |
| `entidade` | string | Finanças, IRN, etc. |
| `tipoPrazo` | string | Nome do prazo |
| `diasUteis` | number | Prazo em dias úteis |
| `descricao` | string | Descrição |
| `ativo` | boolean | true |

---

# 9. RELACIONAMENTOS

```
clientes (1) ──────→ (N) representantes [clienteEmpresaId]
clientes (1) ──────→ (N) herancas | migracoes | registos [clienteId]
clientes (1) ──────→ (N) faturas [clienteId]
clientes (1) ──────→ (N) comunicacoes [clienteId]

herancas | migracoes | registos (1) ─→ (N) tarefas [processoId + processoTipo]
herancas | migracoes | registos (1) ─→ (N) prazos [processoId + processoTipo]
herancas | migracoes | registos (1) ─→ (N) documentos [processoId + processoTipo]
herancas | migracoes | registos (1) ─→ (N) comunicacoes [processoId + processoTipo]
herancas | migracoes | registos (1) ─→ (N) integracoes_externas [processoId + processoTipo]
herancas | migracoes | registos (1) ─→ (N) despesas [processoId + processoTipo]
herancas | migracoes | registos (1) ─→ (N) faturas [processoId + processoTipo]

faturas (1) ───────→ (N) pagamentos [faturaId]
comunicacoes (1) ──→ (N) anexos_comunicacao [comunicacaoId]
integracoes_externas (1) → (N) logs_integracoes [integracaoId]
comunicacoes (1) ──→ (N) logs_comunicacoes [comunicacaoId]
```

---

# 10. ÍNDICES, RULES E OBSERVAÇÕES

## 10.1 Índices adicionais

Para as novas/melhoradas coleções:

- `representantes` por clienteEmpresaId
- `representantes` por validadeProcuracao (alertas)
- `modelos_de_documentos` por tipoProcesso
- `utilizadores` por email, funcao
- `auditoria` por modulo, data, referenciaId

## 10.2 Regras Firestore

Adicionar para: `representantes`, `modelos_de_documentos`, `utilizadores`, `tipos_de_processos`, `tipos_de_documentos`, `estados_de_processo`, `checklists`, `tabelas_de_prazos`.

## 10.3 Escalabilidade

- **Denormalização** em listagens (clienteNome, processoRef, etc.)
- **Paginação** com limit() e startAfter()
- **Soft delete** em todas as entidades principais
- **Campos processoTipo + processoId** para queries transversais

## 10.4 Segurança

- Comprovativos em Storage com path por processo
- Logs imutáveis (create only, no update/delete)
- Controlo de acesso por processo (quando Firebase Auth + custom claims)

## 10.5 Migração gradual

- **Clientes**: Adicionar `tipo`, `documentosIdentificacao`; manter `nome`, `email`, `telefone`, `nif`, `morada`
- **Processos**: Adicionar `numeroInterno`, `solicitadorResponsavel`, `dataConclusao`; manter estrutura herancas/migracoes/registos
- **Tarefas/Prazos**: Adicionar `processoTipo`; manter `clienteId` para convidados
- **Utilizadores**: Nova coleção; convidados continua separado
