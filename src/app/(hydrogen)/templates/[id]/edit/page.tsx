'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { templatesApi } from '@/lib/api/templates';
import CreateEditTemplate from '@/app/shared/templates/create-edit-template';
import PageHeader from '@/app/shared/page-header';
import { routes } from '@/config/routes';
import { Loader } from 'rizzui';
import toast from 'react-hot-toast';
import { Template } from '@/app/shared/templates';

const pageHeader = {
  title: 'Edit Template',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      href: routes.templates.dashboard,
      name: 'Templates',
    },
    {
      name: 'Edit',
    },
  ],
};

export default function EditTemplatePage() {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<Template | null>(null);
  const searchParams = useSearchParams();
  const params = useParams();
  const phoneNumberId = searchParams.get('phoneNumberId');
  const router = useRouter();

  // Extract ID from params, robustly handling string/array possibilities if any
  const templateId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    const fetchTemplate = async () => {
      console.log('EditTemplatePage params:', params, 'phoneNumberId:', phoneNumberId);

      if (
        !templateId ||
        !phoneNumberId ||
        phoneNumberId === 'undefined' ||
        phoneNumberId === 'null'
      ) {
        toast.error(
          `Invalid template or phone number ID. ID: ${templateId}, Phone: ${phoneNumberId}`
        );
        setLoading(false);
        return;
      }

      try {
        const response = await templatesApi.getById(templateId as string, phoneNumberId);
        if (response.success && response.data) {
          setTemplate(response.data as unknown as Template);
        } else {
          toast.error(response.message || 'Failed to fetch template');
          router.push(routes.templates.dashboard);
        }
      } catch (error: any) {
        console.error('Error fetching template:', error);
        toast.error(error.message || 'Failed to fetch template');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, phoneNumberId, router]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center">
        <Loader size="xl" variant="spinner" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />
      {template && <CreateEditTemplate template={template} />}
    </>
  );
}
