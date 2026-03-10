/**
 * Serviço principal de notificações
 * Queuing, processamento e renderização de templates
 */

import type { TemplateRepository } from "./repositories/TemplateRepository.js";
import type { JobRepository } from "./repositories/JobRepository.js";
import type { NotificationLogRepository } from "./repositories/NotificationLogRepository.js";
import type {
  NotificationTemplate,
  NotificationJob,
  RenderedTemplate,
  Recipient,
  NotificationJobMeta,
} from "./types.js";

export interface EmailChannel {
  send(job: NotificationJob, template: NotificationTemplate | null, rendered: RenderedTemplate): Promise<void>;
}

export interface WhatsAppChannel {
  send(job: NotificationJob, template: NotificationTemplate | null, rendered: RenderedTemplate): Promise<void>;
}

export class NotificationService {
  constructor(
    private emailChannel: EmailChannel,
    private whatsappChannel: WhatsAppChannel,
    private templateRepo: TemplateRepository,
    private jobRepo: JobRepository,
    private logRepo?: NotificationLogRepository
  ) {}

  async queueJob(
    templateCode: string,
    channel: "email" | "whatsapp",
    recipient: Recipient,
    payload: Record<string, string>,
    meta: NotificationJobMeta
  ) {
    return this.jobRepo.create({
      template_code: templateCode,
      channel,
      recipient,
      payload,
      status: "pending",
      meta,
      created_at: new Date().toISOString(),
    });
  }

  async processPendingJobs() {
    const jobs = await this.jobRepo.getPending();

    for (const job of jobs) {
      const reqSanitizado = {
        to: job.recipient?.email ?? job.recipient?.phone,
        template_code: job.template_code,
        channel: job.channel,
      };

      try {
        const template = await this.templateRepo.getByCode(job.template_code);
        const rendered = this.renderTemplate(template, job.payload);

        if (job.channel === "email") {
          await this.emailChannel.send(job, template, rendered);
        } else {
          await this.whatsappChannel.send(job, template, rendered);
        }

        await this.jobRepo.markSent(job.id);
        await this.logRepo?.create({
          job_id: job.id,
          channel: job.channel,
          request: reqSanitizado,
          response: { ok: true },
          status: "sent",
        });
      } catch (err: any) {
        const msg = err?.message || String(err);
        await this.jobRepo.markFailed(job.id, msg);
        await this.logRepo?.create({
          job_id: job.id,
          channel: job.channel,
          request: reqSanitizado,
          response: { error: msg.substring(0, 200) },
          status: "failed",
        });
      }
    }
  }

  private renderTemplate(template: NotificationTemplate | null, payload: Record<string, string>): RenderedTemplate {
    const applyPayload = (str: string) => {
      if (!str) return str;
      let out = str;
      for (const key of Object.keys(payload)) {
        out = out.replace(new RegExp(`\\{${key}\\}`, "g"), String(payload[key] ?? ""));
      }
      return out;
    };

    if (!template) {
      return { subject: "Notificação", body_html: "", body_markdown: "" };
    }

    return {
      subject: applyPayload(template.subject ?? ""),
      body_html: applyPayload(template.body_html ?? template.body_markdown ?? ""),
      body_markdown: applyPayload(template.body_markdown ?? ""),
    };
  }
}
