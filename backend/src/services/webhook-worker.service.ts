/**
 * BullMQ Worker — Incoming WhatsApp Webhook Processor
 *
 * Runs jobs one at a time (no concurrency option = BullMQ default: 1).
 * This prevents PostgreSQL speculative insertion spinlock: two concurrent
 * INSERTs with the same idempotency_key spin at 100% CPU indefinitely
 * because the spinlock bypasses statement_timeout.
 * Sequential processing eliminates that entirely.
 */

import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/queue';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';

export interface WebhookJobData {
  payload: any;
  ip: string;
  userAgent: string | null;
  idempotencyKey: string;
}

export class WebhookWorkerService {
  private static worker: Worker | null = null;

  static start(): void {
    if (this.worker) return;

    this.worker = new Worker<WebhookJobData>(
      'whatsapp-webhook',
      async (job: Job<WebhookJobData>) => {
        const { payload, ip, userAgent, idempotencyKey } = job.data;
        await WhatsAppWebhookService.doProcessWebhook(payload, ip, userAgent, idempotencyKey);
      },
      { connection: redisConnection },
    );

    this.worker.on('completed', (job) => {
      console.log(`[WebhookWorker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[WebhookWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error('[WebhookWorker] Worker error:', err.message);
    });

    console.log('[WebhookWorker] Started (sequential — no concurrency)');
  }

  static async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      console.log('[WebhookWorker] Stopped');
    }
  }
}
