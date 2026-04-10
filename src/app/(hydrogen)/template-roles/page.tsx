'use client';

import PageHeader from '@/app/shared/page-header';
import TemplateRolesTable from '@/app/shared/template-roles/template-roles-table';

const pageHeader = {
  title: 'Template Role Management',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      href: '/templates',
      name: 'Templates',
    },
    {
      name: 'Role Management',
    },
  ],
};

export default function TemplateRolesPage() {
  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <div className="@container mt-6">
        <TemplateRolesTable />
      </div>
    </>
  );
}
