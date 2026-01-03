'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title } from 'rizzui';
import { CreateUserInput, UpdateUserInput, createUserSchema, updateUserSchema } from '@/validators/user.schema';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { usersApi } from '@/lib/api-client';
import toast from 'react-hot-toast';

type CreateEditUserProps = {
  user?: any;
  onSuccess?: () => void;
};

export default function CreateEditUser({ user, onSuccess }: CreateEditUserProps) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);
  const isEdit = !!user;

  const defaultValues = user
    ? {
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
      }
    : {
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
      };

  const onSubmit: SubmitHandler<CreateUserInput | UpdateUserInput> = async (data) => {
    try {
      setLoading(true);

      if (isEdit) {
        // Update user - backend expects username instead of name
        const updateData: any = {
          username: data.name,
          email: data.email,
        };

        // Only include password if it's not empty
        if (data.password && data.password.length > 0) {
          updateData.password = data.password;
        }

        const response = await usersApi.update(user.id, updateData);
        if (response.success) {
          toast.success(response.message || 'User updated successfully');
        } else {
          toast.error(response.message || 'Failed to update user');
        }
      } else {
        // Create user - backend expects username instead of name
        const response = await usersApi.create({
          username: data.name,
          email: data.email,
          password: data.password,
        });
        if (response.success) {
          toast.success(response.message || 'User created successfully');
        } else {
          toast.error(response.message || 'Failed to create user');
        }
      }

      closeModal();
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${isEdit ? 'update' : 'create'} user`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<CreateUserInput | UpdateUserInput>
      onSubmit={onSubmit}
      validationSchema={isEdit ? updateUserSchema : createUserSchema}
      useFormProps={{
        defaultValues,
      }}
      className="grid grid-cols-1 gap-6 p-6 @container [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, formState: { errors } }) => {
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                {isEdit ? 'Edit User' : 'Add a new User'}
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <Input
              label="Name"
              placeholder="Enter user's name"
              {...register('name')}
              className="col-span-full"
              error={errors.name?.message}
            />

            <Input
              label="Email"
              placeholder="Enter user's email address"
              type="email"
              className="col-span-full"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label={isEdit ? 'Password (leave blank to keep current)' : 'Password'}
              placeholder="Enter password (min. 8 characters)"
              type="password"
              className="col-span-full"
              {...register('password')}
              error={errors.password?.message}
            />

            <Input
              label={isEdit ? 'Confirm Password' : 'Confirm Password'}
              placeholder="Re-enter password"
              type="password"
              className="col-span-full"
              {...register('password_confirmation')}
              error={errors.password_confirmation?.message}
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
                {isEdit ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
