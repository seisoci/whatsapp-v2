'use client';

import { Modal, Button, Text, ActionIcon } from 'rizzui';
import { PiXBold, PiCopyBold, PiCheckBold } from 'react-icons/pi';
import { Template } from '.';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface WebhookExampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

export default function WebhookExampleModal({
  isOpen,
  onClose,
  template,
}: WebhookExampleModalProps) {
  const [copied, setCopied] = useState(false);

  if (!template) return null;

  const generatePayload = () => {
    const components = [];

    // Header Parameters
    const header = template.components.find((c) => c.type === 'HEADER');
    if (header) {
      if (header.format === 'IMAGE' || header.format === 'VIDEO' || header.format === 'DOCUMENT') {
        components.push({
          type: 'header',
          parameters: [
            {
              type: header.format.toLowerCase(),
              [header.format.toLowerCase()]: {
                link: header.format === 'DOCUMENT' ? 'https://example.com/document.pdf' : 'https://example.com/media.jpg',
                filename: header.format === 'DOCUMENT' ? 'document.pdf' : undefined,
              },
            },
          ],
        });
      } else if (header.format === 'TEXT' && header.text?.includes('{{1}}')) {
           // Simple check for 1 variable in header
           components.push({
               type: 'header',
                parameters: [
                    { type: 'text', text: 'Header Variable' }
                ]
           });
      }
    }

    // Body Parameters
    const body = template.components.find((c) => c.type === 'BODY');
    if (body && body.text) {
      // enhanced regex to find max variable index {{n}}
      const matches = body.text.match(/\{\{(\d+)\}\}/g);
      if (matches) {
        const params = matches.map((_, i) => ({
          type: 'text',
          text: `Param ${i + 1}`,
        }));
        components.push({
          type: 'body',
          parameters: params,
        });
      }
    }

    // Button Parameters (URL)
    const buttonsComp = template.components.find((c) => c.type === 'BUTTONS');
    if (buttonsComp && buttonsComp.buttons) {
      buttonsComp.buttons.forEach((btn, index) => {
        if (btn.type === 'URL' && btn.url && btn.url.includes('{{1}}')) {
          components.push({
            type: 'button',
            sub_type: 'url',
            index: index, // Index of the button in the buttons list
            parameters: [
              {
                type: 'text',
                text: 'dynamic_url_part',
              },
            ],
          });
        }
         // Quick Reply payloads are often static in simple webhook examples unless strictly needed.
         // Omitting specific payload examples for Quick Reply to keep it simple, as they are optional.
      });
    }

    const payload = {
      phone_number: template.displayPhoneNumber || template.phoneNumberId || 'RECIPIENT_PHONE',
      template_name: template.name,
      template: components.length > 0 ? components : undefined,
    };

    return JSON.stringify(payload, null, 2);
  };

  const payload = generatePayload();

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="m-auto px-7 pt-6 pb-8">
        <div className="mb-6 flex items-center justify-between">
          <Text as="h3" className="font-semibold">
            Example Payload Template
          </Text>
          <ActionIcon size="sm" variant="text" onClick={onClose}>
            <PiXBold className="h-auto w-5" />
          </ActionIcon>
        </div>

        <div className="mb-4">
          <Text className="mb-2 text-gray-500">
             Sample JSON payload for sending this template via the <code>/api/v1/send-message-template</code> endpoint.
          </Text>
          
          <div className="relative rounded-lg bg-gray-900 p-4">
            <div className="absolute right-2 top-2">
                <ActionIcon 
                    variant="text" 
                    color="invert"
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-white"
                >
                    {copied ? <PiCheckBold className="h-4 w-4" /> : <PiCopyBold className="h-4 w-4" />}
                </ActionIcon>
            </div>
            <pre className="overflow-x-auto text-sm text-green-400">
              <code>{payload}</code>
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy JSON'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
