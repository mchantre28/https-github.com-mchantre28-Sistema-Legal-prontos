# Auditoria de Engenharia Sénior — Sistema Legal

**Data:** Fevereiro 2025  
**Escopo:** `projetos/sistema-legal/` — Arquitetura Firestore, sync, UX, segurança, performance

---

## 1. Resumo Executivo

O Sistema Legal utiliza uma arquitetura **Firestore-first**: Firestore é a fonte principal, com sincronização bidirecional e listeners em tempo real. A base de código (~26k linhas em `script.js`) está funcionalmente consistente, mas há pontos críticos e melhorias recomendadas para segurança, performance e estabilidade da UX.

### Correções já implementadas nesta sessão
- **Duplicação de listeners:** `iniciarListenersFirestore` passa a chamar `listenerManager.pause()` antes de criar novos listeners, evitando duplicação quando `forcarSincronizacaoNuvem` ou outras rotinas chamam a função várias vezes.
- **Central de Notificações:** Event delegation para botões (`data-acao`), `pointer-events` em inputs/buttons de `#conteudoDinamico`, proteção contra cliques em ícones.
- **JSON.parse sem proteção:** Try/catch em migrações e funções que leem de storage (honorários, contratos, tarefas, prazos, notificações, documentos, faturas, convidados, processos).
- **Código duplicado:** Remoção do bloco duplicado em `sincronizarEntidadeNuvem` para `cloudSyncUltimaEntidade` / `cloudSyncUltimaEntidadeEm`.

---

## 2. Arquitetura Firestore e Listeners

### 2.1 Fluxo geral
1. **Init:** `carregarDados()` → `sincronizarTodasEntidadesNuvem()` → `iniciarListenersFirestore()`
2. **Listeners:** ~18 listeners Firestore (clientes, contratos, honorários, prazos, notificações, tarefas, documentos, convidados, entidades, integrações, representantes, faturas, pagamentos, despesas, processos/heranças/migrações/registos).
3. **Debounce:** `agendarRefreshListener()` (80 ms) evita re-renders excessivos quando múltiplos listeners disparam.

### 2.2 Gestor de listeners (`listenerManager`)
- `pause()`: remove subscriptions e limpa `activeListeners`.
- `resume(iniciarListenersFn)`: chama a função para recriar listeners.
- Usado em backup/import e em `forcarSincronizacaoNuvem` para evitar conflitos.

### 2.3 Possível race no init
**Problema:** `iniciarListenersFirestore()` é chamado imediatamente enquanto `sincronizarTodasEntidadesNuvem()` ainda corre. O `.then()` da sync chama `carregarSecao` quando termina; os listeners chamam `agendarRefreshListener`, que também chama `carregarSecao` em 80 ms. Resultado: possíveis 2 refreshes em poucos milissegundos.

**Impacto:** Baixo — pode causar um “tremor” visual mínimo na primeira carga.

**Recomendação:** Opcional — atrasar `iniciarListenersFirestore()` até ao primeiro `.then()` da sync, ou usar um flag para evitar `carregarSecao` duplicado no primeiro load.

---

## 3. Persistência e Sincronização

### 3.1 Armazenamento
- **Clientes:** Apenas memória + Firestore (via ouvirClientes). Não vão para `appStorage`.
- **Restantes entidades:** Firestore + variáveis globais. `appStorage` (localStorage) está desativado (`usarLocalStorage = false`).
- **Persistência offline:** IndexedDB via Firestore SDK (automática).

### 3.2 Sync (`sincronizarEntidadeNuvem` / `sincronizarTodasEntidadesNuvem`)
- Lê coleções Firestore, faz merge com dados locais, chama `salvarDados(entidade, merged, { skipCloudSync: true })`.
- `skipCloudSync: true` evita writes redundantes na nuvem durante sync.

### 3.3 Escrita na nuvem
- Writes individuais por documento ao criar/editar/apagar.
- Para listas grandes (ex.: importar centenas de registos), consideração futura: `WriteBatch` para operações em lote (limite 500 operações/batch).

---

## 4. Logout e Limpeza

### 4.1 Estado atual
Em `logout()` faz-se `location.reload()`, o que descarta todos os listeners. Não há leak de memória porque a página é recarregada.

### 4.2 Recomendação defensiva
Se no futuro `logout()` deixar de fazer reload (ex.: SPA com navegação sem refresh), deve chamar `listenerManager.pause()` antes de limpar sessão:

```javascript
function logout() {
  if (typeof listenerManager !== 'undefined' && listenerManager.pause) listenerManager.pause();
  // ... resto da limpeza
}
```

---

## 5. Segurança e Regras Firestore

- **Auth:** UID do Firebase Auth identifica o utilizador. Regras devem filtrar por `request.auth.uid`.
- **Regras:** Confirmar que todas as coleções usadas pelo app estão protegidas com condições baseadas em UID e que não há leituras/escritas públicas indevidas.
- **Dados sensíveis:** Evitar guardar tokens ou chaves em `localStorage` ou variáveis globais expostas.

---

## 6. Performance

### 6.1 Debounce e re-renders
- `CLOUD_DEBOUNCE_MS = 100` para writes na nuvem.
- `agendarRefreshListener` com 80 ms reduz re-renders quando vários listeners disparam seguidos.

### 6.2 Indexes
- Verificar `firestore.indexes.json` para queries compostas usadas nas coleções do sistema.

### 6.3 Payload local (tarefas)
- `reduzirPayloadLocal` remove `anexos` de tarefas ao guardar localmente, reduzindo tamanho do payload.

---

## 7. Prevenção de Bugs

### 7.1 JSON.parse
- Try/catch aplicado em migrações e em `obterFaturas`, `obterIntegracoes`, e outras leituras de storage para evitar crashes com dados corrompidos.

### 7.2 Navegação explícita
- `cancelarRefreshListener()` é chamado quando o utilizador navega manualmente, evitando que um refresh agendado sobrescreva a secção escolhida.

---

## 8. UX — Central de Notificações

- Botões com `data-acao` e event delegation em `document` garantem que cliques funcionem mesmo quando o DOM é substituído.
- CSS: `pointer-events: auto !important` em inputs/buttons de `#conteudoDinamico`, `pointer-events: none` em ícones dentro de botões, `user-select: text` em inputs.

---

## 9. Recomendações Finais

| Prioridade | Item | Ação |
|------------|------|------|
| Alta | Duplicação de listeners | ✅ Corrigido — `pause()` no início de `iniciarListenersFirestore` |
| Média | Logout sem reload | Adicionar `listenerManager.pause()` em `logout()` |
| Média | Race init/sync | Considerar atrasar listeners até sync inicial concluir |
| Baixa | Writes em lote | Avaliar `WriteBatch` para imports grandes |
| Baixa | Modularização | Avaliar split de `script.js` em módulos (clientes, contratos, etc.) |

---

## 10. Ficheiros Relevantes

- `script.js` — lógica principal, listeners, sync, CRUD
- `index.html` — HTML e referências a scripts
- `styles.css` — estilos, incluindo regras para Central de Notificações
- `firebase.js` — configuração Firebase
- `firestore.indexes.json` — índices Firestore
