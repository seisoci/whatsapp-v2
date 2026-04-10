'use client';

import { useEffect, useState } from 'react';
import { Button, Loader, Title, Text, Checkbox } from 'rizzui';
import toast from 'react-hot-toast';
import { templateRolesApi } from '@/lib/api/template-roles';
import { rolesApi } from '@/lib/api/roles';
import type { RoleOption } from '.';

interface AssignRolesFormProps {
  templateId: string;
  templateName: string;
  wabaId: string;
  phoneNumberDbId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function AssignRolesForm({
  templateId,
  templateName,
  wabaId,
  phoneNumberDbId,
  onSuccess,
  onClose,
}: AssignRolesFormProps) {
  const [allRoles, setAllRoles] = useState<RoleOption[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rolesRes, currentRes] = await Promise.all([
          rolesApi.getAll({ limit: 100 }),
          templateRolesApi.getByTemplate(templateId, phoneNumberDbId),
        ]);

        if (rolesRes.success && rolesRes.data) {
          setAllRoles(rolesRes.data as unknown as RoleOption[]);
        }

        if (currentRes.success && Array.isArray(currentRes.data)) {
          setSelectedRoleIds(currentRes.data.map((r: any) => r.roleId));
        }
      } catch (error) {
        toast.error('Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [templateId, phoneNumberDbId]);

  const handleToggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await templateRolesApi.assign(templateId, {
        phoneNumberDbId,
        wabaId,
        templateName,
        roleIds: selectedRoleIds,
      });

      if (response.success) {
        toast.success('Akses role template berhasil diperbarui');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Gagal menyimpan');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader variant="spinner" size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title as="h4" className="mb-1 text-lg font-semibold">
        Kelola Akses Role
      </Title>
      <Text className="mb-5 text-sm text-gray-500">
        Template: <span className="font-medium text-gray-700">{templateName}</span>
      </Text>

      <div className="mb-6 space-y-3">
        {allRoles.length === 0 && (
          <Text className="text-sm text-gray-400">Tidak ada role tersedia</Text>
        )}
        {allRoles.map((role) => (
          <div
            key={role.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <Text className="text-sm font-medium text-gray-800">{role.name}</Text>
              <Text className="text-xs text-gray-400">{role.slug}</Text>
            </div>
            <Checkbox
              checked={selectedRoleIds.includes(role.id)}
              onChange={() => handleToggleRole(role.id)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Batal
        </Button>
        <Button onClick={handleSave} isLoading={saving}>
          Simpan
        </Button>
      </div>
    </div>
  );
}
