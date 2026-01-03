'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Button, ActionIcon, Title, Select, Switch } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { updateOnuType } from '@/lib/sanctum-api';
import { OnuType } from './columns';
import Image from 'next/image';

const updateOnuTypeSchema = z.object({
  wifi_ports: z.number().min(0, 'Cannot be negative').refine((val) =>
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(val),
    { message: 'Must be one of: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10' }
  ),
  catv: z.boolean(),
  capability: z.enum(['bridging', 'bridging/routing'], { message: 'Capability is required' }),
});

type UpdateOnuTypeInput = z.infer<typeof updateOnuTypeSchema>;

const wifiPortOptions = [
  { label: '0 Ports', value: 0 },
  { label: '1 Port', value: 1 },
  { label: '2 Ports', value: 2 },
  { label: '3 Ports', value: 3 },
  { label: '4 Ports', value: 4 },
  { label: '5 Ports', value: 5 },
  { label: '6 Ports', value: 6 },
  { label: '7 Ports', value: 7 },
  { label: '8 Ports', value: 8 },
  { label: '9 Ports', value: 9 },
  { label: '10 Ports', value: 10 },
];

const capabilityOptions = [
  { label: 'Bridging', value: 'bridging' },
  { label: 'Bridging/Routing', value: 'bridging/routing' },
];

export default function EditOnuType({
  onuType,
  onSuccess,
}: {
  onuType: OnuType;
  onSuccess?: () => void;
}) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(onuType.onu_type_image);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        toast.error('Only JPG, JPEG, and PNG files are allowed');
        return;
      }
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveExistingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
  };

  const onSubmit: SubmitHandler<UpdateOnuTypeInput> = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append('wifi_ports', data.wifi_ports.toString());
      formData.append('catv', data.catv ? '1' : '0');
      formData.append('capability', data.capability);

      if (imageFile) {
        formData.append('onu_type_image', imageFile);
      } else if (removeExistingImage) {
        formData.append('remove_image', '1');
      }

      await updateOnuType(onuType.id, formData);
      toast.success('ONU Type updated successfully');
      closeModal();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update ONU Type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<UpdateOnuTypeInput>
      onSubmit={onSubmit}
      validationSchema={updateOnuTypeSchema}
      useFormProps={{
        defaultValues: {
          wifi_ports: onuType.wifi_ports,
          catv: onuType.catv || false,
          capability: onuType.capability,
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ control, formState: { errors } }) => {
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                Edit ONU Type: {onuType.name}
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Device Name:</span>
                <span className="font-medium text-gray-900">{onuType.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">PON Type:</span>
                <span className="font-medium text-gray-900 uppercase">{onuType.pon_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ethernet Ports:</span>
                <span className="font-medium text-gray-900">{onuType.ethernet_ports}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VoIP Ports:</span>
                <span className="font-medium text-gray-900">{onuType.voip_ports}</span>
              </div>
            </div>

            <Controller
              name="wifi_ports"
              control={control}
              render={({ field: { name, onChange, value } }) => (
                <Select
                  options={wifiPortOptions}
                  value={value}
                  onChange={onChange}
                  name={name}
                  label="WiFi Ports"
                  error={errors.wifi_ports?.message}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: number) =>
                    wifiPortOptions.find((r) => r.value === selected)?.label ?? ''
                  }
                  dropdownClassName="!z-[1]"
                  inPortal={false}
                  clearable={value !== null}
                  onClear={() => onChange(null)}
                  searchable
                />
              )}
            />

            <Controller
              name="capability"
              control={control}
              render={({ field: { name, onChange, value } }) => (
                <Select
                  options={capabilityOptions}
                  value={value}
                  onChange={onChange}
                  name={name}
                  label="Capability"
                  error={errors.capability?.message}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: string) =>
                    capabilityOptions.find((r) => r.value === selected)?.label ?? ''
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
                  CATV Support
                </Title>
                <p className="text-xs text-gray-500">Enable CATV port support</p>
              </div>
              <Controller
                name="catv"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Switch checked={value} onChange={onChange} />
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                Device Image
              </label>
              <p className="text-xs text-gray-500 mb-2">
                JPG, JPEG, or PNG. Max 2MB. Recommended dimensions: 400x91px
              </p>
              {imagePreview ? (
                <div className="relative">
                  <div className="relative h-24 w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain p-2"
                      sizes="400px"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    color="danger"
                    onClick={removeImage}
                    className="mt-2"
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer"
                  />
                </div>
              )}
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
                Update ONU Type
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
