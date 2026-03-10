/**
 * Canal de envio por Email (SMTP via nodemailer)
 */

import nodemailer from "nodemailer";
import type { NotificationJob } from "../types.js";
import type { NotificationTemplate, RenderedTemplate } from "../types.js";

export interface EmailChannelConfig {
  smtp_host: string;
  smtp_port: number;
  username: string;
  password: string; // ou password_encrypted (desencriptado no backend)
  from_name: string;
  from_email: string;
  use_tls: boolean;
}

export class EmailChannel {
  constructor(private config: EmailChannelConfig) {}

  async send(
    job: NotificationJob,
    template: NotificationTemplate | null,
    rendered: RenderedTemplate
  ): Promise<void> {
    const to = job.recipient?.email ?? (job as any).recipient_email;
    if (!to) throw new Error("Destinatário email não definido");

    const transporter = nodemailer.createTransport({
      host: this.config.smtp_host,
      port: this.config.smtp_port,
      secure: this.config.use_tls,
      auth: {
        user: this.config.username,
        pass: this.config.password,
      },
    });

    const subject = rendered.subject ?? template?.subject ?? "Notificação";
    const html = rendered.body_html ?? rendered.body_markdown ?? "";

    await transporter.sendMail({
      from: `"${this.config.from_name}" <${this.config.from_email}>`,
      to,
      subject,
      html: html || undefined,
      text: html.replace(/<[^>]+>/g, "") || undefined,
    });
  }
}
