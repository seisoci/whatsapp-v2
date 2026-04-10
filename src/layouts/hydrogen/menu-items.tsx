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
  PiAddressBookDuotone,
  PiListChecksDuotone,
  PiChartBarDuotone,
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
      },
      {
        name: 'Contacts',
        href: routes.contacts,
      },

      {
        name: 'Quick Replies',
        href: routes.quickReplies,
      },
      {
        name: 'Templates',
        href: routes.templates.dashboard,
      },
    ],
  },
  {
    name: 'Analytics',
    href: routes.analytics,
    icon: <PiChartBarDuotone />,
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
      {
        name: 'Template Role Management',
        href: routes.templateRoles,
      },
      {
        name: 'Webhook',
        href: routes.apiManagement,
      },
      {
        name: 'Message Queue',
        href: routes.messageQueues,
      },
    ],
  },
];
