const bcrypt = require('bcryptjs');
const { query } = require('./database-pg');

const SALT_ROUNDS = 10;

const SEED_ADMIN = {
  nome: 'Ana Paula Medina — Solicitadora',
  email: 'solicitadora@sistema-legal.pt',
  password: 'admin123',
  perfil: 'admin',
};

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

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function shouldSeedTestClientes() {
  return String(process.env.SEED_TEST_CLIENTES || '').trim().toLowerCase() === 'true';
}

async function insertUserIfMissing(user) {
  const email = user.email.trim().toLowerCase();
  const existing = (await query('SELECT id FROM utilizadores WHERE email = $1', [email])).rows[0];
  if (existing) return false;
  const password_hash = await hashPassword(user.password);
  await query(
    `INSERT INTO utilizadores (nome, email, password_hash, perfil) VALUES ($1,$2,$3,$4)`,
    [user.nome, email, password_hash, user.perfil]
  );
  console.log(`Utilizador de seed criado: ${email} (${user.perfil})`);
  return true;
}

async function seedIfEmpty({ closeAfter = false } = {}) {
  const total = Number((await query('SELECT COUNT(*) AS total FROM utilizadores')).rows[0].total);
  let criados = 0;
  if (await insertUserIfMissing(SEED_ADMIN)) criados += 1;
  if (shouldSeedTestClientes()) {
    for (const user of SEED_TEST_CLIENTES) {
      if (await insertUserIfMissing(user)) criados += 1;
    }
  }
  if (total === 0) {
    console.log('\n--- Credenciais ---');
    console.log('Admin: solicitadora@sistema-legal.pt / admin123');
    console.log('-------------------\n');
    if (shouldSeedTestClientes()) {
      console.log('Cliente: cliente@sistema-legal.pt / cliente123');
      console.log('Cliente: cliente2@sistema-legal.pt / cliente123');
      console.log('-------------------\n');
    }
    return { seeded: true };
  }
  if (criados > 0) {
    console.log(`Seed parcial: ${criados} utilizador(es) em falta foram criados.`);
    return { seeded: true, partial: true };
  }
  console.log('Base de dados já contém utilizadores. Seed de admin verificado.');
  return { seeded: false };
}

module.exports = { seedIfEmpty, hashPassword, SALT_ROUNDS };
