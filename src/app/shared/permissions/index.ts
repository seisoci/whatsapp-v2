export interface Permission {
  id: string;
  menuManagerId: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  menu?: {
    id: string;
    title: string;
    slug: string;
  };
}

export type PermissionsTableDataType = Permission;
