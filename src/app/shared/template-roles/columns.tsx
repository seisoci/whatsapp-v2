'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { ActionIcon, Badge, Text, Tooltip } from 'rizzui';
import { PiUserGearBold } from 'react-icons/pi';
import type { Template } from '../templates';

export type TemplateWithRoles = Template & {
  phoneNumberDbId: string;
  assignedRoles: { id: string; name: string; slug: string }[];
};

const columnHelper = createColumnHelper<TemplateWithRoles>();

export const createTemplateRolesColumns = ({
  onManageRoles,
}: {
  onManageRoles: (template: TemplateWithRoles) => void;
}) => [
  columnHelper.accessor('name', {
    id: 'name',
    size: 220,
    header: 'Template Name',
    enableSorting: false,
    cell: ({ row }) => (
      <Text className="font-medium text-gray-800">{row.original.name}</Text>
    ),
  }),
  columnHelper.accessor('category', {
    id: 'category',
    size: 140,
    header: 'Category',
    enableSorting: false,
    cell: ({ row }) => {
      const category = row.original.category;
      const colorMap: Record<string, 'success' | 'info' | 'warning'> = {
        MARKETING: 'info',
        UTILITY: 'success',
        AUTHENTICATION: 'warning',
      };
      return <Badge color={colorMap[category] || 'secondary'}>{category}</Badge>;
    },
  }),
  columnHelper.accessor('status', {
    id: 'status',
    size: 120,
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.original.status;
      const colorMap: Record<string, 'success' | 'danger' | 'warning' | 'secondary'> = {
        APPROVED: 'success',
        REJECTED: 'danger',
        PENDING: 'warning',
        IN_APPEAL: 'secondary',
      };
      return <Badge color={colorMap[status] || 'secondary'}>{status}</Badge>;
    },
  }),
  columnHelper.accessor('phoneNumberName', {
    id: 'phoneNumberName',
    size: 180,
    header: 'Phone Number',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.phoneNumberName || row.original.displayPhoneNumber || row.original.phoneNumberId || '-',
  }),
  columnHelper.display({
    id: 'assignedRoles',
    size: 280,
    header: 'Roles yang Diizinkan',
    cell: ({ row }) => {
      const roles = row.original.assignedRoles;
      if (!roles || roles.length === 0) {
        return <Text className="text-xs text-gray-400 italic">Semua role (tidak ada restriksi)</Text>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <Badge key={role.id} variant="flat" color="primary" className="text-xs">
              {role.name}
            </Badge>
          ))}
        </div>
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    size: 80,
    header: 'Aksi',
    cell: ({ row }) => (
      <Tooltip content="Kelola Role Akses" placement="top">
        <ActionIcon
          variant="outline"
          size="sm"
          onClick={() => onManageRoles(row.original)}
        >
          <PiUserGearBold className="h-4 w-4" />
        </ActionIcon>
      </Tooltip>
    ),
  }),
];
