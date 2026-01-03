'use client';

import PageHeader from '@/app/shared/page-header';
import RoleAccessManagement from '@/app/shared/role-access/role-access-management';

const pageHeader = {
  title: 'Role Access Management',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      name: 'Role Access',
    },
  ],
};

export default function RoleAccessPage() {
  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <div className="@container mt-6">
        <RoleAccessManagement />
      </div>
    </>
  );
}
