import { QuickReply } from '@/lib/api/quick-replies';
import { ActionIcon } from 'rizzui';
import { PiPencil, PiTrash } from 'react-icons/pi';
import { createColumnHelper } from '@tanstack/react-table';

const columnHelper = createColumnHelper<QuickReply>();

export const createQuickRepliesColumns = ({
  onEdit,
  onDelete,
}: {
  onEdit: (reply: QuickReply) => void;
  onDelete: (id: string) => void;
}) => [
  columnHelper.accessor('shortcut', {
    header: 'Shortcut',
    size: 150,
    cell: ({ getValue }) => (
      <span className="font-mono text-sm">/{getValue() || '-'}</span>
    ),
  }),
  columnHelper.accessor('text', {
    header: 'Text',
    cell: ({ getValue }) => (
      <p className="text-sm text-gray-700 line-clamp-2">{getValue()}</p>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    size: 120,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <ActionIcon
          variant="text"
          onClick={() => onEdit(row.original)}
          title="Edit"
        >
          <PiPencil className="h-4 w-4" />
        </ActionIcon>
        <ActionIcon
          variant="text"
          onClick={() => onDelete(row.original.id)}
          title="Delete"
          className="text-red-500 hover:text-red-700"
        >
          <PiTrash className="h-4 w-4" />
        </ActionIcon>
      </div>
    ),
  }),
];
