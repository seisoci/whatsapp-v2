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

export const berylliumSidebarMenuItems = [
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
        href: routes.templates,
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
    ],
  },
];
