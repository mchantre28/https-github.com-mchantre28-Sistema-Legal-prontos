# Sistema Legal — Guia de Deploy

Este documento descreve como colocar o frontend estático e a API Node.js em produção. **Não inclui deploy automático** — serve como referência para configuração manual com credenciais do utilizador.

## Arquitetura

| Componente | Tecnologia | Pasta |
|------------|------------|-------|
| Frontend   | HTML/CSS/JS estático | `projetos/sistema-legal/` |
| Backend    | Node.js + Express + SQLite | `projetos/sistema-legal/backend/` |

O frontend comunica com a API via `api.js`, usando JWT em `localStorage`.

---

## Pré-requisitos

- Conta [GitHub](https://github.com), [Vercel](https://vercel.com) e [Railway](https://railway.app) ou [Render](https://render.com)
- CLI instaladas: `gh`, `vercel`, `railway` (opcional)

```bash
# Verificar instalação
gh auth status
vercel --version
railway --version   # opcional
```

---

## 1. Frontend (Vercel)

O repositório inclui `vercel.json` na raiz com `rootDirectory: "projetos/sistema-legal"`.

As rotas servem ficheiros estáticos (`admin.html`, `cliente.html`, `api.js`, CSS/JS) e só redirecionam para `index.html` quando o pedido não corresponde a um ficheiro existente.

### Passos via painel web

1. Ligar o repositório GitHub à [Vercel](https://vercel.com).
2. Confirmar que o **Root Directory** é `projetos/sistema-legal` (ou usar o `vercel.json` na raiz do monorepo).
3. Não é necessário comando de build — ficheiros estáticos servidos diretamente.
4. Após deploy do backend, definir a URL da API no frontend (secção 3).

### Passos via Vercel CLI

```bash
cd C:\experiencia
vercel login
vercel link          # associar ao projeto existente ou criar novo
vercel --prod        # deploy de produção
```

O `vercel.json` na raiz do monorepo já define `rootDirectory` e rotas corretas.

### Verificação pós-deploy frontend

- `https://SEU-DOMINIO.vercel.app/admin.html` — painel administrativo
- `https://SEU-DOMINIO.vercel.app/cliente.html` — área do cliente
- `https://SEU-DOMINIO.vercel.app/api.js` — deve devolver JavaScript (não HTML)

---

## 2. Backend (Railway / Render)

### Requisitos

- Node.js 18+
- Volume persistente para SQLite (`backend/data/`) e uploads (`backend/uploads/`)

### Railway (recomendado para SQLite)

Ficheiro de referência: `backend/railway.json`.

1. `railway login`
2. Na pasta do backend:

```bash
cd projetos/sistema-legal/backend
railway init
railway link          # ou criar projeto novo
railway variables set JWT_SECRET="sua-chave-longa-aleatoria-min-32-chars"
railway up
```

3. No painel Railway:
   - **Root Directory:** `projetos/sistema-legal/backend`
   - **Start Command:** `npm start`
   - **Build Command:** `npm install` (primeira vez: `npm install && npm run seed`)
   - Adicionar **volume** montado em `/app/data` para persistir a base de dados
4. Copiar a URL pública (ex.: `https://sistema-legal-api.up.railway.app`)

### Render

Ficheiro de referência: `backend/render.yaml`.

1. Painel Render → **New Web Service** → repositório GitHub
2. **Root Directory:** `projetos/sistema-legal/backend`
3. **Build:** `npm install`
4. **Start:** `npm start`
5. **Disk** persistente para `data/` e `uploads/` (plano pago)
6. Variável `JWT_SECRET` (obrigatória em produção)

### Arranque local (referência)

```bash
cd projetos/sistema-legal/backend
cp .env.example .env    # editar JWT_SECRET
npm install
npm run seed            # primeira vez
npm start               # http://localhost:3001
```

---

## 3. Variáveis de ambiente

### Backend

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `JWT_SECRET` | **Sim (produção)** | Segredo forte para assinar tokens JWT. Ver `backend/.env.example`. |
| `PORT` | Não | Porta do servidor (predefinição: `3001`). Railway/Render definem automaticamente. |

### Frontend — URL da API

O `api.js` resolve a base URL nesta ordem:

1. `window.API_BASE_URL` (definido antes de carregar `api.js`)
2. Meta tag `<meta name="api-base-url" content="https://...">` no HTML
3. Predefinição: `http://localhost:3001`

**Antes do deploy de produção**, descomentar e preencher em `index.html`, `admin.html` e `cliente.html`:

```html
<meta name="api-base-url" content="https://sua-api.railway.app">
```

Substituir `https://sua-api.railway.app` pela URL real do backend.

---

## 4. CORS e segurança

- O backend aceita pedidos de qualquer origem (`cors()` em `server.js`). Em produção restritiva, configure origens permitidas.
- `JWT_SECRET` forte, HTTPS em ambos os serviços, backups do volume SQLite.
- Credenciais de seed (`admin123` / `cliente123`) são apenas para desenvolvimento.

---

## 5. Fluxo completo (checklist)

```bash
# 1. Garantir código no GitHub
cd C:\experiencia
gh repo view          # confirmar remote
git push origin main  # se necessário

# 2. Deploy backend (Railway)
cd projetos/sistema-legal/backend
railway variables set JWT_SECRET="..."
railway up
# Anotar URL: https://....railway.app

# 3. Configurar meta api-base-url nos 3 HTML com a URL do backend
#    index.html, admin.html, cliente.html

# 4. Deploy frontend (Vercel)
cd C:\experiencia
vercel --prod

# 5. Verificar
curl https://SUA-API.railway.app/api/health
# → {"status":"ok","servico":"sistema-legal-api"}
```

---

## 6. Verificação pós-deploy

1. `GET https://sua-api.../api/health` → `{ "status": "ok" }`
2. Abrir `https://seu-frontend.../index.html` → login admin e cliente.
3. Admin → `admin.html` (lista de processos, editar/eliminar).
4. Cliente → `cliente.html` (processos, trâmites, documentos visíveis).

### Testes locais (antes do deploy)

```bash
# Terminal 1 — API
cd projetos/sistema-legal/backend && npm start

# Terminal 2 — Frontend
cd projetos/sistema-legal && npx serve -p 8000

# Terminal 3 — Playwright
cd projetos/sistema-legal && npx playwright test
```

---

## 7. Documentação relacionada

- **MIGRACAO-SPA.md** — Fase 1 (API JWT) e itens da Fase 2 (migração completa Firebase → API).
- **backend/README.md** — endpoints e credenciais de desenvolvimento.
