'use client';

import { useEffect, useState, use } from 'react';
import { getOltVlans, deleteVlan, createVlan, createMultipleVlans, deleteMultipleVlans } from '@/lib/sanctum-api';
import { Vlan } from '@/types/olt';
import { Loader, Button, Input, Text, Switch, Title, ActionIcon, Radio, Tooltip, Popover } from 'rizzui';
import toast from 'react-hot-toast';
import { routes } from '@/config/routes';
import Link from 'next/link';
import { PiXBold, PiTrashBold } from 'react-icons/pi';
import { useModal } from '@/app/shared/modal-views/use-modal';

// Delete VLAN Popover Component
function DeleteVlanPopover({
  vlanId,
  vlanName,
  oltId,
  onSuccess,
}: {
  vlanId: number;
  vlanName: string;
  oltId: string;
  onSuccess?: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (setOpen: (open: boolean) => void) => {
    setIsDeleting(true);
    try {
      await deleteVlan(oltId, vlanId);
      toast.success('VLAN deleted successfully');
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete VLAN');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Popover placement="left">
      <Popover.Trigger>
        <ActionIcon
          size="sm"
          variant="outline"
          aria-label="Delete VLAN"
          className="hover:bg-red-50 hover:border-red-200 cursor-pointer"
        >
          <PiTrashBold className="h-4 w-4" />
        </ActionIcon>
      </Popover.Trigger>
      <Popover.Content className="z-10">
        {({ setOpen }) => (
          <div className="w-56 pb-2 pt-1 text-left">
            <Title
              as="h6"
              className="mb-0.5 flex items-start text-sm text-gray-700"
            >
              <PiTrashBold className="me-1 h-[17px] w-[17px]" /> Delete VLAN
            </Title>
            <Text className="mb-2 leading-relaxed text-gray-500">
              Are you sure you want to delete VLAN <strong>{vlanName}</strong>?
            </Text>
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() => setOpen(false)}
                disabled={isDeleting}
              >
                No
              </Button>
              <Button
                size="sm"
                color="danger"
                className="h-7"
                onClick={() => handleDelete(setOpen)}
                isLoading={isDeleting}
              >
                Yes
              </Button>
            </div>
          </div>
        )}
      </Popover.Content>
    </Popover>
  );
}

// Add VLAN Modal Component
function AddVlanModal({ oltId, onSuccess }: { oltId: string; onSuccess: () => void }) {
  const { closeModal } = useModal();
  const [formData, setFormData] = useState({
    olt_id: oltId,
    name: '',
    description: '',
    for_iptv: false,
    for_mgmt_voip: false,
    dhcp_snooping: false,
    lan_to_lan: false,
  });

  const handleSubmit = async () => {
    try {
      await createVlan(oltId, formData);
      toast.success('VLAN added successfully');
      closeModal();
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add VLAN');
    }
  };

  return (
    <div className="m-auto px-7 pt-6 pb-8">
      <div className="mb-7 flex items-center justify-between">
        <Title as="h3" className="font-semibold">
          Add VLAN
        </Title>
        <ActionIcon size="sm" variant="text" onClick={closeModal}>
          <PiXBold className="h-auto w-5" />
        </ActionIcon>
      </div>
      <div className="grid grid-cols-1 gap-6 @container md:grid-cols-2 [&_label>span]:font-medium">
        <div className="col-span-full md:col-span-1">
          <Input
            label="VLAN ID"
            type="number"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter VLAN ID"
          />
        </div>

        <div className="col-span-full md:col-span-1">
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description"
          />
        </div>

        <div className="col-span-full space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mt-2">
          <div>
            <Title as="h6" className="mb-3 text-sm font-medium">
              Used for IPTV
            </Title>
            <div className="flex gap-6">
              <Radio
                label="Yes"
                value="true"
                checked={formData.for_iptv === true}
                onChange={() => setFormData({ ...formData, for_iptv: true })}
              />
              <Radio
                label="No"
                value="false"
                checked={formData.for_iptv === false}
                onChange={() => setFormData({ ...formData, for_iptv: false })}
              />
            </div>
          </div>

          <div>
            <Title as="h6" className="mb-3 text-sm font-medium">
              Used for Mgmt/VoIP
            </Title>
            <div className="flex gap-6">
              <Radio
                label="Yes"
                value="true"
                checked={formData.for_mgmt_voip === true}
                onChange={() => setFormData({ ...formData, for_mgmt_voip: true })}
              />
              <Radio
                label="No"
                value="false"
                checked={formData.for_mgmt_voip === false}
                onChange={() => setFormData({ ...formData, for_mgmt_voip: false })}
              />
            </div>
          </div>

          <div>
            <Title as="h6" className="mb-3 text-sm font-medium">
              DHCP Snooping
            </Title>
            <div className="flex gap-6">
              <Radio
                label="Yes"
                value="true"
                checked={formData.dhcp_snooping === true}
                onChange={() => setFormData({ ...formData, dhcp_snooping: true })}
              />
              <Radio
                label="No"
                value="false"
                checked={formData.dhcp_snooping === false}
                onChange={() => setFormData({ ...formData, dhcp_snooping: false })}
              />
            </div>
          </div>

          <div>
            <Title as="h6" className="mb-3 text-sm font-medium">
              LAN to LAN
            </Title>
            <div className="flex gap-6">
              <Radio
                label="Yes"
                value="true"
                checked={formData.lan_to_lan === true}
                onChange={() => setFormData({ ...formData, lan_to_lan: true })}
              />
              <Radio
                label="No"
                value="false"
                checked={formData.lan_to_lan === false}
                onChange={() => setFormData({ ...formData, lan_to_lan: false })}
              />
            </div>
          </div>
        </div>

        <div className="col-span-full flex items-center justify-end gap-4 mt-2">
          <Button
            variant="outline"
            onClick={closeModal}
            className="w-full @xl:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="w-full @xl:w-auto"
          >
            Add VLAN
          </Button>
        </div>
      </div>
    </div>
  );
}

// Add Multiple VLANs Modal Component
function AddMultipleVlansModal({ oltId, onSuccess }: { oltId: string; onSuccess: () => void }) {
  const { closeModal } = useModal();
  const [multipleVlansStart, setMultipleVlansStart] = useState('');
  const [multipleVlansEnd, setMultipleVlansEnd] = useState('');

  const handleSubmit = async () => {
    if (!multipleVlansStart || !multipleVlansEnd) {
      toast.error('Please enter both start and end VLAN IDs');
      return;
    }

    try {
      const vlanRange = `${multipleVlansStart}-${multipleVlansEnd}`;
      await createMultipleVlans(oltId, vlanRange);
      toast.success('VLANs added successfully');
      closeModal();
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add VLANs');
    }
  };

  return (
    <div className="m-auto px-7 pt-6 pb-8">
      <div className="mb-7 flex items-center justify-between">
        <Title as="h3" className="font-semibold">
          Add Multiple VLANs
        </Title>
        <ActionIcon size="sm" variant="text" onClick={closeModal}>
          <PiXBold className="h-auto w-5" />
        </ActionIcon>
      </div>
      <div className="grid grid-cols-1 gap-6 @container md:grid-cols-2 [&_label>span]:font-medium">
        <div className="col-span-full md:col-span-1">
          <Input
            label="Start VLAN ID"
            type="number"
            value={multipleVlansStart}
            onChange={(e) => setMultipleVlansStart(e.target.value)}
            placeholder="e.g., 100"
          />
        </div>

        <div className="col-span-full md:col-span-1">
          <Input
            label="End VLAN ID"
            type="number"
            value={multipleVlansEnd}
            onChange={(e) => setMultipleVlansEnd(e.target.value)}
            placeholder="e.g., 200"
          />
        </div>

        <div className="col-span-full flex items-center justify-end gap-4 mt-2">
          <Button
            variant="outline"
            onClick={closeModal}
            className="w-full @xl:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="w-full @xl:w-auto"
          >
            Add VLANs
          </Button>
        </div>
      </div>
    </div>
  );
}

// Delete Multiple VLANs Modal Component
function DeleteMultipleVlansModal({ oltId, onSuccess }: { oltId: string; onSuccess: () => void }) {
  const { closeModal } = useModal();
  const [deleteVlansStart, setDeleteVlansStart] = useState('');
  const [deleteVlansEnd, setDeleteVlansEnd] = useState('');

  const handleSubmit = async () => {
    if (!deleteVlansStart || !deleteVlansEnd) {
      toast.error('Please enter both start and end VLAN IDs');
      return;
    }

    try {
      const vlanRange = `${deleteVlansStart}-${deleteVlansEnd}`;
      await deleteMultipleVlans(oltId, vlanRange);
      toast.success('VLANs deleted successfully');
      closeModal();
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete VLANs');
    }
  };

  return (
    <div className="m-auto px-7 pt-6 pb-8">
      <div className="mb-7 flex items-center justify-between">
        <Title as="h3" className="font-semibold">
          Delete Multiple VLANs
        </Title>
        <ActionIcon size="sm" variant="text" onClick={closeModal}>
          <PiXBold className="h-auto w-5" />
        </ActionIcon>
      </div>
      <div className="grid grid-cols-1 gap-6 @container md:grid-cols-2 [&_label>span]:font-medium">
        <div className="col-span-full md:col-span-1">
          <Input
            label="Start VLAN ID"
            type="number"
            value={deleteVlansStart}
            onChange={(e) => setDeleteVlansStart(e.target.value)}
            placeholder="e.g., 100"
          />
        </div>

        <div className="col-span-full md:col-span-1">
          <Input
            label="End VLAN ID"
            type="number"
            value={deleteVlansEnd}
            onChange={(e) => setDeleteVlansEnd(e.target.value)}
            placeholder="e.g., 200"
          />
        </div>

        <div className="col-span-full flex items-center justify-end gap-4 mt-2">
          <Button
            variant="outline"
            onClick={closeModal}
            className="w-full @xl:w-auto"
          >
            Cancel
          </Button>
          <Button
            className="w-full @xl:w-auto bg-red-600 hover:bg-red-700"
            onClick={handleSubmit}
          >
            Delete VLANs
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OltVlansPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { openModal } = useModal();
  const [vlans, setVlans] = useState<Vlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof Vlan>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchVlans = async () => {
    try {
      setLoading(true);
      const response = await getOltVlans(resolvedParams.id);

      if (response.data) {
        setVlans(response.data);
      } else {
        toast.error('Failed to load VLANs');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load VLANs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVlans();
  }, [resolvedParams.id]);

  const handleSort = (column: keyof Vlan) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedVlans = [...vlans].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return sortOrder === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  if (loading) {
    return (
      <div className="mt-6 flex min-h-[400px] items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          onClick={() => openModal({
            view: <AddVlanModal oltId={resolvedParams.id} onSuccess={fetchVlans} />,
            size: 'xl',
          })}
        >
          <span className="mr-1">+</span> Add VLAN
        </Button>
        <Button
          onClick={() => openModal({
            view: <AddMultipleVlansModal oltId={resolvedParams.id} onSuccess={fetchVlans} />,
            size: 'xl',
          })}
        >
          <span className="mr-1">+</span> Add multiple VLANs
        </Button>
        <Button
          onClick={() => openModal({
            view: <DeleteMultipleVlansModal oltId={resolvedParams.id} onSuccess={fetchVlans} />,
            size: 'xl',
          })}
          variant="outline"
        >
          <span className="mr-1">-</span> Delete multiple VLANs
        </Button>
      </div>

      <div className="mb-4">
        <Text className="text-sm text-gray-600">
          VLANs added here will not be applied to the Uplink ports automatically.{' '}
          <span>
            Go to <Link href={routes.olt.uplinks(resolvedParams.id)} className="text-blue-600 hover:underline">Uplink</Link> and tag the VLANs on the interfaces you want.
          </span>
        </Text>
      </div>

      <div className="rounded-lg border border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {vlans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <button
                      onClick={() => handleSort('name')}
                      className="hover:text-blue-600"
                    >
                      VLAN-ID {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Default for</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <button
                      onClick={() => handleSort('description')}
                      className="hover:text-blue-600"
                    >
                      Description {sortBy === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <button
                      onClick={() => handleSort('for_iptv')}
                      className="hover:text-blue-600"
                    >
                      Used for IPTV {sortBy === 'for_iptv' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <button
                      onClick={() => handleSort('for_mgmt_voip')}
                      className="hover:text-blue-600"
                    >
                      Used for Mgmt/VoIP {sortBy === 'for_mgmt_voip' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <button
                      onClick={() => handleSort('dhcp_snooping')}
                      className="hover:text-blue-600"
                    >
                      DHCP Snooping {sortBy === 'dhcp_snooping' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <button
                      onClick={() => handleSort('lan_to_lan')}
                      className="hover:text-blue-600"
                    >
                      LAN to LAN {sortBy === 'lan_to_lan' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <button
                      onClick={() => handleSort('onus_count')}
                      className="hover:text-blue-600"
                    >
                      ONUs {sortBy === 'onus_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedVlans.map((vlan) => (
                  <tr
                    key={vlan.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-blue-600">{vlan.name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{vlan.default_for || ''}</td>
                    <td className="px-4 py-3 text-sm">{vlan.description || '-'}</td>
                    <td className="px-4 py-3">
                      <input type="checkbox" disabled checked={vlan.for_iptv || false} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="checkbox" disabled checked={vlan.for_mgmt_voip || false} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="checkbox" disabled checked={vlan.dhcp_snooping || false} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="checkbox" disabled checked={vlan.lan_to_lan || false} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium">{vlan.onus_count || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip content="Delete VLAN" placement="top">
                        <DeleteVlanPopover
                          vlanId={vlan.id}
                          vlanName={vlan.name}
                          oltId={resolvedParams.id}
                          onSuccess={fetchVlans}
                        />
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center">
            <Text className="text-gray-500">No VLANs data available</Text>
          </div>
        )}
      </div>
    </div>
  );
}
