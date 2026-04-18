'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Badge } from 'rizzui';
import {
  PiArrowsClockwise,
  PiTrash,
  PiMagnifyingGlass,
  PiWarning,
  PiDatabase,
  PiX,
} from 'react-icons/pi';
import toast from 'react-hot-toast';
import PageHeader from '@/app/shared/page-header';
import { meilisearchAdminApi, type IndexStats, type IndexDocumentsResult } from '@/lib/api/meilisearch-admin';

const pageHeader = {
  title: 'Meilisearch',
  breadcrumb: [
    { href: '/', name: 'Home' },
    { name: 'Management' },
    { name: 'Meilisearch' },
  ],
};

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-start gap-3">
          <PiWarning className="mt-0.5 h-6 w-6 shrink-0 text-orange-500" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{title}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button color="danger" onClick={onConfirm} isLoading={loading}>
            Ya, Lanjutkan
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Documents Modal ──────────────────────────────────────────────────────────

function DocumentsModal({
  indexName,
  onClose,
}: {
  indexName: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<IndexDocumentsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await meilisearchAdminApi.getDocuments(indexName, { offset, limit });
      if (res.success) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [indexName, offset]);

  useEffect(() => { load(); }, [load]);

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Index: <span className="font-mono text-primary">{indexName}</span>
            </h2>
            {data && (
              <p className="text-sm text-gray-500">
                Total: {data.total.toLocaleString()} dokumen
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <PiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              Memuat...
            </div>
          ) : data && data.results.length > 0 ? (
            <div className="space-y-2">
              {data.results.map((doc, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <pre className="overflow-x-auto text-xs text-gray-700 dark:text-gray-300">
                    {JSON.stringify(doc, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Tidak ada dokumen
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Halaman {currentPage} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Sebelumnya
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setOffset(offset + limit)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ActionKey =
  | 'resync-force-all'
  | 'resync-continue-all'
  | 'clear-all'
  | `clear-${string}`
  | `resync-force-${string}`
  | `resync-continue-${string}`;

interface Confirm {
  key: ActionKey;
  title: string;
  description: string;
}

export default function MeilisearchPage() {
  const [stats, setStats] = useState<IndexStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<ActionKey | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [showDocuments, setShowDocuments] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await meilisearchAdminApi.getStats();
      if (res.success) setStats(res.data);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal mengambil statistik Meilisearch';
      toast.error(errorMessage);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Auto-poll every 3s while any index is still indexing
  useEffect(() => {
    const isIndexing = stats.some((s) => s.isIndexing);
    if (!isIndexing) return;
    const timer = setTimeout(() => {
      meilisearchAdminApi.getStats().then((res) => {
        if (res.success) setStats(res.data);
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [stats]);

  const askConfirm = (c: Confirm) => setConfirm(c);

  const executeAction = async (key: ActionKey) => {
    setLoadingAction(key);
    setConfirm(null);
    try {
      if (key === 'resync-force-all') {
        const res = await meilisearchAdminApi.resyncForceAll();
        if (res.success) {
          toast.success(`${res.message} — contacts: ${res.data.contacts}, messages: ${res.data.messages}`);
        } else {
          toast.error(res.message || 'Gagal melakukan operasi');
        }
      } else if (key === 'resync-continue-all') {
        const res = await meilisearchAdminApi.resyncContinueAll();
        if (res.success) {
          toast.success(`${res.message} — contacts: ${res.data.contacts}, messages: ${res.data.messages}`);
        } else {
          toast.error(res.message || 'Gagal melakukan operasi');
        }
      } else if (key === 'clear-all') {
        await Promise.all([
          meilisearchAdminApi.clearIndex('contacts'),
          meilisearchAdminApi.clearIndex('messages'),
        ]);
        toast.success('Semua dokumen di semua index berhasil dihapus');
      } else if (key.startsWith('clear-')) {
        const idx = key.replace('clear-', '');
        const res = await meilisearchAdminApi.clearIndex(idx);
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.message || 'Gagal melakukan operasi');
        }
      } else if (key.startsWith('resync-force-') && !key.startsWith('resync-force-all')) {
        const idx = key.replace('resync-force-', '');
        const res = await meilisearchAdminApi.resyncForceIndex(idx);
        if (res.success) {
          toast.success(`${res.message} (${res.synced} dokumen)`);
        } else {
          toast.error(res.message || 'Gagal melakukan operasi');
        }
      } else if (key.startsWith('resync-continue-') && !key.startsWith('resync-continue-all')) {
        const idx = key.replace('resync-continue-', '');
        const res = await meilisearchAdminApi.resyncContinueIndex(idx);
        if (res.success) {
          toast.success(`${res.message} (${res.synced} dokumen)`);
        } else {
          toast.error(res.message || 'Gagal melakukan operasi');
        }
      }
      await loadStats();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Terjadi kesalahan';
      toast.error(errorMessage);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <div className="@container mt-6 space-y-6">

        {/* ── Global Actions Card ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
            Global Actions
          </h2>
          <p className="mb-5 text-sm text-gray-500">
            Operasi yang berlaku untuk semua index sekaligus.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              isLoading={loadingAction === 'resync-force-all'}
              disabled={!!loadingAction}
              color="danger"
              onClick={() =>
                askConfirm({
                  key: 'resync-force-all',
                  title: 'Resync Force — Semua Index',
                  description:
                    'Semua dokumen di index contacts dan messages akan DIHAPUS lalu diindex ulang dari database. Proses ini bisa memakan waktu lama.',
                })
              }
            >
              <PiArrowsClockwise className="me-1.5 h-4 w-4" />
              Resync Force (Semua)
            </Button>

            <Button
              isLoading={loadingAction === 'resync-continue-all'}
              disabled={!!loadingAction}
              variant="outline"
              onClick={() =>
                askConfirm({
                  key: 'resync-continue-all',
                  title: 'Resync Continue — Semua Index',
                  description:
                    'Index yang sudah ada tidak dihapus. Data dari database akan di-upsert ke Meilisearch. Dokumen yang sudah ada akan di-overwrite.',
                })
              }
            >
              <PiArrowsClockwise className="me-1.5 h-4 w-4" />
              Resync Continue (Semua)
            </Button>

            <Button
              isLoading={loadingAction === 'clear-all'}
              disabled={!!loadingAction}
              color="danger"
              variant="outline"
              onClick={() =>
                askConfirm({
                  key: 'clear-all',
                  title: 'Delete All — Semua Index',
                  description:
                    'Semua dokumen di index contacts dan messages akan DIHAPUS PERMANEN. Index itu sendiri tidak dihapus, hanya isinya.',
                })
              }
            >
              <PiTrash className="me-1.5 h-4 w-4" />
              Delete All (Semua)
            </Button>
          </div>
        </div>

        {/* ── Per-Index Table ── */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b px-6 py-4 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Daftar Index
            </h2>
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              Memuat statistik...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="px-6 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                      Index
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                      Dokumen
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {stats.map((idx) => (
                    <tr key={idx.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <PiDatabase className="h-4 w-4 text-primary" />
                          <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                            {idx.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {idx.numberOfDocuments.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {idx.isIndexing ? (
                          <Badge color="warning">Indexing...</Badge>
                        ) : (
                          <Badge color="success">Ready</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Show */}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!loadingAction}
                            onClick={() => setShowDocuments(idx.name)}
                            title="Lihat isi index"
                          >
                            <PiMagnifyingGlass className="me-1 h-3.5 w-3.5" />
                            Show
                          </Button>

                          {/* Delete All */}
                          <Button
                            size="sm"
                            color="danger"
                            variant="outline"
                            isLoading={loadingAction === `clear-${idx.name}` as ActionKey}
                            disabled={!!loadingAction}
                            onClick={() =>
                              askConfirm({
                                key: `clear-${idx.name}` as ActionKey,
                                title: `Hapus Semua — ${idx.name}`,
                                description: `Semua ${idx.numberOfDocuments.toLocaleString()} dokumen di index "${idx.name}" akan dihapus permanen. Index dan settingnya tetap ada.`,
                              })
                            }
                          >
                            <PiTrash className="me-1 h-3.5 w-3.5" />
                            Delete All
                          </Button>

                          {/* Resync Force */}
                          <Button
                            size="sm"
                            color="danger"
                            isLoading={loadingAction === `resync-force-${idx.name}` as ActionKey}
                            disabled={!!loadingAction}
                            onClick={() =>
                              askConfirm({
                                key: `resync-force-${idx.name}` as ActionKey,
                                title: `Resync Force — ${idx.name}`,
                                description: `Semua dokumen di "${idx.name}" akan DIHAPUS lalu diindex ulang dari database.`,
                              })
                            }
                          >
                            <PiArrowsClockwise className="me-1 h-3.5 w-3.5" />
                            Resync Force
                          </Button>

                          {/* Resync Continue */}
                          <Button
                            size="sm"
                            isLoading={loadingAction === `resync-continue-${idx.name}` as ActionKey}
                            disabled={!!loadingAction}
                            onClick={() =>
                              askConfirm({
                                key: `resync-continue-${idx.name}` as ActionKey,
                                title: `Resync Continue — ${idx.name}`,
                                description: `Data dari database akan di-upsert ke "${idx.name}". Dokumen yang sudah ada akan di-overwrite, tidak ada yang dihapus.`,
                              })
                            }
                          >
                            <PiArrowsClockwise className="me-1 h-3.5 w-3.5" />
                            Resync Continue
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        loading={!!loadingAction}
        onConfirm={() => confirm && executeAction(confirm.key)}
        onCancel={() => setConfirm(null)}
      />

      {/* Documents Modal */}
      {showDocuments && (
        <DocumentsModal indexName={showDocuments} onClose={() => setShowDocuments(null)} />
      )}
    </>
  );
}
