'use client';

import { useState } from 'react';
import { Button } from 'rizzui';
import { PiPlus } from 'react-icons/pi';
import PageHeader from '@/app/shared/page-header';
import { quickReplyApi, type QuickReply } from '@/lib/api/quick-replies';
import { Input, Modal, Textarea } from 'rizzui';
import QuickRepliesTable from '@/app/shared/quick-replies/quick-replies-table';
import toast from 'react-hot-toast';

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
  const [showModal, setShowModal] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [formData, setFormData] = useState({ shortcut: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenModal = (reply?: QuickReply) => {
    if (reply) {
      setEditingReply(reply);
      setFormData({ shortcut: reply.shortcut, text: reply.text });
    } else {
      setEditingReply(null);
      setFormData({ shortcut: '', text: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReply(null);
    setFormData({ shortcut: '', text: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) return;

    try {
      setSubmitting(true);
      if (editingReply) {
        await quickReplyApi.update(editingReply.id, formData);
        toast.success('Quick reply updated successfully');
      } else {
        await quickReplyApi.create(formData);
        toast.success('Quick reply created successfully');
      }
      setRefreshKey(prev => prev + 1);
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save quick reply:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save quick reply';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
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

      <Modal isOpen={showModal} onClose={handleCloseModal} customSize="800px">
        <div className="m-auto px-7 pt-6 pb-8">
          <div className="mb-7 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {editingReply ? 'Edit Quick Reply' : 'Add Quick Reply'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Shortcut <span className="text-gray-400">(optional)</span>
              </label>
              <Input
                prefix="/"
                placeholder="hallo"
                value={formData.shortcut}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, shortcut: e.target.value }))
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Type /{formData.shortcut || 'shortcut'} in chat to use this quick reply
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Message Text <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Enter your quick reply message..."
                value={formData.text}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, text: e.target.value }))
                }
                className="w-full"
                rows={6}
                required
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting} disabled={!formData.text.trim()}>
                {editingReply ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
