'use client';

import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Title, Text, Input, Button, Textarea, Switch, Select } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { apiEndpointsApi } from '@/lib/api/api-endpoints';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
import toast from 'react-hot-toast';
import { ApiEndpoint } from '.';

const apiEndpointSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  webhookUrl: z.string().url('Invalid webhook URL').max(500),
  apiKey: z.string().max(255).optional().nullable(),
  isActive: z.boolean(),
  phoneNumberId: z.string().optional().nullable(),
});

type ApiEndpointFormData = z.infer<typeof apiEndpointSchema>;

interface PhoneNumberOption {
  value: string;
  label: string;
}

interface CreateEditApiEndpointProps {
  apiEndpoint?: ApiEndpoint;
  onSuccess?: () => void;
}

export default function CreateEditApiEndpoint({
  apiEndpoint,
  onSuccess,
}: CreateEditApiEndpointProps) {
  const { closeModal } = useModal();
  const isEditMode = !!apiEndpoint;
  const [phoneNumberOptions, setPhoneNumberOptions] = useState<PhoneNumberOption[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ApiEndpointFormData>({
    resolver: zodResolver(apiEndpointSchema),
    defaultValues: {
      name: '',
      description: '',
      webhookUrl: '',
      apiKey: '',
      isActive: true,
      phoneNumberId: null,
    },
  });

  // Load phone numbers first, then populate form values for edit mode.
  // Combining both into one effect ensures the Select has valid options
  // before displayValue is evaluated — prevents the "reset on edit" issue.
  useEffect(() => {
    phoneNumbersApi.getAll().then((res: any) => {
      const data = res?.data || [];
      const options: PhoneNumberOption[] = (Array.isArray(data) ? data : [])
        .filter((p: any) => !p.isHidden)
        .map((p: any) => {
          const display = p.displayPhoneNumber && p.displayPhoneNumber !== 'Error fetching data'
            ? p.displayPhoneNumber
            : p.phoneNumberId;
          const businessName = p.verifiedName || p.name;
          const label = businessName ? `${display} - ${businessName}` : display;
          return { value: p.id, label };
        });
      const allOptions = [{ value: '', label: '— No specific number —' }, ...options];
      setPhoneNumberOptions(allOptions);

      if (apiEndpoint) {
        reset({
          name: apiEndpoint.name || '',
          description: apiEndpoint.description || '',
          webhookUrl: apiEndpoint.webhookUrl || '',
          apiKey: apiEndpoint.apiKey || '',
          isActive: apiEndpoint.isActive ?? true,
          phoneNumberId: apiEndpoint.phoneNumberId || '',
        });
      }
    }).catch(() => {
      setPhoneNumberOptions([{ value: '', label: '— No specific number —' }]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit: SubmitHandler<ApiEndpointFormData> = async (data) => {
    try {
      let response;
      const payload = {
        name: data.name,
        description: data.description || null,
        webhookUrl: data.webhookUrl,
        apiKey: data.apiKey || null,
        isActive: data.isActive,
        phoneNumberId: data.phoneNumberId || null,
      };

      if (isEditMode) {
        response = await apiEndpointsApi.update(apiEndpoint.id, payload);
      } else {
        response = await apiEndpointsApi.create(payload);
      }

      if (response.success) {
        toast.success(
          response.message ||
            `API endpoint ${isEditMode ? 'updated' : 'created'} successfully`
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
        `Failed to ${isEditMode ? 'update' : 'create'} API endpoint`;
      toast.error(errorMessage);
    }
  };

  return (
    <div className="m-auto p-6">
      <Title as="h3" className="mb-3 text-lg">
        {isEditMode ? 'Edit API Endpoint' : 'Add API Endpoint'}
      </Title>
      <Text className="mb-6 text-sm text-gray-500">
        {isEditMode
          ? 'Update API endpoint settings'
          : 'Add a new API endpoint configuration'}
      </Text>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <Input
          type="text"
          label="Name"
          placeholder="e.g., Payment Gateway, SMS Service"
          {...register('name')}
          error={errors.name?.message}
          className="col-span-full"
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Enter a description for this API endpoint"
          {...register('description')}
          error={errors.description?.message}
          className="col-span-full"
          rows={2}
        />

        <Input
          type="text"
          label="Webhook URL"
          placeholder="https://example.com/webhook"
          {...register('webhookUrl')}
          error={errors.webhookUrl?.message}
          className="col-span-full"
        />

        <Input
          type="text"
          label="API Key (Optional)"
          placeholder="Enter API Key for authentication"
          {...register('apiKey')}
          error={errors.apiKey?.message}
          className="col-span-full"
        />

        <Controller
          name="phoneNumberId"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              label="Sender Phone Number"
              placeholder="Select sender number"
              options={phoneNumberOptions}
              value={value ?? ''}
              onChange={(opt: PhoneNumberOption) => onChange(opt?.value || null)}
              getOptionDisplayValue={(opt) => opt.label}
              displayValue={(selected) =>
                phoneNumberOptions.find((o) => o.value === selected)?.label || ''
              }
              error={errors.phoneNumberId?.message}
              className="col-span-full"
              inPortal={false}
            />
          )}
        />
        <Text className="-mt-3 text-xs text-gray-500">
          Select which WhatsApp number sends messages via this endpoint. If not set, the system will use the first active number.
        </Text>

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
                Enable or disable this API endpoint
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
            {isEditMode ? 'Update' : 'Create'} API Endpoint
          </Button>
        </div>
      </form>
    </div>
  );
}
