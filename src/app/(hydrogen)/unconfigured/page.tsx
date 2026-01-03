'use client';

import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/app/shared/page-header';
import { getOltSelect, getOltUnconfigured } from '@/lib/sanctum-api';
import { Loader, Button } from 'rizzui';
import toast from 'react-hot-toast';
import Link from 'next/link';

const pageHeader = {
  title: 'Unconfigured ONU',
  breadcrumb: [
    { name: 'Unconfigured ONU' },
  ],
};

interface OltOption {
  id: number;
  name: string;
}

interface UnconfiguredOnu {
  olt_id: number;
  olt_name: string;
  olt_ip: string;
  data: any[];
  loading: boolean;
  error?: string;
}

export default function UnconfiguredOnuPage() {
  const [unconfiguredData, setUnconfiguredData] = useState<UnconfiguredOnu[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [totalOlts, setTotalOlts] = useState(0);
  const [fetchedCount, setFetchedCount] = useState(0);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAllOltsAndUnconfigured();
    }
  }, []);

  const fetchAllOltsAndUnconfigured = async () => {
    try {
      setInitialLoading(true);
      setUnconfiguredData([]);
      setFetchedCount(0);

      const response = await getOltSelect();
      if (response.code === 200 && response.data.length > 0) {
        const olts = response.data;
        setTotalOlts(olts.length);
        setInitialLoading(false);

        const initialData: UnconfiguredOnu[] = olts.map((olt: OltOption) => ({
          olt_id: olt.id,
          olt_name: olt.name,
          olt_ip: '',
          data: [],
          loading: true,
        }));

        setUnconfiguredData(initialData);

        const fetchPromises = olts.map(async (olt: OltOption) => {
          try {
            const unconfiguredResponse = await getOltUnconfigured(olt.id);
            const hasData = unconfiguredResponse.data && unconfiguredResponse.data.length > 0;

            setFetchedCount((prev) => prev + 1);

            if (hasData) {
              setUnconfiguredData((prev) =>
                prev.map((item) =>
                  item.olt_id === olt.id
                    ? {
                      ...item,
                      data: unconfiguredResponse.data,
                      loading: false,
                    }
                    : item
                )
              );
            } else {
              setUnconfiguredData((prev) =>
                prev.filter((item) => item.olt_id !== olt.id)
              );
            }

            return { success: true, oltId: olt.id, hasData };
          } catch (error: any) {
            setFetchedCount((prev) => prev + 1);

            setUnconfiguredData((prev) =>
              prev.filter((item) => item.olt_id !== olt.id)
            );

            return { success: false, oltId: olt.id, error: error.message };
          }
        });

        const results = await Promise.all(fetchPromises);

        const successCount = results.filter((r) => r.success && r.hasData).length;
        const errorCount = results.filter((r) => !r.success).length;

        if (successCount === 0) {
          toast.error('No unconfigured ONUs found in any OLT');
        } else {
          toast.success(`Loaded ${successCount} OLT(s) with unconfigured ONUs`);
        }

        if (errorCount > 0) {
          toast.error(`Failed to fetch ${errorCount} OLT(s)`);
        }
      } else {
        setInitialLoading(false);
        toast.error('No OLT devices found');
      }
    } catch (error: any) {
      setInitialLoading(false);
      toast.error(error.message || 'Failed to load OLT data');
    }
  };

  const handleRefresh = () => {
    fetchAllOltsAndUnconfigured();
    toast.success('Refreshing data...');
  };

  if (initialLoading) {
    return (
      <>
        <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader variant="spinner" size="xl" className="mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading OLT devices...</p>
          </div>
        </div>
      </>
    );
  }

  const displayData = unconfiguredData.filter((olt) => !olt.loading);
  const loadingCount = unconfiguredData.filter((olt) => olt.loading).length;

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <div className="flex items-center gap-3">
          {loadingCount > 0 && (
            <span className="text-sm text-gray-500">
              Fetching: {fetchedCount}/{totalOlts}
            </span>
          )}
          <Button
            onClick={handleRefresh}
            disabled={loadingCount > 0}
          >
            Refresh All
          </Button>
        </div>
      </PageHeader>

      <div className="@container">
        {loadingCount > 0 && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center gap-3">
              <Loader variant="spinner" size="md" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Fetching data from {totalOlts} OLT devices...
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Progress: {fetchedCount}/{totalOlts} completed
                </p>
              </div>
            </div>
          </div>
        )}

        {displayData.length === 0 && loadingCount === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-900/50">
            <p className="text-gray-500 dark:text-gray-400">
              No unconfigured ONUs found in any OLT
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayData.map((oltData) => (
              <div
                key={oltData.olt_id}
                className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {oltData.olt_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      OLT ID: {oltData.olt_id}
                    </p>
                  </div>
                </div>

                {oltData.data.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">No</th>
                          <th className="px-4 py-3 text-left font-semibold">PON Type</th>
                          <th className="px-4 py-3 text-left font-semibold">Board</th>
                          <th className="px-4 py-3 text-left font-semibold">Port</th>
                          <th className="px-4 py-3 text-left font-semibold">SN / MAC</th>
                          <th className="px-4 py-3 text-left font-semibold">Type</th>
                          <th className="px-4 py-3 text-right font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {oltData.data.map((onu: any, idx: number) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                          >
                            <td className="px-4 py-3">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${onu.pon_type === 'GPON'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                {onu.pon_type || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {onu.board || '-'}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {onu.port || '-'}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {onu.sn_or_mac || '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {onu.type || '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/authorize?board=${onu.board}&port=${onu.port}&sn=${onu.sn_or_mac}&pon=${onu.pon_type?.toLowerCase()}&onu_type=${onu.type_id || ''}&olt=${oltData.olt_id}`}
                              >
                                <Button size="sm">
                                  Authorize
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total: <span className="font-semibold">{oltData.data.length}</span> unconfigured ONUs
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
