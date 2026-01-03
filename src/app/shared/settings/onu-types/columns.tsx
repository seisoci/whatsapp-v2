'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Badge, Text, ActionIcon, Tooltip } from 'rizzui';
import { PiPencilSimpleBold, PiTrashBold } from 'react-icons/pi';
import { useModal } from '@/app/shared/modal-views/use-modal';
import EditOnuType from './edit-onu-type';
import DeleteOnuTypePopover from './delete-onu-type-popover';
import Image from 'next/image';

export interface OnuType {
  id: number;
  name: string;
  pon_type: 'gpon' | 'epon';
  ethernet_ports: number;
  wifi_ports: number;
  voip_ports: number;
  catv: boolean | null;
  capability: 'Bridging' | 'Bridging/Routing';
}

const columnHelper = createColumnHelper<OnuType>();

export function OnuTypeActionsCell({ row, onRefresh }: { row: any; onRefresh: () => void }) {
  const { openModal } = useModal();

  const handleEdit = () => {
    openModal({
      view: <EditOnuType onuType={row.original} onSuccess={onRefresh} />,
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
      <DeleteOnuTypePopover
        onuTypeId={row.original.id!}
        onuTypeName={row.original.name}
        onSuccess={onRefresh}
      />
    </div>
  );
}

export const createOnuTypeColumns = (onRefresh: () => void) => [
  columnHelper.display({
    id: 'actions',
    size: 120,
    header: 'Actions',
    cell: ({ row }) => <OnuTypeActionsCell row={row} onRefresh={onRefresh} />,
  }),
  columnHelper.accessor('name', {
    id: 'name',
    size: 200,
    header: 'Device Name',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium text-gray-900">{row.original.name}</Text>
    ),
  }),
  columnHelper.accessor('pon_type', {
    id: 'pon_type',
    size: 100,
    header: 'PON Type',
    enableSorting: true,
    filterFn: 'equalsString',
    cell: ({ row }) => (
      <Badge
        variant="flat"
        color={row.original.pon_type === 'gpon' ? 'primary' : 'info'}
        className="uppercase"
      >
        {row.original.pon_type}
      </Badge>
    ),
  }),
  columnHelper.accessor('ethernet_ports', {
    id: 'ethernet_ports',
    size: 120,
    header: 'Ethernet',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium">{row.original.ethernet_ports} ports</Text>
    ),
  }),
  columnHelper.accessor('wifi_ports', {
    id: 'wifi_ports',
    size: 100,
    header: 'WiFi',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium">{row.original.wifi_ports} ports</Text>
    ),
  }),
  columnHelper.accessor('voip_ports', {
    id: 'voip_ports',
    size: 100,
    header: 'VoIP',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium">{row.original.voip_ports} ports</Text>
    ),
  }),
  columnHelper.accessor('catv', {
    id: 'catv',
    size: 100,
    header: 'CATV',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium text-gray-900">
        {row.original.catv ? 'Yes' : 'No'}
      </Text>
    ),
  }),
  columnHelper.accessor('capability', {
    id: 'capability',
    size: 150,
    header: 'Capability',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium text-gray-900">
        {row.original.capability}
      </Text>
    ),
  }),
];
