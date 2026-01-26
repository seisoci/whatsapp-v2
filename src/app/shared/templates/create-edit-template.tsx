'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Controller, SubmitHandler, useForm, useFieldArray } from 'react-hook-form';
import { Button, Input, Select, Text, Textarea, Title } from 'rizzui';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { templatesApi } from '@/lib/api/templates';
import { mediaApi } from '@/lib/api/media';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
import { Template } from './index';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { routes } from '@/config/routes';
import cn from '@/utils/class-names';
import {
  PiPlusBold,
  PiTrashBold,
  PiTextBBold,
  PiTextItalicBold,
  PiTextStrikethroughBold,
  PiCodeBold,
  PiSmileyBold,
  PiChatTextBold,
  PiPhoneBold,
  PiLinkBold,
  PiChatBold,
  PiWarningCircleBold,
  PiInfoBold,
} from 'react-icons/pi';

const createTemplateSchema = z.object({
  phoneNumberId: z.string().min(1, 'Nomor telepon wajib diisi'),
  name: z
    .string()
    .min(1, 'Nama template wajib diisi')
    .max(512)
    .regex(/^[a-z0-9_]+$/, 'Nama hanya boleh huruf kecil, angka, dan garis bawah'),
  language: z.string().min(1, 'Bahasa wajib diisi'),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  headerType: z.enum(['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']),
  headerText: z.string().max(60).optional(),
  bodyText: z.string().min(1, 'Isi pesan wajib diisi').max(1024),
  footerText: z.string().max(60).optional(),
  buttons: z
    .array(
      z.object({
        type: z.enum(['QUICK_REPLY', 'URL', 'PHONE_NUMBER']),
        text: z.string().min(1, 'Teks tombol wajib diisi').max(25),
        url: z.string().optional(),
        phoneNumber: z.string().optional(),
      })
    )
    .max(10, 'Maksimal 10 tombol')
    .optional(),
}).superRefine((data, ctx) => {
  if (data.headerType === 'TEXT' && !data.headerText) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Teks judul wajib diisi jika jenis judul adalah Teks',
      path: ['headerText'],
    });
  }

  // Validate that variables are not at start or end of text
  const variableAtStartOrEnd = (text: string): boolean => {
    if (!text) return false;
    const trimmedText = text.trim();
    // Check if starts with {{number}} or ends with {{number}}
    return /^\{\{\d+\}\}/.test(trimmedText) || /\{\{\d+\}\}$/.test(trimmedText);
  };

  // Check header text
  if (data.headerType === 'TEXT' && data.headerText) {
    if (variableAtStartOrEnd(data.headerText)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Variabel tidak boleh di awal atau akhir teks. Contoh benar: "Halo {{1}}, selamat datang"',
        path: ['headerText'],
      });
    }
  }

  // Check body text
  if (data.bodyText) {
    if (variableAtStartOrEnd(data.bodyText)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Variabel tidak boleh di awal atau akhir teks. Contoh benar: "Terima kasih, {{1}} sudah berbelanja"',
        path: ['bodyText'],
      });
    }
  }
  
  if (data.buttons) {
    data.buttons.forEach((button, index) => {
      if (button.type === 'URL' && !button.url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'URL wajib diisi',
          path: ['buttons', index, 'url'],
        });
      }
      if (button.type === 'PHONE_NUMBER' && !button.phoneNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nomor telepon wajib diisi',
          path: ['buttons', index, 'phoneNumber'],
        });
      }
    });
  }
});

type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

interface CreateEditTemplateProps {
  template?: Template;
  className?: string;
}

const categoryOptions = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utilitas' },
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

const headerTypeOptions = [
  { value: 'NONE', label: 'Tidak Ada' },
  { value: 'TEXT', label: 'Teks' },
  { value: 'IMAGE', label: 'Gambar' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'DOCUMENT', label: 'Dokumen' },
];

const buttonTypeOptions = [
  {
    value: 'QUICK_REPLY',
    label: 'Balasan Cepat',
    icon: PiChatBold,
    description: 'Pelanggan dapat membalas dengan teks yang telah ditentukan',
    maxCount: 10,
  },
  {
    value: 'URL',
    label: 'Kunjungi Situs Web',
    icon: PiLinkBold,
    description: 'Membuka URL di browser pelanggan',
    maxCount: 2,
  },
  {
    value: 'PHONE_NUMBER',
    label: 'Hubungi Nomor Telepon',
    icon: PiPhoneBold,
    description: 'Melakukan panggilan ke nomor yang ditentukan',
    maxCount: 1,
  },
];

// Template Preview Card
function TemplatePreviewCard({
  name,
  language,
  category,
}: {
  name: string;
  language: string;
  category: string;
}) {
  const languageLabel =
    languageOptions.find((l) => l.value === language)?.label || language;
  const categoryLabel =
    categoryOptions.find((c) => c.value === category)?.label || category;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#008069]">
        <PiChatTextBold className="h-6 w-6 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="text-base font-semibold text-gray-900">
          {name || 'your_template_name'} • {languageLabel}
        </span>
        <span className="text-sm text-gray-500">
          {categoryLabel} • Default
        </span>
      </div>
    </div>
  );
}

// Helper function to count variables in text
function countVariables(text: string): number {
  const matches = text.match(/\{\{\d+\}\}/g);
  return matches ? matches.length : 0;
}

// Helper function to get next available variable number (finds first missing number in sequence)
function getNextVariableNumber(text: string): number {
  const matches = text.match(/\{\{(\d+)\}\}/g);
  if (!matches) return 1;

  // Extract all used numbers
  const usedNumbers = matches.map(m => parseInt(m.replace(/[{}]/g, ''))).sort((a, b) => a - b);

  // Find the first missing number in sequence starting from 1
  let nextNumber = 1;
  for (const num of usedNumbers) {
    if (num === nextNumber) {
      nextNumber++;
    } else if (num > nextNumber) {
      // Found a gap, use this number
      break;
    }
  }

  return nextNumber;
}

// Common emojis for quick selection
const commonEmojis = [
  '😀', '😊', '🙂', '😍', '🥰', '😎', '🤗', '👋',
  '👍', '👏', '🙏', '💪', '❤️', '💯', '✅', '⭐',
  '🎉', '🎊', '🔥', '💡', '📢', '📞', '💬', '📧',
];

// WhatsApp formatting syntax
const formatSyntax = {
  bold: { prefix: '*', suffix: '*', label: 'Tebal' },
  italic: { prefix: '_', suffix: '_', label: 'Miring' },
  strikethrough: { prefix: '~', suffix: '~', label: 'Coret' },
  monospace: { prefix: '```', suffix: '```', label: 'Monospace' },
};

// Function to render WhatsApp formatted text to JSX
function renderWhatsAppText(text: string): React.ReactNode {
  if (!text) return null;

  // Use placeholders WITHOUT underscores, asterisks, or tildes to avoid conflicts
  let processedText = text;

  // Replace monospace first (longest delimiter)
  processedText = processedText.replace(/```([^`]+)```/g, '\x00MONOS\x00$1\x00MONOE\x00');
  // Replace bold
  processedText = processedText.replace(/\*([^*]+)\*/g, '\x00BOLDS\x00$1\x00BOLDE\x00');
  // Replace italic
  processedText = processedText.replace(/_([^_]+)_/g, '\x00ITALICS\x00$1\x00ITALICE\x00');
  // Replace strikethrough
  processedText = processedText.replace(/~([^~]+)~/g, '\x00STRIKES\x00$1\x00STRIKEE\x00');

  // Split by placeholders
  const segments = processedText.split(/(\x00[A-Z]+\x00)/);

  let currentWrapper: ((content: string, key: number) => React.ReactNode) | null = null;
  let buffer = '';
  const result: React.ReactNode[] = [];
  let keyIdx = 0;

  segments.forEach((segment) => {
    if (segment === '\x00MONOS\x00') {
      if (buffer) result.push(buffer);
      buffer = '';
      currentWrapper = (c, k) => <code key={k} className="rounded bg-gray-200 px-1 font-mono text-xs">{c}</code>;
    } else if (segment === '\x00MONOE\x00') {
      if (currentWrapper && buffer) result.push(currentWrapper(buffer, keyIdx++));
      buffer = '';
      currentWrapper = null;
    } else if (segment === '\x00BOLDS\x00') {
      if (buffer) result.push(buffer);
      buffer = '';
      currentWrapper = (c, k) => <strong key={k} className="font-bold">{c}</strong>;
    } else if (segment === '\x00BOLDE\x00') {
      if (currentWrapper && buffer) result.push(currentWrapper(buffer, keyIdx++));
      buffer = '';
      currentWrapper = null;
    } else if (segment === '\x00ITALICS\x00') {
      if (buffer) result.push(buffer);
      buffer = '';
      currentWrapper = (c, k) => <em key={k} className="italic">{c}</em>;
    } else if (segment === '\x00ITALICE\x00') {
      if (currentWrapper && buffer) result.push(currentWrapper(buffer, keyIdx++));
      buffer = '';
      currentWrapper = null;
    } else if (segment === '\x00STRIKES\x00') {
      if (buffer) result.push(buffer);
      buffer = '';
      currentWrapper = (c, k) => <span key={k} className="line-through">{c}</span>;
    } else if (segment === '\x00STRIKEE\x00') {
      if (currentWrapper && buffer) result.push(currentWrapper(buffer, keyIdx++));
      buffer = '';
      currentWrapper = null;
    } else {
      buffer += segment;
    }
  });

  if (buffer) result.push(buffer);

  return result.length > 0 ? result : text;
}

export default function CreateEditTemplate({
  template,
  className,
}: CreateEditTemplateProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Media upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedMediaHandle, setUploadedMediaHandle] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  // Helper to extract initial values from existing template components
  const getInitialValues = () => {
    const headerComp = template?.components?.find((c) => c.type === 'HEADER');
    const bodyComp = template?.components?.find((c) => c.type === 'BODY');
    const footerComp = template?.components?.find((c) => c.type === 'FOOTER');
    const buttonsComp = template?.components?.find((c) => c.type === 'BUTTONS');

    let headerType = 'NONE';
    if (headerComp) {
      headerType = headerComp.format || 'TEXT';
    }

    return {
      phoneNumberId: template?.phoneNumberId || '',
      name: template?.name || '',
      language: template?.language || 'en',
      category: template?.category || 'UTILITY',
      headerType: headerType as 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT',
      headerText: headerComp?.text || '',
      bodyText: bodyComp?.text || '',
      footerText: footerComp?.text || '',
      buttons:
        buttonsComp?.buttons?.map((b) => ({
          type: b.type,
          text: b.text,
          url: b.url,
          phoneNumber: b.phone_number,
        })) || [],
    };
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateTemplateInput>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: getInitialValues(),
  });

  // Debug form errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Form validation errors:', errors);
      toast.error('Please check the form for errors');
    }
  }, [errors]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'buttons',
  });

  const watchName = watch('name');
  const watchLanguage = watch('language');
  const watchCategory = watch('category');
  const watchHeaderType = watch('headerType');
  const watchHeaderText = watch('headerText');
  const watchBodyText = watch('bodyText');
  const watchFooterText = watch('footerText');
  const watchButtons = watch('buttons');

  // Calculate button counts by type
  const buttonCounts = {
    QUICK_REPLY: watchButtons?.filter(b => b.type === 'QUICK_REPLY').length || 0,
    URL: watchButtons?.filter(b => b.type === 'URL').length || 0,
    PHONE_NUMBER: watchButtons?.filter(b => b.type === 'PHONE_NUMBER').length || 0,
  };

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const fetchPhoneNumbers = async () => {
    try {
      const response = await phoneNumbersApi.getAll();
      if (response.success && response.data) {
        const data = response.data as unknown;
        setPhoneNumbers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    }
  };

  // File validation helper
  const validateFile = (file: File, headerType: string): { valid: boolean; error?: string } => {
    const validations: Record<string, { types: string[]; maxSize: number; label: string }> = {
      IMAGE: {
        types: ['image/jpeg', 'image/png'],
        maxSize: 5 * 1024 * 1024,
        label: 'IMAGE (JPG, PNG, max 5MB)',
      },
      VIDEO: {
        types: ['video/mp4', 'video/3gpp'],
        maxSize: 16 * 1024 * 1024,
        label: 'VIDEO (MP4, 3GP, max 16MB)',
      },
      DOCUMENT: {
        types: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
        maxSize: 100 * 1024 * 1024,
        label: 'DOCUMENT (PDF, DOC, XLS, PPT, max 100MB)',
      },
    };

    const validation = validations[headerType];
    if (!validation) return { valid: false, error: 'Tipe header tidak valid' };
    if (!validation.types.includes(file.type)) {
      return { valid: false, error: `File harus bertipe ${validation.label}` };
    }
    if (file.size > validation.maxSize) {
      const maxSizeMB = Math.round(validation.maxSize / (1024 * 1024));
      return { valid: false, error: `Ukuran file maksimal ${maxSizeMB}MB` };
    }
    return { valid: true };
  };

  // Handle file selection (validate and save temporarily)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, watchHeaderType);
    if (!validation.valid) {
      toast.error(validation.error || 'File tidak valid');
      event.target.value = '';
      return;
    }

    // Save file temporarily
    setSelectedFile(file);
    
    // Generate preview for images
    if (watchHeaderType === 'IMAGE') {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setMediaPreviewUrl(null);
    }

    toast.success('File siap diupload saat template dibuat');
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadedMediaHandle(null);
    setMediaPreviewUrl(null);
  };


  const onSubmit: SubmitHandler<CreateTemplateInput> = async (data) => {
    setIsLoading(true);
    try {
      const components: any[] = [];

      // Helper to generate examples
      const generateExamples = (text: string, count: number) => {
        return Array.from({ length: count }, (_, i) => `Variable ${i + 1}`);
      };

      // Check if we're editing and header type changed
      const originalHeader = template?.components?.find((c) => c.type === 'HEADER');
      const isEditingWithMediaHeader = template && originalHeader && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(originalHeader.format || '');
      const headerTypeChanged = template && originalHeader && originalHeader.format !== data.headerType;

      // Header handling
      if (data.headerType !== 'NONE') {
        const headerVars = countVariables(data.headerText || '');
        const headerComponent: any = {
          type: 'HEADER',
          format: data.headerType,
          text: data.headerType === 'TEXT' ? data.headerText : undefined,
        };

        if (data.headerType === 'TEXT' && headerVars > 0) {
          headerComponent.example = {
            header_text: [generateExamples(data.headerText || '', headerVars)],
          };
        } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(data.headerType)) {
          if (!template) {
            // Creating NEW template with media header - require selected file
            if (!selectedFile) {
              toast.error('Silakan pilih sample file terlebih dahulu untuk header media.', { duration: 5000 });
              setIsLoading(false);
              return;
            }
            // Backend will handle upload and setting the header example
            console.log('Media file selected for new template, will be uploaded by backend');
          } else {
            // We're EDITING an existing template
            if (originalHeader && originalHeader.format === data.headerType) {
              // Same media type - preserve original example/handle
              headerComponent.example = originalHeader.example;
              console.log('Preserving original media header example:', headerComponent.example);
            } else if (headerTypeChanged) {
              // User tried to change header type from one to another
              toast.error(
                'Tidak bisa mengubah tipe header saat edit template. ' +
                'Header akan dipertahankan, hanya body/footer/buttons yang diupdate.',
                { duration: 5000 }
              );
              // Use original header instead of the new one
              if (originalHeader) {
                components.push(originalHeader);
              }
            } else {
              // Editing template but something is wrong with original header
              console.warn('Editing template with media type but no matching original header found', {
                dataHeaderType: data.headerType,
                originalHeaderFormat: originalHeader?.format
              });
              // Try to preserve whatever we have
              if (originalHeader?.example) {
                headerComponent.example = originalHeader.example;
              }
            }
          }
        }
        
        // Only push if we haven't already pushed originalHeader due to type change
        if (!headerTypeChanged || data.headerType === 'TEXT') {
          components.push(headerComponent);
        }
      } else if (originalHeader) {
        // User selected NONE but original template has header - preserve it
        console.log('Preserving original header (user selected NONE):', originalHeader);
        components.push(originalHeader);
      }

      // Body
      const bodyVars = countVariables(data.bodyText);
      const bodyComponent: any = {
        type: 'BODY',
        text: data.bodyText,
      };

      if (bodyVars > 0) {
        bodyComponent.example = {
          body_text: [generateExamples(data.bodyText, bodyVars)],
        };
      }

      components.push(bodyComponent);

      // Footer
      if (data.footerText) {
        components.push({
          type: 'FOOTER',
          text: data.footerText,
        });
      }

      // Buttons
      if (data.buttons && data.buttons.length > 0) {
        const buttonsConfig: any = {
          type: 'BUTTONS',
          buttons: data.buttons.map((b) => {
            const button: any = {
              type: b.type,
              text: b.text,
            };
            if (b.type === 'URL') button.url = b.url;
            if (b.type === 'PHONE_NUMBER') button.phone_number = b.phoneNumber;
            return button;
          }),
        };
        components.push(buttonsConfig);
      }

      const templateData = {
        phoneNumberId: data.phoneNumberId,
        name: data.name,
        language: data.language,
        category: data.category,
        components,
      };

      console.log('Sending template data:', JSON.stringify(templateData, null, 2));

      const response = template
        ? await templatesApi.update(template.id, { ...templateData })
        : await templatesApi.create(templateData, selectedFile || undefined);

      if (response.success) {
        const successMessage = template
          ? (isEditingWithMediaHeader 
              ? 'Template berhasil diupdate! (Header media dipertahankan, hanya body/footer/buttons yang diupdate)' 
              : 'Template berhasil diupdate!')
          : 'Template berhasil dibuat!';
        toast.success(successMessage, { duration: 4000 });
        router.push(routes.templates.dashboard);
      } else {
        toast.error(response.message || 'Gagal menyimpan template');
      }
    } catch (error: any) {
      console.error('Save template error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Gagal menyimpan template';
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  // Insert variable into body text at cursor position
  const handleAddBodyVariable = () => {
    const textarea = bodyTextareaRef.current;
    const currentText = getValues('bodyText') || '';
    const nextVarNum = getNextVariableNumber(currentText);
    const variable = `{{${nextVarNum}}}`;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = currentText.substring(0, start) + variable + currentText.substring(end);
      setValue('bodyText', newText);

      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setValue('bodyText', currentText + variable);
    }

    toast.success(`Variabel ${variable} ditambahkan`);
  };

  // Insert variable into header text at cursor position
  const handleAddHeaderVariable = () => {
    const input = headerInputRef.current;
    const currentText = getValues('headerText') || '';
    const nextVarNum = getNextVariableNumber(currentText);
    const variable = `{{${nextVarNum}}}`;

    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newText = currentText.substring(0, start) + variable + currentText.substring(end);
      setValue('headerText', newText);

      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setValue('headerText', currentText + variable);
    }

    toast.success(`Variabel ${variable} ditambahkan`);
  };

  // Apply text formatting (bold, italic, strikethrough, monospace)
  const handleFormatText = (formatType: keyof typeof formatSyntax) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const currentText = getValues('bodyText') || '';
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentText.substring(start, end);
    const format = formatSyntax[formatType];

    let newText: string;
    let newCursorPos: number;

    if (selectedText) {
      // Wrap selected text with formatting
      newText =
        currentText.substring(0, start) +
        format.prefix +
        selectedText +
        format.suffix +
        currentText.substring(end);
      newCursorPos = start + format.prefix.length + selectedText.length + format.suffix.length;
    } else {
      // Insert formatting at cursor position with placeholder
      const placeholder = format.label;
      newText =
        currentText.substring(0, start) +
        format.prefix +
        placeholder +
        format.suffix +
        currentText.substring(end);
      // Select the placeholder text for easy replacement
      newCursorPos = start + format.prefix.length;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos + placeholder.length);
      }, 0);
      setValue('bodyText', newText);
      return;
    }

    setValue('bodyText', newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Insert emoji at cursor position
  const handleInsertEmoji = (emoji: string) => {
    const textarea = bodyTextareaRef.current;
    const currentText = getValues('bodyText') || '';

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = currentText.substring(0, start) + emoji + currentText.substring(end);
      setValue('bodyText', newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setValue('bodyText', currentText + emoji);
    }

    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if button type can be added
  const canAddButtonType = (type: string): boolean => {
    const limits: Record<string, number> = {
      QUICK_REPLY: 10,
      URL: 2,
      PHONE_NUMBER: 1,
    };
    return (buttonCounts[type as keyof typeof buttonCounts] || 0) < limits[type];
  };

  // Get available button types
  const getAvailableButtonTypes = () => {
    return buttonTypeOptions.filter(opt => canAddButtonType(opt.value));
  };

  return (
    <div className={cn('grid grid-cols-1 gap-6 lg:grid-cols-3', className)}>
      {/* Main Content - Form */}
      <div className="space-y-6 lg:col-span-2">
        {/* Template Preview Card */}
        <TemplatePreviewCard
          name={watchName}
          language={watchLanguage}
          category={watchCategory}
        />

        <form
          id="template-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Phone Number Selection */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <Title as="h4" className="mb-4 text-base font-semibold">
              Nomor Telepon
            </Title>
            <Controller
              name="phoneNumberId"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Pilih nomor telepon"
                  placeholder="Pilih nomor telepon"
                  options={phoneNumbers.map((p) => ({
                    value: p.phoneNumberId,
                    label: p.name || p.displayPhoneNumber || p.phoneNumberId,
                  }))}
                  value={value}
                  onChange={onChange}
                  error={errors.phoneNumberId?.message}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected) =>
                    phoneNumbers.find((p) => p.phoneNumberId === selected)
                      ?.name ||
                    phoneNumbers.find((p) => p.phoneNumberId === selected)
                      ?.displayPhoneNumber ||
                    selected
                  }
                  disabled={!!template}
                />
              )}
            />
            {errors.phoneNumberId && (
               <Text className="mt-1 text-xs text-red-500">{errors.phoneNumberId.message}</Text>
            )}
          </div>

          {/* Template Name and Language Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <Title as="h4" className="mb-4 text-base font-semibold">
              Nama dan bahasa template
            </Title>
            <div className="space-y-5">
              <div>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Beri nama template Anda
                </Text>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        type="text"
                        label="Nama template pesan"
                        placeholder="masukkan_nama_template"
                        error={errors.name?.message}
                        disabled={!!template}
                        maxLength={512}
                        onChange={(e) => {
                          // Force snake_case
                          const val = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                          field.onChange(val);
                        }}
                      />
                      <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                        {field.value?.length || 0}/512
                      </span>
                    </div>
                  )}
                />
                {errors.name && (
                  <Text className="mt-1 text-xs text-red-500">
                    Anda perlu memasukkan nama template Anda.
                  </Text>
                )}
              </div>

              <div>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Pilih bahasa
                </Text>
                <Controller
                  name="language"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Select
                      label="Bahasa"
                      placeholder="Pilih bahasa"
                      options={languageOptions}
                      value={value}
                      onChange={onChange}
                      error={errors.language?.message}
                      getOptionValue={(option) => option.value}
                      displayValue={(selected) =>
                        languageOptions.find((option) => option.value === selected)
                          ?.label ?? ''
                      }
                      disabled={!!template}
                    />
                  )}
                />
              </div>

              <Controller
                name="category"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="Kategori"
                    placeholder="Pilih kategori"
                    options={categoryOptions}
                    value={value}
                    onChange={onChange}
                    error={errors.category?.message}
                    getOptionValue={(option) => option.value}
                    displayValue={(selected) =>
                      categoryOptions.find((option) => option.value === selected)
                        ?.label ?? ''
                    }
                    disabled={!!template}
                  />
                )}
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <Title as="h4" className="mb-2 text-base font-semibold">
              Konten
            </Title>
            <Text className="mb-6 text-sm text-gray-500">
              Tambahkan header, isi, dan footer untuk template Anda. Cloud API
              yang dihosting oleh Meta akan meninjau variabel template dan
              konten untuk melindungi keamanan dan integritas layanan kami.
            </Text>

            <div className="space-y-6">
              {/* Header Type */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Text className="text-sm font-medium text-gray-700">
                    Sampel media
                  </Text>
                  <Text className="text-sm text-gray-400">• Opsional</Text>
                </div>
                <Controller
                  name="headerType"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Select
                      label="Jenis judul"
                      options={headerTypeOptions}
                      value={value}
                      onChange={onChange}
                      getOptionValue={(option) => option.value}
                      displayValue={(selected) =>
                        headerTypeOptions.find(
                          (option) => option.value === selected
                        )?.label ?? ''
                      }
                      error={errors.headerType?.message}
                    />
                  )}
                />
              </div>

              {/* Media Upload (if IMAGE/VIDEO/DOCUMENT type selected) */}
              {!template && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(watchHeaderType) && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Text className="text-sm font-medium text-gray-700">
                      Sample Media File *
                    </Text>
                    <Text className="text-xs text-gray-500">
                      ({watchHeaderType === 'IMAGE' ? 'JPG/PNG, max 5MB' : 
                        watchHeaderType === 'VIDEO' ? 'MP4/3GP, max 16MB' : 
                        'PDF/DOC/XLS/PPT, max 100MB'})
                    </Text>
                  </div>

                  {!selectedFile ? (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:border-gray-400 hover:bg-gray-100">
                      <svg className="mb-3 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <Text className="mb-2 text-sm font-medium text-gray-700">
                        Klik untuk upload file
                      </Text>
                      <Text className="text-xs text-gray-500">
                        atau drag and drop file di sini
                      </Text>
                      <input
                        type="file"
                        className="hidden"
                        accept={
                          watchHeaderType === 'IMAGE' ? 'image/jpeg,image/png' :
                          watchHeaderType === 'VIDEO' ? 'video/mp4,video/3gpp' :
                          'application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
                        }
                        onChange={handleFileUpload}
                        disabled={uploadingMedia}
                      />
                    </label>
                  ) : (
                    <div className="rounded-lg bg-gray-50 p-4">
                      {/* Preview for images */}
                      {mediaPreviewUrl && watchHeaderType === 'IMAGE' && (
                        <div className="mb-3">
                          <img 
                            src={mediaPreviewUrl} 
                            alt="Preview" 
                            className="h-32 w-auto rounded-lg object-cover"
                          />
                        </div>
                      )}
                      
                      {/* File info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <Text className="text-sm font-medium text-gray-900">
                              {selectedFile.name}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              {uploadedMediaHandle && ' • ✓ Uploaded'}
                            </Text>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearFile}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                          disabled={uploadingMedia}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Upload status */}
                      {uploadingMedia && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Uploading...</span>
                        </div>
                      )}
                      {uploadedMediaHandle && !uploadingMedia && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>File uploaded successfully</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Header Text (if TEXT type selected) */}
              {watchHeaderType === 'TEXT' && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Text className="text-sm font-medium text-gray-700">
                      Judul
                    </Text>
                    <Text className="text-sm text-gray-400">• Opsional</Text>
                  </div>
                  <Controller
                    name="headerText"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <Input
                          {...field}
                          ref={headerInputRef}
                          label="Teks judul"
                          placeholder="Tambahkan baris teks pendek ke bagian judul pesan Anda"
                          error={errors.headerText?.message}
                          maxLength={60}
                        />
                        <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                          {field.value?.length || 0}/60
                        </span>
                      </div>
                    )}
                  />
                  <div className="mt-2 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleAddHeaderVariable}
                      className="flex items-center gap-1 text-xs font-medium text-[#008069] hover:text-[#006653]"
                    >
                      <PiPlusBold className="h-3 w-3" />
                      Tambahkan variabel
                    </button>
                    {countVariables(watchHeaderText || '') > 0 && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        {countVariables(watchHeaderText || '')} variabel
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Body Text */}
              <div>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Isi
                </Text>
                <Controller
                  name="bodyText"
                  control={control}
                  render={({ field }) => (
                    <div className="rounded-lg border border-gray-300 focus-within:border-[#008069] focus-within:ring-1 focus-within:ring-[#008069]">
                      <textarea
                        {...field}
                        ref={bodyTextareaRef}
                        placeholder="Masukkan teks"
                        rows={6}
                        maxLength={1024}
                        className="w-full resize-none rounded-t-lg border-0 p-3 text-sm focus:outline-none focus:ring-0"
                      />
                      <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2">
                        <div className="relative flex items-center gap-1">
                          {/* Emoji Button with Picker */}
                          <div className="relative" ref={emojiPickerRef}>
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className={cn(
                                'rounded p-1.5 transition-colors',
                                showEmojiPicker
                                  ? 'bg-[#008069] text-white'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                              )}
                              title="Tambahkan emoji"
                            >
                              <PiSmileyBold className="h-4 w-4" />
                            </button>
                            {/* Emoji Picker Dropdown */}
                            {showEmojiPicker && (
                              <div className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                                <div className="mb-2 text-xs font-medium text-gray-500">
                                  Pilih Emoji
                                </div>
                                <div className="grid grid-cols-8 gap-1">
                                  {commonEmojis.map((emoji, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleInsertEmoji(emoji)}
                                      className="flex h-7 w-7 items-center justify-center rounded text-lg hover:bg-gray-100"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFormatText('bold')}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="Tebal (*teks*)"
                          >
                            <PiTextBBold className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatText('italic')}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="Miring (_teks_)"
                          >
                            <PiTextItalicBold className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatText('strikethrough')}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="Coret (~teks~)"
                          >
                            <PiTextStrikethroughBold className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatText('monospace')}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="Monospace (```teks```)"
                          >
                            <PiCodeBold className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleAddBodyVariable}
                            className="flex items-center gap-1 text-xs font-medium text-[#008069] hover:text-[#006653]"
                          >
                            <PiPlusBold className="h-3 w-3" />
                            Tambahkan variabel
                          </button>
                          <span className="text-xs text-gray-400">
                            {field.value?.length || 0}/1024
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                />
                {countVariables(watchBodyText || '') > 0 && (
                  <div className="mt-2">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      {countVariables(watchBodyText || '')} variabel digunakan
                    </span>
                  </div>
                )}
                {errors.bodyText && (
                  <Text className="mt-1 text-xs text-red-500">
                    {errors.bodyText.message}
                  </Text>
                )}
              </div>

              {/* Footer Text */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Text className="text-sm font-medium text-gray-700">
                    Catatan kaki
                  </Text>
                  <Text className="text-sm text-gray-400">• Opsional</Text>
                </div>
                <Controller
                  name="footerText"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        label="Catatan Kaki Template Pesan"
                        placeholder="Masukkan teks"
                        error={errors.footerText?.message}
                        maxLength={60}
                      />
                      <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                        {field.value?.length || 0}/60
                      </span>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Buttons Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Title as="h4" className="text-base font-semibold">
                Tombol
              </Title>
              <Text className="text-sm text-gray-400">• Opsional</Text>
            </div>
            <Text className="mb-4 text-sm text-gray-500">
              Buat tombol yang memungkinkan pelanggan menanggapi pesan Anda atau
              mengambil tindakan.
            </Text>

            {/* Button Rules Info */}
            <div className="mb-4 rounded-lg bg-blue-50 p-3">
              <div className="flex items-start gap-2">
                <PiInfoBold className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                <div className="text-xs text-blue-800">
                  <p className="mb-1 font-medium">Aturan tombol:</p>
                  <ul className="list-inside list-disc space-y-0.5">
                    <li>Maksimal <strong>10 tombol</strong> total</li>
                    <li>Maksimal <strong>2 tombol URL</strong> (Kunjungi Situs Web)</li>
                    <li>Maksimal <strong>1 tombol Nomor Telepon</strong></li>
                    <li>Teks tombol maksimal <strong>25 karakter</strong></li>
                    <li>Jika lebih dari 3 tombol, akan ditampilkan dalam daftar</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Button Count Summary */}
            {(watchButtons?.length || 0) > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {buttonCounts.QUICK_REPLY > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    <PiChatBold className="h-3 w-3" />
                    Balasan Cepat: {buttonCounts.QUICK_REPLY}/10
                  </span>
                )}
                {buttonCounts.URL > 0 && (
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                    buttonCounts.URL >= 2 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
                  )}>
                    <PiLinkBold className="h-3 w-3" />
                    URL: {buttonCounts.URL}/2
                  </span>
                )}
                {buttonCounts.PHONE_NUMBER > 0 && (
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                    buttonCounts.PHONE_NUMBER >= 1 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
                  )}>
                    <PiPhoneBold className="h-3 w-3" />
                    Telepon: {buttonCounts.PHONE_NUMBER}/1
                  </span>
                )}
              </div>
            )}

            <div className="space-y-4">
              {fields.map((item, index) => {
                const buttonType = watchButtons?.[index]?.type;
                const typeInfo = buttonTypeOptions.find(t => t.value === buttonType);
                const TypeIcon = typeInfo?.icon || PiChatBold;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-gray-600" />
                        <Text className="font-medium">Tombol {index + 1}</Text>
                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
                          {typeInfo?.label}
                        </span>
                      </div>
                      <Button
                        variant="text"
                        color="danger"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <PiTrashBold className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <Controller
                        name={`buttons.${index}.type` as const}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            label="Jenis Tombol"
                            options={buttonTypeOptions.map(opt => ({
                              ...opt,
                              disabled: !canAddButtonType(opt.value) && opt.value !== value,
                            }))}
                            value={value}
                            onChange={onChange}
                            getOptionValue={(option) => option.value}
                            displayValue={(selected) =>
                              buttonTypeOptions.find((o) => o.value === selected)
                                ?.label ?? ''
                            }
                          />
                        )}
                      />

                      <Controller
                        name={`buttons.${index}.text` as const}
                        control={control}
                        render={({ field }) => (
                          <div className="relative">
                            <Input
                              {...field}
                              label="Teks Tombol"
                              placeholder="Masukkan teks tombol"
                              error={errors.buttons?.[index]?.text?.message}
                              maxLength={25}
                            />
                            <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                              {field.value?.length || 0}/25
                            </span>
                          </div>
                        )}
                      />

                      {/* URL field for URL type */}
                      {buttonType === 'URL' && (
                        <Controller
                          name={`buttons.${index}.url` as const}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="URL Situs Web"
                              placeholder="https://example.com"
                              error={errors.buttons?.[index]?.url?.message}
                              prefix={<PiLinkBold className="h-4 w-4 text-gray-400" />}
                            />
                          )}
                        />
                      )}

                      {/* Phone number field for PHONE_NUMBER type */}
                      {buttonType === 'PHONE_NUMBER' && (
                        <Controller
                          name={`buttons.${index}.phoneNumber` as const}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="Nomor Telepon"
                              placeholder="+62812345678"
                              error={errors.buttons?.[index]?.phoneNumber?.message}
                              prefix={<PiPhoneBold className="h-4 w-4 text-gray-400" />}
                            />
                          )}
                        />
                      )}
                    </div>

                    {/* Button type description */}
                    <Text className="text-xs text-gray-500">
                      {typeInfo?.description}
                    </Text>
                  </div>
                );
              })}

              {/* Add Button Options */}
              {(watchButtons?.length || 0) < 10 ? (
                <div className="space-y-2">
                  <Text className="text-xs font-medium text-gray-600">
                    Tambahkan tombol:
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {buttonTypeOptions.map((opt) => {
                      const canAdd = canAddButtonType(opt.value);
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={!canAdd}
                          onClick={() =>
                            append({
                              type: opt.value as 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER',
                              text: '',
                              url: '',
                              phoneNumber: '',
                            })
                          }
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                            canAdd
                              ? 'border-gray-300 bg-white text-gray-700 hover:border-[#008069] hover:text-[#008069]'
                              : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {opt.label}
                          {!canAdd && (
                            <span className="ml-1 text-[10px] text-gray-400">
                              (maks)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                  <PiWarningCircleBold className="h-4 w-4" />
                  Anda telah mencapai batas maksimum 10 tombol.
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 pb-8">
          <Button
            variant="outline"
            onClick={() => router.push(routes.templates.dashboard)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading} form="template-form">
            {template ? 'Perbarui Template' : 'Buat Template'}
          </Button>
        </div>
      </div>

      {/* Right Sidebar - Preview */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <Title as="h4" className="mb-4 text-base font-semibold">
            Pratinjau
          </Title>
          <div className="flex justify-center w-full">
            <div className="w-full overflow-hidden rounded-2xl border border-gray-300 bg-[#e5ddd5] shadow-md dark:bg-[#0b141a] dark:border-gray-700">
              <div className="bg-[#008069] p-3 text-white">
                <div className="text-sm font-medium">WhatsApp Business</div>
              </div>
              <div className="p-4 min-h-[300px] bg-[url('https://static.whatsapp.net/rsrc.php/v3/yO/r/FSaypKp-ljf.png')] bg-repeat">
                <div className="bg-white rounded-lg shadow-sm max-w-full relative dark:bg-[#202c33] dark:text-gray-100 flex flex-col">
                    {/* Header Preview */}
                    {watchHeaderType !== 'NONE' && (
                      <div className="p-1 pb-0">
                        {watchHeaderType === 'TEXT' && watchHeaderText && (
                          <div className="px-2 pt-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                            {renderWhatsAppText(watchHeaderText)}
                          </div>
                        )}
                        {watchHeaderType === 'IMAGE' && (
                          <div className="flex h-32 w-full items-center justify-center rounded-md bg-gray-200 text-xs text-gray-500">
                            Gambar Header
                          </div>
                        )}
                        {watchHeaderType === 'VIDEO' && (
                          <div className="flex h-32 w-full items-center justify-center rounded-md bg-gray-200 text-xs text-gray-500">
                            Video Header
                          </div>
                        )}
                        {watchHeaderType === 'DOCUMENT' && (
                          <div className="flex h-16 w-full items-center justify-center rounded-md bg-gray-200 text-xs text-gray-500">
                            Dokumen Header
                          </div>
                        )}
                      </div>
                    )}

                    {/* Body Preview */}
                    <div className="px-3 py-2">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-100">
                        {watchBodyText ? renderWhatsAppText(watchBodyText) : 'Pesan Anda akan muncul di sini...'}
                      </div>
                      {watchFooterText && (
                        <p className="mt-1 text-xs text-gray-500">
                          {watchFooterText}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end px-2 pb-1">
                      <span className="text-[10px] text-gray-500">
                        {new Date().toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Buttons Preview */}
                  {watchButtons && watchButtons.length > 0 && (
                    <div className="mt-1 flex max-w-[90%] flex-col gap-1">
                      {watchButtons.map((btn, idx) => (
                        <div
                          key={idx}
                          className="cursor-pointer rounded-lg bg-white py-2 text-center text-sm font-medium text-[#00a884] shadow-sm hover:bg-gray-50"
                        >
                          {btn.type === 'PHONE_NUMBER' && '📞 '}
                          {btn.type === 'URL' && '🔗 '}
                          {btn.text || 'Tombol'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
