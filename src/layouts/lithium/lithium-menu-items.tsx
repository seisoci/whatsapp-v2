import { routes } from '@/config/routes';
import {
  PiHouseDuotone,
  PiChatsDuotone,
  PiWhatsappLogoDuotone,
  PiDeviceMobileDuotone,
  PiEnvelopeDuotone,
  PiUserGearDuotone,
  PiUserDuotone,
  PiShieldCheckDuotone,
  PiLockKeyDuotone,
} from 'react-icons/pi';

export type SubMenuItemType = {
  name: string;
  href: string;
  icon?: any;
};

export type DropdownItemType = {
  name: string;
  icon: any;
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
        icon: PiHouseDuotone,
      },
    ],
  },
  unconfigured: {
    name: 'Dashboard',
    type: 'link',
    dropdownItems: [
      {
        name: 'Dashboard',
        href: '/',
        icon: PiHouseDuotone,
      },
    ],
  },
  configured: {
    name: 'Chat',
    type: 'link',
    dropdownItems: [
      {
        name: 'Chat',
        href: '#',
        icon: PiChatsDuotone,
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
        icon: PiChatsDuotone,
      },
    ],
  },
  settings: {
    name: 'WhatsApp',
    type: 'link',
    dropdownItems: [
      {
        name: 'Phone Numbers',
        href: routes.phoneNumbers,
        icon: PiDeviceMobileDuotone,
      },
      {
        name: 'Templates',
        href: routes.templates,
        icon: PiEnvelopeDuotone,
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
        icon: PiDeviceMobileDuotone,
      },
      {
        name: 'Templates',
        href: routes.templates,
        icon: PiEnvelopeDuotone,
      },
    ],
  },
  users: {
    name: 'Management',
    type: 'link',
    dropdownItems: [
      {
        name: 'Users',
        href: routes.users,
        icon: PiUserDuotone,
      },
      {
        name: 'Roles',
        href: routes.roles,
        icon: PiShieldCheckDuotone,
      },
      {
        name: 'Permissions',
        href: routes.permissions,
        icon: PiLockKeyDuotone,
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
        icon: PiUserDuotone,
      },
      {
        name: 'Roles',
        href: routes.roles,
        icon: PiShieldCheckDuotone,
      },
      {
        name: 'Permissions',
        href: routes.permissions,
        icon: PiLockKeyDuotone,
      },
    ],
  },
};

export type LithiumMenuItemsKeys = keyof typeof lithiumMenuItems;
