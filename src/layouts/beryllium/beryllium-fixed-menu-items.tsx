import { routes } from '@/config/routes';
import { IconType } from 'react-icons/lib';
import { atom } from 'jotai';
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

export interface SubMenuItemType {
  name: string;
  description?: string;
  href: string;
  badge?: string;
}

export interface ItemType {
  name: string;
  icon: IconType;
  href?: string;
  description?: string;
  badge?: string;
  subMenuItems?: SubMenuItemType[];
}

export interface MenuItemsType {
  id: string;
  name: string;
  title: string;
  icon: IconType;
  menuItems: ItemType[];
}

export const berylliumMenuItems: MenuItemsType[] = [
  {
    id: '1',
    name: 'Main',
    title: 'Main Menu',
    icon: PiHouseDuotone,
    menuItems: [
      {
        name: 'Dashboard',
        href: '/',
        icon: PiHouseDuotone,
      },
      {
        name: 'Chat',
        href: '#',
        icon: PiChatsDuotone,
      },
      {
        name: 'WhatsApp',
        description: 'WhatsApp Business',
        icon: PiWhatsappLogoDuotone,
        subMenuItems: [
          {
            name: 'Phone Numbers',
            href: routes.phoneNumbers,
          },
          {
            name: 'Templates',
            href: routes.templates,
          },
        ],
      },
      {
        name: 'Management',
        description: 'System Management',
        icon: PiUserGearDuotone,
        subMenuItems: [
          {
            name: 'Users',
            href: routes.users,
          },
          {
            name: 'Roles',
            href: routes.roles,
          },
          {
            name: 'Permissions',
            href: routes.permissions,
          },
        ],
      },
    ],
  },
];

export const berylliumMenuItemAtom = atom(berylliumMenuItems[0]);
