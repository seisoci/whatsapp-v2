'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { PhoneNumber } from '.';
import { ActionIcon, Tooltip, Badge } from 'rizzui';
import PencilIcon from '@core/components/icons/pencil';
import DeletePopover from '@/components/delete-popover';
import { getStatusBadge } from '@core/components/table-utils/get-status-badge';
import { PiArrowsClockwise, PiPlugsConnected, PiShieldCheck, PiDeviceMobile, PiInfo, PiNotePencil } from 'react-icons/pi';

const columnHelper = createColumnHelper<PhoneNumber>();

export const createPhoneNumbersColumns = ({
  onEditPhoneNumber,
  onDeletePhoneNumber,
  onSyncPhoneNumber,
  onTestConnection,
  onRequestVerification,
  onVerifyCode,
  onSetTwoStepVerification,
  onViewDisplayNameStatus,
  onEditBusinessProfile,
}: {
  onEditPhoneNumber: (phoneNumber: any) => void;
  onDeletePhoneNumber: (id: string) => void;
  onSyncPhoneNumber: (id: string) => void;
  onTestConnection: (id: string) => void;
  onRequestVerification: (phoneNumber: PhoneNumber) => void;
  onVerifyCode: (phoneNumber: PhoneNumber) => void;
  onSetTwoStepVerification: (phoneNumber: PhoneNumber) => void;
  onViewDisplayNameStatus: (phoneNumber: PhoneNumber) => void;
  onEditBusinessProfile: (phoneNumber: PhoneNumber) => void;
}) => [
  columnHelper.accessor('displayPhoneNumber', {
    id: 'displayPhoneNumber',
    size: 150,
    header: 'Phone Number',
    enableSorting: false,
    cell: ({ row }) => row.original.displayPhoneNumber || row.original.phoneNumberId,
  }),
  columnHelper.accessor('verifiedName', {
    id: 'verifiedName',
    size: 180,
    header: 'Verified Name',
    enableSorting: false,
    cell: ({ row }) => row.original.verifiedName || '-',
  }),
  columnHelper.accessor('name', {
    id: 'name',
    size: 150,
    header: 'Label',
    enableSorting: false,
    cell: ({ row }) => row.original.name || '-',
  }),
  columnHelper.accessor('qualityRating', {
    id: 'qualityRating',
    size: 130,
    header: 'Quality',
    enableSorting: false,
    cell: ({ row }) => {
      const rating = row.original.qualityRating;
      if (!rating || rating === 'UNKNOWN') {
        return <Badge color="secondary">Unknown</Badge>;
      }
      if (rating === 'GREEN') {
        return <Badge color="success">High</Badge>;
      }
      if (rating === 'YELLOW') {
        return <Badge color="warning">Medium</Badge>;
      }
      if (rating === 'RED') {
        return <Badge color="danger">Low</Badge>;
      }
      return <Badge color="secondary">{rating}</Badge>;
    },
  }),
  columnHelper.accessor('messagingLimitTier', {
    id: 'messagingLimitTier',
    size: 150,
    header: 'Message Limit',
    enableSorting: false,
    cell: ({ row }) => {
      const tier = row.original.messagingLimitTier;
      if (!tier || tier === 'UNKNOWN' || tier === 'TIER_NOT_SET') {
        return <span className="text-gray-400">-</span>;
      }
      const limits: Record<string, string> = {
        TIER_50: '50/day',
        TIER_250: '250/day',
        TIER_1K: '1K/day',
        TIER_10K: '10K/day',
        TIER_100K: '100K/day',
        UNLIMITED: 'Unlimited',
      };
      return limits[tier] || tier;
    },
  }),
  columnHelper.accessor('isActive', {
    id: 'isActive',
    size: 100,
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => getStatusBadge(row.original.isActive ? 'active' : 'inactive'),
  }),
  columnHelper.display({
    id: 'actions',
    size: 280,
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-1">
        <Tooltip
          size="sm"
          content="Request Verification"
          placement="top"
          color="invert"
        >
          <ActionIcon
            size="sm"
            variant="outline"
            aria-label="Request Verification"
            onClick={() => onRequestVerification(row.original)}
          >
            <PiDeviceMobile className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
        <Tooltip
          size="sm"
          content="Verify Code"
          placement="top"
          color="invert"
        >
          <ActionIcon
            size="sm"
            variant="outline"
            aria-label="Verify Code"
            onClick={() => onVerifyCode(row.original)}
          >
            <PiShieldCheck className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
        <Tooltip
          size="sm"
          content="Set 2FA PIN"
          placement="top"
          color="invert"
        >
          <ActionIcon
            size="sm"
            variant="outline"
            aria-label="Set 2FA"
            onClick={() => onSetTwoStepVerification(row.original)}
          >
            <PiShieldCheck className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
        <Tooltip
          size="sm"
          content="Business Profile"
          placement="top"
          color="invert"
        >
          <ActionIcon
            size="sm"
            variant="outline"
            aria-label="Business Profile"
            onClick={() => onViewDisplayNameStatus(row.original)}
          >
            <PiInfo className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
        <Tooltip
          size="sm"
          content="Edit Profile"
          placement="top"
          color="invert"
        >
          <ActionIcon
            size="sm"
            variant="outline"
            aria-label="Edit Profile"
            onClick={() => onEditBusinessProfile(row.original)}
          >
            <PiNotePencil className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
        <Tooltip
          size="sm"
          content="Sync from WhatsApp"
          placement="top"
          color="invert"
        >
          <ActionIcon
            size="sm"
            variant="outline"
            aria-label="Sync"
            onClick={() => onSyncPhoneNumber(row.original.id)}
          >
            <PiArrowsClockwise className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
        <Tooltip
          size="sm"
          content="Test Connection"
          placement="top"
          color="invert"
        >
          <ActionIcon
            size="sm"
            variant="outline"
            aria-label="Test Connection"
            onClick={() => onTestConnection(row.original.id)}
          >
            <PiPlugsConnected className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
        <Tooltip
          size="sm"
          content="Edit Phone Number"
          placement="top"
          color="invert"
        >
          <ActionIcon
            size="sm"
            variant="outline"
            aria-label="Edit"
            onClick={() => onEditPhoneNumber(row.original)}
          >
            <PencilIcon className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
        <DeletePopover
          title="Delete Phone Number"
          description="Are you sure you want to delete this phone number?"
          onDelete={() => onDeletePhoneNumber(row.original.id)}
        />
      </div>
    ),
    enableSorting: false,
  }),
];
