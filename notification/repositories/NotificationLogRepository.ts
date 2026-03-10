/**
 * Repository para notification_logs (Firestore)
 */

import type { Firestore } from "@google-cloud/firestore";

export interface NotificationLog {
  id: string;
  job_id: string;
  channel: string;
  request: object;
  response: object;
  status: "sent" | "failed";
  created_at: string;
}

export class NotificationLogRepository {
  constructor(private db: Firestore) {}

  private get collection() {
    return this.db.collection("notification_logs");
  }

  async create(data: Omit<NotificationLog, "id">): Promise<NotificationLog> {
    const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const agora = new Date().toISOString();
    const payload = {
      id,
      job_id: data.job_id,
      channel: data.channel,
      request: data.request ?? {},
      response: data.response ?? {},
      status: data.status ?? "sent",
      created_at: data.created_at ?? agora,
    };
    await this.collection.doc(id).set(payload, { merge: true });
    return payload as NotificationLog;
  }
}
