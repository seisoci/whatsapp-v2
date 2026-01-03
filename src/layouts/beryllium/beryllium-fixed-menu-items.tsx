import { routes } from '@/config/routes';
import { IconType } from 'react-icons/lib';
import { atom } from 'jotai';
import {
  PiHouse,
  PiUserDuotone,
  PiUserGearDuotone,
  PiPlugsConnectedDuotone,
  PiWarningCircleDuotone,
  PiCheckCircleDuotone,
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
    name: 'Network',
    title: 'Network Management',
    icon: PiHouse,
    menuItems: [
      {
        name: 'OLT',
        href: routes.olt.dashboard,
        icon: PiPlugsConnectedDuotone,
      },
      {
        name: 'Unconfigured',
        href: routes.unconfigured,
        icon: PiWarningCircleDuotone,
      },
      {
        name: 'Configured',
        href: routes.configured.onus,
        icon: PiCheckCircleDuotone,
      },
      {
        name: 'Settings',
        description: 'Network Settings',
        icon: PiUserGearDuotone,
        subMenuItems: [
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
        icon: PiUserDuotone,
      },
    ],
  },
];

export const berylliumMenuItemAtom = atom(berylliumMenuItems[0]);
