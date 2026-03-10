import { Queue, QueueOptions } from 'bullmq';

/**
 * BullMQ connection options — reuses Redis env vars.
 */
export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
};

const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
  },
};

/**
 * BullMQ queue for WhatsApp template messages.
 * Jobs contain { queueId: string } referencing message_queues.id
 */
export const whatsappTemplateQueue = new Queue('whatsapp-template', queueOptions);

/**
 * BullMQ queue for incoming WhatsApp webhooks.
 * jobId = idempotencyKey → BullMQ deduplicates automatically.
 * Worker runs with concurrency:3 so max 3 concurrent DB operations.
 */
export const whatsappWebhookQueue = new Queue('whatsapp-webhook', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 500,
    removeOnFail: 200,
  },
});
