'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title } from 'rizzui';
import { CreateUserInput, UpdateUserInput, createUserSchema, updateUserSchema } from '@/validators/user.schema';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { createUser, updateUser } from '@/lib/sanctum-api';
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
        // Update user
        const updateData: any = {
          name: data.name,
          email: data.email,
        };

        // Only include password if it's not empty
        if (data.password && data.password.length > 0) {
          updateData.password = data.password;
          updateData.password_confirmation = data.password_confirmation;
        }

        await updateUser(user.id, updateData);
        toast.success('User updated successfully');
      } else {
        // Create user
        await createUser({
          name: data.name,
          email: data.email,
          password: data.password,
          password_confirmation: (data as CreateUserInput).password_confirmation,
        });
        toast.success('User created successfully');
      }

      closeModal();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || `Failed to ${isEdit ? 'update' : 'create'} user`);
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
