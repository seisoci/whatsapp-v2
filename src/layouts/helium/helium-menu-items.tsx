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
  PiPlugDuotone,
} from 'react-icons/pi';

export const menuItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: <PiHouseDuotone />,
  },
  {
    name: 'Chat',
    href: routes.chat,
    icon: <PiChatsDuotone />,
  },
  {
    name: 'WhatsApp',
    href: '#',
    icon: <PiWhatsappLogoDuotone />,
    dropdownItems: [
      {
        name: 'Phone Numbers',
        href: routes.phoneNumbers,
        icon: <PiDeviceMobileDuotone />,
      },

      {
        name: 'Quick Replies',
        href: routes.quickReplies,
        icon: <PiEnvelopeDuotone />,
      },
      {
        name: 'Templates',
        href: routes.templates.dashboard,
        icon: <PiFileTextDuotone />,
      },
    ],
  },
  {
    name: 'Management',
    href: '#',
    icon: <PiUserGearDuotone />,
    dropdownItems: [
      {
        name: 'Users',
        href: routes.users,
        icon: <PiUserDuotone />,
      },
      {
        name: 'Roles',
        href: routes.roles,
        icon: <PiShieldCheckDuotone />,
      },
      {
        name: 'Permissions',
        href: routes.permissions,
        icon: <PiLockKeyDuotone />,
      },
      {
        name: 'API Management',
        href: routes.apiManagement,
        icon: <PiPlugDuotone />,
      },
    ],
  },
];
