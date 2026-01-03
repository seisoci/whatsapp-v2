'use client';

import { useState, useEffect } from 'react';
import { PiXBold } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Select, Loader } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { updateOdb, getZones } from '@/lib/sanctum-api';
import { Odb } from './columns';

const updateOdbSchema = z.object({
  name: z.string().min(1, 'Name is required').max(40, 'Name must be 40 characters or less'),
  nr_of_ports: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().min(1, 'Ports must be at least 1').nullable()
  ),
  zone_id: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().nullable()
  ),
  latitude: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').nullable()
  ),
  longitude: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').nullable()
  ),
});

type UpdateOdbInput = z.infer<typeof updateOdbSchema>;

interface Zone {
  id: number;
  name: string;
}

export default function EditOdb({
  odb,
  onSuccess,
}: {
  odb: Odb;
  onSuccess?: () => void;
}) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await getZones();
        if (response && response.data) {
          // Filter zones to only include those with valid string names
          const validZones = response.data.filter((zone: Zone) => zone.name && typeof zone.name === 'string');
          setZones(validZones);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load zones');
      } finally {
        setLoadingZones(false);
      }
    };

    fetchZones();
  }, []);

  const onSubmit: SubmitHandler<UpdateOdbInput> = async (data) => {
    setLoading(true);
    try {
      await updateOdb(odb.id, data);
      toast.success('ODB updated successfully');
      closeModal();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update ODB';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<UpdateOdbInput>
      onSubmit={onSubmit}
      validationSchema={updateOdbSchema}
      useFormProps={{
        defaultValues: {
          name: odb.name,
          nr_of_ports: odb.nr_of_ports,
          zone_id: odb.zone_id,
          latitude: odb.latitude,
          longitude: odb.longitude,
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container md:grid-cols-2 [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900 max-h-[80vh] overflow-y-auto"
    >
      {({ register, control, formState: { errors } }) => {
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                Edit ODB
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <div className="col-span-full md:col-span-1">
              <Input
                label="ODB Name"
                placeholder="Enter ODB name"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            <div className="col-span-full md:col-span-1">
              <Input
                label="Number of Ports"
                type="number"
                placeholder="Enter number of ports"
                {...register('nr_of_ports')}
                error={errors.nr_of_ports?.message}
              />
            </div>

            <div className="col-span-full md:col-span-1">
              {loadingZones ? (
                <div className="flex items-center justify-center py-4">
                  <Loader variant="spinner" size="sm" />
                </div>
              ) : zones.length > 0 ? (
                <Controller
                  name="zone_id"
                  control={control}
                  render={({ field: { name, onChange, value } }) => (
                    <Select
                      options={zones.map((zone) => ({ value: zone.id, label: zone.name }))}
                      value={value}
                      onChange={onChange}
                      name={name}
                      label="Zone (Optional)"
                      placeholder="Select a zone"
                      error={errors.zone_id?.message as string}
                      getOptionValue={(option) => option.value}
                      displayValue={(selected: number) =>
                        zones.find((zone) => zone.id === selected)?.name ?? ''
                      }
                      dropdownClassName="!z-[1]"
                      inPortal={false}
                      clearable
                      searchable
                    />
                  )}
                />
              ) : (
                <div className="py-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Zone (Optional)</label>
                  <p className="text-sm text-gray-500">No zones available. Please create a zone first.</p>
                </div>
              )}
            </div>

            <div className="col-span-full md:col-span-1">
              <Input
                label="Latitude"
                type="number"
                step="any"
                placeholder="Enter latitude (-90 to 90)"
                {...register('latitude')}
                error={errors.latitude?.message}
              />
            </div>

            <div className="col-span-full md:col-span-1">
              <Input
                label="Longitude"
                type="number"
                step="any"
                placeholder="Enter longitude (-180 to 180)"
                {...register('longitude')}
                error={errors.longitude?.message}
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
                Update ODB
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
