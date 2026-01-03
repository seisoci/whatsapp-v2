'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Badge, Text, ActionIcon, Tooltip } from 'rizzui';
import { PiPencilSimpleBold, PiTrashBold } from 'react-icons/pi';
import { useModal } from '@/app/shared/modal-views/use-modal';
import EditSpeedProfile from './edit-speed-profile';
import DeleteSpeedProfilePopover from './delete-speed-profile-popover';

export interface SpeedProfile {
  id: number;
  name: string;
  up_down: 'upload' | 'download';
  for_iptv: boolean;
  speed: number;
  use_prefix_suffix: boolean;
  is_default: boolean;
  onu_type_id: number | null;
  onu_type_name?: string;
}

const columnHelper = createColumnHelper<SpeedProfile>();

export function SpeedProfileActionsCell({ row, onRefresh }: { row: any; onRefresh: () => void }) {
  const { openModal } = useModal();

  const handleEdit = () => {
    openModal({
      view: <EditSpeedProfile speedProfile={row.original} onSuccess={onRefresh} />,
      size: 'md',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Edit" placement="top">
        <ActionIcon size="sm" variant="outline" className="hover:bg-gray-100" onClick={handleEdit}>
          <PiPencilSimpleBold className="h-4 w-4" />
        </ActionIcon>
      </Tooltip>
      <DeleteSpeedProfilePopover
        speedProfileId={row.original.id!}
        speedProfileName={row.original.name}
        onSuccess={onRefresh}
      />
    </div>
  );
}

export const createSpeedProfileColumns = (onRefresh: () => void) => [
  columnHelper.display({
    id: 'actions',
    size: 120,
    header: 'Actions',
    cell: ({ row }) => <SpeedProfileActionsCell row={row} onRefresh={onRefresh} />,
  }),
  columnHelper.accessor('name', {
    id: 'name',
    size: 200,
    header: 'Profile Name',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium text-gray-900">{row.original.name}</Text>
    ),
  }),
  columnHelper.accessor('speed', {
    id: 'speed',
    size: 150,
    header: 'Speed (Kbps)',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium">{row.original.speed.toLocaleString()}</Text>
    ),
  }),
  columnHelper.accessor('up_down', {
    id: 'up_down',
    size: 120,
    header: 'Direction',
    enableSorting: true,
    cell: ({ row }) => (
      <Badge
        variant="flat"
        color={row.original.up_down === 'download' ? 'info' : 'warning'}
        className="capitalize"
      >
        {row.original.up_down}
      </Badge>
    ),
  }),
  columnHelper.accessor('for_iptv', {
    id: 'for_iptv',
    size: 100,
    header: 'IPTV',
    enableSorting: true,
    cell: ({ row }) => (
      <Badge
        variant="flat"
        color={row.original.for_iptv ? 'success' : 'secondary'}
      >
        {row.original.for_iptv ? 'Yes' : 'No'}
      </Badge>
    ),
  }),
  columnHelper.accessor('use_prefix_suffix', {
    id: 'use_prefix_suffix',
    size: 150,
    header: 'Prefix/Suffix',
    enableSorting: true,
    cell: ({ row }) => (
      <Badge
        variant="flat"
        color={row.original.use_prefix_suffix ? 'success' : 'secondary'}
      >
        {row.original.use_prefix_suffix ? 'Yes' : 'No'}
      </Badge>
    ),
  }),
  columnHelper.accessor('onu_type_name', {
    id: 'onu_type_name',
    size: 150,
    header: 'ONU Type',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium text-gray-900">
        {row.original.onu_type_name || '-'}
      </Text>
    ),
  }),
  columnHelper.accessor('is_default', {
    id: 'is_default',
    size: 100,
    header: 'Default',
    enableSorting: true,
    cell: ({ row }) => (
      <Badge
        variant="flat"
        color={row.original.is_default ? 'primary' : 'secondary'}
      >
        {row.original.is_default ? 'Yes' : 'No'}
      </Badge>
    ),
  }),
];
