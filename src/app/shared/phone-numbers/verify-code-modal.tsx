'use client';

import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Button, Input, Text } from 'rizzui';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
import { PhoneNumber } from './index';
import toast from 'react-hot-toast';

const verifyCodeSchema = z.object({
  code: z.string().min(6, 'Code must be at least 6 characters').max(8, 'Code must be at most 8 characters'),
});

type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

interface VerifyCodeModalProps {
  phoneNumber: PhoneNumber;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function VerifyCodeModal({
  phoneNumber,
  onSuccess,
  onClose,
}: VerifyCodeModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeInput>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: '',
    },
  });

  const onSubmit: SubmitHandler<VerifyCodeInput> = async (data) => {
    setIsLoading(true);
    try {
      const response = await phoneNumbersApi.verifyCode(phoneNumber.id, {
        code: data.code,
      });

      if (response.success) {
        toast.success('Phone number verified successfully!');
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(response.message || 'Failed to verify code');
      }
    } catch (error: any) {
      console.error('Verify code error:', error);
      toast.error(error.response?.data?.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="m-auto p-6">
      <Text className="mb-6 text-lg font-semibold">Verify Phone Number</Text>

      <div className="mb-4 rounded-lg bg-gray-50 p-4">
        <Text className="text-sm font-medium text-gray-700">Phone Number</Text>
        <Text className="text-sm text-gray-600">
          {phoneNumber.displayPhoneNumber || phoneNumber.phoneNumberId}
        </Text>
        {phoneNumber.name && (
          <>
            <Text className="mt-2 text-sm font-medium text-gray-700">Label</Text>
            <Text className="text-sm text-gray-600">{phoneNumber.name}</Text>
          </>
        )}
      </div>

      <div className="mb-4 rounded-lg bg-blue-50 p-4">
        <Text className="text-sm text-blue-800">
          Enter the verification code you received via SMS or voice call.
        </Text>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              label="Verification Code"
              placeholder="Enter 6-8 digit code"
              error={errors.code?.message}
              maxLength={8}
            />
          )}
        />

        <div className="flex justify-end gap-3 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Verify
          </Button>
        </div>
      </form>
    </div>
  );
}
