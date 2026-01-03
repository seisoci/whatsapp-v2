'use client';

import { useState, useEffect } from 'react';
import { getOnuEthernetPorts, updateOnuEthernetPort, getOltVlans } from '@/lib/sanctum-api';
import { Button, Modal, Text } from 'rizzui';
import { PiGearBold } from 'react-icons/pi';
import { capitalizeWords } from '@/utils/capitalize-words';
import toast from 'react-hot-toast';

interface EthernetPort {
  port: number;
  port_prefix: string;
  port_enabled: number | boolean;
  port_mode: string;
  olt_vlan_id: number;
  vlan_dhcp: string;
}

interface EthernetPortsTableProps {
  onuId: string;
  oltId: string;
  onuMode: string;
}

export default function EthernetPortsTable({ onuId, oltId, onuMode }: EthernetPortsTableProps) {
  const [ports, setPorts] = useState<EthernetPort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPort, setSelectedPort] = useState<EthernetPort | null>(null);
  const [vlans, setVlans] = useState<any[]>([]);

  // Modal form state
  const [portEnabled, setPortEnabled] = useState(1);
  const [portMode, setPortMode] = useState('LAN');
  const [vlanId, setVlanId] = useState(0);
  const [vlanDhcp, setVlanDhcp] = useState('From ONU');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!onuId) {
      setLoading(false);
      return;
    }

    fetchPorts();

    if (oltId && oltId !== 'undefined') {
      fetchVlans();
    }
  }, [onuId, oltId]);

  // Set default mode to LAN when enabling a disabled port
  useEffect(() => {
    if (portEnabled === 1 && !portMode) {
      setPortMode('LAN');
      setVlanDhcp('From ONU');
    }
  }, [portEnabled]);

  const fetchPorts = async () => {
    try {
      setLoading(true);
      const response = await getOnuEthernetPorts(onuId);
      setPorts(response.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load ethernet ports');
    } finally {
      setLoading(false);
    }
  };

  const fetchVlans = async () => {
    try {
      const response = await getOltVlans(oltId);
      setVlans(response.data || []);
    } catch (err: any) {
    }
  };

  const handleConfigure = (port: EthernetPort) => {
    setSelectedPort(port);
    // Convert port_enabled to number (1 or 0) regardless of whether it's boolean or number
    setPortEnabled(port.port_enabled === true || port.port_enabled === 1 ? 1 : 0);

    // Capitalize first letter to match radio button values
    // Handle special case for LAN (all uppercase)
    let portModeValue: string;
    if (port.port_mode) {
      const modeLower = port.port_mode.toLowerCase();
      if (modeLower === 'lan') {
        portModeValue = 'LAN';
      } else {
        portModeValue = port.port_mode.charAt(0).toUpperCase() + port.port_mode.slice(1).toLowerCase();
      }
    } else {
      portModeValue = onuMode === 'Bridging' ? 'Access' : 'LAN';
    }
    setPortMode(portModeValue);

    setVlanId(port.olt_vlan_id || 0);

    // Capitalize words to match select option values (From ONU, From ISP, etc.)
    let vlanDhcpValue: string;
    if (port.vlan_dhcp) {
      const dhcpLower = port.vlan_dhcp.toLowerCase();
      if (dhcpLower === 'from onu') {
        vlanDhcpValue = 'From ONU';
      } else if (dhcpLower === 'from isp') {
        vlanDhcpValue = 'From ISP';
      } else if (dhcpLower === 'no control') {
        vlanDhcpValue = 'No control';
      } else if (dhcpLower === 'forbidden') {
        vlanDhcpValue = 'Forbidden';
      } else {
        vlanDhcpValue = port.vlan_dhcp.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
      }
    } else {
      vlanDhcpValue = 'From ONU';
    }
    setVlanDhcp(vlanDhcpValue);

    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedPort) return;

    try {
      setSubmitting(true);

      const data = {
        port_enabled: portEnabled,
        port_mode: portMode.toLowerCase(), // Backend expects lowercase
        olt_vlan_id: vlanId || null, // Send null instead of 0
        vlan_dhcp: vlanDhcp.toLowerCase(), // Backend expects lowercase
      };

      const response = await updateOnuEthernetPort(onuId, selectedPort.port, data);

      if (response.code === 200) {
        toast.success(response.message || 'Ethernet port updated successfully');
      } else {
        toast.error(response.message || 'Failed to update ethernet port');
      }

      await fetchPorts();
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update ethernet port');
    } finally {
      setSubmitting(false);
    }
  };

  const getAdminStateLabel = (enabled: number | boolean) => {
    return enabled === 1 || enabled === true ? 'Enabled' : 'Disabled';
  };

  if (loading) {
    return <Text className="text-sm text-gray-500">Loading ethernet ports...</Text>;
  }

  if (error) {
    return <Text className="text-sm text-red-600">{error}</Text>;
  }

  if (ports.length === 0) {
    return <Text className="text-sm text-gray-500">No ethernet ports found</Text>;
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="p-3 text-left text-sm font-semibold text-gray-700">Port</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-700">Admin state</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-700">Mode</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-700">DHCP</th>
              <th className="p-3 text-center text-sm font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {ports.map((port, index) => (
              <tr key={index} className="border-b border-gray-200 last:border-b-0 even:bg-gray-50">
                <td className="p-3 text-sm text-gray-900">
                  {port.port_prefix}_{port.port}
                </td>
                <td className="p-3 text-sm text-gray-900">
                  {getAdminStateLabel(port.port_enabled)}
                </td>
                <td className="p-3 text-sm text-gray-900">{(port.port_mode || 'LAN').toUpperCase()}</td>
                <td className="p-3 text-sm text-gray-900">{capitalizeWords(port.vlan_dhcp || 'from onu')}</td>
                <td className="p-3 text-center">
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => handleConfigure(port)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PiGearBold className="mr-1 h-4 w-4" />
                    Configure
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Configure Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <div className="p-6">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">
            Configure ethernet port {selectedPort && `${selectedPort.port_prefix}_${selectedPort.port}`}
          </h3>

          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={1}
                    checked={portEnabled === 1}
                    onChange={(e) => setPortEnabled(Number(e.target.value))}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Enabled</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={0}
                    checked={portEnabled === 0}
                    onChange={(e) => setPortEnabled(Number(e.target.value))}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Port shutdown</span>
                </label>
              </div>
            </div>

            {/* Mode */}
            {portEnabled === 1 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Mode</label>
                <div className="flex flex-wrap gap-4">
                  {onuMode !== 'Bridging' && (
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="LAN"
                        checked={portMode === 'LAN'}
                        onChange={(e) => {
                          setPortMode(e.target.value);
                          setVlanDhcp('From ONU');
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">LAN</span>
                    </label>
                  )}
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="Access"
                      checked={portMode === 'Access'}
                      onChange={(e) => {
                        setPortMode(e.target.value);
                        setVlanDhcp('From ISP');
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Access</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="Hybrid"
                      checked={portMode === 'Hybrid'}
                      onChange={(e) => {
                        setPortMode(e.target.value);
                        setVlanDhcp('From ISP');
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Hybrid</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="Trunk"
                      checked={portMode === 'Trunk'}
                      onChange={(e) => {
                        setPortMode(e.target.value);
                        setVlanDhcp('From ISP');
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Trunk</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="Transparent"
                      checked={portMode === 'Transparent'}
                      onChange={(e) => {
                        setPortMode(e.target.value);
                        setVlanDhcp('From ISP');
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Transparent</span>
                  </label>
                </div>
              </div>
            )}

            {/* VLAN-ID */}
            {portEnabled === 1 && (portMode === 'Access' || portMode === 'Hybrid') && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">VLAN-ID</label>
                <select
                  value={vlanId}
                  onChange={(e) => setVlanId(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value={0}>Select VLAN</option>
                  {vlans.map((vlan) => (
                    <option key={vlan.id} value={vlan.id}>
                      {vlan.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DHCP */}
            {portEnabled === 1 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">DHCP</label>
                <select
                  value={vlanDhcp}
                  onChange={(e) => setVlanDhcp(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="No control">No control</option>
                  <option value="From ISP">From ISP</option>
                  <option value="From ONU">From ONU</option>
                  <option value="Forbidden">Forbidden</option>
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>
                Close
              </Button>
              <Button onClick={handleSubmit} isLoading={submitting}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
