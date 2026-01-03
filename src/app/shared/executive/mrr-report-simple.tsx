'use client';

import WidgetCard from '@core/components/cards/widget-card';
import { toCurrency } from '@core/utils/to-currency';
import { Avatar, Title, Text } from 'rizzui';
import cn from '@core/utils/class-names';
import TrendingUpIcon from '@core/components/icons/trending-up';

const projects = [
  {
    id: 1,
    name: 'Mark Redesign task',
    budget: -85,
    color: '#EF4444',
  },
  {
    id: 2,
    name: 'Tenco Revamp',
    budget: 253,
    color: '#FF4794',
  },
  {
    id: 3,
    name: 'Alice Matro',
    budget: -40,
    color: '#FF9F47',
  },
  {
    id: 4,
    name: 'Polly Mgt Ltd.',
    budget: -63,
    color: '#726D76',
  },
];

export default function MRRReportSimple({ className }: { className?: string }) {
  return (
    <WidgetCard
      title="MRR Report"
      titleClassName="font-normal sm:text-sm text-gray-500 mb-2.5 font-inter"
      className={className}
      description={
        <div className="flex items-center justify-start">
          <Title as="h2" className="me-2 font-semibold">
            $83.45k
          </Title>
          <Text className="flex items-center leading-none text-gray-500">
            <Text
              as="span"
              className={cn(
                'me-2 inline-flex items-center font-medium text-green'
              )}
            >
              <TrendingUpIcon className="me-1 h-4 w-4" />
              32.40%
            </Text>
          </Text>
        </div>
      }
    >
      <div className=" ">
        <div className="mb-4 flex items-center justify-between border-b border-muted pb-4 font-medium last:mb-0 last:border-0 last:pb-0">
          <Text as="span" className="text-sm text-gray-600 dark:text-gray-700">
            Customer
          </Text>
          <Text as="span">MRR</Text>
        </div>
        {projects.map((item) => (
          <div
            key={item.id}
            className="mb-4 flex items-center justify-between border-b border-muted pb-4 last:mb-0 last:border-0 last:pb-0"
          >
            <div className="flex items-center justify-start gap-2">
              <Avatar
                name={item.name}
                className="rounded-lg text-white"
                size="sm"
              />
              <Text
                as="span"
                className="font-lexend text-sm font-medium text-gray-900 dark:text-gray-700"
              >
                {item.name}
              </Text>
            </div>
            <Text as="span">{toCurrency(item.budget)}</Text>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
