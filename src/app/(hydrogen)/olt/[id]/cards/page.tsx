'use client';

import { useEffect, useState, use } from 'react';
import { getOltCards } from '@/lib/sanctum-api';
import { OltCard } from '@/types/olt';
import WidgetCard from '@core/components/cards/widget-card';
import { Loader, Text, Badge, Progressbar } from 'rizzui';
import toast from 'react-hot-toast';

export default function OltCardsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [cards, setCards] = useState<OltCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOltCards = async () => {
    try {
      setLoading(true);
      const response = await getOltCards(resolvedParams.id);

      if (response.data) {
        setCards(response.data);
      } else {
        toast.error('Failed to load OLT cards');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load OLT cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOltCards();
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
      <WidgetCard title={`OLT Cards (${cards.length})`}>
        {cards.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Slot</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Real Type</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Ports</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">SW Version</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">CPU Load</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">RAM Load</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-700">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card, index) => {
                  const cpuLoad = typeof card.cpu_load === 'string' ? parseFloat(card.cpu_load) : (card.cpu_load || 0);
                  const ramLoad = typeof card.ram_load === 'string' ? parseFloat(card.ram_load) : (card.ram_load || 0);

                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium">{card.slot}</td>
                      <td className="py-3 text-sm">{card.type}</td>
                      <td className="py-3 text-sm">{card.real_type}</td>
                      <td className="py-3 text-sm">{card.ports}</td>
                      <td className="py-3 text-sm font-mono">{card.sw_version}</td>
                      <td className="py-3 text-sm">
                        <Badge
                          variant="flat"
                          color={card.status === 'Active' ? 'success' : 'secondary'}
                        >
                          {card.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="w-32">
                          <div className="mb-1 flex items-center justify-between">
                            <Text className="text-xs font-medium text-gray-900">{cpuLoad}%</Text>
                          </div>
                          <Progressbar
                            value={cpuLoad}
                            color={
                              cpuLoad >= 80
                                ? 'danger'
                                : cpuLoad >= 60
                                  ? 'warning'
                                  : 'success'
                            }
                            size="sm"
                          />
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="w-32">
                          <div className="mb-1 flex items-center justify-between">
                            <Text className="text-xs font-medium text-gray-900">{ramLoad}%</Text>
                          </div>
                          <Progressbar
                            value={ramLoad}
                            color={
                              ramLoad >= 80
                                ? 'danger'
                                : ramLoad >= 60
                                  ? 'warning'
                                  : 'success'
                            }
                            size="sm"
                          />
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{card.info_updated}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center">
            <Text className="text-gray-500">No cards data available</Text>
          </div>
        )}
      </WidgetCard>
    </div>
  );
}
