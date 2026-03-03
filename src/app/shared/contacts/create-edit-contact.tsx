'use client';

import { useState, useEffect } from 'react';
import { PiXBold } from 'react-icons/pi';
import { SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Select } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { contactsApi } from '@/lib/api/contacts';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { Contact } from '@/lib/api/types/contacts';

const createContactSchema = z.object({
  waId: z.string().min(1, 'Nomor WhatsApp harus diisi'),
  phoneNumberId: z.string().min(1, 'Pilih nomor bisnis'),
  profileName: z.string().optional(),
});

type CreateContactInput = z.infer<typeof createContactSchema>;

export default function CreateEditContact({
  contact,
  onSuccess,
}: {
  contact?: Contact;
  onSuccess?: () => void;
}) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);

  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      try {
        const res: any = await phoneNumbersApi.getAll();
        const data = Array.isArray(res) ? res : res?.data || [];
        setPhoneNumbers(data);
      } catch (error) {
        console.error('Failed to fetch phone numbers:', error);
      }
    };
    fetchPhoneNumbers();
  }, []);

  const onSubmit: SubmitHandler<CreateContactInput> = async (data) => {
    setLoading(true);
    try {
      let response;
      if (contact) {
        response = await contactsApi.update(contact.id, {
          profileName: data.profileName,
        });
      } else {
        response = await contactsApi.create({
          waId: data.waId.replace(/\D/g, ''),
          phoneNumberId: data.phoneNumberId,
          profileName: data.profileName,
        });
      }

      if (response.success) {
        toast.success(
          contact
            ? 'Contact updated successfully'
            : 'Contact created successfully'
        );
        closeModal();
        onSuccess?.();
      } else {
        toast.error(
          response.message ||
            `Failed to ${contact ? 'update' : 'create'} contact`
        );
      }
    } catch (error: any) {
      console.error('Contact operation error:', error);
      toast.error(
        error.message || `Failed to ${contact ? 'update' : 'create'} contact`
      );
    } finally {
      setLoading(false);
    }
  };

  const phoneNumberOptions = phoneNumbers.map((pn) => ({
    label: pn.displayPhoneNumber || pn.phoneNumberId,
    value: pn.id,
  }));

  return (
    <Form<CreateContactInput>
      onSubmit={onSubmit}
      validationSchema={createContactSchema}
      useFormProps={{
        defaultValues: {
          waId: contact?.waId || '',
          phoneNumberId: contact?.phoneNumberId || '',
          profileName: contact?.profileName || '',
        },
      }}
      className="grid grid-cols-1 gap-5 p-6 [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, setValue, watch, formState: { errors } }) => {
        const selectedPhoneNumberId = watch('phoneNumberId');

        return (
          <>
            <div className="flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                {contact ? 'Edit Contact' : 'Tambah Contact'}
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <Input
              label="Nama"
              placeholder="Masukkan nama contact"
              {...register('profileName')}
              error={errors.profileName?.message}
            />

            <Input
              label="Nomor WhatsApp"
              placeholder="contoh: 6281234567890"
              {...register('waId')}
              error={errors.waId?.message}
              disabled={!!contact}
              helperText="Masukkan nomor dengan kode negara, tanpa + atau spasi"
            />

            <div>
              <Select
                label="Nomor Bisnis WhatsApp"
                placeholder="Pilih nomor bisnis..."
                options={phoneNumberOptions}
                value={selectedPhoneNumberId}
                onChange={(option: any) =>
                  setValue('phoneNumberId', option.value, {
                    shouldValidate: true,
                  })
                }
                getOptionDisplayValue={(option) => option.label}
                displayValue={(selected) =>
                  phoneNumberOptions.find((o) => o.value === selected)?.label ||
                  ''
                }
                disabled={!!contact}
                error={errors.phoneNumberId?.message}
                inPortal={false}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={closeModal}>
                Batal
              </Button>
              <Button type="submit" isLoading={isLoading}>
                {contact ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
