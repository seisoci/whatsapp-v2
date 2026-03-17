'use client';

import { useEffect, useState, useCallback } from 'react';
import PageHeader from '@/app/shared/page-header';
import { analyticsApi } from '@/lib/api/analytics';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
import { MessagesOverTimeChart } from '@/app/shared/analytics/messages-over-time-chart';
import { MessageStatusChart } from '@/app/shared/analytics/message-status-chart';
import { TopTemplatesChart } from '@/app/shared/analytics/top-templates-chart';
import { MessagesPerAgentChart } from '@/app/shared/analytics/messages-per-agent-chart';
import { ContactGrowthChart } from '@/app/shared/analytics/contact-growth-chart';
import { ResponseTimeStatsCard } from '@/app/shared/analytics/response-time-stats';
import type {
  MessageOverTime,
  MessageStatusItem,
  TopTemplate,
  ResponseTimeStats,
  AgentMessageCount,
  ContactGrowthItem,
} from '@/lib/api/analytics';

const pageHeader = {
  title: 'Analytics & Laporan',
  breadcrumb: [
    { href: '/', name: 'Home' },
    { name: 'Analytics' },
  ],
};

const DAYS_OPTIONS = [
  { label: '7 Hari', value: 7 },
  { label: '30 Hari', value: 30 },
  { label: '90 Hari', value: 90 },
];

export default function AnalyticsPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState('');
  const [selectedDays, setSelectedDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  const [messagesOverTime, setMessagesOverTime] = useState<MessageOverTime[]>([]);
  const [messageStatus, setMessageStatus] = useState<MessageStatusItem[]>([]);
  const [topTemplates, setTopTemplates] = useState<TopTemplate[]>([]);
  const [responseTime, setResponseTime] = useState<ResponseTimeStats | null>(null);
  const [messagesPerAgent, setMessagesPerAgent] = useState<AgentMessageCount[]>([]);
  const [contactGrowth, setContactGrowth] = useState<ContactGrowthItem[]>([]);

  useEffect(() => {
    phoneNumbersApi.getAll().then((res: any) => {
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setPhoneNumbers(list);
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    const filters = {
      phoneNumberId: selectedPhoneNumberId || undefined,
      days: selectedDays,
    };
    Promise.all([
      analyticsApi.getMessagesOverTime(filters),
      analyticsApi.getMessageStatus(filters),
      analyticsApi.getTopTemplates(filters),
      analyticsApi.getResponseTime(filters),
      analyticsApi.getMessagesPerAgent(filters),
      analyticsApi.getContactGrowth(filters),
    ])
      .then(([mot, ms, tt, rt, mpa, cg]) => {
        setMessagesOverTime(mot);
        setMessageStatus(ms);
        setTopTemplates(tt);
        setResponseTime(rt);
        setMessagesPerAgent(mpa);
        setContactGrowth(cg);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedPhoneNumberId, selectedDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Nomor HP */}
          <select
            value={selectedPhoneNumberId}
            onChange={(e) => setSelectedPhoneNumberId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">Semua Nomor</option>
            {phoneNumbers.map((pn: any) => (
              <option key={pn.id} value={pn.id}>
                {pn.displayPhoneNumber || pn.phoneNumberId || pn.name}
              </option>
            ))}
          </select>

          {/* Filter Periode */}
          <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
            {DAYS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedDays(opt.value)}
                className={`px-3 py-2 text-sm transition-colors ${
                  selectedDays === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            {isLoading ? 'Memuat...' : '↻ Refresh'}
          </button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6">
          {/* Row 1: Pesan masuk & keluar — full width */}
          <MessagesOverTimeChart data={messagesOverTime} />

          {/* Row 2: Status pesan + Waktu respon */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MessageStatusChart data={messageStatus} />
            <ResponseTimeStatsCard data={responseTime} />
          </div>

          {/* Row 3: Top templates + Per agen */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopTemplatesChart data={topTemplates} />
            <MessagesPerAgentChart data={messagesPerAgent} />
          </div>

          {/* Row 4: Pertumbuhan kontak — full width */}
          <ContactGrowthChart data={contactGrowth} />
        </div>
      )}
    </>
  );
}
