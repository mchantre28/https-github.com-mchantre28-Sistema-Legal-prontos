/**
 * Tipos para o módulo de notificações
 */

export type NotificationChannel = "email" | "whatsapp";

export interface Recipient {
  email: string | null;
  phone: string | null;
}

export interface NotificationJobMeta {
  origin: string;
  process_id: string | null;
}

export interface NotificationJob {
  id: string;
  template_code: string;
  channel: NotificationChannel;
  recipient: Recipient;
  payload: Record<string, string>;
  status: "pending" | "sent" | "failed" | "cancelled";
  scheduled_at?: string;
  sent_at?: string | null;
  failed_at?: string | null;
  error_message?: string | null;
  meta: NotificationJobMeta;
  created_at: string;
  updated_at?: string;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  channel: NotificationChannel;
  name: string;
  subject?: string | null;
  body_html?: string | null;
  body_markdown?: string | null;
  whatsapp_template_name?: string | null;
  variables: string[];
}

export interface RenderedTemplate {
  subject?: string;
  body_html?: string;
  body_markdown?: string;
}
