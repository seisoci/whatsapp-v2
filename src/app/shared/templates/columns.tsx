'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Template } from '.';
import { ActionIcon, Tooltip, Badge } from 'rizzui';
import PencilIcon from '@core/components/icons/pencil';
import { PiCodeBold } from 'react-icons/pi';
import DeletePopover from '@/components/delete-popover';

const columnHelper = createColumnHelper<Template>();

export const createTemplatesColumns = ({
  onEditTemplate,
  onDeleteTemplate,
  onViewWebhook,
}: {
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string, phoneNumberId: string, templateName: string) => void;
  onViewWebhook: (template: Template) => void;
}) => [
    columnHelper.accessor('name', {
      id: 'name',
      size: 200,
      header: 'Template Name',
      enableSorting: false,
      cell: ({ row }) => row.original.name,
    }),
    columnHelper.accessor('language', {
      id: 'language',
      size: 100,
      header: 'Language',
      enableSorting: false,
      cell: ({ row }) => row.original.language.toUpperCase(),
    }),
    columnHelper.accessor('category', {
      id: 'category',
      size: 130,
      header: 'Category',
      enableSorting: false,
      cell: ({ row }) => {
        const category = row.original.category;
        const colorMap: Record<string, 'success' | 'info' | 'warning'> = {
          MARKETING: 'info',
          UTILITY: 'success',
          AUTHENTICATION: 'warning',
        };
        return (
          <Badge color= { colorMap[category] || 'secondary' } >
          { category }
          </Badge>
      );
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
    return (
      <Badge color= { colorMap[status] || 'secondary' } >
      { status }
      </Badge>
      );
    },
  }),
columnHelper.accessor('phoneNumberName', {
  id: 'phoneNumberName',
  size: 180,
  header: 'Phone Number',
  enableSorting: false,
  cell: ({ row }) =>
    row.original.phoneNumberName ||
    row.original.displayPhoneNumber ||
    row.original.phoneNumberId ||
    '-',
}),
  columnHelper.display({
    id: 'actions',
    size: 120,
    header: () => <div className="text-center"> Actions </div>,
    cell: ({ row }) => (
      <div className= "flex items-center justify-center gap-2" >
      <Tooltip
          size="sm"
          content = "Example Payload Template"
          placement="top"
          color="invert"
      >
        <ActionIcon
            size="sm"
            variant="outline"
            aria-label="Example Payload Template"
            onClick={() => onViewWebhook(row.original)}
        >
            <PiCodeBold className="h-4 w-4" />
        </ActionIcon>
      </Tooltip>
      <Tooltip
          size="sm"
          content = "Edit Template"
          placement="top"
          color="invert"
    >
    <ActionIcon
            size="sm"
            variant = "outline"
            aria-label="Edit"
            onClick = {() => onEditTemplate(row.original)}
          >
    <PencilIcon className="h-4 w-4" />
    </ActionIcon>
    </Tooltip>
  < DeletePopover
          title = "Delete Template"
          description = "Are you sure you want to delete this template?"
          onDelete = {() =>
    onDeleteTemplate(
      row.original.id,
      row.original.phoneNumberId!,
      row.original.name
    )
          }
        />
    </div>
  ),
  enableSorting: false,
  }),
];
