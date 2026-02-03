'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Text, Badge, Tooltip, ActionIcon, Flex } from 'rizzui';
import { PiPencilSimpleLine, PiTrashSimple, PiCheckCircle, PiXCircle } from 'react-icons/pi';
import { Contact } from '@/lib/api/types/contacts';
import DateCell from '@core/ui/date-cell';

const columnHelper = createColumnHelper<Contact>();

type Columns = {
  onEdit: (row: Contact) => void;
  onDelete: (id: string) => void;
};

export const createContactsColumns = ({ onEdit, onDelete }: Columns) => [
  columnHelper.accessor('profileName', {
    header: 'Profile Name',
    size: 200,
    cell: ({ row: { original } }) => (
      <Flex align="center" gap="2">
        {original.profilePictureUrl && (
          <img
            src={original.profilePictureUrl}
            alt={original.profileName}
            className="h-9 w-9 rounded-full object-cover"
          />
        )}
        <Text className="font-medium text-gray-900">{original.profileName || '-'}</Text>
      </Flex>
    ),
  }),
  columnHelper.accessor('waId', {
    header: 'WhatsApp ID',
    size: 150,
    cell: (info) => <Text>{info.getValue()}</Text>,
  }),
  columnHelper.accessor('isBusinessAccount', {
    header: 'Account Type',
    size: 150,
    cell: (info) => (
      <Badge variant="flat" color={info.getValue() ? 'success' : 'primary'}>
        {info.getValue() ? 'Business' : 'Personal'}
      </Badge>
    ),
  }),
  columnHelper.accessor('isBlocked', {
    header: 'Status',
    size: 120,
    cell: (info) => (
      <Tooltip content={info.getValue() ? 'Blocked' : 'Active'}>
        <ActionIcon size="sm" variant="text" color={info.getValue() ? 'danger' : 'success'}>
          {info.getValue() ? <PiXCircle className="h-5 w-5" /> : <PiCheckCircle className="h-5 w-5" />}
        </ActionIcon>
      </Tooltip>
    ),
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created At',
    size: 180,
    cell: (info) => <DateCell date={new Date(info.getValue())} />,
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    size: 100,
    cell: ({ row: { original } }) => (
      <Flex gap="3" justify="end">
        <Tooltip content="Edit Contact">
          <ActionIcon
            as="span"
            size="sm"
            variant="text"
            className="hover:text-gray-700"
            onClick={() => onEdit(original)}
          >
            <PiPencilSimpleLine className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
        <Tooltip content="Delete Contact">
          <ActionIcon
            as="span"
            size="sm"
            variant="text"
            className="hover:text-red-600"
            onClick={() => onDelete(original.id)}
          >
            <PiTrashSimple className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
      </Flex>
    ),
  }),
];
