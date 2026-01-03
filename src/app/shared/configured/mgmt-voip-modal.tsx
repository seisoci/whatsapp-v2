'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Text, Select, Input } from 'rizzui';
import { getOnuMgmtAndVoip, updateOnuMgmtAndVoip, getOltVlansMgmt } from '@/lib/sanctum-api';

interface MgmtVoipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onuId: string;
  oltId: string;
  onSuccess?: () => void;
}

interface MgmtVoipData {
  tr069_enabled: boolean;
  mgmt_ip_mode: string;
  mgmt_ip_allow_remote_access: boolean;
  mgmt_ip_address: string | null;
  mgmt_vlan_id: number | null;
}

interface Vlan {
  id: number;
  name: string;
  description?: string;
}

export default function MgmtVoipModal({
  isOpen,
  onClose,
  onuId,
  oltId,
  onSuccess
}: MgmtVoipModalProps) {
  const [data, setData] = useState<MgmtVoipData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [tr069Profile, setTr069Profile] = useState<string>('');
  const [mgmtIpMode, setMgmtIpMode] = useState<string>('inactive');
  const [allowRemoteAccess, setAllowRemoteAccess] = useState<boolean>(false);
  const [mgmtVlanId, setMgmtVlanId] = useState<number>(0);
  const [mgmtIpAddress, setMgmtIpAddress] = useState<string>('');
  const [vlans, setVlans] = useState<Vlan[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (oltId && oltId !== 'undefined') {
        fetchVlans();
      }
    }
  }, [isOpen, onuId, oltId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOnuMgmtAndVoip(onuId);
      const mgmtData = response.data;

      setData(mgmtData);
      setTr069Profile(mgmtData.tr069_enabled ? 'Enabled' : 'Disabled');
      setMgmtIpMode(mgmtData.mgmt_ip_mode?.toLowerCase() || 'inactive');
      setAllowRemoteAccess(mgmtData.mgmt_ip_allow_remote_access || false);
      setMgmtVlanId(mgmtData.mgmt_vlan_id || 0);
      setMgmtIpAddress(mgmtData.mgmt_ip_address || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to load management settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchVlans = async () => {
    try {
      const response = await getOltVlansMgmt(oltId);
      setVlans(response.data || []);
    } catch (err: any) {
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      await updateOnuMgmtAndVoip(onuId, {
        tr069_enabled: tr069Profile === 'Enabled',
        mgmt_ip_mode: mgmtIpMode,
        mgmt_ip_allow_remote_access: allowRemoteAccess,
        mgmt_vlan_id: mgmtVlanId,
        mgmt_ip_address: mgmtIpAddress,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update management settings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">
          Update Management and VoIP IP
        </h3>

        {loading ? (
          <div className="py-8 text-center">
            <Text className="text-sm text-gray-500">Loading...</Text>
          </div>
        ) : (
          <div className="space-y-4">
            {/* TR069 Profile */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                TR069 profile
              </label>
              <select
                value={tr069Profile}
                onChange={(e) => setTr069Profile(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={submitting}
              >
                <option value="">Select profile</option>
                <option value="Disabled">Disabled</option>
                <option value="Enabled">Enabled</option>
              </select>
            </div>

            {/* Mgmt IP Mode */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Mgmt IP
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="inactive"
                    checked={mgmtIpMode === 'inactive'}
                    onChange={(e) => setMgmtIpMode(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Inactive</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="dhcp"
                    checked={mgmtIpMode === 'dhcp'}
                    onChange={(e) => setMgmtIpMode(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">DHCP</span>
                </label>
              </div>
            </div>

            {/* Allow Remote Access */}
            {mgmtIpMode === 'dhcp' && (
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allowRemoteAccess}
                    onChange={(e) => setAllowRemoteAccess(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Allow remote access to Mgmt IP from everywhere</span>
                </label>
              </div>
            )}

            {/* Mgmt VLAN-ID */}
            {mgmtIpMode === 'dhcp' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mgmt VLAN-ID
                </label>
                <select
                  value={mgmtVlanId}
                  onChange={(e) => setMgmtVlanId(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  disabled={submitting}
                >
                  <option value={0}>Select VLAN</option>
                  {vlans.map((vlan) => (
                    <option key={vlan.id} value={vlan.id}>
                      {vlan.description ? `${vlan.name} - ${vlan.description}` : vlan.name}
                    </option>
                  ))}
                </select>
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
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={submitting}
                disabled={loading}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
