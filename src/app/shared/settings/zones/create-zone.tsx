'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { createZone } from '@/lib/sanctum-api';

const createZoneSchema = z.object({
  name: z.string().min(1, 'Name is required').max(40, 'Name must be 40 characters or less'),
});

type CreateZoneInput = z.infer<typeof createZoneSchema>;

export default function CreateZone({ onSuccess }: { onSuccess?: () => void }) {
  const { closeModal } = useModal();
  const [reset, setReset] = useState({});
  const [isLoading, setLoading] = useState(false);

  const onSubmit: SubmitHandler<CreateZoneInput> = async (data) => {
    setLoading(true);
    try {
      await createZone(data);
      toast.success('Zone created successfully');
      setReset({});
      closeModal();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create Zone';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<CreateZoneInput>
      resetValues={reset}
      onSubmit={onSubmit}
      validationSchema={createZoneSchema}
      useFormProps={{
        defaultValues: {
          name: '',
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, formState: { errors } }) => {
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                Add Zone
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <Input
              label="Zone Name"
              placeholder="Enter zone name"
              {...register('name')}
              error={errors.name?.message}
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
                Create Zone
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
