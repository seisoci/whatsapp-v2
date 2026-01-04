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

export const menuItems = [
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
      },
      {
        name: 'Templates',
        href: routes.templates,
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
];
