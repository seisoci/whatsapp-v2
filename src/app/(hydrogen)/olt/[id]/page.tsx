'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getOltDetail, getOltInformation, openTerminal } from '@/lib/sanctum-api';
import { Olt, OltInformation } from '@/types/olt';
import { routes } from '@/config/routes';
import WidgetCard from '@core/components/cards/widget-card';
import PasswordField from '@/app/shared/olt/password-field';
import TR069Selector from '@/app/shared/olt/tr069-selector';

import { Loader, Text, Badge, Button } from 'rizzui';
import { PiPencilBold, PiClockCounterClockwiseBold, PiTerminalBold, PiDatabaseBold, PiUploadBold, PiFanDuotone } from 'react-icons/pi';
import toast from 'react-hot-toast';

export default function OltDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [olt, setOlt] = useState<Olt | null>(null);
  const [information, setInformation] = useState<OltInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const fetchOltDetail = async () => {
    try {
      setLoading(true);
      const response = await getOltDetail(resolvedParams.id);

      if (response.data) {
        setOlt(response.data);
      } else {
        toast.error('Failed to load OLT details');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load OLT details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOltInformation = async () => {
    try {
      setLoadingInfo(true);
      const response = await getOltInformation(resolvedParams.id);

      if (response.data) {
        setInformation(response.data);
      }
    } catch (error: any) {
      // Don't show error toast, silently fail
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    fetchOltDetail();
    fetchOltInformation();
  }, [resolvedParams.id]);

  const handleOpenTerminal = async () => {
    if (!olt) {
      toast.error('OLT data not loaded');
      return;
    }

    try {
      toast.loading('Opening terminal...', { id: 'terminal-loading' });

      const response = await openTerminal(olt.id);

      toast.dismiss('terminal-loading');

      if (response.id && response.channel) {
        // Store terminal session info in sessionStorage so the terminal page can access it
        const sessionInfo = {
          id: response.id,
          channelName: response.channel,
          title: `${olt.name} (${olt.olt_ip_address})`,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(`terminal-session-${response.id}`, JSON.stringify(sessionInfo));

        // Open terminal in popup window like OAuth
        const terminalUrl = `${window.location.origin}/terminal/${response.id}`;
        const popup = window.open(
          terminalUrl,
          'terminal-popup',
          'width=900,height=600,scrollbars=no,resizable=yes,status=no,toolbar=no,menubar=no,location=no'
        );

        if (popup) {
          // Focus the popup
          popup.focus();
          toast.success('Terminal opened in popup window');
        } else {
          toast.error('Popup blocked. Please allow popups for this site.');
        }
      } else {
        toast.error('Invalid terminal response');
      }
    } catch (error: any) {
      toast.dismiss('terminal-loading');
      toast.error(error?.message || 'Failed to open terminal');
    }
  };





  if (loading) {
    return (
      <div className="mt-6 flex min-h-[400px] items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  if (!olt) {
    return (
      <div className="mt-6 flex min-h-[400px] items-center justify-center">
        <Text>OLT not found</Text>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        {/* <Link href={`/olt/edit/${resolvedParams.id}`}>
          <Button variant="outline" className="gap-2">
            <PiPencilBold className="h-4 w-4" />
            Edit OLT Settings
          </Button>
        </Link> */}

        {/* <Button variant="outline" className="gap-2">
          <PiClockCounterClockwiseBold className="h-4 w-4" />
          See History
        </Button> */}

        <Button variant="outline" className="gap-2" onClick={handleOpenTerminal}>
          <PiTerminalBold className="h-4 w-4" />
          Open Terminal
        </Button>

        {/* <Button variant="outline" className="gap-2">
          <PiUploadBold className="h-4 w-4" />
          Import ONUs
        </Button> */}
      </div>

      <WidgetCard title="OLT Device Information">
        {loadingInfo ? (
          <div className="flex justify-center py-8">
            <Loader variant="spinner" size="lg" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              {/* OLT Image with Info */}
              <div className="flex flex-col items-center gap-4">
                {/* OLT Image */}
                <div className="relative w-full aspect-square max-w-[200px]">
                  <Image
                    src="/images/c320.jpg"
                    alt="OLT C320"
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="w-full space-y-3">
                  {/* OLT Name */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Text className="text-sm font-medium text-gray-500">OLT Name</Text>
                    <Text className="text-sm font-semibold text-gray-900">{olt.name}</Text>
                  </div>

                  {/* Manufacturer - Hardware Version */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Text className="text-sm font-medium text-gray-500">Model</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {olt.manufacturer ? `${olt.manufacturer} - ${olt.hardware_version}` : olt.hardware_version}
                    </Text>
                  </div>

                  {/* Uptime and Temperature */}
                  {information ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <Text className="text-sm font-medium text-gray-500">Uptime</Text>
                        <Text className="text-sm font-semibold text-gray-900">{information.uptime || 'N/A'}</Text>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <Text className="text-sm font-medium text-gray-500">Temperature</Text>
                        <Text className="text-sm font-semibold text-gray-900">{information.temperature || 'N/A'}</Text>
                      </div>
                    </>
                  ) : (
                    <Text className="text-sm text-center text-gray-500">No device information available</Text>
                  )}
                </div>
              </div>

              {/* Fans Status */}
              <div className="lg:col-span-3">
                {information && information.fans && information.fans.length > 0 ? (
                  <div>
                    <Text className="mb-4 text-sm font-semibold text-gray-900">Fans</Text>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {information.fans.map((fan) => (
                        <div
                          key={fan.fan_id}
                          className="flex flex-col items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <PiFanDuotone className="h-6 w-6 text-blue-600 animate-spin" style={{ animationDuration: '2s' }} />
                            <Text className="text-sm font-semibold text-gray-900">Fan {fan.fan_id}</Text>
                          </div>
                          <div className="w-full space-y-2">
                            <div className="flex items-center justify-between">
                              <Text className="text-xs text-gray-500">Speed</Text>
                              <Badge variant="flat" color="info" className="text-xs">
                                {fan.speed} RPM
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <Text className="text-xs text-gray-500">Level</Text>
                              <Badge variant="flat" color="secondary" className="text-xs">
                                {fan.level}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <Text className="text-gray-500">No fan data available</Text>
                  </div>
                )}
              </div>
            </div>

            {/* OLT Information Section */}
            <div className="border-t pt-6">
              <Text className="mb-4 text-base font-semibold text-gray-900">OLT Information</Text>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-500">IP Address</Text>
                  <Text className="font-mono text-base">{olt.olt_ip_address}</Text>
                </div>

                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-500">VPN Tunnel</Text>
                  <Badge
                    variant="flat"
                    color={olt.vpn_tunnel === 'yes' ? 'success' : 'secondary'}
                  >
                    {olt.vpn_tunnel === 'yes' ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-500">Software Version</Text>
                  <Text className="text-base">{olt.software_version}</Text>
                </div>

                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-500">Supported PON Types</Text>
                  <Text className="text-base">{olt.supported_pon_types || '-'}</Text>
                </div>

                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-500">IPTV Module</Text>
                  <Badge
                    variant="flat"
                    color={olt.iptv_module === 'yes' || olt.iptv_module === 'enabled' ? 'success' : 'secondary'}
                    className="capitalize"
                  >
                    {olt.iptv_module === 'yes' || olt.iptv_module === 'enabled' ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Telnet Configuration Section */}
            <div className="border-t pt-6">
              <Text className="mb-4 text-base font-semibold text-gray-900">Telnet Configuration</Text>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-500">Telnet Port</Text>
                  <Text className="font-mono text-base">{olt.telnet_port ?? '-'}</Text>
                </div>

                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-500">Username</Text>
                  <PasswordField value={olt.telnet_username || ''} label="Username" />
                </div>

                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-500">Password</Text>
                  <PasswordField value={olt.telnet_password || ''} label="Password" />
                </div>
              </div>
            </div>

            {/* SNMP Configuration Section */}
            <div className="border-t pt-6">
              <Text className="mb-4 text-base font-semibold text-gray-900">SNMP Configuration</Text>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-500">SNMP UDP Port</Text>
                  <Text className="font-mono text-base">{olt.snmp_udp_port || '-'}</Text>
                </div>

                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-500">Read Only Community</Text>
                  <PasswordField value={olt.snmp_read_only || ''} label="Read Only" />
                </div>

                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-500">Read Write Community</Text>
                  <PasswordField value={olt.snmp_read_write || ''} label="Read Write" />
                </div>
              </div>
            </div>
          </div>
        )}
      </WidgetCard>

    </div>
  );
}


