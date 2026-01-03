'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Permission } from '.';
import { Text, ActionIcon, Tooltip, Badge } from 'rizzui';
import PencilIcon from '@core/components/icons/pencil';
import DeletePopover from '@/components/delete-popover';

// Type for grouped permission data
type GroupedPermission = {
  id: string;
  menuManagerId: string;
  menu: any;
  permissions: Permission[];
  createdAt: string;
};

const columnHelper = createColumnHelper<GroupedPermission>();

// Helper to extract action from slug
const getActionFromSlug = (slug: string): string => {
  const parts = slug.split('-');
  const action = parts[parts.length - 1];

  const actionLabels: Record<string, string> = {
    index: 'List',
    store: 'Create',
    update: 'Update',
    destroy: 'Delete',
  };

  return actionLabels[action] || action;
};

export const createPermissionsColumns = ({
  onEditPermission,
  onDeletePermission,
}: {
  onEditPermission: (permission: any) => void;
  onDeletePermission: (id: string) => void;
}) => [
    columnHelper.accessor('menu', {
      id: 'title',
      size: 250,
      header: 'Menu Title',
      enableSorting: true,
      cell: ({ row }) => (
        <div>
        <Text className= "font-medium text-gray-900" >
        { row.original.menu?.title || 'No Menu' }
        </Text>
        < Text className="text-sm text-gray-500" >
        { row.original.menu?.pathUrl || '-' }
        </Text>
        </div>
    ),
  }),
columnHelper.accessor('permissions', {
  id: 'actions',
  size: 300,
  header: 'Actions',
  enableSorting: false,
  cell: ({ row }) => (
    <div className= "flex flex-wrap gap-2" >
    {
      row.original.permissions.map((permission) => (
        <Badge key= { permission.id } variant = "flat" color = "info" >
        { getActionFromSlug(permission.slug)
    }
    </Badge>
        ))}
</div>
    ),
  }),
columnHelper.accessor('createdAt', {
  id: 'createdAt',
  size: 140,
  header: 'Created Date',
  enableSorting: true,
  cell: ({ row }) => (
    <Text className= "text-sm" >
    {
      row.original.createdAt
        ? new Date(row.original.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
        : '-'
    }
    </Text>
    ),
  }),
columnHelper.display({
  id: 'tableActions',
  size: 100,
  header: 'Actions',
  cell: ({ row }) => (
    <div className= "flex items-center justify-center gap-2" >
    <Tooltip size="sm" content = "Edit Menu" placement="top" color="invert" >
    <ActionIcon
            size="sm"
            variant = "outline"
            aria- label="Edit Menu"
            onClick = {() => onEditPermission({ menuManagerId: row.original.menuManagerId, menu: row.original.menu })}
          >
  <PencilIcon className="h-4 w-4" />
  </ActionIcon>
  </Tooltip>
< DeletePopover
          title = "Delete Menu & Permissions"
          description = "Are you sure you want to delete this menu and all its permissions?"
          onDelete = {() => onDeletePermission(row.original.menuManagerId)}
        />
  </div>
),
  enableSorting: false,
  }),
];
