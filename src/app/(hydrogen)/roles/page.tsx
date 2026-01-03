'use client';

import { useState } from 'react';
import { PiPlusBold } from 'react-icons/pi';
import { Button } from 'rizzui/button';
import PageHeader from '@/app/shared/page-header';
import { useModal } from '@/app/shared/modal-views/use-modal';
import RolesTable from '@/app/shared/roles/roles-table';
import CreateEditRole from '@/app/shared/roles/create-edit-role';

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

  const handleCreateRole = () => {
    openModal({
      view: <CreateEditRole />,
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
        <RolesTable />
      </div>
    </>
  );
}
