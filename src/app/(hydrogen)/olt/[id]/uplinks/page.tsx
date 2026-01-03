'use client';

import { useEffect, useState, use } from 'react';
import { getOltUplinks } from '@/lib/sanctum-api';
import { Uplink } from '@/types/olt';
import WidgetCard from '@core/components/cards/widget-card';
import { Loader, Text } from 'rizzui';
import toast from 'react-hot-toast';

export default function OltUplinksPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [uplinks, setUplinks] = useState<Uplink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUplinks = async () => {
    try {
      setLoading(true);
      const response = await getOltUplinks(resolvedParams.id);

      if (response.data) {
        setUplinks(response.data);
      } else {
        toast.error('Failed to load uplinks');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load uplinks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUplinks();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="mt-6 flex min-h-[400px] items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <WidgetCard title={`Uplink Ports (${uplinks.length})`}>
        {uplinks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Port</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Admin State</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Negotiation</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">MTU</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Wavelength</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Temp</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700 w-10">Tagged VLANs</th>
                </tr>
              </thead>
              <tbody>
                {uplinks.map((uplink, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium font-mono">{uplink.uplink_port}</td>
                    <td className="py-3 text-sm text-gray-600">{uplink.description || '-'}</td>
                    <td className="py-3 text-sm">{uplink.type || '-'}</td>
                    <td className="py-3 text-sm">
                      <span className={uplink.admin_state === 'Enabled' ? 'text-green-600' : 'text-gray-500'}>
                        {uplink.admin_state}
                      </span>
                    </td>
                    <td className="py-3 text-sm">
                      <span
                        className={
                          uplink.status.includes('FullD') || uplink.status.includes('G-')
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {uplink.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm">{uplink.negotiation}</td>
                    <td className="py-3 text-sm font-mono">{uplink.mtu}</td>
                    <td className="py-3 text-sm">{uplink.wavel}</td>
                    <td className="py-3 text-sm">{uplink.temp}</td>
                    <td className="py-3 text-sm font-mono">{uplink.tagged_vlans}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center">
            <Text className="text-gray-500">No uplinks data available</Text>
          </div>
        )}
      </WidgetCard>
    </div>
  );
}
