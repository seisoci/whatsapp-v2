'use client';

import { useState, useEffect } from 'react';
import { PiXBold } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Select } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { usersApi, rolesApi } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { z } from 'zod';

const editUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  roleId: z.string().min(1, 'Role is required'),
  isActive: z.string().optional(),
});

type EditUserInput = z.infer<typeof editUserSchema>;

interface EditUserProps {
  user: {
    id: string;
    username: string;
    email: string;
    isActive: boolean;
    role?: {
      id: string;
      name: string;
    };
  };
  onSuccess?: () => void;
}

export default function EditUser({ user, onSuccess }: EditUserProps) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await rolesApi.getAll();
      if (response.success && response.data) {
        const roleOptions = response.data.map((role: any) => ({
          label: role.name,
          value: role.id,
        }));
        setRoles(roleOptions);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const onSubmit: SubmitHandler<EditUserInput> = async (data) => {
    setLoading(true);
    try {
      const response = await usersApi.update(user.id, {
        username: data.username,
        email: data.email,
        roleId: parseInt(data.roleId),
        isActive: data.isActive === 'active',
      });

      if (response.success) {
        toast.success('User updated successfully');
        closeModal();
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <Form<EditUserInput>
      onSubmit={onSubmit}
      validationSchema={editUserSchema}
      useFormProps={{
        defaultValues: {
          username: user.username,
          email: user.email,
          roleId: user.role?.id || '',
          isActive: user.isActive ? 'active' : 'inactive',
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container md:grid-cols-2 [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, control, formState: { errors } }) => {
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                Edit User
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <Input
              label="Username"
              placeholder="Enter username"
              {...register('username')}
              className="col-span-full"
              error={errors.username?.message}
            />

            <Input
              label="Email"
              placeholder="Enter email address"
              className="col-span-full"
              {...register('email')}
              error={errors.email?.message}
            />

            <Controller
              name="roleId"
              control={control}
              render={({ field: { name, onChange, value } }) => (
                <Select
                  options={roles}
                  value={value}
                  onChange={onChange}
                  name={name}
                  label="Role"
                  className="col-span-full"
                  error={errors?.roleId?.message}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: string) =>
                    roles.find((option) => option.value === selected)?.label ??
                    ''
                  }
                  dropdownClassName="!z-[1]"
                  inPortal={false}
                />
              )}
            />

            <Controller
              name="isActive"
              control={control}
              render={({ field: { name, onChange, value } }) => (
                <Select
                  options={statusOptions}
                  value={value}
                  onChange={onChange}
                  name={name}
                  label="Status"
                  className="col-span-full"
                  error={errors?.isActive?.message}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: string) =>
                    statusOptions.find((option) => option.value === selected)
                      ?.label ?? ''
                  }
                  dropdownClassName="!z-[1] h-auto"
                  inPortal={false}
                />
              )}
            />

            <div className="col-span-full flex items-center justify-end gap-4">
              <Button
                variant="outline"
                onClick={closeModal}
                className="w-full @xl:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full @xl:w-auto"
              >
                Update User
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
