/**
 * Repository para notification_templates (Firestore)
 */

import type { Firestore } from "@google-cloud/firestore";
import type { NotificationTemplate } from "../types.js";

export class TemplateRepository {
  constructor(private db: Firestore) {}

  private get collection() {
    return this.db.collection("notification_templates");
  }

  async getByCode(code: string): Promise<NotificationTemplate | null> {
    const snap = await this.collection.where("code", "==", code).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as NotificationTemplate;
  }

  async getAll(): Promise<NotificationTemplate[]> {
    const snap = await this.collection.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationTemplate));
  }
}
