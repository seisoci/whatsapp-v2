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

export const berylliumSidebarMenuItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: <PiHouseDuotone />,
  },
  {
    name: 'Chat',
    href: '#',
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
        name: 'Templates',
        href: routes.templates,
        icon: <PiEnvelopeDuotone />,
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
