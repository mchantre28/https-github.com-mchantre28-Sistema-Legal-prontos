# Como funcionam as entidades do Sistema Legal

> Explicações em texto simples sobre cada módulo da base de dados (Firestore). Útil para quem usa ou desenvolve o sistema.

---

## Índice

1. [Faturas](#1-faturas)
2. [Pagamentos](#2-pagamentos)
3. [Entidades](#3-entidades)
4. [Integrações Externas](#4-integrações-externas)
5. [Representantes](#5-representantes)
6. [Clientes](#6-clientes)
7. [Honorários](#7-honorários)
8. [Processos (Heranças, Migrações, Registos)](#8-processos)
9. [Documentos](#9-documentos)
10. [Despesas](#10-despesas)
11. [Convidados](#11-convidados)
12. [Tarefas e Prazos](#12-tarefas-e-prazos)

---

## 1. Faturas

**O que são?** Faturas emitidas aos clientes pelos serviços prestados. Cada fatura representa um documento oficial de cobrança (Fatura/Recibo).

**Como funcionam?**
- São criadas automaticamente a partir dos **honorários** (clicando em "Gerar faturas" na secção Honorários) ou manualmente.
- Cada fatura tem um **número** (ex: FAT-2026-001), está ligada a um **cliente** e pode estar ligada a um **honorário** ou **processo** (herança, migração, registo).
- Guardam o **valor total**, o **valor base** (sem IVA), o **IVA**, e o **estado** (pendente, paga, cancelada).
- O campo `somaPagamentos` é atualizado automaticamente quando se registam **pagamentos** — quando a soma dos pagamentos atinge o valor total, a fatura passa a "paga".
- **Não se apagam**: faturas canceladas ficam com `estado: cancelada` e `deleted: true`.

**Onde na base de dados?** Coleção `faturas`.

**Relacionamentos:** Cliente → Faturas (1:N). Honorário → Fatura (1:1). Fatura → Pagamentos (1:N).

---

## 2. Pagamentos

**O que são?** Registo de pagamentos recebidos dos clientes, associados a uma fatura.

**Como funcionam?**
- Cada pagamento tem um **valor**, uma **data**, um **método** (transferência, MB Way, numerário, cartão) e está ligado a uma **fatura** (`faturaId`).
- Ao criar um pagamento, o sistema soma automaticamente todos os pagamentos dessa fatura e atualiza o campo `somaPagamentos` na fatura.
- Se `somaPagamentos >= valorTotal`, a fatura passa a estado **"paga"**.
- Pagamentos podem ser **parciais** — uma fatura de 500€ pode ter um pagamento de 200€ e outro de 300€.
- **Não se apagam**: pagamentos anulados ficam com `anulado: true`.

**Onde na base de dados?** Coleção `pagamentos`.

**Relacionamentos:** Fatura → Pagamentos (1:N).

---

## 3. Entidades

**O que são?** Catálogo de instituições portuguesas com quem a solicitadora interage: Finanças, IRN, Conservatórias, IMT, Câmaras Municipais, Segurança Social, Embaixadas, etc.

**Como funcionam?**
- São uma lista de **referência** — não representam interações concretas, apenas as entidades disponíveis.
- Na primeira vez que o sistema usa Firestore, pode fazer um **seed** automático: preenche a coleção com entidades predefinidas (Finanças AT, Conservatórias, IMT, etc.).
- Cada entidade tem **nome**, **tipo** (financas, conservatoria, imt, etc.), **sigla** (AT, IRN), **website**, **contactos**.
- São usadas em **dropdowns** ao criar processos, documentos, integrações externas — para escolher "a que entidade este processo/documento está associado".
- **Não se apagam**: entidades desativadas ficam com `ativo: false`.

**Onde na base de dados?** Coleção `entidades`.

**Exemplo:** Ao criar uma herança, escolhe-se "Conservatória do Registo Predial" como entidade. Esse valor vem da coleção `entidades`.

---

## 4. Integrações Externas

**O que são?** Registo de **interações reais** com entidades externas — quando a solicitadora faz um pedido à Finanças, envia documentação ao IRN, recebe uma resposta do IMT, etc.

**Como funcionam?**
- Cada documento representa **uma interação** (um pedido, uma consulta, uma reclamação, uma renovação).
- Está sempre ligada a uma **entidade** (qual instituição), um **cliente** e um **processo** (herança, migração ou registo).
- Guarda: **tipo de interação** (pedido, consulta, reclamação...), **estado** (enviado, pendente, concluído, indeferido), **data de envio**, **data de resposta**, **canal** (online, presencial, email, portal, correio).
- Pode ter **anexos enviados** e **anexos recebidos** (URLs de ficheiros no Storage).
- Se houve **taxa paga**, pode registar o valor e comprovativo.
- `logs_integracoes` guarda o histórico de alterações (auditoria).

**Onde na base de dados?** Coleções `integracoes_externas` e `logs_integracoes`.

**Relação:** Entidades = "quem existe". Integrações = "o que fizemos com quem".

---

## 5. Representantes

**O que são?** Pessoas que representam **clientes do tipo empresa** (representante legal, procurador, etc.).

**Como funcionam?**
- Só fazem sentido quando o cliente é uma **empresa** (`tipo: empresa`).
- Cada representante está ligado a um **cliente** (`clienteEmpresaId`) e tem: nome, NIF, cargo, contactos, **poderes** (ex: "assinar contratos", "representar em tribunal").
- Pode ter **procuração** (URL do documento) e **data de validade** da procuração.
- O sistema pode alertar quando a validade da procuração está próxima do fim (ex: menos de 30 dias).

**Onde na base de dados?** Coleção `representantes`.

**Relacionamentos:** Cliente (empresa) → Representantes (1:N).

---

## 6. Clientes

**O que são?** Pessoas ou empresas que são clientes da solicitadora.

**Como funcionam?**
- Podem ser **particulares** ou **empresas** (`tipo`).
- Guardam: nome, NIF, email, telefone, morada, código postal, localidade.
- Empresas podem ter **representantes** ligados.
- Clientes **desativados** ficam com `ativo: false` (não se apagam).
- São a base para processos, honorários, faturas, contratos — quase tudo passa por um cliente.

**Onde na base de dados?** Coleção `clientes`.

---

## 7. Honorários

**O que são?** Serviços ou valores a cobrar ao cliente — a "linha" que depois vira fatura.

**Como funcionam?**
- Cada honorário tem: **descrição** (ex: "Assessoria Jurídica - AIMA"), **valor**, **cliente**, e pode estar ligado a um **processo** (herança, migração, registo).
- A função **"Gerar faturas"** percorre os honorários que ainda não têm fatura e cria uma fatura para cada um.
- Honorários com valor 0 ou que já têm fatura associada não entram na geração automática.

**Onde na base de dados?** Coleção `honorarios`.

**Relacionamentos:** Cliente → Honorários (1:N). Honorário → Fatura (1:1, quando gerada).

---

## 8. Processos (Heranças, Migrações, Registos)

**O que são?** Os três tipos principais de processos jurídicos que a solicitadora trata. Cada tipo tem a sua coleção: `herancas`, `migracoes`, `registos`.

**Como funcionam?**
- **Heranças**: processos de herança.
- **Migrações**: processos de migração (ex: residência, nacionalidade, AIMA).
- **Registos**: outros registos (predial, comercial, automóvel, etc.).
- Todos têm estrutura similar: cliente, estado, data de abertura, descrição, tipo, prioridade.
- Tarefas, documentos, prazos, faturas e integrações externas referenciam o processo por `processoTipo` + `processoId` (ex: `processoTipo: "heranca"`, `processoId: "abc123"`).

**Onde na base de dados?** Coleções `herancas`, `migracoes`, `registos`.

---

## 9. Documentos

**O que são?** Certidões, contratos, procurações, anexos — ficheiros ou referências a documentos ligados a processos.

**Como funcionam?**
- Cada documento está ligado a um **processo** (processoTipo + processoId) e a um **cliente**.
- Guarda: **tipo** (Certidão, Contrato, Procuração...), **URL** (ficheiro no Storage), **entidade emissora** (ex: Finanças, Conservatória), **data de emissão**, **validade**.
- São listados na secção Documentos do processo e podem ser usados em modelos de impressão (ex: Fatura/Recibo).

**Onde na base de dados?** Coleção `documentos`.

---

## 10. Despesas

**O que são?** Gastos internos associados a processos — taxas, certidões, deslocações, fotocópias.

**Como funcionam?**
- Cada despesa está ligada a um **processo** e tem: descrição, valor, data, tipo (taxa, certidão, deslocação, etc.).
- Podem ter comprovativo (URL).
- Servem para relatórios de rentabilidade: receitas (faturas) vs despesas por processo/cliente.

**Onde na base de dados?** Coleção `despesas`.

---

## 11. Convidados

**O que são?** Acesso externo por **código** — permite que um cliente veja apenas os seus dados (processos, documentos) sem ter conta de administrador.

**Como funcionam?**
- O admin gera um **código** para um cliente.
- O cliente acede ao sistema com esse código e vê apenas o que lhe diz respeito.
- Cada convidado tem: código, cliente associado, nome, possivelmente email.
- Convidados podem ser revogados (código invalidado).

**Onde na base de dados?** Coleção `convidados`.

---

## 12. Tarefas e Prazos

**Tarefas** são atividades a fazer dentro de um processo: "Obter certidão", "Enviar documentação", etc. Têm estado (aberta, em curso, concluída), prazo e responsável. Coleção `tarefas`.

**Prazos** são datas limite legais ou internas: "Prazo para apresentar reclamação", "Data do julgamento". Têm tipo (legal, interno, judicial), data limite e estado. Coleção `prazos`.

Ambos estão ligados a processos por `processoTipo` + `processoId`.

---

## Resumo rápido

| Entidade | Para que serve |
|----------|----------------|
| **Faturas** | Documentos de cobrança aos clientes |
| **Pagamentos** | Registo do que o cliente já pagou |
| **Entidades** | Catálogo de instituições (Finanças, IRN, IMT...) |
| **Integrações Externas** | Interações com essas instituições |
| **Representantes** | Pessoas que representam clientes empresa |
| **Clientes** | Quem contrata a solicitadora |
| **Honorários** | Serviços/valores a cobrar (base para faturas) |
| **Processos** | Heranças, migrações, registos |
| **Documentos** | Certidões, contratos, anexos |
| **Despesas** | Gastos por processo |
| **Convidados** | Acesso externo por código |
| **Tarefas / Prazos** | Atividades e datas limite por processo |
