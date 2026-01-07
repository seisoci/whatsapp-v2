'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Textarea } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { rolesApi } from '@/lib/api/roles';
import toast from 'react-hot-toast';
import { z } from 'zod';

const createRoleSchema = z.object({
  name: z.string().min(3, 'Role name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  description: z.string().optional(),
});

type CreateRoleInput = z.infer<typeof createRoleSchema>;

export default function CreateRole({ onSuccess }: { onSuccess?: () => void }) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);

  const onSubmit: SubmitHandler<CreateRoleInput> = async (data) => {
    setLoading(true);
    try {
      const response = await rolesApi.create({
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        isActive: true,
      });

      if (response.success) {
        toast.success('Role created successfully');
        closeModal();
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to create role');
      }
    } catch (error: any) {
      console.error('Create role error:', error);
      toast.error(error.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<CreateRoleInput>
      onSubmit={onSubmit}
      validationSchema={createRoleSchema}
      className="flex flex-grow flex-col gap-6 p-6 @container [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, formState: { errors } }) => {
        return (
          <>
            <div className="flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                Add a new Role
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <Input
              label="Role Name"
              placeholder="e.g. Manager, Developer"
              {...register('name')}
              error={errors.name?.message}
            />

            <Input
              label="Slug"
              placeholder="e.g. manager, developer"
              {...register('slug')}
              error={errors.slug?.message}
            />

            <Textarea
              label="Description"
              placeholder="Enter role description"
              {...register('description')}
              error={errors.description?.message}
              textareaClassName="h-20"
            />

            <div className="flex items-center justify-end gap-4">
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
                Create Role
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
