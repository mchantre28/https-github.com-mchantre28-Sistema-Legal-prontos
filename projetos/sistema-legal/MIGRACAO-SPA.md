# Migração SPA — Firebase → API Node.js

## Estado atual: Fase 1 (implementada)

A Fase 1 integra a API JWT no `index.html` (SPA principal) **sem reescrever** `script.js` na íntegra.

### Comportamento

| Condição | Fonte de dados |
|----------|----------------|
| Sessão JWT ativa (`SistemaLegalAPI.getToken()`) | API Node.js (`/api/processos`, `/api/clientes`) |
| Sem JWT | Firebase/Firestore (comportamento legado inalterado) |

### O que foi ligado na Fase 1

1. **Dashboard** — widget `apiProcessosWidget` com processos da API (já existente).
2. **Heranças** — painel superior com processos filtrados (prefixo `HER-`, título com «herança»/«espólio»).
3. **Registos** — painel superior com processos filtrados (prefixo `REG-`, título com «registo»).
4. **Clientes** — `obterClientesAtual()` devolve clientes da API quando JWT ativo e cache preenchida.
5. **Admin** — `GET /api/clientes` para dropdown/datalist no formulário de novo processo.

### Feature flag

Em `script.js`: `API_SPA_FASE1 = true`. Com JWT inativo, todas as secções continuam a usar Firebase.

---

## Fase 2 — itens pendentes (não implementados)

### Autenticação e sessão

- [ ] Unificar login: admin que entra em `admin.html` e depois abre «Sistema completo» sem re-login Firebase
- [ ] Logout global: limpar JWT + sessão Firestore num único fluxo
- [ ] Refresh token ou renovação automática antes de expiração (8h)

### Dados de negócio

- [ ] Migrar **honorários** para tabelas API (ou manter híbrido documentado)
- [ ] Migrar **contratos**, **prazos**, **tarefas**, **notificações**
- [ ] Migrar **heranças/registos/migrações** como entidades próprias (não só mapeamento de processos)
- [ ] Sincronização bidirecional Firestore ↔ SQLite durante período de transição

### UI / UX

- [ ] Substituir formulários Firestore por formulários API em cada secção
- [ ] Remover dependência de `firebase-app-compat` quando 100% API
- [ ] Indicador visual de modo (API vs Firebase) no cabeçalho
- [ ] Paginação e filtros nas listas API (heranças/registos)

### Infraestrutura

- [ ] Endpoint de upload de documentos acessível a clientes (se necessário)
- [ ] Webhooks ou fila para notificações por email
- [ ] Backup automático SQLite em produção

### Testes

- [ ] Testes E2E Playwright para secções Heranças/Registos com JWT
- [ ] Testes de regressão Firebase (modo sem JWT)

---

## Como testar a Fase 1 localmente

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd .. && npx serve -p 8000
```

1. Abrir `http://localhost:8000/index.html`
2. Login como admin via API (redireciona para `admin.html`) ou manter JWT e abrir «Sistema completo»
3. Navegar para **Heranças** — deve aparecer painel «Processos da API» com `HER-2026-0001`
4. Sem backend/JWT — secções mostram apenas dados Firestore (ou vazias)

---

## Referências

- `api.js` — cliente HTTP e JWT
- `script.js` — `isApiJwtAtivo()`, `sincronizarClientesApi()`, `carregarPainelApiProcessosSecao()`
- `DEPLOY.md` — deploy frontend + backend
