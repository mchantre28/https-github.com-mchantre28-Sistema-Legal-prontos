# Estrutura Firestore — Sistema Legal Prontos

> Projeto oficial: https://mchantre28.github.io/https-github.com-mchantre28-Sistema-Legal-prontos/  
> Firebase: anapaulamedinasolicitadora

---

## Coleções

| Coleção | Descrição |
|---------|-----------|
| `clientes` | Clientes (particular/empresa), contactos, morada |
| `representantes` | Representantes de empresas (procurações, validades) |
| `herancas`, `migracoes`, `registos` | Processos (3 tipos) |
| `tarefas` | Tarefas por processo |
| `prazos` | Prazos legais e internos |
| `documentos` | Documentos por processo |
| `modelos_de_documentos` | Templates para geração |
| `entidades` | Finanças, IRN, IMT, Câmaras, etc. |
| `integracoes_externas` | Interações com entidades |
| `logs_integracoes` | Auditoria integrações |
| `comunicacoes` | Emails, telefonemas, reuniões |
| `anexos_comunicacao` | Anexos de comunicações |
| `logs_comunicacoes` | Auditoria comunicações |
| `faturas`, `pagamentos`, `despesas` | Financeiro |
| `logs_financeiros` | Auditoria financeira |
| `utilizadores` | Equipa interna |
| `auditoria` | Auditoria geral |
| `tipos_de_processos`, `tipos_de_documentos`, `estados_de_processo`, `checklists`, `tabelas_de_prazos` | Configurações |
| `honorarios`, `contratos`, `notificacoes`, `convidados`, `sistema` | Existentes |

---

## Campos principais (camelCase)

### clientes
`id`, `tipo` (particular|empresa), `nome`, `razaoSocial`, `nif`, `email`, `telefone`, `contactos`, `morada`, `documentosIdentificacao`, `ativo`, `createdAt`, `updatedAt`, `deleted`

### representantes
`id`, `clienteEmpresaId`, `nome`, `nif`, `cargo`, `contactoEmail`, `contactoTelefone`, `poderes`, `procuracaoUrl`, `validadeProcuracao`, `ativo`, `createdAt`, `updatedAt`, `deleted`

### processos (herancas|migracoes|registos)
`id`, `numeroInterno`, `clienteId`, `tipo`, `estado`, `prioridade`, `dataAbertura`, `dataConclusao`, `solicitadorResponsavel`, `descricao`, `notas`, `createdAt`, `updatedAt`, `deleted`

### tarefas
`id`, `processoTipo`, `processoId`, `descricao`, `estado`, `prazo`, `responsavelId`, `anexos`, `createdAt`, `updatedAt`, `deleted`

### prazos
`id`, `processoTipo`, `processoId`, `tipoPrazo`, `dataLimite`, `entidadeRelacionada`, `alertaGerado`, `status`, `createdAt`, `updatedAt`, `deleted`

---

## Deploy Firebase

```powershell
.\1-login-firebase.bat    # uma vez
.\2-deploy-firestore.bat # regras + índices
```

Ficheiros: `firebase.json`, `firestore.rules`, `firestore.indexes.json`

---

## Inicializar coleções (aparecer na consola)

As coleções só aparecem no Firebase Console após o primeiro documento. Para criar todas:

1. Abra `inicializar-firestore.html` no browser (ou via GitHub Pages)
2. Clique em **"Criar estrutura Firestore"**
3. Atualize a consola do Firebase

Alternativa: consola do browser (F12) no index.html após login → colar e executar `seed-firestore-colecoes.js`.

---

## Documentação completa

Ver **FIRESTORE-ESTRUTURA-COMPLETA.md** para todos os campos, tipos, regras, relações e índices.

---

## Por que só aparecem 2 coleções?

O Firestore só cria coleções quando se escreve o primeiro documento. As regras e índices estão definidos, mas coleções sem dados não aparecem na consola. Para criar as coleções:

1. Abra `inicializar-firestore.html` (ou o sistema em produção)
2. Clique em **Criar estrutura Firestore**
3. Atualize a consola do Firebase

Ver `FIRESTORE-ESTRUTURA-COMPLETA.md` para a especificação completa.
