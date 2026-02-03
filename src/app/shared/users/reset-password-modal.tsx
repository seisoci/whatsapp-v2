'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Password, Button, ActionIcon, Title, Text } from 'rizzui';
import { z } from 'zod';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { usersApi } from '@/lib/api/users';
import toast from 'react-hot-toast';

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z.string().min(8, { message: 'Password confirmation must be at least 8 characters' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

type ResetPasswordModalProps = {
  user: any;
  onSuccess?: () => void;
};

export default function ResetPasswordModal({ user, onSuccess }: ResetPasswordModalProps) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);

  const onSubmit: SubmitHandler<ResetPasswordInput> = async (data) => {
    try {
      setLoading(true);

      const response = await usersApi.resetPassword(user.id, data.newPassword);

      if (response.success) {
        toast.success(response.message || 'Password reset successfully');
        closeModal();
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to reset password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<ResetPasswordInput>
      onSubmit={onSubmit}
      validationSchema={resetPasswordSchema}
      useFormProps={{
        defaultValues: {
          newPassword: '',
          confirmPassword: '',
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, formState: { errors } }) => {
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <div>
                <Title as="h4" className="font-semibold">
                  Reset Password
                </Title>
                <Text className="mt-1 text-sm text-gray-500">
                  Reset password for <strong>{user.username || user.email}</strong>
                </Text>
              </div>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <Password
              label="New Password"
              placeholder="Enter new password (min. 8 characters)"
              className="col-span-full"
              {...register('newPassword')}
              error={errors.newPassword?.message}
            />

            <Password
              label="Confirm New Password"
              placeholder="Re-enter new password"
              className="col-span-full"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <div className="col-span-full flex items-center justify-end gap-4">
              <Button variant="outline" onClick={closeModal} className="w-full @xl:w-auto">
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading} className="w-full @xl:w-auto">
                Reset Password
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
