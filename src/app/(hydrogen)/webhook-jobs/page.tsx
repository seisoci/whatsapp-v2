'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Badge } from 'rizzui';
import {
  PiArrowsClockwise,
  PiWarning,
  PiCheckCircle,
  PiXCircle,
  PiClockCounterClockwise,
} from 'react-icons/pi';
import toast from 'react-hot-toast';
import PageHeader from '@/app/shared/page-header';
import { webhookJobsApi, type FailedWebhookJob } from '@/lib/api/webhook-jobs';

const pageHeader = {
  title: 'Webhook Jobs',
  breadcrumb: [
    { href: '/', name: 'Home' },
    { name: 'Management' },
    { name: 'Webhook Jobs' },
  ],
};

function formatDate(ts: number | null) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function truncate(str: string | null, len = 60) {
  if (!str) return '-';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export default function WebhookJobsPage() {
  const [jobs, setJobs] = useState<FailedWebhookJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingAll, setRetryingAll] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await webhookJobsApi.getFailedJobs();
      if (res.success) setJobs(res.data);
    } catch {
      toast.error('Gagal memuat daftar job');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const retryAll = async () => {
    setRetryingAll(true);
    try {
      const res = await webhookJobsApi.retryAllFailed();
      if (res.success) {
        toast.success(`${res.retried} job berhasil di-retry`);
        await load();
      } else {
        toast.error('Gagal melakukan retry');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setRetryingAll(false);
    }
  };

  const retryOne = async (jobId: string) => {
    setRetryingId(jobId);
    try {
      const res = await webhookJobsApi.retryOne(jobId);
      if (res.success) {
        toast.success('Job berhasil di-retry');
        await load();
      } else {
        toast.error(res.message ?? 'Gagal retry job');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <div className="@container mt-6 space-y-6">

        {/* Summary + Actions */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Failed Webhook Jobs
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Pesan WhatsApp yang gagal diproses oleh BullMQ worker. Retry akan memproses ulang dari awal.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                isLoading={loading}
                disabled={retryingAll || !!retryingId}
                onClick={load}
              >
                <PiArrowsClockwise className="me-1.5 h-4 w-4" />
                Refresh
              </Button>
              <Button
                isLoading={retryingAll}
                disabled={loading || jobs.length === 0 || !!retryingId}
                onClick={retryAll}
              >
                <PiClockCounterClockwise className="me-1.5 h-4 w-4" />
                Retry Semua ({jobs.length})
              </Button>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              Memuat...
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
              <PiCheckCircle className="h-10 w-10 text-green-400" />
              <p className="text-sm">Tidak ada job yang gagal</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Job ID / Key</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Error</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Attempts</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Waktu Gagal</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs text-gray-500">#{job.id}</span>
                          <span
                            className="max-w-xs font-mono text-xs text-gray-800 dark:text-gray-200"
                            title={job.idempotencyKey ?? undefined}
                          >
                            {truncate(job.idempotencyKey, 50)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-1.5">
                          <PiXCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <span
                            className="max-w-xs break-all text-xs text-red-600 dark:text-red-400"
                            title={job.failedReason}
                          >
                            {truncate(job.failedReason, 80)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge color="danger" variant="flat">
                          {job.attemptsMade}x
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        {formatDate(job.finishedOn)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          size="sm"
                          isLoading={retryingId === job.id}
                          disabled={retryingAll || (!!retryingId && retryingId !== job.id)}
                          onClick={() => retryOne(job.id)}
                        >
                          <PiClockCounterClockwise className="me-1 h-3.5 w-3.5" />
                          Retry
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
          <PiWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">Catatan</p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-300">
              Job yang di-retry akan memproses ulang webhook dari awal. Pastikan masalah penyebab kegagalan sudah diperbaiki sebelum melakukan retry.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
