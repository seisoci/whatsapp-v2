'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Text, Select, Title, ActionIcon } from 'rizzui';
import { updateOnuLocationDetail, getZones, getOdbs } from '@/lib/sanctum-api';
import toast from 'react-hot-toast';
import { PiX } from 'react-icons/pi';

interface UpdateLocationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onuId: string;
  currentName: string;
  currentDescription: string;
  currentContact: string;
  currentZoneId?: number | string;
  currentOdbId?: number | string;
  currentOdbPort?: number | string;
  currentLatitude?: string;
  currentLongitude?: string;
  onSuccess?: () => void;
}

interface Zone {
  id: number;
  name: string;
}

interface Odb {
  id: number;
  name: string;
}

export default function UpdateLocationDetailModal({
  isOpen,
  onClose,
  onuId,
  currentName,
  currentDescription,
  currentContact,
  currentZoneId,
  currentOdbId,
  currentOdbPort,
  currentLatitude,
  currentLongitude,
  onSuccess
}: UpdateLocationDetailModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [odbId, setOdbId] = useState<string | null>(null);
  const [odbPort, setOdbPort] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [odbs, setOdbs] = useState<Odb[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingOdbs, setLoadingOdbs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Handle "None" string as empty
      setName(currentName && currentName !== 'None' ? currentName : '');
      setDescription(currentDescription && currentDescription !== 'None' ? currentDescription : '');
      setContact(currentContact && currentContact !== 'None' ? currentContact : '');
      setZoneId(currentZoneId ? String(currentZoneId) : null);
      setOdbId(currentOdbId ? String(currentOdbId) : null);
      setOdbPort(currentOdbPort ? String(currentOdbPort) : '');
      setLatitude(currentLatitude && currentLatitude !== 'None' ? currentLatitude : '');
      setLongitude(currentLongitude && currentLongitude !== 'None' ? currentLongitude : '');
      setError(null);

      // Fetch zones
      fetchZones();

      // Fetch ODBs if zone is pre-selected
      if (currentZoneId) {
        fetchOdbs(currentZoneId);
      }
    } else {
      // Reset state when modal closes
      setName('');
      setDescription('');
      setContact('');
      setZoneId(null);
      setOdbId(null);
      setOdbPort('');
      setLatitude('');
      setLongitude('');
      setZones([]);
      setOdbs([]);
      setError(null);
    }
  }, [isOpen, currentName, currentDescription, currentContact, currentZoneId, currentOdbId, currentOdbPort, currentLatitude, currentLongitude]);

  // Fetch ODBs when zone changes (but not on initial load)
  useEffect(() => {
    if (isOpen && zoneId && String(zoneId) !== String(currentZoneId)) {
      const selectedZoneId = typeof zoneId === 'object' && zoneId !== null && 'value' in zoneId
        ? (zoneId as any).value
        : zoneId;
      if (selectedZoneId) {
        fetchOdbs(selectedZoneId);
      }
      // Reset ODB selection when zone changes
      setOdbId(null);
      setOdbPort('');
    } else if (isOpen && !zoneId) {
      // Clear ODB list if no zone selected
      setOdbs([]);
      setOdbId(null);
      setOdbPort('');
    }
  }, [zoneId]);

  const fetchZones = async () => {
    try {
      setLoadingZones(true);
      const response = await getZones();
      if (response.code === 200) {
        setZones(response.data || []);
      }
    } catch (err) {
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchOdbs = async (zoneId?: string | number) => {
    try {
      setLoadingOdbs(true);
      const response = await getOdbs(zoneId);
      if (response.code === 200) {
        setOdbs(response.data || []);
      }
    } catch (err) {
    } finally {
      setLoadingOdbs(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!name.trim()) {
        setError('Please enter name');
        return;
      }

      // Validate latitude if provided
      if (latitude && !validateLatitude(latitude)) {
        setError('Invalid latitude format');
        return;
      }

      // Validate longitude if provided
      if (longitude && !validateLongitude(longitude)) {
        setError('Invalid longitude format');
        return;
      }

      const data: any = {
        location_name: name,
        description: description,
        contact: contact,
      };

      if (zoneId) data.zone_id = zoneId;
      if (odbId) data.odb_id = odbId;
      if (odbPort) data.odb_port = odbPort;
      if (latitude) data.latitude = latitude;
      if (longitude) data.longitude = longitude;

      const response = await updateOnuLocationDetail(onuId, data);

      if (response.code === 200) {
        toast.success(response.message || 'Location details updated successfully');
        onSuccess?.();
        onClose();
      } else {
        setError(response.message || 'Failed to update location details');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update location details');
      toast.error(err?.message || 'Failed to update location details');
    } finally {
      setLoading(false);
    }
  };

  const validateLatitude = (lat: string): boolean => {
    const pattern = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/;
    return pattern.test(lat);
  };

  const validateLongitude = (lon: string): boolean => {
    const pattern = /^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
    return pattern.test(lon);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="m-auto px-7 pt-6 pb-8">
        <div className="mb-7 flex items-center justify-between">
          <Title as="h3">Update Location Details</Title>
          <ActionIcon
            size="sm"
            variant="text"
            onClick={onClose}
          >
            <PiX className="h-auto w-6" />
          </ActionIcon>
        </div>

        {loadingZones ? (
          <div className="py-8 text-center">
            <Text className="text-sm text-gray-500">Loading...</Text>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-y-6 gap-x-5 [&_label>span]:font-medium">
            {/* Zone Select */}
            <Select
              label="Zone"
              value={zoneId}
              onChange={(val) => {
                // Extract value if it's an object
                const newValue = typeof val === 'object' && val !== null && 'value' in val
                  ? (val as any).value
                  : val;
                setZoneId(newValue);
              }}
              options={zones.map(zone => ({
                value: String(zone.id),
                label: zone.name
              }))}
              displayValue={(value) => {
                if (!value || zones.length === 0) return '';
                const zone = zones.find(z => String(z.id) === String(value));
                return zone?.name ?? String(value);
              }}
              placeholder={loadingZones ? "Loading zones..." : "Select zone"}
              disabled={loading || loadingZones}
              size="lg"
              searchable
              clearable
              onClear={() => setZoneId(null)}
            />

            {/* ODB Select */}
            <Select
              label="ODB (Splitter)"
              value={odbId}
              onChange={(val) => {
                // Extract value if it's an object
                const newValue = typeof val === 'object' && val !== null && 'value' in val
                  ? (val as any).value
                  : val;
                setOdbId(newValue);
              }}
              options={odbs.map(odb => ({
                value: String(odb.id),
                label: odb.name
              }))}
              displayValue={(value) => {
                if (!value || odbs.length === 0) return '';
                const odb = odbs.find(o => String(o.id) === String(value));
                return odb?.name ?? String(value);
              }}
              placeholder={
                loadingOdbs
                  ? "Loading ODBs..."
                  : !zoneId
                  ? "Select zone first"
                  : "Select ODB"
              }
              disabled={loading || loadingOdbs || !zoneId}
              size="lg"
              searchable
              clearable
              onClear={() => setOdbId(null)}
            />

            {/* ODB Port */}
            <Input
              label="ODB port"
              value={odbPort}
              onChange={(e) => setOdbPort(e.target.value)}
              placeholder="Enter ODB port"
              disabled={loading}
              type="number"
              inputClassName="border-2"
              size="lg"
            />

            {/* Name Input */}
            <Input
              label={<>Name <span className="text-red-500">*</span></>}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              disabled={loading}
              inputClassName="border-2"
              size="lg"
            />

            {/* Address or Comment Input */}
            <Input
              label="Address or comment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter address or comment"
              disabled={loading}
              inputClassName="border-2"
              size="lg"
              className="col-span-2"
            />

            {/* Contact Input */}
            <Input
              label="Contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Enter contact"
              disabled={loading}
              inputClassName="border-2"
              size="lg"
              className="col-span-2"
            />

            {/* Latitude Input */}
            <div>
              <Input
                label="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., -5.3971"
                disabled={loading}
                inputClassName="border-2"
                size="lg"
              />
              <Text className="mt-1 text-xs text-gray-500">
                Valid range: -90 to 90
              </Text>
            </div>

            {/* Longitude Input */}
            <div>
              <Input
                label="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., 105.2668"
                disabled={loading}
                inputClassName="border-2"
                size="lg"
              />
              <Text className="mt-1 text-xs text-gray-500">
                Valid range: -180 to 180
              </Text>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="col-span-2 mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
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
              disabled={loadingZones}
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
