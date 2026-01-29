/**
 * Message Queues API Client
 * HTTP endpoints for viewing message queue logs
 */

import { apiClient, type ApiResponse } from '../api-client';

export interface MessageQueueItem {
  id: string;
  message_id: string | null;
  api_endpoint_id: string | null;
  api_endpoint_name: string | null;
  phone_number_id: string;
  contact_id: string | null;
  user_id: string | null;
  user_name: string | null;
  recipient_phone: string;
  template_name: string;
  template_language: string;
  template_category: string | null;
  template_components: any | null;
  ip_address: string | null;
  api_key_masked: string | null;
  user_agent: string | null;
  device_info: string | null;
  request_headers: Record<string, string | null> | null;
  queue_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  message_status: 'sent' | 'delivered' | 'read' | 'failed' | null;
  wamid: string | null;
  is_billable: boolean;
  error_message: string | null;
  error_code: string | null;
  attempts: number;
  max_attempts: number;
  next_retry_at: string | null;
  scheduled_at: string | null;
  processed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageQueuePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MessageQueueListResponse {
  success: boolean;
  data: MessageQueueItem[];
  pagination: MessageQueuePagination;
}

export interface MessageQueueFilters {
  page?: number;
  limit?: number;
  queue_status?: string;
  template_name?: string;
  is_billable?: string;
  date_from?: string;
  date_to?: string;
}

export const messageQueuesApi = {
  getAll: (filters?: MessageQueueFilters) => {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.queue_status) params.set('queue_status', filters.queue_status);
    if (filters?.template_name) params.set('template_name', filters.template_name);
    if (filters?.is_billable) params.set('is_billable', filters.is_billable);
    if (filters?.date_from) params.set('date_from', filters.date_from);
    if (filters?.date_to) params.set('date_to', filters.date_to);

    const qs = params.toString();
    return apiClient.get<MessageQueueListResponse>(`/message-queues${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    apiClient.get<ApiResponse<MessageQueueItem>>(`/message-queues/${id}`),
};
