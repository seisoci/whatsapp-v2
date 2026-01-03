'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Role } from '.';
import { ActionIcon, Tooltip } from 'rizzui';
import PencilIcon from '@core/components/icons/pencil';
import DeletePopover from '@/components/delete-popover';
import { getStatusBadge } from '@core/components/table-utils/get-status-badge';

const columnHelper = createColumnHelper<Role>();

export const createRolesColumns = ({
  onEditRole,
  onDeleteRole,
}: {
  onEditRole: (role: any) => void;
  onDeleteRole: (id: string) => void;
}) => [
    columnHelper.accessor('name', {
      id: 'name',
      size: 200,
      header: 'Role Name',
      enableSorting: true,
      cell: ({ row }) => row.original.name,
    }),
    columnHelper.accessor('description', {
      id: 'description',
      size: 250,
      header: 'Description',
      enableSorting: false,
      cell: ({ row }) => row.original.description || '-',
    }),
    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      size: 140,
      header: 'Created Date',
      enableSorting: true,
      cell: ({ row }) => row.original.createdAt
        ? new Date(row.original.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
        : '-',
    }),
    columnHelper.accessor('isActive', {
      id: 'isActive',
      size: 120,
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => getStatusBadge(row.original.isActive ? 'active' : 'inactive'),
    }),
    columnHelper.display({
      id: 'actions',
      size: 100,
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <Tooltip
            size="sm"
            content="Edit Role"
            placement="top"
            color="invert"
          >
            <ActionIcon
              size="sm"
              variant="outline"
              aria-label="Edit Role"
              onClick={() => onEditRole(row.original)}
            >
              <PencilIcon className="h-4 w-4" />
            </ActionIcon>
          </Tooltip>
          <DeletePopover
            title="Delete Role"
            description="Are you sure you want to delete this role?"
            onDelete={() => onDeleteRole(row.original.id)}
          />
        </div>
      ),
      enableSorting: false,
    }),
  ];