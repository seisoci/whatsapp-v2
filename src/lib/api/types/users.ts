export interface Role {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  emailVerified: boolean;
  roleId: number;
  role?: Role;
  createdAt: string;
  updatedAt: string;
}
