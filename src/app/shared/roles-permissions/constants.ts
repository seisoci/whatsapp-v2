import { ROLES } from '@/config/constants';

export const PERMISSIONS = {
  Read: 'Read',
  Write: 'Write',
  Delete: 'Delete',
} as const;

export const STATUSES = {
  Pending: 'Pending',
  Active: 'Active',
  Deactivated: 'Deactivated',
} as const;

export type UsersTableDataType = {
  id: string;
  avatar: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  permissions: string[];
  status: string;
};

export const usersTableData: UsersTableDataType[] = [
  {
    id: '0256',
    avatar: '/avatar.webp',
    fullName: 'Bessie Beatty',
    email: 'christophe78@gmail.com',
    role: ROLES.Manager,
    createdAt: '2029-10-14T16:01:40.021Z',
    permissions: [PERMISSIONS.Read],
    status: STATUSES.Pending,
  },
  {
    id: '6177',
    avatar: '/avatar.webp',
    fullName: 'Joshua Green',
    email: 'ayla_schuster28@yahoo.com',
    role: ROLES.Support,
    createdAt: '2027-11-01T13:23:52.903Z',
    permissions: [PERMISSIONS.Write],
    status: STATUSES.Pending,
  },
  {
    id: '5456',
    avatar: '/avatar.webp',
    fullName: 'Wendy Ankunding',
    email: 'lorine66@gmail.com',
    role: ROLES.Support,
    createdAt: '2024-12-29T08:37:13.101Z',
    permissions: [PERMISSIONS.Delete, PERMISSIONS.Write, PERMISSIONS.Read],
    status: STATUSES.Active,
  },
];

const roleUsers = [
  { id: 1, role: ROLES.Administrator, avatar: '/avatar.webp' },
  { id: 2, role: ROLES.Administrator, avatar: '/avatar.webp' },
  { id: 3, role: ROLES.Administrator, avatar: '/avatar.webp' },
  { id: 4, role: ROLES.Administrator, avatar: '/avatar.webp' },
];

export const rolesList = [
  { name: ROLES.Administrator, color: '#2465FF', users: roleUsers },
  { name: ROLES.Manager, color: '#F5A623', users: roleUsers },
  { name: ROLES.Sales, color: '#FF1A1A', users: roleUsers },
  { name: ROLES.Support, color: '#8A63D2', users: roleUsers },
  { name: ROLES.Developer, color: '#FF1A1A', users: roleUsers },
  { name: ROLES.HRD, color: '#11A849', users: roleUsers },
  { name: ROLES.RestrictedUser, color: '#4E36F5', users: roleUsers },
  { name: ROLES.Customer, color: '#0070F3', users: roleUsers },
];
