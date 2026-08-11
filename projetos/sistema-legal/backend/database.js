const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function resolveDataDir() {
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR);
  }
  // Render: preferir /var/data (ver render.yaml) ou caminho legado do Blueprint
  const candidates = [
    '/var/data',
    '/opt/render/project/src/projetos/sistema-legal/backend/data',
  ];
  if (process.env.RENDER === 'true' || process.env.RENDER_SERVICE_ID) {
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) return candidate;
      } catch (e) { /* tenta seguinte */ }
    }
  }
  return path.join(__dirname, 'data');
}

const DATA_DIR = resolveDataDir();
const DB_PATH = path.join(DATA_DIR, 'sistema-legal.db');
/**
 * Persistente só com Persistent Disk no Render (mount tipicamente /var/data)
 * ou HAS_PERSISTENT_DISK=true. Só definir DATA_DIR no Free NÃO evita perda de dados.
 */
const IS_EPHEMERAL = !(
  process.env.RENDER_DISK_MOUNT_PATH
  || String(process.env.HAS_PERSISTENT_DISK || '').toLowerCase() === 'true'
  || (process.env.DATA_DIR && String(process.env.DATA_DIR).startsWith('/var/data'))
);

let db = null;

function getDb() {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = FULL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    if (IS_EPHEMERAL && (process.env.NODE_ENV === 'production' || process.env.RENDER)) {
      console.warn('[AVISO] Disco efémero — a base SQLite pode ser apagada em cada restart/deploy. No Render Free: ative Persistent Disk (plano pago) ou use base externa (ex. Neon).');
    }
    console.log('[DB] ficheiro:', DB_PATH);
  }
  return db;
}

function persistDb() {
  const database = getDb();
  try {
    database.pragma('wal_checkpoint(FULL)');
  } catch (e) {
    console.warn('wal_checkpoint falhou:', e.message);
  }
}

function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS utilizadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      perfil TEXT NOT NULL CHECK (perfil IN ('admin', 'cliente')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS processos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_processo TEXT NOT NULL UNIQUE,
      titulo TEXT NOT NULL,
      descricao TEXT,
      estado TEXT NOT NULL DEFAULT 'aberto',
      cliente_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (cliente_id) REFERENCES utilizadores(id)
    );

    CREATE TABLE IF NOT EXISTS tramites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      processo_id INTEGER NOT NULL,
      data_tramite TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      processo_id INTEGER NOT NULL,
      nome_ficheiro TEXT NOT NULL,
      url_ficheiro TEXT NOT NULL,
      visivel_cliente INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_processos_cliente ON processos(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_tramites_processo ON tramites(processo_id);
    CREATE INDEX IF NOT EXISTS idx_documentos_processo ON documentos(processo_id);
  `);
  migrateSchema(database);
}

function migrateSchema(database) {
  let cols = database.prepare('PRAGMA table_info(utilizadores)').all();
  const hasMustChange = cols.some(function (c) { return c.name === 'must_change_password'; });
  if (!hasMustChange) {
    database.exec(`
      ALTER TABLE utilizadores
      ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0
    `);
    cols = database.prepare('PRAGMA table_info(utilizadores)').all();
  }
  const hasTelefone = cols.some(function (c) { return c.name === 'telefone'; });
  if (!hasTelefone) {
    database.exec(`
      ALTER TABLE utilizadores
      ADD COLUMN telefone TEXT
    `);
  }
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  getDb,
  initSchema,
  closeDb,
  persistDb,
  DB_PATH,
  DATA_DIR,
  IS_EPHEMERAL,
};
