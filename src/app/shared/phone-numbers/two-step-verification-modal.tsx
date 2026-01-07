'use client';

import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Button, Input, Password, Text } from 'rizzui';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
import { PhoneNumber } from './index';
import toast from 'react-hot-toast';

const twoStepVerificationSchema = z.object({
  pin: z.string()
    .length(6, 'PIN must be exactly 6 digits')
    .regex(/^\d+$/, 'PIN must contain only numbers'),
  confirmPin: z.string()
    .length(6, 'PIN must be exactly 6 digits')
    .regex(/^\d+$/, 'PIN must contain only numbers'),
}).refine((data) => data.pin === data.confirmPin, {
  message: 'PINs do not match',
  path: ['confirmPin'],
});

type TwoStepVerificationInput = z.infer<typeof twoStepVerificationSchema>;

interface TwoStepVerificationModalProps {
  phoneNumber: PhoneNumber;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function TwoStepVerificationModal({
  phoneNumber,
  onSuccess,
  onClose,
}: TwoStepVerificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoStepVerificationInput>({
    resolver: zodResolver(twoStepVerificationSchema),
    defaultValues: {
      pin: '',
      confirmPin: '',
    },
  });

  const onSubmit: SubmitHandler<TwoStepVerificationInput> = async (data) => {
    setIsLoading(true);
    try {
      const response = await phoneNumbersApi.setTwoStepVerification(phoneNumber.id, {
        pin: data.pin,
      });

      if (response.success) {
        toast.success('Two-step verification has been set successfully!');
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(response.message || 'Failed to set two-step verification');
      }
    } catch (error: any) {
      console.error('Two-step verification error:', error);
      toast.error(error.response?.data?.message || 'Failed to set two-step verification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="m-auto p-6">
      <Text className="mb-6 text-lg font-semibold">Set Two-Step Verification</Text>

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

      <div className="mb-4 rounded-lg bg-amber-50 p-4">
        <Text className="text-sm font-medium text-amber-800">Important:</Text>
        <Text className="mt-1 text-sm text-amber-700">
          This PIN adds an extra layer of security to your WhatsApp Business Account.
          You'll need this PIN when registering your phone number on a new device.
        </Text>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Controller
          name="pin"
          control={control}
          render={({ field }) => (
            <Password
              {...field}
              label="6-Digit PIN"
              placeholder="Enter 6-digit PIN"
              error={errors.pin?.message}
              maxLength={6}
            />
          )}
        />

        <Controller
          name="confirmPin"
          control={control}
          render={({ field }) => (
            <Password
              {...field}
              label="Confirm PIN"
              placeholder="Re-enter 6-digit PIN"
              error={errors.confirmPin?.message}
              maxLength={6}
            />
          )}
        />

        <div className="flex justify-end gap-3 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Set PIN
          </Button>
        </div>
      </form>
    </div>
  );
}
