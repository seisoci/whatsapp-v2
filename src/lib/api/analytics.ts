import { apiClient } from '../api-client';

export interface MessageOverTime {
  date: string;
  incoming: number;
  outgoing: number;
}

export interface MessageStatusItem {
  status: string;
  count: number;
}

export interface TopTemplate {
  templateName: string;
  count: number;
}

export interface ResponseTimeStats {
  avgMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  medianMinutes: number;
}

export interface AgentMessageCount {
  userId: string;
  username: string;
  count: number;
}

export interface ContactGrowthItem {
  date: string;
  newContacts: number;
  cumulative: number;
}

export interface TopActiveContact {
  contactId: string;
  waId: string;
  profileName: string;
  activeDays: number;
}

export interface AnalyticsFilters {
  phoneNumberId?: string;
  /** Inclusive date range start (YYYY-MM-DD or ISO string). Takes priority over `days` when paired with `endDate`. */
  startDate?: string;
  /** Inclusive date range end (YYYY-MM-DD or ISO string). */
  endDate?: string;
  /** Fallback: last N days from today. Only used when `startDate`/`endDate` are not both set. */
  days?: number;
}

function buildParams(filters: AnalyticsFilters): Record<string, string> {
  const p: Record<string, string> = {};
  if (filters.phoneNumberId) p.phoneNumberId = filters.phoneNumberId;
  if (filters.startDate && filters.endDate) {
    p.startDate = filters.startDate;
    p.endDate = filters.endDate;
  } else if (filters.days) {
    p.days = String(filters.days);
  }
  return p;
}

export const analyticsApi = {
  getMessagesOverTime: async (filters: AnalyticsFilters = {}): Promise<MessageOverTime[]> => {
    const res: any = await apiClient.get('/analytics/messages-over-time', { params: buildParams(filters) });
    return res?.data ?? [];
  },

  getMessageStatus: async (filters: AnalyticsFilters = {}): Promise<MessageStatusItem[]> => {
    const res: any = await apiClient.get('/analytics/message-status', { params: buildParams(filters) });
    return res?.data ?? [];
  },

  getTopTemplates: async (filters: AnalyticsFilters = {}): Promise<TopTemplate[]> => {
    const res: any = await apiClient.get('/analytics/top-templates', { params: buildParams(filters) });
    return res?.data ?? [];
  },

  getResponseTime: async (filters: AnalyticsFilters = {}): Promise<ResponseTimeStats | null> => {
    const res: any = await apiClient.get('/analytics/response-time', { params: buildParams(filters) });
    return res?.data ?? null;
  },

  getMessagesPerAgent: async (filters: AnalyticsFilters = {}): Promise<AgentMessageCount[]> => {
    const res: any = await apiClient.get('/analytics/messages-per-agent', { params: buildParams(filters) });
    return res?.data ?? [];
  },

  getContactGrowth: async (filters: AnalyticsFilters = {}): Promise<ContactGrowthItem[]> => {
    const res: any = await apiClient.get('/analytics/contact-growth', { params: buildParams(filters) });
    return res?.data ?? [];
  },

  getTopActiveContacts: async (filters: AnalyticsFilters = {}): Promise<TopActiveContact[]> => {
    const res: any = await apiClient.get('/analytics/top-active-contacts', { params: buildParams(filters) });
    return res?.data ?? [];
  },
};
