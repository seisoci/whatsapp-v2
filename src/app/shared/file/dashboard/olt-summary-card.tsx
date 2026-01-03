'use client';

import { useState, useEffect } from 'react';
import WidgetCard from '@core/components/cards/widget-card';
import { Avatar, Title, Text } from 'rizzui';
import { getDashboardOltSummary } from '@/lib/sanctum-api';

interface OltData {
  id: number;
  name: string;
  onu_count: number;
}

export default function OltSummaryCard({ className }: { className?: string }) {
  const [olts, setOlts] = useState<OltData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOnus, setTotalOnus] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardOltSummary();

      if (response.code === 200 && response.data) {
        setOlts(response.data);
        const total = response.data.reduce((sum: number, olt: OltData) => sum + olt.onu_count, 0);
        setTotalOnus(total);
      }
    } catch (error) {
      console.error('Error fetching OLT summary:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WidgetCard
      title="OLT Summary"
      titleClassName="font-normal sm:text-sm text-gray-500 mb-2.5 font-inter"
      className={className}
      description={
        <div className="flex items-center justify-start">
          <Title as="h2" className="me-2 font-semibold">
            {totalOnus}
          </Title>
          <Text className="flex items-center leading-none text-gray-500">
            <Text as="span" className="text-sm">
              Total ONUs
            </Text>
          </Text>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Text className="text-sm text-gray-500">Loading...</Text>
        </div>
      ) : (
        <div className=" ">
          <div className="mb-4 flex items-center justify-between border-b border-muted pb-4 font-medium last:mb-0 last:border-0 last:pb-0">
            <Text as="span" className="text-sm text-gray-600 dark:text-gray-700">
              OLT Name
            </Text>
            <Text as="span">ONUs</Text>
          </div>
          {olts.length === 0 ? (
            <div className="py-8 text-center">
              <Text className="text-sm text-gray-500">No OLT data available</Text>
            </div>
          ) : (
            olts.map((olt) => (
              <div
                key={olt.id}
                className="mb-4 flex items-center justify-between border-b border-muted pb-4 last:mb-0 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-start gap-2">
                  <Avatar
                    name={olt.name}
                    className="rounded-lg text-white"
                    size="sm"
                  />
                  <Text
                    as="span"
                    className="font-lexend text-sm font-medium text-gray-900 dark:text-gray-700"
                  >
                    {olt.name}
                  </Text>
                </div>
                <Text as="span" className="font-medium">{olt.onu_count}</Text>
              </div>
            ))
          )}
        </div>
      )}
    </WidgetCard>
  );
}
