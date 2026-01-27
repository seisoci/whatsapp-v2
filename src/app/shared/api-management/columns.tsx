'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { ApiEndpoint } from '.';
import { ActionIcon, Tooltip, Switch } from 'rizzui';
import PencilIcon from '@core/components/icons/pencil';
import DeletePopover from '@/components/delete-popover';
import { getStatusBadge } from '@core/components/table-utils/get-status-badge';
import { PiCopyDuotone } from 'react-icons/pi';
import toast from 'react-hot-toast';

const columnHelper = createColumnHelper<ApiEndpoint>();

export const createApiEndpointColumns = ({
  onEditApiEndpoint,
  onDeleteApiEndpoint,
  onToggleStatus,
}: {
  onEditApiEndpoint: (apiEndpoint: ApiEndpoint) => void;
  onDeleteApiEndpoint: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}) => [
  columnHelper.accessor('name', {
    id: 'name',
    size: 200,
    header: 'Name',
    enableSorting: false,
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        {row.original.description && (
          <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  }),
  columnHelper.accessor('webhookUrl', {
    id: 'webhookUrl',
    size: 250,
    header: 'Webhook URL',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="truncate max-w-[230px]" title={row.original.webhookUrl}>
        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
          {row.original.webhookUrl}
        </code>
      </div>
    ),
  }),
  columnHelper.accessor('apiKey', {
    id: 'apiKey',
    size: 200,
    header: 'API Key',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.apiKey ? (
          <>
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[150px]">
              {row.original.apiKey}
            </code>
            <Tooltip size="sm" content="Copy API Key" placement="top" color="invert">
              <ActionIcon
                size="sm"
                variant="text"
                aria-label="Copy API Key"
                onClick={() => {
                  navigator.clipboard.writeText(row.original.apiKey || '');
                  toast.success('API Key copied to clipboard');
                }}
              >
                <PiCopyDuotone className="h-4 w-4" />
              </ActionIcon>
            </Tooltip>
          </>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    ),
  }),
  columnHelper.accessor('isActive', {
    id: 'isActive',
    size: 120,
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Switch
          size="sm"
          checked={row.original.isActive}
          onChange={() => onToggleStatus(row.original.id, row.original.isActive)}
        />
        {getStatusBadge(row.original.isActive ? 'active' : 'inactive')}
      </div>
    ),
  }),
  columnHelper.accessor('creatorName', {
    id: 'creatorName',
    size: 150,
    header: 'Created By',
    enableSorting: false,
    cell: ({ row }) => row.original.creatorName || '-',
  }),
  columnHelper.display({
    id: 'actions',
    size: 100,
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-1">
        <Tooltip
          size="sm"
          content="Edit API Endpoint"
          placement="top"
          color="invert"
        >
          <ActionIcon
            size="sm"
            variant="outline"
            aria-label="Edit"
            onClick={() => onEditApiEndpoint(row.original)}
          >
            <PencilIcon className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
        <DeletePopover
          title="Delete API Endpoint"
          description="Are you sure you want to delete this API endpoint?"
          onDelete={() => onDeleteApiEndpoint(row.original.id)}
        />
      </div>
    ),
    enableSorting: false,
  }),
];
