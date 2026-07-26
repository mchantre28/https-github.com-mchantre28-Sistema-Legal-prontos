const bcrypt = require('bcrypt');
const { getDb, closeDb } = require('./database');

const SALT_ROUNDS = 10;

const SEED_USERS = [
  {
    nome: 'Ana Paula Medina — Solicitadora',
    email: 'solicitadora@sistema-legal.pt',
    password: 'admin123',
    perfil: 'admin',
  },
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

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Popula a base de dados com utilizadores se estiver vazia (sem processos de demonstração).
 * Idempotente: não altera nada se já existirem utilizadores.
 * @param {{ closeAfter?: boolean }} options - closeAfter: fecha a ligação SQLite após o seed (CLI)
 * @returns {Promise<{ seeded: boolean }>}
 */
async function ensureSeedUsers(db) {
  const insertUser = db.prepare(`
    INSERT INTO utilizadores (nome, email, password_hash, perfil)
    VALUES (@nome, @email, @password_hash, @perfil)
  `);

  let created = 0;

  for (const user of SEED_USERS) {
    const email = user.email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM utilizadores WHERE email = ?').get(email);
    if (existing) continue;

    const password_hash = await hashPassword(user.password);
    insertUser.run({
      nome: user.nome,
      email,
      password_hash,
      perfil: user.perfil,
    });
    created += 1;
    console.log(`Utilizador de seed criado: ${email} (${user.perfil})`);
  }

  return created;
}

async function seedIfEmpty({ closeAfter = false } = {}) {
  const db = getDb();

  const wasEmpty = db.prepare('SELECT COUNT(*) AS total FROM utilizadores').get().total === 0;
  const missingSeedUsers = await ensureSeedUsers(db);

  if (!wasEmpty) {
    if (missingSeedUsers > 0) {
      console.log(`Seed parcial: ${missingSeedUsers} utilizador(es) de teste em falta foram criados.`);
      if (closeAfter) closeDb();
      return { seeded: true, partial: true };
    }
    console.log('Base de dados já contém utilizadores. Seed ignorado.');
    if (closeAfter) {
      console.log('Para repovoar, apague backend/data/sistema-legal.db e execute novamente.');
      closeDb();
    }
    return { seeded: false };
  }

  console.log('Base de dados vazia — a criar utilizadores iniciais (sem processos de demonstração)...');

  console.log('\n--- Credenciais de teste ---');
  console.log('Admin:   solicitadora@sistema-legal.pt / admin123');
  console.log('Cliente: cliente@sistema-legal.pt / cliente123');
  console.log('Cliente: cliente2@sistema-legal.pt / cliente123');
  console.log('----------------------------\n');

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

module.exports = { seedIfEmpty, ensureSeedUsers };
