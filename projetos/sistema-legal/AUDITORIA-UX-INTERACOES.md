# Auditoria Total — UX, Reatividade, Eventos e Interações

**Data:** Fevereiro 2025  
**Escopo:** Sistema Legal — Cliques, eventos, estado, re-renders, layout shift, acessibilidade, performance front-end  
**Requisitos:** Zero tremores | Zero re-renders desnecessários | Zero listeners duplicados | Zero eventos perdidos

---

## 1. Diagnóstico Completo

### 1.1 Resumo dos Problemas Identificados

| # | Problema | Severidade | Impacto UX |
|---|----------|------------|------------|
| 1 | Inconsistência de binding de eventos (onclick vs delegation vs addEventListener direto) | Média | Cliques podem falhar em cenários de re-render |
| 2 | Listeners Firestore → agendarRefreshListener → carregarSecao causa substituição total do DOM | Média | Layout shift, perda de scroll/foco |
| 3 | Race: sync init + listeners disparam carregarSecao quase em simultâneo | Baixa | Tremor visual na primeira carga |
| 4 | visibilitychange chama pause+resume+sync+carregarSecao sem debounce | Média | Flash ao voltar ao separador |
| 5 | btn-editar-honorario, btn-duplicar-honorario usam addEventListener direto (não delegation) | Baixa | Funciona, mas frágil se aplicarFiltros atrasar |
| 6 | setInterval no syncBadge sem clearInterval (potencial leak em SPA) | Baixa | Memória se init múltiplo |
| 7 | CSS pointer-events aplicado apenas a button[data-acao], faltam data-cliente-acao, data-tarefa-acao | Média | Ícones podem capturar cliques noutros botões |
| 8 | Múltiplos setTimeout(100) em carregarSecao podem reordenar-se | Baixa | Comportamento imprevisível em máquinas lentas |
| 9 | cancelarRefreshListener vs agendarRefreshListener — possível cancelamento tardio | Baixa | Refresh pode ocorrer após navegação |
| 10 | Ícones Lucide sem pointer-events:none em botões com onclick inline | Média | Clique no ícone pode não propagar em alguns browsers |

---

## 2. Explicação Técnica Detalhada

### 2.1 Inconsistência de Binding de Eventos

**Onde ocorre:** `script.js` — múltiplas estratégias em paralelo.

- **Event delegation em `document`:** `data-acao`, `data-cliente-acao`, `data-tarefa-acao`, `data-copiar`
- **onclick inline:** honorários (editarItem/excluirItem), contratos (editarContratoDireto), prazos, notificações, documentos, migrações, heranças
- **addEventListener direto:** `btn-editar-honorario`, `btn-duplicar-honorario`, `btn-excluir-honorario` em `atualizarListaHonorarios`

**Por que ocorre:** Evolução incremental do código sem padronização.

**Impacto na UX:**
- Com event delegation, o clique funciona mesmo quando o DOM é substituído (`innerHTML`).
- Com `onclick` inline, funciona porque o HTML gerado contém a referência; porém, se o elemento for coberto por outro (ex.: overlay, `pointer-events` no pai), o clique pode falhar.
- Com `addEventListener` direto, os listeners são anexados depois do render; se `carregarSecao` substituir o conteúdo antes do `setTimeout(100)` executar `aplicarFiltrosHonorarios` → `atualizarListaHonorarios`, os novos botões ficam sem listener até ao próximo ciclo.

**Como reproduzir:** Navegar para Honorários → rapidamente disparar um listener Firestore (ex.: editar noutro separador) que chame `agendarRefreshListener` → `carregarSecao` em ~80 ms. O conteúdo é substituído; o `setTimeout(100)` ainda está pendente. Ao executar, `getElementById('listaHonorarios')` pode referir-se ao novo DOM (se a secção for a mesma), pelo que normalmente funciona. O risco é maior se a secção mudar antes do timeout.

**Risco futuro:** Manutenção difícil; novos botões podem não seguir o padrão correto e falhar em edge cases.

---

### 2.2 Listeners → agendarRefreshListener → Substituição Total do DOM

**Onde ocorre:** `agendarRefreshListener()` (linha ~349) → `carregarSecao(secaoAtiva)` (linha ~354).

**Por que ocorre:** Cada um dos ~18 listeners Firestore chama `agendarRefreshListener()` ao receber dados. O debounce de 80 ms coalesce múltiplos disparos num único `carregarSecao`. Mas `carregarSecao` faz `conteudoEl.innerHTML = conteudo`, substituindo todo o bloco de conteúdo.

**Impacto na UX:**
- **Layout shift:** O conteúdo anterior desaparece e o novo aparece; em conexões lentas ou com muitos dados, o loader "A carregar..." pode piscar.
- **Perda de scroll:** A posição de scroll de `#conteudoDinamico` ou do `body` é resetada.
- **Perda de foco:** Se o utilizador estiver a editar um input, o elemento é destruído e o foco perdido.
- **Tremor:** Flash entre estados.

**Como reproduzir:**
1. Abrir a secção Clientes com lista longa; fazer scroll para baixo.
2. Noutro dispositivo ou separador, editar um cliente.
3. O listener dispara, `agendarRefreshListener` agenda `carregarSecao('clientes')` em 80 ms.
4. A lista é substituída e o scroll volta ao topo.

**Risco futuro:** Utilizadores perdem contexto e precisam de repetir ações (scroll, foco).

---

### 2.3 Race no Init: Sync + Listeners

**Onde ocorre:** `init()` — `sincronizarTodasEntidadesNuvem().then(...)` e `iniciarListenersFirestore()` correm em paralelo.

**Por que ocorre:** A sync é assíncrona; os listeners são iniciados imediatamente. Quando a sync termina, chama `carregarSecao`. Os listeners, ao receberem o primeiro snapshot (cache ou rede), chamam `agendarRefreshListener`. Resultado: dois `carregarSecao` em poucos ms.

**Impacto na UX:** Tremor breve na primeira carga; loader pode aparecer e desaparecer rapidamente.

**Risco futuro:** Baixo, mas pode piorar com mais coleções ou latência maior.

---

### 2.4 visibilitychange Sem Debounce

**Onde ocorre:** `document.addEventListener('visibilitychange', ...)` em `init()` (linha ~3764).

**Por que ocorre:** Ao voltar ao separador (`visibilityState === 'visible'`), o código faz:
1. `listenerManager.pause()` + `resume(iniciarListenersFirestore)`
2. `sincronizarTodasEntidadesNuvem()`
3. `carregarDados()` + `carregarSecao(secaoAtiva)` + `atualizarInterface()`

**Impacto na UX:** Flash e re-render completo cada vez que o utilizador muda de separador, mesmo sem alterações nos dados.

**Como reproduzir:** Abrir o sistema, navegar para uma secção pesada (ex.: Relatórios), mudar para outra aba e voltar — a secção é recarregada mesmo sem alterações.

**Risco futuro:** UX degradada em utilizadores que alternam frequentemente entre abas.

---

### 2.5 CSS pointer-events: Incompletude

**Onde ocorre:** `styles.css` — `button[data-acao] svg, button[data-acao] i` têm `pointer-events: none`.

**Por que ocorre:** A regra abrange apenas `[data-acao]`. Botões com `data-cliente-acao` e `data-tarefa-acao` não estão cobertos. No HTML, esses botões usam `style="pointer-events:none"` inline nos ícones, pelo que na prática funcionam. A inconsistência está na abordagem (CSS global vs inline).

**Impacto na UX:** Se um botão for adicionado com `data-cliente-acao` sem `pointer-events:none` no ícone, o clique no ícone pode não chegar ao botão em browsers com comportamentos específicos de hit-testing.

**Risco futuro:** Novos botões podem esquecer o inline e quebrar cliques em ícones.

---

### 2.6 setInterval no syncBadge

**Onde ocorre:** `configurarEventos()` — `setInterval(() => { ... obterTextoUltimaSincronizacao(); }, 60000)` (linha ~6072).

**Por que ocorre:** Atualizar o texto "há X min" no badge a cada minuto.

**Impacto:** Se `init()` for chamado múltiplas vezes (ex.: erro de arquitetura ou SPA parcial), cada chamada a `configurarEventos()` adiciona um novo `setInterval` sem limpar o anterior. O intervalo nunca é guardado para `clearInterval`.

**Risco futuro:** Leak de timers em cenários de re-inicialização.

---

## 3. Soluções Profissionais

### 3.1 Padronizar Event Delegation (Problema 1 e 5)

**Solução ideal:** Usar event delegation em `document` para todos os botões de ação dinâmicos.

**Alterações:**
1. Adicionar `data-honorario-acao`, `data-contrato-acao`, `data-prazo-acao` (e equivalentes) aos botões.
2. Substituir `onclick` inline por estes atributos.
3. Adicionar um único listener de delegation para cada tipo.
4. Remover `addEventListener` direto em `atualizarListaHonorarios` e funções equivalentes.

**Alternativa:** Manter `onclick` mas garantir que todos os botões estejam dentro de `#conteudoDinamico` com `pointer-events: auto` e ícones com `pointer-events: none` (já parcialmente feito).

**Melhor prática:** Sempre preferir delegation para conteúdo dinâmico; reduz superfície de falha e simplifica manutenção.

---

### 3.2 Reduzir Layout Shift e Re-renders (Problema 2)

**Solução ideal:** Em vez de substituir todo o conteúdo, actualizar apenas os dados e re-renderizar de forma incremental ou com diff.

**Abordagem pragmática (menor esforço):**
1. Aumentar debounce de 80 ms para 150–200 ms.
2. Antes de `carregarSecao`, verificar se os dados relevantes da secção mudaram; se não, não re-renderizar.
3. Manter posição de scroll: `const scrollTop = conteudoEl.scrollTop; conteudoEl.innerHTML = ...; requestAnimationFrame(() => { conteudoEl.scrollTop = scrollTop; });`

**Exemplo de guard:**

```javascript
let __ultimoRefreshDados = null;
function agendarRefreshListener() {
  if (__listenerRefreshTimer) clearTimeout(__listenerRefreshTimer);
  __listenerRefreshTimer = setTimeout(() => {
    __listenerRefreshTimer = null;
    if (typeof secaoAtiva !== 'string') return;
    const chaveDados = secaoAtiva + '_' + JSON.stringify(obterHashDadosSecao(secaoAtiva));
    if (__ultimoRefreshDados === chaveDados) return; // Sem alteração
    __ultimoRefreshDados = chaveDados;
    carregarSecao(secaoAtiva);
    if (typeof atualizarInterface === 'function') atualizarInterface();
  }, 150);
}
```

---

### 3.3 Race no Init (Problema 3)

**Solução:** Iniciar listeners apenas após a primeira sync concluir.

```javascript
sincronizarTodasEntidadesNuvem().then(() => {
  if (isCloudReady()) try { appStorage.setItem('cloudSyncUltimoSucesso', new Date().toISOString()); } catch (e) {}
  appStorage.removeItem('naoRestaurarDaNuvem');
  carregarDados();
  carregarSecao(typeof secaoAtiva !== 'undefined' ? secaoAtiva : 'dashboard');
  atualizarInterface();
  atualizarIndicadorSync(isCloudReady() ? 'ok' : 'offline');
  if (isCloudReady()) iniciarListenersFirestore(); // Mover para aqui
});
// Remover chamada imediata a iniciarListenersFirestore()
```

---

### 3.4 visibilitychange com Debounce (Problema 4)

**Solução:** Evitar sync imediata ao voltar; só sincronizar se o separador estiver visível há alguns segundos ou se os dados estiverem desatualizados.

```javascript
let __visibilityChangeTimer = null;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !isCloudReady()) return;
  clearTimeout(__visibilityChangeTimer);
  __visibilityChangeTimer = setTimeout(() => {
    __visibilityChangeTimer = null;
    listenerManager.pause();
    listenerManager.resume(iniciarListenersFirestore);
    sincronizarTodasEntidadesNuvem().then(() => {
      if (isCloudReady()) try { appStorage.setItem('cloudSyncUltimoSucesso', new Date().toISOString()); } catch (e) {}
      carregarDados();
      carregarSecao(typeof secaoAtiva !== 'undefined' ? secaoAtiva : 'dashboard');
      atualizarInterface();
      atualizarIndicadorSync(isCloudReady() ? 'ok' : 'offline');
    });
  }, 500); // Só sync 500ms após voltar
});
```

---

### 3.5 CSS pointer-events Global (Problema 7)

**Solução:** Estender o seletor CSS para todos os botões de ação com ícones.

```css
/* Ícones dentro de botões: deixar cliques passarem para o botão */
button[data-acao] svg,
button[data-acao] i,
button[data-acao] [data-lucide],
button[data-cliente-acao] svg,
button[data-cliente-acao] i,
button[data-cliente-acao] [data-lucide],
button[data-tarefa-acao] svg,
button[data-tarefa-acao] i,
button[data-tarefa-acao] [data-lucide],
[data-copiar] svg,
[data-copiar] i,
[data-copiar] [data-lucide] {
    pointer-events: none !important;
}
```

---

### 3.6 setInterval com Cleanup (Problema 6)

**Solução:** Guardar o ID do intervalo e limpá-lo se `configurarEventos` for chamado novamente.

```javascript
if (window.__syncBadgeInterval) clearInterval(window.__syncBadgeInterval);
window.__syncBadgeInterval = setInterval(() => {
  if (syncBadge && syncBadge.getAttribute('data-status') === 'ok' && syncBadge.querySelector('.sync-text')) {
    syncBadge.querySelector('.sync-text').textContent = obterTextoUltimaSincronizacao();
  }
}, 60000);
```

---

## 4. Regras de UX e UI

1. **Zero tremores:** Evitar substituições brutais do DOM; preservar scroll e foco quando possível.
2. **Zero re-renders desnecessários:** Verificar se os dados mudaram antes de chamar `carregarSecao`.
3. **Zero listeners duplicados:** Usar `listenerManager.pause()` antes de criar novos listeners; limpar timers ao reconfigurar.
4. **Zero eventos perdidos:** Preferir event delegation; garantir `pointer-events` correctos em botões e ícones.
5. **Estados previsíveis:** `cancelarRefreshListener` deve ter prioridade sobre refresh pendente.
6. **Interações fluidas:** Debounce adequado (150–200 ms) para listeners; `requestAnimationFrame` para updates visuais.
7. **CSS modular:** Regras globais para padrões comuns (ex.: ícones em botões) em vez de inline quando possível.
8. **Acessibilidade:** Manter `aria-label`, `role`, `tabindex` nos controlos interactivos.
9. **Performance:** Evitar operações pesadas em `visibilitychange` sem debounce.

---

## 5. Recomendações Estruturais

1. **Modularizar renderização:** Separar funções de render por secção e garantir que updates incrementais sejam possíveis no futuro.
2. **Unificar binding de eventos:** Adoptar um único padrão (delegation) para todas as acções dinâmicas.
3. **Estado de “dados alterados”:** Manter um hash ou timestamp dos dados da secção activa para evitar re-renders sem mudanças.
4. **Testes de regressão:** Cobrir cenários de clique em botões após re-render, mudança de separador e sync em background.
5. **Documentar convenções:** Regra no projeto: “Todo o conteúdo dinâmico em `#conteudoDinamico` usa `data-*-acao` e event delegation”.

---

## 6. Código Corrigido — Extractos Principais

### 6.1 styles.css — pointer-events alargado

```css
/* Ícones dentro de botões: deixar cliques passarem para o botão */
button[data-acao] svg,
button[data-acao] i,
button[data-acao] [data-lucide],
button[data-cliente-acao] svg,
button[data-cliente-acao] i,
button[data-cliente-acao] [data-lucide],
button[data-tarefa-acao] svg,
button[data-tarefa-acao] i,
button[data-tarefa-acao] [data-lucide],
[data-copiar] svg,
[data-copiar] i,
[data-copiar] [data-lucide] {
    pointer-events: none !important;
}
```

### 6.2 init — Listeners após sync

Mover `iniciarListenersFirestore()` para dentro do `.then()` de `sincronizarTodasEntidadesNuvem`, eliminando a chamada imediata.

### 6.3 agendarRefreshListener — Debounce 150 ms

Alterar timeout de 80 para 150 ms (ou 200 ms conforme carga de dados).

### 6.4 visibilitychange — Debounce 500 ms

Adicionar `setTimeout(500)` antes de executar pause/resume e sync.

---

## 7. Conclusão

O sistema está funcional e as correções anteriores (listeners duplicados, Central de Notificações, JSON.parse) melhoraram a estabilidade. Os pontos identificados nesta auditoria são sobretudo de robustez e qualidade de UX: padronização de eventos, redução de re-renders e tremores, e melhor gestão de timers. A prioridade de implementação sugerida é:

1. **Alta:** CSS pointer-events alargado, listeners após sync  
2. **Média:** Debounce em visibilitychange, aumento do debounce em agendarRefreshListener, guard para evitar re-render sem alterações  
3. **Baixa:** Padronização completa para event delegation em honorários/contratos/prazos, cleanup do setInterval do syncBadge
