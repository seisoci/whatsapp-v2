'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Textarea } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { contactsApi } from '@/lib/api/contacts'; // Make sure this path is correct
import toast from 'react-hot-toast';
import { z } from 'zod';
import { Contact } from '@/lib/api/types/contacts'; // Make sure this path is correct

const createContactSchema = z.object({
  waId: z.string().min(1, 'WhatsApp ID is required'),
  phoneNumberId: z.string().min(1, 'Phone Number ID is required'), // Ideally this should be a select if we have list of phone numbers
  profileName: z.string().optional(),
  businessName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  notes: z.string().optional(),
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

  const onSubmit: SubmitHandler<CreateContactInput> = async (data) => {
    setLoading(true);
    try {
      let response;
      if (contact) {
        response = await contactsApi.update(contact.id, {
          profileName: data.profileName,
          businessName: data.businessName,
          email: data.email,
          notes: data.notes,
        });
      } else {
        response = await contactsApi.create({
          waId: data.waId,
          phoneNumberId: data.phoneNumberId,
          profileName: data.profileName,
          businessName: data.businessName,
          email: data.email,
        });
      }

      if (response.success) {
        toast.success(contact ? 'Contact updated successfully' : 'Contact created successfully');
        closeModal();
        onSuccess?.();
      } else {
        toast.error(response.message || `Failed to ${contact ? 'update' : 'create'} contact`);
      }
    } catch (error: any) {
      console.error('Contact operation error:', error);
      toast.error(error.message || `Failed to ${contact ? 'update' : 'create'} contact`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<CreateContactInput>
      onSubmit={onSubmit}
      validationSchema={createContactSchema}
      useFormProps={{
        defaultValues: {
          waId: contact?.waId || '',
          phoneNumberId: contact?.phoneNumberId || '',
          profileName: contact?.profileName || '',
          businessName: contact?.businessName || '',
          email: contact?.customFields?.email || '',
          notes: contact?.notes || '',
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container md:grid-cols-2 [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, formState: { errors } }) => {
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                {contact ? 'Edit Contact' : 'Add New Contact'}
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <Input
              label="WhatsApp ID"
              placeholder="e.g. 628123456789"
              {...register('waId')}
              className="col-span-full"
              error={errors.waId?.message}
              disabled={!!contact} // ID usually shouldn't change
            />

            <Input
              label="Phone Number ID"
              placeholder="UUID of Phone Number"
              {...register('phoneNumberId')}
              className="col-span-full"
              error={errors.phoneNumberId?.message}
              disabled={!!contact}
            />

            <Input
              label="Profile Name"
              placeholder="Enter profile name"
              {...register('profileName')}
              className="col-span-full"
              error={errors.profileName?.message}
            />

            <Input
              label="Business Name"
              placeholder="Enter business name (optional)"
              {...register('businessName')}
              className="col-span-full"
              error={errors.businessName?.message}
            />

            <Input
              label="Email"
              placeholder="Enter email address (optional)"
              {...register('email')}
              className="col-span-full"
              error={errors.email?.message}
            />

             <Textarea
              label="Notes"
              placeholder="Enter notes (optional)"
              {...register('notes')}
              className="col-span-full"
              error={errors.notes?.message}
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
                {contact ? 'Update Contact' : 'Create Contact'}
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
