# 🧪 Guia de Testes Passo a Passo - Sistema Legal

## 📋 **INSTRUÇÕES DE TESTE:**

### **Antes de começar:**
1. Abra o arquivo `index_clean.html` no navegador
2. Abra o Console do Desenvolvedor (F12 → Console)
3. Siga cada teste na ordem

---

## 🎯 **TESTE 1: Verificar se o Sistema Carrega**

### ✅ **Passo 1.1: Verificar se a página carrega**
- [ ] Abra `index_clean.html` no navegador
- [ ] A página deve carregar sem erros
- [ ] Verifique o console - deve aparecer mensagens de sistema carregado

**Resultado esperado:** ✅ Página carrega normalmente

---

## 🎯 **TESTE 2: Testar Sidebar**

### ✅ **Passo 2.1: Verificar se a sidebar aparece**
- [ ] A sidebar deve estar visível no lado esquerdo
- [ ] Deve conter menu de navegação

### ✅ **Passo 2.2: Testar toggle da sidebar**
- [ ] Clique no botão de menu (hambúrguer)
- [ ] Sidebar deve abrir/fechar

**Resultado esperado:** ✅ Sidebar funciona e permanece visível

---

## 🎯 **TESTE 3: Testar Modais - Abrir e Fechar**

### ✅ **Passo 3.1: Abrir modal de cliente**
- [ ] Clique em "Novo Cliente" ou clique em um cliente existente
- [ ] Modal deve abrir
- [ ] **IMPORTANTE:** Sidebar deve permanecer visível

**Resultado esperado:** ✅ Modal abre, sidebar permanece

### ✅ **Passo 3.2: Fechar modal com botão 'X'**
- [ ] Com o modal aberto, clique no botão 'X'
- [ ] Modal deve fechar
- [ ] **IMPORTANTE:** Sidebar deve permanecer visível

**Resultado esperado:** ✅ Modal fecha, sidebar permanece

### ✅ **Passo 3.3: Verificar logs no console**
- [ ] Abra o Console (F12)
- [ ] Ao fechar o modal, deve aparecer:
  - `🔧 fecharModalRobusto chamado`
  - `🎯 MÉTODO 1: Removendo modais...`
  - `⏭️ Div fixed ignorado (não é modal): sidebar` ← **DEVE APARECER**
  - `✅ fecharModalRobusto executado`

**Resultado esperado:** ✅ Logs mostram que sidebar foi ignorada

---

## 🎯 **TESTE 4: Testar Gestão de Clientes**

### ✅ **Passo 4.1: Criar novo cliente**
- [ ] Clique em "+ Novo Cliente"
- [ ] Preencha o formulário
- [ ] Clique em "Salvar" ou "Adicionar"
- [ ] Cliente deve ser criado
- [ ] Modal deve fechar
- [ ] Sidebar deve permanecer visível

**Resultado esperado:** ✅ Cliente criado, modal fecha, sidebar permanece

### ✅ **Passo 4.2: Editar cliente**
- [ ] Clique em um cliente na lista
- [ ] Modal de edição deve abrir
- [ ] Altere algum campo
- [ ] Clique em "Salvar"
- [ ] Alterações devem ser salvas
- [ ] Modal deve fechar
- [ ] Sidebar deve permanecer visível

**Resultado esperado:** ✅ Cliente editado, modal fecha, sidebar permanece

### ✅ **Passo 4.3: Excluir cliente**
- [ ] Clique no botão de excluir de um cliente
- [ ] Confirme a exclusão
- [ ] Cliente deve ser excluído
- [ ] Modal deve fechar
- [ ] Sidebar deve permanecer visível

**Resultado esperado:** ✅ Cliente excluído, modal fecha, sidebar permanece

---

## 🎯 **TESTE 5: Testar Gestão de Honorários**

### ✅ **Passo 5.1: Criar novo honorário**
- [ ] Navegue para a seção "Honorários"
- [ ] Clique em "Novo Honorário"
- [ ] Preencha o formulário
- [ ] Clique em "Salvar"
- [ ] Honorário deve ser criado
- [ ] Modal deve fechar
- [ ] Sidebar deve permanecer visível

**Resultado esperado:** ✅ Honorário criado, modal fecha, sidebar permanece

### ✅ **Passo 5.2: Editar honorário**
- [ ] Clique em um honorário na lista
- [ ] Modal de edição deve abrir
- [ ] Altere algum campo
- [ ] Clique em "Salvar"
- [ ] Alterações devem ser salvas
- [ ] Modal deve fechar
- [ ] Sidebar deve permanecer visível

**Resultado esperado:** ✅ Honorário editado, modal fecha, sidebar permanece

### ✅ **Passo 5.3: Excluir honorário**
- [ ] Clique no botão de excluir de um honorário
- [ ] Confirme a exclusão
- [ ] **IMPORTANTE:** Não deve aparecer erro `excluirHonorarioDireto is not defined`
- [ ] Honorário deve ser excluído
- [ ] Modal deve fechar
- [ ] Sidebar deve permanecer visível

**Resultado esperado:** ✅ Honorário excluído sem erros, modal fecha, sidebar permanece

---

## 🎯 **TESTE 6: Testar Gestão de Contratos**

### ✅ **Passo 6.1: Criar novo contrato**
- [ ] Navegue para a seção "Contratos"
- [ ] Clique em "Novo Contrato"
- [ ] Preencha o formulário
- [ ] Clique em "Salvar"
- [ ] Contrato deve ser criado
- [ ] Modal deve fechar
- [ ] Sidebar deve permanecer visível

**Resultado esperado:** ✅ Contrato criado, modal fecha, sidebar permanece

### ✅ **Passo 6.2: Editar contrato**
- [ ] Clique em um contrato na lista
- [ ] Modal de edição deve abrir
- [ ] Altere algum campo
- [ ] Clique em "Salvar"
- [ ] Alterações devem ser salvas
- [ ] Modal deve fechar
- [ ] Sidebar deve permanecer visível

**Resultado esperado:** ✅ Contrato editado, modal fecha, sidebar permanece

### ✅ **Passo 6.3: Excluir contrato**
- [ ] Clique no botão de excluir de um contrato
- [ ] Confirme a exclusão
- [ ] Contrato deve ser excluído
- [ ] Modal deve fechar
- [ ] Sidebar deve permanecer visível

**Resultado esperado:** ✅ Contrato excluído, modal fecha, sidebar permanece

---

## 🎯 **TESTE 7: Testar Modais de Documentos**

### ✅ **Passo 7.1: Abrir modal de documentos**
- [ ] Clique no ícone de documentos (📎) de um cliente
- [ ] Modal "Documentos de [Nome]" deve abrir
- [ ] **IMPORTANTE:** Sidebar deve permanecer visível

**Resultado esperado:** ✅ Modal de documentos abre, sidebar permanece

### ✅ **Passo 7.2: Fechar modal de documentos**
- [ ] Com o modal de documentos aberto, clique no botão 'X'
- [ ] Modal deve fechar
- [ ] **IMPORTANTE:** Sidebar deve permanecer visível
- [ ] Verifique no console se aparece `⏭️ Div fixed ignorado (não é modal): sidebar`

**Resultado esperado:** ✅ Modal fecha, sidebar permanece, logs corretos

---

## 🎯 **TESTE 8: Testar Botões de Menu**

### ✅ **Passo 8.1: Testar botão de menu hambúrguer**
- [ ] Clique no botão de menu hambúrguer
- [ ] Sidebar deve abrir/fechar
- [ ] Botão não deve ser removido

**Resultado esperado:** ✅ Botão funciona, não é removido

### ✅ **Passo 8.2: Verificar se botões não são removidos ao fechar modais**
- [ ] Abra um modal
- [ ] Feche o modal
- [ ] Verifique se todos os botões ainda estão funcionais
- [ ] Verifique no console se aparecem logs:
  - `⏭️ Elemento z-index alto ignorado (não é modal): mobileMenuBtn`
  - `⏭️ Elemento z-index alto ignorado (não é modal): menuHamburguer`

**Resultado esperado:** ✅ Botões funcionam, logs mostram que foram ignorados

---

## 🎯 **TESTE 9: Testar Erros no Console**

### ✅ **Passo 9.1: Verificar console por erros**
- [ ] Abra o Console (F12)
- [ ] Navegue pelo sistema
- [ ] Abra e feche modais
- [ ] **IMPORTANTE:** Não deve aparecer:
  - ❌ `Uncaught ReferenceError: excluirHonorarioDireto is not defined`
  - ❌ `Uncaught ReferenceError: excluirClienteDireto is not defined`
  - ❌ `Uncaught ReferenceError: fecharModalRobusto is not defined`

**Resultado esperado:** ✅ Nenhum erro de funções não definidas

---

## 🎯 **TESTE 10: Teste Completo - Fluxo de Uso**

### ✅ **Passo 10.1: Fluxo completo**
1. [ ] Abra a página
2. [ ] Verifique se a sidebar está visível
3. [ ] Crie um novo cliente
4. [ ] Verifique se a sidebar permanece visível
5. [ ] Abra o modal de documentos do cliente
6. [ ] Verifique se a sidebar permanece visível
7. [ ] Feche o modal
8. [ ] Verifique se a sidebar permanece visível
9. [ ] Edite o cliente
10. [ ] Verifique se a sidebar permanece visível
11. [ ] Crie um honorário
12. [ ] Verifique se a sidebar permanece visível
13. [ ] Exclua o honorário
14. [ ] Verifique se não há erros no console
15. [ ] Verifique se a sidebar permanece visível

**Resultado esperado:** ✅ Tudo funciona, sidebar sempre visível, sem erros

---

## 📊 **CHECKLIST DE VERIFICAÇÃO:**

Marque cada item conforme for testando:

### **Modais:**
- [ ] Modais abrem corretamente
- [ ] Modais fecham com botão 'X'
- [ ] Modais fecham clicando fora (se configurado)
- [ ] Sidebar permanece visível ao abrir modais
- [ ] Sidebar permanece visível ao fechar modais

### **Funções:**
- [ ] Todas as funções de editar funcionam
- [ ] Todas as funções de excluir funcionam
- [ ] Nenhum erro no console
- [ ] Todas as notificações aparecem

### **Sidebar:**
- [ ] Sidebar sempre visível
- [ ] Sidebar não desaparece ao abrir modais
- [ ] Sidebar não desaparece ao fechar modais
- [ ] Toggle da sidebar funciona

### **Botões:**
- [ ] Todos os botões funcionam
- [ ] Botões não são removidos
- [ ] Botões de menu funcionam

---

## 🎯 **RESULTADO FINAL:**

Após completar todos os testes, marque:

- [ ] **Todos os testes passaram**
- [ ] **Sidebar sempre permanece visível**
- [ ] **Nenhum erro no console**
- [ ] **Todos os modais funcionam corretamente**

---

## 📝 **NOTAS:**

**Se encontrar algum problema:**
1. Anote qual teste falhou
2. Anote qual erro apareceu (se houver)
3. Anote o que estava esperado vs. o que aconteceu
4. Verifique o console para mensagens de erro

**Se tudo funcionar:**
✅ Sistema está funcional e pronto para uso!

---

**Boa sorte com os testes! 🧪**


