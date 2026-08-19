const bcrypt = require('bcryptjs');
const { query } = require('./database-pg');

const SALT_ROUNDS = 10;

const SEED_ADMIN = {
  nome: 'Ana Paula Medina — Solicitadora',
  email: 'solicitadora@sistema-legal.pt',
  password: 'admin123',
  perfil: 'admin',
};

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
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
  const criado = await insertUserIfMissing(SEED_ADMIN);
  if (total === 0) {
    console.log('\n--- Credenciais ---');
    console.log('Admin: solicitadora@sistema-legal.pt / admin123');
    console.log('-------------------\n');
    return { seeded: true };
  }
  if (criado) {
    console.log('Seed parcial: admin em falta foi criado.');
    return { seeded: true, partial: true };
  }
  console.log('Base de dados já contém utilizadores. Seed de admin verificado.');
  return { seeded: false };
}

module.exports = { seedIfEmpty, hashPassword, SALT_ROUNDS };
