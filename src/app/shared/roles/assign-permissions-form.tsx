'use client';

import { useState, useEffect } from 'react';
import { Button, Checkbox, Title, Text } from 'rizzui';

interface AssignPermissionsFormProps {
  role: any;
  allPermissions: any[];
  onSubmit: (selectedPermissionIds: string[]) => void;
}

export default function AssignPermissionsForm({
  role,
  allPermissions,
  onSubmit,
}: AssignPermissionsFormProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  // Initialize selected permissions from role
  useEffect(() => {
    if (role?.permissions) {
      const initialSelected = new Set(role.permissions.map((p: any) => p.id));
      setSelectedPermissions(initialSelected);
    }
  }, [role]);

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);

    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }

    setSelectedPermissions(newSelected);
  };

  const handleSubmit = () => {
    onSubmit(Array.from(selectedPermissions));
  };

  // Helper function to extract action name from permission
  const getActionName = (perm: any) => {
    // Try to get from slug first (e.g., "users-index" -> "index")
    if (perm.slug) {
      const parts = perm.slug.split('-');
      return parts[parts.length - 1];
    }
    // Fallback to name
    return perm.name?.split(' ')[0] || 'Action';
  };

  return (
    <div className= "rounded-lg border border-gray-300 bg-white" >
    {/* Header */ }
    < div className = "border-b border-gray-200 p-4" >
      <Title as="h5" className = "text-base font-semibold" >
        Assign Permissions: { role.name }
  </Title>
    < Text className = "text-xs text-gray-500 mt-1" >
      { selectedPermissions.size } permissions selected
        </Text>
        </div>

  {/* Table */ }
  <div className="overflow-x-auto" >
    <table className="w-full" >
      <thead>
      <tr className="border-b border-gray-200 bg-gray-50" >
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700" >
          Menu Name
            </th>
            < th className = "px-4 py-3 text-left text-xs font-semibold text-gray-700" colSpan = { allPermissions[0]?.permissions?.length || 0 } >
              Permissions
              </th>
              </tr>
              </thead>
              <tbody>
  {
    allPermissions.map((menu, menuIdx) => (
      <tr key= { menu.id } className = { menuIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
        <td className="px-4 py-3 border-b border-gray-200" >
          <div>
          <Text className="text-sm font-medium text-gray-900" >
            { menu.menu?.title || menu.title }
            </Text>
  {
    menu.menu?.pathUrl && (
      <Text className="text-xs text-gray-500" >
        { menu.menu.pathUrl }
        </Text>
                    )
  }
  </div>
    </td>
  {
    menu.permissions?.map((permission: any) => (
      <td key= { permission.id } className = "px-3 py-3 border-b border-gray-200" >
      <Checkbox
                      checked={ selectedPermissions.has(permission.id) }
                      onChange = {() => handlePermissionToggle(permission.id)}
  label = {
                        < span className = "text-sm text-gray-700 capitalize" >
    { getActionName(permission) }
    </span>
}
                    />
  </td>
                ))}
</tr>
            ))}
</tbody>
  </table>

{
  allPermissions.length === 0 && (
    <div className="py-12 text-center" >
      <Text className="text-sm text-gray-500" > No permissions available </Text>
        </div>
        )
}
</div>

{/* Footer */ }
<div className="border-t border-gray-200 p-4 flex justify-end" >
  <Button onClick={ handleSubmit } size = "sm" >
    Update Permissions
      </Button>
      </div>
      </div>
  );
}
