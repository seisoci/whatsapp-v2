'use client';

import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Button, Input, Select, Text } from 'rizzui';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { phoneNumbersApi } from '@/lib/api-client';
import { PhoneNumber } from './index';
import toast from 'react-hot-toast';

const requestVerificationSchema = z.object({
  codeMethod: z.enum(['SMS', 'VOICE']),
  language: z.string().optional(),
});

type RequestVerificationInput = z.infer<typeof requestVerificationSchema>;

interface RequestVerificationModalProps {
  phoneNumber: PhoneNumber;
  onSuccess?: () => void;
  onClose?: () => void;
}

const codeMethodOptions = [
  { value: 'SMS', label: 'SMS' },
  { value: 'VOICE', label: 'Voice Call' },
];

const languageOptions = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'id_ID', label: 'Indonesian' },
  { value: 'es_ES', label: 'Spanish' },
  { value: 'pt_BR', label: 'Portuguese (Brazil)' },
  { value: 'zh_CN', label: 'Chinese (Simplified)' },
];

export default function RequestVerificationModal({
  phoneNumber,
  onSuccess,
  onClose,
}: RequestVerificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestVerificationInput>({
    resolver: zodResolver(requestVerificationSchema),
    defaultValues: {
      codeMethod: 'SMS',
      language: 'en_US',
    },
  });

  const onSubmit: SubmitHandler<RequestVerificationInput> = async (data) => {
    setIsLoading(true);
    try {
      const response = await phoneNumbersApi.requestVerificationCode(phoneNumber.id, {
        codeMethod: data.codeMethod,
        language: data.language || 'en_US',
      });

      if (response.success) {
        toast.success('Verification code has been sent successfully!');
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(response.message || 'Failed to send verification code');
      }
    } catch (error: any) {
      console.error('Request verification error:', error);
      toast.error(error.response?.data?.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="m-auto p-6">
      <Text className="mb-6 text-lg font-semibold">Request Verification Code</Text>

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Controller
          name="codeMethod"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              label="Verification Method"
              placeholder="Select method"
              options={codeMethodOptions}
              value={value}
              onChange={onChange}
              error={errors.codeMethod?.message}
              getOptionValue={(option) => option.value}
              displayValue={(selected) =>
                codeMethodOptions.find((option) => option.value === selected)?.label ?? ''
              }
            />
          )}
        />

        <Controller
          name="language"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              label="Language"
              placeholder="Select language"
              options={languageOptions}
              value={value}
              onChange={onChange}
              error={errors.language?.message}
              getOptionValue={(option) => option.value}
              displayValue={(selected) =>
                languageOptions.find((option) => option.value === selected)?.label ?? ''
              }
            />
          )}
        />

        <div className="flex justify-end gap-3 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Send Code
          </Button>
        </div>
      </form>
    </div>
  );
}
