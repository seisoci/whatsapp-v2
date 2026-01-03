'use client';

import { useState } from 'react';
import { PiPlusBold } from 'react-icons/pi';
import { Button } from 'rizzui/button';
import PageHeader from '@/app/shared/page-header';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateRole from '@/app/shared/roles-permissions/create-role';
import RolesTable from '@/app/shared/roles/roles-table';

const pageHeader = {
  title: 'Role Management',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      name: 'Roles',
    },
  ],
};

export default function RolesPage() {
  const { openModal } = useModal();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateRole = () => {
    openModal({
      view: <CreateRole onSuccess={() => setRefreshKey(prev => prev + 1)} />,
      customSize: 800,
    });
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <div className="mt-4 flex items-center gap-3 @lg:mt-0">
          <Button
            onClick={handleCreateRole}
            className="w-full @lg:w-auto"
          >
            <PiPlusBold className="me-1.5 h-[17px] w-[17px]" />
            Add Role
          </Button>
        </div>
      </PageHeader>

      <div className="@container mt-6">
        <RolesTable key={refreshKey} />
      </div>
    </>
  );
}
