# Sistema Legal — Backend API

API REST em Node.js + Express + SQLite (`better-sqlite3`) para autenticação, processos, trâmites e documentos.

## Requisitos

- Node.js 18+

## Instalação e arranque

```bash
cd backend
npm install
npm start
```

O servidor arranca em `http://localhost:3001` (porta configurável via `PORT`).

Se a base de dados estiver vazia (sem utilizadores), o **seed corre automaticamente** no arranque. Também pode executar `npm run seed` manualmente.

## Credenciais de teste (seed)

| Perfil  | Email                            | Password   |
|---------|----------------------------------|------------|
| Admin   | `solicitadora@sistema-legal.pt`  | `admin123` |
| Cliente | `cliente@sistema-legal.pt`       | `cliente123` |

O seed cria também:

- 1 processo (`HER-2026-0001`) associado ao cliente teste
- 2 trâmites de exemplo
- 2 documentos (1 visível ao cliente, 1 interno)

Para repovoar a base de dados, apague `backend/data/sistema-legal.db` e reinicie o servidor (ou execute `npm run seed`).

## Variáveis de ambiente

| Variável     | Descrição                          | Predefinição                          |
|--------------|------------------------------------|---------------------------------------|
| `PORT`       | Porta do servidor                  | `3001`                                |
| `JWT_SECRET` | Segredo para tokens JWT            | valor de desenvolvimento (alterar!)   |
| `EMAIL_PROVIDER` | `auto`, `resend`, `brevo` ou `smtp` | `auto` (Resend → Brevo → SMTP) |
| `RESEND_API_KEY` | API key [Resend](https://resend.com) (HTTPS, funciona no Render Free) | — |
| `BREVO_API_KEY` | API key [Brevo](https://www.brevo.com) (HTTPS, funciona no Render Free) | — |
| `EMAIL_FROM` | Remetente: `Ana Paula Medina <email@...>` | — |
| `PORTAL_URL` | URL do portal cliente no email     | — |
| `EMAIL_ESCRITORIO` | Nome do escritório no email   | `Ana Paula Medina — Solicitadora`     |
| `SMTP_HOST`  | Servidor SMTP (só plano pago Render ou local) | — |
| `SMTP_PORT`  | Porta SMTP                         | `587`                                 |
| `SMTP_USER`  | Utilizador SMTP                    | —                                     |
| `SMTP_PASS`  | Password SMTP                      | —                                     |
| `SMTP_FROM`  | Alias de `EMAIL_FROM` para SMTP    | `SMTP_USER`                      |

## Frontend (login JWT)

O ficheiro `api.js` na raiz do frontend liga o login à API:

1. Arrancar o backend (`npm start` nesta pasta).
2. Abrir `index.html` via servidor HTTP local (não `file://`).
3. Em `api.js`, alterar `API_BASE_URL` se a API não estiver em `http://localhost:3001`.
4. No ecrã de login: **Administrador** ou **Cliente** usam email/senha; após sucesso redireciona para `admin.html` ou `cliente.html`. **Convidado (código)** mantém o fluxo legado Firestore.

Credenciais de teste: ver tabela acima. O JWT fica em `localStorage` (`sl_api_token`, `sl_api_user`).


### Autenticação

```http
POST /api/login
Content-Type: application/json

{ "email": "solicitadora@sistema-legal.pt", "password": "admin123", "perfil": "admin" }
```

O campo `perfil` (`admin` | `cliente`) é opcional no servidor, mas recomendado: se enviado e não coincidir com a conta, responde `403`.

Resposta: `{ "token": "...", "utilizador": { "id", "nome", "email", "perfil" } }`

Incluir o token nas rotas protegidas:

```http
Authorization: Bearer <token>
```

### Processos

- `GET /api/processos` — lista (cliente vê apenas os seus)
- `GET /api/processos/:id`
- `POST /api/processos` — admin
- `PUT /api/processos/:id` — admin
- `DELETE /api/processos/:id` — admin

### Trâmites

- `GET /api/tramites` — opcional `?processo_id=1`
- `GET /api/tramites/:id`
- `POST /api/tramites` — admin
- `PUT /api/tramites/:id` — admin
- `DELETE /api/tramites/:id` — admin

### Documentos

- `GET /api/documentos` — opcional `?processo_id=1` (cliente só vê `visivel_cliente = 1`)
- `GET /api/documentos/:id`
- `POST /api/documentos` — admin
- `PUT /api/documentos/:id` — admin
- `DELETE /api/documentos/:id` — admin

### Email (credenciais do portal)

O **Render Free bloqueia SMTP** (portas 587/465). Use **Resend** ou **Brevo** (HTTPS):

**Resend (recomendado, ~3000 emails/mês grátis):**
1. Criar conta em [resend.com](https://resend.com)
2. **API Keys** → criar key → copiar
3. **Domains** → verificar domínio OU usar email de teste
4. No Render: `RESEND_API_KEY`, `EMAIL_FROM`, `PORTAL_URL`

**Brevo (alternativa, ~300 emails/dia grátis):**
1. Criar conta em [brevo.com](https://www.brevo.com)
2. **SMTP & API** → **API Keys** → criar
3. **Senders** → verificar email remetente
4. No Render: `BREVO_API_KEY`, `EMAIL_FROM`, `PORTAL_URL`

Com `EMAIL_PROVIDER=auto` (predefinição), usa Resend se existir key, senão Brevo, senão SMTP.

### Clientes (portal)

- `GET /api/clientes` — lista contas cliente (admin)
- `GET /api/clientes/lookup?email=` — verificar se email já tem conta (admin)
- `POST /api/clientes` — criar conta (`gerar_password`, `enviar_email`)
- `POST /api/clientes/gerar-password` — nova password temporária (`enviar_email`)
- `POST /api/clientes/enviar-credenciais` — reenviar credenciais por email (admin)
- `GET /api/email/status` — estado da configuração SMTP (admin)

### Saúde

- `GET /api/health`

## Estrutura da base de dados

- `utilizadores` — id, nome, email, password_hash, perfil (`admin` | `cliente`)
- `processos` — id, numero_processo, titulo, descricao, estado, cliente_id
- `tramites` — id, processo_id, data_tramite, titulo, descricao
- `documentos` — id, processo_id, nome_ficheiro, url_ficheiro, visivel_cliente

Ficheiro SQLite: `backend/data/sistema-legal.db`

## Deploy em produção

Ver [DEPLOY.md](../DEPLOY.md) na raiz do frontend para:

- Frontend na Vercel (`projetos/sistema-legal`)
- Backend em Railway, Render ou Fly.io
- Variáveis `JWT_SECRET`, `PORT` e configuração de `API_BASE_URL` no frontend

### Seed na Render (plano Free — sem Shell)

No **plano Free** da Render não há acesso à Shell. O seed corre **automaticamente no arranque** (`npm start`) quando a base de dados não tem utilizadores — não é necessário `npm run seed` manual.

1. Garantir que `JWT_SECRET` está definido nas variáveis de ambiente do serviço (obrigatório em produção; independente do seed).
2. O `render.yaml` usa `buildCommand: npm install` — o seed **não** corre no build, apenas no start.
3. Após o primeiro deploy com disco persistente vazio, o login funciona com as credenciais de teste da tabela acima.

**Repovoar:** apagar `data/sistema-legal.db` no disco persistente e reiniciar o serviço (ou usar Shell num plano pago: `npm run seed`).

## Notas

- O frontend atual (`script.js`) continua a usar Firebase/localStorage; este backend é independente e pronto para integração futura.
- Passwords são encriptadas com `bcrypt` (10 rounds).
