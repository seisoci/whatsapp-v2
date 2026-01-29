'use client';

import PageHeader from '@/app/shared/page-header';
import MessageQueueTable from '@/app/shared/message-queues/message-queue-table';

const pageHeader = {
  title: 'Message Queue',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      name: 'Message Queue',
    },
  ],
};

export default function MessageQueuePage() {
  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />

      <div className="@container mt-6">
        <MessageQueueTable />
      </div>
    </>
  );
}
