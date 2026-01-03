'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Text, ActionIcon, Tooltip } from 'rizzui';
import { PiPencilSimpleBold, PiTrashBold } from 'react-icons/pi';
import { useModal } from '@/app/shared/modal-views/use-modal';
import EditZone from './edit-zone';
import DeleteZonePopover from './delete-zone-popover';

export interface Zone {
  id: number;
  name: string;
}

const columnHelper = createColumnHelper<Zone>();

export function ZoneActionsCell({ row, onRefresh }: { row: any; onRefresh: () => void }) {
  const { openModal } = useModal();

  const handleEdit = () => {
    openModal({
      view: <EditZone zone={row.original} onSuccess={onRefresh} />,
      size: 'sm',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Edit" placement="top">
        <ActionIcon size="sm" variant="outline" className="hover:bg-gray-100" onClick={handleEdit}>
          <PiPencilSimpleBold className="h-4 w-4" />
        </ActionIcon>
      </Tooltip>
      <DeleteZonePopover
        zoneId={row.original.id!}
        zoneName={row.original.name}
        onSuccess={onRefresh}
      />
    </div>
  );
}

export const createZoneColumns = (onRefresh: () => void) => [
  columnHelper.display({
    id: 'actions',
    size: 120,
    header: 'Actions',
    cell: ({ row }) => <ZoneActionsCell row={row} onRefresh={onRefresh} />,
  }),
  columnHelper.accessor('name', {
    id: 'name',
    size: 300,
    header: 'Zone Name',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium text-gray-900">{row.original.name}</Text>
    ),
  }),
];
