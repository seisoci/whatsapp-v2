'use client';

import Link from 'next/link';
import { createColumnHelper } from '@tanstack/react-table';
import { ConfiguredOnu } from '@/types/configured';
import { Badge, Text, ActionIcon, Tooltip } from 'rizzui';
import { PiEyeBold } from 'react-icons/pi';
import { FaGlobe, FaPlug, FaBan, FaUnlink } from 'react-icons/fa';
import cn from '@core/utils/class-names';
import { routes } from '@/config/routes';
import Signal from '@/components/icons/signal';

const columnHelper = createColumnHelper<ConfiguredOnu>();

function StatusIcon({ status }: { status: string }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <FaGlobe className="h-4 w-4 text-green-600" />;
      case 'pwrfail':
        return <FaPlug className="h-4 w-4 text-gray-500" />;
      case 'los':
        return <FaUnlink className="h-4 w-4 text-red-600" />;
      case 'offline':
        return <FaGlobe className="h-4 w-4 text-gray-500" />;
      case 'disabled':
        return <FaBan className="h-4 w-4 text-gray-500" />;
      default:
        return <FaGlobe className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'pwrfail':
        return 'Power Fail';
      case 'los':
        return 'Loss of Signal';
      case 'offline':
        return 'Offline';
      case 'disabled':
        return 'Admin Disabled';
      default:
        return status;
    }
  };

  return (
    <div className="flex justify-center">
      <Tooltip content={getStatusLabel()} placement="top">
        {getStatusIcon()}
      </Tooltip>
    </div>
  );
}

function SignalIndicator({ signal, signalStatus }: { signal: number; signalStatus: 'good' | 'warning' | 'bad' }) {
  const colors = {
    good: 'text-green-600',
    warning: 'text-orange-500',
    bad: 'text-red-600',
  };

  return (
    <div className="flex justify-center">
      <Tooltip content={`Signal: ${signal} dBm`} placement="top">
        <div className={cn(colors[signalStatus])}>
          <Signal size="20" />
        </div>
      </Tooltip>
    </div>
  );
}

function ModeLabel({ mode }: { mode: string }) {
  const isRouter = mode.includes('Router');
  const isPPPoE = mode.includes('PPPoE');

  return (
    <Badge
      variant="flat"
      color={isRouter || isPPPoE ? 'info' : 'secondary'}
      className="font-medium"
    >
      {mode}
    </Badge>
  );
}

export const createConfiguredColumns = () => [
  columnHelper.display({
    id: 'status',
    size: 60,
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => <StatusIcon status={row.original.status} />,
    enableSorting: false,
  }),
  columnHelper.display({
    id: 'view',
    size: 60,
    header: () => <div className="text-center">View</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Link href={routes.configured.details(row.original.id)}>
          <ActionIcon
            size="sm"
            variant="solid"
            color="primary"
            className="hover:bg-blue-700"
          >
            <PiEyeBold className="h-4 w-4" />
          </ActionIcon>
        </Link>
      </div>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor('name', {
    id: 'name',
    size: 180,
    header: 'Name',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-medium text-gray-700 truncate">{row.original.name}</Text>
    ),
  }),
  columnHelper.accessor('serial_number', {
    id: 'serial_number',
    size: 130,
    header: 'SN / MAC',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="font-mono text-sm">{row.original.serial_number}</Text>
    ),
  }),
  columnHelper.accessor('onu_path', {
    id: 'onu_path',
    size: 150,
    header: 'ONU',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="text-sm text-gray-600 whitespace-normal break-words">{row.original.onu_path}</Text>
    ),
  }),
  columnHelper.accessor('zone', {
    id: 'zone',
    size: 90,
    header: 'Zone',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="text-sm truncate">{row.original.zone || '-'}</Text>
    ),
  }),
  columnHelper.accessor('odb', {
    id: 'odb',
    size: 90,
    header: 'ODB',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="text-sm truncate">{row.original.odb || 'None'}</Text>
    ),
  }),
  columnHelper.display({
    id: 'signal',
    size: 60,
    header: () => <div className="text-center">Signal</div>,
    cell: ({ row }) => (
      <SignalIndicator
        signal={typeof row.original.signal === 'number' ? row.original.signal : parseFloat(row.original.signal) || 0}
        signalStatus={row.original.signal_status}
      />
    ),
    enableSorting: false,
  }),
  columnHelper.accessor('mode', {
    id: 'mode',
    size: 100,
    header: 'B/R',
    enableSorting: true,
    cell: ({ row }) => <ModeLabel mode={row.original.mode} />,
  }),
  columnHelper.accessor('vlan', {
    id: 'vlan',
    size: 80,
    header: 'VLAN',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="text-sm font-medium">{row.original.vlan}</Text>
    ),
  }),
  columnHelper.accessor('auth_date', {
    id: 'auth_date',
    size: 100,
    header: 'Auth Date',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="text-sm text-gray-600">{row.original.auth_date}</Text>
    ),
  }),
];
