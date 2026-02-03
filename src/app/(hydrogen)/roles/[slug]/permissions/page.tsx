'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Title, Loader } from 'rizzui';
import PageHeader from '@/app/shared/page-header';
import { rolesApi } from '@/lib/api/roles';
import { permissionsApi } from '@/lib/api/permissions';
import toast from 'react-hot-toast';
import AssignPermissionsForm from '@/app/shared/roles/assign-permissions-form';

export default function AssignPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.slug as string;

  const [role, setRole] = useState<any>(null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch role with current permissions
        const roleResponse = await rolesApi.getById(roleId);
        if (roleResponse.success) {
          setRole(roleResponse.data);
        }

        // Fetch all available permissions grouped by menu
        const permissionsResponse = await permissionsApi.getAll({});

        if (permissionsResponse.success) {
          setAllPermissions(permissionsResponse.data);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load permissions data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roleId]);

  const handleSubmit = async (selectedPermissionIds: string[]) => {
    try {
      const response = await rolesApi.assignPermissions(roleId, {
        permissionIds: selectedPermissionIds,
      });

      if (response.success) {
        toast.success('Permissions updated successfully');
        router.push('/roles');
      } else {
        toast.error(response.message || 'Failed to update permissions');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update permissions';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className= "flex min-h-[400px] items-center justify-center" >
      <Loader variant="spinner" size="lg" />
        </div>
    );
  }

  if (!role) {
    return (
      <div className= "flex min-h-[400px] items-center justify-center" >
      <Title>Role not found </Title>
        </div>
    );
  }

  const pageHeader = {
    title: `Assign Permissions: ${role.name}`,
    breadcrumb: [
      {
        href: '/roles',
        name: 'Roles',
      },
      {
        name: 'Assign Permissions',
      },
    ],
  };

  return (
    <>
    <PageHeader title= { pageHeader.title } breadcrumb = { pageHeader.breadcrumb } >
      <div className="mt-4 flex items-center gap-3 @lg:mt-0" >
        <Button
            variant="outline"
  onClick = {() => router.push('/roles')
}
          >
  Cancel
  </Button>
  </div>
  </PageHeader>

  < div className = "@container" >
    <div className="grid gap-6 @4xl:gap-7" >
      <AssignPermissionsForm
            role={ role }
allPermissions = { allPermissions }
onSubmit = { handleSubmit }
  />
  </div>
  </div>
  </>
  );
}
