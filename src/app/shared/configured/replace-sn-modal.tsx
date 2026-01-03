'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Text } from 'rizzui';
import { getOnuSerialNumbers, updateOnuSerialNumber } from '@/lib/sanctum-api';
import { PiMagnifyingGlassBold } from 'react-icons/pi';

interface ReplaceSnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onuId: string;
  currentSn: string;
  currentOnuType: string;
  onSuccess?: () => void;
}

interface UnconfiguredOnu {
  sn: string;
  onu_type?: string;
}

export default function ReplaceSnModal({
  isOpen,
  onClose,
  onuId,
  currentSn,
  currentOnuType,
  onSuccess
}: ReplaceSnModalProps) {
  const [sn, setSn] = useState('');
  const [selectedFoundSn, setSelectedFoundSn] = useState('');
  const [unconfiguredOnus, setUnconfiguredOnus] = useState<UnconfiguredOnu[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFoundSns, setShowFoundSns] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSn(currentSn);
      setSelectedFoundSn('');
      setShowFoundSns(false);
      setUnconfiguredOnus([]);
      setError(null);
    }
  }, [isOpen, currentSn]);

  const handleLookup = async () => {
    try {
      setSearching(true);
      setError(null);
      const response = await getOnuSerialNumbers(onuId);
      const onus = response.data?.unconfigured || [];
      setUnconfiguredOnus(onus);
      setShowFoundSns(onus.length > 0);

      if (onus.length === 0) {
        setError('No unconfigured ONUs found on this PON');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch unconfigured ONUs');
      setShowFoundSns(false);
    } finally {
      setSearching(false);
    }
  };

  const handleReplace = async () => {
    try {
      setLoading(true);
      setError(null);

      const newSn = selectedFoundSn || sn;

      if (!newSn) {
        setError('Please enter or select a serial number');
        return;
      }

      await updateOnuSerialNumber(onuId, {
        serial_number: newSn,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to replace ONU serial number');
    } finally {
      setLoading(false);
    }
  };

  const foundSnOptions = unconfiguredOnus.map(onu => ({
    label: onu.sn + (onu.onu_type ? ` (${onu.onu_type})` : ''),
    value: onu.sn,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">
          Replace ONU by SN
        </h3>

        <div className="space-y-4">
          {/* SN Input with Lookup Button */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              SN
            </label>
            <div className="flex gap-2">
              <Input
                value={sn}
                onChange={(e) => setSn(e.target.value)}
                placeholder={currentSn}
                disabled={searching || loading}
                className="flex-1"
              />
              <Button
                onClick={handleLookup}
                isLoading={searching}
                disabled={loading}
                variant="outline"
              >
                <PiMagnifyingGlassBold className="h-4 w-4" />
              </Button>
            </div>
            <Text className="mt-1 text-xs text-gray-500">
              Click lookup to find unconfigured ONUs on this PON
            </Text>
          </div>

          {/* Found SNs Dropdown */}
          {showFoundSns && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Found SNs
              </label>
              <Select
                options={foundSnOptions}
                value={selectedFoundSn}
                onChange={(value) => setSelectedFoundSn(value as string)}
                placeholder="Select a serial number"
                disabled={loading}
              />
            </div>
          )}

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
              Close
            </Button>
            <Button
              onClick={handleReplace}
              isLoading={loading}
              disabled={searching}
            >
              Replace
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
