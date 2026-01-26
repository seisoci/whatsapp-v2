import { Metadata } from 'next';
import CreateEditTemplate from '@/app/shared/templates/create-edit-template';
import PageHeader from '@/app/shared/page-header';
import { routes } from '@/config/routes';

export const metadata: Metadata = {
  title: 'Create Template | WhatsApp Business',
  description: 'Create a new WhatsApp message template',
};

const pageHeader = {
  title: 'Create Template',
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
      name: 'Create',
    },
  ],
};

export default function CreateTemplatePage() {
  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />
      <CreateEditTemplate />
    </>
  );
}
