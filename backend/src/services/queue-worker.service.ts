import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/queue';
import { AppDataSource } from '../config/database';
import { MessageQueue } from '../models/MessageQueue';
import { WhatsAppMessagingService } from './whatsapp-messaging.service';

const CONCURRENCY = 5;

interface TemplateJobData {
  queueId: string;
}

/**
 * Queue Worker Service
 *
 * Consumes BullMQ jobs and sends WhatsApp template messages.
 * Loads all data from PostgreSQL (source of truth) before processing.
 *
 * Uses atomic UPDATE ... WHERE to claim a record, preventing
 * double-send when multiple jobs reference the same queueId.
 */
export class QueueWorkerService {
  private static worker: Worker | null = null;

  /**
   * Start the BullMQ worker.
   */
  static start(): void {
    if (this.worker) return;

    this.worker = new Worker<TemplateJobData>(
      'whatsapp-template',
      async (job: Job<TemplateJobData>) => {
        await this.processJob(job);
      },
      {
        connection: redisConnection,
        concurrency: CONCURRENCY,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[QueueWorker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[QueueWorker] Job ${job?.id} failed:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error('[QueueWorker] Worker error:', err.message);
    });

    console.log(`[QueueWorker] Started (concurrency: ${CONCURRENCY})`);
  }

  /**
   * Gracefully stop the worker.
   */
  static async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      console.log('[QueueWorker] Stopped');
    }
  }

  /**
   * Process a single job: claim atomically → load → send → update status.
   */
  private static async processJob(job: Job<TemplateJobData>): Promise<void> {
    const { queueId } = job.data;
    const mqRepo = AppDataSource.getRepository(MessageQueue);

    // 1. Atomic claim: UPDATE only if status is still queued/pending/retrying.
    //    Returns number of affected rows. If 0, another worker already claimed it.
    const claimResult = await mqRepo
      .createQueryBuilder()
      .update(MessageQueue)
      .set({
        queueStatus: 'processing',
        processedAt: new Date(),
      })
      .where('id = :id', { id: queueId })
      .andWhere('queue_status IN (:...claimable)', {
        claimable: ['queued', 'pending', 'retrying'],
      })
      .execute();

    if (claimResult.affected === 0) {
      // Already processing, completed, or failed — skip to prevent double send
      console.log(`[QueueWorker] Skipping mq=${queueId} (already claimed or finished)`);
      return;
    }

    // 2. Load full record with relations
    const record = await mqRepo.findOne({
      where: { id: queueId },
      relations: ['phoneNumber', 'contact', 'apiEndpoint'],
    });

    if (!record) {
      console.warn(`[QueueWorker] Record not found after claim: ${queueId}`);
      return;
    }

    try {
      // 3. Send WhatsApp template message
      const result = await WhatsAppMessagingService.sendTemplateMessage({
        phoneNumberId: record.phoneNumber.phoneNumberId,
        accessToken: record.phoneNumber.accessToken,
        to: record.recipientPhone,
        templateName: record.templateName,
        templateLanguage: record.templateLanguage || 'id',
        components: record.templateComponents || [],
        contactId: record.contactId!,
        internalPhoneNumberId: record.phoneNumberId,
        userId: record.userId || undefined,
      });

      // 4. Success — update record
      const wamid = result.messages?.[0]?.id || null;
      const savedMessage = result.savedMessage;

      record.queueStatus = 'completed';
      record.messageStatus = 'sent';
      record.wamid = wamid;
      record.completedAt = new Date();
      record.attempts = record.attempts + 1;

      if (savedMessage) {
        record.messageId = savedMessage.id;
      }

      await mqRepo.save(record);
    } catch (sendError: any) {
      // 5. Failure — increment attempts, decide retry or fail
      record.attempts = record.attempts + 1;
      record.errorMessage = sendError.message || 'Unknown send error';
      record.errorCode = sendError.code || sendError.error_code || null;

      if (record.attempts < record.maxAttempts) {
        record.queueStatus = 'retrying';
      } else {
        record.queueStatus = 'failed';
        record.messageStatus = 'failed';
        record.completedAt = new Date();
        record.isBillable = false;
      }

      await mqRepo.save(record);

      console.error(`[QueueWorker] Send failed for mq=${queueId} (attempt ${record.attempts}/${record.maxAttempts}):`, sendError.message);
    }
  }
}
