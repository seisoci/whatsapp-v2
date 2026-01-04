'use client';

import { useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Title, Text, Input, Button, Textarea, Switch } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { phoneNumbersApi } from '@/lib/api-client';
import toast from 'react-hot-toast';

const createPhoneNumberSchema = z.object({
  phoneNumberId: z.string().min(1, 'Phone Number ID is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
  wabaId: z.string().min(1, 'WhatsApp Business Account ID is required'),
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});

const editPhoneNumberSchema = z.object({
  phoneNumberId: z.string().min(1, 'Phone Number ID is required'),
  accessToken: z.string().optional(), // Optional saat edit
  wabaId: z.string().min(1, 'WhatsApp Business Account ID is required'),
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});

type PhoneNumberFormData = z.infer<typeof createPhoneNumberSchema>;

interface CreateEditPhoneNumberProps {
  phoneNumber?: any;
  onSuccess?: () => void;
}

export default function CreateEditPhoneNumber({
  phoneNumber,
  onSuccess,
}: CreateEditPhoneNumberProps) {
  const { closeModal } = useModal();
  const isEditMode = !!phoneNumber;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PhoneNumberFormData>({
    resolver: zodResolver(isEditMode ? editPhoneNumberSchema : createPhoneNumberSchema),
    defaultValues: {
      phoneNumberId: '',
      accessToken: '',
      wabaId: '',
      name: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (phoneNumber) {
      reset({
        phoneNumberId: phoneNumber.phoneNumberId || '',
        accessToken: '', // Jangan populate access token saat edit (security)
        wabaId: phoneNumber.wabaId || '',
        name: phoneNumber.name || '',
        isActive: phoneNumber.isActive ?? true,
      });
    }
  }, [phoneNumber, reset]);

  const onSubmit: SubmitHandler<PhoneNumberFormData> = async (data) => {
    try {
      let response;

      if (isEditMode) {
        // Hanya kirim field yang diubah
        const updateData: any = {
          name: data.name,
          isActive: data.isActive,
        };

        // Hanya kirim accessToken jika user mengisi (untuk update token)
        if (data.accessToken && data.accessToken.trim()) {
          updateData.accessToken = data.accessToken;
        }

        response = await phoneNumbersApi.update(phoneNumber.id, updateData);
      } else {
        response = await phoneNumbersApi.create(data);
      }

      if (response.success) {
        toast.success(
          response.message ||
            `Phone number ${isEditMode ? 'updated' : 'created'} successfully`
        );
        closeModal();
        onSuccess?.();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        `Failed to ${isEditMode ? 'update' : 'create'} phone number`;
      toast.error(errorMessage);
    }
  };

  return (
    <div className="m-auto p-6">
      <Title as="h3" className="mb-3 text-lg">
        {isEditMode ? 'Edit Phone Number' : 'Add Phone Number'}
      </Title>
      <Text className="mb-6 text-sm text-gray-500">
        {isEditMode
          ? 'Update phone number credentials and settings'
          : 'Add a new WhatsApp Business phone number'}
      </Text>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <Input
          type="text"
          label="Phone Number ID"
          placeholder="Enter Phone Number ID from Meta"
          {...register('phoneNumberId')}
          error={errors.phoneNumberId?.message}
          disabled={isEditMode}
          className="col-span-full"
        />

        <div className="col-span-full">
          <Textarea
            label={isEditMode ? 'Access Token (Optional - Leave empty to keep current)' : 'Access Token'}
            placeholder={isEditMode ? 'Enter new Access Token only if you want to update it' : 'Enter Permanent Access Token from Meta'}
            {...register('accessToken')}
            error={errors.accessToken?.message}
            rows={3}
          />
          {isEditMode && (
            <Text className="mt-1 text-xs text-gray-500">
              Leave empty if you don't want to update the access token
            </Text>
          )}
        </div>

        <Input
          type="text"
          label="WhatsApp Business Account ID"
          placeholder="Enter WABA ID"
          {...register('wabaId')}
          error={errors.wabaId?.message}
          disabled={isEditMode}
          className="col-span-full"
        />

        <Input
          type="text"
          label="Label (Optional)"
          placeholder="Enter a label to identify this phone number"
          {...register('name')}
          error={errors.name?.message}
          className="col-span-full"
        />

        <Controller
          name="isActive"
          control={control}
          render={({ field: { value, onChange } }) => (
            <div className="col-span-full">
              <Switch
                label="Active Status"
                checked={value}
                onChange={onChange}
              />
              <Text className="mt-1 text-xs text-gray-500">
                Enable or disable this phone number
              </Text>
            </div>
          )}
        />

        <div className="col-span-full flex items-center justify-end gap-4 pt-4">
          <Button
            variant="outline"
            onClick={closeModal}
            className="w-full @xl:w-auto"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full @xl:w-auto"
          >
            {isEditMode ? 'Update' : 'Create'} Phone Number
          </Button>
        </div>
      </form>
    </div>
  );
}
