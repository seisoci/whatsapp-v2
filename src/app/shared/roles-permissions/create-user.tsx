'use client';

import { useState, useEffect } from 'react';
import { PiXBold } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Select, Password } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { usersApi } from '@/lib/api/users';
import { rolesApi } from '@/lib/api/roles';
import toast from 'react-hot-toast';
import { z } from 'zod';

const createUserSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password confirmation must be at least 8 characters'),
    roleId: z.string().min(1, 'Role is required'),
    isActive: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type CreateUserInput = z.infer<typeof createUserSchema>;

export default function CreateUser({ onSuccess }: { onSuccess?: () => void }) {
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

  const onSubmit: SubmitHandler<CreateUserInput> = async (data) => {
    setLoading(true);
    try {
      const response = await usersApi.create({
        username: data.username,
        email: data.email,
        password: data.password,
        roleId: parseInt(data.roleId),
        isActive: data.isActive === 'active',
        emailVerified: true,
      });

      if (response.success) {
        toast.success('User created successfully');
        closeModal();
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Create user error:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <Form<CreateUserInput>
      onSubmit={onSubmit}
      validationSchema={createUserSchema}
      useFormProps={{
        defaultValues: {
          isActive: 'active',
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container md:grid-cols-2 [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, control, formState: { errors } }) => {
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                Add a new User
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

            <Password
              label="Password"
              placeholder="Enter password (min. 8 characters)"
              className="col-span-full"
              {...register('password')}
              error={errors.password?.message}
            />

            <Password
              label="Confirm Password"
              placeholder="Re-enter password"
              className="col-span-full"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
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
                Create User
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
