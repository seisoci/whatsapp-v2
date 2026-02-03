'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Text, ActionIcon, Tooltip, Badge } from 'rizzui';
import { PiPencilSimpleBold, PiTrashBold } from 'react-icons/pi';
import { useModal } from '@/app/shared/modal-views/use-modal';
import EditOdb from './edit-odb';
import DeleteOdbPopover from './delete-odb-popover';

export interface Odb {
  id: number;
  name: string;
  nr_of_ports: number | null;
  zone_id: number | null;
  zone_name?: string;
  zone?: {
    id: number;
    name: string;
  };
  latitude: number | null;
  longitude: number | null;
}

const columnHelper = createColumnHelper<Odb>();

export function OdbActionsCell({ row, onRefresh }: { row: any; onRefresh: () => void }) {
  const { openModal } = useModal();

  const handleEdit = () => {
    openModal({
      view: <EditOdb odb={row.original} onSuccess={onRefresh} />,
      size: 'lg',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Edit" placement="top">
        <ActionIcon size="sm" variant="outline" className="hover:bg-gray-100" onClick={handleEdit}>
          <PiPencilSimpleBold className="h-4 w-4" />
        </ActionIcon>
      </Tooltip>
      <DeleteOdbPopover
        odbId={row.original.id!}
        odbName={row.original.name}
        onSuccess={onRefresh}
      />
    </div>
  );
}

export const createOdbColumns = (onRefresh: () => void) => [
  columnHelper.display({
    id: 'actions',
    size: 120,
    header: 'Actions',
    cell: ({ row }) => <OdbActionsCell row={row} onRefresh={onRefresh} />,
  }),
  columnHelper.accessor('name', {
    id: 'name',
    size: 200,
    header: 'ODB Name',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium text-gray-900">{row.original.name}</Text>
    ),
  }),
  columnHelper.accessor('nr_of_ports', {
    id: 'nr_of_ports',
    size: 120,
    header: 'Ports',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium">
        {row.original.nr_of_ports !== null && row.original.nr_of_ports !== undefined
          ? row.original.nr_of_ports
          : '-'}
      </Text>
    ),
  }),
  columnHelper.display({
    id: 'zone',
    size: 150,
    header: 'Zone',
    cell: ({ row }) => (
      row.original.zone_name ? (
        <Badge variant="flat" color="info">
          {row.original.zone_name}
        </Badge>
      ) : row.original.zone ? (
        <Badge variant="flat" color="info">
          {row.original.zone.name}
        </Badge>
      ) : (
        <Text className="text-gray-400">-</Text>
      )
    ),
  }),
  columnHelper.accessor('latitude', {
    id: 'latitude',
    size: 120,
    header: 'Latitude',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-mono text-sm">
        {row.original.latitude !== null && row.original.latitude !== undefined && typeof row.original.latitude === 'number'
          ? row.original.latitude.toFixed(6)
          : '-'}
      </Text>
    ),
  }),
  columnHelper.accessor('longitude', {
    id: 'longitude',
    size: 120,
    header: 'Longitude',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-mono text-sm">
        {row.original.longitude !== null && row.original.longitude !== undefined && typeof row.original.longitude === 'number'
          ? row.original.longitude.toFixed(6)
          : '-'}
      </Text>
    ),
  }),
];
