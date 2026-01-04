import { Metadata } from 'next';
import PageHeader from '@/app/shared/page-header';
import TemplatesTable from '@/app/shared/templates/templates-table';

export const metadata: Metadata = {
  title: 'Message Templates | WhatsApp Business',
  description: 'Manage WhatsApp message templates',
};

const pageHeader = {
  title: 'Message Templates',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      name: 'Templates',
    },
  ],
};

export default function TemplatesPage() {
  return (
    <>
    <PageHeader title= { pageHeader.title } breadcrumb = { pageHeader.breadcrumb } />
      <TemplatesTable />
      </>
  );
}
