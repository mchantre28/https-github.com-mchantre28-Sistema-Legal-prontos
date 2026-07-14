# Sistema Legal — GitHub Pages

Guia para publicar o **frontend** no GitHub Pages e ligá-lo ao **backend** (Railway/Render).

---

## URL esperada

Repositório: `mchantre28/https-github.com-mchantre28-Sistema-Legal-prontos`

| Página | URL |
|--------|-----|
| Entrada | `https://mchantre28.github.io/https-github.com-mchantre28-Sistema-Legal-prontos/` |
| Login | `…/index.html` |
| Admin | `…/admin.html` |
| Cliente | `…/cliente.html` |

> URLs antigas com `/projetos/sistema-legal/` deixam de ser necessárias após ativar o workflow de deploy (publica na raiz do site).

---

## Porque o login falha no GitHub (sem backend)

| Componente | Local (`localhost:8000`) | GitHub Pages |
|------------|--------------------------|--------------|
| Frontend HTML/CSS/JS | ✅ `npx serve` | ✅ GitHub Pages (estático) |
| API Node.js (`/api/login`, JWT, SQLite) | ✅ `localhost:3001` | ❌ **Não existe** — Pages não executa Node.js |
| `api-base-url` | Vazio → usa `localhost:3001` (funciona no PC) | Vazio → tenta `localhost:3001` (**falha** no browser remoto) |

**Conclusão:** GitHub Pages mostra o ecrã de login, mas o **login só funciona** quando o backend está publicado (Railway/Render) e a meta tag `api-base-url` aponta para esse URL.

---

## Passo 1 — Ativar GitHub Pages (workflow)

1. No GitHub: **Settings → Pages → Build and deployment → Source**
2. Escolher **GitHub Actions** (não "Deploy from a branch")
3. Fazer push do repositório com o workflow `.github/workflows/deploy-github-pages.yml`
4. Aguardar 1–3 minutos; verificar **Actions** → workflow "Deploy GitHub Pages — Sistema Legal"

---

## Passo 2 — Deploy do backend (Railway)

```powershell
cd C:\experiencia\projetos\sistema-legal\backend
npx @railway/cli login
npx @railway/cli init
npx @railway/cli variables set JWT_SECRET="SEU_SEGREDO_FORTE_MIN_32_CHARS"
npx @railway/cli up
```

No painel Railway:

- **Root Directory:** `projetos/sistema-legal/backend`
- **Volume** em `/app/data` (SQLite)
- **Generate Domain** → copiar URL (ex.: `https://sistema-legal-api-xxxx.up.railway.app`)

Verificar:

```powershell
curl https://SEU-DOMINIO.up.railway.app/api/health
# → {"status":"ok","servico":"sistema-legal-api"}
```

Primeira vez: `npx @railway/cli run npm run seed`

---

## Passo 3 — Configurar `api-base-url` no frontend

Editar **os três ficheiros** e descomentar a meta tag com o URL do Railway:

- `projetos/sistema-legal/index.html`
- `projetos/sistema-legal/admin.html`
- `projetos/sistema-legal/cliente.html`

```html
<meta name="api-base-url" content="https://SEU-DOMINIO.up.railway.app">
```

Regras: HTTPS, sem barra final, mesmo URL nos três ficheiros.

---

## Passo 4 — Push e verificação

```powershell
cd C:\experiencia
git add projetos/sistema-legal/index.html projetos/sistema-legal/admin.html projetos/sistema-legal/cliente.html
git commit -m "Configurar api-base-url para produção"
git push origin main
```

Testar:

1. Abrir `https://mchantre28.github.io/https-github.com-mchantre28-Sistema-Legal-prontos/`
2. Ecrã de login deve aparecer (sem ficar preso em "A carregar…")
3. Login admin: `solicitadora@sistema-legal.pt` / `admin123`
4. Login cliente: `cliente@sistema-legal.pt` / `cliente123`

---

## Desenvolvimento local (referência)

```powershell
# Terminal 1 — API
cd projetos/sistema-legal/backend && npm start

# Terminal 2 — Frontend
cd projetos/sistema-legal && npx serve -p 8000
```

Abrir: `http://localhost:8000` — `api-base-url` pode ficar vazio (usa `localhost:3001`).

---

## Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| 404 em `admin.html` na raiz antiga | Site servido da pasta errada | Ativar workflow GitHub Actions (Passo 1) |
| "A carregar…" eternamente | `script.js` não carrega ou erro JS | F12 → Console; confirmar deploy do workflow |
| Erro de rede no login | API em `localhost:3001` | Configurar `api-base-url` + backend Railway |
| Página sem estilos | Caminho base incorreto | Usar URL oficial do Passo 1 |
| Workflow não corre | Source ainda em "branch" | Mudar para GitHub Actions em Settings → Pages |

---

## Documentação relacionada

- `DEPLOY-PASSO-A-PASSO.md` — Vercel + Railway (alternativa à Pages)
- `DEPLOY.md` — referência técnica completa
