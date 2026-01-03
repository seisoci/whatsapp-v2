'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PageHeader from '@/app/shared/page-header';
import {
  authorizeOnu,
  getOltDetail,
  getOnuTypes,
  getOltVlans,
  getOdbs,
  getZones,
  getSpeedProfiles
} from '@/lib/sanctum-api';
import { Loader, Button, Input, Select } from 'rizzui';
import toast from 'react-hot-toast';
import { routes } from '@/config/routes';

const pageHeader = {
  title: 'Authorize ONU',
  breadcrumb: [
    { name: 'Unconfigured ONU', href: routes.unconfigured },
    { name: 'Authorize' },
  ],
};

interface SelectOption {
  value: string | number;
  label: string;
}

export default function AuthorizeOnuPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Get params from URL
  const board = searchParams.get('board') || '';
  const port = searchParams.get('port') || '';
  const sn = searchParams.get('sn') || '';
  const ponType = searchParams.get('pon') || 'gpon';
  const onuTypeParam = searchParams.get('onu_type') || '';
  const oltId = searchParams.get('olt') || '';

  // OLT Data
  const [oltData, setOltData] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    olt_id: oltId,
    pon_type: ponType,
    gpon_type: 'gpon',
    epon_type: 'epon',
    board: board,
    port: port,
    sn: sn,
    onu_type_id: onuTypeParam,
    custom_profile: false,
    custom_template_id: '',
    mode: 'routing', // Changed to lowercase
    use_svlan: false,
    svlan_id: '',
    tag_transform_mode: 'default',
    use_other_all_tls_vlan: false,
    use_cvlan: false,
    cvlan_id: '',
    vlan_id: '',
    location_id: '',
    odb_id: '',
    odb_port: '',
    download_speed: '',
    upload_speed: '',
    location_name: '',
    description: '',
    client_external_id: sn,
    geolocation: false,
    latitude: '',
    longitude: '',
  });

  // Options state
  const [onuTypes, setOnuTypes] = useState<SelectOption[]>([]);
  const [vlans, setVlans] = useState<SelectOption[]>([]);
  const [zones, setZones] = useState<SelectOption[]>([]);
  const [odbs, setOdbs] = useState<SelectOption[]>([]);
  const [downloadSpeeds, setDownloadSpeeds] = useState<SelectOption[]>([]);
  const [uploadSpeeds, setUploadSpeeds] = useState<SelectOption[]>([]);

  useEffect(() => {
    if (oltId) {
      fetchInitialData();
    }
  }, [oltId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);


      // Fetch all data in parallel
      const [
        oltResponse,
        onuTypeResponse,
        vlanResponse,
        odbResponse,
        zoneResponse,
        downloadSpeedResponse,
        uploadSpeedResponse
      ] = await Promise.all([
        getOltDetail(oltId).catch(err => {
          return { code: 500, data: null, message: err.message };
        }),
        getOnuTypes().catch(err => {
          return { code: 500, data: [], message: err.message };
        }),
        getOltVlans(oltId).catch(err => {
          return { code: 500, data: [], message: err.message };
        }),
        getOdbs().catch(err => {
          return { code: 500, data: [], message: err.message };
        }),
        getZones().catch(err => {
          return { code: 500, data: [], message: err.message };
        }),
        getSpeedProfiles('download').catch(err => {
          return { code: 500, data: [], message: err.message };
        }),
        getSpeedProfiles('upload').catch(err => {
          return { code: 500, data: [], message: err.message };
        })
      ]);

      // Set OLT data
      if (oltResponse.code === 200) {
        setOltData(oltResponse.data);
      }

      // Set ONU types
      if (onuTypeResponse.code === 200 && onuTypeResponse.data) {
        const types = onuTypeResponse.data.map((type: any) => ({
          value: type.id,
          label: type.name,
        }));
        setOnuTypes(types);
      }

      // Set VLANs
      if (vlanResponse.code === 200 && vlanResponse.data) {
        const vlanList = vlanResponse.data.map((vlan: any) => ({
          value: vlan.id,
          label: `VLAN ${vlan.name}${vlan.description ? ' - ' + vlan.description : ''}`,
        }));
        setVlans(vlanList);
      }

      // Set ODBs
      if (odbResponse.code === 200 && odbResponse.data) {
        const odbList = odbResponse.data.map((odb: any) => ({
          value: odb.id,
          label: odb.name,
        }));
        setOdbs(odbList);
      }

      // Set Zones
      if (zoneResponse.code === 200 && zoneResponse.data) {
        const zoneList = zoneResponse.data.map((zone: any) => ({
          value: zone.id,
          label: zone.name,
        }));
        setZones(zoneList);
      }

      // Set Download Speed Profiles
      if (downloadSpeedResponse.code === 200 && downloadSpeedResponse.data) {
        const downloads = downloadSpeedResponse.data.map((profile: any) => ({
          value: profile.id,
          label: profile.name,
        }));
        setDownloadSpeeds(downloads);
      }

      // Set Upload Speed Profiles
      if (uploadSpeedResponse.code === 200 && uploadSpeedResponse.data) {
        const uploads = uploadSpeedResponse.data.map((profile: any) => ({
          value: profile.id,
          label: profile.name,
        }));
        setUploadSpeeds(uploads);
      }

      setLoading(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load form data');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.onu_type_id) {
      toast.error('Please select ONU type');
      return;
    }

    if (!formData.vlan_id) {
      toast.error('Please select User VLAN');
      return;
    }

    if (!formData.location_name) {
      toast.error('Please enter ONU name');
      return;
    }

    if (!formData.download_speed) {
      toast.error('Please select Download Speed');
      return;
    }

    if (!formData.upload_speed) {
      toast.error('Please select Upload Speed');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare payload - only send fields based on pon_type
      const payload: any = {
        olt_id: formData.olt_id,
        pon_type: formData.pon_type,
        board: formData.board,
        port: formData.port,
        serial_number: formData.sn, // Backend expects 'serial_number'
        onu_type_id: formData.onu_type_id,
        custom_profile: formData.custom_profile,
        mode: formData.mode,
        use_svlan: formData.use_svlan,
        tag_transform_mode: formData.tag_transform_mode,
        use_other_all_tls_vlan: formData.use_other_all_tls_vlan,
        use_cvlan: formData.use_cvlan,
        olt_vlan_id: formData.vlan_id, // Backend expects 'olt_vlan_id'
        download_speed_id: formData.download_speed, // Backend expects 'download_speed_id'
        upload_speed_id: formData.upload_speed, // Backend expects 'upload_speed_id'
        name: formData.location_name, // Backend expects 'name'
        description: formData.description,
        onu_external_id: formData.client_external_id, // Backend expects 'onu_external_id'
        geolocation: formData.geolocation,
      };

      // Add type-specific field based on pon_type
      if (formData.pon_type === 'gpon') {
        payload.gpon_type = formData.gpon_type;
      } else if (formData.pon_type === 'epon') {
        payload.epon_type = formData.epon_type;
      }

      // Add optional fields if they have values
      if (formData.custom_template_id) {
        payload.custom_template_id = formData.custom_template_id;
      }
      if (formData.svlan_id) {
        payload.svlan_id = formData.svlan_id;
      }
      if (formData.cvlan_id) {
        payload.cvlan_id = formData.cvlan_id;
      }
      if (formData.location_id) {
        payload.zone_id = formData.location_id; // Backend expects 'zone_id'
      }
      if (formData.odb_id) {
        payload.odb_id = formData.odb_id;
      }
      if (formData.odb_port) {
        payload.odb_port = formData.odb_port;
      }
      if (formData.latitude) {
        payload.latitude = formData.latitude;
      }
      if (formData.longitude) {
        payload.longitude = formData.longitude;
      }

      const response = await authorizeOnu(payload);

      if (response.code === 200) {
        toast.success('ONU authorized successfully');
        // Redirect to ONU details page using the ID from response
        if (response.data?.id) {
          router.push(routes.configured.details(response.data.id));
        } else {
          router.push(routes.unconfigured);
        }
      } else {
        toast.error(response.message || 'Failed to authorize ONU');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to authorize ONU');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader variant="spinner" size="xl" className="mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading form data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <div className="@container">
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OLT */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">OLT</label>
              <div className="md:col-span-2">
                <Input
                  value={oltData?.name || ''}
                  placeholder={oltData?.name ? '' : 'Loading...'}
                  disabled
                  className="w-full"
                />
              </div>
            </div>

            {/* PON Type */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">PON Type</label>
              <div className="md:col-span-2">
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="gpon"
                      checked={formData.pon_type === 'gpon'}
                      disabled
                      className="mr-2"
                    />
                    GPON
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="epon"
                      checked={formData.pon_type === 'epon'}
                      disabled
                      className="mr-2"
                    />
                    EPON
                  </label>
                </div>
              </div>
            </div>

            {/* Board */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">Board</label>
              <div className="md:col-span-2">
                <Input
                  value={formData.board}
                  disabled
                  className="w-full"
                />
              </div>
            </div>

            {/* Port */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">Port</label>
              <div className="md:col-span-2">
                <Input
                  value={formData.port}
                  disabled
                  className="w-full"
                />
              </div>
            </div>

            {/* SN */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">SN</label>
              <div className="md:col-span-2">
                <Input
                  value={formData.sn}
                  disabled
                  className="w-full font-mono"
                />
              </div>
            </div>

            {/* ONU Type */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">ONU Type *</label>
              <div className="md:col-span-2">
                <Select
                  options={onuTypes}
                  value={formData.onu_type_id ? Number(formData.onu_type_id) : null}
                  onChange={(value) => setFormData({ ...formData, onu_type_id: value ? value.toString() : '' })}
                  placeholder="Select ONU Type"
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: number) =>
                    onuTypes.find((type) => type.value === selected)?.label ?? ''
                  }
                  clearable
                  searchable
                />
              </div>
            </div>

            {/* ONU Mode */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">ONU Mode</label>
              <div className="md:col-span-2">
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="routing"
                      checked={formData.mode === 'routing'}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                      className="mr-2"
                    />
                    Routing
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="bridging"
                      checked={formData.mode === 'bridging'}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                      className="mr-2"
                    />
                    Bridging
                  </label>
                </div>
              </div>
            </div>

            {/* User VLAN */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">User VLAN-ID *</label>
              <div className="md:col-span-2">
                <Select
                  options={vlans}
                  value={formData.vlan_id ? Number(formData.vlan_id) : null}
                  onChange={(value) => setFormData({ ...formData, vlan_id: value ? value.toString() : '' })}
                  placeholder="Select VLAN"
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: number) =>
                    vlans.find((vlan) => vlan.value === selected)?.label ?? ''
                  }
                  clearable
                  searchable
                />
              </div>
            </div>

            {/* Zone */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">Zone</label>
              <div className="md:col-span-2">
                <Select
                  options={zones}
                  value={formData.location_id ? Number(formData.location_id) : null}
                  onChange={(value) => setFormData({ ...formData, location_id: value ? value.toString() : '' })}
                  placeholder="Select Zone"
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: number) =>
                    zones.find((zone) => zone.value === selected)?.label ?? ''
                  }
                  clearable
                  searchable
                />
              </div>
            </div>

            {/* ODB (Splitter) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">ODB (Splitter)</label>
              <div className="md:col-span-2">
                <Select
                  options={odbs}
                  value={formData.odb_id ? Number(formData.odb_id) : null}
                  onChange={(value) => setFormData({ ...formData, odb_id: value ? value.toString() : '' })}
                  placeholder="Select ODB"
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: number) =>
                    odbs.find((odb) => odb.value === selected)?.label ?? ''
                  }
                  clearable
                  searchable
                />
              </div>
            </div>

            {/* Download Speed */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">Download Speed</label>
              <div className="md:col-span-2">
                <Select
                  options={downloadSpeeds}
                  value={formData.download_speed ? Number(formData.download_speed) : null}
                  onChange={(value) => setFormData({ ...formData, download_speed: value ? value.toString() : '' })}
                  placeholder="Select Download Speed"
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: number) =>
                    downloadSpeeds.find((speed) => speed.value === selected)?.label ?? ''
                  }
                  clearable
                  searchable
                />
              </div>
            </div>

            {/* Upload Speed */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">Upload Speed</label>
              <div className="md:col-span-2">
                <Select
                  options={uploadSpeeds}
                  value={formData.upload_speed ? Number(formData.upload_speed) : null}
                  onChange={(value) => setFormData({ ...formData, upload_speed: value ? value.toString() : '' })}
                  placeholder="Select Upload Speed"
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: number) =>
                    uploadSpeeds.find((speed) => speed.value === selected)?.label ?? ''
                  }
                  clearable
                  searchable
                />
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">Name *</label>
              <div className="md:col-span-2">
                <Input
                  value={formData.location_name}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  placeholder="Enter ONU name"
                  className="w-full"
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">Address or Comment</label>
              <div className="md:col-span-2">
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Address or comment (optional)"
                  className="w-full"
                />
              </div>
            </div>

            {/* ONU External ID */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">ONU External ID</label>
              <div className="md:col-span-2">
                <Input
                  value={formData.client_external_id}
                  onChange={(e) => setFormData({ ...formData, client_external_id: e.target.value })}
                  placeholder="Use the unique ONU external ID with API or billing systems"
                  className="w-full"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-start gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(routes.unconfigured)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
