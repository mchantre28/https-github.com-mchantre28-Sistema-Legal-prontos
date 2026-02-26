# Auditoria de Arquitetura — Sistema Legal (Firestore-first)

**Engenheiro Sénior | Análise Completa**

---

## 1. IDENTIFICAÇÃO COMPLETA DE PROBLEMAS

### 1.1 Listeners — Listeners Duplicados ao Reiniciar

**Onde:** `iniciarListenersFirestore()` (linhas 369–456)

**Problema:** A função não chama `listenerManager.pause()` antes de criar novos listeners. Se for invocada duas vezes (ex.: `forcarSincronizacaoNuvem` chama `listenerManager.pause()` e depois `iniciarListenersFirestore()`), os antigos são removidos. Porém, no fluxo normal de login, `init()` não chama `iniciarListenersFirestore` diretamente — quem inicia é o callback após `verificarLogin`. O `init()` chama `carregarDados()` e `migrarLocalStorageParaFirestore()`. Preciso verificar onde `iniciarListenersFirestore` é chamado na primeira vez.

**Fluxo:** `DOMContentLoaded` → `verificarLogin()` → se ok → `init()` → `migrarLocalStorageParaFirestore()` → `iniciarListenersFirestore()` é chamado em `forcarSincronizacaoNuvem` e no fluxo de migração. O problema: se o utilizador fizer login duas vezes sem reload (não aplicável — usa `location.reload` no login convidado), ou se `iniciarListenersFirestore` for chamado por engano sem `pause` primeiro, acumulam listeners.

**Impacto:** Listeners duplicados = múltiplas subscrições à mesma coleção = mais leituras Firestore e callbacks em duplicado.

**Como reproduzir:** Chamar `iniciarListenersFirestore()` duas vezes sem `listenerManager.pause()` entre elas. Verificar `listenerManager.activeListeners.length` — duplicará.

**Risco futuro:** Se removirem `location.reload()` no login ou em fluxos de re-autenticação, listeners podem acumular.

---

**Solução ideal:** Sempre chamar `listenerManager.pause()` no início de `iniciarListenersFirestore()` para garantir que listeners antigos são removidos antes de criar novos.

```javascript
function iniciarListenersFirestore() {
    if (!isCloudReady()) return;
    // CRÍTICO: remover listeners anteriores antes de criar novos
    if (typeof listenerManager !== 'undefined' && listenerManager.pause) {
        listenerManager.pause();
    }
    // ... resto do código
}
```

---

### 1.2 Listeners — Falta de Cleanup no Logout

**Onde:** `logout()` (linhas 2667–2675)

**Problema:** `logout()` não chama `listenerManager.pause()`. Apenas limpa sessionStorage e faz `location.reload()`. Como a página recarrega, os listeners são destruídos pelo garbage collector, mas durante o reload pode haver um breve momento em que os listeners ainda emitem callbacks e atualizam variáveis globais.

**Impacto:** Baixo, dado o `location.reload()`. Em arquitectura SPA seria um bug claro.

**Solução:** Chamar `listenerManager.pause()` antes do reload, por boas práticas e preparação para SPA.

```javascript
function logout() {
    if (typeof listenerManager !== 'undefined' && listenerManager.pause) listenerManager.pause();
    limparSessaoFirestore();
    appStorage.removeItem('usuarioLogado');
    appStorage.removeItem('usuarioNome');
    appStorage.removeItem('tipoUsuario');
    appStorage.removeItem('convidadoId');
    location.reload();
}
```

---

### 1.3 UX — Tremores/Re-renders por `agendarRefreshListener`

**Onde:** Cada callback de listener chama `agendarRefreshListener()` (debounce 80ms), que chama `carregarSecao(secaoAtiva)` e `atualizarInterface()`.

**Problema:** Se 18 listeners dispararem em sequência (ex.: após reconnect), há 18 agendamentos. O debounce limita a um `carregarSecao` final, mas `carregarSecao` substitui `conteudoDinamico.innerHTML` inteiro — pode provocar flash visual e perda de scroll/foco.

**Impacto:** Tremores visuais, especialmente em secções pesadas (clientes, notificações). Em rede instável, pode ser frequente.

**Solução:** Aumentar debounce para 150–200 ms ou usar `requestAnimationFrame` para coalescer updates. Alternativa: actualizar apenas os dados em memória e só re-renderizar a secção se os dados tiverem mudado (diff).

---

### 1.4 Race Condition — `agendarRefreshListener` vs Navegação Manual

**Onde:** `carregarSecao` chama `cancelarRefreshListener()` no início — correto.

**Problema:** Se o utilizador clicar numa secção e, 50 ms depois, um listener emitir e `agendarRefreshListener` correr 80 ms após o primeiro emit, o `carregarSecao` pode sobrescrever a secção que o utilizador acabou de escolher.

**Impacto:** Navegação inesperada; o utilizador vê a secção A, mas a UI salta para B.

**Solução:** `cancelarRefreshListener` já existe. Garantir que `agendarRefreshListener` verifica se `secaoAtiva` não mudou desde o último evento relevante. Alternativa: incluir `secaoAtiva` no closure e só executar se ainda for a secção activa (mais complexo).

---

### 1.5 Firestore — Writes Redundantes em `agendarSyncEntidade`

**Onde:** `agendarSyncEntidade` (linhas 1790–1819) faz `Promise.all` de writes individuais.

**Problema:** Para cada item em `lista`, chama `salvarEntidadeCloud`, que faz `set(..., { merge: true })`. Se o item não mudou desde a última sync, ainda assim é re-escrito. `prepararListaParaSync` compara com `normalizarParaComparacao` e apenas marca `updatedAt` se `mudou`. Mas `agendarSyncEntidade` sempre envia todos os itens da lista, não apenas os alterados.

**Impacto:** Writes desnecessários = custo e possíveis throttling em coleções grandes.

**Solução:** Calcular diff: apenas enviar itens cuja `normalizarParaComparacao(item) !== normalizarParaComparacao(prev)`. Requer acesso ao estado anterior; `prepararListaParaSync` já faz isso. O problema está em `salvarDados` → `agendarSyncEntidade(lista)` — envia a lista inteira. Solução: em `agendarSyncEntidade`, filtrar `lista` para incluir apenas itens que mudaram. O `prepararListaParaSync` é chamado em `salvarDados` e devolve a lista preparada — a otimização seria em `agendarSyncEntidade` comparar cada item com `obterListaGlobal` antes de adicionar à promise.

---

### 1.6 Firestore — Falta de Batch para Listas Grandes

**Onde:** `agendarSyncEntidade` usa `Promise.all` com N writes individuais.

**Problema:** Para listas > 100 itens, são N operações separadas. Firestore suporta até 500 ops por WriteBatch; para > 500 seria preciso múltiplos batches.

**Impacto:** Mais latência e possível throttling; custo por write.

**Solução:** Para `lista.length > 50`, usar `writeBatch()`. Exemplo:

```javascript
if (lista.length > 50) {
    const BATCH_SIZE = 500;
    for (let i = 0; i < lista.length; i += BATCH_SIZE) {
        const batch = firestoreDb.batch();
        lista.slice(i, i + BATCH_SIZE).forEach(item => {
            const id = obterIdEntidade(entidade, item);
            if (!id) return;
            const payload = prepararPayload(entidade, item);
            batch.set(firestoreDb.collection(entidade).doc(String(id)), payload, { merge: true });
        });
        await batch.commit();
    }
} else {
    await Promise.all(lista.map(item => salvarEntidadeCloud(entidade, item)));
}
```

---

### 1.7 Sincronização — `sincronizarEntidadeNuvem` + `salvarDados` com `skipCloudSync`

**Onde:** `sincronizarEntidadeNuvem` (linha 1875) chama `salvarDados(entidade, merged, { skipCloudSync: true })`.

**Problema:** `salvarDados` para `clientes` retorna imediatamente sem actualizar variáveis globais (`atualizarClientesEmMemoria`). Para outras entidades, actualiza as variáveis globais. O `merged` vem do Firestore (cloud). Ao chamar `salvarDados` com `skipCloudSync`, estamos a sobrescrever as variáveis globais com dados da nuvem. Mas para `clientes`, `salvarDados` chama `atualizarClientesEmMemoria(dados)` se `Array.isArray(dados)` — e retorna. O `sincronizarEntidadeNuvem` não inclui `clientes` em `CLOUD_ENTIDADES` (clientes são apenas Firestore). Portanto, o fluxo está correto para as entidades em CLOUD_ENTIDADES.

---

### 1.8 Cache/Offline — `enablePersistence` Deprecado

**Onde:** Linhas 274–278.

**Problema:** `firestoreDb.enablePersistence()` está deprecado na Firebase v9+. O aviso é silenciado em `console.warn`, mas a API pode ser removida no futuro.

**Impacto:** Persistência offline pode deixar de funcionar em versões futuras.

**Solução:** Migrar para o módulo modular (v10+), que usa `enableIndexedDbPersistence`. A migração requer refactor de imports. Alternativa: manter compat e acompanhar changelog da Firebase.

---

### 1.9 Segurança — Credenciais e Senha no Código

**Onde:** `firebaseConfig` (linha 216) e `SENHA_PADRAO = 'APM2024!'` (linha 65).

**Impacto:** Em repositório público, credenciais e senha ficam expostas.

**Solução:** Firestore Rules devem restringir acesso. Senha: forçar alteração no primeiro login; hash guardado no Firestore. Documentar claramente.

---

### 1.10 Convidado — `salvarDados('convidados', lista)` no Login

**Onde:** Linha 2651 — após login de convidado, faz `salvarDados('convidados', lista)` com lista parseada de `appStorage.getItem('convidados')` e o convidado actual.

**Problema:** `salvarDados` para `convidados` (CLOUD_ENTIDADES) irá: 1) actualizar variável global; 2) chamar `agendarSyncEntidade('convidados', lista)`. Isto envia o cache local (lista com um convidado) para o Firestore, podendo sobrescrever dados da nuvem se a lista local for incompleta.

**Impacto:** Dados da nuvem podem ser sobrescritos por cache local desatualizado.

**Solução:** No login de convidado, não chamar `salvarDados('convidados', ...)`. Apenas guardar o convidado em cache para uso offline. Os listeners de convidados já trarão os dados correctos da nuvem. Ou: usar um cache separado (ex.: `convidadoCache`) que não dispare sync.

---

### 1.11 `carregarDados` — Variáveis Globais sem Fallback

**Onde:** `carregarDados()` — apenas garante que variáveis são arrays vazios se undefined. Não carrega de localStorage/sessionStorage porque `usarLocalStorage = false`; dados vêm dos listeners.

**Problema:** Se os listeners ainda não tiverem emitido (ex.: conexão lenta), as variáveis ficam vazias. A UI mostra listas vazias até os listeners actualizarem. Este é o design Firestore-first — correto.

---

### 1.12 `obterServerTimestamp` — Uso de `Date` em vez de FieldValue

**Onde:** Diversas funções `preparar*ParaFirestore` e CRUD usam `obterServerTimestamp()`.

**Verificação:** `obterServerTimestamp` deve devolver `firebase.firestore.FieldValue.serverTimestamp()` para timestamp no servidor. Se devolver `new Date().toISOString()`, o timestamp é do cliente e pode causar dessincronia entre dispositivos.

---

### 1.13 `faturas` — Variável Global Inconsistente

**Onde:** `ouvirFaturas` faz `window.faturas = lista` (linha 440), mas outras entidades usam `faturas = lista; window.faturas = faturas`. Não existe variável global `let faturas = []` no top-level como para `clientes`, `honorarios`, etc.

**Impacto:** `obterFaturas()` verifica `window.faturas`; `salvarDados` não tem branch para `faturas` na actualização de variáveis globais. As faturas podem estar apenas em `window.faturas` e não numa variável `faturas`. Verificar se `faturas` é declarada noutro sítio.

---

## 2. CÓDIGO CORRIGIDO

### 2.1 `iniciarListenersFirestore` — Garantir Pause Antes de Criar

```javascript
function iniciarListenersFirestore() {
    if (!isCloudReady()) return;
    // Remover listeners anteriores (evita duplicação)
    if (typeof listenerManager !== 'undefined' && typeof listenerManager.pause === 'function') {
        listenerManager.pause();
    }
    // ... resto inalterado
}
```

### 2.2 `logout` — Pause dos Listeners

```javascript
function logout() {
    if (typeof listenerManager !== 'undefined' && typeof listenerManager.pause === 'function') {
        listenerManager.pause();
    }
    limparSessaoFirestore();
    appStorage.removeItem('usuarioLogado');
    appStorage.removeItem('usuarioNome');
    appStorage.removeItem('tipoUsuario');
    appStorage.removeItem('convidadoId');
    location.reload();
}
```

### 2.3 Login Convidado — Evitar Sync de Cache Incompleto

```javascript
// Em vez de salvarDados('convidados', lista), usar apenas cache local sem sync:
try {
    const cache = JSON.parse(appStorage.getItem('convidadoCache') || '[]');
    const idx = cache.findIndex(c => c.codigo === codigo);
    const atualizado = { ...convidado };
    if (idx >= 0) cache[idx] = atualizado;
    else cache.push(atualizado);
    appStorage.setItem('convidadoCache', JSON.stringify(cache));
} catch (e) { console.warn('Cache convidado:', e); }
// NÃO chamar salvarDados('convidados', ...) — os listeners trarão dados corretos
```

---

## 3. RECOMENDAÇÕES ESTRUTURAIS

1. **Modularização:** Separar `firestore.js`, `listeners.js`, `sync.js`, `auth.js`.
2. **Store central:** Um único objecto para estado (ex.: `store.clientes`, `store.honorarios`) em vez de variáveis globais soltas.
3. **Tipagem:** Introduzir JSDoc ou TypeScript para reduzir bugs de tipo.
4. **Testes:** Testes unitários para `preparar*ParaFirestore`, `ler*DoFirestore`, `salvarDados`, `agendarSyncEntidade`.
5. **Monitorização:** Logging de erros de sync e listeners para diagnóstico.

---

## 4. RESUMO DE PRIORIDADES

| Prioridade | Problema              | Esforço | Impacto    |
|------------|------------------------|---------|------------|
| Crítica    | Pause em iniciarListenersFirestore | Baixo  | Alto       |
| Alta       | Pause em logout       | Baixo   | Médio      |
| Alta       | Login convidado sync  | Médio   | Alto       |
| Média      | Batch para listas grandes | Médio | Performance |
| Média      | Debounce UX 150ms     | Baixo   | UX         |
| Baixa      | Modularização         | Alto    | Manutenção |
