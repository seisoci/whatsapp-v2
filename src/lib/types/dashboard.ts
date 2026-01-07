/**
 * Dashboard Types
 * Type definitions for dashboard functionality
 */

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
