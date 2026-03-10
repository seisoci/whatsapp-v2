/**
 * BullMQ Worker — Incoming WhatsApp Webhook Processor
 *
 * Concurrency is controlled here (default: 3).
 * Max 3 webhook jobs run simultaneously → max 3 concurrent PostgreSQL operations.
 *
 * Deduplication: the controller enqueues with jobId = idempotencyKey.
 * BullMQ rejects duplicate jobIds that are already waiting/active in Redis,
 * so concurrent identical webhooks never reach the DB simultaneously.
 */

import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/queue';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';

const CONCURRENCY = parseInt(process.env.WEBHOOK_WORKER_CONCURRENCY || '3');

export interface WebhookJobData {
  payload: any;           // WhatsAppWebhookPayload — plain object, JSON-safe for Redis
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
      {
        connection: redisConnection,
        concurrency: CONCURRENCY,
      },
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

    console.log(`[WebhookWorker] Started (concurrency: ${CONCURRENCY})`);
  }

  static async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      console.log('[WebhookWorker] Stopped');
    }
  }
}
