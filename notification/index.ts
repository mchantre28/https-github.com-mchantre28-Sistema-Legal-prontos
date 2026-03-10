/**
 * Módulo de Notificações - Backend
 *
 * Uso:
 *   import admin from 'firebase-admin';
 *   import { NotificationService } from './notification/index.js';
 *   import { EmailChannel } from './notification/channels/EmailChannel.js';
 *   import { WhatsAppChannel } from './notification/channels/WhatsAppChannel.js';
 *   import { TemplateRepository, JobRepository, NotificationLogRepository } from './notification/repositories/...';
 *
 *   const db = admin.firestore();
 *   const config = await loadChannelsConfig(db);
 *   const svc = new NotificationService(
 *     new EmailChannel(config.email),
 *     new WhatsAppChannel(config.whatsapp),
 *     new TemplateRepository(db),
 *     new JobRepository(db),
 *     new NotificationLogRepository(db)
 *   );
 *   await svc.processPendingJobs();
 */

export { NotificationService } from "./NotificationService.js";
export type { EmailChannel, WhatsAppChannel } from "./NotificationService.js";
export { EmailChannel as EmailChannelImpl } from "./channels/EmailChannel.js";
export type { EmailChannelConfig } from "./channels/EmailChannel.js";
export { WhatsAppChannel as WhatsAppChannelImpl } from "./channels/WhatsAppChannel.js";
export type { WhatsAppChannelConfig } from "./channels/WhatsAppChannel.js";
export { TemplateRepository } from "./repositories/TemplateRepository.js";
export { JobRepository } from "./repositories/JobRepository.js";
export { NotificationLogRepository } from "./repositories/NotificationLogRepository.js";
export type * from "./types.js";
