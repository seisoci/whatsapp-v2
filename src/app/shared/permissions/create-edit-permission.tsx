'use client';

import { useState, useEffect } from 'react';
import { PiXBold } from 'react-icons/pi';
import { SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Textarea, Select, Text } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { permissionsApi } from '@/lib/api/permissions';
import toast from 'react-hot-toast';
import { z } from 'zod';

const createPermissionSchema = z.object({
  menuManagerId: z.string().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  pathUrl: z.string().optional(),
  icon: z.string().optional(),
});

type CreatePermissionInput = z.infer<typeof createPermissionSchema>;

type CreateEditPermissionProps = {
  permission?: any;
  onSuccess?: () => void;
};

export default function CreateEditPermission({ permission, onSuccess }: CreateEditPermissionProps) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);
  const [menus, setMenus] = useState<any[]>([]);
  const isEdit = !!permission;

  // Fetch menus for dropdown
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        // TODO: Replace with actual menus API call
        // For now, use empty array or mock data
        setMenus([]);
      } catch (error) {
        console.error('Error fetching menus:', error);
      }
    };
    fetchMenus();
  }, []);

  const defaultValues = permission
    ? {
      menuManagerId: permission.menuManagerId,
      title: permission.menu?.title || '',
      slug: permission.menu?.slug || '',
      pathUrl: permission.menu?.pathUrl || '',
      icon: permission.menu?.icon || '',
    }
    : {
      menuManagerId: '',
      title: '',
      slug: '',
      pathUrl: '',
      icon: '',
    };

  const onSubmit: SubmitHandler<CreatePermissionInput> = async (data) => {
    setLoading(true);
    try {
      if (isEdit && permission.menuManagerId) {
        // Update menu manager and all related permissions using apiClient
        const response = await permissionsApi.update(permission.menuManagerId, {
          title: data.title,
          slug: data.slug,
          pathUrl: data.pathUrl,
          icon: data.icon,
        });

        if (response.success) {
          toast.success('Menu and permissions updated successfully');
          closeModal();
          onSuccess?.();
        } else {
          toast.error(response.message || 'Failed to update menu');
        }
      } else {
        // Create CRUD permissions
        const response = await permissionsApi.create({
          title: data.title,
          pathUrl: data.pathUrl,
          icon: data.icon,
          resource: data.slug,
          actions: ['index', 'store', 'update', 'destroy'],
        });

        if (response.success) {
          toast.success('Permissions created successfully');
          closeModal();
          onSuccess?.();
        } else {
          toast.error(response.message || 'Failed to create permissions');
        }
      }
    } catch (error: any) {
      console.error('Save permission error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${isEdit ? 'update' : 'create'} permission`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (value: string, onChange: any) => {
    onChange(value);
    // Auto-generate slug
    const slugValue = value.toLowerCase().replace(/\s+/g, '-');
    return slugValue;
  };

  return (
    <Form
      onSubmit= { onSubmit }
  validationSchema = { createPermissionSchema }
  useFormProps = {{
    defaultValues,
      }
}
className = "flex flex-grow flex-col gap-6 p-6 @container [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
  >
  {({ register, formState: { errors }, setValue, watch }) => {
  const titleValue = watch('title');

  return (
    <>
    <div className= "flex items-center justify-between" >
    <Title as="h4" className = "font-semibold" >
      { isEdit? 'Edit Permission': 'Add New Permission Menu' }
      </Title>
      < ActionIcon size = "sm" variant = "text" onClick = { closeModal } >
        <PiXBold className="h-auto w-5" />
          </ActionIcon>
          </div>

          < Input
  label = "Menu Title"
  placeholder = "e.g. User Management"
  {...register('title') }
  onChange = {(e) => {
    const value = e.target.value;
    setValue('title', value);
    // Auto-generate slug
    const slug = value.toLowerCase().replace(/\s+/g, '-');
    setValue('slug', slug);
  }
}
error = { errors.title?.message }
  />

  <Input
              label="Slug"
placeholder = "e.g. user-management"
{...register('slug') }
error = { errors.slug?.message }
helperText = "Will auto-generate 4 CRUD permissions: {slug}-index, {slug}-store, {slug}-update, {slug}-destroy"
  />

  <Input
              label="Path URL"
placeholder = "e.g. /users"
{...register('pathUrl') }
error = { errors.pathUrl?.message }
  />

  <Input
              label="Icon (optional)"
placeholder = "e.g. mdi-account"
{...register('icon') }
error = { errors.icon?.message }
  />

  <div className="rounded-md bg-blue-50 p-4" >
    <div className="text-sm text-blue-900" >
      <strong>Note: </strong> Creating this menu will automatically generate 4 CRUD permissions:
        < ul className = "mt-2 list-inside list-disc space-y-1" >
          <li>{ watch('slug') || 'slug'}-index(List) </li>
            < li > { watch('slug') || 'slug'}-store(Create) </li>
              < li > { watch('slug') || 'slug'}-update(Edit) </li>
                < li > { watch('slug') || 'slug'}-destroy(Delete) </li>
                  </ul>
                  </div>
                  </div>

                  < div className = "flex items-center justify-end gap-4" >
                    <Button
                variant="outline"
onClick = { closeModal }
className = "w-full @xl:w-auto"
  >
  Cancel
  </Button>
  < Button
type = "submit"
isLoading = { isLoading }
className = "w-full @xl:w-auto"
  >
  { isEdit? 'Update Permission': 'Create Permissions' }
  </Button>
  </div>
  </>
        );
      }}
</Form>
  );
}
