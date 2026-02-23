# Estrutura Firestore Completa — Plataforma Profissional de Solicitadoria

> Projeto oficial: https://mchantre28.github.io/https-github.com-mchantre28-Sistema-Legal-prontos/  
> Firebase: anapaulamedinasolicitadora

---

## Por que só vê 2 coleções na consola?

**O Firestore só cria uma coleção quando se escreve o primeiro documento.** As regras e índices estão definidos, mas as coleções sem dados não aparecem na consola. Para criar as coleções vazias, execute o script de seed (ver secção final).

---

# 1. CLIENTES E REPRESENTANTES

## Coleção: `clientes`
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| id | string | sim | Identificador único |
| tipo | string | sim | `particular` \| `empresa` |
| nome | string | sim | Nome (particular) |
| razaoSocial | string | não | Razão social (empresa) |
| nif | string | não | NIF |
| email | string | não | Email principal |
| telefone | string | não | Telefone principal |
| contactos | array | não | [{tipo, valor}, ...] |
| morada | string/object | não | Morada completa |
| documentosIdentificacao | array | não | URLs ou refs |
| ativo | boolean | sim | true = ativo |
| createdAt | timestamp | sim | Data criação |
| updatedAt | timestamp | sim | Data atualização |
| deleted | boolean | não | Soft delete |

**Regras:** Soft delete (deleted=true). Empresas podem ter representantes.

---

## Coleção: `representantes`
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| id | string | sim | Identificador único |
| clienteEmpresaId | string | sim | Ref. ao cliente (empresa) |
| nome | string | sim | Nome completo |
| nif | string | não | NIF |
| cargo | string | não | Cargo na empresa |
| contactoEmail | string | não | Email |
| contactoTelefone | string | não | Telefone |
| poderes | array | não | Lista de poderes |
| procuracaoUrl | string | não | URL da procuração |
| validadeProcuracao | timestamp | não | Data validade (alertas) |
| ativo | boolean | sim | Não apagar, desativar |
| createdAt | timestamp | sim | |
| updatedAt | timestamp | sim | |
| deleted | boolean | não | Soft delete |

**Regras:** Alertas automáticos para validade de procurações. Soft delete.

---

# 2. PROCESSOS E TAREFAS

## Coleções: `herancas` | `migracoes` | `registos` (processos por tipo)
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| id | string | sim | Identificador único |
| numeroInterno | string | não | Nº interno do processo |
| clienteId | string | sim | Ref. cliente |
| tipo | string | não | Tipo processual |
| estado | string | sim | Estado atual |
| prioridade | string | não | baixa \| média \| alta |
| dataAbertura | timestamp | não | Data abertura |
| dataConclusao | timestamp | não | Data conclusão |
| solicitadorResponsavel | string | não | Ref. utilizador |
| descricao | string | não | Descrição |
| notas | string | não | Notas internas |
| createdAt | timestamp | sim | |
| updatedAt | timestamp | sim | |
| deleted | boolean | não | Soft delete |

---

## Coleção: `tarefas`
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| id | string | sim | Identificador único |
| processoTipo | string | sim | `herancas` \| `migracoes` \| `registos` |
| processoId | string | sim | Ref. ao processo |
| descricao | string | sim | Descrição da tarefa |
| estado | string | sim | pendente \| em curso \| concluída |
| prazo | timestamp | não | Data limite |
| responsavelId | string | não | Ref. utilizador |
| anexos | array | não | URLs anexos |
| createdAt | timestamp | sim | |
| updatedAt | timestamp | sim | |
| deleted | boolean | não | Soft delete |

---

## Coleção: `prazos`
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| id | string | sim | Identificador único |
| processoTipo | string | sim | Tipo do processo |
| processoId | string | sim | Ref. ao processo |
| tipoPrazo | string | não | legal \| interno |
| dataLimite | timestamp | sim | Data limite |
| entidadeRelacionada | string | não | Ref. entidade (Finanças, IRN, etc.) |
| alertaGerado | boolean | não | Se alerta já foi enviado |
| status | string | não | pendente \| cumprido \| ultrapassado |
| createdAt | timestamp | sim | |
| updatedAt | timestamp | sim | |
| deleted | boolean | não | Soft delete |

---

# 3–8. RESTANTES COLEÇÕES

Documentos, modelos, entidades, integrações, logs, comunicações, faturas, pagamentos, despesas, utilizadores, auditoria e configurações estão descritos em `FIRESTORE-ESTRUTURA.md` e nas regras/índices.

---

# INICIALIZAR COLEÇÕES (para aparecer na consola)

As coleções só aparecem no Firebase Console após o primeiro documento ser escrito.

**Opção 1 — Página de inicialização**

1. Abra `inicializar-firestore.html` no browser (ou via GitHub Pages)
2. Faça login no sistema
3. Clique em "Criar estrutura Firestore"
4. As coleções de configuração serão criadas

**Opção 2 — Consola do browser**

1. Abra o sistema e faça login
2. F12 → Consola
3. Cole e execute o script `seed-firestore-colecoes.js`

---

# ESTADO ATUAL

| Coleção | Regras | Índices | Sync no app |
|---------|--------|---------|-------------|
| clientes | ✓ | - | ✓ |
| representantes | ✓ | ✓ | ✓ |
| herancas, migracoes, registos | ✓ | - | ✓ |
| tarefas | ✓ | - | ✓ |
| prazos | ✓ | - | ✓ |
| documentos | ✓ | - | ✓ |
| entidades | ✓ | - | ✓ |
| integracoes_externas | ✓ | ✓ | ✓ |
| logs_integracoes | ✓ | ✓ | ✓ |
| faturas | ✓ | ✓ | ❌ (localStorage) |
| pagamentos | ✓ | ✓ | ❌ |
| despesas | ✓ | ✓ | ❌ |
| comunicacoes | ✓ | ✓ | ❌ |
| utilizadores | ✓ | ✓ | ❌ |
| auditoria | ✓ | ✓ | ✓ |
| tipos_de_processos, etc. | ✓ | - | ❌ (sem UI) |

**As regras e índices estão no repositório. As coleções aparecem quando há dados.** Faturas, pagamentos, despesas e comunicações usam ainda localStorage — o sync Firestore será adicionado em futuras versões.
