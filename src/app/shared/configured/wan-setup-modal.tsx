'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Text } from 'rizzui';
import { getOltVlans, updateOnuMode, getOnuMode } from '@/lib/sanctum-api';

interface WanSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onuId: string;
  oltId: string;
  onSuccess?: () => void;
}

interface Vlan {
  id: number;
  name: string;
  description?: string;
}

export default function WanSetupModal({
  isOpen,
  onClose,
  onuId,
  oltId,
  onSuccess
}: WanSetupModalProps) {
  const [vlans, setVlans] = useState<Vlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [defaultVlanId, setDefaultVlanId] = useState<number>(0);
  const [mode, setMode] = useState<string>('');
  const [routerMode, setRouterMode] = useState<string>('Setup via ONU webpage');
  const [configMethod, setConfigMethod] = useState<string>('OMCI');
  const [ipv4Address, setIpv4Address] = useState<string>('');
  const [subnetMask, setSubnetMask] = useState<string>('');
  const [gateway, setGateway] = useState<string>('');
  const [dns1, setDns1] = useState<string>('');
  const [dns2, setDns2] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [allowRemoteAccess, setAllowRemoteAccess] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      fetchOnuModeData();
      fetchVlans();
    }
  }, [isOpen, onuId, oltId]);

  const fetchOnuModeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOnuMode(onuId);
      if (response.code === 200 && response.data) {
        const data = response.data;

        // Set all form fields from API response
        setDefaultVlanId(data.wan_vlan_id || 0);
        setMode(data.mode || '');

        // Map router_mode from backend to UI values
        const routerModeMapping: { [key: string]: string } = {
          'dhcp': 'DHCP',
          'static': 'Static',
          'pppoe': 'PPPoE',
          'setup via onu webpage': 'Setup via ONU webpage'
        };
        const routerModeValue = data.router_mode
          ? (routerModeMapping[data.router_mode.toLowerCase()] || data.router_mode)
          : 'Setup via ONU webpage';
        setRouterMode(routerModeValue);

        // Capitalize configuration_method to match UI values
        const configMethodValue = data.configuration_method ? data.configuration_method.toUpperCase() : 'OMCI';
        setConfigMethod(configMethodValue);

        setIpv4Address(data.ip_address || '');
        setSubnetMask(data.subnet_mask || '');
        setGateway(data.default_gateway || '');
        setDns1(data.dns1 || '');
        setDns2(data.dns2 || '');
        setUsername(data.pppoe_username || '');
        setPassword(data.pppoe_password || '');
        setAllowRemoteAccess(Number(data.allow_remote_access) || 0);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load ONU mode data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVlans = async () => {
    try {
      const response = await getOltVlans(oltId);
      const vlanList = response.data || [];
      setVlans(vlanList);
    } catch (err: any) {
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Map router_mode from UI to backend values
      const routerModeBackendMapping: { [key: string]: string } = {
        'DHCP': 'dhcp',
        'Static': 'static',
        'PPPoE': 'pppoe',
        'Setup via ONU webpage': 'webpage'
      };

      await updateOnuMode(onuId, {
        wan_vlan_id: defaultVlanId,
        mode: mode.toLowerCase(),
        router_mode: routerModeBackendMapping[routerMode] || routerMode.toLowerCase(),
        configuration_method: configMethod.toLowerCase(),
        ip_protocol: 'ipv4',
        ip_address: ipv4Address,
        subnet_mask: subnetMask,
        default_gateway: gateway,
        dns1,
        dns2,
        pppoe_username: username,
        pppoe_password: password,
        allow_remote_access: allowRemoteAccess,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update ONU mode');
    } finally {
      setSubmitting(false);
    }
  };

  const isRouterMode = mode.toLowerCase() === 'routing';
  const showStaticFields = isRouterMode && routerMode === 'Static';
  const showPppoeFields = isRouterMode && routerMode === 'PPPoE';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">
          Update ONU mode
        </h3>

        {loading ? (
          <div className="py-8 text-center">
            <Text className="text-sm text-gray-500">Loading...</Text>
          </div>
        ) : (
          <div className="space-y-4">
            {/* WAN VLAN-ID */}
            <div className="flex items-start gap-4">
              <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                WAN VLAN-ID
              </label>
              <div className="w-2/3">
                <select
                  value={defaultVlanId}
                  onChange={(e) => setDefaultVlanId(Number(e.target.value))}
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
            </div>

            <div className="flex items-start gap-4">
              <div className="w-full">
                <Text className="text-sm text-gray-500">
                  After changing the VLAN-ID, please check the Ethernet ports settings and update VLANs as desired.
                </Text>
              </div>
            </div>

            {/* ONU Mode */}
            <div className="flex items-start gap-4">
              <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                ONU mode
              </label>
              <div className="w-2/3 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="routing"
                    checked={mode.toLowerCase() === 'routing'}
                    onChange={(e) => setMode(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Routing</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="bridging"
                    checked={mode.toLowerCase() === 'bridging'}
                    onChange={(e) => setMode(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Bridging</span>
                </label>
              </div>
            </div>

            {/* WAN Mode - Only show if Routing */}
            {isRouterMode && (
              <div className="flex items-start gap-4">
                <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                  WAN mode
                </label>
                <div className="w-2/3 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="Setup via ONU webpage"
                      checked={routerMode === 'Setup via ONU webpage'}
                      onChange={(e) => setRouterMode(e.target.value)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Setup via ONU webpage</span>
                  </label>
                  <Text className="text-sm font-medium text-gray-600">
                    Settings for compatible ONUs:
                  </Text>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="DHCP"
                        checked={routerMode === 'DHCP'}
                        onChange={(e) => setRouterMode(e.target.value)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">DHCP</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="Static"
                        checked={routerMode === 'Static'}
                        onChange={(e) => setRouterMode(e.target.value)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Static IP</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="PPPoE"
                        checked={routerMode === 'PPPoE'}
                        onChange={(e) => setRouterMode(e.target.value)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">PPPoE</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Config Method - Only show if Routing and not "Setup via ONU webpage" */}
            {isRouterMode && routerMode !== 'Setup via ONU webpage' && (
              <div className="flex items-start gap-4">
                <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                  Config method
                </label>
                <div className="w-2/3 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="OMCI"
                      checked={configMethod === 'OMCI'}
                      onChange={(e) => setConfigMethod(e.target.value)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">OMCI</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="TR069"
                      checked={configMethod === 'TR069'}
                      onChange={(e) => setConfigMethod(e.target.value)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">TR069</span>
                  </label>
                </div>
              </div>
            )}


            {/* Static IP Fields */}
            {showStaticFields && (
              <>
                <div className="flex items-start gap-4">
                  <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                    IPv4 address
                  </label>
                  <div className="w-2/3">
                    <input
                      type="text"
                      value={ipv4Address}
                      onChange={(e) => setIpv4Address(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="192.168.1.100"
                      pattern="^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                    Subnet mask
                  </label>
                  <div className="w-2/3">
                    <input
                      type="text"
                      value={subnetMask}
                      onChange={(e) => setSubnetMask(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="255.255.255.0"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                    Default gateway
                  </label>
                  <div className="w-2/3">
                    <input
                      type="text"
                      value={gateway}
                      onChange={(e) => setGateway(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="192.168.1.1"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                    DNS 1
                  </label>
                  <div className="w-2/3">
                    <input
                      type="text"
                      value={dns1}
                      onChange={(e) => setDns1(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="8.8.8.8"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                    DNS 2
                  </label>
                  <div className="w-2/3">
                    <input
                      type="text"
                      value={dns2}
                      onChange={(e) => setDns2(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="8.8.4.4"
                    />
                  </div>
                </div>
              </>
            )}

            {/* PPPoE Fields */}
            {showPppoeFields && (
              <>
                <div className="flex items-start gap-4">
                  <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="w-2/3">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      maxLength={64}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="w-2/3">
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      maxLength={64}
                    />
                  </div>
                </div>
              </>
            )}

            {/* WAN Remote Access - Only show if Routing and Setup via ONU webpage */}
            {isRouterMode && routerMode === 'Setup via ONU webpage' && (
              <div className="flex items-start gap-4">
                <label className="w-1/3 pt-2 text-sm font-medium text-gray-700">
                  WAN remote access
                </label>
                <div className="w-2/3">
                  <select
                    value={allowRemoteAccess}
                    onChange={(e) => setAllowRemoteAccess(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    disabled={submitting}
                  >
                    <option value={0}>Disabled / not set</option>
                    <option value={1} disabled>Enabled only from IPs in Remote ACL</option>
                    <option value={2}>Enabled from everywhere in the internet</option>
                  </select>
                </div>
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
                Close
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={submitting}
                disabled={loading}
              >
                Update
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
