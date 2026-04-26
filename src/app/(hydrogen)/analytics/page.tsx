'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import PageHeader from '@/app/shared/page-header';
import { DatePicker } from '@/ui/datepicker';
import { analyticsApi } from '@/lib/api/analytics';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
import { MessagesOverTimeChart } from '@/app/shared/analytics/messages-over-time-chart';
import { MessageStatusChart } from '@/app/shared/analytics/message-status-chart';
import { TopTemplatesChart } from '@/app/shared/analytics/top-templates-chart';
import { MessagesPerAgentChart } from '@/app/shared/analytics/messages-per-agent-chart';
import { ContactGrowthChart } from '@/app/shared/analytics/contact-growth-chart';
import { TopActiveContactsTable } from '@/app/shared/analytics/top-active-contacts-table';
import type {
  MessageOverTime,
  MessageStatusItem,
  TopTemplate,
  AgentMessageCount,
  ContactGrowthItem,
  TopActiveContact,
} from '@/lib/api/analytics';

const pageHeader = {
  title: 'Analytics & Laporan',
  breadcrumb: [
    { href: '/', name: 'Home' },
    { name: 'Analytics' },
  ],
};

// Build a human-friendly label for a phone number that includes both the
// custom/verified name and the actual phone number when available.
function formatPhoneNumberLabel(pn: any): string {
  const name = pn.name || pn.verifiedName || null;
  const phone = pn.displayPhoneNumber || pn.phoneNumberId || '';
  if (name && phone) return `${name} (${phone})`;
  return name || phone || 'Phone number';
}

export default function AnalyticsPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState('');

  // Date range filter — defaults to last 30 days inclusive of today.
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    subDays(new Date(), 29),
    new Date(),
  ]);

  const [isLoading, setIsLoading] = useState(true);

  const [messagesOverTime, setMessagesOverTime] = useState<MessageOverTime[]>([]);
  const [messageStatus, setMessageStatus] = useState<MessageStatusItem[]>([]);
  const [topTemplates, setTopTemplates] = useState<TopTemplate[]>([]);
  const [messagesPerAgent, setMessagesPerAgent] = useState<AgentMessageCount[]>([]);
  const [contactGrowth, setContactGrowth] = useState<ContactGrowthItem[]>([]);
  const [topActiveContacts, setTopActiveContacts] = useState<TopActiveContact[]>([]);

  useEffect(() => {
    phoneNumbersApi.getAll().then((res: any) => {
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setPhoneNumbers(list.filter((pn: any) => !pn.isHidden));
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    const [start, end] = dateRange;
    // Skip fetch until the user has picked both ends of the range.
    if (!start || !end) return;

    setIsLoading(true);
    const filters = {
      phoneNumberId: selectedPhoneNumberId || undefined,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
    Promise.all([
      analyticsApi.getMessagesOverTime(filters),
      analyticsApi.getMessageStatus(filters),
      analyticsApi.getTopTemplates(filters),
      analyticsApi.getMessagesPerAgent(filters),
      analyticsApi.getContactGrowth(filters),
      analyticsApi.getTopActiveContacts(filters),
    ])
      .then(([mot, ms, tt, mpa, cg, tac]) => {
        setMessagesOverTime(mot);
        setMessageStatus(ms);
        setTopTemplates(tt);
        setMessagesPerAgent(mpa);
        setContactGrowth(cg);
        setTopActiveContacts(tac);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedPhoneNumberId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    setDateRange(dates);
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-72">
            <DatePicker
              selectsRange
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              onChange={(dates: any) => handleDateRangeChange(dates)}
              monthsShown={2}
              dateFormat="dd MMM yyyy"
              placeholderText="Pilih rentang tanggal"
              maxDate={new Date()}
              inputProps={{
                size: 'sm',
                clearable: true,
                onClear: () =>
                  handleDateRangeChange([subDays(new Date(), 29), new Date()]),
              }}
            />
          </div>

          <select
            value={selectedPhoneNumberId}
            onChange={(e) => setSelectedPhoneNumberId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">Semua Nomor</option>
            {phoneNumbers.map((pn: any) => (
              <option key={pn.id} value={pn.id}>
                {formatPhoneNumberLabel(pn)}
              </option>
            ))}
          </select>

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
          {/* Row 1: Pesan masuk & keluar */}
          <MessagesOverTimeChart data={messagesOverTime} />

          {/* Row 2: Status pesan + Pesan per Agen (donut) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MessageStatusChart data={messageStatus} />
            <MessagesPerAgentChart data={messagesPerAgent} />
          </div>

          {/* Row 3: Top templates + Pertumbuhan kontak */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopTemplatesChart data={topTemplates} />
            <ContactGrowthChart data={contactGrowth} />
          </div>

          {/* Row 5: Top 50 kontak aktif */}
          <TopActiveContactsTable data={topActiveContacts} />
        </div>
      )}
    </>
  );
}
