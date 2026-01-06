'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Textarea } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { quickReplyApi, type QuickReply } from '@/lib/api/quick-replies';
import toast from 'react-hot-toast';
import { z } from 'zod';

const createQuickReplySchema = z.object({
  shortcut: z.string().optional(),
  text: z.string().min(1, 'Message text is required'),
});

type CreateQuickReplyInput = z.infer<typeof createQuickReplySchema>;

export default function CreateQuickReply({ 
  reply,
  onSuccess 
}: { 
  reply?: QuickReply;
  onSuccess?: () => void 
}) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);

  const onSubmit: SubmitHandler<CreateQuickReplyInput> = async (data) => {
    setLoading(true);
    try {
      if (reply) {
        await quickReplyApi.update(reply.id, data);
        toast.success('Quick reply updated successfully');
      } else {
        await quickReplyApi.create(data);
        toast.success('Quick reply created successfully');
      }
      closeModal();
      onSuccess?.();
    } catch (error: any) {
      console.error('Quick reply error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save quick reply';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<CreateQuickReplyInput>
      onSubmit={onSubmit}
      validationSchema={createQuickReplySchema}
      useFormProps={{
        defaultValues: {
          shortcut: reply?.shortcut || '',
          text: reply?.text || '',
        },
      }}
      className="grid grid-cols-1 gap-6 p-6 @container [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, formState: { errors }, watch }) => {
        const shortcutValue = watch('shortcut');
        return (
          <>
            <div className="col-span-full flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                {reply ? 'Edit Quick Reply' : 'Add Quick Reply'}
              </Title>
              <ActionIcon size="sm" variant="text" onClick={closeModal}>
                <PiXBold className="h-auto w-5" />
              </ActionIcon>
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium mb-2">
                Shortcut <span className="text-gray-400">(optional)</span>
              </label>
              <Input
                prefix="/"
                placeholder="hallo"
                {...register('shortcut')}
                className="w-full"
                error={errors.shortcut?.message}
              />
              <p className="text-xs text-gray-500 mt-1">
                Type /{shortcutValue || 'shortcut'} in chat to use this quick reply
              </p>
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium mb-2">
                Message Text <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Enter your quick reply message..."
                {...register('text')}
                className="w-full"
                rows={6}
                error={errors.text?.message}
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
                {reply ? 'Update' : 'Create'}
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
