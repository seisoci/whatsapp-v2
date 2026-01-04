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
  onAssignPermissions,
}: {
  onEditRole: (role: any) => void;
  onDeleteRole: (id: string) => void;
  onAssignPermissions: (id: string) => void;
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
      size: 140,
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <Tooltip
            size="sm"
            content="Assign Permissions"
            placement="top"
            color="invert"
          >
            <ActionIcon
              size="sm"
              variant="outline"
              aria-label="Assign Permissions"
              onClick={() => onAssignPermissions(row.original.id)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </ActionIcon>
          </Tooltip>
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