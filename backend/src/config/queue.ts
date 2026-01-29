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
