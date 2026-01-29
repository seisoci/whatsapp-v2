import { AppDataSource } from '../config/database';
import { MessageQueue } from '../models/MessageQueue';
import { whatsappTemplateQueue } from '../config/queue';

const WATCHDOG_INTERVAL_MS = 60_000; // 60 seconds
const BATCH_SIZE = 100;
// Records stuck longer than this threshold are considered missed/stuck
const STUCK_THRESHOLD_MS = 2 * 60_000; // 2 minutes

/**
 * Queue Dispatcher Service (Watchdog / Recovery)
 *
 * This is NOT the primary dispatcher. The API endpoint dispatches
 * jobs to BullMQ immediately on insert.
 *
 * This service acts as a safety net:
 * - Picks up records still in `pending` that were never dispatched
 *   (e.g. Redis was down when the API tried to enqueue)
 * - Re-dispatches `retrying` records after a worker failure
 * - Recovers from Redis restarts (all Redis jobs lost)
 *
 * PostgreSQL is the source of truth. Redis is disposable.
 */
export class QueueDispatcherService {
  private static intervalId: ReturnType<typeof setInterval> | null = null;
  private static isRunning = false;

  /**
   * Start the watchdog cron loop.
   */
  static start(): void {
    if (this.intervalId) return;

    console.log(`[QueueDispatcher] Watchdog started (interval: ${WATCHDOG_INTERVAL_MS / 1000}s)`);
    this.intervalId = setInterval(() => this.dispatch(), WATCHDOG_INTERVAL_MS);
  }

  /**
   * Stop the watchdog cron loop.
   */
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[QueueDispatcher] Watchdog stopped');
    }
  }

  /**
   * Single watchdog cycle: find stuck/missed records → re-dispatch to BullMQ.
   */
  private static async dispatch(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const mqRepo = AppDataSource.getRepository(MessageQueue);
      const stuckBefore = new Date(Date.now() - STUCK_THRESHOLD_MS);

      // Find records that should have been dispatched but weren't, or need retry:
      // 1. pending + created > 2min ago (API dispatch failed, e.g. Redis was down)
      // 2. retrying (worker failed, needs re-dispatch)
      // 3. queued + last_dispatched > 2min ago (Redis job lost, e.g. Redis restarted)
      const records = await mqRepo
        .createQueryBuilder('mq')
        .where(
          `(
            (mq.queue_status = 'pending' AND mq.created_at <= :stuckBefore)
            OR (mq.queue_status = 'retrying')
            OR (mq.queue_status = 'queued' AND mq.last_dispatched_at <= :stuckBefore)
          )`,
          { stuckBefore }
        )
        .andWhere('mq.attempts < mq.max_attempts')
        .andWhere('(mq.scheduled_at IS NULL OR mq.scheduled_at <= NOW())')
        .orderBy('mq.created_at', 'ASC')
        .take(BATCH_SIZE)
        .getMany();

      if (records.length === 0) {
        this.isRunning = false;
        return;
      }

      console.log(`[QueueDispatcher] Watchdog found ${records.length} stuck/retrying message(s)`);

      let dispatched = 0;

      for (const record of records) {
        try {
          const job = await whatsappTemplateQueue.add(
            'send-template',
            { queueId: record.id },
            {
              jobId: `mq-${record.id}-${Date.now()}`,
              attempts: 1,
            }
          );

          record.queueStatus = 'queued';
          record.redisJobId = job.id || null;
          record.lastDispatchedAt = new Date();
          await mqRepo.save(record);

          dispatched++;
        } catch (jobError: any) {
          console.warn(`[QueueDispatcher] Failed to re-enqueue mq=${record.id}:`, jobError.message);
        }
      }

      if (dispatched > 0) {
        console.log(`[QueueDispatcher] Watchdog re-dispatched ${dispatched}/${records.length} job(s)`);
      }
    } catch (error: any) {
      console.error('[QueueDispatcher] Watchdog cycle error:', error.message);
    } finally {
      this.isRunning = false;
    }
  }
}
