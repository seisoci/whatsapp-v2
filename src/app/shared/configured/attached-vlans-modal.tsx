'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Text } from 'rizzui';
import { MultiSelect } from 'rizzui/multi-select';
import { getOltVlans, updateOnuAttachedVlans } from '@/lib/sanctum-api';

interface AttachedVlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onuId: string;
  oltId: string;
  currentAttachedVlans: string; // e.g., "76, 77, 78"
  onSuccess?: () => void;
}

interface Vlan {
  id: number;
  name: string;
  description?: string;
}

interface VlanOption {
  label: string;
  value: string;
}

export default function AttachedVlansModal({
  isOpen,
  onClose,
  onuId,
  oltId,
  currentAttachedVlans,
  onSuccess
}: AttachedVlansModalProps) {
  const [vlanOptions, setVlanOptions] = useState<VlanOption[]>([]);
  const [selectedVlans, setSelectedVlans] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch VLANs if oltId is valid
    if (oltId && oltId !== 'undefined') {
      fetchVlans();
    } else {
    }
  }, [isOpen, oltId]);

  const fetchVlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOltVlans(oltId);
      const vlans = response.data || [];

      // Convert to MultiSelect options
      const options = vlans.map((vlan: Vlan) => ({
        label: vlan.description ? `${vlan.name} - ${vlan.description}` : vlan.name,
        value: String(vlan.id), // Use ID as value for backend validation
      }));

      setVlanOptions(options);

      // Map current attached VLAN names to IDs
      if (currentAttachedVlans) {
        const attachedNames = currentAttachedVlans.split(',').map(v => v.trim()).filter(Boolean);
        const attachedIds = attachedNames
          .map(name => {
            const vlan = vlans.find((v: Vlan) => v.name === name);
            return vlan ? String(vlan.id) : null;
          })
          .filter(Boolean) as string[];
        setSelectedVlans(attachedIds);
      } else {
        setSelectedVlans([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load VLANs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      await updateOnuAttachedVlans(onuId, {
        vlans: selectedVlans,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update attached VLANs');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">
          Attached VLANs
        </h3>

        {loading ? (
          <div className="py-8 text-center">
            <Text className="text-sm text-gray-500">Loading VLANs...</Text>
          </div>
        ) : (
          <div className="space-y-4">

            {/* MultiSelect */}
            <MultiSelect
              value={selectedVlans}
              options={vlanOptions}
              onChange={setSelectedVlans}
              label="Select VLANs"
              placeholder="Select VLANs to attach"
              disabled={submitting}
            />

               {/* Instruction Text */}
            <Text className="text-sm text-gray-600">
              Select from the list all the VLANs that will be used on this ONU.
            </Text>

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
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={submitting}
                disabled={loading}
              >
                OK
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
