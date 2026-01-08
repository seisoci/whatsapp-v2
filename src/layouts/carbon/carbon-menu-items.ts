import { DUMMY_ID } from '@/config/constants';
import { routes } from '@/config/routes';
import { atom } from 'jotai';
import { IconType } from 'react-icons/lib';
import {
  PiAirplaneTilt,
  PiApplePodcastsLogo,
  PiAppStoreLogo,
  PiArrowsOut,
  PiArrowsOutLineHorizontalBold,
  PiBellSimpleRinging,
  PiBinoculars,
  PiBriefcase,
  PiBrowser,
  PiCalendar,
  PiCalendarPlus,
  PiCards,
  PiCaretCircleUpDown,
  PiChartBar,
  PiChartLineUp,
  PiChartPieSlice,
  PiChatCenteredDots,
  PiClipboardText,
  PiCodesandboxLogo,
  PiCreditCard,
  PiCurrencyCircleDollar,
  PiCurrencyDollar,
  PiEnvelopeSimpleOpen,
  PiFeather,
  PiFileImage,
  PiFolder,
  PiFolderLock,
  PiFolderUser,
  PiGridFour,
  PiHammer,
  PiHeadset,
  PiHourglassSimple,
  PiHouseLine,
  PiListNumbers,
  PiLockKey,
  PiMagicWand,
  PiMapPinLine,
  PiNewspaperClipping,
  PiNoteBlank,
  PiNotePencil,
  PiPackage,
  PiPokerChip,
  PiPresentationChart,
  PiPushPin,
  PiRocketLaunch,
  PiScales,
  PiShapes,
  PiShieldCheckered,
  PiShootingStar,
  PiShoppingCart,
  PiSparkle,
  PiSquaresFour,
  PiSteps,
  PiTable,
  PiUserCircle,
  PiUserGear,
  PiUserPlus,
  PiStairs,
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

export const carbonMenuItems: MenuItemsType[] = [
  {
    id: '1',
    name: 'Dashboard',
    title: 'Overview',
    icon: PiBrowser,
    menuItems: [




    ],
  },
  {
    id: '2',
    name: 'Apps Kit',
    title: 'Apps Kit',
    icon: PiAppStoreLogo,
    menuItems: [
      {
        name: 'Templates',
        href: routes.templates,
        icon: PiBrowser,
      },






      {
        name: 'Roles & Permissions',
        href: routes.rolesPermissions,
        icon: PiFolderLock,
      },



    ],
  },




  {
    id: '7',
    name: 'Pages',
    title: 'Pages',
    icon: PiCards,
    menuItems: [
      {
        name: 'Profile',
        href: routes.profile,
        icon: PiMagicWand,
      },
      {
        name: 'Welcome',
        href: routes.welcome,
        icon: PiShootingStar,
      },
      {
        name: 'Coming Soon',
        href: routes.comingSoon,
        icon: PiRocketLaunch,
      },
      {
        name: 'Access Denied',
        href: routes.accessDenied,
        icon: PiFolderLock,
      },
      {
        name: 'Not Found',
        href: routes.notFound,
        icon: PiBinoculars,
      },
      {
        name: 'Maintenance',
        href: routes.maintenance,
        icon: PiHammer,
      },
      {
        name: 'Blank',
        href: routes.blank,
        icon: PiNoteBlank,
      },
    ],
  },
  {
    id: '8',
    name: 'Authentication',
    title: 'Authentication',
    icon: PiShieldCheckered,
    menuItems: [
      {
        name: 'Sign Up',
        icon: PiUserPlus,
        description: '"Shop Smart, Click Quick: Your One-Stop Solution!"',
        href: '#',
        subMenuItems: [
          {
            name: 'Modern Sign Up',
            href: routes.auth.signUp1,
          },
          {
            name: 'Vintage Sign Up',
            href: routes.auth.signUp2,
          },
          {
            name: 'Trendy Sign Up',
            href: routes.auth.signUp3,
          },
          {
            name: 'Elegant Sign Up',
            href: routes.auth.signUp4,
          },
          {
            name: 'Classic Sign Up',
            href: routes.auth.signUp5,
          },
        ],
      },
      {
        name: 'Sign In',
        icon: PiShieldCheckered,
        description: '"Effortless Assistance at your Fingertips!"',
        href: '#',
        subMenuItems: [
          {
            name: 'Modern Sign In',
            href: routes.auth.signIn1,
          },
          {
            name: 'Vintage Sign In',
            href: routes.auth.signIn2,
          },
          {
            name: 'Trendy Sign In',
            href: routes.auth.signIn3,
          },
          {
            name: 'Elegant Sign In',
            href: routes.auth.signIn4,
          },
          {
            name: 'Classic Sign In',
            href: routes.auth.signIn5,
          },
        ],
      },
      {
        name: 'Forgot Password',
        icon: PiLockKey,
        description:
          '"Streamline Shipments: Discover Efficiency with our Logistics!"',
        href: '#',
        subMenuItems: [
          {
            name: 'Modern Forgot Password',
            href: routes.auth.forgotPassword1,
          },
          {
            name: 'Vintage Forgot Password',
            href: routes.auth.forgotPassword2,
          },
          {
            name: 'Trendy Forgot Password',
            href: routes.auth.forgotPassword3,
          },
          {
            name: 'Elegant Forgot Password',
            href: routes.auth.forgotPassword4,
          },
          {
            name: 'Classic Forgot Password',
            href: routes.auth.forgotPassword5,
          },
        ],
      },

    ],
  },
];

export const carbonMenuItemAtom = atom(carbonMenuItems[0]);
