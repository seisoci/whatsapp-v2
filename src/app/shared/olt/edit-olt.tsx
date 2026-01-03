'use client';

import { useState, useEffect, useRef } from 'react';
import { PiXBold } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Select, Password, Loader } from 'rizzui';
import {
  UpdateOltInput,
  createOltSchema,
} from '@/validators/create-olt.schema';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { getOltDetail, updateOlt } from '@/lib/sanctum-api';
import toast from 'react-hot-toast';
import { Olt } from '@/types/olt';

const manufacturerOptions = [
  { label: 'Huawei', value: 'huawei' },
  { label: 'ZTE', value: 'zte' },
];

const iptvModuleOptions = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

const hardwareVersionOptions: Record<string, { label: string; value: string }[]> = {
  huawei: [],
  zte: [
    { label: 'C300', value: 'C300' },
    { label: 'C320', value: 'C320' },
  ],
};

export default function EditOlt({ oltId, onSuccess }: { oltId: number | string; onSuccess?: () => void }) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);
  const [isLoadingData, setLoadingData] = useState(true);
  const [oltData, setOltData] = useState<Olt | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchOltData = async () => {
      try {
        setLoadingData(true);
        const response = await getOltDetail(oltId);
        if (response.data) {
          const normalizedData = {
            ...response.data,
            manufacturer: response.data.manufacturer?.toLowerCase(),
          };
          setOltData(normalizedData);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load OLT data');
        closeModal();
      } finally {
        setLoadingData(false);
      }
    };

    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchOltData();
    }
  }, [oltId]);

  const onSubmit: SubmitHandler<UpdateOltInput> = async (data) => {
    setLoading(true);
    try {
      await updateOlt(oltId, data);
      toast.success('OLT updated successfully');
      closeModal();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update OLT');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  if (!oltData) {
    return (
      <div className="p-6">
        <Title as="h4" className="font-semibold">
          OLT not found
        </Title>
      </div>
    );
  }

  return (
    <Form<UpdateOltInput>
      onSubmit={onSubmit}
      validationSchema={createOltSchema}
      useFormProps={{
        defaultValues: {
          name: oltData.name || '',
          olt_ip_address: oltData.olt_ip_address || '',
          telnet_port: oltData.telnet_port ?? 23,
          telnet_username: oltData.telnet_username || '',
          telnet_password: oltData.telnet_password || '',
          snmp_read_only: oltData.snmp_read_only || '',
          snmp_read_write: oltData.snmp_read_write || '',
          snmp_udp_port: oltData.snmp_udp_port ?? 161,
          iptv_module: (oltData.iptv_module || 'false') as 'true' | 'false',
          manufacturer: (oltData.manufacturer || 'huawei') as 'huawei' | 'zte',
          hardware_version: oltData.hardware_version || '',
          software_version: oltData.software_version || '',
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container md:grid-cols-2 [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, control, watch, formState: { errors } }) => {
        const selectedManufacturer = watch('manufacturer') || 'zte';
        const hardwareOptions = hardwareVersionOptions[selectedManufacturer] || [];

        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                Edit OLT
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <Input
              label="OLT Name"
              placeholder="Enter OLT name"
              {...register('name')}
              className="col-span-full"
              error={errors.name?.message}
            />

            <Input
              label="IP Address"
              placeholder="192.168.1.1"
              {...register('olt_ip_address')}
              className="col-span-full"
              error={errors.olt_ip_address?.message}
            />

            <div className="col-span-full">
              <Title as="h5" className="text-sm font-semibold mb-4 text-gray-700">
                Telnet Configuration
              </Title>
            </div>

            <Input
              label="Telnet Port"
              type="number"
              placeholder="23"
              {...register('telnet_port', { valueAsNumber: true })}
              error={errors.telnet_port?.message}
            />

            <Input
              label="Telnet Username"
              placeholder="Enter username"
              {...register('telnet_username')}
              error={errors.telnet_username?.message}
            />

            <Password
              label="Telnet Password"
              placeholder="Enter password"
              {...register('telnet_password')}
              className="col-span-full"
              error={errors.telnet_password?.message}
            />

            <div className="col-span-full">
              <Title as="h5" className="text-sm font-semibold mb-4 text-gray-700">
                SNMP Configuration
              </Title>
            </div>

            <Input
              label="SNMP Read-Only Community"
              placeholder="public"
              {...register('snmp_read_only')}
              error={errors.snmp_read_only?.message}
            />

            <Input
              label="SNMP Read-Write Community"
              placeholder="private"
              {...register('snmp_read_write')}
              error={errors.snmp_read_write?.message}
            />

            <Input
              label="SNMP UDP Port"
              type="number"
              placeholder="161"
              {...register('snmp_udp_port', { valueAsNumber: true })}
              className="col-span-full"
              error={errors.snmp_udp_port?.message}
            />

            <div className="col-span-full">
              <Title as="h5" className="text-sm font-semibold mb-4 text-gray-700">
                Device Information
              </Title>
            </div>

            <Controller
              name="manufacturer"
              control={control}
              render={({ field: { name, onChange, value } }) => (
                <Select
                  options={manufacturerOptions}
                  value={value}
                  onChange={onChange}
                  name={name}
                  label="Manufacturer"
                  error={errors?.manufacturer?.message}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: string) =>
                    manufacturerOptions.find((option) => option.value === selected)?.label ?? selected
                  }
                  dropdownClassName="!z-[1]"
                  inPortal={false}
                />
              )}
            />

            <Controller
              name="iptv_module"
              control={control}
              render={({ field: { name, onChange, value } }) => (
                <Select
                  options={iptvModuleOptions}
                  value={value}
                  onChange={onChange}
                  name={name}
                  label="IPTV Module"
                  error={errors?.iptv_module?.message}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected: string) =>
                    iptvModuleOptions.find((option) => option.value === selected)?.label ?? selected
                  }
                  dropdownClassName="!z-[1]"
                  inPortal={false}
                />
              )}
            />

            {hardwareOptions.length > 0 ? (
              <Controller
                name="hardware_version"
                control={control}
                render={({ field: { name, onChange, value } }) => (
                  <Select
                    options={hardwareOptions}
                    value={value}
                    onChange={onChange}
                    name={name}
                    label="Hardware Version"
                    error={errors?.hardware_version?.message}
                    getOptionValue={(option) => option.value}
                    displayValue={(selected: string) =>
                      hardwareOptions.find((option) => option.value === selected)?.label ?? selected
                    }
                    dropdownClassName="!z-[1]"
                    inPortal={false}
                  />
                )}
              />
            ) : (
              <Input
                label="Hardware Version"
                placeholder="Enter hardware version"
                {...register('hardware_version')}
                error={errors.hardware_version?.message}
                disabled
                helperText="No hardware versions available for this manufacturer"
              />
            )}

            <Input
              label="Software Version"
              placeholder="V800R017C10"
              {...register('software_version')}
              error={errors.software_version?.message}
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
                Update OLT
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
