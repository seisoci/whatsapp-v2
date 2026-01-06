import { apiClient, ApiResponse } from '../api-client';

export interface DashboardStats {
  counts: {
    totalMessages: number;
    totalContacts: number;
    messagesToday: {
      total: number;
      incoming: number;
      outgoing: number;
    };
  };
  chart: {
    date: string;
    incoming: number;
    outgoing: number;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<DashboardStats>('/dashboard/stats');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to fetch dashboard stats');
}
