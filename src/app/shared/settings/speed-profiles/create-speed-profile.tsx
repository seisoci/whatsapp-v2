'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Select, Switch } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { createSpeedProfile } from '@/lib/sanctum-api';

const createSpeedProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(20, 'Name must be 20 characters or less'),
  up_down: z.enum(['download', 'upload'], { message: 'Direction is required' }),
  for_iptv: z.boolean(),
  speed: z.number().min(1, 'Speed must be at least 1').max(2000000, 'Speed must be at most 2000000'),
  use_prefix_suffix: z.boolean(),
  is_default: z.boolean(),
});

type CreateSpeedProfileInput = z.infer<typeof createSpeedProfileSchema>;

const directionOptions = [
  { label: 'Download', value: 'download' },
  { label: 'Upload', value: 'upload' },
];

export default function CreateSpeedProfile({ onSuccess }: { onSuccess?: () => void }) {
  const { closeModal } = useModal();
  const [reset, setReset] = useState({});
  const [isLoading, setLoading] = useState(false);

  const onSubmit: SubmitHandler<CreateSpeedProfileInput> = async (data) => {
    setLoading(true);
    try {
      await createSpeedProfile(data);
      toast.success('Speed Profile created successfully');
      setReset({});
      closeModal();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create Speed Profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<CreateSpeedProfileInput>
      resetValues={reset}
      onSubmit={onSubmit}
      validationSchema={createSpeedProfileSchema}
      useFormProps={{
        defaultValues: {
          name: '',
          up_down: null,
          for_iptv: false,
          speed: 10000,
          use_prefix_suffix: true,
          is_default: false,
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container md:grid-cols-2 [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, control, formState: { errors } }) => {
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                Add Speed Profile
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <div className="col-span-full md:col-span-1">
              <Input
                label="Profile Name"
                placeholder="Enter profile name"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            <div className="col-span-full md:col-span-1">
              <Controller
                name="up_down"
                control={control}
                render={({ field: { name, onChange, value } }) => (
                  <Select
                    options={directionOptions}
                    value={value}
                    onChange={onChange}
                    name={name}
                    label="Direction"
                    placeholder="Select direction"
                    error={errors.up_down?.message}
                    getOptionValue={(option) => option.value}
                    displayValue={(selected: string) =>
                      directionOptions.find((option) => option.value === selected)?.label ?? ''
                    }
                    dropdownClassName="!z-[1]"
                    inPortal={false}
                    clearable={value !== null}
                    onClear={() => onChange(null)}
                    searchable
                  />
                )}
              />
            </div>

            <div className="col-span-full md:col-span-1">
              <Input
                type="number"
                label="Speed (Kbps)"
                placeholder="Enter speed in Kbps"
                {...register('speed', { valueAsNumber: true })}
                error={errors.speed?.message}
              />
            </div>

            <div className="col-span-full md:col-span-1 flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <Title as="h6" className="mb-1 text-sm font-medium">
                  For IPTV
                </Title>
                <p className="text-xs text-gray-500">Enable this profile for IPTV usage</p>
              </div>
              <Controller
                name="for_iptv"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Switch checked={value} onChange={onChange} />
                )}
              />
            </div>

            <div className="col-span-full md:col-span-1 flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <Title as="h6" className="mb-1 text-sm font-medium">
                  Use Prefix/Suffix
                </Title>
                <p className="text-xs text-gray-500">Add prefix or suffix to profile name</p>
              </div>
              <Controller
                name="use_prefix_suffix"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Switch checked={value} onChange={onChange} />
                )}
              />
            </div>

            <div className="col-span-full md:col-span-1 flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <Title as="h6" className="mb-1 text-sm font-medium">
                  Set as Default
                </Title>
                <p className="text-xs text-gray-500">Make this the default speed profile</p>
              </div>
              <Controller
                name="is_default"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Switch checked={value} onChange={onChange} />
                )}
              />
            </div>

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
                Create Profile
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
