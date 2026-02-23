# Guia para Partilhar o Sistema Legal - Uso Profissional

## 📋 Opções para Partilhar

### Opção 1: GitHub Pages (GRÁTIS - Recomendado)
**Melhor para:** Partilhar rapidamente sem custos

**Passos:**
1. Criar conta no GitHub (se não tiver): https://github.com
2. Criar um novo repositório (público ou privado)
3. Fazer upload do arquivo `index_clean.html` (renomear para `index.html`)
4. Ativar GitHub Pages nas configurações do repositório
5. Partilhar o link: `https://[seu-usuario].github.io/[nome-repositorio]`

**Vantagens:**
- ✅ Grátis
- ✅ HTTPS automático
- ✅ Fácil de atualizar
- ✅ Sem necessidade de servidor próprio

**Desvantagens:**
- ⚠️ Repositório público: código visível
- ⚠️ Repositório privado: requer GitHub Pro (pago)

---

### Opção 2: Netlify (GRÁTIS - Recomendado)
**Melhor para:** Partilhar com domínio personalizado

**Passos:**
1. Criar conta no Netlify: https://netlify.com
2. Arrastar e soltar a pasta do projeto ou conectar GitHub
3. Netlify faz deploy automaticamente
4. Partilhar o link: `https://[nome-projeto].netlify.app`

**Vantagens:**
- ✅ Grátis
- ✅ HTTPS automático
- ✅ Deploy automático
- ✅ Domínio personalizado (gratuito ou pago)
- ✅ Suporte a formulários

**Desvantagens:**
- ⚠️ Limite de banda no plano grátis

---

### Opção 3: Vercel (GRÁTIS)
**Melhor para:** Deploy rápido e fácil

**Passos:**
1. Criar conta no Vercel: https://vercel.com
2. Conectar GitHub ou fazer upload direto
3. Deploy automático
4. Partilhar o link: `https://[nome-projeto].vercel.app`

**Vantagens:**
- ✅ Grátis
- ✅ HTTPS automático
- ✅ Deploy automático
- ✅ CDN global

---

### Opção 4: Servidor Web Próprio
**Melhor para:** Controle total e privacidade máxima

**Passos:**
1. Alugar servidor web (Hostinger, Bluehost, etc.)
2. Fazer upload do arquivo via FTP
3. Configurar domínio personalizado
4. Partilhar o link: `https://[seu-dominio].com`

**Vantagens:**
- ✅ Controle total
- ✅ Privacidade máxima
- ✅ Domínio personalizado
- ✅ Sem limites de uso

**Desvantagens:**
- ⚠️ Custo mensal (~5-10€)
- ⚠️ Requer configuração

---

### Opção 5: Partilhar Arquivo Local (Para Testes)
**Melhor para:** Testar na mesma rede local

**Passos:**
1. Copiar o arquivo `index_clean.html`
2. Partilhar por email/USB/drive
3. Abrir diretamente no navegador

**Vantagens:**
- ✅ Não requer internet
- ✅ Fácil para testes

**Desvantagens:**
- ⚠️ Funciona apenas localmente
- ⚠️ Não partilhável online

---

## 🔧 Preparação do Arquivo

Antes de partilhar, certifique-se:

1. ✅ **Limpar dados de teste:**
   - Ir para "Backup" → "Limpar Todos os Dados"
   - Confirme duas vezes
   - Sistema ficará vazio e pronto para uso profissional

2. ✅ **Renomear arquivo:**
   - `index_clean.html` → `index.html`
   - Isso permite abrir diretamente no navegador sem especificar nome do arquivo

3. ✅ **Testar funcionamento:**
   - Testar criar cliente
   - Testar criar honorário
   - Testar editar/excluir
   - Testar todas as funcionalidades

---

## 📝 Checklist Antes de Partilhar

- [ ] Limpar todos os dados de teste
- [ ] Testar todas as funcionalidades
- [ ] Verificar se login funciona (usuário: `admin`, senha: `APM2024!`)
- [ ] Testar em diferentes navegadores (Chrome, Firefox, Edge)
- [ ] Testar em dispositivos móveis
- [ ] Verificar se localStorage funciona (dados são salvos)
- [ ] Renomear arquivo para `index.html` (se usar servidor web)

---

## 🔐 Segurança

**IMPORTANTE:**
- ⚠️ O sistema usa `localStorage` - dados ficam no navegador do usuário
- ⚠️ Cada pessoa que usar terá seus próprios dados (separados)
- ⚠️ Para dados compartilhados, será necessário implementar backend
- ⚠️ Login atual é simples - considere melhorar segurança para uso profissional

**Recomendações:**
- ✅ Alterar senha padrão (`APM2024!`) para algo mais seguro
- ✅ Considerar adicionar autenticação mais robusta
- ✅ Fazer backups regulares dos dados

---

## 🚀 Passo a Passo Rápido - GitHub Pages

1. **Ir para:** https://github.com/new
2. **Nome do repositório:** `sistema-legal` (ou outro nome)
3. **Público ou Privado:** Escolher conforme necessidade
4. **Criar repositório**
5. **Fazer upload:**
   - Clicar em "uploading an existing file"
   - Arrastar `index_clean.html` (renomear para `index.html` antes)
   - Fazer commit
6. **Ativar Pages:**
   - Ir em "Settings" → "Pages"
   - Source: "Deploy from a branch"
   - Branch: `main` / `/ (root)`
   - Save
7. **Aguardar alguns minutos**
8. **Link será:** `https://[seu-usuario].github.io/sistema-legal`

---

## 📧 Partilhar o Link

Quando tiver o link, pode partilhar:

**Por Email:**
```
Assunto: Sistema Legal - Acesso ao Sistema

Olá,

Segue o link para acessar o Sistema Legal:

https://[seu-link]

Credenciais:
- Usuário: admin
- Senha: APM2024!

(Nota: Recomenda-se alterar a senha após primeiro acesso)

Atenciosamente,
[Seu Nome]
```

**Por Mensagem/WhatsApp:**
```
Olá! Aqui está o link do Sistema Legal:

🔗 https://[seu-link]

Login:
👤 Usuário: admin
🔒 Senha: APM2024!

(Altere a senha após primeiro acesso)
```

---

## 💡 Dicas Profissionais

1. **Domínio Personalizado:**
   - Compre um domínio (ex: `sistema-legal.pt`)
   - Configure no serviço escolhido (Netlify/Vercel)
   - Fica mais profissional: `https://sistema-legal.pt`

2. **Backup Regular:**
   - Recomende aos usuários fazerem export de dados regularmente
   - Sistema tem função "Exportar" no header

3. **Atualizações:**
   - Faça backup antes de atualizar
   - Teste em ambiente de desenvolvimento primeiro
   - Documente mudanças

---

## ❓ Perguntas Frequentes

**P: Os dados ficam seguros?**
R: Os dados ficam no navegador de cada usuário. Cada pessoa tem seus próprios dados separados.

**P: Posso partilhar com várias pessoas?**
R: Sim, mas cada pessoa terá seus próprios dados. Para dados compartilhados, será necessário backend.

**P: Posso mudar a senha?**
R: Sim, mas será necessário editar o código JavaScript. Atualmente a senha está no código.

**P: Funciona offline?**
R: Sim, funciona offline após primeiro carregamento, pois usa localStorage do navegador.

---

## 📞 Suporte

Se precisar de ajuda, consulte:
- Arquivo: `README.md`
- Arquivo: `GUIA-TRABALHO-SEGURO.md`
- Arquivo: `GUIA-TESTES-PASSO-A-PASSO.md`

