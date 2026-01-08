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
  PiFileTextDuotone,
} from 'react-icons/pi';

export const menuItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: PiHouseDuotone,
    shortcut: {
      modifiers: 'alt',
      key: '1',
    },
  },
  {
    name: 'Chat',
    href: '#',
    icon: PiChatsDuotone,
    shortcut: {
      modifiers: 'alt',
      key: '2',
    },
  },
  {
    name: 'WhatsApp',
    href: '#',
    icon: PiWhatsappLogoDuotone,
    dropdownItems: [
      {
        name: 'Phone Numbers',
        href: routes.phoneNumbers,
        icon: PiDeviceMobileDuotone,
      },

      {
        name: 'Quick Replies',
        href: routes.quickReplies,
        icon: PiEnvelopeDuotone,
      },
      {
        name: 'Templates',
        href: routes.templates,
        icon: PiFileTextDuotone,
      },
    ],
  },
  {
    name: 'Management',
    href: '#',
    icon: PiUserGearDuotone,
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
];
