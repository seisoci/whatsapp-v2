'use client';

import { useState, useEffect } from 'react';
import { PiXBold, PiPhoneDuotone } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Select, Text, Checkbox } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { usersApi } from '@/lib/api/users';
import { rolesApi } from '@/lib/api/roles';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
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
      slug?: string;
    };
    phoneNumbers?: Array<{ id: string; name?: string | null; displayPhoneNumber?: string | null }>;
  };
  onSuccess?: () => void;
}

export default function EditUser({ user, onSuccess }: EditUserProps) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);
  const [isPhoneLoading, setPhoneLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [allPhoneNumbers, setAllPhoneNumbers] = useState<any[]>([]);
  const [selectedPhoneIds, setSelectedPhoneIds] = useState<Set<string>>(
    new Set(user.phoneNumbers?.map((p) => p.id) ?? [])
  );

  const isSuperAdmin = user.role?.slug === 'super-admin' || user.role?.id === '1';

  useEffect(() => {
    fetchRoles();
    if (!isSuperAdmin) {
      fetchPhoneNumbers();
      fetchUserPhoneNumbers();
    }
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await rolesApi.getAll();
      if (response.success && response.data) {
        const roleOptions = (response.data as unknown as any[]).map((role: any) => ({
          label: role.name,
          value: role.id,
          slug: role.slug,
        }));
        setRoles(roleOptions);
      }
    } catch {
      toast.error('Failed to load roles');
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const response = await phoneNumbersApi.getAll();
      if (response.success && response.data) {
        const allNums = response.data as unknown as any[];
        setAllPhoneNumbers(allNums.filter((pn: any) => !pn.isHidden));
      }
    } catch {
      toast.error('Failed to load phone numbers');
    }
  };

  const fetchUserPhoneNumbers = async () => {
    try {
      const response = await usersApi.getById(user.id);
      if (response.success && response.data) {
        const userData = response.data as any;
        setSelectedPhoneIds(new Set((userData.phoneNumbers ?? []).map((p: any) => p.id)));
      }
    } catch {
      // ignore — default to passed props
    }
  };

  const handlePhoneToggle = (phoneId: string) => {
    setSelectedPhoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(phoneId)) {
        next.delete(phoneId);
      } else {
        next.add(phoneId);
      }
      return next;
    });
  };

  const handleSavePhoneNumbers = async () => {
    setPhoneLoading(true);
    try {
      const response = await usersApi.assignPhoneNumbers(user.id, [...selectedPhoneIds]);
      if (response.success) {
        toast.success('Phone numbers updated');
      } else {
        toast.error(response.message || 'Failed to update phone numbers');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update phone numbers');
    } finally {
      setPhoneLoading(false);
    }
  };

  const onSubmit: SubmitHandler<EditUserInput> = async (data) => {
    setLoading(true);
    try {
      const response = await usersApi.update(user.id, {
        username: data.username,
        email: data.email,
        roleId: Number(data.roleId),
        isActive: data.isActive === 'active',
      });

      if (response.success) {
        toast.success(response.message || 'User updated successfully');
        closeModal();
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to update user');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to update user');
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
      className="@container grid grid-cols-1 gap-6 p-6 md:grid-cols-2 [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, control, watch, formState: { errors } }) => {
        const watchedRoleId = watch('roleId');
        const selectedRole = roles.find((r) => r.value === watchedRoleId);
        const showPhoneSection = selectedRole?.slug !== 'super-admin' && !isSuperAdmin;

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
                    roles.find((option) => option.value === selected)?.label ?? ''
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
                    statusOptions.find((option) => option.value === selected)?.label ?? ''
                  }
                  dropdownClassName="!z-[1] h-auto"
                  inPortal={false}
                />
              )}
            />

            {showPhoneSection && (
              <div className="col-span-full rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <PiPhoneDuotone className="h-5 w-5 text-primary" />
                  <Text className="font-medium text-gray-900">Phone Numbers Access</Text>
                </div>
                {allPhoneNumbers.length === 0 ? (
                  <Text className="text-sm text-gray-500">No phone numbers available.</Text>
                ) : (
                  <div className="space-y-2">
                    {allPhoneNumbers.map((phone: any) => (
                      <label
                        key={phone.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={selectedPhoneIds.has(phone.id)}
                          onChange={() => handlePhoneToggle(phone.id)}
                        />
                        <div>
                          <Text className="text-sm font-medium text-gray-800">
                            {phone.name || phone.verifiedName || 'Unnamed'}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {phone.displayPhoneNumber || phone.phoneNumberId}
                          </Text>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={isPhoneLoading}
                    onClick={handleSavePhoneNumbers}
                    type="button"
                  >
                    Save Phone Numbers
                  </Button>
                </div>
              </div>
            )}

            {isSuperAdmin && (
              <div className="col-span-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <Text className="text-sm text-blue-700">
                  Super Admin memiliki akses ke semua nomor telepon secara otomatis.
                </Text>
              </div>
            )}

            <div className="col-span-full flex items-center justify-end gap-4">
              <Button variant="outline" onClick={closeModal} className="w-full @xl:w-auto">
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading} className="w-full @xl:w-auto">
                Update User
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
