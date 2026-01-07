'use client';

import { useState, useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Button, Input, Select, Text, Textarea } from 'rizzui';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { templatesApi } from '@/lib/api/templates';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
import { Template } from './index';
import toast from 'react-hot-toast';

const createTemplateSchema = z.object({
  phoneNumberId: z.string().min(1, 'Phone number is required'),
  name: z.string().min(1, 'Template name is required').max(512),
  language: z.string().min(1, 'Language is required'),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  bodyText: z.string().min(1, 'Body text is required'),
});

type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

interface CreateEditTemplateProps {
  template?: Template;
  onSuccess?: () => void;
  onClose?: () => void;
}

const categoryOptions = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'AUTHENTICATION', label: 'Authentication' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'en_US', label: 'English (US)' },
  { value: 'id', label: 'Indonesian' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt_BR', label: 'Portuguese (Brazil)' },
  { value: 'zh_CN', label: 'Chinese (Simplified)' },
];

export default function CreateEditTemplate({
  template,
  onSuccess,
  onClose,
}: CreateEditTemplateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTemplateInput>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      phoneNumberId: template?.phoneNumberId || '',
      name: template?.name || '',
      language: template?.language || 'en_US',
      category: template?.category || 'UTILITY',
      bodyText: template?.components?.find(c => c.type === 'BODY')?.text || '',
    },
  });

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const fetchPhoneNumbers = async () => {
    try {
      const response = await phoneNumbersApi.getAll();
      if (response.success && response.data) {
        setPhoneNumbers(response.data);
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    }
  };

  const onSubmit: SubmitHandler<CreateTemplateInput> = async (data) => {
    setIsLoading(true);
    try {
      const templateData = {
        phoneNumberId: data.phoneNumberId,
        name: data.name,
        language: data.language,
        category: data.category,
        components: [
          {
            type: 'BODY',
            text: data.bodyText,
          },
        ],
      };

      const response = template
        ? await templatesApi.update(template.id, { ...templateData })
        : await templatesApi.create(templateData);

      if (response.success) {
        toast.success(template ? 'Template updated successfully!' : 'Template created successfully!');
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(response.message || 'Failed to save template');
      }
    } catch (error: any) {
      console.error('Save template error:', error);
      toast.error(error.response?.data?.message || 'Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className= "m-auto p-6" >
    <Text className="mb-6 text-lg font-semibold" >
      { template? 'Edit Template': 'Create New Template' }
      </Text>

      < form onSubmit = { handleSubmit(onSubmit) } className = "space-y-5" >
        <Controller
          name="phoneNumberId"
  control = { control }
  render = {({ field: { onChange, value } }) => (
    <Select
              label= "Phone Number"
  placeholder = "Select phone number"
  options = {
    phoneNumbers.map(p => ({
      value: p.phoneNumberId,
      label: p.name || p.displayPhoneNumber || p.phoneNumberId,
    }))
  }
  value = { value }
  onChange = { onChange }
  error = { errors.phoneNumberId?.message }
  getOptionValue = {(option) => option.value
}
displayValue = {(selected) =>
phoneNumbers.find((p) => p.phoneNumberId === selected)?.name ||
  phoneNumbers.find((p) => p.phoneNumberId === selected)?.displayPhoneNumber ||
  selected
              }
disabled = {!!template}
            />
          )}
        />

  < Controller
name = "name"
control = { control }
render = {({ field }) => (
  <Input
              { ...field }
              type = "text"
label = "Template Name"
placeholder = "Enter template name (lowercase, no spaces)"
error = { errors.name?.message }
disabled = {!!template}
            />
          )}
        />

  < Controller
name = "language"
control = { control }
render = {({ field: { onChange, value } }) => (
  <Select
              label= "Language"
placeholder = "Select language"
options = { languageOptions }
value = { value }
onChange = { onChange }
error = { errors.language?.message }
getOptionValue = {(option) => option.value}
displayValue = {(selected) =>
languageOptions.find((option) => option.value === selected)?.label ?? ''
              }
disabled = {!!template}
            />
          )}
        />

  < Controller
name = "category"
control = { control }
render = {({ field: { onChange, value } }) => (
  <Select
              label= "Category"
placeholder = "Select category"
options = { categoryOptions }
value = { value }
onChange = { onChange }
error = { errors.category?.message }
getOptionValue = {(option) => option.value}
displayValue = {(selected) =>
categoryOptions.find((option) => option.value === selected)?.label ?? ''
              }
disabled = {!!template}
            />
          )}
        />

  < Controller
name = "bodyText"
control = { control }
render = {({ field }) => (
  <Textarea
              { ...field }
              label = "Message Body"
placeholder = "Enter your message template text..."
error = { errors.bodyText?.message }
rows = { 6}
  />
          )}
        />

  < div className = "rounded-lg bg-blue-50 p-4" >
    <Text className="text-sm text-blue-800" >
      <strong>Note: </strong> Templates must be approved by WhatsApp before they can be used.
            This process may take up to 24 hours.
          </Text>
  </div>

  < div className = "flex justify-end gap-3 pt-3" >
    <Button variant="outline" onClick = { onClose } disabled = { isLoading } >
      Cancel
      </Button>
      < Button type = "submit" isLoading = { isLoading } >
        { template? 'Update Template': 'Create Template' }
        </Button>
        </div>
        </form>
        </div>
  );
}
