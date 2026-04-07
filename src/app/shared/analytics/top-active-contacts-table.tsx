'use client';

import type { TopActiveContact } from '@/lib/api/analytics';

export function TopActiveContactsTable({ data }: { data: TopActiveContact[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h4 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
        Top 50 Kontak Aktif (30 Hari Terakhir)
      </h4>
      {data.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-400">Tidak ada data</div>
      ) : (
        <div className="overflow-auto max-h-[480px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-800">
              <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                <th className="pb-2 pr-3 font-medium text-gray-500 w-8">#</th>
                <th className="pb-2 pr-3 font-medium text-gray-500">Nama / Nomor</th>
                <th className="pb-2 pr-3 font-medium text-gray-500">WhatsApp ID</th>
                <th className="pb-2 font-medium text-gray-500 text-right">Hari Aktif</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c, i) => (
                <tr
                  key={c.contactId}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                  <td className="py-2 pr-3 font-medium text-gray-800 dark:text-gray-200">{c.profileName}</td>
                  <td className="py-2 pr-3 text-gray-500 font-mono text-xs">{c.waId}</td>
                  <td className="py-2 text-right">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {c.activeDays} hari
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
