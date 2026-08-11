const bcrypt = require('bcrypt');
const { getDb, closeDb, persistDb } = require('./database');

const SALT_ROUNDS = 10;

const SEED_ADMIN = {
  nome: 'Ana Paula Medina — Solicitadora',
  email: 'solicitadora@sistema-legal.pt',
  password: 'admin123',
  perfil: 'admin',
};

/** Só criados se SEED_TEST_CLIENTES=true (nunca em produção por defeito). */
const SEED_TEST_CLIENTES = [
  {
    nome: 'João Silva (Cliente Teste)',
    email: 'cliente@sistema-legal.pt',
    password: 'cliente123',
    perfil: 'cliente',
  },
  {
    nome: 'Maria Costa (Cliente Teste 2)',
    email: 'cliente2@sistema-legal.pt',
    password: 'cliente123',
    perfil: 'cliente',
  },
];

const TEST_CLIENT_EMAILS = SEED_TEST_CLIENTES.map((u) => u.email);

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function shouldSeedTestClientes() {
  return String(process.env.SEED_TEST_CLIENTES || '').trim().toLowerCase() === 'true';
}

async function insertUserIfMissing(db, user) {
  const email = user.email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM utilizadores WHERE email = ?').get(email);
  if (existing) return false;

  const password_hash = await hashPassword(user.password);
  db.prepare(`
    INSERT INTO utilizadores (nome, email, password_hash, perfil)
    VALUES (@nome, @email, @password_hash, @perfil)
  `).run({
    nome: user.nome,
    email,
    password_hash,
    perfil: user.perfil,
  });
  console.log(`Utilizador de seed criado: ${email} (${user.perfil})`);
  return true;
}

/**
 * Remove clientes de demonstração e respetivos processos (produção limpa).
 */
function removeTestClientes(db) {
  if (shouldSeedTestClientes()) return { removed: 0 };

  let removed = 0;
  const apagar = db.transaction(function () {
    for (const email of TEST_CLIENT_EMAILS) {
      const user = db.prepare(`
        SELECT id FROM utilizadores WHERE email = ? AND perfil = 'cliente'
      `).get(email);
      if (!user) continue;

      const processos = db.prepare('SELECT id FROM processos WHERE cliente_id = ?').all(user.id);
      const ids = processos.map((p) => p.id);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(',');
        db.prepare(`DELETE FROM documentos WHERE processo_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM tramites WHERE processo_id IN (${placeholders})`).run(...ids);
        db.prepare('DELETE FROM processos WHERE cliente_id = ?').run(user.id);
      }
      db.prepare(`DELETE FROM utilizadores WHERE id = ? AND perfil = 'cliente'`).run(user.id);
      removed += 1;
      console.log(`Cliente de teste removido: ${email}`);
    }
  });
  apagar();
  if (removed > 0 && typeof persistDb === 'function') {
    try { persistDb(); } catch (e) { /* ignore */ }
  }
  return { removed };
}

/**
 * Popula a base com o admin (e clientes de teste só se SEED_TEST_CLIENTES=true).
 * Idempotente. Em produção remove clientes de demonstração.
 */
async function ensureSeedUsers(db) {
  let created = 0;
  if (await insertUserIfMissing(db, SEED_ADMIN)) created += 1;

  if (shouldSeedTestClientes()) {
    for (const user of SEED_TEST_CLIENTES) {
      if (await insertUserIfMissing(db, user)) created += 1;
    }
  } else {
    removeTestClientes(db);
  }

  return created;
}

async function seedIfEmpty({ closeAfter = false } = {}) {
  const db = getDb();

  const wasEmpty = db.prepare('SELECT COUNT(*) AS total FROM utilizadores').get().total === 0;
  const missingSeedUsers = await ensureSeedUsers(db);

  if (!wasEmpty) {
    if (missingSeedUsers > 0) {
      console.log(`Seed parcial: ${missingSeedUsers} utilizador(es) em falta foram criados.`);
      if (closeAfter) closeDb();
      return { seeded: true, partial: true };
    }
    console.log('Base de dados já contém utilizadores. Seed de admin verificado.');
    if (closeAfter) {
      closeDb();
    }
    return { seeded: false };
  }

  console.log('Base de dados vazia — a criar admin inicial...');
  console.log('\n--- Credenciais ---');
  console.log('Admin: solicitadora@sistema-legal.pt / admin123');
  if (shouldSeedTestClientes()) {
    console.log('Cliente: cliente@sistema-legal.pt / cliente123');
    console.log('Cliente: cliente2@sistema-legal.pt / cliente123');
  }
  console.log('-------------------\n');

  if (closeAfter) {
    closeDb();
  }

  return { seeded: true };
}

if (require.main === module) {
  seedIfEmpty({ closeAfter: true }).catch((err) => {
    console.error('Erro no seed:', err);
    closeDb();
    process.exit(1);
  });
}

module.exports = {
  seedIfEmpty,
  ensureSeedUsers,
  removeTestClientes,
  hashPassword,
  SALT_ROUNDS,
  TEST_CLIENT_EMAILS,
};
