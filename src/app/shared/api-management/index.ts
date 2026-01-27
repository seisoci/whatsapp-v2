export interface ApiEndpoint {
  id: string;
  name: string;
  description: string | null;
  webhookUrl: string;
  apiKey: string | null;
  isActive: boolean;
  createdBy: string | null;
  creatorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export { default as ApiManagementTable } from './api-management-table';
export { default as CreateEditApiEndpoint } from './create-edit-api-endpoint';
