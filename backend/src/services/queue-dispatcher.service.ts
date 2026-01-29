import { AppDataSource } from '../config/database';
import { MessageQueue } from '../models/MessageQueue';
import { whatsappTemplateQueue } from '../config/queue';

const WATCHDOG_INTERVAL_MS = 60_000; // 60 seconds
const BATCH_SIZE = 100;
// Records stuck longer than this threshold are considered missed/stuck
const STUCK_THRESHOLD_MS = 5 * 60_000; // 5 minutes

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
 *   by verifying the job still exists before re-dispatching
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
   * Check if a BullMQ job still exists in Redis.
   */
  private static async isJobAlive(jobId: string | null): Promise<boolean> {
    if (!jobId) return false;
    try {
      const job = await whatsappTemplateQueue.getJob(jobId);
      if (!job) return false;
      const state = await job.getState();
      // Job is alive if it's waiting, active, or delayed
      return ['waiting', 'active', 'delayed'].includes(state);
    } catch {
      return false;
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

      // Find records that may need recovery:
      // 1. pending + created > 5min ago (API dispatch failed, e.g. Redis was down)
      // 2. retrying (worker failed, needs re-dispatch)
      // 3. queued + last_dispatched > 5min ago (possibly lost Redis job)
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

      console.log(`[QueueDispatcher] Watchdog found ${records.length} candidate(s) to check`);

      let dispatched = 0;
      let skipped = 0;

      for (const record of records) {
        try {
          // For 'queued' records, verify the Redis job is actually gone before re-dispatching.
          // This prevents double-dispatch when the queue is just busy (high volume).
          if (record.queueStatus === 'queued') {
            const alive = await this.isJobAlive(record.redisJobId);
            if (alive) {
              skipped++;
              continue; // Job still in Redis, skip — it will be processed eventually
            }
          }

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

      if (dispatched > 0 || skipped > 0) {
        console.log(`[QueueDispatcher] Watchdog: dispatched=${dispatched}, skipped=${skipped} (job still alive)`);
      }
    } catch (error: any) {
      console.error('[QueueDispatcher] Watchdog cycle error:', error.message);
    } finally {
      this.isRunning = false;
    }
  }
}
