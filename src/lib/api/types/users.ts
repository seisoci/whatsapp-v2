export interface Role {
  id: number;
  name: string;
  slug: string;
}

export interface UserPhoneNumber {
  id: string;
  name?: string | null;
  displayPhoneNumber?: string | null;
  phoneNumberId?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  emailVerified: boolean;
  roleId: number;
  role?: Role;
  phoneNumbers?: UserPhoneNumber[];
  createdAt: string;
  updatedAt: string;
}
