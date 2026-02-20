# 🚀 Passo a Passo - Partilhar no GitHub Pages

## ✅ PASSO 1: Criar o Repositório (Você já fez!)

Se ainda não clicou em "Create repository", **clique agora!** 🖱️

---

## ✅ PASSO 2: Preparar o Arquivo Local

Execute este comando no PowerShell:

```powershell
cd C:\experiencia\projetos\sistema-legal
.\preparar-para-partilha.ps1
```

**Ou manualmente:**
1. Ir para: `C:\experiencia\projetos\sistema-legal\`
2. Copiar `index_clean.html`
3. Colar e renomear para `index.html`

---

## ✅ PASSO 3: Fazer Upload do Arquivo

### Opção A: Upload via Interface Web (Mais Fácil)

1. **No GitHub**, depois de criar o repositório, você verá uma página inicial
2. **Procurar** o botão "uploading an existing file" ou "Add file" → "Upload files"
3. **Arrastar** o arquivo `index.html` para a área de upload
4. **Scroll down** até o final da página
5. **Clicar** em "Commit changes" (deixe a mensagem padrão ou escreva: "Initial commit: Sistema Legal")
6. **Clicar** no botão verde "Commit changes"

### Opção B: Usar Git (Mais Profissional)

```powershell
# Navegar para a pasta do projeto
cd C:\experiencia\projetos\sistema-legal

# Inicializar git (se ainda não foi feito)
git init

# Adicionar o arquivo
git add index.html

# Fazer commit
git commit -m "Initial commit: Sistema Legal pronto para produção"

# Adicionar o repositório remoto (SUBSTITUA 'mchantre28' E 'Sistema-Legal-pronto' PELOS SEUS VALORES)
git remote add origin https://github.com/mchantre28/Sistema-Legal-pronto.git

# Fazer push
git branch -M main
git push -u origin main
```

---

## ✅ PASSO 4: Ativar GitHub Pages

1. **No repositório**, clique em **"Settings"** (Configurações) - fica no topo do repositório
2. **No menu lateral**, procure **"Pages"** (geralmente no final do menu)
3. **Em "Source"**, escolha:
   - **Branch:** `main` (ou `master`)
   - **Folder:** `/ (root)`
4. **Clique** em **"Save"** (Salvar)
5. **Aguardar** 1-2 minutos enquanto o GitHub processa

---

## ✅ PASSO 5: Obter o Link

Depois de ativar Pages:

1. **Voltar para "Settings" → "Pages"**
2. **Você verá** uma mensagem verde: **"Your site is live at..."**
3. **Link será:** `https://mchantre28.github.io/Sistema-Legal-pronto`

**Copie este link!** 📋

---

## ✅ PASSO 6: Testar o Link

1. **Abrir o link** no navegador
2. **Testar login:**
   - Usuário: `admin`
   - Senha: `APM2024!`
3. **Testar funcionalidades básicas**
4. **Verificar** se tudo funciona corretamente

---

## ✅ PASSO 7: Partilhar

Quando tudo funcionar, pode partilhar o link:

**Por Email:**
```
Assunto: Sistema Legal - Acesso ao Sistema

Olá,

Segue o link para acessar o Sistema Legal:

🔗 https://mchantre28.github.io/Sistema-Legal-pronto

Credenciais de acesso:
👤 Usuário: admin
🔒 Senha: APM2024!

(Nota: Recomenda-se alterar a senha após primeiro acesso)

Atenciosamente,
[Seu Nome]
```

**Por Mensagem/WhatsApp:**
```
Olá! Aqui está o link do Sistema Legal:

🔗 https://mchantre28.github.io/Sistema-Legal-pronto

Login:
👤 Usuário: admin
🔒 Senha: APM2024!

(Altere a senha após primeiro acesso)
```

---

## ⚠️ IMPORTANTE - Antes de Partilhar:

1. **Limpar dados de teste:**
   - Abrir o link do sistema
   - Fazer login
   - Ir em "Backup" → "Limpar Todos os Dados"
   - Confirmar duas vezes
   - Sistema ficará vazio e pronto para uso profissional

2. **Testar tudo:**
   - Criar cliente
   - Criar honorário
   - Editar/excluir
   - Todas as funcionalidades

---

## 🆘 Se Algo Der Errado:

### Problema: "404 - Page not found"
**Solução:**
- Aguardar mais alguns minutos (pode demorar até 5 minutos)
- Verificar se ativou Pages corretamente
- Verificar se o arquivo se chama exatamente `index.html`

### Problema: "Cannot GET /"
**Solução:**
- Verificar se o arquivo está na raiz do repositório (não dentro de uma pasta)
- Verificar se o nome do arquivo é exatamente `index.html`

### Problema: Arquivo não aparece
**Solução:**
- Verificar se fez commit corretamente
- Verificar se está na branch `main` (ou `master`)
- Verificar se o arquivo está visível no repositório

---

## 📝 Checklist Final:

- [ ] Repositório criado no GitHub
- [ ] Arquivo `index.html` criado localmente
- [ ] Arquivo `index.html` enviado para o GitHub
- [ ] GitHub Pages ativado
- [ ] Link funcionando no navegador
- [ ] Login testado e funcionando
- [ ] Dados de teste limpos
- [ ] Sistema testado e funcionando
- [ ] Link partilhado com os usuários

---

## 🎉 Pronto!

Quando completar todos os passos, terá um sistema online e acessível para partilhar!

**Link será:** `https://mchantre28.github.io/Sistema-Legal-pronto`

---

## 💡 Dica:

Se quiser um domínio personalizado (ex: `sistema-legal.pt`):
1. Comprar domínio
2. Ir em Settings → Pages → Custom domain
3. Inserir o domínio
4. Configurar DNS conforme instruções do GitHub

---

## 📞 Precisa de Ajuda?

Consulte:
- `GUIA-PARTILHA-PROFISSIONAL.md` - Guia completo
- `README.md` - Informações do projeto





