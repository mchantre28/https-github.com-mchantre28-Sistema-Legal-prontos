/**
 * Repository para notification_jobs (Firestore)
 */

import type { Firestore } from "@google-cloud/firestore";
import type { NotificationJob } from "../types.js";

export class JobRepository {
  constructor(private db: Firestore) {}

  private get collection() {
    return this.db.collection("notification_jobs");
  }

  async create(data: Omit<NotificationJob, "id"> & { id?: string }): Promise<NotificationJob> {
    const id = data.id || this.generateId();
    const agora = new Date().toISOString();
    const payload = {
      id,
      template_code: data.template_code,
      channel: data.channel,
      recipient: data.recipient ?? { email: null, phone: null },
      payload: data.payload ?? {},
      status: data.status ?? "pending",
      scheduled_at: data.scheduled_at ?? agora,
      sent_at: null,
      failed_at: null,
      error_message: null,
      meta: data.meta ?? { origin: "envio_manual", process_id: null },
      created_at: data.created_at ?? agora,
      updated_at: agora,
    };
    await this.collection.doc(id).set(payload, { merge: true });
    return payload as NotificationJob;
  }

  async getPending(limit = 10): Promise<NotificationJob[]> {
    const snap = await this.collection.where("status", "==", "pending").limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationJob));
  }

  async markSent(jobId: string): Promise<void> {
    const agora = new Date().toISOString();
    await this.collection.doc(jobId).update({
      status: "sent",
      sent_at: agora,
      updated_at: agora,
    });
  }

  async markFailed(jobId: string, errorMessage: string): Promise<void> {
    const agora = new Date().toISOString();
    await this.collection.doc(jobId).update({
      status: "failed",
      failed_at: agora,
      error_message: (errorMessage || "").substring(0, 500),
      updated_at: agora,
    });
  }

  private generateId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
