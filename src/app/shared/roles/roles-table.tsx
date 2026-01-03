'use client';

import { useEffect, useState } from 'react';
import { rolesApi } from '@/lib/api-client';
import { Loader, Title, ActionIcon } from 'rizzui';
import { PiPencilSimple, PiTrash } from 'react-icons/pi';
import toast from 'react-hot-toast';
import { useModal } from '@/app/shared/modal-views/use-modal';
import EditRole from '@/app/shared/roles-permissions/edit-role';

interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  permissions?: any[];
}

export default function RolesTable() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const { openModal } = useModal();

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesApi.getAll();

      if (response.success && response.data) {
        setRoles(Array.isArray(response.data) ? response.data : []);
      } else {
        toast.error('Failed to load roles');
        setRoles([]);
      }
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles from backend');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    openModal({
      view: <EditRole />,
      customSize: 800,
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete role "${name}"?`)) {
      try {
        const response = await rolesApi.delete(id);
        if (response.success) {
          toast.success('Role deleted successfully');
          fetchRoles();
        } else {
          toast.error(response.message || 'Failed to delete role');
        }
      } catch (error: any) {
        console.error('Error deleting role:', error);
        toast.error(error.message || 'Failed to delete role');
      }
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <Title as="h4" className="mb-2 text-gray-900">
          No roles found
        </Title>
        <p className="text-sm text-gray-500">
          Start by creating your first role
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {role.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {role.slug}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {role.description || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(role.createdAt).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <ActionIcon
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(role)}
                      title="Edit role"
                    >
                      <PiPencilSimple className="h-4 w-4" />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(role.id, role.name)}
                      title="Delete role"
                      className="hover:border-red-500 hover:text-red-500"
                    >
                      <PiTrash className="h-4 w-4" />
                    </ActionIcon>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
