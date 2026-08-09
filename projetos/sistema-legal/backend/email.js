/**
 * Envio de credenciais do portal — Resend, Brevo (HTTPS) ou SMTP (fallback).
 *
 * Resend:  RESEND_API_KEY, EMAIL_FROM
 * Brevo:   BREVO_API_KEY, EMAIL_FROM
 * SMTP:    SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM (bloqueado no Render Free)
 * Comum:   PORTAL_URL, EMAIL_ESCRITORIO
 * Modo:    EMAIL_PROVIDER=auto|resend|brevo|smtp (predefinição: auto)
 */
const nodemailer = require('nodemailer');
const { Resend } = require('resend');

function getSharedConfig() {
  return {
    portalUrl: String(process.env.PORTAL_URL || '').trim(),
    escritorio: String(process.env.EMAIL_ESCRITORIO || process.env.SMTP_ESCRITORIO || 'Ana Paula Medina — Solicitadora').trim(),
    fromRaw: String(
      process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.RESEND_FROM || process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || ''
    ).trim(),
    providerPref: String(process.env.EMAIL_PROVIDER || 'auto').trim().toLowerCase(),
  };
}

function parseFromAddress(fromStr, defaultName) {
  const s = String(fromStr || '').trim();
  const match = s.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  if (s.includes('@')) {
    return { name: defaultName, email: s };
  }
  return { name: defaultName, email: '' };
}

function getSmtpConfig() {
  return {
    host: String(process.env.SMTP_HOST || '').trim(),
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: String(process.env.SMTP_USER || '').trim(),
    pass: String(process.env.SMTP_PASS || ''),
  };
}

function hasResend() {
  return !!String(process.env.RESEND_API_KEY || '').trim();
}

function hasBrevo() {
  return !!String(process.env.BREVO_API_KEY || '').trim();
}

function hasSmtp() {
  const smtp = getSmtpConfig();
  const shared = getSharedConfig();
  const from = parseFromAddress(shared.fromRaw, shared.escritorio);
  return !!(smtp.host && smtp.user && smtp.pass && from.email);
}

function resolveProvider() {
  const pref = getSharedConfig().providerPref;
  if (pref === 'resend') return hasResend() ? 'resend' : null;
  if (pref === 'brevo') return hasBrevo() ? 'brevo' : null;
  if (pref === 'smtp') return hasSmtp() ? 'smtp' : null;
  if (hasResend()) return 'resend';
  if (hasBrevo()) return 'brevo';
  if (hasSmtp()) return 'smtp';
  return null;
}

function isConfigured() {
  return !!resolveProvider();
}

function maskEmail(email) {
  const e = String(email || '');
  if (!e.includes('@')) return null;
  return e.replace(/(.{2}).*(@.*)/, '$1***$2');
}

function formatFromHeader(from) {
  if (!from.email) return null;
  if (from.name && from.name !== from.email) {
    return `${from.name} <${from.email}>`;
  }
  return from.email;
}

function getPublicStatus() {
  const shared = getSharedConfig();
  const provider = resolveProvider();
  const from = parseFromAddress(shared.fromRaw, shared.escritorio);
  const smtp = getSmtpConfig();
  return {
    configurado: !!provider,
    provider: provider,
    from: maskEmail(from.email),
    portal_url: shared.portalUrl || null,
    resend: hasResend(),
    brevo: hasBrevo(),
    smtp: hasSmtp(),
    smtp_host: smtp.host || null,
    nota: provider === 'smtp'
      ? 'SMTP pode falhar no Render Free (portas 587/465 bloqueadas). Use RESEND_API_KEY ou BREVO_API_KEY.'
      : null,
  };
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

async function sendViaResend({ to, subject, html, text, fromHeader }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: fromHeader,
    to: [to],
    subject,
    html,
    text,
  });
  if (result.error) {
    throw new Error(result.error.message || 'Falha ao enviar via Resend.');
  }
}

async function sendViaBrevo({ to, subject, html, text, from }) {
  const apiKey = String(process.env.BREVO_API_KEY || '').trim();
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: from.name, email: from.email },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data.message || data.error || `Brevo HTTP ${response.status}`;
    throw new Error(msg);
  }
}

async function sendViaSmtp({ to, subject, html, text, fromHeader }) {
  const smtp = getSmtpConfig();
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  await transport.sendMail({
    from: fromHeader,
    to,
    subject,
    text,
    html,
  });
}

async function sendPortalCredentials({ nome, email, password, tipo }) {
  const provider = resolveProvider();
  if (!provider) {
    throw new Error('Email não configurado (defina RESEND_API_KEY, BREVO_API_KEY ou SMTP_*).');
  }
  if (!email || !password) {
    throw new Error('Email e password são obrigatórios para envio.');
  }

  const shared = getSharedConfig();
  const from = parseFromAddress(shared.fromRaw, shared.escritorio);
  if (!from.email) {
    throw new Error('EMAIL_FROM em falta (ex.: Ana Paula Medina <email@dominio.pt>).');
  }

  const { titulo, html, text } = buildPortalCredentialsEmail({
    nome,
    email,
    password,
    tipo: tipo === 'reset' ? 'reset' : 'criacao',
    portalUrl: shared.portalUrl,
    escritorio: shared.escritorio,
  });

  const subject = `${titulo} — ${shared.escritorio}`;
  const fromHeader = formatFromHeader(from);

  if (provider === 'resend') {
    await sendViaResend({ to: email, subject, html, text, fromHeader });
    return;
  }
  if (provider === 'brevo') {
    await sendViaBrevo({ to: email, subject, html, text, from });
    return;
  }
  await sendViaSmtp({ to: email, subject, html, text, fromHeader });
}

module.exports = {
  isConfigured,
  getPublicStatus,
  sendPortalCredentials,
  resolveProvider,
};
