'use client';

import { useEffect, useState, useRef } from 'react';
import { getOnuDetail, getOnuStatus, getOnuRunningConfig, getOnuHardwareSoftware, rebootOnu, updateOnuAdminState, resyncOnuConfig, getOnuStatusAndSignal, getOnuWanIpAddress, deleteOnu, getOnuTr069Info } from '@/lib/sanctum-api';
import { OnuDetail } from '@/types/onu-detail';
import { Loader, Text, Badge, Button } from 'rizzui';
import PageHeader from '@/app/shared/page-header';
import { routes } from '@/config/routes';
import Image from 'next/image';
import cn from '@core/utils/class-names';
import { PiEyeSlash, PiEye } from 'react-icons/pi';
import toast from 'react-hot-toast';
import LiveTrafficChart from './live-traffic-chart';
import TrafficGraph from './traffic-graph';
import RxPowerGraph from './rxpower-graph';
import ReplaceSnModal from './replace-sn-modal';
import EthernetPortsTable from './ethernet-ports-table';
import SpeedProfilesTable from './speed-profiles-table';
import AttachedVlansModal from './attached-vlans-modal';
import MgmtVoipModal from './mgmt-voip-modal';
import WanSetupModal from './wan-setup-modal';
import UpdateExternalIdModal from './update-external-id-modal';
import UpdateLocationDetailModal from './update-location-detail-modal';
import ConfirmActionModal from './confirm-action-modal';
import BoardPortModal from './board-port-modal';
import { getOnuImage } from '@/utils/get-onu-image';

interface OnuDetailViewProps {
  onuId: string;
}

type OutputType = 'status' | 'running-config' | 'hw-sw' | 'tr069-info' | null;

export default function OnuDetailView({ onuId }: OnuDetailViewProps) {
  const [onuDetail, setOnuDetail] = useState<OnuDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [showPPPoEUsername, setShowPPPoEUsername] = useState(false);
  const [showPPPoEPassword, setShowPPPoEPassword] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [outputType, setOutputType] = useState<OutputType>(null);
  const [loadingOutput, setLoadingOutput] = useState(false);
  const [outputError, setOutputError] = useState<string | null>(null);
  const [tr069ManagementUrl, setTr069ManagementUrl] = useState<string | null>(null);
  const [showLiveTraffic, setShowLiveTraffic] = useState(false);
  const [showReplaceSnModal, setShowReplaceSnModal] = useState(false);
  const [showAttachedVlansModal, setShowAttachedVlansModal] = useState(false);
  const [showMgmtVoipModal, setShowMgmtVoipModal] = useState(false);
  const [showWanSetupModal, setShowWanSetupModal] = useState(false);
  const [showUpdateExternalIdModal, setShowUpdateExternalIdModal] = useState(false);
  const [showUpdateLocationDetailModal, setShowUpdateLocationDetailModal] = useState(false);
  const [showRebootModal, setShowRebootModal] = useState(false);
  const [showResyncModal, setShowResyncModal] = useState(false);
  const [showRestoreDefaultsModal, setShowRestoreDefaultsModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBoardPortModal, setShowBoardPortModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // State for live status and signal
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [liveSignal, setLiveSignal] = useState<string | null>(null);
  const [liveDistance, setLiveDistance] = useState<string | null>(null);
  const [liveLastStatusChange, setLiveLastStatusChange] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State for WAN IP addresses
  const [pppoeIpAddress, setPppoeIpAddress] = useState<string>('');
  const [tr069IpAddress, setTr069IpAddress] = useState<string>('');

  const fetchOnuDetail = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      if (!isRefresh) {
        setImageError(false);
      }
      const response = await getOnuDetail(onuId);
      setOnuDetail(response.data);

      // Fetch WAN IP address
      fetchWanIpAddress();
    } catch (err: any) {
      setError(err?.message || 'Failed to load ONU details');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchWanIpAddress = async () => {
    try {
      const response = await getOnuWanIpAddress(onuId);
      if (response.code === 200 && response.data) {
        setPppoeIpAddress(response.data.pppoe_ip_address || '');
        setTr069IpAddress(response.data.tr069_ip_address || '');
      }
    } catch (err: any) {
    }
  };

  const fetchStatusAndSignal = async () => {
    try {
      setIsPolling(true);
      const response = await getOnuStatusAndSignal(onuId);
      if (response.code === 200) {
        setLiveStatus(response.data.onu_status);
        setLiveSignal(response.data.onu_signal_value);
        setLiveDistance(response.data.distance);
        setLiveLastStatusChange(response.data.last_status_change);
      }
    } catch (err: any) {
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    fetchOnuDetail();

    // Start polling for status and signal
    fetchStatusAndSignal();
    pollingIntervalRef.current = setInterval(() => {
      fetchStatusAndSignal();
    }, 30000); // Poll every 30 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [onuId]);

  const pageHeader = {
    title: `ONU Detail - ${onuDetail?.name || ''}`,
    breadcrumb: [
      {
        href: routes.file.dashboard,
        name: 'Dashboard',
      },
      {
        href: routes.configured.onus,
        name: 'Configured ONUs',
      },
      {
        name: 'Detail',
      },
    ],
  };

  if (loading) {
    return (
      <div className="@container">
        <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />
        <div className="mt-6 flex items-center justify-center p-20">
          <Loader variant="spinner" size="xl" />
        </div>
      </div>
    );
  }

  if (error || !onuDetail) {
    return (
      <div className="@container">
        <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6">
          <Text className="text-center text-red-600">
            {error || 'Failed to load ONU details'}
          </Text>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    if (!status) return 'warning';
    const statusLower = status.trim().toLowerCase();
    if (statusLower.includes('online')) return 'success';
    if (statusLower.includes('offline')) return 'danger';
    return 'warning';
  };

  const handleGetStatus = async () => {
    try {
      setOutputType('status');
      setLoadingOutput(true);
      setOutputError(null);
      setTr069ManagementUrl(null);
      const response = await getOnuStatus(onuId);
      setOutput(response.data.status_info);
    } catch (err: any) {
      setOutputError(err?.message || 'Failed to load ONU status');
      setOutputType(null);
    } finally {
      setLoadingOutput(false);
    }
  };

  const handleShowRunningConfig = async () => {
    try {
      setOutputType('running-config');
      setLoadingOutput(true);
      setOutputError(null);
      setTr069ManagementUrl(null);
      const response = await getOnuRunningConfig(onuId);
      setOutput(response.data.show_run_config);
    } catch (err: any) {
      setOutputError(err?.message || 'Failed to load running config');
      setOutputType(null);
    } finally {
      setLoadingOutput(false);
    }
  };

  const handleShowHwSw = async () => {
    try {
      setOutputType('hw-sw');
      setLoadingOutput(true);
      setOutputError(null);
      setTr069ManagementUrl(null);
      const response = await getOnuHardwareSoftware(onuId);
      setOutput(response.data.hw_sw_info);
    } catch (err: any) {
      setOutputError(err?.message || 'Failed to load hardware/software info');
      setOutputType(null);
    } finally {
      setLoadingOutput(false);
    }
  };

  const handleShowTr069Info = async () => {
    try {
      setOutputType('tr069-info');
      setLoadingOutput(true);
      setOutputError(null);
      setTr069ManagementUrl(null);
      const response = await getOnuTr069Info(onuId);

      // Format TR069 data untuk ditampilkan
      const tr069Data = response.data;

      // Store management URL separately
      setTr069ManagementUrl(tr069Data.url || null);

      const formattedOutput = `TR069 Device Information
======================

Device ID: ${tr069Data.device_id || 'N/A'}
Last Inform: ${tr069Data.last_inform || 'N/A'}
Status: ${tr069Data.status || 'N/A'}

Device Details
--------------
Manufacturer: ${tr069Data.manufacturer || 'N/A'}
Device Type: ${tr069Data.devices_type || 'N/A'}
Serial Number: ${tr069Data.serial_number || 'N/A'}
OUI: ${tr069Data.oui || 'N/A'}

Hardware & Software
-------------------
Hardware Version: ${tr069Data.hardware_version || 'N/A'}
Software Version: ${tr069Data.software_version || 'N/A'}

Network Information
-------------------
PON Mode: ${tr069Data.pon_mode || 'N/A'}
RX Power: ${tr069Data.rx_power || 'N/A'}
Temperature: ${tr069Data.temperature || 'N/A'}°C

PPPoE Configuration
-------------------
Username: ${tr069Data.pppoe_username || 'N/A'}
Password: ${tr069Data.pppoe_password || 'N/A'}
IP Address: ${tr069Data.pppoe_ip || 'N/A'}
MAC Address: ${tr069Data.pppoe_mac || 'N/A'}

TR069 Management
----------------
TR069 IP: ${tr069Data.tr069_ip || 'N/A'}

Uptime Information
------------------
Device Uptime: ${tr069Data.device_uptime || 'N/A'}
PPP Uptime: ${tr069Data.ppp_uptime || 'N/A'}

Active Devices: ${tr069Data.active_devices || '0'}`;

      setOutput(formattedOutput);
    } catch (err: any) {
      setOutputError(err?.message || 'Failed to load TR069 information');
      setOutputType(null);
      setTr069ManagementUrl(null);
    } finally {
      setLoadingOutput(false);
    }
  };

  const getOutputTitle = () => {
    switch (outputType) {
      case 'status':
        return 'Status Information';
      case 'running-config':
        return 'Running Configuration';
      case 'hw-sw':
        return 'Hardware/Software Information';
      case 'tr069-info':
        return 'TR069 Information';
      default:
        return 'Information';
    }
  };

  const handleReboot = async () => {
    try {
      setActionLoading(true);
      const response = await rebootOnu(onuId);
      setShowRebootModal(false);

      if (response.code === 200) {
        toast.success(response.message || 'ONU rebooted successfully');
      } else {
        toast.error(response.message || 'Failed to reboot ONU');
      }

      // Optionally refresh data
      fetchOnuDetail(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reboot ONU');
      setError(err?.message || 'Failed to reboot ONU');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResyncConfig = async () => {
    try {
      setActionLoading(true);
      const response = await resyncOnuConfig(onuId);
      setShowResyncModal(false);

      if (response.code === 200) {
        toast.success(response.message || 'Configuration resynced successfully');
      } else {
        toast.error(response.message || 'Failed to resync config');
      }

      fetchOnuDetail(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resync config');
      setError(err?.message || 'Failed to resync config');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreDefaults = async () => {
    try {
      setActionLoading(true);
      // TODO: Add restore defaults API call when available
      setShowRestoreDefaultsModal(false);
      fetchOnuDetail(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to restore defaults');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleOnuAdminState = async () => {
    try {
      setActionLoading(true);
      const newState = onuDetail?.admin_state_enabled ? 'disabled' : 'enabled';
      const response = await updateOnuAdminState(onuId, { admin_state: newState });
      setShowDisableModal(false);

      if (response.code === 200) {
        toast.success(response.message || `ONU ${newState} successfully`);
      } else {
        toast.error(response.message || `Failed to ${newState} ONU`);
      }

      fetchOnuDetail(true);
    } catch (err: any) {
      const actionText = onuDetail?.admin_state_enabled ? 'disable' : 'enable';
      toast.error(err?.message || `Failed to ${actionText} ONU`);
      setError(err?.message || `Failed to ${actionText} ONU`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      const response = await deleteOnu(onuId);
      setShowDeleteModal(false);

      if (response.code === 200) {
        toast.success(response.message || 'ONU deleted successfully');
        // Redirect to ONU list after deletion
        window.location.href = routes.unconfigured;
      } else {
        toast.error(response.message || 'Failed to delete ONU');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete ONU');
      setError(err?.message || 'Failed to delete ONU');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="@container">
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <div className="mt-6 grid grid-cols-1 gap-6 @5xl:grid-cols-2">
        {/* Left Column - ONU Information */}
        <div>
          <dl className="space-y-3">
            {/* OLT */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">OLT</dt>
              <dd className="w-2/3 text-sm text-gray-900">{onuDetail.olt}</dd>
            </div>

            {/* Board */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">Board</dt>
              <dd className="w-2/3 text-sm text-gray-900">
                <button
                  onClick={() => setShowBoardPortModal(true)}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {onuDetail.board}
                </button>
              </dd>
            </div>

            {/* Port */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">Port</dt>
              <dd className="w-2/3 text-sm text-gray-900">
                <button
                  onClick={() => setShowBoardPortModal(true)}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {onuDetail.port}
                </button>
              </dd>
            </div>

            {/* ONU */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">ONU</dt>
              <dd className="w-2/3 text-sm font-mono text-gray-900">
                {onuDetail.onu}
              </dd>
            </div>

            {/* Channel */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">
                Channel
              </dt>
              <dd className="w-2/3 text-sm text-gray-900">
                {onuDetail.channel}
              </dd>
            </div>

            {/* SN */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">SN</dt>
              <dd className="w-2/3 text-sm font-mono text-gray-900">
                <button
                  onClick={() => setShowReplaceSnModal(true)}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {onuDetail.sn_or_mac}
                </button>
              </dd>
            </div>

            {/* ONU Type */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">
                ONU type
              </dt>
              <dd className="w-2/3 text-sm text-gray-900">
                {onuDetail.onu_type}
              </dd>
            </div>

            {/* Zone */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">Zone</dt>
              <dd className="w-2/3 text-sm text-gray-900">
                <button
                  onClick={() => setShowUpdateLocationDetailModal(true)}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {onuDetail.zone || <em className="text-gray-400">None</em>}
                </button>
              </dd>
            </div>

            {/* ODB (Splitter) */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">
                ODB (Splitter)
              </dt>
              <dd className="w-2/3 text-sm text-gray-900">
                <button
                  onClick={() => setShowUpdateLocationDetailModal(true)}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {onuDetail.odb || <em className="text-gray-400">None</em>}
                </button>
              </dd>
            </div>

            {/* Name */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">Name</dt>
              <dd className="w-2/3 text-sm text-gray-900">
                <button
                  onClick={() => setShowUpdateLocationDetailModal(true)}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {onuDetail.name}
                </button>
              </dd>
            </div>

            {/* Address or comment */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">
                Address or comment
              </dt>
              <dd className="w-2/3 text-sm text-gray-900">
                <button
                  onClick={() => setShowUpdateLocationDetailModal(true)}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {onuDetail.description || (
                    <em className="text-gray-400">None</em>
                  )}
                </button>
              </dd>
            </div>

            {/* Contact */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">
                Contact
              </dt>
              <dd className="w-2/3 text-sm text-gray-900">
                <button
                  onClick={() => setShowUpdateLocationDetailModal(true)}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {onuDetail.contact || <em className="text-gray-400">None</em>}
                </button>
              </dd>
            </div>

            {/* Authorization date */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">
                Authorization date
              </dt>
              <dd className="w-2/3 text-sm text-gray-900">
                {onuDetail.auth_date}
              </dd>
            </div>

            {/* ONU external ID */}
            <div className="flex">
              <dt className="w-1/3 text-sm font-medium text-gray-600">
                ONU external ID
              </dt>
              <dd className="w-2/3 text-sm font-mono text-gray-900">
                <button
                  onClick={() => setShowUpdateExternalIdModal(true)}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {onuDetail.onu_external_id}
                </button>
              </dd>
            </div>
          </dl>
        </div>

        {/* Right Column - Equipment & Status */}
        <div className="space-y-6">
          {/* Equipment Image */}
          <div className="flex justify-center">
            <div className="relative h-20 w-full max-w-md">
              {!imageError ? (
                <Image
                  src={getOnuImage(onuDetail.onu_image)}
                  alt={onuDetail.onu_type}
                  fill
                  className="rounded-lg object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100">
                  <div className="text-center">
                    <div className="mb-2 text-4xl">📡</div>
                    <Text className="text-sm text-gray-500">
                      {onuDetail.onu_type}
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status & Signal Information */}
          <dl className="space-y-3">
              {/* Status */}
              <div className="flex">
                <dt className="w-1/3 text-sm font-medium text-gray-600">
                  Status
                </dt>
                <dd className="w-2/3 flex items-center gap-2">
                  <Badge
                    variant="flat"
                    color={getStatusColor(liveStatus || onuDetail.onu_status)}
                    className="text-sm"
                  >
                    {liveStatus || onuDetail.onu_status}
                  </Badge>
                  {liveLastStatusChange && (
                    <span className="text-xs text-gray-500">
                      {liveLastStatusChange}
                    </span>
                  )}
                  {isPolling && <Loader variant="spinner" size="sm" />}
                </dd>
              </div>

              {/* ONU/OLT Rx signal */}
              <div className="flex">
                <dt className="w-1/3 text-sm font-medium text-gray-600">
                  ONU/OLT Rx signal
                </dt>
                <dd className="w-2/3 text-sm text-gray-900 flex items-center gap-2">
                  <span>
                    {liveSignal || onuDetail.onu_signal_value}
                    {(liveDistance || onuDetail.distance) && (
                      <span className="ml-2 text-gray-500">
                        ({liveDistance || onuDetail.distance})
                      </span>
                    )}
                  </span>
                  {isPolling && <Loader variant="spinner" size="sm" />}
                </dd>
              </div>

              {/* Attached VLANs */}
              <div className="flex">
                <dt className="w-1/3 text-sm font-medium text-gray-600">
                  Attached VLANs
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  <button
                    onClick={() => setShowAttachedVlansModal(true)}
                    className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {onuDetail.attached_vlans_name || (
                      <em className="text-gray-400">None</em>
                    )}
                  </button>
                </dd>
              </div>

              {/* ONU mode */}
              <div className="flex">
                <dt className="w-1/3 text-sm font-medium text-gray-600">
                  ONU mode
                </dt>
                <dd className="w-2/3">
                  <button
                    onClick={() => setShowWanSetupModal(true)}
                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {onuDetail.onu_mode.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')} - WAN vlan: {onuDetail.wan_vlan_id}
                  </button>
                </dd>
              </div>

              {/* TR069 */}
              <div className="flex">
                <dt className="w-1/3 text-sm font-medium text-gray-600">
                  TR069
                </dt>
                <dd className="w-2/3">
                  <button
                    onClick={() => setShowMgmtVoipModal(true)}
                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {onuDetail.tr069}
                  </button>
                </dd>
              </div>

              {/* Mgmt IP */}
              <div className="flex">
                <dt className="w-1/3 text-sm font-medium text-gray-600">
                  Mgmt IP
                </dt>
                <dd className="w-2/3">
                  <button
                    onClick={() => setShowMgmtVoipModal(true)}
                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {onuDetail.mgmt_ip}
                  </button>
                </dd>
              </div>

              {/* WAN setup mode */}
              <div className="flex">
                <dt className="w-1/3 text-sm font-medium text-gray-600">
                  WAN setup mode
                </dt>
                <dd className="w-2/3">
                  <button
                    onClick={() => setShowWanSetupModal(true)}
                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {onuDetail.wan_setup_mode}
                  </button>
                </dd>
              </div>

                           {/* WAN IP address */}
              <div className="flex">
                <dt className="w-1/3 text-sm font-medium text-gray-600">
                  WAN IP address
                </dt>
                <dd className="w-2/3">
                  {pppoeIpAddress || tr069IpAddress ? (
                    <div className="flex flex-col gap-1">
                      {pppoeIpAddress && (
                        <a
                          href={`http://${pppoeIpAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {pppoeIpAddress} (PPPoE)
                        </a>
                      )}
                      {tr069IpAddress && (
                        <a
                          href={`http://${tr069IpAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {tr069IpAddress} (TR069)
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </dd>
              </div>

              {/* PPPoE username */}
              <div className="flex">
                <dt className="w-1/3 text-sm font-medium text-gray-600">
                  PPPoE username
                </dt>
                <dd className="w-2/3 flex items-center gap-2">
                  {onuDetail.pppoe_username ? (
                    <>
                      {showPPPoEUsername ? (
                        <Text className="text-sm text-gray-900">
                          {onuDetail.pppoe_username}
                        </Text>
                      ) : (
                        <Text className="text-sm text-gray-500">**********</Text>
                      )}
                      <button
                        onClick={() => setShowPPPoEUsername(!showPPPoEUsername)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showPPPoEUsername ? (
                          <PiEyeSlash className="h-4 w-4" />
                        ) : (
                          <PiEye className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  ) : (
                    <Text className="text-sm text-gray-500">-</Text>
                  )}
                </dd>
              </div>

              {/* PPPoE password */}
              <div className="flex">
                <dt className="w-1/3 text-sm font-medium text-gray-600">
                  PPPoE password
                </dt>
                <dd className="w-2/3 flex items-center gap-2">
                  {onuDetail.pppoe_password ? (
                    <>
                      {showPPPoEPassword ? (
                        <Text className="text-sm text-gray-900">
                          {onuDetail.pppoe_password}
                        </Text>
                      ) : (
                        <Text className="text-sm text-gray-500">**********</Text>
                      )}
                      <button
                        onClick={() => setShowPPPoEPassword(!showPPPoEPassword)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showPPPoEPassword ? (
                          <PiEyeSlash className="h-4 w-4" />
                        ) : (
                          <PiEye className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  ) : (
                    <Text className="text-sm text-gray-500">-</Text>
                  )}
                </dd>
              </div>
            </dl>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="mt-0 pt-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Status</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="solid"
            color="primary"
            onClick={handleGetStatus}
            isLoading={loadingOutput && outputType === 'status'}
          >
            Get status
          </Button>
          <Button
            variant="solid"
            color="primary"
            onClick={handleShowRunningConfig}
            isLoading={loadingOutput && outputType === 'running-config'}
          >
            Show running-config
          </Button>
          <Button
            variant="solid"
            color="primary"
            onClick={handleShowHwSw}
            isLoading={loadingOutput && outputType === 'hw-sw'}
          >
            SW info
          </Button>
          <Button
            variant="solid"
            color="primary"
            onClick={handleShowTr069Info}
            isLoading={loadingOutput && outputType === 'tr069-info'}
          >
            TR069 Status
          </Button>
          <Button
            variant="solid"
            color="primary"
            onClick={() => setShowLiveTraffic(!showLiveTraffic)}
          >
            {showLiveTraffic ? 'Stop LIVE!' : 'LIVE!'}
          </Button>
        </div>
      </div>

      {/* Live Traffic Chart */}
      <LiveTrafficChart onuId={onuId} isActive={showLiveTraffic} />

      {/* Output Section */}
      {output && (
        <div className="mt-4">
          <div className="rounded-lg border border-gray-200 bg-white">

            <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm font-mono text-gray-900 overflow-x-auto">
              {output}
            </pre>
            {outputType === 'tr069-info' && tr069ManagementUrl && (
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-700">Management URL:</span>
                  <a
                    href={tr069ManagementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {tr069ManagementUrl}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {outputError && (
        <div className="mt-0 rounded-lg border border-red-200 bg-red-50 p-4">
          <Text className="text-sm text-red-600">{outputError}</Text>
        </div>
      )}

      {/* Traffic Graph */}
      {onuDetail && (
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <TrafficGraph onuId={onuId} onuName={onuDetail.onu} />
            </div>
            <div>
              <RxPowerGraph onuId={onuId} onuName={onuDetail.onu} />
            </div>
          </div>
        </div>
      )}

      {/* Speed Profiles Section */}
      <div className="mt-0 pt-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Speed Profiles</h3>
        <SpeedProfilesTable onuId={onuId} />
      </div>

      {/* Ethernet Ports Section */}
      <div className="mt-0 pt-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Ethernet ports</h3>
        {onuDetail && (
          <EthernetPortsTable
            onuId={onuId}
            oltId={String(onuDetail.olt_id)}
            onuMode={onuDetail.onu_mode}
          />
        )}
      </div>

      {/* ONU Actions Section */}
      <div className="mt-0 pt-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="solid"
            color="primary"
            onClick={() => setShowRebootModal(true)}
          >
            Reboot
          </Button>
          <Button
            variant="solid"
            color="primary"
            onClick={() => setShowResyncModal(true)}
          >
            Resync config
          </Button>
          <Button
            variant="solid"
            color="primary"
            onClick={() => setShowRestoreDefaultsModal(true)}
          >
            Restore defaults
          </Button>
          <Button
            variant="solid"
            color="primary"
            onClick={() => setShowDisableModal(true)}
          >
            {onuDetail?.admin_state_enabled ? 'Disable ONU' : 'Enable ONU'}
          </Button>
          <Button
            variant="solid"
            color="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Replace SN Modal */}
      {onuDetail && (
        <ReplaceSnModal
          isOpen={showReplaceSnModal}
          onClose={() => setShowReplaceSnModal(false)}
          onuId={onuId}
          currentSn={onuDetail.sn_or_mac}
          currentOnuType={onuDetail.onu_type}
          onSuccess={() => {
            fetchOnuDetail(true);
          }}
        />
      )}

      {/* Attached VLANs Modal */}
      {onuDetail && (
        <AttachedVlansModal
          isOpen={showAttachedVlansModal}
          onClose={() => {
            setShowAttachedVlansModal(false);
          }}
          onuId={onuId}
          oltId={String(onuDetail.olt_id)}
          currentAttachedVlans={onuDetail.attached_vlans || ''}
          onSuccess={() => {
            fetchOnuDetail(true);
          }}
        />
      )}

      {/* Management and VoIP Modal */}
      <MgmtVoipModal
        isOpen={showMgmtVoipModal}
        onClose={() => setShowMgmtVoipModal(false)}
        onuId={onuId}
        oltId={String(onuDetail?.olt_id || '')}
        onSuccess={() => {
          fetchOnuDetail(true);
        }}
      />

      {/* WAN Setup Modal */}
      <WanSetupModal
        isOpen={showWanSetupModal}
        onClose={() => setShowWanSetupModal(false)}
        onuId={onuId}
        oltId={String(onuDetail?.olt_id || '')}
        onSuccess={() => {
          fetchOnuDetail(true);
        }}
      />

      {/* Update External ID Modal */}
      {onuDetail && (
        <UpdateExternalIdModal
          isOpen={showUpdateExternalIdModal}
          onClose={() => setShowUpdateExternalIdModal(false)}
          onuId={onuId}
          currentExternalId={onuDetail.onu_external_id}
          onSuccess={() => {
            fetchOnuDetail(true);
          }}
        />
      )}

      {/* Update Location Detail Modal */}
      {onuDetail && (
        <UpdateLocationDetailModal
          isOpen={showUpdateLocationDetailModal}
          onClose={() => setShowUpdateLocationDetailModal(false)}
          onuId={onuId}
          currentName={onuDetail.name}
          currentDescription={onuDetail.description}
          currentContact={onuDetail.contact}
          currentZoneId={onuDetail.zone_id}
          currentOdbId={onuDetail.odb_id}
          currentOdbPort={onuDetail.odb_port}
          currentLatitude={onuDetail.latitude}
          currentLongitude={onuDetail.longitude}
          onSuccess={() => {
            fetchOnuDetail(true);
          }}
        />
      )}

      {/* Confirm Reboot Modal */}
      <ConfirmActionModal
        isOpen={showRebootModal}
        onClose={() => setShowRebootModal(false)}
        onConfirm={handleReboot}
        title="Reboot ONU"
        message="Are you sure you want to reboot this ONU? This will temporarily disconnect the device."
        confirmText="Reboot"
        isLoading={actionLoading}
      />

      {/* Confirm Resync Config Modal */}
      <ConfirmActionModal
        isOpen={showResyncModal}
        onClose={() => setShowResyncModal(false)}
        onConfirm={handleResyncConfig}
        title="Resync Configuration"
        message="Are you sure you want to resync the configuration for this ONU?"
        confirmText="Resync"
        isLoading={actionLoading}
      />

      {/* Confirm Restore Defaults Modal */}
      <ConfirmActionModal
        isOpen={showRestoreDefaultsModal}
        onClose={() => setShowRestoreDefaultsModal(false)}
        onConfirm={handleRestoreDefaults}
        title="Restore Defaults"
        message="Are you sure you want to restore this ONU to factory defaults? This action cannot be undone."
        confirmText="Restore"
        isLoading={actionLoading}
        isDanger={true}
      />

      {/* Confirm Disable/Enable ONU Modal */}
      <ConfirmActionModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={handleToggleOnuAdminState}
        title={onuDetail?.admin_state_enabled ? 'Disable ONU' : 'Enable ONU'}
        message={
          onuDetail?.admin_state_enabled
            ? 'Are you sure you want to disable this ONU? The device will be disconnected.'
            : 'Are you sure you want to enable this ONU? The device will be activated.'
        }
        confirmText={onuDetail?.admin_state_enabled ? 'Disable' : 'Enable'}
        isLoading={actionLoading}
        isDanger={onuDetail?.admin_state_enabled}
      />

      {/* Confirm Delete Modal */}
      <ConfirmActionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete ONU"
        message="Are you sure you want to delete this ONU? This action cannot be undone and will permanently remove the ONU from the system."
        confirmText="Delete"
        isLoading={actionLoading}
        isDanger={true}
      />

      {/* Board Port Modal */}
      {onuDetail && (
        <BoardPortModal
          isOpen={showBoardPortModal}
          onClose={() => setShowBoardPortModal(false)}
          oltId={String(onuDetail.olt_id)}
          currentBoard={String(onuDetail.board)}
          currentPort={String(onuDetail.port)}
          onSuccess={(board, port) => {
            toast.success(`Board: ${board}, Port: ${port} selected`);
          }}
        />
      )}
    </div>
  );
}
