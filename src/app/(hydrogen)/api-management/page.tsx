'use client';

import { useState } from 'react';
import { PiPlusBold } from 'react-icons/pi';
import { Button } from 'rizzui';
import PageHeader from '@/app/shared/page-header';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateEditApiEndpoint from '@/app/shared/api-management/create-edit-api-endpoint';
import ApiManagementTable from '@/app/shared/api-management/api-management-table';

const pageHeader = {
  title: 'Webhook',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      name: 'Webhook',
    },
  ],
};

export default function ApiManagementPage() {
  const { openModal } = useModal();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateApiEndpoint = () => {
    openModal({
      view: <CreateEditApiEndpoint onSuccess={() => setRefreshKey(prev => prev + 1)} />,
      customSize: 600,
    });
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <div className="mt-4 flex items-center gap-3 @lg:mt-0">
          <Button
            onClick={handleCreateApiEndpoint}
            className="w-full @lg:w-auto"
          >
            <PiPlusBold className="me-1.5 h-[17px] w-[17px]" />
            Add API Endpoint
          </Button>
        </div>
      </PageHeader>

      <div className="@container mt-6">
        <ApiManagementTable key={refreshKey} />
      </div>
    </>
  );
}
