'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { MessageQueueItem } from '.';
import { Badge, Tooltip, Text, Flex } from 'rizzui';
import { getStatusBadge } from '@core/components/table-utils/get-status-badge';
import { format } from 'date-fns';

const columnHelper = createColumnHelper<MessageQueueItem>();

export const createMessageQueueColumns = ({
  onViewDetail,
}: {
  onViewDetail: (item: MessageQueueItem) => void;
}) => [
  columnHelper.accessor('template_name', {
    id: 'template_name',
    size: 180,
    header: 'Template',
    enableSorting: false,
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.template_name}</div>
        <div className="text-xs text-gray-500">{row.original.template_language}</div>
      </div>
    ),
  }),
  columnHelper.accessor('template_category', {
    id: 'template_category',
    size: 120,
    header: 'Category',
    enableSorting: false,
    cell: ({ row }) => {
      const category = row.original.template_category;
      if (!category) return <span className="text-gray-400">-</span>;
      const colorMap: Record<string, 'success' | 'info' | 'warning' | 'secondary'> = {
        MARKETING: 'warning',
        UTILITY: 'info',
        AUTHENTICATION: 'success',
      };
      return (
        <Badge variant="flat" color={colorMap[category] || 'secondary'} className="capitalize text-xs">
          {category.toLowerCase()}
        </Badge>
      );
    },
  }),
  columnHelper.accessor('recipient_phone', {
    id: 'recipient_phone',
    size: 140,
    header: 'Recipient',
    enableSorting: false,
    cell: ({ row }) => (
      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
        {row.original.recipient_phone}
      </code>
    ),
  }),
  columnHelper.accessor('wamid', {
    id: 'wamid',
    size: 160,
    header: 'WAMID',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.wamid ? (
        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[140px] block" title={row.original.wamid}>
          {row.original.wamid}
        </code>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  }),
  columnHelper.accessor('queue_status', {
    id: 'queue_status',
    size: 130,
    header: 'Queue Status',
    enableSorting: false,
    cell: ({ row }) => getStatusBadge(row.original.queue_status),
  }),
  columnHelper.accessor('message_status', {
    id: 'message_status',
    size: 130,
    header: 'Message Status',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.message_status
        ? getStatusBadge(row.original.message_status)
        : <span className="text-gray-400">-</span>,
  }),
  columnHelper.accessor('api_key_masked', {
    id: 'api_key_masked',
    size: 130,
    header: 'API Key',
    enableSorting: false,
    cell: ({ row }) => (
      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
        {row.original.api_key_masked || '-'}
      </code>
    ),
  }),
  columnHelper.accessor('ip_address', {
    id: 'ip_address',
    size: 130,
    header: 'IP Address',
    enableSorting: false,
    cell: ({ row }) => (
      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
        {row.original.ip_address || '-'}
      </code>
    ),
  }),
  columnHelper.accessor('device_info', {
    id: 'device_info',
    size: 150,
    header: 'Device',
    enableSorting: false,
    cell: ({ row }) => (
      <Tooltip size="sm" content={row.original.user_agent || '-'} placement="top" color="invert">
        <span className="text-sm cursor-help">
          {row.original.device_info || '-'}
        </span>
      </Tooltip>
    ),
  }),
  columnHelper.accessor('is_billable', {
    id: 'is_billable',
    size: 100,
    header: 'Billable',
    enableSorting: false,
    cell: ({ row }) => (
      <Badge
        variant="flat"
        color={row.original.is_billable ? 'success' : 'secondary'}
        className="capitalize"
      >
        {row.original.is_billable ? 'Yes' : 'No'}
      </Badge>
    ),
  }),
  columnHelper.accessor('attempts', {
    id: 'attempts',
    size: 90,
    header: 'Attempts',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.attempts}/{row.original.max_attempts}
      </span>
    ),
  }),
  columnHelper.accessor('created_at', {
    id: 'created_at',
    size: 160,
    header: 'Created At',
    enableSorting: false,
    cell: ({ row }) => {
      try {
        return (
          <span className="text-sm text-gray-600">
            {format(new Date(row.original.created_at), 'dd MMM yyyy HH:mm:ss')}
          </span>
        );
      } catch {
        return <span className="text-gray-400">-</span>;
      }
    },
  }),
  columnHelper.display({
    id: 'actions',
    size: 80,
    header: () => <div className="text-center">Detail</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <button
          onClick={() => onViewDetail(row.original)}
          className="text-xs text-primary underline hover:no-underline"
        >
          View
        </button>
      </div>
    ),
    enableSorting: false,
  }),
];
