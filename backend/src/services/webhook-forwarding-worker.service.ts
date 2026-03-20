import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/queue';

const TIMEOUT_MS = 10_000;

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd[0-9a-f]{2}:/i,
  /^0\.0\.0\.0$/,
];

export function assertSafeWebhookUrl(webhookUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(webhookUrl);
  } catch {
    throw new Error(`Invalid webhook URL: ${webhookUrl}`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Blocked webhook protocol: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname;
  if (BLOCKED_HOSTNAME_PATTERNS.some((p) => p.test(hostname))) {
    throw new Error(`Blocked internal webhook hostname: ${hostname}`);
  }
}

interface ForwardingJobData {
  webhookUrl: string;
  apiKey: string | null;
  payload: Record<string, any>;
}

/**
 * Webhook Forwarding Worker
 *
 * Processes jobs from the webhook-forwarding queue and delivers
 * status updates to external webhook URLs (e.g. Loli ERP).
 *
 * On timeout or non-2xx response, BullMQ retries with exponential backoff
 * (configured on the queue: 5 attempts, starting at 5s delay).
 */
export class WebhookForwardingWorkerService {
  private static worker: Worker | null = null;

  static start(): void {
    if (this.worker) return;

    this.worker = new Worker<ForwardingJobData>(
      'webhook-forwarding',
      async (job: Job<ForwardingJobData>) => {
        await this.processJob(job);
      },
      {
        connection: redisConnection,
        concurrency: 10,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[WebhookForwarding] Job ${job.id} delivered to ${job.data.webhookUrl}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[WebhookForwarding] Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts.attempts}):`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error('[WebhookForwarding] Worker error:', err.message);
    });

    console.log('[WebhookForwarding] Worker started');
  }

  static async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      console.log('[WebhookForwarding] Worker stopped');
    }
  }

  private static async processJob(job: Job<ForwardingJobData>): Promise<void> {
    const { webhookUrl, apiKey, payload } = job.data;

    assertSafeWebhookUrl(webhookUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(apiKey ? { 'X-API-Key': apiKey } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ${webhookUrl}`);
      }
    } catch (err: any) {
      const reason = err.name === 'AbortError' ? `timeout (${TIMEOUT_MS}ms)` : err.message;
      throw new Error(`[WebhookForwarding] Failed to deliver to ${webhookUrl}: ${reason}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
