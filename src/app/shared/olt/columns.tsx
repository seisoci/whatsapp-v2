'use client';

import Link from 'next/link';
import { createColumnHelper } from '@tanstack/react-table';
import { Olt } from '@/types/olt';
import { Badge, Text, Button, ActionIcon, Tooltip } from 'rizzui';
import { routes } from '@/config/routes';
import { PiEyeBold, PiPencilSimpleBold, PiTrashBold } from 'react-icons/pi';
import { useModal } from '@/app/shared/modal-views/use-modal';
import EditOlt from './edit-olt';
import DeleteOltPopover from './delete-olt-popover';

const columnHelper = createColumnHelper<Olt>();

export function OltActionsCell({ row, onRefresh }: { row: any; onRefresh: () => void }) {
  const { openModal } = useModal();

  const handleEdit = () => {
    openModal({
      view: <EditOlt oltId={row.original.id!} onSuccess={onRefresh} />,
      size: 'lg',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip content="View Details" placement="top">
        <Link href={routes.olt.details(row.original.id)}>
          <ActionIcon size="sm" variant="outline" className="hover:bg-gray-100">
            <PiEyeBold className="h-4 w-4" />
          </ActionIcon>
        </Link>
      </Tooltip>
      <Tooltip content="Edit" placement="top">
        <ActionIcon size="sm" variant="outline" className="hover:bg-gray-100" onClick={handleEdit}>
          <PiPencilSimpleBold className="h-4 w-4" />
        </ActionIcon>
      </Tooltip>
      <DeleteOltPopover oltId={row.original.id!} oltName={row.original.name} onSuccess={onRefresh} />
    </div>
  );
}

export const createOltColumns = (onRefresh: () => void) => [
  columnHelper.display({
    id: 'actions',
    size: 150,
    header: 'Actions',
    cell: ({ row }) => <OltActionsCell row={row} onRefresh={onRefresh} />,
  }),
  columnHelper.display({
    id: 'id',
    size: 80,
    header: 'ID',
    cell: ({ row }) => <Text className="font-medium">#{row.original.id}</Text>,
  }),
  columnHelper.accessor('name', {
    id: 'name',
    size: 250,
    header: 'OLT Name',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium text-gray-900">{row.original.name}</Text>
    ),
  }),
  columnHelper.accessor('olt_ip_address', {
    id: 'olt_ip_address',
    size: 150,
    header: 'IP Address',
    enableSorting: false,
    cell: ({ row }) => (
      <Text className="font-mono text-sm">{row.original.olt_ip_address}</Text>
    ),
  }),
  columnHelper.accessor('telnet_port', {
    id: 'telnet_port',
    size: 120,
    header: 'Telnet Port',
    enableSorting: false,
    cell: ({ row }) => (
      <Text className="text-gray-700">
        {row.original.telnet_port ?? '-'}
      </Text>
    ),
  }),
  columnHelper.accessor('iptv_module', {
    id: 'iptv_module',
    size: 120,
    header: 'IPTV Module',
    enableSorting: false,
    cell: ({ row }) => (
      <Badge
        variant="flat"
        color={row.original.iptv_module === 'true' ? 'success' : 'secondary'}
        className="capitalize"
      >
        {row.original.iptv_module === 'true' ? 'Yes' : 'No'}
      </Badge>
    ),
  }),
  columnHelper.accessor('software_version', {
    id: 'software_version',
    size: 150,
    header: 'Software Version',
    enableSorting: false,
    cell: ({ row }) => (
      <Text className="text-gray-700">v{row.original.software_version}</Text>
    ),
  }),
  columnHelper.accessor('hardware_version', {
    id: 'hardware_version',
    size: 150,
    header: 'Hardware Version',
    enableSorting: false,
    cell: ({ row }) => (
      <Text className="text-gray-700 capitalize">
        {row.original.hardware_version}
      </Text>
    ),
  }),
];
