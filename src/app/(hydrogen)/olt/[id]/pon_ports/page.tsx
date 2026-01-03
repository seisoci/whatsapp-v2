'use client';

import { useEffect, useState, use } from 'react';
import { getOltPonPorts } from '@/lib/sanctum-api';
import { CardWithPorts } from '@/types/olt';
import WidgetCard from '@core/components/cards/widget-card';
import { Loader, Text, Badge } from 'rizzui';
import toast from 'react-hot-toast';

export default function OltPonPortsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [cardsWithPorts, setCardsWithPorts] = useState<CardWithPorts[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPonPorts = async () => {
    try {
      setLoading(true);
      const response = await getOltPonPorts(resolvedParams.id);

      if (response.data) {
        setCardsWithPorts(response.data);
      } else {
        toast.error('Failed to load PON ports');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load PON ports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPonPorts();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="mt-6 flex min-h-[400px] items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {cardsWithPorts.length > 0 ? (
        cardsWithPorts.map((card, cardIndex) => (
          <WidgetCard
            key={cardIndex}
            title={`Slot ${card.slot} - ${card.board_type} (${card.card_type}) - ${card.ports.length} Ports`}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">Port</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">Admin State</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">ONUs</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">Avg Signal</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">TX Power</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">Range</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {card.ports.map((port, portIndex) => (
                    <tr key={portIndex} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium">{port.port}</td>
                      <td className="py-3 text-sm">{port.type}</td>
                      <td className="py-3 text-sm">
                        <Badge
                          variant="flat"
                          color={port.admin_state === 'Enabled' ? 'success' : 'secondary'}
                        >
                          {port.admin_state}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm">
                        <Badge
                          variant="flat"
                          color={port.status === 'Up' ? 'success' : 'danger'}
                        >
                          {port.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm">{port.onus}</td>
                      <td className="py-3 text-sm font-mono">{port.average_signal}</td>
                      <td className="py-3 text-sm font-mono">{port.tx_power}</td>
                      <td className="py-3 text-sm">{port.range}</td>
                      <td className="py-3 text-sm text-gray-600">{port.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WidgetCard>
        ))
      ) : (
        <WidgetCard title="PON Ports">
          <div className="flex min-h-[200px] items-center justify-center">
            <Text className="text-gray-500">No PON ports data available</Text>
          </div>
        </WidgetCard>
      )}
    </div>
  );
}
