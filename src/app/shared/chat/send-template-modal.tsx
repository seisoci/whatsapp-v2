'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Select, Text, ActionIcon } from 'rizzui';
import { PiPaperPlaneTilt, PiX } from 'react-icons/pi';
import { contactsApi } from '@/lib/api/contacts';
import { chatApi, type Contact } from '@/lib/api/chat';
import { templatesApi } from '@/lib/api/templates';
import { mediaApi } from '@/lib/api/media';
import { useModal } from '@/app/shared/modal-views/use-modal';
import toast from 'react-hot-toast';

export interface SendTemplateModalProps {
  phoneNumberId: string;
  onSuccess?: (contactId: string) => void;
  initialPhoneNumber?: string;
  contacts: Contact[];
}

export default function SendTemplateModal({
  phoneNumberId,
  onSuccess,
  initialPhoneNumber = '',
  contacts = [],
}: SendTemplateModalProps) {
  const { closeModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const [entryMode, setEntryMode] = useState<'select' | 'manual'>(
    initialPhoneNumber ? 'manual' : 'select'
  );
  const [manualPhone, setManualPhone] = useState(initialPhoneNumber);
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  const [templateParams, setTemplateParams] = useState<Record<string, string>>(
    {}
  );
  const [headerMediaType, setHeaderMediaType] = useState<'url' | 'file'>('url');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [headerMediaFile, setHeaderMediaFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await templatesApi.getAll({ phoneNumberDbId: phoneNumberId });
        const data = Array.isArray(response)
          ? response
          : (response as any).data || [];
        setTemplates(data.filter((t: any) => t.status === 'APPROVED'));
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        toast.error('Failed to load templates');
      }
    };
    fetchTemplates();
  }, [phoneNumberId]);

  const handleTemplateSelect = (templateOption: any) => {
    const template = templates.find((t) => t.id === templateOption.value);
    setSelectedTemplate(template);
    setTemplateParams({});
    setHeaderMediaUrl('');
    setHeaderMediaFile(null);
  };

  const extractTemplateVariables = (text: string) => {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches.sort((a, b) => parseInt(a) - parseInt(b));
  };

  const getTemplateRequirements = () => {
    if (!selectedTemplate)
      return {
        bodyVars: [],
        footerVars: [],
        buttonVars: [],
        headerFormat: null,
      };

    const bodyComponent = selectedTemplate.components?.find(
      (c: any) => c.type === 'BODY'
    );
    const bodyVars = bodyComponent?.text
      ? extractTemplateVariables(bodyComponent.text)
      : [];

    const footerComponent = selectedTemplate.components?.find(
      (c: any) => c.type === 'FOOTER'
    );
    const footerVars = footerComponent?.text
      ? extractTemplateVariables(footerComponent.text)
      : [];

    const buttonsComponent = selectedTemplate.components?.find(
      (c: any) => c.type === 'BUTTONS'
    );
    const buttonVars: {
      index: string;
      sub_type: string;
      variables: string[];
    }[] = [];
    if (buttonsComponent && buttonsComponent.buttons) {
      buttonsComponent.buttons.forEach((btn: any, index: number) => {
        const textVars = btn.text ? extractTemplateVariables(btn.text) : [];
        const urlVars = btn.url ? extractTemplateVariables(btn.url) : [];
        const variables = Array.from(new Set([...textVars, ...urlVars]));
        if (variables.length > 0) {
          buttonVars.push({
            index: index.toString(),
            sub_type: btn.type.toLowerCase(), // e.g., 'url' or 'quick_reply'
            variables,
          });
        }
      });
    }

    const headerComponent = selectedTemplate.components?.find(
      (c: any) => c.type === 'HEADER'
    );
    const headerFormat = ['IMAGE', 'DOCUMENT', 'VIDEO'].includes(
      headerComponent?.format
    )
      ? headerComponent.format
      : null;

    return { bodyVars, footerVars, buttonVars, headerFormat };
  };

  const handleSend = async () => {
    if (entryMode === 'manual' && !manualPhone.trim()) {
      return toast.error('Please enter a phone number');
    }
    if (entryMode === 'select' && !selectedContactId) {
      return toast.error('Please select a contact');
    }
    if (!selectedTemplate) {
      return toast.error('Please select a template');
    }

    const { bodyVars, footerVars, buttonVars, headerFormat } =
      getTemplateRequirements();

    if (headerFormat) {
      if (headerMediaType === 'url' && !headerMediaUrl.trim()) {
        return toast.error(
          `Please enter a URL for the header ${headerFormat.toLowerCase()}`
        );
      }
      if (headerMediaType === 'file' && !headerMediaFile) {
        return toast.error(
          `Please select a file for the header ${headerFormat.toLowerCase()}`
        );
      }
    }

    for (const variable of bodyVars) {
      if (!templateParams[variable]) {
        return toast.error(`Please fill in body parameter {{${variable}}}`);
      }
    }

    for (const variable of footerVars) {
      if (!templateParams[`footer_${variable}`]) {
        return toast.error(`Please fill in footer parameter {{${variable}}}`);
      }
    }

    for (const btnVar of buttonVars) {
      for (const variable of btnVar.variables) {
        if (!templateParams[`button_${btnVar.index}_${variable}`]) {
          return toast.error(`Please fill in button parameter {{${variable}}}`);
        }
      }
    }

    setLoading(true);
    try {
      let targetContactId = selectedContactId;
      let targetWaId = '';

      if (entryMode === 'manual') {
        const formattedPhone = manualPhone.replace(/\D/g, '');
        const existing = contacts.find(
          (c) => c.waId === formattedPhone || c.phoneNumber === formattedPhone
        );

        if (existing) {
          targetContactId = existing.id;
          targetWaId = existing.waId;
        } else {
          const newContactRes = await contactsApi.create({
            waId: formattedPhone,
            profileName: formattedPhone,
            phoneNumberId: phoneNumberId,
          });

          const newContact = (newContactRes as any).data || newContactRes;
          targetContactId = newContact.id;
          targetWaId = newContact.waId;
        }
      }

      let components: any[] = [];
      const bodyComponent = selectedTemplate.components?.find(
        (c: any) => c.type === 'BODY'
      );

      if (headerFormat) {
        let mediaParam: any = {};
        if (headerMediaType === 'url') {
          mediaParam = { link: headerMediaUrl };
        } else if (headerMediaType === 'file' && headerMediaFile) {
          // Determine target waId for S3 path
          const targetWaId =
            entryMode === 'manual'
              ? manualPhone.replace(/\D/g, '')
              : contacts.find((c) => c.id === targetContactId)?.waId ||
                targetContactId;

          try {
            // 1) Upload to S3 for permanent storage
            const s3Res = await mediaApi.uploadToS3(
              targetWaId,
              headerMediaFile,
              headerFormat.toLowerCase()
            );
            if (!s3Res.success || !s3Res.data) {
              throw new Error('S3 upload failed');
            }

            // 2) Use the presigned URL as link so WhatsApp can fetch it
            mediaParam = { link: s3Res.data.presignedUrl };
          } catch (uploadError) {
            console.error('Failed to upload media:', uploadError);
            setLoading(false);
            return toast.error('Failed to upload media file');
          }
        }

        components.push({
          type: 'HEADER',
          parameters: [
            {
              type: headerFormat.toLowerCase(),
              [headerFormat.toLowerCase()]: mediaParam,
            },
          ],
        });
      }

      if (bodyComponent && bodyVars.length > 0) {
        const parameters = bodyVars.map((variable) => ({
          type: 'text',
          text: templateParams[variable],
        }));

        components.push({
          type: 'BODY',
          parameters,
        });
      }

      const footerComponent = selectedTemplate.components?.find(
        (c: any) => c.type === 'FOOTER'
      );
      if (footerComponent && footerVars.length > 0) {
        const parameters = footerVars.map((variable) => ({
          type: 'text',
          text: templateParams[`footer_${variable}`],
        }));

        components.push({
          type: 'FOOTER',
          parameters,
        });
      }

      for (const btnVar of buttonVars) {
        if (btnVar.variables.length > 0) {
          const parameters = btnVar.variables.map((variable) => ({
            type: 'text',
            text: templateParams[`button_${btnVar.index}_${variable}`],
          }));

          components.push({
            type: 'button',
            sub_type: btnVar.sub_type,
            index: btnVar.index,
            parameters,
          });
        }
      }

      await chatApi.sendMessage({
        contactId: targetContactId,
        phoneNumberId: phoneNumberId,
        type: 'template',
        template: {
          name: selectedTemplate.name,
          language: selectedTemplate.language,
          components: components.length > 0 ? components : undefined,
        },
      });

      toast.success('Template message sent successfully');

      if (onSuccess) {
        onSuccess(targetContactId);
      }
      closeModal();
    } catch (error: any) {
      console.error('Failed to send template:', error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to send template message'
      );
    } finally {
      setLoading(false);
    }
  };

  const { bodyVars, footerVars, buttonVars, headerFormat } =
    getTemplateRequirements();

  return (
    <div className="m-auto px-5 pt-5 pb-8 @lg:pt-6 @2xl:px-7">
      <div className="mb-6 flex items-center justify-between">
        <Text as="span" className="text-xl font-semibold">
          Send Template Message
        </Text>
        <ActionIcon size="sm" variant="text" onClick={closeModal}>
          <PiX className="h-5 w-5" />
        </ActionIcon>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left Column: Selection and Parameters */}
        <div className="space-y-5">
          <div className="space-y-3">
            <Text className="font-medium text-gray-700">Recipient</Text>
            <div className="mb-2 flex gap-2">
              <Button
                size="sm"
                variant={entryMode === 'select' ? 'solid' : 'outline'}
                onClick={() => setEntryMode('select')}
                className="flex-1"
              >
                Select Contact
              </Button>
              <Button
                size="sm"
                variant={entryMode === 'manual' ? 'solid' : 'outline'}
                onClick={() => setEntryMode('manual')}
                className="flex-1"
              >
                Manual Input
              </Button>
            </div>

            {entryMode === 'select' ? (
              <Select
                options={contacts.map((c) => ({
                  label: c.profileName
                    ? `${c.profileName} - ${c.phoneNumber}`
                    : c.phoneNumber,
                  value: c.id,
                }))}
                value={selectedContactId}
                onChange={(option: any) => setSelectedContactId(option.value)}
                getOptionDisplayValue={(option) => option.label}
                displayValue={(selected) =>
                  contacts.find((c) => c.id === selected)?.profileName
                    ? `${contacts.find((c) => c.id === selected)?.profileName} - ${contacts.find((c) => c.id === selected)?.phoneNumber}`
                    : contacts.find((c) => c.id === selected)?.phoneNumber || ''
                }
                placeholder="Search existing contacts..."
                searchable
                inPortal={false}
              />
            ) : (
              <Input
                placeholder="e.g. 6281234567890 (include country code)"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                helperText="Enter WhatsApp number with country code, no + or spaces."
              />
            )}
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-3">
            <Text className="font-medium text-gray-700">Template</Text>
            <Select
              options={templates.map((t) => ({
                label: `${t.name} (${t.language})`,
                value: t.id,
              }))}
              value={selectedTemplate?.id || ''}
              onChange={handleTemplateSelect}
              getOptionDisplayValue={(opt) => opt.label}
              displayValue={(selected) => {
                const t = templates.find((t) => t.id === selected);
                return t ? `${t.name} (${t.language})` : '';
              }}
              placeholder="Select an approved template..."
              searchable
              inPortal={false}
            />
          </div>

          {selectedTemplate &&
            (bodyVars.length > 0 ||
              footerVars.length > 0 ||
              buttonVars.length > 0 ||
              headerFormat) && (
              <div className="space-y-3 border-t border-gray-100 pt-3">
                <Text className="font-medium text-gray-700">
                  Template Parameters
                </Text>
                <div className="scrollbar-thin max-h-[250px] space-y-3 overflow-y-auto pr-2">
                  {headerFormat && (
                    <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50/50 p-3">
                      <div className="flex items-center justify-between">
                        <Text className="text-sm font-medium text-gray-700">
                          Header {headerFormat}
                        </Text>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={
                              headerMediaType === 'url' ? 'solid' : 'outline'
                            }
                            onClick={() => setHeaderMediaType('url')}
                            className="h-7 px-2 text-xs"
                          >
                            Link URL
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              headerMediaType === 'file' ? 'solid' : 'outline'
                            }
                            onClick={() => setHeaderMediaType('file')}
                            className="h-7 px-2 text-xs"
                          >
                            Upload File
                          </Button>
                        </div>
                      </div>

                      {headerMediaType === 'url' ? (
                        <Input
                          placeholder={`https://example.com/file.${
                            headerFormat.toLowerCase() === 'image'
                              ? 'jpg'
                              : headerFormat.toLowerCase() === 'video'
                                ? 'mp4'
                                : 'pdf'
                          }`}
                          value={headerMediaUrl}
                          onChange={(e) => setHeaderMediaUrl(e.target.value)}
                        />
                      ) : (
                        <div className="flex flex-col gap-2">
                          <input
                            type="file"
                            className="focus:border-primary focus:ring-primary block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-1 focus:outline-none"
                            onChange={(e: any) => {
                              if (e.target.files && e.target.files.length > 0) {
                                setHeaderMediaFile(e.target.files[0]);
                              }
                            }}
                            accept={
                              headerFormat === 'IMAGE'
                                ? 'image/*'
                                : headerFormat === 'VIDEO'
                                  ? 'video/mp4,video/3gpp'
                                  : 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                            }
                          />
                          {headerMediaFile && (
                            <Text className="text-xs text-gray-500">
                              Selected file: {headerMediaFile.name}
                            </Text>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {bodyVars.length > 0 && (
                    <div className="space-y-3">
                      <Text className="text-sm font-medium text-gray-700">
                        Body Parameters
                      </Text>
                      {bodyVars.map((variable) => (
                        <Input
                          key={`body-${variable}`}
                          label={`Value for Body {{${variable}}}`}
                          placeholder={`Value for body parameter ${variable}`}
                          value={templateParams[variable] || ''}
                          onChange={(e) =>
                            setTemplateParams({
                              ...templateParams,
                              [variable]: e.target.value,
                            })
                          }
                        />
                      ))}
                    </div>
                  )}

                  {footerVars.length > 0 && (
                    <div className="space-y-3">
                      <Text className="text-sm font-medium text-gray-700">
                        Footer Parameters
                      </Text>
                      {footerVars.map((variable) => (
                        <Input
                          key={`footer-${variable}`}
                          label={`Value for Footer {{${variable}}}`}
                          placeholder={`Value for footer parameter ${variable}`}
                          value={templateParams[`footer_${variable}`] || ''}
                          onChange={(e) =>
                            setTemplateParams({
                              ...templateParams,
                              [`footer_${variable}`]: e.target.value,
                            })
                          }
                        />
                      ))}
                    </div>
                  )}

                  {buttonVars.length > 0 && (
                    <div className="space-y-3">
                      <Text className="text-sm font-medium text-gray-700">
                        Button Parameters
                      </Text>
                      {buttonVars.map((btnVar) =>
                        btnVar.variables.map((variable) => (
                          <Input
                            key={`button-${btnVar.index}-${variable}`}
                            label={`Value for Button (Index ${btnVar.index}) {{${variable}}}`}
                            placeholder={`Value for button parameter ${variable}`}
                            value={
                              templateParams[
                                `button_${btnVar.index}_${variable}`
                              ] || ''
                            }
                            onChange={(e) =>
                              setTemplateParams({
                                ...templateParams,
                                [`button_${btnVar.index}_${variable}`]:
                                  e.target.value,
                              })
                            }
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Right Column: Preview */}
        <div className="flex flex-col pt-5 md:border-l md:border-gray-100 md:pt-0 md:pl-6">
          <Text className="mb-3 font-medium text-gray-700">Preview</Text>
          {selectedTemplate ? (
            <div className="h-full max-h-[500px] overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-4 text-sm whitespace-pre-wrap text-gray-600">
              {selectedTemplate.components?.find((c: any) => c.type === 'BODY')
                ?.text || 'No body text'}
            </div>
          ) : (
            <div className="flex h-[200px] w-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center text-sm text-gray-400">
              Select a template to view the message preview
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-5">
        <Button variant="outline" onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSend} isLoading={loading} className="gap-2">
          <PiPaperPlaneTilt className="h-4 w-4" />
          Send Template
        </Button>
      </div>
    </div>
  );
}
