import { routes } from '@/config/routes';
import {
  PiUserDuotone,
  PiUserGearDuotone,
  PiPlugsConnectedDuotone,
  PiWarningCircleDuotone,
  PiCheckCircleDuotone,
  PiShieldCheckDuotone,
  PiLockKeyDuotone,
  PiDeviceMobileDuotone,
  PiEnvelopeDuotone,
} from 'react-icons/pi';

export const menuItems = [
  {
    name: 'Network Management',
  },
  {
    name: 'OLT',
    href: routes.olt.dashboard,
    icon: <PiPlugsConnectedDuotone />,
  },
  {
    name: 'Unconfigured',
    href: routes.unconfigured,
    icon: <PiWarningCircleDuotone />,
  },
  {
    name: 'Configured',
    href: routes.configured.onus,
    icon: <PiCheckCircleDuotone />,
  },
  {
    name: 'Settings',
    href: '#',
    icon: <PiUserGearDuotone />,
    dropdownItems: [
      {
        name: 'OLT',
        href: routes.olt.dashboard,
      },
      {
        name: 'Speed Profiles',
        href: routes.speedProfiles,
      },
      {
        name: 'Zones',
        href: routes.zones,
      },
      {
        name: 'ODbs',
        href: routes.odbs,
      },
      {
        name: 'ONU Types',
        href: routes.onuTypes,
      },
    ],
  },
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
];
