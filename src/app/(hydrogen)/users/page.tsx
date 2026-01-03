'use client';

import { PiPlusBold } from 'react-icons/pi';
import { Button } from 'rizzui/button';
import PageHeader from '@/app/shared/page-header';
import UsersTable from '@/app/shared/users/users-table';
import { usersData } from '@/data/users-data';
import ExportButton from '@/app/shared/export-button';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateEditUser from '@/app/shared/users/create-edit-user';

const pageHeader = {
  title: 'Users',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      name: 'Users',
    },
  ],
};

export default function UsersPage() {
  const { openModal } = useModal();

  const handleCreateUser = () => {
    openModal({
      view: <CreateEditUser />,
      customSize: 600,
    });
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <div className="mt-4 flex items-center gap-3 @lg:mt-0">
          <ExportButton
            data={usersData}
            fileName="users_data"
            header="ID,Full Name,Email,Role,Status,Created Date"
          />
          <Button
            onClick={handleCreateUser}
            className="w-full @lg:w-auto"
          >
            <PiPlusBold className="me-1.5 h-[17px] w-[17px]" />
            Add User
          </Button>
        </div>
      </PageHeader>

      <div className="@container mt-6">
        <UsersTable />
      </div>
    </>
  );
}
