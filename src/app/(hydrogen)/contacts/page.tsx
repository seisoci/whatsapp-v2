'use client';

import { PiPlusBold } from 'react-icons/pi';
import { Button } from 'rizzui/button';
import PageHeader from '@/app/shared/page-header';
import ContactsTable from '@/app/shared/contacts/contacts-table';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateEditContact from '@/app/shared/contacts/create-edit-contact';
import { useState } from 'react';

const pageHeader = {
  title: 'Contacts',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      name: 'Contacts',
    },
  ],
};

export default function ContactsPage() {
  const { openModal } = useModal();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    openModal({
      view: <CreateEditContact onSuccess={() => setRefreshKey(prev => prev + 1)} />,
      customSize: 600,
    });
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <div className="mt-4 flex items-center gap-3 @lg:mt-0">
          <Button className="w-full @lg:w-auto" onClick={handleAdd}>
            <PiPlusBold className="me-1.5 h-[17px] w-[17px]" />
            Add Contact
          </Button>
        </div>
      </PageHeader>

      <div className="@container mt-6">
        <ContactsTable key={refreshKey} />
      </div>
    </>
  );
}
