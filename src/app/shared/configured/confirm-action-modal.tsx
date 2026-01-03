'use client';

import { Modal, Button, Text } from 'rizzui';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDanger?: boolean;
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  isDanger = false,
}: ConfirmActionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {title}
        </h3>

        <Text className="mb-6 text-sm text-gray-600">
          {message}
        </Text>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            color={isDanger ? 'danger' : 'primary'}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
