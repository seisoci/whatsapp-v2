'use client';

import { useState } from 'react';
import { PiPlusBold } from 'react-icons/pi';
import { Button } from 'rizzui';
import PageHeader from '@/app/shared/page-header';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateEditPhoneNumber from '@/app/shared/phone-numbers/create-edit-phone-number';
import PhoneNumbersTable from '@/app/shared/phone-numbers/phone-numbers-table';

const pageHeader = {
  title: 'Phone Numbers',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      name: 'Phone Numbers',
    },
  ],
};

export default function PhoneNumbersPage() {
  const { openModal } = useModal();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreatePhoneNumber = () => {
    openModal({
      view: <CreateEditPhoneNumber onSuccess={() => setRefreshKey(prev => prev + 1)} />,
      customSize: 600,
    });
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <div className="mt-4 flex items-center gap-3 @lg:mt-0">
          <Button
            onClick={handleCreatePhoneNumber}
            className="w-full @lg:w-auto"
          >
            <PiPlusBold className="me-1.5 h-[17px] w-[17px]" />
            Add Phone Number
          </Button>
        </div>
      </PageHeader>

      <div className="@container mt-6">
        <PhoneNumbersTable key={refreshKey} />
      </div>
    </>
  );
}
