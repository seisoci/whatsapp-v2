'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import TablePagination from '@core/components/table/pagination';
import { MessageQueueItem } from '.';
import { createMessageQueueColumns } from './columns';
import { Flex, Title, Loader, Select, Input, Button } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { messageQueuesApi, type MessageQueueFilters } from '@/lib/api/message-queues';
import MessageQueueDetail from './message-queue-detail';
import toast from 'react-hot-toast';
import { PiMagnifyingGlass, PiExportDuotone } from 'react-icons/pi';
import { DatePicker } from '@/ui/datepicker';
import { format } from 'date-fns';

const queueStatusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const billableOptions = [
  { label: 'All', value: '' },
  { label: 'Billable', value: 'true' },
  { label: 'Non-Billable', value: 'false' },
];

function exportToCsv(data: MessageQueueItem[]) {
  const headers = [
    'ID',
    'Template Name',
    'Template Category',
    'Template Language',
    'Recipient',
    'Queue Status',
    'Message Status',
    'WAMID',
    'API Key',
    'API Endpoint',
    'IP Address',
    'Device',
    'User Agent',
    'Billable',
    'Attempts',
    'Max Attempts',
    'Error Code',
    'Error Message',
    'Created At',
    'Processed At',
    'Completed At',
  ];

  const escCsv = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map((item) =>
    [
      item.id,
      item.template_name,
      item.template_category || '',
      item.template_language,
      item.recipient_phone,
      item.queue_status,
      item.message_status || '',
      item.wamid || '',
      item.api_key_masked || '',
      item.api_endpoint_name || '',
      item.ip_address || '',
      item.device_info || '',
      item.user_agent || '',
      item.is_billable ? 'Yes' : 'No',
      item.attempts,
      item.max_attempts,
      item.error_code || '',
      item.error_message || '',
      item.created_at,
      item.processed_at || '',
      item.completed_at || '',
    ]
      .map(escCsv)
      .join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `message-queues-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function MessageQueueTable() {
  const [data, setData] = useState<MessageQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [queueStatus, setQueueStatus] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [billable, setBillable] = useState('');

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { openModal } = useModal();

  const fetchData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const filters: MessageQueueFilters = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      };
      if (queueStatus) filters.queue_status = queueStatus;
      if (templateName) filters.template_name = templateName;
      if (billable) filters.is_billable = billable;
      if (dateRange[0]) filters.date_from = format(dateRange[0], 'yyyy-MM-dd');
      if (dateRange[1]) filters.date_to = format(dateRange[1], 'yyyy-MM-dd');

      const response = await messageQueuesApi.getAll(filters);

      if (response.success && response.data) {
        setData(Array.isArray(response.data) ? response.data : []);
        if (response.pagination) {
          setTotalRecords(response.pagination.total);
        }
      } else {
        toast.error('Failed to load message queues');
        setData([]);
        setTotalRecords(0);
      }
    } catch (error: any) {
      console.error('Error fetching message queues:', error);
      toast.error('Failed to load message queues');
      setData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData(true);
  }, []);

  // Pagination change
  useEffect(() => {
    if (loading) return;
    fetchData(false);
  }, [pagination.pageIndex, pagination.pageSize]);

  // Filter change (debounced for template name)
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      fetchData(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [templateName]);

  // Other filter changes (immediate)
  useEffect(() => {
    if (loading) return;
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    fetchData(false);
  }, [queueStatus, billable, dateRange[0]?.getTime(), dateRange[1]?.getTime()]);

  const handleViewDetail = (item: MessageQueueItem) => {
    openModal({
      view: <MessageQueueDetail item={item} />,
      customSize: 1100,
    });
  };

  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    setDateRange(dates);
  };

  const handleExportCsv = () => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    exportToCsv(data);
    toast.success(`Exported ${data.length} records to CSV`);
  };

  return (
    <div ref={tableContainerRef}>
      {/* Filters */}
      <Flex className="mb-3 gap-3 flex-wrap" align="end">
        <div className="w-52">
          <Input
            placeholder="Search template..."
            prefix={<PiMagnifyingGlass className="h-4 w-4" />}
            size="sm"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            size="sm"
            label=""
            placeholder="Queue Status"
            options={queueStatusOptions}
            value={queueStatusOptions.find((o) => o.value === queueStatus) || queueStatusOptions[0]}
            onChange={(opt: any) => setQueueStatus(opt?.value || '')}
          />
        </div>
        <div className="w-36">
          <Select
            size="sm"
            label=""
            placeholder="Billable"
            options={billableOptions}
            value={billableOptions.find((o) => o.value === billable) || billableOptions[0]}
            onChange={(opt: any) => setBillable(opt?.value || '')}
          />
        </div>
        <div className="w-64">
          <DatePicker
            selectsRange
            startDate={dateRange[0]!}
            endDate={dateRange[1]!}
            onChange={(dates: any) => handleDateRangeChange(dates)}
            monthsShown={2}
            dateFormat="dd MMM yyyy"
            placeholderText="Filter by date range"
            inputProps={{
              size: 'sm',
              clearable: true,
              onClear: () => handleDateRangeChange([null, null]),
            }}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCsv}
          className="gap-1.5"
        >
          <PiExportDuotone className="h-4 w-4" />
          Export CSV
        </Button>
      </Flex>

      <MessageQueueTableContent
        data={data}
        loading={loading}
        isRefreshing={isRefreshing}
        totalRecords={totalRecords}
        pagination={pagination}
        setPagination={setPagination}
        onViewDetail={handleViewDetail}
      />
    </div>
  );
}

function MessageQueueTableContent({
  data,
  loading,
  isRefreshing,
  totalRecords,
  pagination,
  setPagination,
  onViewDetail,
}: {
  data: MessageQueueItem[];
  loading: boolean;
  isRefreshing: boolean;
  totalRecords: number;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<React.SetStateAction<{ pageIndex: number; pageSize: number }>>;
  onViewDetail: (item: MessageQueueItem) => void;
}) {
  const { table, setData } = useTanStackTable<MessageQueueItem>({
    tableData: data,
    columnConfig: createMessageQueueColumns({ onViewDetail }),
    options: {
      pageCount: Math.ceil(totalRecords / pagination.pageSize),
      state: {
        pagination,
      },
      onPaginationChange: setPagination,
      manualPagination: true,
      enableColumnResizing: false,
    },
  });

  useEffect(() => {
    setData([...data]);
  }, [data, setData]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader variant="spinner" size="lg" />
      </div>
    );
  }

  return (
    <>
      <Flex
        direction="col"
        justify="between"
        className="mb-4 gap-3 xs:flex-row xs:items-center"
      >
        <Title as="h3" className="text-base font-semibold sm:text-lg">
          Message Queues ({totalRecords} total)
        </Title>
      </Flex>

      <div className="relative overflow-hidden">
        <div
          className="transition-opacity duration-300 ease-in-out"
          style={{ opacity: isRefreshing ? 0.4 : 1 }}
        >
          <Table
            table={table}
            variant="minimal"
            classNames={{
              rowClassName: 'last:!border-b-0 hover:bg-gray-50',
              cellClassName: 'py-3',
            }}
          />
        </div>

        {isRefreshing && (
          <div className="absolute right-4 top-4 z-10">
            <Loader variant="spinner" size="sm" className="text-primary" />
          </div>
        )}
      </div>

      <TablePagination table={table} className="py-4" />
    </>
  );
}
