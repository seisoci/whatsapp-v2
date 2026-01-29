'use client';

import { MessageQueueItem } from '.';
import { ActionIcon, Badge, Title, Text } from 'rizzui';
import { PiXBold } from 'react-icons/pi';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { getStatusBadge } from '@core/components/table-utils/get-status-badge';
import { format } from 'date-fns';

function formatDate(val: string | null) {
  if (!val) return '-';
  try {
    return format(new Date(val), 'dd MMM yyyy HH:mm:ss');
  } catch {
    return '-';
  }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-gray-100 last:border-b-0">
      <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</Text>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return <span>-</span>;
  return (
    <Badge variant="flat" color={
      category === 'MARKETING' ? 'warning' :
      category === 'UTILITY' ? 'info' :
      category === 'AUTHENTICATION' ? 'success' : 'secondary'
    } className="capitalize">
      {category.toLowerCase()}
    </Badge>
  );
}

export default function MessageQueueDetail({ item }: { item: MessageQueueItem }) {
  const { closeModal } = useModal();
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Title as="h4" className="text-base font-semibold">
          Queue Detail
        </Title>
        <ActionIcon size="sm" variant="text" onClick={closeModal}>
          <PiXBold className="h-auto w-5" />
        </ActionIcon>
      </div>

      {/* Status bar — full width */}
      <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-3">
        <div>
          <Text className="text-xs text-gray-500 mb-1">Queue Status</Text>
          {getStatusBadge(item.queue_status)}
        </div>
        <div>
          <Text className="text-xs text-gray-500 mb-1">Message Status</Text>
          {item.message_status ? getStatusBadge(item.message_status) : <span className="text-gray-400">-</span>}
        </div>
        <div>
          <Text className="text-xs text-gray-500 mb-1">Billable</Text>
          <Badge variant="flat" color={item.is_billable ? 'success' : 'secondary'}>
            {item.is_billable ? 'Yes' : 'No'}
          </Badge>
        </div>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Template Info */}
          <div>
            <Title as="h5" className="text-sm font-semibold mb-2">Template</Title>
            <DetailRow label="Template Name">{item.template_name}</DetailRow>
            <DetailRow label="Category"><CategoryBadge category={item.template_category} /></DetailRow>
            <DetailRow label="Language">{item.template_language}</DetailRow>
            <DetailRow label="Recipient">{item.recipient_phone}</DetailRow>
            {item.wamid && (
              <DetailRow label="WAMID">
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{item.wamid}</code>
              </DetailRow>
            )}
          </div>

          {/* Error */}
          {item.error_message && (
            <div>
              <Title as="h5" className="text-sm font-semibold mb-2 text-red-600">Error</Title>
              <DetailRow label="Error Code">{item.error_code || '-'}</DetailRow>
              <DetailRow label="Error Message">
                <div className="text-red-600 text-xs break-all">{item.error_message}</div>
              </DetailRow>
            </div>
          )}

          {/* Retry & Timeline */}
          <div>
            <Title as="h5" className="text-sm font-semibold mb-2">Retry & Timeline</Title>
            <DetailRow label="Attempts">{item.attempts}/{item.max_attempts}</DetailRow>
            <DetailRow label="Created">{formatDate(item.created_at)}</DetailRow>
            <DetailRow label="Processed">{formatDate(item.processed_at)}</DetailRow>
            <DetailRow label="Completed">{formatDate(item.completed_at)}</DetailRow>
            {item.next_retry_at && <DetailRow label="Next Retry">{formatDate(item.next_retry_at)}</DetailRow>}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Request Metadata */}
          <div>
            <Title as="h5" className="text-sm font-semibold mb-2">Request Info</Title>
            <DetailRow label="API Key">
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{item.api_key_masked || '-'}</code>
            </DetailRow>
            <DetailRow label="API Endpoint">{item.api_endpoint_name || '-'}</DetailRow>
            <DetailRow label="IP Address">
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{item.ip_address || '-'}</code>
            </DetailRow>
            <DetailRow label="Device">{item.device_info || '-'}</DetailRow>
            <DetailRow label="User Agent">
              <div className="text-xs text-gray-600 break-all">{item.user_agent || '-'}</div>
            </DetailRow>
            <DetailRow label="Sent By">{item.user_name || '-'}</DetailRow>
          </div>

          {/* Request Headers */}
          {item.request_headers && (
            <div>
              <Title as="h5" className="text-sm font-semibold mb-2">Request Headers</Title>
              <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono space-y-1">
                {Object.entries(item.request_headers).map(([key, val]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-gray-500 min-w-[120px]">{key}:</span>
                    <span className="text-gray-800 break-all">{String(val || '-')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Components — full width at bottom */}
      {item.template_components && (
        <div>
          <Title as="h5" className="text-sm font-semibold mb-2">Template Components</Title>
          <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto max-h-48">
            {JSON.stringify(item.template_components, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
