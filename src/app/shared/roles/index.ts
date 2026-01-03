export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: any[];
  menus?: any[];
}

export type RolesTableDataType = Role;