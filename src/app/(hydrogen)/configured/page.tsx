'use client';

import PageHeader from '@/app/shared/page-header';
import ConfiguredTable from '@/app/shared/configured/configured-table';

const pageHeader = {
  title: 'Configured ONUs',
  breadcrumb: [
    { name: 'Configured ONUs' },
  ],
};

export default function ConfiguredPage() {
  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />
      <div className="@container mt-6">
        <ConfiguredTable />
      </div>
    </>
  );
}
