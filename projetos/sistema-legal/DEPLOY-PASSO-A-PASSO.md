# Sistema Legal — Deploy em Produção (Passo a Passo)

Guia operacional para colocar o **frontend na Vercel** e o **backend no Railway**.  
Requer login interativo nas plataformas — não pode ser concluído apenas pelo agente.

---

## Estado verificado (ambiente local)

| Item | Resultado |
|------|-----------|
| `vercel.json` na raiz do monorepo | ✅ `rootDirectory: projetos/sistema-legal` |
| `backend/railway.json` | ✅ `npm install` + `npm start` |
| `backend/render.yaml` | ✅ alternativa ao Railway |
| Projeto Vercel ligado (`.vercel/`) | ❌ ainda não |
| Projeto Railway ligado | ❌ ainda não |
| `gh` CLI | ❌ não instalado |
| `vercel` / `railway` globais | ❌ usar `npx` (funciona) |
| Backend local `GET /api/health` | ✅ `{"status":"ok","servico":"sistema-legal-api"}` |
| Repositório GitHub | `origin` → `mchantre28/https-github.com-mchantre28-Sistema-Legal-prontos` |

---

## Ordem de operações (resumo)

1. Instalar CLIs (opcional mas recomendado)
2. Garantir código no GitHub
3. **Backend primeiro** (Railway) → obter URL pública
4. Configurar `api-base-url` nos 3 HTML
5. **Frontend depois** (Vercel)
6. Verificar login e endpoints

---

## 0. Instalar ferramentas (Windows PowerShell)

```powershell
# GitHub CLI (opcional — para verificar repo e PRs)
winget install GitHub.cli

# Vercel e Railway globais (opcional — pode usar npx)
npm install -g vercel @railway/cli
```

Sem instalação global, use sempre o prefixo `npx`:

```powershell
npx vercel --version
npx @railway/cli --version
```

---

## 1. Garantir código no GitHub

```powershell
cd C:\experiencia
git status
git add projetos/sistema-legal
git commit -m "Preparar deploy Sistema Legal (Vercel + Railway)"
git push origin main
```

> **Nota:** Não commitar ficheiros `.env`, `*.db`, `uploads/*` (exceto `.gitkeep`).

---

## 2. Backend — Railway (recomendado)

### 2.1 Login

```powershell
cd C:\experiencia\projetos\sistema-legal\backend
npx @railway/cli login
```

Abra o browser quando solicitado e autorize o acesso.

### 2.2 Criar e ligar projeto

**Opção A — CLI:**

```powershell
npx @railway/cli init
# Escolha: "Create a new project" → nome sugerido: sistema-legal-api
```

**Opção B — Painel web (alternativa):**

1. Aceda a [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Selecione o repositório `Sistema-Legal-prontos`
4. **Root Directory:** `projetos/sistema-legal/backend`
5. **Start Command:** `npm start`
6. **Build Command:** `npm install` (primeira vez: `npm install && npm run seed`)

### 2.3 Variáveis de ambiente (obrigatório)

Gere um segredo forte (mín. 32 caracteres). Exemplo PowerShell:

```powershell
# Gerar segredo aleatório (copie o resultado)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

Defina no Railway:

```powershell
npx @railway/cli variables set JWT_SECRET="COLE_AQUI_O_SEGREDO_GERADO"
```

Ou no painel: **Service → Variables → Add Variable**

| Variável | Obrigatória | Valor |
|----------|-------------|-------|
| `JWT_SECRET` | **Sim** | Segredo forte (≥32 chars). **Nunca** commitar. |
| `PORT` | Não | Railway define automaticamente |
| `NODE_ENV` | Não | `production` (opcional) |

### 2.4 Volume persistente (SQLite)

No painel Railway:

1. **Service → Settings → Volumes → Add Volume**
2. Montar em: `/app/data`
3. Tamanho: 1 GB (mínimo)

> A base de dados fica em `backend/data/sistema-legal.db`. Sem volume, os dados perdem-se a cada redeploy.

**Uploads:** ficheiros em `backend/uploads/` também precisam de persistência se forem importantes. Considere um segundo volume em `/app/uploads` ou backup periódico.

### 2.5 Seed (primeira vez)

Após o primeiro deploy, executar seed para criar utilizadores de teste:

```powershell
npx @railway/cli run npm run seed
```

Credenciais de desenvolvimento (alterar em produção real):

- Admin: `solicitadora@sistema-legal.pt` / `admin123`
- Cliente: `cliente@sistema-legal.pt` / `cliente123`

### 2.6 Domínio público

No painel: **Service → Settings → Networking → Generate Domain**

Anote o URL, por exemplo:

```
https://sistema-legal-api-production-xxxx.up.railway.app
```

### 2.7 Verificar backend

```powershell
curl https://SEU-DOMINIO.up.railway.app/api/health
```

Resposta esperada:

```json
{"status":"ok","servico":"sistema-legal-api"}
```

### 2.8 Deploy via CLI (alternativa ao GitHub auto-deploy)

```powershell
cd C:\experiencia\projetos\sistema-legal\backend
npx @railway/cli up
```

---

## 3. Configurar URL da API no frontend

Após ter o URL do Railway, edite **os três ficheiros**:

- `projetos/sistema-legal/index.html`
- `projetos/sistema-legal/admin.html`
- `projetos/sistema-legal/cliente.html`

Em cada um, localize o bloco de comentário `PRODUÇÃO` e **descomente** a meta tag, preenchendo o URL real:

```html
<meta name="api-base-url" content="https://SEU-DOMINIO.up.railway.app">
```

Regras:

- URL **sem barra final**
- Deve ser **HTTPS**
- Os três ficheiros devem ter o **mesmo** URL

Commit e push:

```powershell
cd C:\experiencia
git add projetos/sistema-legal/index.html projetos/sistema-legal/admin.html projetos/sistema-legal/cliente.html
git commit -m "Configurar api-base-url para produção"
git push origin main
```

---

## 4. Frontend — Vercel

### 4.1 Login

```powershell
cd C:\experiencia
npx vercel login
```

Siga o link no browser (fluxo OAuth device).

### 4.2 Ligar projeto

```powershell
npx vercel link
```

Responda às perguntas:

- **Set up and deploy?** → Yes (ou link a projeto existente)
- **Which scope?** → a sua conta/equipa
- **Link to existing project?** → No (primeira vez) ou Yes (se já existir)
- **Project name:** `sistema-legal`
- **In which directory is your code located?** → `./` (raiz do monorepo)

O `vercel.json` na raiz já define `rootDirectory: "projetos/sistema-legal"`.

### 4.3 Deploy de produção

```powershell
cd C:\experiencia
npx vercel --prod
```

### 4.4 Alternativa — Painel web

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository
2. Selecione o repositório GitHub
3. **Root Directory:** deixar vazio (o `vercel.json` na raiz trata disso) **ou** definir `projetos/sistema-legal`
4. **Framework Preset:** Other (site estático)
5. **Build Command:** vazio
6. **Output Directory:** vazio
7. Deploy

### 4.5 Domínio personalizado (opcional)

Vercel → **Project → Settings → Domains** → adicionar domínio e configurar DNS.

---

## 5. CORS (backend)

O `server.js` usa `app.use(cors())` — aceita pedidos de **qualquer origem**.  
Isto funciona imediatamente com o frontend na Vercel **sem alterações**.

Para restringir em produção (opcional), substitua em `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'https://SEU-PROJETO.vercel.app',
    'https://www.seudominio.pt'
  ],
  credentials: true
}));
```

Depois: novo deploy no Railway.

---

## 6. Verificação final

| Teste | Comando / Ação | Resultado esperado |
|-------|----------------|-------------------|
| Health API | `curl https://API.../api/health` | `status: ok` |
| Frontend estático | Abrir `https://PROJETO.vercel.app/api.js` | JavaScript (não HTML) |
| Login admin | `index.html` → admin | Redireciona para `admin.html` |
| Login cliente | `index.html` → cliente | Redireciona para `cliente.html` |
| Processos admin | `admin.html` | Lista carrega sem erro de rede |
| Processos cliente | `cliente.html` | Dados visíveis |

Se o login falhar com erro de rede, confirme:

1. `api-base-url` correto nos 3 HTML
2. Novo deploy Vercel após alterar HTML
3. `JWT_SECRET` definido no Railway
4. Backend acessível via HTTPS

---

## 7. Alternativa — Render (em vez de Railway)

Ficheiro: `backend/render.yaml`

1. [render.com](https://render.com) → **New Web Service** → GitHub repo
2. **Root Directory:** `projetos/sistema-legal/backend`
3. **Build:** `npm install`
4. **Start:** `npm start`
5. Variável `JWT_SECRET` (manual)
6. Disco persistente para `data/` (plano pago)
7. Após deploy, usar o URL Render no `api-base-url`

---

## 8. Comandos rápidos (referência)

```powershell
# === BACKEND ===
cd C:\experiencia\projetos\sistema-legal\backend
npx @railway/cli login
npx @railway/cli init
npx @railway/cli variables set JWT_SECRET="SEU_SEGREDO"
npx @railway/cli up
npx @railway/cli run npm run seed
curl https://SEU-DOMINIO.up.railway.app/api/health

# === FRONTEND ===
cd C:\experiencia
npx vercel login
npx vercel link
npx vercel --prod
```

---

## 9. Troubleshooting

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| Login falha / Network Error | `api-base-url` em falta ou errado | Corrigir meta tag + redeploy Vercel |
| `401` em todos os pedidos | `JWT_SECRET` alterado após tokens emitidos | Fazer logout e login novamente |
| Dados desaparecem | Sem volume Railway | Adicionar volume em `/app/data` |
| `api.js` devolve HTML | Rota Vercel incorreta | Confirmar `vercel.json` na raiz |
| Porta 3001 ocupada localmente | Backend já a correr | Normal em dev; usar o existente |

---

## Documentação relacionada

- `DEPLOY.md` — referência técnica completa
- `backend/README.md` — endpoints e variáveis
- `backend/railway.json` — config Railway
- `vercel.json` (raiz do monorepo) — config Vercel
