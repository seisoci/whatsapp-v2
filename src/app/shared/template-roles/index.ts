export interface TemplateRoleItem {
  accessId: string;
  roleId: string;
  roleName: string;
  roleSlug: string;
}

export interface TemplateRoleGroup {
  templateId: string;
  templateName: string;
  wabaId: string;
  phoneNumberDbId: string;
  phoneNumber?: {
    id: string;
    name: string;
    phoneNumberId: string;
  };
  roles: {
    id: string;
    name: string;
    slug: string;
    accessId: string;
  }[];
}

export interface RoleOption {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}
