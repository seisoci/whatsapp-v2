'use client';

import { Metadata } from 'next';
import PageHeader from '@/app/shared/page-header';
import TemplatesTable from '@/app/shared/templates/templates-table';
import { Button } from 'rizzui';
import { PiPlusBold } from 'react-icons/pi';
import { useRouter } from 'next/navigation';
import { routes } from '@/config/routes';

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
  const router = useRouter();

  const handleCreateTemplate = () => {
    router.push(routes.templates.create);
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <div className="mt-4 flex items-center gap-3 @lg:mt-0">
          <Button
            onClick={handleCreateTemplate}
            className="w-full @lg:w-auto"
          >
            <PiPlusBold className="me-1.5 h-[17px] w-[17px]" />
            Create Template
          </Button>
        </div>
      </PageHeader>

      <div className="@container mt-6">
        <TemplatesTable />
      </div>
    </>
  );
}
