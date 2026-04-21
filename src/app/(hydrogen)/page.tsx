'use client';

import { useEffect, useState } from 'react';
import { Title, Text, Button, Select } from 'rizzui';
import cn from '@/utils/class-names';
import {
  PiChatCircleText,
  PiUsers,
  PiTrendUp,
  PiCheck,
  PiArrowRight,
  PiWarningCircle,
} from 'react-icons/pi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { dashboardApi, type DashboardStats } from '@/lib/api/dashboard';
import { chatApi } from '@/lib/api/chat';
import Link from 'next/link';
import { format } from 'date-fns';

function StatCard({
  title,
  value,
  icon,
  className,
  metric,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
  metric?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'border border-gray-200 bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="p-2.5 bg-gray-50 rounded-lg dark:bg-gray-700/50 text-gray-900 dark:text-gray-100">
          {icon}
        </div>
        {metric && (
          typeof metric === 'string' ? (
            <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full dark:bg-green-900/10 dark:text-green-400">
              {metric}
            </span>
          ) : metric
        )}
      </div>
      <Text className="text-gray-500 mb-1">{title}</Text>
      <Title as="h4" className="text-2xl font-bold">
        {value}
      </Title>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState('');

  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      try {
        const res: any = await chatApi.getPhoneNumbers();
        const list = Array.isArray(res) ? res : res?.data || [];
        setPhoneNumbers(list);
      } catch (error) {
        console.error('Failed to fetch phone numbers:', error);
      }
    };
    fetchPhoneNumbers();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const data = await dashboardApi.getStats(selectedPhoneNumberId || undefined);
        setStats(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [selectedPhoneNumberId]);

  const phoneNumberOptions = [
    { label: 'Semua Nomor', value: '' },
    ...phoneNumbers.map((pn) => ({
      label: pn.displayPhoneNumber || pn.phoneNumberId,
      value: pn.id,
    })),
  ];

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
        <PiWarningCircle className="w-12 h-12 text-red-500 mb-4" />
        <Title as="h4" className="mb-2">Oops, something went wrong</Title>
        <Text className="text-gray-500 mb-4">{error}</Text>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title as="h2" className="text-2xl lg:text-3xl font-bold mb-2">
            Command Center
          </Title>
          <Text className="text-gray-500">
            Overview of your WhatsApp Business api activity & performance.
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <Select
              options={phoneNumberOptions}
              value={selectedPhoneNumberId}
              onChange={(option: any) => setSelectedPhoneNumberId(option.value)}
              getOptionDisplayValue={(option) => option.label}
              displayValue={(selected) =>
                phoneNumberOptions.find((o) => o.value === selected)?.label || 'Semua Nomor'
              }
              placeholder="Filter nomor..."
              className="w-full sm:w-56"
              inPortal={false}
            />
            <Link href="/chat" className="w-full sm:w-auto">
              <Button className="gap-2 w-full sm:w-auto">
                Go to Chat <PiArrowRight />
              </Button>
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Messages"
          value={stats?.counts.totalMessages.toLocaleString() || 0}
          icon={<PiChatCircleText className="w-6 h-6" />}
          // metric removed until real calculation is implemented
        />
        <StatCard
          title="Active Contacts"
          value={stats?.counts.totalContacts.toLocaleString() || 0}
          icon={<PiUsers className="w-6 h-6" />}
          // metric removed
        />
        <StatCard
          title="Messages Today"
          value={stats?.counts.messagesToday.total.toLocaleString() || 0}
          icon={<PiTrendUp className="w-6 h-6" />}
          className="relative overflow-hidden"
          metric={
            <div className="flex gap-2 text-xs font-medium px-2 py-1 bg-gray-50 text-gray-600 rounded-full dark:bg-gray-700/50 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400">In: {stats?.counts.messagesToday.incoming}</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="text-green-600 dark:text-green-400">Out: {stats?.counts.messagesToday.outgoing}</span>
            </div>
          }
        />
        <StatCard
          title="System Status"
          value="Healthy"
          icon={<PiCheck className="w-6 h-6 text-green-500" />}
          className="border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-900/10"
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="border border-gray-200 bg-white rounded-xl p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <Title as="h4" className="mb-6 font-semibold">
            Message Traffic (Last 30 Days)
          </Title>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    dy={10}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return isNaN(date.getTime()) ? value : format(date, 'dd MMM');
                    }}
                />
                <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return isNaN(date.getTime()) ? value : format(date, 'dd MMM yyyy');
                    }}
                />
                <Legend iconType="circle" />
                <Bar 
                    name="Incoming" 
                    dataKey="incoming" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={60}
                />
                <Bar 
                    name="Outgoing" 
                    dataKey="outgoing" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
