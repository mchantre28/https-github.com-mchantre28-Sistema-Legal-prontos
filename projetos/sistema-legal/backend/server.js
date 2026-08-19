const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { query, initSchema } = require('./database-pg');
const { seedIfEmpty, hashPassword } = require('./seed');
const emailService = require('./email');

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'sistema-legal-dev-secret-alterar-em-producao';
const JWT_EXPIRES_IN = '8h';

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']);
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function sanitizeFilename(originalName) {
  const base = path.basename(String(originalName || 'ficheiro'));
  const ext = path.extname(base).toLowerCase();
  const stem = path.basename(base, ext)
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'ficheiro';
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '';
  const unique = Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex');
  return unique + '-' + stem + safeExt;
}

const uploadStorage = multer.diskStorage({
  destination(_req, _file, cb) { cb(null, UPLOADS_DIR); },
  filename(_req, file, cb) { cb(null, sanitizeFilename(file.originalname)); },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) return cb(new Error('Tipo de ficheiro não permitido.'));
    if (file.mimetype && !ALLOWED_MIMES.has(file.mimetype)) return cb(new Error('Tipo MIME não permitido.'));
    cb(null, true);
  },
});

const app = express();

const CORS_ORIGINS = [
  'https://mchantre28.github.io',
  /^https:\/\/[\w-]+\.github\.io$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^capacitor:\/\//,
  /^ionic:\/\//,
];

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  return CORS_ORIGINS.some((r) => (typeof r === 'string' ? r === origin : r.test(origin)));
}

app.use(cors({
  origin(origin, cb) { cb(null, isAllowedCorsOrigin(origin)); },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

function sanitizeUser(row) {
  if (!row) return null;
  const { password_hash, ...user } = row;
  if ('must_change_password' in user) {
    user.must_change_password = Number(user.must_change_password) === 1;
  }
  return user;
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Token de autenticação em falta.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.perfil !== 'admin') return res.status(403).json({ erro: 'Acesso reservado a administradores.' });
  next();
}

async function blockIfMustChangePassword(req, res, next) {
  if (req.user.perfil !== 'cliente') return next();
  const r = await query('SELECT must_change_password FROM utilizadores WHERE id = $1', [req.user.id]);
  const row = r.rows[0];
  if (row && Number(row.must_change_password) === 1) {
    return res.status(403).json({ erro: 'Deve alterar a password antes de continuar.', must_change_password: true });
  }
  next();
}

function generateTemporaryPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }

function normalizeTelefoneOptional(telefone) {
  if (telefone == null || String(telefone).trim() === '') return null;
  let digits = String(telefone).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('440') && digits.length > 12) digits = '44' + digits.slice(3);
  if (digits.length === 9 && /^9/.test(digits)) return '351' + digits;
  return digits;
}

function validateClienteAccountInput(nome, email) {
  const nomeTrim = String(nome || '').trim();
  const emailNorm = normalizeEmail(email);
  if (!nomeTrim) return { erro: 'Nome é obrigatório.', status: 400 };
  if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) return { erro: 'Email válido é obrigatório.', status: 400 };
  return { nome: nomeTrim, email: emailNorm };
}

function shouldSendPortalEmail(body) { return body?.enviar_email !== false && body?.enviarEmail !== false; }
function shouldSendProcessNotification(body) {
  if (process.env.EMAIL_NOTIFICACOES === 'false') return false;
  return body?.enviar_notificacao !== false && body?.enviarNotificacao !== false;
}

async function maybeNotifyProcessUpdate({ enviarNotificacao, tipo, processoId, detalheTitulo, detalheDescricao }) {
  if (!enviarNotificacao) return { notificacao_enviada: false, notificacao_erro: null };
  if (!emailService.isConfigured()) return { notificacao_enviada: false, notificacao_erro: 'Email não configurado.' };
  const r = await query(`
    SELECT p.numero_processo, p.titulo, u.email AS cliente_email, u.nome AS cliente_nome
    FROM processos p INNER JOIN utilizadores u ON u.id = p.cliente_id WHERE p.id = $1
  `, [processoId]);
  const processo = r.rows[0];
  if (!processo || !processo.cliente_email) return { notificacao_enviada: false, notificacao_erro: 'Cliente não encontrado.' };
  try {
    await emailService.sendProcessUpdateNotification({
      nome: processo.cliente_nome, email: processo.cliente_email, tipo,
      processoNumero: processo.numero_processo, processoTitulo: processo.titulo,
      detalheTitulo, detalheDescricao,
    });
    return { notificacao_enviada: true, notificacao_erro: null };
  } catch (err) {
    return { notificacao_enviada: false, notificacao_erro: err.message || 'Falha ao enviar notificação.' };
  }
}

async function maybeSendPortalCredentials({ enviarEmail, nome, email, password, tipo }) {
  if (!enviarEmail) return { email_enviado: false, email_erro: null };
  if (!password) return { email_enviado: false, email_erro: 'Password em falta.' };
  if (!emailService.isConfigured()) return { email_enviado: false, email_erro: 'Email não configurado.' };
  try {
    await emailService.sendPortalCredentials({ nome, email, password, tipo });
    const dica = emailService.isOutlookLikeAddress?.(email)
      ? 'Destinatário Outlook/Hotmail: peça ao cliente para verificar Lixo/Spam e a pasta Outros.' : null;
    return { email_enviado: true, email_erro: null, email_dica: dica };
  } catch (err) {
    return { email_enviado: false, email_erro: err.message || 'Falha ao enviar email.', email_dica: null };
  }
}

const CLIENTE_PUBLIC_FIELDS = 'id, nome, email, telefone, perfil, created_at, must_change_password';

// ─── Auth ──────────────────────────────────────────────────────────────────

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, perfil } = req.body || {};
    if (!email || !password) return res.status(400).json({ erro: 'Email e password são obrigatórios.' });
    const perfilPedido = perfil != null ? String(perfil).trim().toLowerCase() : '';
    const emailNorm = normalizeEmail(email);
    const r = await query('SELECT * FROM utilizadores WHERE email = $1', [emailNorm]);
    const user = r.rows[0];
    let passwordOk = false;
    if (user && user.password_hash) {
      try { passwordOk = bcrypt.compareSync(password, user.password_hash); } catch (e) {
        return res.status(500).json({ erro: 'Erro interno ao validar credenciais.' });
      }
    }
    if (!user || !passwordOk) return res.status(401).json({ erro: 'Credenciais inválidas.' });
    if (perfilPedido && user.perfil !== perfilPedido) {
      return res.status(403).json({ erro: perfilPedido === 'admin' ? 'Esta conta não tem perfil de administrador.' : 'O perfil selecionado não corresponde a esta conta.' });
    }
    const payload = { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil, must_change_password: Number(user.must_change_password) === 1 };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, utilizador: payload, must_change_password: payload.must_change_password });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.post('/api/password/recuperar', async (req, res) => {
  try {
    const emailNorm = normalizeEmail(req.body?.email);
    if (!emailNorm) return res.status(400).json({ erro: 'Email é obrigatório.' });
    const r = await query(`SELECT id, nome, email FROM utilizadores WHERE email = $1 AND perfil = 'cliente'`, [emailNorm]);
    const user = r.rows[0];
    if (!user) return res.status(404).json({ erro: 'Não encontrámos conta de cliente com este email.' });
    const passwordTemporaria = generateTemporaryPassword(10);
    const password_hash = await hashPassword(passwordTemporaria);
    await query('UPDATE utilizadores SET password_hash = $1, must_change_password = 1 WHERE id = $2', [password_hash, user.id]);
    res.json({ email: user.email, nome: user.nome, password_temporaria: passwordTemporaria, mensagem: 'Nova password temporária gerada.' });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro ao gerar nova password.' }); }
});

app.post('/api/password/alterar', authMiddleware, async (req, res) => {
  try {
    const { password_atual: atual, password_nova: nova } = req.body || {};
    if (!atual || !nova) return res.status(400).json({ erro: 'Password actual e nova são obrigatórias.' });
    if (nova.length < 6) return res.status(400).json({ erro: 'A nova password deve ter pelo menos 6 caracteres.' });
    if (nova === atual) return res.status(400).json({ erro: 'A nova password deve ser diferente da actual.' });
    const r = await query('SELECT * FROM utilizadores WHERE id = $1', [req.user.id]);
    const user = r.rows[0];
    if (!user) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
    if (!bcrypt.compareSync(atual, user.password_hash)) return res.status(401).json({ erro: 'Password actual incorrecta.' });
    const password_hash = await hashPassword(nova);
    await query('UPDATE utilizadores SET password_hash = $1, must_change_password = 0 WHERE id = $2', [password_hash, user.id]);
    const updated = (await query(`SELECT ${CLIENTE_PUBLIC_FIELDS} FROM utilizadores WHERE id = $1`, [user.id])).rows[0];
    res.json({ utilizador: sanitizeUser(updated), alterada: true });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro ao alterar password.' }); }
});

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const r = await query(`SELECT ${CLIENTE_PUBLIC_FIELDS} FROM utilizadores WHERE id = $1`, [req.user.id]);
    const user = r.rows[0];
    if (!user) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
    res.json({ utilizador: sanitizeUser(user) });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

// ─── Clientes ──────────────────────────────────────────────────────────────

app.get('/api/clientes', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const r = await query(`SELECT ${CLIENTE_PUBLIC_FIELDS} FROM utilizadores WHERE perfil = 'cliente' ORDER BY nome ASC`);
    res.json({ clientes: r.rows.map(sanitizeUser) });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.get('/api/clientes/lookup', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const emailNorm = normalizeEmail(req.query.email);
    if (!emailNorm) return res.status(400).json({ erro: 'Parâmetro email é obrigatório.' });
    const r = await query(`SELECT ${CLIENTE_PUBLIC_FIELDS} FROM utilizadores WHERE email = $1 AND perfil = 'cliente'`, [emailNorm]);
    const cliente = r.rows[0] || null;
    res.json({ existe: !!cliente, cliente: sanitizeUser(cliente) });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.put('/api/clientes/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: 'ID inválido.' });
    const ex = (await query(`SELECT id, perfil FROM utilizadores WHERE id = $1`, [id])).rows[0];
    if (!ex || ex.perfil !== 'cliente') return res.status(404).json({ erro: 'Cliente não encontrado.' });
    const { nome, telefone } = req.body || {};
    const sets = []; const vals = [];
    if (nome != null) {
      const n = String(nome).trim();
      if (!n) return res.status(400).json({ erro: 'Nome não pode estar vazio.' });
      vals.push(n); sets.push(`nome = $${vals.length}`);
    }
    if (telefone !== undefined) {
      vals.push(normalizeTelefoneOptional(telefone)); sets.push(`telefone = $${vals.length}`);
    }
    if (!sets.length) return res.status(400).json({ erro: 'Nenhum campo para actualizar.' });
    vals.push(id);
    await query(`UPDATE utilizadores SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals);
    const r = await query(`SELECT ${CLIENTE_PUBLIC_FIELDS} FROM utilizadores WHERE id = $1`, [id]);
    res.json({ cliente: sanitizeUser(r.rows[0]) });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.delete('/api/clientes/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: 'ID inválido.' });
    const ex = (await query(`SELECT ${CLIENTE_PUBLIC_FIELDS} FROM utilizadores WHERE id = $1`, [id])).rows[0];
    if (!ex || ex.perfil !== 'cliente') return res.status(404).json({ erro: 'Cliente não encontrado.' });
    const processos = (await query('SELECT id FROM processos WHERE cliente_id = $1', [id])).rows;
    const forcar = req.query.force === '1' || req.body?.force === true || req.body?.force === '1';
    if (processos.length > 0 && !forcar) {
      return res.status(409).json({ erro: `Este cliente tem ${processos.length} processo(s). Confirme a eliminação.`, processos: processos.length, requer_confirmacao: true });
    }
    if (processos.length) {
      const ids = processos.map((p) => p.id);
      await query(`DELETE FROM documentos WHERE processo_id = ANY($1::int[])`, [ids]);
      await query(`DELETE FROM tramites WHERE processo_id = ANY($1::int[])`, [ids]);
      await query('DELETE FROM processos WHERE cliente_id = $1', [id]);
    }
    await query(`DELETE FROM utilizadores WHERE id = $1 AND perfil = 'cliente'`, [id]);
    res.json({ sucesso: true, cliente: sanitizeUser(ex), processos_apagados: processos.length });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.post('/api/clientes', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { nome, email, password, gerar_password: gerarPassword, telefone } = req.body || {};
    const validado = validateClienteAccountInput(nome, email);
    if (validado.erro) return res.status(validado.status).json({ erro: validado.erro });
    const telefoneNorm = normalizeTelefoneOptional(telefone);
    const ex = (await query(`SELECT ${CLIENTE_PUBLIC_FIELDS} FROM utilizadores WHERE email = $1`, [validado.email])).rows[0];
    if (ex) return res.status(409).json({ erro: 'Já existe uma conta com este email.', cliente: sanitizeUser(ex) });
    let plainPassword = password ? String(password) : '';
    let passwordTemporaria = null;
    if (!plainPassword || gerarPassword) { plainPassword = generateTemporaryPassword(10); passwordTemporaria = plainPassword; }
    if (plainPassword.length < 6) return res.status(400).json({ erro: 'Password deve ter pelo menos 6 caracteres.' });
    const password_hash = await hashPassword(plainPassword);
    const mustChange = gerarPassword || !password ? 1 : 0;
    const r = await query(
      `INSERT INTO utilizadores (nome, email, password_hash, perfil, must_change_password, telefone) VALUES ($1,$2,$3,'cliente',$4,$5) RETURNING id`,
      [validado.nome, validado.email, password_hash, mustChange, telefoneNorm]
    );
    const cliente = (await query(`SELECT ${CLIENTE_PUBLIC_FIELDS} FROM utilizadores WHERE id = $1`, [r.rows[0].id])).rows[0];
    const emailResult = passwordTemporaria
      ? await maybeSendPortalCredentials({ enviarEmail: shouldSendPortalEmail(req.body), nome: validado.nome, email: validado.email, password: passwordTemporaria, tipo: 'criacao' })
      : { email_enviado: false, email_erro: null };
    res.status(201).json({ cliente: sanitizeUser(cliente), password_temporaria: passwordTemporaria, criado: true, ...emailResult });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro ao criar conta de cliente.' }); }
});

app.post('/api/clientes/gerar-password', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const emailNorm = normalizeEmail(req.body?.email);
    if (!emailNorm) return res.status(400).json({ erro: 'Email é obrigatório.' });
    const user = (await query(`SELECT id, nome, email FROM utilizadores WHERE email = $1 AND perfil = 'cliente'`, [emailNorm])).rows[0];
    if (!user) return res.status(404).json({ erro: 'Conta de cliente não encontrada.' });
    const passwordTemporaria = generateTemporaryPassword(10);
    const password_hash = await hashPassword(passwordTemporaria);
    await query('UPDATE utilizadores SET password_hash = $1, must_change_password = 1 WHERE id = $2', [password_hash, user.id]);
    const updated = (await query(`SELECT ${CLIENTE_PUBLIC_FIELDS} FROM utilizadores WHERE id = $1`, [user.id])).rows[0];
    const emailResult = await maybeSendPortalCredentials({ enviarEmail: shouldSendPortalEmail(req.body), nome: user.nome, email: user.email, password: passwordTemporaria, tipo: 'reset' });
    res.json({ cliente: sanitizeUser(updated), password_temporaria: passwordTemporaria, redefinida: true, ...emailResult });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro ao gerar nova password.' }); }
});

app.post('/api/clientes/enviar-credenciais', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { nome, email, password, password_temporaria: pt, tipo } = req.body || {};
    const emailNorm = normalizeEmail(email);
    const plainPassword = String(password || pt || '');
    if (!emailNorm) return res.status(400).json({ erro: 'Email é obrigatório.' });
    if (!plainPassword) return res.status(400).json({ erro: 'Password temporária é obrigatória.' });
    const emailResult = await maybeSendPortalCredentials({ enviarEmail: true, nome: String(nome || '').trim(), email: emailNorm, password: plainPassword, tipo: tipo === 'reset' ? 'reset' : 'criacao' });
    if (!emailResult.email_enviado) return res.status(502).json({ erro: emailResult.email_erro || 'Não foi possível enviar o email.', ...emailResult });
    res.json({ enviado: true, ...emailResult });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.get('/api/email/status', authMiddleware, requireAdmin, (req, res) => {
  res.json(emailService.getPublicStatus());
});

// ─── Processos ─────────────────────────────────────────────────────────────

app.get('/api/processos', authMiddleware, blockIfMustChangePassword, async (req, res) => {
  try {
    let r;
    if (req.user.perfil === 'admin') {
      r = await query(`SELECT p.*, u.email AS cliente_email, u.nome AS cliente_nome, u.telefone AS cliente_telefone FROM processos p INNER JOIN utilizadores u ON u.id = p.cliente_id ORDER BY p.updated_at DESC`);
    } else {
      r = await query('SELECT * FROM processos WHERE cliente_id = $1 ORDER BY updated_at DESC', [req.user.id]);
    }
    res.json({ processos: r.rows });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.get('/api/processos/:id', authMiddleware, blockIfMustChangePassword, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: 'ID inválido.' });
    const processo = (await query('SELECT * FROM processos WHERE id = $1', [id])).rows[0];
    if (!processo) return res.status(404).json({ erro: 'Processo não encontrado.' });
    if (req.user.perfil === 'cliente' && processo.cliente_id !== req.user.id) return res.status(403).json({ erro: 'Sem permissão.' });
    res.json({ processo });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.post('/api/processos', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { numero_processo, titulo, descricao, estado, cliente_id, cliente_email } = req.body || {};
    if (!numero_processo || !titulo) return res.status(400).json({ erro: 'numero_processo e titulo são obrigatórios.' });
    let cid = cliente_id ? Number(cliente_id) : null;
    if (!cid && cliente_email) {
      const c = (await query(`SELECT id FROM utilizadores WHERE email = $1 AND perfil = 'cliente'`, [String(cliente_email).trim().toLowerCase()])).rows[0];
      if (!c) return res.status(400).json({ erro: 'Cliente não encontrado com o email indicado.' });
      cid = c.id;
    }
    if (!cid) return res.status(400).json({ erro: 'cliente_email ou cliente_id é obrigatório.' });
    const cli = (await query(`SELECT id FROM utilizadores WHERE id = $1 AND perfil = 'cliente'`, [cid])).rows[0];
    if (!cli) return res.status(400).json({ erro: 'cliente_id inválido.' });
    const r = await query(
      `INSERT INTO processos (numero_processo, titulo, descricao, estado, cliente_id) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [String(numero_processo).trim(), String(titulo).trim(), descricao || '', estado || 'aberto', cid]
    );
    const processo = (await query(`SELECT p.*, u.email AS cliente_email, u.nome AS cliente_nome, u.telefone AS cliente_telefone FROM processos p INNER JOIN utilizadores u ON u.id = p.cliente_id WHERE p.id = $1`, [r.rows[0].id])).rows[0];
    res.status(201).json({ processo });
  } catch (err) {
    if (String(err.message).includes('unique') || String(err.code) === '23505') return res.status(409).json({ erro: 'Já existe um processo com este número.' });
    console.error(err); res.status(500).json({ erro: 'Erro interno.' });
  }
});

app.put('/api/processos/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = (await query('SELECT * FROM processos WHERE id = $1', [id])).rows[0];
    if (!existing) return res.status(404).json({ erro: 'Processo não encontrado.' });
    const { numero_processo, titulo, descricao, estado, cliente_id } = req.body || {};
    const now = new Date().toISOString();
    await query(
      `UPDATE processos SET numero_processo = COALESCE($1, numero_processo), titulo = COALESCE($2, titulo), descricao = COALESCE($3, descricao), estado = COALESCE($4, estado), cliente_id = COALESCE($5, cliente_id), updated_at = $6 WHERE id = $7`,
      [numero_processo != null ? String(numero_processo).trim() : null, titulo != null ? String(titulo).trim() : null, descricao ?? null, estado ?? null, cliente_id ?? null, now, id]
    );
    const processo = (await query('SELECT * FROM processos WHERE id = $1', [id])).rows[0];
    res.json({ processo });
  } catch (err) {
    if (String(err.code) === '23505') return res.status(409).json({ erro: 'Já existe um processo com este número.' });
    console.error(err); res.status(500).json({ erro: 'Erro interno.' });
  }
});

app.delete('/api/processos/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await query('DELETE FROM processos WHERE id = $1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ erro: 'Processo não encontrado.' });
    res.json({ sucesso: true });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

// ─── Trâmites ──────────────────────────────────────────────────────────────

app.get('/api/tramites', authMiddleware, blockIfMustChangePassword, async (req, res) => {
  try {
    const processoId = req.query.processo_id ? Number(req.query.processo_id) : null;
    if (processoId) {
      const proc = (await query('SELECT * FROM processos WHERE id = $1', [processoId])).rows[0];
      if (!proc) return res.status(404).json({ erro: 'Processo não encontrado.' });
      if (req.user.perfil === 'cliente' && proc.cliente_id !== req.user.id) return res.status(403).json({ erro: 'Sem permissão.' });
      const r = await query('SELECT * FROM tramites WHERE processo_id = $1 ORDER BY data_tramite ASC, id ASC', [processoId]);
      return res.json({ tramites: r.rows });
    }
    if (req.user.perfil === 'admin') {
      const r = await query('SELECT * FROM tramites ORDER BY data_tramite DESC');
      return res.json({ tramites: r.rows });
    }
    const r = await query(`SELECT t.* FROM tramites t INNER JOIN processos p ON p.id = t.processo_id WHERE p.cliente_id = $1 ORDER BY t.data_tramite DESC`, [req.user.id]);
    res.json({ tramites: r.rows });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.get('/api/tramites/:id', authMiddleware, blockIfMustChangePassword, async (req, res) => {
  try {
    const tramite = (await query('SELECT * FROM tramites WHERE id = $1', [Number(req.params.id)])).rows[0];
    if (!tramite) return res.status(404).json({ erro: 'Trâmite não encontrado.' });
    const proc = (await query('SELECT * FROM processos WHERE id = $1', [tramite.processo_id])).rows[0];
    if (!proc) return res.status(404).json({ erro: 'Processo não encontrado.' });
    if (req.user.perfil === 'cliente' && proc.cliente_id !== req.user.id) return res.status(403).json({ erro: 'Sem permissão.' });
    res.json({ tramite });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.post('/api/tramites', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { processo_id, data_tramite, titulo, descricao } = req.body || {};
    if (!processo_id || !data_tramite || !titulo) return res.status(400).json({ erro: 'processo_id, data_tramite e titulo são obrigatórios.' });
    const proc = (await query('SELECT id FROM processos WHERE id = $1', [processo_id])).rows[0];
    if (!proc) return res.status(400).json({ erro: 'processo_id inválido.' });
    const r = await query(
      'INSERT INTO tramites (processo_id, data_tramite, titulo, descricao) VALUES ($1,$2,$3,$4) RETURNING id',
      [processo_id, data_tramite, String(titulo).trim(), descricao || '']
    );
    const tramite = (await query('SELECT * FROM tramites WHERE id = $1', [r.rows[0].id])).rows[0];
    const notificacao = await maybeNotifyProcessUpdate({ enviarNotificacao: shouldSendProcessNotification(req.body), tipo: 'tramite', processoId: processo_id, detalheTitulo: tramite.titulo, detalheDescricao: tramite.descricao });
    res.status(201).json({ tramite, ...notificacao });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.put('/api/tramites/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = (await query('SELECT * FROM tramites WHERE id = $1', [id])).rows[0];
    if (!existing) return res.status(404).json({ erro: 'Trâmite não encontrado.' });
    const { data_tramite, titulo, descricao } = req.body || {};
    await query(
      `UPDATE tramites SET data_tramite = COALESCE($1, data_tramite), titulo = COALESCE($2, titulo), descricao = COALESCE($3, descricao) WHERE id = $4`,
      [data_tramite ?? null, titulo != null ? String(titulo).trim() : null, descricao ?? null, id]
    );
    const tramite = (await query('SELECT * FROM tramites WHERE id = $1', [id])).rows[0];
    res.json({ tramite });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.delete('/api/tramites/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const r = await query('DELETE FROM tramites WHERE id = $1', [Number(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ erro: 'Trâmite não encontrado.' });
    res.json({ sucesso: true });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

// ─── Documentos ────────────────────────────────────────────────────────────

app.get('/api/documentos', authMiddleware, blockIfMustChangePassword, async (req, res) => {
  try {
    const processoId = req.query.processo_id ? Number(req.query.processo_id) : null;
    if (processoId) {
      const proc = (await query('SELECT * FROM processos WHERE id = $1', [processoId])).rows[0];
      if (!proc) return res.status(404).json({ erro: 'Processo não encontrado.' });
      if (req.user.perfil === 'cliente' && proc.cliente_id !== req.user.id) return res.status(403).json({ erro: 'Sem permissão.' });
      const r = req.user.perfil === 'admin'
        ? await query('SELECT * FROM documentos WHERE processo_id = $1 ORDER BY created_at DESC', [processoId])
        : await query('SELECT * FROM documentos WHERE processo_id = $1 AND visivel_cliente = 1 ORDER BY created_at DESC', [processoId]);
      return res.json({ documentos: r.rows });
    }
    if (req.user.perfil === 'admin') {
      const r = await query('SELECT * FROM documentos ORDER BY created_at DESC');
      return res.json({ documentos: r.rows });
    }
    const r = await query(`SELECT d.* FROM documentos d INNER JOIN processos p ON p.id = d.processo_id WHERE p.cliente_id = $1 AND d.visivel_cliente = 1 ORDER BY d.created_at DESC`, [req.user.id]);
    res.json({ documentos: r.rows });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.get('/api/documentos/:id', authMiddleware, blockIfMustChangePassword, async (req, res) => {
  try {
    const doc = (await query('SELECT * FROM documentos WHERE id = $1', [Number(req.params.id)])).rows[0];
    if (!doc) return res.status(404).json({ erro: 'Documento não encontrado.' });
    const proc = (await query('SELECT * FROM processos WHERE id = $1', [doc.processo_id])).rows[0];
    if (!proc) return res.status(404).json({ erro: 'Processo não encontrado.' });
    if (req.user.perfil === 'cliente' && proc.cliente_id !== req.user.id) return res.status(403).json({ erro: 'Sem permissão.' });
    if (req.user.perfil === 'cliente' && !doc.visivel_cliente) return res.status(403).json({ erro: 'Documento não visível para o cliente.' });
    res.json({ documento: doc });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.post('/api/documentos', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { processo_id, nome_ficheiro, url_ficheiro, visivel_cliente } = req.body || {};
    if (!processo_id || !nome_ficheiro || !url_ficheiro) return res.status(400).json({ erro: 'processo_id, nome_ficheiro e url_ficheiro são obrigatórios.' });
    const proc = (await query('SELECT id FROM processos WHERE id = $1', [processo_id])).rows[0];
    if (!proc) return res.status(400).json({ erro: 'processo_id inválido.' });
    const visivel = visivel_cliente ? 1 : 0;
    const r = await query(
      'INSERT INTO documentos (processo_id, nome_ficheiro, url_ficheiro, visivel_cliente) VALUES ($1,$2,$3,$4) RETURNING id',
      [processo_id, String(nome_ficheiro).trim(), String(url_ficheiro).trim(), visivel]
    );
    const doc = (await query('SELECT * FROM documentos WHERE id = $1', [r.rows[0].id])).rows[0];
    const notificacao = visivel ? await maybeNotifyProcessUpdate({ enviarNotificacao: shouldSendProcessNotification(req.body), tipo: 'documento', processoId: processo_id, detalheTitulo: doc.nome_ficheiro, detalheDescricao: null }) : { notificacao_enviada: false, notificacao_erro: null };
    res.status(201).json({ documento: doc, ...notificacao });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.post('/api/documentos/upload', authMiddleware, requireAdmin, (req, res) => {
  upload.single('file')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ erro: err.code === 'LIMIT_FILE_SIZE' ? 'Ficheiro demasiado grande. O limite é 500 MB.' : 'Erro no envio: ' + err.message });
    }
    if (err) return res.status(400).json({ erro: err.message || 'Erro no envio.' });
    if (!req.file) return res.status(400).json({ erro: 'Ficheiro em falta.' });
    const processoId = Number(req.body.processo_id);
    if (!processoId) { fs.unlink(req.file.path, () => {}); return res.status(400).json({ erro: 'processo_id é obrigatório.' }); }
    try {
      const proc = (await query('SELECT id FROM processos WHERE id = $1', [processoId])).rows[0];
      if (!proc) { fs.unlink(req.file.path, () => {}); return res.status(400).json({ erro: 'processo_id inválido.' }); }
      const nomeFicheiro = (req.body.nome_ficheiro ? String(req.body.nome_ficheiro).trim() : '') || req.file.originalname || req.file.filename;
      const urlFicheiro = '/uploads/' + req.file.filename;
      const visivelCliente = req.body.visivel_cliente === '1' || req.body.visivel_cliente === 'true' || req.body.visivel_cliente === true;
      const r = await query(
        'INSERT INTO documentos (processo_id, nome_ficheiro, url_ficheiro, visivel_cliente) VALUES ($1,$2,$3,$4) RETURNING id',
        [processoId, nomeFicheiro, urlFicheiro, visivelCliente ? 1 : 0]
      );
      const doc = (await query('SELECT * FROM documentos WHERE id = $1', [r.rows[0].id])).rows[0];
      const notificacao = visivelCliente ? await maybeNotifyProcessUpdate({ enviarNotificacao: shouldSendProcessNotification(req.body), tipo: 'documento', processoId, detalheTitulo: doc.nome_ficheiro, detalheDescricao: null }) : { notificacao_enviada: false, notificacao_erro: null };
      res.status(201).json({ documento: doc, ...notificacao });
    } catch (e) { fs.unlink(req.file.path, () => {}); console.error(e); res.status(500).json({ erro: 'Erro ao guardar documento.' }); }
  });
});

app.put('/api/documentos/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = (await query('SELECT * FROM documentos WHERE id = $1', [id])).rows[0];
    if (!existing) return res.status(404).json({ erro: 'Documento não encontrado.' });
    const { nome_ficheiro, url_ficheiro, visivel_cliente } = req.body || {};
    const novoVisivel = visivel_cliente != null ? (visivel_cliente ? 1 : 0) : null;
    const tornouVisivel = novoVisivel === 1 && Number(existing.visivel_cliente) !== 1;
    await query(
      `UPDATE documentos SET nome_ficheiro = COALESCE($1, nome_ficheiro), url_ficheiro = COALESCE($2, url_ficheiro), visivel_cliente = COALESCE($3, visivel_cliente) WHERE id = $4`,
      [nome_ficheiro != null ? String(nome_ficheiro).trim() : null, url_ficheiro != null ? String(url_ficheiro).trim() : null, novoVisivel, id]
    );
    const doc = (await query('SELECT * FROM documentos WHERE id = $1', [id])).rows[0];
    const notificacao = tornouVisivel ? await maybeNotifyProcessUpdate({ enviarNotificacao: shouldSendProcessNotification(req.body), tipo: 'documento', processoId: doc.processo_id, detalheTitulo: doc.nome_ficheiro, detalheDescricao: null }) : { notificacao_enviada: false, notificacao_erro: null };
    res.json({ documento: doc, ...notificacao });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

app.delete('/api/documentos/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const r = await query('DELETE FROM documentos WHERE id = $1', [Number(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ erro: 'Documento não encontrado.' });
    res.json({ sucesso: true });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); }
});

// ─── Health ────────────────────────────────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  try {
    const stats = (await query('SELECT COUNT(*) AS utilizadores FROM utilizadores')).rows[0];
    const comTelefone = (await query(`SELECT COUNT(*) AS n FROM utilizadores WHERE perfil = 'cliente' AND telefone IS NOT NULL AND telefone != ''`)).rows[0];
    const admin = (await query(`SELECT id FROM utilizadores WHERE email = 'solicitadora@sistema-legal.pt' LIMIT 1`)).rows[0];
    res.json({
      status: 'ok',
      servico: 'sistema-legal-api',
      base_dados: 'PostgreSQL (Neon)',
      utilizadores: Number(stats.utilizadores),
      clientes_com_whatsapp: Number(comTelefone ? comTelefone.n : 0),
      admin_seed: !!admin,
      persistente: true,
      aviso: null,
    });
  } catch (err) {
    console.error('Health check falhou:', err);
    res.status(500).json({ status: 'erro', servico: 'sistema-legal-api', detalhe: err.message });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

async function startServer() {
  await initSchema();
  await seedIfEmpty();
  app.listen(PORT, () => {
    console.log(`Sistema Legal API (PostgreSQL/Neon) a correr em http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao arrancar servidor:', err);
  process.exit(1);
});
