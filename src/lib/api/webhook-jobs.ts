import { apiClient } from '../api-client';

export interface FailedWebhookJob {
  id: string;
  idempotencyKey: string | null;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
  processedOn: number | null;
  finishedOn: number | null;
}

export interface RetryResult {
  jobId: string;
  status: 'retried' | 'error';
  error?: string;
}

export const webhookJobsApi = {
  getFailedJobs: (): Promise<{ success: boolean; total: number; data: FailedWebhookJob[] }> =>
    apiClient.get('/admin/webhook-jobs/failed') as any,

  retryAllFailed: (): Promise<{ success: boolean; retried: number; total: number; results: RetryResult[] }> =>
    apiClient.post('/admin/webhook-jobs/retry-failed') as any,

  retryOne: (jobId: string): Promise<{ success: boolean; message: string }> =>
    apiClient.post(`/admin/webhook-jobs/${encodeURIComponent(jobId)}/retry`) as any,
};
