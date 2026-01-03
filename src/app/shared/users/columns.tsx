'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { User } from '@/data/users-data';
import { Badge, Text, ActionIcon, Tooltip, Avatar } from 'rizzui';
import PencilIcon from '@core/components/icons/pencil';
import DeletePopover from '@/components/delete-popover';

const columnHelper = createColumnHelper<User>();

export const createUsersColumns = ({
  onEditUser,
  onDeleteUser,
}: {
  onEditUser: (user: any) => void;
  onDeleteUser: (id: string) => void;
}) => [
  columnHelper.accessor('name', {
    id: 'name',
    size: 250,
    header: 'User',
    enableSorting: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar
          name={row.original.username || row.original.email}
          size="sm"
        />
        <div>
          <Text className="font-medium text-gray-900">
            {row.original.username}
          </Text>
          <Text className="text-sm text-gray-500">{row.original.email}</Text>
        </div>
      </div>
    ),
  }),
  columnHelper.accessor('email', {
    id: 'email',
    size: 200,
    header: 'Email',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="text-sm">{row.original.email}</Text>
    ),
  }),
  columnHelper.accessor('created_at', {
    id: 'created_at',
    size: 140,
    header: 'Created Date',
    enableSorting: true,
    cell: ({ row }) => (
      <Text className="text-sm">
        {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) : '-'}
      </Text>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    size: 100,
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <Tooltip
          size="sm"
          content="Edit User"
          placement="top"
          color="invert"
        >
          <ActionIcon
            size="sm"
            variant="outline"
            aria-label="Edit User"
            onClick={() => onEditUser(row.original)}
          >
            <PencilIcon className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
        <DeletePopover
          title="Delete User"
          description="Are you sure you want to delete this user?"
          onDelete={() => onDeleteUser(row.original.id)}
        />
      </div>
    ),
    enableSorting: false,
  }),
];
