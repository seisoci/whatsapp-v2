'use client';

import { useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Title, Text, Input, Button, Textarea, Switch } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { apiEndpointsApi } from '@/lib/api/api-endpoints';
import toast from 'react-hot-toast';
import { ApiEndpoint } from '.';

const apiEndpointSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  webhookUrl: z.string().url('Invalid webhook URL').max(500),
  apiKey: z.string().max(255).optional().nullable(),
  isActive: z.boolean(),
});

type ApiEndpointFormData = z.infer<typeof apiEndpointSchema>;

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
    },
  });

  useEffect(() => {
    if (apiEndpoint) {
      reset({
        name: apiEndpoint.name || '',
        description: apiEndpoint.description || '',
        webhookUrl: apiEndpoint.webhookUrl || '',
        apiKey: apiEndpoint.apiKey || '',
        isActive: apiEndpoint.isActive ?? true,
      });
    }
  }, [apiEndpoint, reset]);

  const onSubmit: SubmitHandler<ApiEndpointFormData> = async (data) => {
    try {
      let response;

      if (isEditMode) {
        response = await apiEndpointsApi.update(apiEndpoint.id, {
          name: data.name,
          description: data.description || null,
          webhookUrl: data.webhookUrl,
          apiKey: data.apiKey || null,
          isActive: data.isActive,
        });
      } else {
        response = await apiEndpointsApi.create({
          name: data.name,
          description: data.description || null,
          webhookUrl: data.webhookUrl,
          apiKey: data.apiKey || null,
          isActive: data.isActive,
        });
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
