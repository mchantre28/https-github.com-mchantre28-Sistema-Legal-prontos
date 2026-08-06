/**
 * Envio de email SMTP — credenciais do portal do cliente.
 * Variáveis: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, PORTAL_URL
 */
const nodemailer = require('nodemailer');

function getConfig() {
  return {
    host: String(process.env.SMTP_HOST || '').trim(),
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: String(process.env.SMTP_USER || '').trim(),
    pass: String(process.env.SMTP_PASS || ''),
    from: String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim(),
    portalUrl: String(process.env.PORTAL_URL || '').trim(),
    escritorio: String(process.env.SMTP_ESCRITORIO || 'Ana Paula Medina — Solicitadora').trim(),
  };
}

function isConfigured() {
  const c = getConfig();
  return !!(c.host && c.user && c.pass && c.from);
}

function getPublicStatus() {
  const c = getConfig();
  return {
    configurado: isConfigured(),
    host: c.host || null,
    from: c.from ? c.from.replace(/(.{2}).*(@.*)/, '$1***$2') : null,
    portal_url: c.portalUrl || null,
  };
}

function createTransport() {
  const c = getConfig();
  return nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: {
      user: c.user,
      pass: c.pass,
    },
  });
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPortalCredentialsEmail({ nome, email, password, tipo, portalUrl, escritorio }) {
  const titulo = tipo === 'reset' ? 'Nova password de acesso ao portal' : 'Acesso ao portal — credenciais';
  const saudacao = nome ? `Exmo(a). Sr(a). ${escapeHtml(nome)},` : 'Exmo(a) Sr(a). Cliente,';
  const intro = tipo === 'reset'
    ? 'Foi gerada uma nova password temporária para aceder ao portal de acompanhamento de processos.'
    : 'Foi criada a sua conta de acesso ao portal de acompanhamento de processos.';

  const linkHtml = portalUrl
    ? `<p style="margin:16px 0;"><a href="${escapeHtml(portalUrl)}" style="color:#111827;font-weight:600;">${escapeHtml(portalUrl)}</a></p>`
    : '<p style="margin:16px 0;color:#4b5563;">Utilize o endereço fornecido pela solicitadoria para aceder ao portal.</p>';

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>${escapeHtml(titulo)}</title></head>
<body style="font-family:Georgia,'Times New Roman',serif;color:#111827;line-height:1.6;margin:0;padding:24px;background:#f3f4f6;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.05em;text-transform:uppercase;color:#6b7280;">${escapeHtml(escritorio)}</p>
    <h1 style="margin:0 0 24px;font-size:20px;font-weight:600;">${escapeHtml(titulo)}</h1>
    <p style="margin:0 0 16px;">${saudacao}</p>
    <p style="margin:0 0 16px;">${intro}</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:15px;">
      <tr><td style="padding:8px 0;color:#6b7280;width:120px;">Email</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(email)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Password temporária</td><td style="padding:8px 0;font-family:Consolas,monospace;font-weight:600;">${escapeHtml(password)}</td></tr>
    </table>
    ${linkHtml}
    <p style="margin:16px 0 0;font-size:14px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px;">
      Por razões de segurança, altere a password no primeiro acesso.
    </p>
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">Com os melhores cumprimentos,<br><strong>${escapeHtml(escritorio)}</strong></p>
  </div>
</body>
</html>`;

  const text = [
    titulo,
    '',
    nome ? `Exmo(a). Sr(a). ${nome},` : 'Exmo(a) Sr(a). Cliente,',
    '',
    intro,
    '',
    `Email: ${email}`,
    `Password temporária: ${password}`,
    portalUrl ? `Portal: ${portalUrl}` : '',
    '',
    'Altere a password no primeiro acesso.',
    '',
    escritorio,
  ].filter(Boolean).join('\n');

  return { titulo, html, text };
}

async function sendPortalCredentials({ nome, email, password, tipo }) {
  if (!isConfigured()) {
    throw new Error('SMTP não configurado no servidor.');
  }
  if (!email || !password) {
    throw new Error('Email e password são obrigatórios para envio.');
  }

  const c = getConfig();
  const { titulo, html, text } = buildPortalCredentialsEmail({
    nome,
    email,
    password,
    tipo: tipo === 'reset' ? 'reset' : 'criacao',
    portalUrl: c.portalUrl,
    escritorio: c.escritorio,
  });

  const transport = createTransport();
  await transport.sendMail({
    from: c.from,
    to: email,
    subject: `${titulo} — ${c.escritorio}`,
    text,
    html,
  });
}

module.exports = {
  isConfigured,
  getPublicStatus,
  sendPortalCredentials,
};
