'use client';

import { useState } from 'react';
import { ActionIcon, Button, Popover, Text, Title } from 'rizzui';
import { PiTrashBold } from 'react-icons/pi';
import toast from 'react-hot-toast';
import { deleteSpeedProfile } from '@/lib/sanctum-api';

export default function DeleteSpeedProfilePopover({
  speedProfileId,
  speedProfileName,
  onSuccess,
}: {
  speedProfileId: number;
  speedProfileName: string;
  onSuccess?: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (setOpen: (open: boolean) => void) => {
    setIsDeleting(true);
    try {
      await deleteSpeedProfile(speedProfileId);
      toast.success('Speed Profile deleted successfully');
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete Speed Profile');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Popover placement="left">
      <Popover.Trigger>
        <ActionIcon
          size="sm"
          variant="outline"
          aria-label="Delete Speed Profile"
          className="hover:bg-red-50 hover:border-red-200 cursor-pointer"
        >
          <PiTrashBold className="h-4 w-4" />
        </ActionIcon>
      </Popover.Trigger>
      <Popover.Content className="z-10">
        {({ setOpen }) => (
          <div className="w-56 pb-2 pt-1 text-left">
            <Title
              as="h6"
              className="mb-0.5 flex items-start text-sm text-gray-700"
            >
              <PiTrashBold className="me-1 h-[17px] w-[17px]" /> Delete Speed Profile
            </Title>
            <Text className="mb-2 leading-relaxed text-gray-500">
              Are you sure you want to delete <strong>{speedProfileName}</strong>?
            </Text>
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() => setOpen(false)}
                disabled={isDeleting}
              >
                No
              </Button>
              <Button
                size="sm"
                color="danger"
                className="h-7"
                onClick={() => handleDelete(setOpen)}
                isLoading={isDeleting}
              >
                Yes
              </Button>
            </div>
          </div>
        )}
      </Popover.Content>
    </Popover>
  );
}
