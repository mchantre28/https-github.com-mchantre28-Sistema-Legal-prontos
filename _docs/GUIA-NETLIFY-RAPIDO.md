# 🚀 Guia Rápido - Deploy no Netlify (5 minutos)

## ✅ Por que Netlify?

- ✅ **GRÁTIS**
- ✅ Funciona com repositórios **PRIVADOS**
- ✅ Deploy automático
- ✅ HTTPS automático
- ✅ Mais fácil que GitHub Pages

---

## 📋 PASSO A PASSO - Netlify

### PASSO 1: Criar Conta

1. **Ir para:** https://netlify.com
2. **Clicar em "Sign up"** (Criar conta)
3. **Escolher:** **"Sign up with GitHub"** (mais rápido)
4. **Autorizar** Netlify a acessar sua conta GitHub
5. **Aguardar** redirecionamento para o dashboard

---

### PASSO 2: Adicionar Site

1. **No dashboard do Netlify**, clique em **"Add new site"**
2. **Selecione:** **"Import an existing project"**
3. **Escolha:** **"Deploy with GitHub"**
4. **Autorizar** se necessário
5. **Selecione seu repositório:** `Sistema-Legal-pronto`
6. **Clique em "Import"**

---

### PASSO 3: Configurar Deploy

1. **Deploy settings aparecerão:**
   - **Branch to deploy:** `main` (deve estar correto)
   - **Build command:** **DEIXAR VAZIO** (não precisa)
   - **Publish directory:** **DEIXAR VAZIO** ou `/` (raiz)

2. **Role até o final** e clique em **"Deploy site"**

---

### PASSO 4: Aguardar Deploy

1. **Aguardar** alguns segundos (geralmente 30-60 segundos)
2. **Status mudará para:** "Published" (Verde)
3. **Link será mostrado:**
   - `https://[nome-aleatorio].netlify.app`
   - OU você pode personalizar

---

### PASSO 5: Personalizar Link (Opcional)

1. **Clicar em "Site settings"** → **"Change site name"**
2. **Escolher um nome:**
   - Exemplo: `sistema-legal-pronto`
   - Link ficará: `https://sistema-legal-pronto.netlify.app`

3. **Salvar**

---

## ✅ Pronto!

**Link gerado:** `https://[seu-nome].netlify.app`

**Próximos passos:**
1. ✅ Testar no navegador (usuário: `admin`, senha: `APM2024!`)
2. ✅ Limpar dados de teste (Backup → Limpar Todos os Dados)
3. ✅ Partilhar o link!

---

## 🔄 Atualizações Automáticas

**Vantagem do Netlify:**
- Sempre que você fizer **commit** no GitHub, o Netlify faz **deploy automático**!
- Não precisa fazer nada - atualiza sozinho!

---

## 🆘 Problemas Comuns

### "Site build failed"
**Solução:** 
- Verificar se o arquivo `index.html` está na raiz do repositório
- Build command deve estar **vazio**
- Publish directory deve estar **vazio** ou `/`

### Link não funciona
**Solução:**
- Aguardar mais alguns minutos
- Verificar se o deploy foi bem-sucedido (status verde)
- Limpar cache do navegador

### Não encontra o repositório
**Solução:**
- Verificar se autorizou o Netlify a acessar GitHub
- Verificar se o repositório está visível (pode ser privado, sem problema!)

---

## 💡 Dicas

1. **Domínio personalizado:** Pode adicionar um domínio próprio depois (gratuito!)
2. **SSL/HTTPS:** Automático e gratuito!
3. **Backup:** Toda vez que fizer commit, faz novo deploy automaticamente!

---

## ✅ Resumo Rápido

```
1. netlify.com → Sign up with GitHub
   ↓
2. Add new site → Import from GitHub
   ↓
3. Selecionar repositório → Import
   ↓
4. Build command: VAZIO
   Publish directory: VAZIO
   ↓
5. Deploy site
   ↓
6. Copiar link gerado
   ↓
7. Pronto!
```

---

## 🎉 Pronto!

Agora tem um link **profissional** e **funcional** para partilhar o Sistema Legal!

**Link:** `https://[seu-nome].netlify.app` 🚀





