# Railway em 6 passos — Sistema Legal

Guia **ultra simples** para publicar a API (backend) e fazer o login funcionar no GitHub Pages.

> **Importante:** O assistente **não consegue entrar na sua conta Railway**. Tem de fazer estes passos **no seu computador**, com a sua conta. Depois envia-nos o URL gerado.

---

## O que vai acontecer

| Onde | O quê |
|------|--------|
| **GitHub Pages** | Mostra o ecrã de login (já funciona) |
| **Railway** | Corre a API Node.js (login, processos, etc.) |
| **Ligação** | Meta tag `api-base-url` nos HTML aponta para o Railway |

Sem Railway, o browser tenta `localhost:3001` e o login **falha**.

---

## Passo 1 — Criar conta no Railway

1. Abrir [https://railway.app](https://railway.app)
2. Clicar **Login** → entrar com **GitHub** (recomendado) ou email
3. Confirmar email se pedido

---

## Passo 2 — Novo projeto a partir do GitHub

1. No painel Railway: **New Project**
2. Escolher **Deploy from GitHub repo**
3. Se for a primeira vez: autorizar o Railway a aceder ao GitHub
4. Selecionar o repositório do Sistema Legal
5. **Root Directory** (pasta raiz do serviço):
   ```
   projetos/sistema-legal/backend
   ```
   > Railway → serviço → **Settings** → **Root Directory** → colar o caminho acima → **Save**

6. Aguardar o primeiro deploy (1–3 minutos). Pode falhar até ao Passo 3 — é normal.

---

## Passo 3 — Variável JWT_SECRET

A API precisa de uma chave secreta para os logins.

1. Railway → seu serviço → **Variables**
2. **New Variable**
3. Nome: `JWT_SECRET`
4. Valor: uma frase longa e aleatória (mínimo 32 caracteres), por exemplo:
   ```
   SistemaLegal2026-ChaveSecreta-MuitoLonga-Aleatoria
   ```
5. Guardar. O Railway faz redeploy automático.

---

## Passo 4 — Gerar domínio público

1. Railway → serviço → **Settings** → **Networking**
2. Clicar **Generate Domain**
3. Copiar o URL completo, por exemplo:
   ```
   https://sistema-legal-api-production-xxxx.up.railway.app
   ```
4. Testar no browser (deve mostrar JSON):
   ```
   https://SEU-DOMINIO.up.railway.app/api/health
   ```
   Resposta esperada: `{"status":"ok","servico":"sistema-legal-api"}`

**Guarde este URL** — é o que liga o GitHub Pages à API.

---

## Passo 5 — Configurar `api-base-url` no frontend

Escolha **uma** das opções:

### Opção A — Enviar o URL ao assistente (mais fácil)

Envie no chat:

> O URL do Railway é: `https://SEU-DOMINIO.up.railway.app`

O assistente configura os 3 ficheiros HTML e faz o push por si.

### Opção B — Configurar manualmente

Editar estes 3 ficheiros:

- `projetos/sistema-legal/index.html`
- `projetos/sistema-legal/admin.html`
- `projetos/sistema-legal/cliente.html`

Remover o bloco comentado de produção e colocar (com **o seu** URL, sem barra no final):

```html
<meta name="api-base-url" content="https://SEU-DOMINIO.up.railway.app">
```

### Opção C — Script PowerShell (no PC)

```powershell
cd C:\experiencia\projetos\sistema-legal
.\configure-api-url.ps1 -Url "https://SEU-DOMINIO.up.railway.app"
```

---

## Passo 6 — Push e testar no GitHub Pages

```powershell
cd C:\experiencia
git add projetos/sistema-legal/index.html projetos/sistema-legal/admin.html projetos/sistema-legal/cliente.html
git commit -m "Configurar api-base-url para produção"
git push origin main
```

Aguardar 1–3 minutos (GitHub Actions). Depois abrir:

```
https://mchantre28.github.io/https-github.com-mchantre28-Sistema-Legal-prontos/
```

**Testar login:**

| Perfil | Email | Password |
|--------|-------|----------|
| Admin | `solicitadora@sistema-legal.pt` | `admin123` |
| Cliente | `cliente@sistema-legal.pt` | `cliente123` |

> Na primeira vez, o assistente pode precisar de correr `npm run seed` no Railway para criar estes utilizadores. Diga-nos se o login falhar com "credenciais inválidas".

---

## O que NÃO o assistente pode fazer

- Entrar na sua conta Railway
- Clicar botões no painel Railway por si
- Gerar o domínio na sua conta

**Tem de fazer os Passos 1–4.** Depois envia o URL (Passo 5, Opção A).

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| Erro de rede no login | `api-base-url` em falta ou URL errado → Passo 5 |
| `/api/health` não abre | Deploy ainda a correr ou domínio não gerado → Passo 4 |
| "Credenciais inválidas" | Pedir ao assistente para correr o seed no Railway |
| Login funciona no PC mas não no GitHub | Normal sem Railway — completar este guia |

---

## Documentação completa

- `DEPLOY-GITHUB-PAGES.md` — GitHub Pages + backend
- `DEPLOY.md` — referência técnica (Vercel, Render, variáveis)
