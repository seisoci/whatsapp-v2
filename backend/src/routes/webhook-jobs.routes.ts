import { Hono } from 'hono';
import { authMiddleware } from '../middlewares';
import { whatsappWebhookQueue } from '../config/queue';
import { redisClient } from '../config/redis';

const webhookJobsRouter = new Hono();

webhookJobsRouter.use('/*', authMiddleware);

// GET /api/v1/admin/webhook-jobs/failed — list failed jobs
webhookJobsRouter.get('/failed', async (c) => {
  const failedJobs = await whatsappWebhookQueue.getFailed();
  const jobs = failedJobs.map((job) => ({
    id: job.id,
    idempotencyKey: job.data?.idempotencyKey ?? null,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  }));
  return c.json({ success: true, total: jobs.length, data: jobs });
});

// POST /api/v1/admin/webhook-jobs/retry-failed — retry all failed jobs
webhookJobsRouter.post('/retry-failed', async (c) => {
  const failedJobs = await whatsappWebhookQueue.getFailed();
  if (failedJobs.length === 0) {
    return c.json({ success: true, retried: 0, message: 'Tidak ada job yang gagal' });
  }

  const results: { jobId: string; status: string; error?: string }[] = [];

  for (const job of failedJobs) {
    try {
      const idempotencyKey = job.data?.idempotencyKey;
      if (idempotencyKey) {
        await redisClient.del(`webhook:idem:${idempotencyKey}`);
      }
      await job.retry();
      results.push({ jobId: job.id ?? '', status: 'retried' });
    } catch (err: any) {
      results.push({ jobId: job.id ?? '', status: 'error', error: err.message });
    }
  }

  const retried = results.filter((r) => r.status === 'retried').length;
  console.log(`[Admin] Retried ${retried}/${failedJobs.length} failed webhook jobs`);
  return c.json({ success: true, retried, total: failedJobs.length, results });
});

// POST /api/v1/admin/webhook-jobs/:id/retry — retry single job
webhookJobsRouter.post('/:id/retry', async (c) => {
  const jobId = c.req.param('id');
  const job = await whatsappWebhookQueue.getJob(jobId);
  if (!job) {
    return c.json({ success: false, message: 'Job tidak ditemukan' }, 404);
  }

  const idempotencyKey = job.data?.idempotencyKey;
  if (idempotencyKey) {
    await redisClient.del(`webhook:idem:${idempotencyKey}`);
  }
  await job.retry();
  return c.json({ success: true, message: 'Job berhasil di-retry' });
});

export default webhookJobsRouter;
