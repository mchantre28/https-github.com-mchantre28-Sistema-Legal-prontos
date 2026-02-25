# Auditoria Total: Tremores, Instabilidade Visual e Bugs de Interação

**Sistema Legal** — Análise de Engenharia Sénior em UX estável, UI profissional, CSS modular, eventos do browser, estado, performance e prevenção de layout shift.

---

## 1. DIAGNÓSTICO COMPLETO — CAUSAS DE TREMOR E INSTABILIDADE

### 1.1 MODAIS — Tremores ao Abrir/Fechar

#### Problema A: Transição `opacity` + `visibility` sem `will-change`

**Onde:** `styles.css` linhas 410-426

```css
.modal {
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}
.modal.show {
    opacity: 1;
    visibility: visible;
}
.modal-content {
    transform: scale(0.9);
    transition: transform 0.3s ease;
}
.modal.show .modal-content {
    transform: scale(1);
}
```

**Por que ocorre:** A transição de `opacity` e `visibility` em simultâneo causa repaint/reflow. O `transform: scale()` no `.modal-content` provoca layout recalculado. Sem `will-change` ou `contain`, o browser faz trabalho extra.

**Impacto na UX:** Tremor visível ao abrir; possível *flash* de conteúdo a 90% antes de 100%.

**Como reproduzir:** Abrir modal de cliente, honorário ou documento várias vezes seguidas. Observar o "salto" inicial.

**Risco futuro:** Em dispositivos lentos ou com muitos modais abertos em sequência, a experiência degrada.

---

#### Problema B: Modais criados com estilos inline sobrescrevem transição

**Onde:** `script.js` ~6842, 7225, 7634, 8073, 8553 — modais de seleção de cliente e relatórios

```javascript
modal.style.cssText = `
    position: fixed !important;
    ...
    display: flex !important;
`;
// Depois:
modalTeste.style.display = 'flex';
modalTeste.style.visibility = 'visible';
modalTeste.style.opacity = '1';
```

**Por que ocorre:** O modal é criado e imediatamente forçado a visível com `display/visibility/opacity` inline. A transição CSS é ignorada — o modal aparece *instantaneamente*, sem animação suave. Em alguns fluxos, o conteúdo ainda não está pintado, causando um *flash*.

**Impacto na UX:** Aparência abrupta; possível tremor se o conteúdo (ex.: lista de clientes) carregar após o modal já estar visível.

**Como reproduzir:** Abrir "Gerar Relatório Completo" ou "Relatório por Cliente" e observar o modal a surgir de forma brusca.

**Risco futuro:** Inconsistência entre modais que usam `.modal.show` (suaves) e os que usam inline (bruscos).

---

#### Problema C: `modalContainer` vazio + `innerHTML` = Layout shift

**Onde:** `script.js` 2920-2922, 12163-12164

```javascript
modalContainer.innerHTML = '';
modalContainer.appendChild(modal);
modalContainer.classList.add('show');
```

**Por que ocorre:** O `modalContainer` no HTML está vazio. Ao injetar conteúdo e adicionar `show` na mesma frame, o layout muda de "nada" para "modal completo". O browser pinta primeiro o container vazio e depois o conteúdo, causando um *jump*.

**Impacto na UX:** Tremor na área do modal, especialmente em monitores grandes.

**Como reproduzir:** Abrir modal de confirmação de apagar ou modal de documento.

**Risco futuro:** Se o conteúdo do modal for grande (ex.: formulário longo), o shift é mais notório.

---

#### Problema D: `fecharModalRobusto` percorre todo o DOM

**Onde:** `script.js` 4217-4254

```javascript
document.querySelectorAll('div').forEach(div => { ... });
document.querySelectorAll('*').forEach(el => { ... });
```

**Por que ocorre:** Dois `querySelectorAll('*')` e um em `div` — percorre milhares de nós. `getComputedStyle` em cada um é custoso.

**Impacto na UX:** Ao fechar modal, pode haver um atraso de 50–200 ms antes de o overlay desaparecer. Em mobile, mais perceptível.

**Como reproduzir:** Abrir e fechar vários modais rapidamente. Sentir possível lag ao fechar.

**Risco futuro:** Com DOM mais complexo, o custo aumenta linearmente.

---

### 1.2 HOVER — Tremores ao Passar o Rato

#### Problema E: `transform` no hover sem `transform-origin` consistente

**Onde:** `styles.css` 346-349, 381-384

```css
.card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}
.sidebar-item:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
}
.btn-primary:hover {
    transform: translateY(-1px);
}
```

**Por que ocorre:** `transition: all 0.2s/0.3s ease` aplica-se a `all`. Qualquer mudança (incluindo `box-shadow`) é animada. Em `transform`, o browser recalcula layers. Sem `transform-origin` explícito, o ponto de referência pode variar.

**Impacto na UX:** Cards e botões "saltam" ligeiramente ao passar o rato; em grids densos, os vizinhos podem reorganizar-se (layout shift).

**Como reproduzir:** Passar o rato rapidamente sobre vários cards no dashboard ou itens da sidebar.

**Risco futuro:** Em listas longas com virtualização ou scroll, o comportamento pode piorar.

---

#### Problema F: `.sidebar-item` com `transform: translateX(4px)` altera fluxo

**Onde:** `styles.css` 315-318

**Por que ocorre:** O item desloca-se 4px para a direita no hover. Se os itens estiverem em `flex` sem espaço extra, o item "empurra" os vizinhos ou provoca overflow.

**Impacto na UX:** Tremor na sidebar ao passar o rato; possível barra de scroll horizontal momentânea.

**Como reproduzir:** Hover nos itens da sidebar em mobile ou ecrã estreito.

---

### 1.3 LAYOUT SHIFT

#### Problema G: `#conteudoDinamico` — Substituição total de `innerHTML`

**Onde:** `script.js` carregarSecao ~6386, toda a lógica de secções

```javascript
conteudoElement.innerHTML = `...loader...`;
// depois
conteudoElement.innerHTML = htmlCompletoDaSecao;
```

**Por que ocorre:** A altura passa de loader (~200px) para conteúdo real (pode ser 1000px+). O `min-height: 420px` reduz o shift, mas não elimina. O scroll também salta.

**Impacto na UX:** A página "salta" ao mudar de secção; botões sob o rato podem mudar de posição e receber clique errado.

**Como reproduzir:** Navegar rapidamente Dashboard → Clientes → Honorários. Observar o salto da área de conteúdo.

**Risco futuro:** Com mais secções pesadas, o problema amplifica-se.

---

#### Problema H: Loader com `animate-spin` e altura variável

**Onde:** `script.js` 6387-6393

```javascript
conteudoElement.innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 ...">
        <i data-lucide="loader" class="w-12 h-12 animate-spin ..."></i>
        ...
    </div>`;
```

**Por que ocorre:** O loader tem `py-16` (padding vertical) e ícone. Se o Lucide ainda não tiver renderizado o ícone, a altura pode mudar quando o SVG aparecer. `animate-spin` adiciona repaints contínuos.

**Impacto na UX:** Pequeno tremor durante o carregamento; possível flash quando o ícone surge.

**Como reproduzir:** Forçar rede lenta (DevTools → Network → Slow 3G) e navegar entre secções.

---

#### Problema I: Notificações toast com `transform: translateX`

**Onde:** `styles.css` 430-442

```css
.notification {
    transform: translateX(100%);
    transition: transform 0.3s ease;
}
.notification.show {
    transform: translateX(0);
}
```

**Por que ocorre:** A notificação entra da direita. O container `#notificationsContainer` tem `width: max-content; min-width: 0`. Quando uma nova notificação entra, o container cresce e pode provocar layout shift no canto superior direito. Além disso, `pointer-events: none` no container está correto, mas as notificações individuais têm `pointer-events: auto` nos filhos — e a classe `.notification` tem `pointer-events: none !important`, o que está bem.

**Impacto na UX:** Ao aparecer uma notificação, o header pode "empurrar" ligeiramente; múltiplas notificações empilham e alteram a altura do container.

**Como reproduzir:** Disparar várias notificações em sequência (ex.: guardar, depois duplicar, depois apagar).

---

### 1.4 RE-RENDERS DESNECESSÁRIOS

#### Problema J: `agendarRefreshListener` com debounce de 150 ms

**Onde:** `script.js` 350-364

```javascript
const LISTENER_REFRESH_DEBOUNCE_MS = 150;
function agendarRefreshListener() {
    if (__listenerRefreshTimer) clearTimeout(__listenerRefreshTimer);
    __listenerRefreshTimer = setTimeout(() => {
        carregarSecao(secaoAtiva);  // Re-render completo
        atualizarInterface();       // lucide.createIcons() em todo o documento
    }, 150);
}
```

**Por que ocorre:** Cada evento Firestore (ex.: 5 listeners disparam em 50 ms) agenda um refresh. O debounce coalesce, mas quando corre, chama `carregarSecao` e `atualizarInterface`. O `atualizarInterface` invoca `lucide.createIcons()` em todo o DOM — custoso.

**Impacto na UX:** Ao editar em dois separadores ou receber atualizações em tempo real, a secção "pisca" ao re-renderizar; perda de scroll e foco (já mitigada para inputs).

**Como reproduzir:** Abrir dois separadores, editar um cliente num e observar o outro a atualizar.

**Risco futuro:** Com mais listeners (ex.: documentos, integrações), o problema aumenta.

---

#### Problema K: `visibilitychange` re-sincroniza e possivelmente re-renderiza sem diff robusto

**Onde:** `script.js` 3817-3836

```javascript
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isCloudReady()) {
        // ...
        sincronizarTodasEntidadesNuvem().then(() => {
            const hashDepois = obterHashDadosSecao(secaoAtiva);
            if (hashDepois !== __visibilityHashAntes) {
                carregarSecao(secaoAtiva);  // Re-render
            }
        });
    }
});
```

**Por que ocorre:** O diff por hash reduz re-renders quando os dados não mudaram. No entanto, `obterHashDadosSecao` depende de listas em memória. Se a sincronização alterar referências de array sem mudar o conteúdo (ex.: novo array com mesmos objetos), o hash pode mudar e provocar re-render desnecessário.

**Impacto na UX:** Ao voltar ao separador, a secção pode re-renderizar mesmo sem alteração real — tremor e perda de scroll.

**Como reproduzir:** Ir para Clientes, fazer scroll para o meio, mudar de separador e voltar. Verificar se a lista "pisca".

---

### 1.5 CSS — EFEITOS COLATERAIS

#### Problema L: `transition: all` em múltiplos elementos

**Onde:** `styles.css` 190, 273, 323, 342, 369

```css
.sidebar { transition: all 0.3s ease; }
.sidebar-item { transition: all 0.2s ease; }
.main-content { transition: margin-left 0.3s ease; }
.card { transition: all 0.3s ease; }
.btn { transition: all 0.2s ease; }
```

**Por que ocorre:** `transition: all` anima *todas* as propriedades que mudam. Inclui propriedades que raramente queremos animar (ex.: `font-size`, `color` em certos casos), aumentando o trabalho do browser e o risco de animações inesperadas.

**Impacto na UX:** Resposta ligeiramente mais lenta; possíveis "glitches" se uma propriedade inesperada mudar.

**Como reproduzir:** Alternar temas (se implementado) ou modos; observar transições em elementos não intencionados.

---

#### Problema M: Sidebar mobile — conflito de `width` entre media queries

**Onde:** `styles.css` 228-251, 283-287, 355-368

```css
@media (max-width: 1024px) {
    .sidebar {
        width: min(85vw, 320px);
        transform: translateX(-100%);
    }
}
@media (max-width: 768px) {
    .sidebar {
        width: 180px;  /* Sobrescreve 85vw */
    }
}
@media (max-width: 480px) {
    .sidebar {
        width: 160px;
    }
}
```

**Por que ocorre:** Três breakpoints definem `width` diferente. Entre 768px e 480px, a sidebar passa de 180px para 160px. Ao redimensionar a janela, há um salto no momento da mudança de breakpoint.

**Impacto na UX:** Layout shift ao redimensionar; possível tremor ao abrir/fechar a sidebar em certas larguras.

**Como reproduzir:** Redimensionar a janela entre 500px e 800px com a sidebar aberta.

---

### 1.6 EVENTOS E LISTENERS

#### Problema N: `configurarEventos` pode ser chamado mais de uma vez

**Onde:** `script.js` 3839 — `configurarEventos()` em `init()`. Não há guarda explícita contra chamadas repetidas.

**Por que ocorre:** Se `init()` for chamado duas vezes (ex.: por erro ou fluxo de re-inicialização), os listeners em `document.addEventListener('click', ..., true)` são adicionados de novo. Cada clique dispara o handler duas vezes.

**Impacto na UX:** Dupla execução (ex.: abrir modal duas vezes, excluir dois registos em vez de um).

**Como reproduzir:** Verificar `window.__sistemaLegalEventosConfigurados` antes e após refresh. Se `init` for chamado duas vezes, os listeners duplicam.

**Risco futuro:** Se surgir um fluxo de "re-login" ou "reinicializar app", o bug pode aparecer.

---

#### Problema O: `sidebarOverlay` — dois handlers (onclick + addEventListener)

**Onde:** `index.html` linha 136 e `script.js` 6233

```html
<div id="sidebarOverlay" class="sidebar-overlay" onclick="toggleSidebar()"></div>
```

```javascript
document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
    if (sidebar?.classList.contains('open')) toggleSidebar();
});
```

**Por que ocorre:** O overlay tem `onclick="toggleSidebar()"` no HTML e um segundo handler via `addEventListener`. Ao clicar, `toggleSidebar` é chamado duas vezes — a sidebar abre e fecha imediatamente.

**Impacto na UX:** O overlay não fecha a sidebar de forma fiável; comportamento errático em mobile.

**Como reproduzir:** Abrir sidebar em mobile, tocar no overlay. A sidebar pode abrir e fechar no mesmo clique.

**Risco futuro:** Bug crítico de navegação em mobile.

---

### 1.7 Z-INDEX E OVERFLOW

#### Problema P: Z-index espalhado sem escala definida

**Onde:** Vários ficheiros — `z-index: 50` (modal), `z-index: 900` (sidebar overlay), `z-index: 1000` (sidebar), `z-index: 1001` (menu btn), `z-index: 9999` (modais inline), `z-index: 100000` (overlay fatura).

**Por que ocorre:** Não há uma escala centralizada. Novos componentes usam valores ad-hoc (ex.: 99999, 100000). Risco de sobreposição incorreta quando se adicionam novos overlays.

**Impacto na UX:** Modal atrás do sidebar; notificação atrás do modal; botão "Voltar ao topo" por cima de modais.

**Como reproduzir:** Abrir modal de cliente e, em seguida, mostrar uma notificação — verificar ordem de empilhamento.

---

#### Problema Q: `overflow-y: auto` em `.modal-content` sem `overscroll-behavior`

**Onde:** `styles.css` 417-419

```css
.modal-content {
    max-height: 90vh;
    overflow-y: auto;
}
```

**Por que ocorre:** Em mobile, o scroll do modal pode propagar para o body (scroll chaining). O utilizador tenta fazer scroll no modal e a página por trás também roda.

**Impacto na UX:** Difícil fazer scroll dentro de modais longos em telemóvel; sensação de "arrastar" a página.

**Como reproduzir:** Abrir modal de documento com lista longa em mobile; fazer scroll.

---

### 1.8 NOTIFICAÇÕES

#### Problema R: Toast sem `requestAnimationFrame` antes de `classList.add('show')`

**Onde:** `script.js` 16569-16578

```javascript
container.appendChild(notification);
notification.classList.add('show');
```

**Por que ocorre:** O elemento é adicionado ao DOM e imediatamente recebe `show`. O browser pode não ter tido tempo de fazer o layout inicial. A transição de `translateX(100%)` para `translateX(0)` pode começar de um estado intermédio, gerando tremor.

**Impacto na UX:** Notificação pode "entrar" de forma irregular ou com um pequeno salto.

**Como reproduzir:** Disparar várias notificações em rápida sucessão.

---

### 1.9 RACE CONDITIONS

#### Problema S: `fecharModalRobusto` + `setTimeout(abrirModal, 100/200)` 

**Onde:** `script.js` 3634-3635, 3657-3658, 3704-3705

```javascript
fecharModalRobusto();
setTimeout(() => abrirModalEdicaoContrato(contrato), 200);
```

**Por que ocorre:** O `fecharModalRobusto` remove modais de forma assíncrona (querySelectorAll + remove). O `setTimeout(200)` pode disparar antes da remoção estar completa. Se o novo modal for criado enquanto o antigo ainda está a ser removido, podem coexistir dois modais.

**Impacto na UX:** Dois modais visíveis; fundo escuro duplicado; foco preso num modal invisível.

**Como reproduzir:** Clicar rapidamente em "Editar" em vários contratos. Ou duplicar cliente e imediatamente fechar.

**Risco futuro:** Com mais modais em sequência, a race é mais provável.

---

---

## 2. SOLUÇÕES PROFISSIONAIS

### Solução A — Modal: Otimizar transições

```css
/* styles.css */
.modal {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
    will-change: opacity;
    contain: layout style paint;
}
.modal.show {
    opacity: 1;
    visibility: visible;
}
.modal-content {
    transform: scale(0.98);
    transition: transform 0.2s cubic-bezier(0.33, 1, 0.68, 1);
    will-change: transform;
}
.modal.show .modal-content {
    transform: scale(1);
}
```

**Alternativa:** Usar apenas `opacity` e `visibility`; remover `scale` se preferir menos animação.

---

### Solução B — Modais inline: Usar classe `.modal` em vez de estilos forçados

Remover o bloco que faz:
```javascript
modalTeste.style.display = 'flex';
modalTeste.style.visibility = 'visible';
modalTeste.style.opacity = '1';
```

Substituir por:
```javascript
modal.className = 'modal';  // Não 'modal show' inicialmente
document.body.appendChild(modal);
requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
});
```

Assim a transição CSS é respeitada e o tremor é evitado.

---

### Solução C — Reservar espaço do modal (evitar layout shift)

No `index.html`, dar dimensões mínimas ao container:

```html
<div id="modalContainer" class="modal-backdrop" role="dialog" aria-modal="true" aria-hidden="true"></div>
```

```css
.modal-backdrop {
    position: fixed;
    inset: 0;
    pointer-events: none;
    visibility: hidden;
    z-index: 50;
}
.modal-backdrop.show {
    pointer-events: auto;
    visibility: visible;
}
.modal-backdrop:not(:empty) {
    display: flex;
    align-items: center;
    justify-content: center;
}
```

O conteúdo continua a ser injetado, mas o container tem estrutura estável.

---

### Solução D — `fecharModalRobusto` sem varrer todo o DOM

```javascript
function fecharModalRobusto() {
    const toRemove = [];
    // Apenas filhos diretos do body e do modalContainer
    document.querySelectorAll('body > .fixed.inset-0, body > .modal, #modalContainer .modal, #modalContainer .fixed.inset-0').forEach(el => {
        if (el.id !== 'sidebar' && !el.classList.contains('sidebar')) toRemove.push(el);
    });
    toRemove.forEach(el => { el.remove(); });
    
    const mc = document.getElementById('modalContainer');
    if (mc) {
        mc.classList.remove('show');
        mc.innerHTML = '';
        mc.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    if (document.activeElement?.blur) document.activeElement.blur();
}
```

---

### Solução E/F — Hover estável

```css
.card {
    transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}
.sidebar-item {
    transition: background 0.2s ease;
}
.sidebar-item:hover {
    background: rgba(255, 255, 255, 0.1);
    /* Remover transform: translateX(4px) ou usar margin-left com cuidado */
}
```

Para o sidebar-item, alternativas: usar `padding-left` animado ou um pseudo-elemento para o efeito visual sem alterar layout.

---

### Solução G/H — Conteúdo dinâmico estável

1. Manter `min-height: 420px` em `#conteudoDinamico`.
2. Usar skeleton com altura fixa durante o loader:
   ```css
   .loader-skeleton { min-height: 420px; }
   ```
3. Evitar `animate-spin` em elementos grandes; preferir um placeholder estático ou animação mais leve.
4. Considerar `content-visibility: auto` em secções offscreen para melhor performance.

---

### Solução I — Notificações sem layout shift

```css
#notificationsContainer {
    position: fixed;
    top: 5rem;
    right: 1.5rem;
    max-height: min(80vh, 400px);
    overflow-y: auto;
    overflow-x: hidden;
    width: 360px;
    pointer-events: none;
}
#notificationsContainer > * {
    pointer-events: auto;
}
```

Largura fixa evita que o header "salte" quando as notificações aparecem.

---

### Solução J/K — Menos re-renders

1. Aumentar `LISTENER_REFRESH_DEBOUNCE_MS` para 200–250 ms em conexões lentas.
2. Em `atualizarInterface`, limitar `lucide.createIcons()` à secção ativa:
   ```javascript
   const container = document.getElementById('conteudoDinamico');
   if (container) lucide.createIcons({ nameAttr: 'data-lucide', attrs: {} }, container);
   ```
3. Melhorar `obterHashDadosSecao` para ser mais estável (normalizar ordem de itens, ignorar timestamps de "última atualização" para o hash).

---

### Solução L — Transições específicas

Substituir `transition: all` por propriedades concretas em todos os elementos:
- `.sidebar`: `transition: transform 0.3s ease, width 0.3s ease`
- `.sidebar-item`: `transition: background 0.2s ease`
- `.card`: `transition: box-shadow 0.2s ease, transform 0.2s ease`
- `.btn`: `transition: transform 0.15s ease, background-color 0.15s ease`

---

### Solução M — Sidebar responsiva consistente

Unificar `width` em media queries com uma variável ou escala clara:

```css
@media (max-width: 1024px) {
    .sidebar {
        width: min(85vw, 320px);
        transform: translateX(-100%);
    }
}
@media (max-width: 640px) {
    .sidebar {
        width: min(85vw, 280px);
    }
}
```

Evitar saltos entre 180px e 160px; usar apenas `min(85vw, X)` em mobile.

---

### Solução N — Evitar listeners duplicados

```javascript
function configurarEventos() {
    if (window.__sistemaLegalEventosConfigurados) return;
    window.__sistemaLegalEventosConfigurados = true;
    // ... resto dos addEventListener
}
```

---

### Solução O — Remover handler duplicado do overlay

No `index.html`, remover `onclick` do overlay:

```html
<div id="sidebarOverlay" class="sidebar-overlay" aria-hidden="true"></div>
```

O handler em `configurarEventos` fica como única fonte de clique. Garantir que `sidebarOverlay` está no DOM quando `configurarEventos` corre.

---

### Solução P — Escala de z-index

Definir em `:root` ou num ficheiro de variáveis:

```css
:root {
    --z-dropdown: 40;
    --z-sticky: 50;
    --z-modal-backdrop: 100;
    --z-modal: 110;
    --z-toast: 200;
    --z-overlay-fatura: 300;
}
```

E usar `z-index: var(--z-modal)` etc. em vez de números dispersos.

---

### Solução Q — Scroll do modal

```css
.modal-content {
    max-height: 90vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
}
```

---

### Solução R — Toast com RAF

```javascript
function mostrarNotificacao(mensagem, tipo = 'info') {
    const container = document.getElementById('notificationsContainer');
    if (!container) { /* fallback existente */ return; }
    
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    notification.textContent = mensagem;
    container.appendChild(notification);
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
    });
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
```

---

### Solução S — Sequência modal fechar → abrir

```javascript
function abrirModalAposFechar(fn, delay = 150) {
    fecharModalRobusto();
    const check = () => {
        const aberto = document.querySelector('.modal, .fixed.inset-0');
        if (!aberto || aberto.id === 'sidebarOverlay') {
            fn();
        } else {
            requestAnimationFrame(check);
        }
    };
    setTimeout(check, delay);
}
// Uso:
abrirModalAposFechar(() => abrirModalEdicaoContrato(contrato), 100);
```

---

## 3. RECOMENDAÇÕES ESTRUTURAIS

1. **Sistema de design:** Criar tokens CSS (cores, espaços, z-index, durações) e usá-los de forma consistente.
2. **Modais únicos:** Centralizar abertura/fecho de modais numa função (ex.: `modalManager.open(options)`), em vez de lógica espalhada.
3. **Event delegation:** Manter e expandir o uso de `data-*-acao`; evitar `onclick` inline sempre que possível.
4. **Testes visuais:** Usar Playwright ou similar para capturar regressões de layout (ex.: CLS).
5. **Performance:** Usar Chrome DevTools → Performance para gravar abertura de modais e rotação de secções; identificar repaints e long tasks.
6. **Acessibilidade:** Garantir `focus` trap nos modais, `aria-hidden` no background e restauração de foco ao fechar.
7. **Modularização:** Preparar migração para componentes (ex.: React/Preact) com estado local por modal, reduzindo manipulação direta do DOM.

---

## 4. RESUMO EXECUTIVO

| Categoria        | Problemas | Prioridade |
|------------------|-----------|------------|
| Modais           | 4 (A,B,C,D) | Alta     |
| Hover            | 2 (E,F)     | Média    |
| Layout shift     | 3 (G,H,I)   | Alta     |
| Re-renders       | 2 (J,K)     | Alta     |
| CSS              | 2 (L,M)     | Média    |
| Eventos          | 2 (N,O)     | Crítica  |
| Z-index/Overflow | 2 (P,Q)     | Média    |
| Notificações     | 1 (R)       | Baixa   |
| Race conditions  | 1 (S)       | Alta     |

**Prioridade imediata:** O (overlay duplo), N (listeners duplicados), S (race modais), B (modais inline sem transição).

---

## 5. STATUS DE IMPLEMENTAÇÃO (2026-02-23)

### ✅ Implementado
- **O** — Overlay: removido `onclick` duplicado; handler único em `configurarEventos`
- **N** — Guard em `configurarEventos` impede listeners duplicados
- **L** — `transition: all` substituído por propriedades específicas
- **A** — Modal: `will-change`, `contain`, transições otimizadas
- **E/F** — Hover: removido `transform` de `.sidebar-item`; transições específicas
- **Q** — Modal: `overscroll-behavior: contain` para scroll
- **R** — Toast: `requestAnimationFrame` duplo antes de `show`
- **D** — `fecharModalRobusto` otimizado; exclusão de `sidebarOverlay`
- **B** — Modal info cliente: RAF em vez de estilos inline forçados
- **S** — `abrirModalAposFechar` em editarCliente, editarContrato, editarHonorario, duplicarCliente, duplicarHonorario
- **P** — Variáveis CSS `--z-dropdown`, `--z-modal-backdrop`, `--z-toast`, etc.

### ⏳ Pendente (opcional)
- **G/H** — Skeleton com altura fixa no loader de secções
- **J/K** — Limitar `lucide.createIcons()` à secção ativa; debounce 200–250ms
- **M** — Unificar `width` da sidebar em media queries
- Substituir `z-index` fixos em modais inline (z-[9999], etc.) pelas variáveis CSS

---

*Documento gerado por auditoria de engenharia sénior. Última atualização: 2026-02-23.*
