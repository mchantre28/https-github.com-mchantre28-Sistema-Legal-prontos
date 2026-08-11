const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { getDb, persistDb, DB_PATH, DATA_DIR, IS_EPHEMERAL } = require('./database');
const { seedIfEmpty, hashPassword } = require('./seed');
const emailService = require('./email');

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'sistema-legal-dev-secret-alterar-em-producao';
const JWT_EXPIRES_IN = '8h';

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']);
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function sanitizeFilename(originalName) {
  const base = path.basename(String(originalName || 'ficheiro'));
  const ext = path.extname(base).toLowerCase();
  const stem = path.basename(base, ext)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'ficheiro';
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '';
  const unique = Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex');
  return unique + '-' + stem + safeExt;
}

const uploadStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    cb(null, sanitizeFilename(file.originalname));
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('Tipo de ficheiro não permitido. Use PDF, DOC, DOCX, JPG ou PNG.'));
    }
    if (file.mimetype && !ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error('Tipo MIME do ficheiro não permitido.'));
    }
    cb(null, true);
  },
});

const app = express();

const CORS_ORIGINS = [
  'https://mchantre28.github.io',
  /^https:\/\/[\w-]+\.github\.io$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/localhost(:\d+)?$/,
  /^capacitor:\/\//,
  /^ionic:\/\//,
];

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  return CORS_ORIGINS.some((rule) => (
    typeof rule === 'string' ? rule === origin : rule.test(origin)
  ));
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedCorsOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

function sanitizeUser(row) {
  if (!row) return null;
  const { password_hash, ...user } = row;
  if ('must_change_password' in user) {
    user.must_change_password = user.must_change_password === 1;
  }
  return user;
}

function userMustChangePassword(db, userId) {
  const row = db.prepare('SELECT must_change_password FROM utilizadores WHERE id = ?').get(userId);
  return !!(row && row.must_change_password === 1);
}

function blockIfMustChangePassword(req, res, next) {
  if (req.user.perfil !== 'cliente') return next();
  const db = getDb();
  if (userMustChangePassword(db, req.user.id)) {
    return res.status(403).json({
      erro: 'Deve alterar a password antes de continuar.',
      must_change_password: true,
    });
  }
  next();
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token de autenticação em falta.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Acesso reservado a administradores.' });
  }
  next();
}

function getProcessoIfAllowed(db, processoId, user) {
  const id = Number(processoId);
  if (!Number.isInteger(id) || id <= 0) {
    return { erro: 'ID de processo inválido.', status: 400 };
  }

  const processo = db.prepare('SELECT * FROM processos WHERE id = ?').get(id);
  if (!processo) return { erro: 'Processo não encontrado.', status: 404 };
  if (user.perfil === 'cliente' && processo.cliente_id !== user.id) {
    return { erro: 'Sem permissão para aceder a este processo.', status: 403 };
  }
  return { processo };
}

// --- Auth ---

app.post('/api/login', (req, res) => {
  const { email, password, perfil } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ erro: 'Email e password são obrigatórios.' });
  }

  const perfilPedido = perfil != null ? String(perfil).trim().toLowerCase() : '';

  const db = getDb();
  const emailNorm = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM utilizadores WHERE email = ?').get(emailNorm);

  let passwordOk = false;
  if (user && user.password_hash) {
    try {
      passwordOk = bcrypt.compareSync(password, user.password_hash);
    } catch (err) {
      console.error('Erro ao validar password para', emailNorm, err.message);
      return res.status(500).json({ erro: 'Erro interno ao validar credenciais.' });
    }
  }

  if (!user || !passwordOk) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  if (perfilPedido && user.perfil !== perfilPedido) {
    return res.status(403).json({
      erro: perfilPedido === 'admin'
        ? 'Esta conta não tem perfil de administrador.'
        : perfilPedido === 'cliente'
          ? 'Esta conta não tem perfil de cliente.'
          : 'O perfil selecionado não corresponde a esta conta.',
    });
  }

  const payload = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
    must_change_password: user.must_change_password === 1,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({
    token,
    utilizador: payload,
    must_change_password: payload.must_change_password,
  });
});

app.post('/api/password/recuperar', async (req, res) => {
  const emailNorm = normalizeEmail(req.body?.email);
  if (!emailNorm) {
    return res.status(400).json({ erro: 'Email é obrigatório.' });
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT id, nome, email, perfil, created_at, must_change_password
    FROM utilizadores
    WHERE email = ? AND perfil = 'cliente'
  `).get(emailNorm);

  if (!user) {
    return res.status(404).json({
      erro: 'Não encontrámos conta de cliente com este email. Contacte a solicitadoria.',
    });
  }

  try {
    const passwordTemporaria = generateTemporaryPassword(10);
    const password_hash = await hashPassword(passwordTemporaria);
    db.prepare(`
      UPDATE utilizadores
      SET password_hash = ?, must_change_password = 1
      WHERE id = ?
    `).run(password_hash, user.id);

    res.json({
      email: user.email,
      nome: user.nome,
      password_temporaria: passwordTemporaria,
      mensagem: 'Nova password temporária gerada. Inicie sessão e altere-a de imediato.',
    });
  } catch (err) {
    console.error('Erro ao recuperar password:', err);
    res.status(500).json({ erro: 'Erro ao gerar nova password.' });
  }
});

app.post('/api/password/alterar', authMiddleware, async (req, res) => {
  const { password_atual: passwordAtual, password_nova: passwordNova } = req.body || {};
  const atual = String(passwordAtual || '');
  const nova = String(passwordNova || '');

  if (!atual || !nova) {
    return res.status(400).json({ erro: 'Password actual e nova são obrigatórias.' });
  }
  if (nova.length < 6) {
    return res.status(400).json({ erro: 'A nova password deve ter pelo menos 6 caracteres.' });
  }
  if (nova === atual) {
    return res.status(400).json({ erro: 'A nova password deve ser diferente da actual.' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM utilizadores WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ erro: 'Utilizador não encontrado.' });
  }

  let passwordOk = false;
  try {
    passwordOk = bcrypt.compareSync(atual, user.password_hash);
  } catch (err) {
    console.error('Erro ao validar password actual:', err.message);
    return res.status(500).json({ erro: 'Erro interno ao validar password.' });
  }

  if (!passwordOk) {
    return res.status(401).json({ erro: 'Password actual incorrecta.' });
  }

  try {
    const password_hash = await hashPassword(nova);
    db.prepare(`
      UPDATE utilizadores
      SET password_hash = ?, must_change_password = 0
      WHERE id = ?
    `).run(password_hash, user.id);

    const updated = db.prepare(`
      SELECT id, nome, email, perfil, created_at, must_change_password
      FROM utilizadores
      WHERE id = ?
    `).get(user.id);

    res.json({
      utilizador: sanitizeUser(updated),
      alterada: true,
    });
  } catch (err) {
    console.error('Erro ao alterar password:', err);
    res.status(500).json({ erro: 'Erro ao alterar password.' });
  }
});

app.get('/api/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, nome, email, perfil, created_at, must_change_password FROM utilizadores WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ erro: 'Utilizador não encontrado.' });
  }
  res.json({ utilizador: sanitizeUser(user) });
});

function generateTemporaryPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateClienteAccountInput(nome, email) {
  const nomeTrim = String(nome || '').trim();
  const emailNorm = normalizeEmail(email);
  if (!nomeTrim) return { erro: 'Nome é obrigatório.', status: 400 };
  if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return { erro: 'Email válido é obrigatório.', status: 400 };
  }
  return { nome: nomeTrim, email: emailNorm };
}

function normalizeTelefoneOptional(telefone) {
  if (telefone == null || String(telefone).trim() === '') return null;
  let digits = String(telefone).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('440') && digits.length > 12) digits = '44' + digits.slice(3);
  if (digits.length === 9 && /^9/.test(digits)) return '351' + digits;
  return digits;
}

const CLIENTE_PUBLIC_FIELDS = 'id, nome, email, telefone, perfil, created_at, must_change_password';

function shouldSendPortalEmail(body) {
  return body?.enviar_email !== false && body?.enviarEmail !== false;
}

function shouldSendProcessNotification(body) {
  if (process.env.EMAIL_NOTIFICACOES === 'false') return false;
  return body?.enviar_notificacao !== false && body?.enviarNotificacao !== false;
}

function getProcessoComCliente(db, processoId) {
  return db.prepare(`
    SELECT p.id, p.numero_processo, p.titulo, p.cliente_id,
           u.email AS cliente_email, u.nome AS cliente_nome, u.telefone AS cliente_telefone
    FROM processos p
    INNER JOIN utilizadores u ON u.id = p.cliente_id
    WHERE p.id = ?
  `).get(processoId);
}

async function maybeNotifyProcessUpdate({
  enviarNotificacao,
  tipo,
  processoId,
  detalheTitulo,
  detalheDescricao,
}) {
  if (!enviarNotificacao) {
    return { notificacao_enviada: false, notificacao_erro: null };
  }
  if (!emailService.isConfigured()) {
    return {
      notificacao_enviada: false,
      notificacao_erro: 'Email não configurado (defina BREVO_API_KEY no Render).',
    };
  }

  const db = getDb();
  const processo = getProcessoComCliente(db, processoId);
  if (!processo || !processo.cliente_email) {
    return { notificacao_enviada: false, notificacao_erro: 'Cliente do processo não encontrado.' };
  }

  try {
    await emailService.sendProcessUpdateNotification({
      nome: processo.cliente_nome,
      email: processo.cliente_email,
      tipo,
      processoNumero: processo.numero_processo,
      processoTitulo: processo.titulo,
      detalheTitulo,
      detalheDescricao,
    });
    return { notificacao_enviada: true, notificacao_erro: null };
  } catch (err) {
    console.error('Erro ao enviar notificação de processo:', err);
    return {
      notificacao_enviada: false,
      notificacao_erro: err.message || 'Falha ao enviar notificação.',
    };
  }
}

async function maybeSendPortalCredentials({ enviarEmail, nome, email, password, tipo }) {
  if (!enviarEmail) {
    return { email_enviado: false, email_erro: null };
  }
  if (!password) {
    return { email_enviado: false, email_erro: 'Password em falta para envio por email.' };
  }
  if (!emailService.isConfigured()) {
    return {
      email_enviado: false,
      email_erro: 'Email não configurado (defina RESEND_API_KEY ou BREVO_API_KEY no Render).',
    };
  }
  try {
    await emailService.sendPortalCredentials({ nome, email, password, tipo });
    const tipOutlook = emailService.isOutlookLikeAddress(email)
      ? 'Destinatário Outlook/Hotmail: peça ao cliente para verificar Lixo/Spam e a pasta Outros.'
      : null;
    return { email_enviado: true, email_erro: null, email_dica: tipOutlook };
  } catch (err) {
    console.error('Erro ao enviar email portal:', err);
    return {
      email_enviado: false,
      email_erro: err.message || 'Falha ao enviar email.',
      email_dica: null,
    };
  }
}

// --- Clientes (utilizadores com perfil cliente) ---

app.get('/api/clientes', authMiddleware, requireAdmin, (req, res) => {
  const db = getDb();
  const clientes = db.prepare(`
    SELECT ${CLIENTE_PUBLIC_FIELDS}
    FROM utilizadores
    WHERE perfil = 'cliente'
    ORDER BY nome ASC
  `).all().map(sanitizeUser);
  res.json({ clientes });
});

app.get('/api/clientes/lookup', authMiddleware, requireAdmin, (req, res) => {
  const emailNorm = normalizeEmail(req.query.email);
  if (!emailNorm) {
    return res.status(400).json({ erro: 'Parâmetro email é obrigatório.' });
  }
  const db = getDb();
  const cliente = db.prepare(`
    SELECT ${CLIENTE_PUBLIC_FIELDS}
    FROM utilizadores
    WHERE email = ? AND perfil = 'cliente'
  `).get(emailNorm);
  res.json({ existe: !!cliente, cliente: sanitizeUser(cliente) });
});

app.put('/api/clientes/:id', authMiddleware, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'ID de cliente inválido.' });
  }

  const db = getDb();
  const existing = db.prepare(`
    SELECT id, perfil FROM utilizadores WHERE id = ?
  `).get(id);

  if (!existing || existing.perfil !== 'cliente') {
    return res.status(404).json({ erro: 'Cliente não encontrado.' });
  }

  const { nome, telefone } = req.body || {};
  const updates = [];
  const params = { id };

  if (nome != null) {
    const nomeTrim = String(nome).trim();
    if (!nomeTrim) {
      return res.status(400).json({ erro: 'Nome não pode estar vazio.' });
    }
    updates.push('nome = @nome');
    params.nome = nomeTrim;
  }

  if (telefone !== undefined) {
    params.telefone = normalizeTelefoneOptional(telefone);
    updates.push('telefone = @telefone');
  }

  if (!updates.length) {
    return res.status(400).json({ erro: 'Nenhum campo para actualizar (nome ou telefone).' });
  }

  db.prepare(`UPDATE utilizadores SET ${updates.join(', ')} WHERE id = @id`).run(params);
  persistDb();

  const cliente = db.prepare(`
    SELECT ${CLIENTE_PUBLIC_FIELDS}
    FROM utilizadores
    WHERE id = ?
  `).get(id);

  res.json({ cliente: sanitizeUser(cliente) });
});

app.delete('/api/clientes/:id', authMiddleware, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'ID de cliente inválido.' });
  }

  const db = getDb();
  const existing = db.prepare(`
    SELECT ${CLIENTE_PUBLIC_FIELDS}
    FROM utilizadores
    WHERE id = ?
  `).get(id);

  if (!existing || existing.perfil !== 'cliente') {
    return res.status(404).json({ erro: 'Cliente não encontrado.' });
  }

  const processos = db.prepare(`
    SELECT id FROM processos WHERE cliente_id = ?
  `).all(id);
  const processoIds = processos.map((p) => p.id);
  const forcar = req.query.force === '1' || req.body?.force === true || req.body?.force === '1';

  if (processoIds.length > 0 && !forcar) {
    return res.status(409).json({
      erro: 'Este cliente tem ' + processoIds.length + ' processo(s). Confirme a eliminação para apagar também os processos associados.',
      processos: processoIds.length,
      requer_confirmacao: true,
    });
  }

  const apagar = db.transaction(function () {
    if (processoIds.length) {
      const placeholders = processoIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM documentos WHERE processo_id IN (${placeholders})`).run(...processoIds);
      db.prepare(`DELETE FROM tramites WHERE processo_id IN (${placeholders})`).run(...processoIds);
      db.prepare(`DELETE FROM processos WHERE cliente_id = ?`).run(id);
    }
    db.prepare(`DELETE FROM utilizadores WHERE id = ? AND perfil = 'cliente'`).run(id);
  });

  apagar();
  persistDb();

  res.json({
    sucesso: true,
    cliente: sanitizeUser(existing),
    processos_apagados: processoIds.length,
  });
});

app.post('/api/clientes', authMiddleware, requireAdmin, async (req, res) => {
  const { nome, email, password, gerar_password: gerarPassword, telefone } = req.body || {};
  const validado = validateClienteAccountInput(nome, email);
  if (validado.erro) return res.status(validado.status).json({ erro: validado.erro });

  const telefoneNorm = normalizeTelefoneOptional(telefone);

  const db = getDb();
  const existing = db.prepare(`
    SELECT ${CLIENTE_PUBLIC_FIELDS}
    FROM utilizadores
    WHERE email = ?
  `).get(validado.email);

  if (existing) {
    return res.status(409).json({
      erro: 'Já existe uma conta com este email.',
      cliente: sanitizeUser(existing),
    });
  }

  let plainPassword = password ? String(password) : '';
  let passwordTemporaria = null;
  if (!plainPassword || gerarPassword) {
    plainPassword = generateTemporaryPassword(10);
    passwordTemporaria = plainPassword;
  }
  if (plainPassword.length < 6) {
    return res.status(400).json({ erro: 'Password deve ter pelo menos 6 caracteres.' });
  }

  try {
    const password_hash = await hashPassword(plainPassword);
    const mustChange = gerarPassword || !password ? 1 : 0;
    const result = db.prepare(`
      INSERT INTO utilizadores (nome, email, password_hash, perfil, must_change_password, telefone)
      VALUES (?, ?, ?, 'cliente', ?, ?)
    `).run(validado.nome, validado.email, password_hash, mustChange, telefoneNorm);
    persistDb();

    const cliente = db.prepare(`
      SELECT ${CLIENTE_PUBLIC_FIELDS}
      FROM utilizadores
      WHERE id = ?
    `).get(result.lastInsertRowid);

    const emailResult = passwordTemporaria
      ? await maybeSendPortalCredentials({
          enviarEmail: shouldSendPortalEmail(req.body),
          nome: validado.nome,
          email: validado.email,
          password: passwordTemporaria,
          tipo: 'criacao',
        })
      : { email_enviado: false, email_erro: null };

    res.status(201).json({
      cliente: sanitizeUser(cliente),
      password_temporaria: passwordTemporaria,
      criado: true,
      ...emailResult,
    });
  } catch (err) {
    console.error('Erro ao criar conta cliente:', err);
    res.status(500).json({ erro: 'Erro ao criar conta de cliente.' });
  }
});

app.post('/api/clientes/gerar-password', authMiddleware, requireAdmin, async (req, res) => {
  const emailNorm = normalizeEmail(req.body?.email);
  if (!emailNorm) {
    return res.status(400).json({ erro: 'Email é obrigatório.' });
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT id, nome, email, perfil, created_at, password_hash
    FROM utilizadores
    WHERE email = ? AND perfil = 'cliente'
  `).get(emailNorm);

  if (!user) {
    return res.status(404).json({ erro: 'Conta de cliente não encontrada com este email.' });
  }

  try {
    const passwordTemporaria = generateTemporaryPassword(10);
    const password_hash = await hashPassword(passwordTemporaria);
    db.prepare(`
      UPDATE utilizadores
      SET password_hash = ?, must_change_password = 1
      WHERE id = ?
    `).run(password_hash, user.id);
    const updated = db.prepare(`
      SELECT id, nome, email, perfil, created_at, must_change_password
      FROM utilizadores
      WHERE id = ?
    `).get(user.id);

    const emailResult = await maybeSendPortalCredentials({
      enviarEmail: shouldSendPortalEmail(req.body),
      nome: user.nome,
      email: user.email,
      password: passwordTemporaria,
      tipo: 'reset',
    });

    res.json({
      cliente: sanitizeUser(updated),
      password_temporaria: passwordTemporaria,
      redefinida: true,
      ...emailResult,
    });
  } catch (err) {
    console.error('Erro ao gerar nova password cliente:', err);
    res.status(500).json({ erro: 'Erro ao gerar nova password.' });
  }
});

app.post('/api/clientes/enviar-credenciais', authMiddleware, requireAdmin, async (req, res) => {
  const { nome, email, password, password_temporaria: passwordTemporaria, tipo } = req.body || {};
  const emailNorm = normalizeEmail(email);
  const plainPassword = String(password || passwordTemporaria || '');
  if (!emailNorm) {
    return res.status(400).json({ erro: 'Email é obrigatório.' });
  }
  if (!plainPassword) {
    return res.status(400).json({ erro: 'Password temporária é obrigatória para reenvio.' });
  }

  const emailResult = await maybeSendPortalCredentials({
    enviarEmail: true,
    nome: String(nome || '').trim(),
    email: emailNorm,
    password: plainPassword,
    tipo: tipo === 'reset' ? 'reset' : 'criacao',
  });

  if (!emailResult.email_enviado) {
    return res.status(502).json({
      erro: emailResult.email_erro || 'Não foi possível enviar o email.',
      ...emailResult,
    });
  }

  res.json({ enviado: true, ...emailResult });
});

app.get('/api/email/status', authMiddleware, requireAdmin, (req, res) => {
  res.json(emailService.getPublicStatus());
});

// --- Processos ---

app.get('/api/processos', authMiddleware, blockIfMustChangePassword, (req, res) => {
  const db = getDb();
  let rows;

  if (req.user.perfil === 'admin') {
    rows = db.prepare(`
      SELECT p.*, u.email AS cliente_email, u.nome AS cliente_nome, u.telefone AS cliente_telefone
      FROM processos p
      INNER JOIN utilizadores u ON u.id = p.cliente_id
      ORDER BY p.updated_at DESC
    `).all();
  } else {
    rows = db.prepare('SELECT * FROM processos WHERE cliente_id = ? ORDER BY updated_at DESC').all(req.user.id);
  }

  res.json({ processos: rows });
});

app.get('/api/processos/:id', authMiddleware, blockIfMustChangePassword, (req, res) => {
  const db = getDb();
  const { processo, erro, status } = getProcessoIfAllowed(db, Number(req.params.id), req.user);
  if (erro) return res.status(status).json({ erro });
  res.json({ processo });
});

app.post('/api/processos', authMiddleware, requireAdmin, (req, res) => {
  const { numero_processo, titulo, descricao, estado, cliente_id, cliente_email } = req.body || {};

  if (!numero_processo || !titulo) {
    return res.status(400).json({ erro: 'numero_processo e titulo são obrigatórios.' });
  }

  const db = getDb();
  let resolvedClienteId = cliente_id ? Number(cliente_id) : null;

  if (!resolvedClienteId && cliente_email) {
    const clienteByEmail = db.prepare(
      'SELECT id FROM utilizadores WHERE email = ? AND perfil = ?'
    ).get(String(cliente_email).trim().toLowerCase(), 'cliente');
    if (!clienteByEmail) {
      return res.status(400).json({ erro: 'Cliente não encontrado com o email indicado.' });
    }
    resolvedClienteId = clienteByEmail.id;
  }

  if (!resolvedClienteId) {
    return res.status(400).json({ erro: 'cliente_email ou cliente_id é obrigatório.' });
  }

  const cliente = db.prepare('SELECT id FROM utilizadores WHERE id = ? AND perfil = ?').get(resolvedClienteId, 'cliente');
  if (!cliente) {
    return res.status(400).json({ erro: 'cliente_id inválido (utilizador cliente não encontrado).' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO processos (numero_processo, titulo, descricao, estado, cliente_id)
      VALUES (@numero_processo, @titulo, @descricao, @estado, @cliente_id)
    `).run({
      numero_processo: String(numero_processo).trim(),
      titulo: String(titulo).trim(),
      descricao: descricao || '',
      estado: estado || 'aberto',
      cliente_id: resolvedClienteId,
    });

    const processo = db.prepare(`
      SELECT p.*, u.email AS cliente_email, u.nome AS cliente_nome, u.telefone AS cliente_telefone
      FROM processos p
      INNER JOIN utilizadores u ON u.id = p.cliente_id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json({ processo });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ erro: 'Já existe um processo com este número.' });
    }
    throw err;
  }
});

app.put('/api/processos/:id', authMiddleware, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const existing = db.prepare('SELECT * FROM processos WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ erro: 'Processo não encontrado.' });
  }

  const { numero_processo, titulo, descricao, estado, cliente_id } = req.body || {};

  try {
    db.prepare(`
      UPDATE processos SET
        numero_processo = COALESCE(@numero_processo, numero_processo),
        titulo = COALESCE(@titulo, titulo),
        descricao = COALESCE(@descricao, descricao),
        estado = COALESCE(@estado, estado),
        cliente_id = COALESCE(@cliente_id, cliente_id),
        updated_at = datetime('now')
      WHERE id = @id
    `).run({
      id,
      numero_processo: numero_processo != null ? String(numero_processo).trim() : null,
      titulo: titulo != null ? String(titulo).trim() : null,
      descricao: descricao != null ? descricao : null,
      estado: estado != null ? estado : null,
      cliente_id: cliente_id != null ? cliente_id : null,
    });

    const processo = db.prepare('SELECT * FROM processos WHERE id = ?').get(id);
    res.json({ processo });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ erro: 'Já existe um processo com este número.' });
    }
    throw err;
  }
});

app.delete('/api/processos/:id', authMiddleware, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const result = db.prepare('DELETE FROM processos WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ erro: 'Processo não encontrado.' });
  }
  res.json({ sucesso: true });
});

// --- Trâmites ---

app.get('/api/tramites', authMiddleware, blockIfMustChangePassword, (req, res) => {
  const db = getDb();
  const processoId = req.query.processo_id ? Number(req.query.processo_id) : null;

  if (processoId) {
    const { processo, erro, status } = getProcessoIfAllowed(db, processoId, req.user);
    if (erro) return res.status(status).json({ erro });

    const tramites = db.prepare('SELECT * FROM tramites WHERE processo_id = ? ORDER BY data_tramite ASC, id ASC').all(processoId);
    return res.json({ tramites });
  }

  if (req.user.perfil === 'admin') {
    const tramites = db.prepare('SELECT * FROM tramites ORDER BY data_tramite DESC').all();
    return res.json({ tramites });
  }

  const tramites = db.prepare(`
    SELECT t.* FROM tramites t
    INNER JOIN processos p ON p.id = t.processo_id
    WHERE p.cliente_id = ?
    ORDER BY t.data_tramite DESC
  `).all(req.user.id);

  res.json({ tramites });
});

app.get('/api/tramites/:id', authMiddleware, blockIfMustChangePassword, (req, res) => {
  const db = getDb();
  const tramite = db.prepare('SELECT * FROM tramites WHERE id = ?').get(Number(req.params.id));
  if (!tramite) {
    return res.status(404).json({ erro: 'Trâmite não encontrado.' });
  }

  const { erro, status } = getProcessoIfAllowed(db, tramite.processo_id, req.user);
  if (erro) return res.status(status).json({ erro });

  res.json({ tramite });
});

app.post('/api/tramites', authMiddleware, requireAdmin, async (req, res) => {
  const { processo_id, data_tramite, titulo, descricao } = req.body || {};

  if (!processo_id || !data_tramite || !titulo) {
    return res.status(400).json({ erro: 'processo_id, data_tramite e titulo são obrigatórios.' });
  }

  const db = getDb();
  const processo = db.prepare('SELECT id FROM processos WHERE id = ?').get(processo_id);
  if (!processo) {
    return res.status(400).json({ erro: 'processo_id inválido.' });
  }

  const result = db.prepare(`
    INSERT INTO tramites (processo_id, data_tramite, titulo, descricao)
    VALUES (@processo_id, @data_tramite, @titulo, @descricao)
  `).run({
    processo_id,
    data_tramite,
    titulo: String(titulo).trim(),
    descricao: descricao || '',
  });

  const tramite = db.prepare('SELECT * FROM tramites WHERE id = ?').get(result.lastInsertRowid);
  const notificacao = await maybeNotifyProcessUpdate({
    enviarNotificacao: shouldSendProcessNotification(req.body),
    tipo: 'tramite',
    processoId: processo_id,
    detalheTitulo: tramite.titulo,
    detalheDescricao: tramite.descricao,
  });

  res.status(201).json({ tramite, ...notificacao });
});

app.put('/api/tramites/:id', authMiddleware, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const existing = db.prepare('SELECT * FROM tramites WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ erro: 'Trâmite não encontrado.' });
  }

  const { data_tramite, titulo, descricao } = req.body || {};

  db.prepare(`
    UPDATE tramites SET
      data_tramite = COALESCE(@data_tramite, data_tramite),
      titulo = COALESCE(@titulo, titulo),
      descricao = COALESCE(@descricao, descricao)
    WHERE id = @id
  `).run({
    id,
    data_tramite: data_tramite != null ? data_tramite : null,
    titulo: titulo != null ? String(titulo).trim() : null,
    descricao: descricao != null ? descricao : null,
  });

  const tramite = db.prepare('SELECT * FROM tramites WHERE id = ?').get(id);
  res.json({ tramite });
});

app.delete('/api/tramites/:id', authMiddleware, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const result = db.prepare('DELETE FROM tramites WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ erro: 'Trâmite não encontrado.' });
  }
  res.json({ sucesso: true });
});

// --- Documentos ---

app.get('/api/documentos', authMiddleware, blockIfMustChangePassword, (req, res) => {
  const db = getDb();
  const processoId = req.query.processo_id ? Number(req.query.processo_id) : null;

  if (processoId) {
    const { processo, erro, status } = getProcessoIfAllowed(db, processoId, req.user);
    if (erro) return res.status(status).json({ erro });

    let documentos;
    if (req.user.perfil === 'admin') {
      documentos = db.prepare('SELECT * FROM documentos WHERE processo_id = ? ORDER BY created_at DESC').all(processoId);
    } else {
      documentos = db.prepare('SELECT * FROM documentos WHERE processo_id = ? AND visivel_cliente = 1 ORDER BY created_at DESC').all(processoId);
    }
    return res.json({ documentos });
  }

  if (req.user.perfil === 'admin') {
    const documentos = db.prepare('SELECT * FROM documentos ORDER BY created_at DESC').all();
    return res.json({ documentos });
  }

  const documentos = db.prepare(`
    SELECT d.* FROM documentos d
    INNER JOIN processos p ON p.id = d.processo_id
    WHERE p.cliente_id = ? AND d.visivel_cliente = 1
    ORDER BY d.created_at DESC
  `).all(req.user.id);

  res.json({ documentos });
});

app.get('/api/documentos/:id', authMiddleware, blockIfMustChangePassword, (req, res) => {
  const db = getDb();
  const documento = db.prepare('SELECT * FROM documentos WHERE id = ?').get(Number(req.params.id));
  if (!documento) {
    return res.status(404).json({ erro: 'Documento não encontrado.' });
  }

  const { erro, status } = getProcessoIfAllowed(db, documento.processo_id, req.user);
  if (erro) return res.status(status).json({ erro });

  if (req.user.perfil === 'cliente' && !documento.visivel_cliente) {
    return res.status(403).json({ erro: 'Documento não visível para o cliente.' });
  }

  res.json({ documento });
});

app.post('/api/documentos', authMiddleware, requireAdmin, async (req, res) => {
  const { processo_id, nome_ficheiro, url_ficheiro, visivel_cliente } = req.body || {};

  if (!processo_id || !nome_ficheiro || !url_ficheiro) {
    return res.status(400).json({ erro: 'processo_id, nome_ficheiro e url_ficheiro são obrigatórios.' });
  }

  const db = getDb();
  const processo = db.prepare('SELECT id FROM processos WHERE id = ?').get(processo_id);
  if (!processo) {
    return res.status(400).json({ erro: 'processo_id inválido.' });
  }

  const visivel = visivel_cliente ? 1 : 0;
  const result = db.prepare(`
    INSERT INTO documentos (processo_id, nome_ficheiro, url_ficheiro, visivel_cliente)
    VALUES (@processo_id, @nome_ficheiro, @url_ficheiro, @visivel_cliente)
  `).run({
    processo_id,
    nome_ficheiro: String(nome_ficheiro).trim(),
    url_ficheiro: String(url_ficheiro).trim(),
    visivel_cliente: visivel,
  });

  const documento = db.prepare('SELECT * FROM documentos WHERE id = ?').get(result.lastInsertRowid);
  const notificacao = visivel
    ? await maybeNotifyProcessUpdate({
        enviarNotificacao: shouldSendProcessNotification(req.body),
        tipo: 'documento',
        processoId: processo_id,
        detalheTitulo: documento.nome_ficheiro,
        detalheDescricao: null,
      })
    : { notificacao_enviada: false, notificacao_erro: null };

  res.status(201).json({ documento, ...notificacao });
});

app.post('/api/documentos/upload', authMiddleware, requireAdmin, (req, res) => {
  upload.single('file')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ erro: 'Ficheiro demasiado grande. O limite é 10 MB.' });
      }
      return res.status(400).json({ erro: 'Erro no envio do ficheiro: ' + err.message });
    }
    if (err) {
      return res.status(400).json({ erro: err.message || 'Erro no envio do ficheiro.' });
    }

    if (!req.file) {
      return res.status(400).json({ erro: 'Ficheiro em falta.' });
    }

    const processoId = Number(req.body.processo_id);
    if (!processoId) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: 'processo_id é obrigatório.' });
    }

    const db = getDb();
    const processo = db.prepare('SELECT id FROM processos WHERE id = ?').get(processoId);
    if (!processo) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: 'processo_id inválido.' });
    }

    const nomeCustom = req.body.nome_ficheiro ? String(req.body.nome_ficheiro).trim() : '';
    const nomeFicheiro = nomeCustom || req.file.originalname || req.file.filename;
    const urlFicheiro = '/uploads/' + req.file.filename;
    const visivelCliente = req.body.visivel_cliente === '1' || req.body.visivel_cliente === 'true' || req.body.visivel_cliente === true;

    try {
      const result = db.prepare(`
        INSERT INTO documentos (processo_id, nome_ficheiro, url_ficheiro, visivel_cliente)
        VALUES (@processo_id, @nome_ficheiro, @url_ficheiro, @visivel_cliente)
      `).run({
        processo_id: processoId,
        nome_ficheiro: nomeFicheiro,
        url_ficheiro: urlFicheiro,
        visivel_cliente: visivelCliente ? 1 : 0,
      });

      const documento = db.prepare('SELECT * FROM documentos WHERE id = ?').get(result.lastInsertRowid);
      const notificacao = visivelCliente
        ? await maybeNotifyProcessUpdate({
            enviarNotificacao: shouldSendProcessNotification(req.body),
            tipo: 'documento',
            processoId,
            detalheTitulo: documento.nome_ficheiro,
            detalheDescricao: null,
          })
        : { notificacao_enviada: false, notificacao_erro: null };

      res.status(201).json({ documento, ...notificacao });
    } catch (insertErr) {
      fs.unlink(req.file.path, () => {});
      console.error('Erro ao guardar documento:', insertErr);
      res.status(500).json({ erro: 'Erro ao guardar documento.' });
    }
  });
});

app.put('/api/documentos/:id', authMiddleware, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const existing = db.prepare('SELECT * FROM documentos WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ erro: 'Documento não encontrado.' });
  }

  const { nome_ficheiro, url_ficheiro, visivel_cliente } = req.body || {};
  const novoVisivel = visivel_cliente != null ? (visivel_cliente ? 1 : 0) : null;
  const tornouVisivel = novoVisivel === 1 && existing.visivel_cliente !== 1;

  db.prepare(`
    UPDATE documentos SET
      nome_ficheiro = COALESCE(@nome_ficheiro, nome_ficheiro),
      url_ficheiro = COALESCE(@url_ficheiro, url_ficheiro),
      visivel_cliente = COALESCE(@visivel_cliente, visivel_cliente)
    WHERE id = @id
  `).run({
    id,
    nome_ficheiro: nome_ficheiro != null ? String(nome_ficheiro).trim() : null,
    url_ficheiro: url_ficheiro != null ? String(url_ficheiro).trim() : null,
    visivel_cliente: novoVisivel,
  });

  const documento = db.prepare('SELECT * FROM documentos WHERE id = ?').get(id);
  const notificacao = tornouVisivel
    ? await maybeNotifyProcessUpdate({
        enviarNotificacao: shouldSendProcessNotification(req.body),
        tipo: 'documento',
        processoId: documento.processo_id,
        detalheTitulo: documento.nome_ficheiro,
        detalheDescricao: null,
      })
    : { notificacao_enviada: false, notificacao_erro: null };

  res.json({ documento, ...notificacao });
});

app.delete('/api/documentos/:id', authMiddleware, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const result = db.prepare('DELETE FROM documentos WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ erro: 'Documento não encontrado.' });
  }
  res.json({ sucesso: true });
});

// --- Health ---

app.get('/api/health', (_req, res) => {
  try {
    const db = getDb();
    const stats = db.prepare('SELECT COUNT(*) AS utilizadores FROM utilizadores').get();
    const comTelefone = db.prepare(
      "SELECT COUNT(*) AS n FROM utilizadores WHERE perfil = 'cliente' AND telefone IS NOT NULL AND telefone != ''"
    ).get();
    const admin = db.prepare(
      "SELECT id FROM utilizadores WHERE email = 'solicitadora@sistema-legal.pt' LIMIT 1"
    ).get();
    res.json({
      status: 'ok',
      servico: 'sistema-legal-api',
      utilizadores: stats.utilizadores,
      clientes_com_whatsapp: comTelefone ? comTelefone.n : 0,
      admin_seed: !!admin,
      data_dir: DATA_DIR,
      db_path: DB_PATH,
      data_dir_env: process.env.DATA_DIR || null,
      persistente: !IS_EPHEMERAL,
      aviso: IS_EPHEMERAL
        ? 'Atenção: no Render Free a base SQLite é apagada em restart/deploy. Clientes criados no portal podem desaparecer. Solução: Persistent Disk (upgrade) ou base externa (Neon/Turso).'
        : null,
    });
  } catch (err) {
    console.error('Health check falhou:', err);
    res.status(500).json({ status: 'erro', servico: 'sistema-legal-api' });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

async function startServer() {
  getDb();
  await seedIfEmpty();
  app.listen(PORT, () => {
    console.log(`Sistema Legal API a correr em http://localhost:${PORT}`);
    console.log('Endpoints: POST /api/login, GET /api/processos, GET /api/tramites, GET /api/documentos');
  });
}

startServer().catch((err) => {
  console.error('Falha ao arrancar servidor:', err);
  process.exit(1);
});
