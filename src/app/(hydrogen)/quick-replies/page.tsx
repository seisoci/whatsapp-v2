'use client';

import { useState } from 'react';
import { Button } from 'rizzui';
import { PiPlus } from 'react-icons/pi';
import PageHeader from '@/app/shared/page-header';
import { type QuickReply } from '@/lib/api/quick-replies';
import QuickRepliesTable from '@/app/shared/quick-replies/quick-replies-table';
import toast from 'react-hot-toast';
import { quickReplyApi } from '@/lib/api/quick-replies';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateQuickReply from '@/app/shared/quick-replies/create-quick-reply';

const pageHeader = {
  title: 'Quick Replies',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      name: 'Quick Replies',
    },
  ],
};

export default function QuickRepliesPage() {
  const { openModal } = useModal();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenModal = (reply?: QuickReply) => {
    openModal({
      view: <CreateQuickReply reply={reply} onSuccess={() => setRefreshKey(prev => prev + 1)} />,
      customSize: 800,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quick reply?')) return;

    try {
      await quickReplyApi.delete(id);
      toast.success('Quick reply deleted successfully');
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error('Failed to delete quick reply:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete quick reply';
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <PiPlus className="h-4 w-4" />
          Add Quick Reply
        </Button>
      </PageHeader>

      <div className="@container mt-6">
        <QuickRepliesTable 
          key={refreshKey}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      </div>
    </>
  );
}
