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
 * Popula a base de dados com utilizadores e dados de exemplo se estiver vazia.
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

  console.log('Base de dados vazia — a executar seed automático...');

  const userIds = {};
  for (const user of SEED_USERS) {
    const email = user.email.trim().toLowerCase();
    const row = db.prepare('SELECT id FROM utilizadores WHERE email = ?').get(email);
    if (row) userIds[email] = row.id;
  }

  const clienteId = userIds['cliente@sistema-legal.pt'];
  if (!clienteId) {
    console.warn('Seed: cliente de teste em falta após ensureSeedUsers.');
    if (closeAfter) closeDb();
    return { seeded: missingSeedUsers > 0, partial: true };
  }

  const insertProcesso = db.prepare(`
    INSERT INTO processos (numero_processo, titulo, descricao, estado, cliente_id)
    VALUES (@numero_processo, @titulo, @descricao, @estado, @cliente_id)
  `);

  const processo = insertProcesso.run({
    numero_processo: 'HER-2026-0001',
    titulo: 'Herança — Espólio de Maria Santos',
    descricao: 'Processo de inventário e partilha de bens. Aguarda certidão do registo predial.',
    estado: 'em_tramitacao',
    cliente_id: clienteId,
  });

  const processoId = processo.lastInsertRowid;
  console.log(`Processo criado: HER-2026-0001 (id ${processoId})`);

  db.prepare(`
    INSERT INTO tramites (processo_id, data_tramite, titulo, descricao)
    VALUES (@processo_id, @data_tramite, @titulo, @descricao)
  `).run({
    processo_id: processoId,
    data_tramite: '2026-01-15',
    titulo: 'Abertura do processo',
    descricao: 'Processo aberto na conservatória. Requerimento de certidão predial submetido.',
  });

  db.prepare(`
    INSERT INTO tramites (processo_id, data_tramite, titulo, descricao)
    VALUES (@processo_id, @data_tramite, @titulo, @descricao)
  `).run({
    processo_id: processoId,
    data_tramite: '2026-02-03',
    titulo: 'Pedido de certidão',
    descricao: 'Certidão do registo predial solicitada ao IRN. Prazo estimado: 10 dias úteis.',
  });

  console.log('Trâmites de exemplo criados (2)');

  db.prepare(`
    INSERT INTO documentos (processo_id, nome_ficheiro, url_ficheiro, visivel_cliente)
    VALUES (@processo_id, @nome_ficheiro, @url_ficheiro, @visivel_cliente)
  `).run({
    processo_id: processoId,
    nome_ficheiro: 'requerimento-abertura.pdf',
    url_ficheiro: '/uploads/exemplo/requerimento-abertura.pdf',
    visivel_cliente: 1,
  });

  db.prepare(`
    INSERT INTO documentos (processo_id, nome_ficheiro, url_ficheiro, visivel_cliente)
    VALUES (@processo_id, @nome_ficheiro, @url_ficheiro, @visivel_cliente)
  `).run({
    processo_id: processoId,
    nome_ficheiro: 'notas-internas-solicitadora.pdf',
    url_ficheiro: '/uploads/exemplo/notas-internas.pdf',
    visivel_cliente: 0,
  });

  console.log('Documentos de exemplo criados (2)');

  const cliente2Id = userIds['cliente2@sistema-legal.pt'];
  if (cliente2Id) {
    const processo2 = insertProcesso.run({
      numero_processo: 'CON-2026-0001',
      titulo: 'Contrato de arrendamento — Rua das Flores',
      descricao: 'Elaboração e registo de contrato de arrendamento urbano.',
      estado: 'pendente',
      cliente_id: cliente2Id,
    });

    db.prepare(`
      INSERT INTO tramites (processo_id, data_tramite, titulo, descricao)
      VALUES (@processo_id, @data_tramite, @titulo, @descricao)
    `).run({
      processo_id: processo2.lastInsertRowid,
      data_tramite: '2026-03-01',
      titulo: 'Pedido de minuta',
      descricao: 'Cliente solicitou minuta de contrato de arrendamento.',
    });

    console.log('Processo do segundo cliente criado: CON-2026-0001');
  }

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
