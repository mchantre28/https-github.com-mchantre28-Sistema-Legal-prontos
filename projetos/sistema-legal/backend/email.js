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
  const providerPref = String(process.env.EMAIL_PROVIDER || 'auto').trim().toLowerCase();
  const brevoSender = String(process.env.BREVO_SENDER_EMAIL || '').trim();
  const emailFrom = String(process.env.EMAIL_FROM || '').trim();
  let fromRaw = emailFrom
    || String(process.env.SMTP_FROM || process.env.RESEND_FROM || brevoSender || process.env.SMTP_USER || '').trim();
  if ((providerPref === 'brevo' || providerPref === 'auto') && brevoSender) {
    if (!fromRaw || /@resend\.dev$/i.test(fromRaw)) {
      fromRaw = brevoSender.includes('<') ? brevoSender : `Ana Paula Medina <${brevoSender}>`;
    }
  }
  return {
    portalUrl: String(process.env.PORTAL_URL || '').trim(),
    escritorio: String(process.env.EMAIL_ESCRITORIO || process.env.SMTP_ESCRITORIO || 'Ana Paula Medina — Solicitadora').trim(),
    fromRaw,
    providerPref,
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

function isOutlookLikeAddress(email) {
  const domain = String(email || '').split('@')[1] || '';
  return /^(outlook|hotmail|live|msn)\./i.test(domain)
    || /@(outlook|hotmail|live|msn)\.[a-z.]+$/i.test(String(email || ''));
}

function getReplyToAddress() {
  const raw = String(process.env.REPLY_TO_EMAIL || process.env.EMAIL_REPLY_TO || '').trim();
  if (!raw) return null;
  const parsed = parseFromAddress(raw, '');
  return parsed.email || null;
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

  const outlookTip = isOutlookLikeAddress(email)
    ? `<p style="margin:16px 0 0;font-size:13px;color:#1e3a5f;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px;">
        Se utiliza Outlook/Hotmail e não encontrar este email na caixa de entrada, verifique as pastas <strong>Lixo / Spam</strong> e <strong>Outros</strong> (Outlook.com).
      </p>`
    : `<p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Se não encontrar este email na caixa de entrada, verifique a pasta Spam / Lixo.</p>`;

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(titulo)}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;margin:0;padding:24px;background:#f3f4f6;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.05em;text-transform:uppercase;color:#6b7280;">${escapeHtml(escritorio)}</p>
    <h1 style="margin:0 0 24px;font-size:20px;font-weight:600;">${escapeHtml(titulo)}</h1>
    <p style="margin:0 0 16px;">${saudacao}</p>
    <p style="margin:0 0 16px;">${intro}</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:15px;">
      <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Email de acesso</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(email)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Password temporária</td><td style="padding:8px 0;font-family:Consolas,monospace;font-weight:600;letter-spacing:0.02em;">${escapeHtml(password)}</td></tr>
    </table>
    ${linkHtml}
    <p style="margin:16px 0 0;font-size:14px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px;">
      Por razões de segurança, altere a password no primeiro acesso.
    </p>
    ${outlookTip}
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
    `Email de acesso: ${email}`,
    `Password temporária: ${password}`,
    portalUrl ? `Portal: ${portalUrl}` : '',
    '',
    'Altere a password no primeiro acesso.',
    isOutlookLikeAddress(email)
      ? 'Se usa Outlook/Hotmail: verifique as pastas Lixo/Spam e Outros.'
      : 'Se não encontrar o email, verifique a pasta Spam/Lixo.',
    '',
    escritorio,
  ].filter(Boolean).join('\n');

  return { titulo, html, text };
}

async function sendViaResend({ to, subject, html, text, fromHeader, replyTo }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const resend = new Resend(apiKey);
  const payload = {
    from: fromHeader,
    to: [to],
    subject,
    html,
    text,
  };
  if (replyTo) payload.reply_to = replyTo;
  const result = await resend.emails.send(payload);
  if (result.error) {
    throw new Error(result.error.message || 'Falha ao enviar via Resend.');
  }
}

async function sendViaBrevo({ to, subject, html, text, from, replyTo }) {
  const apiKey = String(process.env.BREVO_API_KEY || '').trim();
  const body = {
    sender: { name: from.name, email: from.email },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  };
  if (replyTo) body.replyTo = { email: replyTo };
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data.message || data.error || `Brevo HTTP ${response.status}`;
    throw new Error(msg);
  }
}

async function sendViaSmtp({ to, subject, html, text, fromHeader, replyTo }) {
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
  const mail = {
    from: fromHeader,
    to,
    subject,
    text,
    html,
    headers: {
      'X-Mailer': 'Sistema Legal',
      'X-Priority': '3',
    },
  };
  if (replyTo) mail.replyTo = replyTo;
  await transport.sendMail(mail);
}

async function sendEmail({ to, subject, html, text }) {
  const provider = resolveProvider();
  if (!provider) {
    throw new Error('Email não configurado (defina RESEND_API_KEY, BREVO_API_KEY ou SMTP_*).');
  }
  if (!to) {
    throw new Error('Destinatário em falta.');
  }

  const shared = getSharedConfig();
  const from = parseFromAddress(shared.fromRaw, shared.escritorio);
  if (!from.email) {
    throw new Error('EMAIL_FROM em falta (ex.: Ana Paula Medina <email@dominio.pt>).');
  }

  const fromHeader = formatFromHeader(from);
  const replyTo = getReplyToAddress();
  if (provider === 'resend') {
    await sendViaResend({ to, subject, html, text, fromHeader, replyTo });
    return;
  }
  if (provider === 'brevo') {
    await sendViaBrevo({ to, subject, html, text, from, replyTo });
    return;
  }
  await sendViaSmtp({ to, subject, html, text, fromHeader, replyTo });
}

function buildProcessUpdateEmail({
  nome,
  tipo,
  processoNumero,
  processoTitulo,
  detalheTitulo,
  detalheDescricao,
  portalUrl,
  escritorio,
}) {
  const isDocumento = tipo === 'documento';
  const titulo = isDocumento ? 'Novo documento no seu processo' : 'Nova actualização no seu processo';
  const intro = isDocumento
    ? 'Foi disponibilizado um novo documento no portal de acompanhamento do seu processo.'
    : 'Foi registada uma nova actualização (trâmite) no seu processo.';

  const saudacao = nome ? `Exmo(a). Sr(a). ${escapeHtml(nome)},` : 'Exmo(a) Sr(a). Cliente,';
  const descricaoHtml = detalheDescricao
    ? `<p style="margin:12px 0 0;font-size:14px;color:#374151;">${escapeHtml(detalheDescricao)}</p>`
    : '';

  const linkHtml = portalUrl
    ? `<p style="margin:20px 0 0;"><a href="${escapeHtml(portalUrl)}" style="color:#111827;font-weight:600;">Aceder ao portal</a></p>`
    : '';

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
      <tr><td style="padding:8px 0;color:#6b7280;width:130px;">Processo</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(processoNumero)} — ${escapeHtml(processoTitulo)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">${isDocumento ? 'Documento' : 'Trâmite'}</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(detalheTitulo)}</td></tr>
    </table>
    ${descricaoHtml}
    ${linkHtml}
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">Se não encontrar o email na caixa de entrada (Outlook/Hotmail), verifique a pasta Spam ou Other.</p>
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
    `Processo: ${processoNumero} — ${processoTitulo}`,
    `${isDocumento ? 'Documento' : 'Trâmite'}: ${detalheTitulo}`,
    detalheDescricao ? detalheDescricao : '',
    portalUrl ? `Portal: ${portalUrl}` : '',
    '',
    escritorio,
  ].filter(Boolean).join('\n');

  return { titulo, html, text };
}

async function sendPortalCredentials({ nome, email, password, tipo }) {
  if (!email || !password) {
    throw new Error('Email e password são obrigatórios para envio.');
  }

  const shared = getSharedConfig();
  const { titulo, html, text } = buildPortalCredentialsEmail({
    nome,
    email,
    password,
    tipo: tipo === 'reset' ? 'reset' : 'criacao',
    portalUrl: shared.portalUrl,
    escritorio: shared.escritorio,
  });

  await sendEmail({
    to: email,
    subject: tipo === 'reset'
      ? `Actualização de acesso ao portal — ${shared.escritorio}`
      : `Bem-vindo(a) ao portal do cliente — ${shared.escritorio}`,
    html,
    text,
  });
}

async function sendProcessUpdateNotification({
  nome,
  email,
  tipo,
  processoNumero,
  processoTitulo,
  detalheTitulo,
  detalheDescricao,
}) {
  const shared = getSharedConfig();
  const { titulo, html, text } = buildProcessUpdateEmail({
    nome,
    tipo,
    processoNumero,
    processoTitulo,
    detalheTitulo,
    detalheDescricao,
    portalUrl: shared.portalUrl,
    escritorio: shared.escritorio,
  });

  await sendEmail({
    to: email,
    subject: `${titulo} — ${processoNumero}`,
    html,
    text,
  });
}

module.exports = {
  isConfigured,
  getPublicStatus,
  sendPortalCredentials,
  sendProcessUpdateNotification,
  resolveProvider,
  isOutlookLikeAddress,
};
