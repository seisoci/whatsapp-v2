'use client';

import { useState } from 'react';
import { PiPlusBold } from 'react-icons/pi';
import { Button } from 'rizzui/button';
import PageHeader from '@/app/shared/page-header';
import { useModal } from '@/app/shared/modal-views/use-modal';
import PermissionsTable from '@/app/shared/permissions/permissions-table';
import CreateEditPermission from '@/app/shared/permissions/create-edit-permission';

const pageHeader = {
  title: 'Permission Management',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      name: 'Permissions',
    },
  ],
};

export default function PermissionsPage() {
  const { openModal } = useModal();

  const handleCreatePermission = () => {
    openModal({
      view: <CreateEditPermission />,
      customSize: 700,
    });
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <div className="mt-4 flex items-center gap-3 @lg:mt-0">
          <Button
            onClick={handleCreatePermission}
            className="w-full @lg:w-auto"
          >
            <PiPlusBold className="me-1.5 h-[17px] w-[17px]" />
            Add Permission
          </Button>
        </div>
      </PageHeader>

      <div className="@container mt-6">
        <PermissionsTable />
      </div>
    </>
  );
}
