/**
 * Dashboard API Client
 * HTTP endpoints for dashboard functionality
 */

import { apiClient } from '../api-client';
import type { DashboardStats } from '../types/dashboard';

// Re-export types for backward compatibility
export type { DashboardStats };

export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats').then(r => r.data),
};
