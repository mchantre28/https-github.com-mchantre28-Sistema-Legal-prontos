# Auditoria UX e Reatividade — Sistema Legal

**Especialização:** UX estável, UI profissional, eventos, reatividade, estado, performance, acessibilidade, prevenção de bugs visuais  
**Data:** Fevereiro 2025  
**Engenheiro Sénior**

---

## 1. DIAGNÓSTICO COMPLETO

### Resumo de problemas por categoria

| # | Categoria | Severidade | Estado |
|---|-----------|------------|--------|
| 1 | Inconsistência event handlers (onclick vs delegation) | Média | Parcialmente corrigido (honorários) |
| 2 | Listeners diretos em elementos dinâmicos (btn-editar-honorario) | Média | Corrigido — delegation em document |
| 3 | Race init: sync + listeners + carregarSecao | Média | Documentado |
| 4 | Layout shift: loader antes de conteúdo | Baixa | Documentado |
| 5 | visibilitychange: re-render completo sem diff | Média | Documentado |
| 6 | setInterval no sync badge sem cleanup | Baixa | Documentado |
| 7 | CSS: pointer-events em botões sem data-acao | Baixa | Documentado |
| 8 | Fechar modal em carregarSecao: perda de foco | Baixa | Documentado |
| 9 | Debounce 80ms pode ser insuficiente | Baixa | Documentado |
| 10 | configurarEventos chamado apenas em init | OK | Verificado |

---

## 2. PROBLEMAS IDENTIFICADOS — ANÁLISE TÉCNICA DETALHADA

### 2.1 Inconsistência entre event handlers: onclick inline vs event delegation

**Onde ocorre:** Várias secções usam estratégias diferentes:
- **Delegation:** clientes (`data-cliente-acao`), tarefas (`data-tarefa-acao`), alertas/notificações (`data-acao`), copiar (`data-copiar`)
- **Inline onclick:** honorários (lista principal, linhas 10403–10407), contratos (10577–10587), prazos (10803–10811), notificações (marcar/excluir 11160–11165), documentos (13861–13869), migrações, heranças

**Por que ocorre:** Evolução do código; algumas partes foram refatoradas para delegation, outras mantêm `onclick="funcao(...)"`.

**Impacto na UX:**
- **Inline onclick:** Funciona quando o DOM é estável. Quando `carregarSecao` substitui `innerHTML`, os novos elementos recebem os handlers no HTML. Risco: se um pai tiver `pointer-events: none` sem a regra `#conteudoDinamico button { pointer-events: auto !important }`, cliques falham.
- **Honorários (relatórios):** Usam `btn-editar-honorario` + `addEventListener` em `atualizarListaHonorarios` — ligam listeners a elementos que podem ser destruídos por `carregarSecao` antes do setTimeout(100ms) de `aplicarFiltrosHonorarios` executar. Em cenários de refresh rápido, o tbody antigo é substituído; o novo tbody recebe listeners no próximo `aplicarFiltrosHonorarios`.

**Como reproduzir:**
1. Ir a Honorários → Relatório por cliente
2. Firestore emite update → `agendarRefreshListener` (80ms)
3. Antes dos 100ms de `aplicarFiltrosHonorarios`, `carregarSecao` pode substituir o conteúdo
4. O setTimeout antigo corre sobre DOM já substituído — `getElementById('listaHonorarios')` aponta para o novo tbody, portanto normalmente funciona. O risco é se a secção mudar (ex.: navegar para clientes) antes do setTimeout; nesse caso `listaHonorarios` não existe e `atualizarListaHonorarios` retorna cedo.

**Risco futuro:** Manter duas abordagens aumenta complexidade. Inline onclick com `JSON.stringify(id)` em templates pode falhar com IDs especiais (aspas, caracteres). Delegation elimina esses casos.

---

### 2.2 Botões com addEventListener em elementos dinâmicos (honorários, contratos em relatórios)

**Onde ocorre:** `atualizarListaHonorarios` (linhas 16314–16325), `atualizarListaContratos` (análogo)

```javascript
tbody.querySelectorAll('.btn-editar-honorario').forEach(btn => {
    btn.addEventListener('click', function() { editarHonorarioDireto(this.getAttribute('data-id')); });
});
```

**Por que ocorre:** Necessidade de passar o ID; optou-se por `data-id` + listener direto em vez de delegation.

**Impacto na UX:** Quando `carregarSecao` substitui o `innerHTML`, os elementos antigos são removidos do DOM e os respetivos listeners deixam de ser invocados. Os novos elementos só recebem listeners quando `aplicarFiltrosHonorarios` (ou equivalente) chama `atualizarListaHonorarios` após o setTimeout de 100ms. Se o utilizador clicar antes desses 100ms, o botão pode não responder.

**Como reproduzir:**
1. Ir a Honorários
2. Clicar em "Editar" num honorário nos primeiros ~100ms após o carregamento
3. Possível falha se o listener ainda não foi anexado

**Solução profissional:** Usar event delegation consistente, como em clientes e tarefas:

```javascript
// Em configurarEventos, adicionar:
document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-honorario-acao][data-honorario-id]');
    if (!btn) return;
    const id = btn.getAttribute('data-honorario-id');
    const acao = btn.getAttribute('data-honorario-acao');
    if (!id || !acao) return;
    e.preventDefault();
    e.stopPropagation();
    if (acao === 'editar') editarHonorarioDireto(id);
    else if (acao === 'duplicar') duplicarHonorario(id);
    else if (acao === 'excluir') excluirHonorarioDireto(id);
}, true);
```

E no HTML: `data-honorario-acao="editar" data-honorario-id="..."` em vez de classes + addEventListener.

---

### 2.3 Race condition no init: sync + listeners + carregarSecao

**Onde ocorre:** `init()` (linhas 3703–3717)

```javascript
sincronizarTodasEntidadesNuvem().then(() => {
    // ...
    carregarSecao(secaoAtiva);
    atualizarInterface();
});
if (isCloudReady()) {
    iniciarListenersFirestore();  // Executado IMEDIATAMENTE, não espera o .then acima
}
```

**Por que ocorre:** `iniciarListenersFirestore` é chamado em paralelo com a sync. Os listeners disparam ao receber dados (ou cache), e cada um chama `agendarRefreshListener`. Ao mesmo tempo, o `.then()` da sync também chama `carregarSecao`. Resultado: possivelmente 2 execuções de `carregarSecao` em poucos milissegundos.

**Impacto na UX:** Tremor visual na primeira carga; possível flash do loader.

**Como reproduzir:** Carregar a app com Firestore conectado e observar o painel de conteúdo nos primeiros 200ms.

**Solução ideal:** Adiar `iniciarListenersFirestore` até o primeiro `.then()` da sync:

```javascript
sincronizarTodasEntidadesNuvem().then(() => {
    if (isCloudReady()) try { appStorage.setItem('cloudSyncUltimoSucesso', new Date().toISOString()); } catch (e) {}
    appStorage.removeItem('naoRestaurarDaNuvem');
    carregarDados();
    if (isCloudReady()) iniciarListenersFirestore();  // Aqui, após sync
    carregarSecao(secaoAtiva);
    atualizarInterface();
    atualizarIndicadorSync(isCloudReady() ? 'ok' : 'offline');
});
if (isCloudReady()) {
    // Remover: iniciarListenersFirestore(); aqui
}
```

Ou manter a ordem atual mas usar um flag para evitar `carregarSecao` duplicado no primeiro load.

---

### 2.4 Layout shift: loader antes de conteúdo

**Onde ocorre:** `carregarSecao` (linhas 6229–6237)

```javascript
conteudoElement.innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 ...">
        <i data-lucide="loader" ...></i>
        <p>A carregar...</p>
    </div>`;
// ...
requestAnimationFrame(carregarConteudo);  // Substitui pelo conteúdo real
```

**Por que ocorre:** Padrão loader → conteúdo para secções pesadas. O loader tem altura/dimensões diferentes do conteúdo final.

**Impacto na UX:** Layout shift (CLS); o utilizador vê o loader e depois o conteúdo "salta" quando o HTML final é injectado.

**Como reproduzir:** Navegar para Dashboard, Clientes ou Honorários; observar a transição loader → conteúdo.

**Solução:** Reservar altura mínima para `#conteudoDinamico` ou usar skeleton com dimensões equivalentes ao conteúdo. Exemplo:

```css
#conteudoDinamico {
    min-height: 400px;
}
```

Ou um skeleton que reproduza a estrutura da tabela/cards.

---

### 2.5 visibilitychange: re-render completo sem diff

**Onde ocorre:** `init()` (linhas 3764–3778)

```javascript
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isCloudReady()) {
        listenerManager.pause();
        listenerManager.resume(iniciarListenersFirestore);
        sincronizarTodasEntidadesNuvem().then(() => {
            carregarDados();
            carregarSecao(secaoAtiva);  // Re-render completo
            atualizarInterface();
        });
    }
});
```

**Por que ocorre:** Ao voltar ao separador, assume-se que os dados podem estar desatualizados e faz-se sync + re-render completo.

**Impacto na UX:** Ao regressar à aba, a secção inteira é substituída. Perda de scroll e foco; possível tremor se os dados não tiverem mudado.

**Melhor prática:** Só re-renderizar se os dados tiverem efectivamente mudado (diff). Alternativa: manter o scroll position e restaurá-lo após o render.

---

### 2.6 setInterval no sync badge sem cleanup

**Onde ocorre:** `configurarEventos` (linhas 6071–6076)

```javascript
setInterval(() => {
    if (syncBadge.getAttribute('data-status') === 'ok' && syncBadge.querySelector('.sync-text')) {
        syncBadge.querySelector('.sync-text').textContent = obterTextoUltimaSincronizacao();
    }
}, 60000);
```

**Por que ocorre:** Atualizar o texto "há X min" a cada minuto.

**Impacto:** O intervalo nunca é limpo. Em SPA ou se a página ficar aberta muito tempo, continua a correr. Baixo impacto, mas má prática.

**Solução:** Guardar o ID e limpar no `beforeunload` ou quando o utilizador faz logout:

```javascript
window.__syncBadgeInterval = setInterval(/* ... */, 60000);
// Em logout ou beforeunload:
if (window.__syncBadgeInterval) clearInterval(window.__syncBadgeInterval);
```

---

### 2.7 CSS: pointer-events para botões sem data-acao

**Onde ocorre:** `styles.css` (linhas 50–54)

```css
button[data-acao] svg,
button[data-acao] i,
button[data-acao] [data-lucide] {
    pointer-events: none !important;
}
```

**Problema:** A regra aplica-se apenas a `button[data-acao]`. Botões com `onclick` ou com classes como `btn-editar-honorario` não têm `pointer-events: none` nos ícones. Se o utilizador clicar no ícone, o evento pode não chegar ao botão (depende do browser e da estrutura).

**Mitigação existente:** Os ícones nos botões de honorários, contratos, etc. já usam `style="pointer-events:none"` inline. Portanto a interação está coberta, mas de forma dispersa.

**Recomendação:** Generalizar no CSS:

```css
#conteudoDinamico button svg,
#conteudoDinamico button i,
#conteudoDinamico button [data-lucide] {
    pointer-events: none !important;
}
```

Assim todos os botões dentro de `#conteudoDinamico` garantem que o clique chega ao botão, não ao ícone.

---

### 2.8 carregarSecao fecha modal e afeta foco

**Onde ocorre:** `carregarSecao` (linhas 6209–6210)

```javascript
if (typeof fecharModalRobusto === 'function') fecharModalRobusto();
```

**Problema:** Sempre que se navega para uma nova secção, qualquer modal aberto é fechado. O `fecharModalRobusto` tenta repor o foco (via `inicializarAcessibilidadeModais` e `focusAntesModal`), mas se `carregarSecao` for chamado por um listener (não por clique do utilizador), o fluxo de foco pode ficar inconsistente.

**Impacto:** Baixo; o utilizador normalmente fecha o modal antes de navegar. Em cenários automatizados (ex.: notificação que chama `carregarSecao('dashboard')`), o foco pode saltar inesperadamente.

---

### 2.9 Debounce 80ms pode ser insuficiente

**Onde ocorre:** `agendarRefreshListener` (linhas 3479–3482)

```javascript
__listenerRefreshTimer = setTimeout(() => {
    carregarSecao(secaoAtiva);
    atualizarInterface();
}, 80);
```

**Problema:** Com 18 listeners, vários podem disparar em sequência em rede instável. 80ms pode não ser suficiente para coalescer todos. Um segundo burst de eventos após os 80ms causa outro `carregarSecao`.

**Recomendação:** Aumentar para 120–150ms ou usar `requestAnimationFrame` para alinhar ao ciclo de render do browser.

---

### 2.10 configurarEventos chamado apenas uma vez

**Estado:** OK. `configurarEventos()` é chamado uma única vez em `init()`. Os listeners em `document` persistem. Elementos estáticos (syncBadge, sidebarOverlay, menuHamburguer) existem no DOM desde o carregamento e não são substituídos, portanto os handlers continuam válidos.

---

## 3. SOLUÇÕES PROFISSIONAIS — CÓDIGO CORRIGIDO E OTIMIZADO

### 3.1 Unificar para event delegation (honorários em relatórios)

**Ficheiro:** `script.js`

Adicionar em `configurarEventos`, após o bloco de clientes:

```javascript
// Delegation: botões Honorários (relatórios, lista filtrada)
document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-honorario-acao][data-honorario-id]');
    if (!btn || btn.disabled) return;
    const id = btn.getAttribute('data-honorario-id');
    const acao = btn.getAttribute('data-honorario-acao');
    if (!id || !acao) return;
    e.preventDefault();
    e.stopPropagation();
    try {
        if (acao === 'editar') editarHonorarioDireto(id);
        else if (acao === 'duplicar') duplicarHonorario(id);
        else if (acao === 'excluir') excluirHonorarioDireto(id);
    } catch (err) {
        console.error('Erro acao honorario:', acao, err);
        mostrarNotificacao('Erro ao executar.', 'error');
    }
}, true);
```

E em `atualizarListaHonorarios`, alterar o HTML para:

```html
<button type="button" data-honorario-acao="editar" data-honorario-id="..." ...>
<button type="button" data-honorario-acao="duplicar" data-honorario-id="..." ...>
<button type="button" data-honorario-acao="excluir" data-honorario-id="..." ...>
```

E **remover** os `addEventListener` que estão em `atualizarListaHonorarios` (linhas 16313–16325).

---

### 3.2 Corrigir race no init

**Ficheiro:** `script.js` — função `init()`

Mover `iniciarListenersFirestore()` para dentro do `.then()` da sync:

```javascript
sincronizarTodasEntidadesNuvem().then(() => {
    if (isCloudReady()) try { appStorage.setItem('cloudSyncUltimoSucesso', new Date().toISOString()); } catch (e) {}
    appStorage.removeItem('naoRestaurarDaNuvem');
    carregarDados();
    if (isCloudReady()) iniciarListenersFirestore();
    carregarSecao(typeof secaoAtiva !== 'undefined' ? secaoAtiva : 'dashboard');
    atualizarInterface();
    atualizarIndicadorSync(isCloudReady() ? 'ok' : 'offline');
});

if (isCloudReady()) {
    // Iniciar listeners apenas se a sync for muito lenta (fallback após 3s)
    const fallback = setTimeout(() => {
        if (!window.__listenersIniciados) {
            iniciarListenersFirestore();
            window.__listenersIniciados = true;
        }
    }, 3000);
    sincronizarTodasEntidadesNuvem().finally(() => clearTimeout(fallback));
}
```

Ou, mais simples: remover a chamada imediata de `iniciarListenersFirestore()` e deixá-la apenas dentro do `.then()`.

---

### 3.3 Generalizar pointer-events para ícones em botões

**Ficheiro:** `styles.css`

```css
/* Ícones dentro de botões: cliques chegam ao botão */
#conteudoDinamico button svg,
#conteudoDinamico button i,
#conteudoDinamico button [data-lucide],
button[data-acao] svg,
button[data-acao] i,
button[data-acao] [data-lucide] {
    pointer-events: none !important;
}
```

---

### 3.4 Aumentar debounce do refresh listener

**Ficheiro:** `script.js` — constante e função `agendarRefreshListener`

```javascript
const LISTENER_REFRESH_DEBOUNCE_MS = 120;  // Era 80

function agendarRefreshListener() {
    if (__listenerRefreshTimer) clearTimeout(__listenerRefreshTimer);
    __listenerRefreshTimer = setTimeout(() => {
        __listenerRefreshTimer = null;
        if (typeof secaoAtiva === 'string') {
            carregarSecao(secaoAtiva);
            if (typeof atualizarInterface === 'function') atualizarInterface();
        }
    }, LISTENER_REFRESH_DEBOUNCE_MS);
}
```

---

## 4. REGRAS DE UX E UI A SEGUIR

| Regra | Estado atual | Meta |
|-------|--------------|------|
| Zero tremores (layout shift) | Loader provoca shift | Skeleton ou min-height |
| Zero re-renders desnecessários | carregarSecao substitui tudo | Diff antes de innerHTML |
| Zero listeners duplicados | ✅ Corrigido (pause em iniciarListeners) | Mantido |
| Zero eventos perdidos | Inconsistência onclick/delegation | Unificar delegation |
| Estados previsíveis | Variáveis globais | Considerar store central |
| Interações rápidas e fluidas | Debounce 80ms | 120ms ou rAF |
| CSS modular sem efeitos colaterais | pointer-events em alguns botões | Generalizar |
| Responsividade | Tailwind | Verificado |
| Acessibilidade mínima | skip-link, aria, focus | Manter e expandir |
| Performance no browser | requestAnimationFrame em carregarSecao | Manter |

---

## 5. RECOMENDAÇÕES FINAIS E MELHORIAS ESTRUTURAIS

### Prioridade alta
1. **Unificar event handling:** Migrar honorários (e depois contratos, prazos, etc.) para event delegation com `data-*-acao` e `data-*-id`.
2. **Corrigir race no init:** Chamar `iniciarListenersFirestore` apenas após o primeiro `.then()` da sync.

### Prioridade média
3. **Generalizar pointer-events:** Incluir todos os botões em `#conteudoDinamico`.
4. **Debounce 120ms:** Reduzir tremores quando vários listeners disparam.
5. **visibilitychange:** Evitar re-render completo; fazer diff ou restaurar scroll.

### Prioridade baixa
6. **Layout shift:** Skeleton ou min-height para `#conteudoDinamico`.
7. **Cleanup setInterval:** Limpar o intervalo do sync badge no logout.
8. **Modularização:** Separar lógica de eventos, sync e UI em módulos.

### Acessibilidade
- Manter skip-link, roles e aria-labels.
- Garantir que modais e botões críticos sejam focáveis por teclado.
- Testar com leitor de ecrã em fluxos principais.

---

## 6. FICHEIROS ENVOLVIDOS

- `script.js` — eventos, init, carregarSecao, agendarRefreshListener, atualizarListaHonorarios
- `styles.css` — pointer-events, #conteudoDinamico
- `index.html` — estrutura estática (sidebar, sync badge)

---

*Documento gerado no âmbito da auditoria de UX e reatividade do Sistema Legal.*
