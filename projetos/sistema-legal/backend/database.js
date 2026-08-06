const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'sistema-legal.db');

let db = null;

function getDb() {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
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
  const cols = database.prepare('PRAGMA table_info(utilizadores)').all();
  const hasMustChange = cols.some(function (c) { return c.name === 'must_change_password'; });
  if (!hasMustChange) {
    database.exec(`
      ALTER TABLE utilizadores
      ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0
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
  DB_PATH,
};
