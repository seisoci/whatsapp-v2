'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Text } from 'rizzui';
import { updateOnuExternalId } from '@/lib/sanctum-api';

interface UpdateExternalIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onuId: string;
  currentExternalId: string;
  onSuccess?: () => void;
}

export default function UpdateExternalIdModal({
  isOpen,
  onClose,
  onuId,
  currentExternalId,
  onSuccess
}: UpdateExternalIdModalProps) {
  const [externalId, setExternalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setExternalId(currentExternalId);
      setError(null);
    }
  }, [isOpen, currentExternalId]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!externalId.trim()) {
        setError('Please enter ONU external ID');
        return;
      }

      await updateOnuExternalId(onuId, {
        onu_external_id: externalId,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update ONU external ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">
          Update ONU External ID
        </h3>

        <div className="space-y-4">
          {/* External ID Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              ONU external ID
            </label>
            <Input
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="Enter ONU external ID"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              isLoading={loading}
            >
              Update
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
