'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Select, Switch } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { createOnuType } from '@/lib/sanctum-api';
import Image from 'next/image';

const createOnuTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(40, 'Name must be 40 characters or less'),
  pon_type: z.enum(['gpon', 'epon'], { message: 'PON Type is required' }),
  ethernet_ports: z.number().min(1, 'At least 1 ethernet port required').refine((val) =>
    [1, 2, 3, 4, 5, 8, 16, 24].includes(val),
    { message: 'Must be one of: 1, 2, 3, 4, 5, 8, 16, 24' }
  ),
  wifi_ports: z.number().min(0, 'Cannot be negative').refine((val) =>
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(val),
    { message: 'Must be one of: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10' }
  ),
  voip_ports: z.number().min(0, 'Cannot be negative').refine((val) =>
    [0, 1, 2, 4, 8].includes(val),
    { message: 'Must be one of: 0, 1, 2, 4, 8' }
  ),
  catv: z.boolean(),
  capability: z.enum(['bridging', 'bridging/routing'], { message: 'Capability is required' }),
  onu_type_image: z.any().optional(),
});

type CreateOnuTypeInput = z.infer<typeof createOnuTypeSchema>;

const ponTypeOptions = [
  { label: 'GPON', value: 'gpon' },
  { label: 'EPON', value: 'epon' },
];

const ethernetPortOptions = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '8', value: 8 },
  { label: '16', value: 16 },
  { label: '24', value: 24 },
];

const wifiPortOptions = [
  { label: '0', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10', value: 10 },
];

const voipPortOptions = [
  { label: '0', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: '8', value: 8 },
];

const capabilityOptions = [
  { label: 'Bridging', value: 'bridging' },
  { label: 'Bridging/Routing', value: 'bridging/routing' },
];

export default function CreateOnuType({ onSuccess }: { onSuccess?: () => void }) {
  const { closeModal } = useModal();
  const [reset, setReset] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const onSubmit: SubmitHandler<CreateOnuTypeInput> = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append('name', data.name);
      formData.append('pon_type', data.pon_type);
      formData.append('ethernet_ports', data.ethernet_ports.toString());
      formData.append('wifi_ports', data.wifi_ports.toString());
      formData.append('voip_ports', data.voip_ports.toString());
      formData.append('catv', data.catv ? '1' : '0');
      formData.append('capability', data.capability);

      if (imageFile) {
        formData.append('onu_type_image', imageFile);
      }

      await createOnuType(formData);
      toast.success('ONU Type created successfully');
      setReset({});
      setImageFile(null);
      setImagePreview(null);
      closeModal();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create ONU Type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<CreateOnuTypeInput>
      resetValues={reset}
      onSubmit={onSubmit}
      validationSchema={createOnuTypeSchema}
      useFormProps={{
        defaultValues: {
          name: '',
          pon_type: 'gpon',
          ethernet_ports: 4,
          wifi_ports: 0,
          voip_ports: 0,
          catv: false,
          capability: 'bridging',
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container md:grid-cols-2 [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, control, formState: { errors } }) => {
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                Add ONU Device Type
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <div className="col-span-full md:col-span-1">
              <Input
                label="Device Name"
                placeholder="Enter device name"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            <div className="col-span-full md:col-span-1">
                 <Controller
                              name="pon_type"
                              control={control}
                              render={({ field: { name, onChange, value } }) => (
                                <Select
                                  options={ponTypeOptions}
                                  value={value}
                                  onChange={onChange}
                                  name={name}
                                  label="Pon Type"
                    error={errors.pon_type?.message}
                                  getOptionValue={(option) => option.value}
                                  displayValue={(selected: string) =>
                                    ponTypeOptions.find((option) => option.value === selected)?.label ?? ''
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
              <Controller
                name="ethernet_ports"
                control={control}
                render={({ field: { name, onChange, value } }) => (
                  <Select
                    options={ethernetPortOptions}
                    value={value}
                    onChange={onChange}
                    name={name}
                    label="Ethernet Ports"
                    error={errors.ethernet_ports?.message}
                    getOptionValue={(option) => option.value}
                    displayValue={(selected: number) =>
                      ethernetPortOptions.find((r) => r.value === selected)?.label ?? ''
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
            </div>

            <div className="col-span-full md:col-span-1">
              <Controller
                name="voip_ports"
                control={control}
                render={({ field: { name, onChange, value } }) => (
                  <Select
                    options={voipPortOptions}
                    value={value}
                    onChange={onChange}
                    name={name}
                    label="VoIP Ports"
                    error={errors.voip_ports?.message}
                    getOptionValue={(option) => option.value}
                    displayValue={(selected: number) =>
                      voipPortOptions.find((r) => r.value === selected)?.label ?? ''
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
            </div>

            <div className="col-span-full flex items-center justify-between rounded-lg border border-gray-200 p-4">
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

            <div className="col-span-full space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                Device Image (Optional)
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
                Create ONU Type
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
