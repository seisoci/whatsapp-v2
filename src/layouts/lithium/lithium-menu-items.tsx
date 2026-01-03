import { routes } from '@/config/routes';

export type SubMenuItemType = {
  name: string;
  href: string;
};

export type DropdownItemType = {
  name: string;
  icon: string;
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
  unconfigured: {
    name: 'Unconfigured',
    type: 'link',
    dropdownItems: [
      {
        name: 'Unconfigured ONUs',
        href: routes.unconfigured,
        icon: 'FilesIcon',
      },
    ],
  },
  configured: {
    name: 'Configured',
    type: 'link',
    dropdownItems: [
      {
        name: 'Configured ONUs',
        href: routes.configured.onus,
        icon: 'FilesIcon',
      },
    ],
  },
  settings: {
    name: 'Settings',
    type: 'link',
    dropdownItems: [
      {
        name: 'OLT',
        href: routes.olt.dashboard,
        icon: 'OltIcon',
      },
      {
        name: 'Speed Profiles',
        href: routes.speedProfiles,
        icon: 'SpeedIcon',
      },
      {
        name: 'Zones',
        href: routes.zones,
        icon: 'UserSettingsIcon',
      },
      {
        name: 'ODbs',
        href: routes.odbs,
        icon: 'UserSettingsIcon',
      },
      {
        name: 'ONU Types',
        href: routes.onuTypes,
        icon: 'OntIcon',
      },
    ],
  },
  users: {
    name: 'Users',
    type: 'link',
    dropdownItems: [
      {
        name: 'Users',
        href: routes.users,
        icon: 'FilesIcon',
      },
    ],
  },
};

export type LithiumMenuItemsKeys = keyof typeof lithiumMenuItems;
