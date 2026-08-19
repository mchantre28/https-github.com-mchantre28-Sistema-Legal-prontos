/**
 * Adaptador PostgreSQL (Neon) para o Sistema Legal.
 * Usa a variável de ambiente DATABASE_URL.
 */
const { Pool } = require('pg');

let _pool = null;

function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    _pool.on('error', (err) => {
      console.error('[PG] Erro inesperado na pool:', err.message);
    });
  }
  return _pool;
}

async function query(text, params) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS utilizadores (
      id        SERIAL PRIMARY KEY,
      nome      TEXT    NOT NULL,
      email     TEXT    NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      perfil    TEXT    NOT NULL CHECK (perfil IN ('admin','cliente')),
      must_change_password INTEGER NOT NULL DEFAULT 0,
      telefone  TEXT,
      created_at TEXT   NOT NULL DEFAULT (to_char(NOW() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS processos (
      id               SERIAL PRIMARY KEY,
      numero_processo  TEXT NOT NULL UNIQUE,
      titulo           TEXT NOT NULL,
      descricao        TEXT,
      estado           TEXT NOT NULL DEFAULT 'aberto',
      cliente_id       INTEGER NOT NULL REFERENCES utilizadores(id),
      created_at       TEXT NOT NULL DEFAULT (to_char(NOW() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')),
      updated_at       TEXT NOT NULL DEFAULT (to_char(NOW() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS tramites (
      id           SERIAL PRIMARY KEY,
      processo_id  INTEGER NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
      data_tramite TEXT NOT NULL,
      titulo       TEXT NOT NULL,
      descricao    TEXT,
      created_at   TEXT NOT NULL DEFAULT (to_char(NOW() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS documentos (
      id              SERIAL PRIMARY KEY,
      processo_id     INTEGER NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
      nome_ficheiro   TEXT NOT NULL,
      url_ficheiro    TEXT NOT NULL,
      visivel_cliente INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (to_char(NOW() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    )
  `);
  await query('CREATE INDEX IF NOT EXISTS idx_processos_cliente   ON processos(cliente_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_tramites_processo   ON tramites(processo_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_documentos_processo ON documentos(processo_id)');
  console.log('[PG] Schema inicializado.');
}

module.exports = { query, initSchema, getPool };
