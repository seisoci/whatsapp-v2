import { routes } from '@/config/routes';

export type SubMenuItemType = {
  name: string;
  href: string;
};

export type DropdownItemType = {
  name: string;
  icon: string;
  description?: string;
  href?: string;
  subMenuItems?: SubMenuItemType[];
};

export type LithiumMenuItem = {
  [key: string]: {
    name: string;
    type: string;
    dropdownItems: DropdownItemType[];
  };
};

export const lithiumMenuItems: LithiumMenuItem = {
  dashboard: {
    name: 'Dashboard',
    type: 'link',
    dropdownItems: [
      {
        name: 'Dashboard',
        href: '/',
        icon: 'HomeIcon',
      },
    ],
  },
  chat: {
    name: 'Chat',
    type: 'link',
    dropdownItems: [
      {
        name: 'Chat',
        href: '#',
        icon: 'ChatIcon',
      },
    ],
  },
  whatsapp: {
    name: 'WhatsApp',
    type: 'link',
    dropdownItems: [
      {
        name: 'Phone Numbers',
        href: routes.phoneNumbers,
        icon: 'PhoneIcon',
      },
      {
        name: 'Templates',
        href: routes.templates,
        icon: 'EnvelopeIcon',
      },
    ],
  },
  management: {
    name: 'Management',
    type: 'link',
    dropdownItems: [
      {
        name: 'Users',
        href: routes.users,
        icon: 'UserIcon',
      },
      {
        name: 'Roles',
        href: routes.roles,
        icon: 'ShieldIcon',
      },
      {
        name: 'Permissions',
        href: routes.permissions,
        icon: 'LockIcon',
      },
    ],
  },
};

export type LithiumMenuItemsKeys = keyof typeof lithiumMenuItems;
