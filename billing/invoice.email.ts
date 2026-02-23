/**
 * Módulo Billing - Envio de faturas por email
 */

import nodemailer from 'nodemailer';

export interface SendInvoiceEmailParams {
  to: string;
  subject: string;
  text: string;
  /** Corpo HTML (opcional) */
  html?: string;
  pdfBuffer: Buffer;
  /** Nome do ficheiro PDF (default: fatura.pdf) */
  filename?: string;
}

/** Valida variáveis de ambiente de SMTP */
function getTransporterConfig() {
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'Configuração de email em falta. Defina MAIL_HOST, MAIL_USER e MAIL_PASS nas variáveis de ambiente.'
    );
  }

  return {
    host,
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: process.env.MAIL_SECURE === 'true',
    auth: { user, pass },
  };
}

/**
 * Envia fatura por email com PDF em anexo
 */
export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<void> {
  const config = getTransporterConfig();

  const transporter = nodemailer.createTransport(config);

  const from = process.env.MAIL_FROM ?? `"Solicitadora Ana Paula Medina" <${config.auth.user}>`;

  await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
    attachments: [
      {
        filename: params.filename ?? 'fatura.pdf',
        content: params.pdfBuffer,
      },
    ],
  });
}
