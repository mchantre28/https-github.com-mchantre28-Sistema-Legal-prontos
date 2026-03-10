/**
 * Canal de envio por WhatsApp (Cloud API)
 * Requer waba_id, phone_number_id, access_token aprovados no Meta
 */

import type { NotificationJob } from "../types.js";
import type { NotificationTemplate, RenderedTemplate } from "../types.js";

export interface WhatsAppChannelConfig {
  waba_id: string;
  phone_number_id: string;
  access_token: string; // ou access_token_encrypted (desencriptado no backend)
  default_language: string;
}

export class WhatsAppChannel {
  constructor(private config: WhatsAppChannelConfig) {}

  async send(
    job: NotificationJob,
    template: NotificationTemplate | null,
    rendered: RenderedTemplate
  ): Promise<void> {
    const phone = job.recipient?.phone ?? (job as any).recipient_phone;
    if (!phone) throw new Error("Destinatário phone não definido");

    const templateName = template?.whatsapp_template_name ?? "notification";
    const language = template?.whatsapp_template_name ? this.config.default_language : "pt";
    const components = this.buildComponents(template, rendered);

    const url = `https://graph.facebook.com/v21.0/${this.config.phone_number_id}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to: phone.replace(/\D/g, ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components: components.length ? components : undefined,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.access_token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`WhatsApp API: ${res.status} - ${err}`);
    }
  }

  private buildComponents(
    template: NotificationTemplate | null,
    rendered: RenderedTemplate
  ): any[] {
    if (!template?.variables?.length) return [];

    const bodyParams = template.variables.map((v) => ({
      type: "text",
      text: (rendered as any)[v] ?? rendered.body_markdown ?? "",
    }));

    if (bodyParams.length === 0) return [];

    return [
      {
        type: "body",
        parameters: bodyParams,
      },
    ];
  }
}
