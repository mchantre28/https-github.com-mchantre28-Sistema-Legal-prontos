# Sistema Legal — Backend API

API REST em Node.js + Express + SQLite (`better-sqlite3`) para autenticação, processos, trâmites e documentos.

## Requisitos

- Node.js 18+

## Instalação e arranque

```bash
cd backend
npm install
npm run seed
npm start
```

O servidor arranca em `http://localhost:3001` (porta configurável via `PORT`).

## Credenciais de teste (seed)

| Perfil  | Email                            | Password   |
|---------|----------------------------------|------------|
| Admin   | `solicitadora@sistema-legal.pt`  | `admin123` |
| Cliente | `cliente@sistema-legal.pt`       | `cliente123` |

O seed cria também:

- 1 processo (`HER-2026-0001`) associado ao cliente teste
- 2 trâmites de exemplo
- 2 documentos (1 visível ao cliente, 1 interno)

Para repovoar a base de dados, apague `backend/data/sistema-legal.db` e execute `npm run seed` novamente.

## Variáveis de ambiente

| Variável     | Descrição                          | Predefinição                          |
|--------------|------------------------------------|---------------------------------------|
| `PORT`       | Porta do servidor                  | `3001`                                |
| `JWT_SECRET` | Segredo para tokens JWT            | valor de desenvolvimento (alterar!)   |

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

### Seed na Render (primeira vez)

O deploy **não** executa o seed automaticamente. Sem utilizadores, `POST /api/login` responde `401 Credenciais inválidas`.

**Opção A — Shell Render (recomendado, uma vez):**

1. [dashboard.render.com](https://dashboard.render.com) → serviço `sistema-legal-api` → **Shell**
2. Executar:

```bash
cd projetos/sistema-legal/backend
npm run seed
```

**Opção B — Seed no build (`render.yaml`):**

Alterar `buildCommand` para `npm install && npm run seed`. O script ignora se a base já tiver utilizadores.

**Opção C — Repovoar manualmente:**

Apagar `data/sistema-legal.db` no disco persistente e executar `npm run seed` na Shell.

## Notas

- O frontend atual (`script.js`) continua a usar Firebase/localStorage; este backend é independente e pronto para integração futura.
- Passwords são encriptadas com `bcrypt` (10 rounds).
