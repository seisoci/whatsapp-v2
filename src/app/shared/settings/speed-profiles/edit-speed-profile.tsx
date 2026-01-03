'use client';

import { useState, useEffect } from 'react';
import { PiXBold } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Switch, Select } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { updateSpeedProfile, getOnuTypes } from '@/lib/sanctum-api';
import { SpeedProfile } from './columns';

const updateSpeedProfileSchema = z.object({
  speed: z.number().min(1, 'Speed must be at least 1').max(2000000, 'Speed must be at most 2000000'),
  is_default: z.boolean(),
  onu_type_id: z.number().nullable(),
});

type UpdateSpeedProfileInput = z.infer<typeof updateSpeedProfileSchema>;

interface OnuTypeOption {
  id: number;
  name: string;
}

export default function EditSpeedProfile({
  speedProfile,
  onSuccess,
}: {
  speedProfile: SpeedProfile;
  onSuccess?: () => void;
}) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);
  const [onuTypes, setOnuTypes] = useState<OnuTypeOption[]>([]);
  const [loadingOnuTypes, setLoadingOnuTypes] = useState(true);

  useEffect(() => {
    const fetchOnuTypes = async () => {
      try {
        const response = await getOnuTypes();
        if (response && response.data) {
          setOnuTypes(response.data);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load ONU types');
      } finally {
        setLoadingOnuTypes(false);
      }
    };

    fetchOnuTypes();
  }, []);

  const onSubmit: SubmitHandler<UpdateSpeedProfileInput> = async (data) => {
    setLoading(true);
    try {
      await updateSpeedProfile(speedProfile.id, data);
      toast.success('Speed Profile updated successfully');
      closeModal();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update Speed Profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<UpdateSpeedProfileInput>
      onSubmit={onSubmit}
      validationSchema={updateSpeedProfileSchema}
      useFormProps={{
        defaultValues: {
          speed: speedProfile.speed,
          is_default: speedProfile.is_default === true,
          onu_type_id: speedProfile.onu_type_id ?? null,
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, control, formState: { errors }, watch }) => {
        console.log('Form defaultValues:', {
          speed: speedProfile.speed,
          is_default: speedProfile.is_default,
        });
        console.log('Form watch values:', watch());
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                Edit Speed Profile: {speedProfile.name}
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <Input
              type="number"
              label="Speed (Kbps)"
              placeholder="Enter speed in Kbps"
              {...register('speed', { valueAsNumber: true })}
              error={errors.speed?.message}
            />

            <Controller
              name="onu_type_id"
              control={control}
              render={({ field: { name, onChange, value } }) => (
                <Select
                  options={onuTypes.map((onuType) => ({ value: onuType.id, label: onuType.name }))}
                  value={value}
                  onChange={onChange}
                  name={name}
                  label="ONU Type (Optional)"
                  error={errors.onu_type_id?.message}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: number) =>
                    onuTypes.find((onuType) => onuType.id === selected)?.name ?? ''
                  }
                  dropdownClassName="!z-[1]"
                  inPortal={false}
                  clearable={value !== null}
                  onClear={() => onChange(null)}
                  searchable
                />
              )}
            />

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
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
                  <Switch
                    checked={!!value}
                    onChange={(e: any) => onChange(typeof e === 'boolean' ? e : !!e?.target?.checked)}
                  />
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
                Update Profile
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
