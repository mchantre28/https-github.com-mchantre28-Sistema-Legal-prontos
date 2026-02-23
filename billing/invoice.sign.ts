/**
 * Módulo Billing - Assinatura digital de PDFs com certificado P12
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_CERT_PATH = join(dirname(__dirname), 'certs', 'assinatura.p12');

/**
 * Assina digitalmente um PDF com certificado P12
 * @param pdfBuffer - Buffer do PDF a assinar
 * @param options - Opções da assinatura
 * @returns Buffer do PDF assinado
 */
export async function signInvoicePdfWithP12(
  pdfBuffer: Buffer,
  options?: {
    certPath?: string;
    passphrase?: string;
    reason?: string;
    contactInfo?: string;
    signerName?: string;
    location?: string;
  }
): Promise<Buffer> {
  const certPath = options?.certPath ?? process.env.CERT_PATH ?? DEFAULT_CERT_PATH;

  if (!existsSync(certPath)) {
    throw new Error(
      `Certificado P12 não encontrado em ${certPath}. Coloque o ficheiro assinatura.p12 na pasta certs/ ou defina CERT_PATH.`
    );
  }

  const signpdf = (await import('@signpdf/signpdf')).default;
  const { plainAddPlaceholder } = await import('@signpdf/placeholder-plain');
  const { P12Signer } = (await import('@signpdf/signer-p12')).default;

  const reason = options?.reason ?? 'Assinado digitalmente por Solicitadora Ana Paula Medina';
  const contactInfo = options?.contactInfo ?? 'anapaulamedina09738@osae.pt';
  const signerName = options?.signerName ?? 'Solicitadora Ana Paula Medina';
  const location = options?.location ?? 'Portugal';

  const pdfWithPlaceholder = plainAddPlaceholder({
    pdfBuffer,
    reason,
    contactInfo,
    name: signerName,
    location,
  });

  const p12Buffer = readFileSync(certPath);
  const passphrase = options?.passphrase ?? process.env.CERT_PASSWORD;

  const signer = new P12Signer(p12Buffer, passphrase ? { passphrase } : {});

  const signedPdf = await signpdf.sign(pdfWithPlaceholder, signer);
  return Buffer.isBuffer(signedPdf) ? signedPdf : Buffer.from(signedPdf as ArrayBuffer);
}
