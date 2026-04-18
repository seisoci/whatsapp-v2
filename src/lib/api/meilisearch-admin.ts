import { apiClient } from '../api-client';

export interface IndexStats {
  name: string;
  numberOfDocuments: number;
  isIndexing: boolean;
}

export interface IndexDocumentsResult {
  results: any[];
  total: number;
}

export interface SyncResult {
  contacts?: number;
  messages?: number;
}

// apiClient already returns the response body directly (not axios-style { data: body }).
// So we return the full { success, data, message } without extra .then(r => r.data) unwrapping.

export const meilisearchAdminApi = {
  getStats: (): Promise<{ success: boolean; data: IndexStats[] }> =>
    apiClient.get('/meilisearch/stats') as any,

  getDocuments: (
    index: string,
    params: { offset?: number; limit?: number }
  ): Promise<{ success: boolean; data: IndexDocumentsResult }> =>
    apiClient.get(`/meilisearch/indexes/${index}/documents`, { params }) as any,

  clearIndex: (index: string): Promise<{ success: boolean; message: string }> =>
    apiClient.delete(`/meilisearch/indexes/${index}/documents`) as any,

  resyncForceIndex: (index: string): Promise<{ success: boolean; message: string; synced: number }> =>
    apiClient.post(`/meilisearch/indexes/${index}/resync-force`) as any,

  resyncContinueIndex: (index: string): Promise<{ success: boolean; message: string; synced: number }> =>
    apiClient.post(`/meilisearch/indexes/${index}/resync-continue`) as any,

  resyncForceAll: (): Promise<{ success: boolean; message: string; data: SyncResult }> =>
    apiClient.post('/meilisearch/resync-force') as any,

  resyncContinueAll: (): Promise<{ success: boolean; message: string; data: SyncResult }> =>
    apiClient.post('/meilisearch/resync-continue') as any,
};
