'use client';

import type { ResponseTimeStats } from '@/lib/api/analytics';

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-[10px] text-gray-400">menit</p>
    </div>
  );
}

export function ResponseTimeStatsCard({ data }: { data: ResponseTimeStats | null }) {
  const fmt = (n: number | null | undefined) =>
    n != null && n > 0 ? String(n) : '—';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h4 className="mb-6 text-sm font-semibold text-gray-800 dark:text-gray-100">
        Waktu Respon Agen
      </h4>
      {data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Rata-rata" value={fmt(data.avgMinutes)} color="text-blue-600 dark:text-blue-400" />
          <MetricCard label="Median" value={fmt(data.medianMinutes)} color="text-green-600 dark:text-green-400" />
          <MetricCard label="Tercepat" value={fmt(data.minMinutes)} color="text-emerald-600 dark:text-emerald-400" />
          <MetricCard label="Terlambat" value={fmt(data.maxMinutes)} color="text-red-500 dark:text-red-400" />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center text-sm text-gray-400">
          Belum ada data waktu respon
        </div>
      )}
    </div>
  );
}
