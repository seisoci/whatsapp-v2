/**
 * Menu Permission Configuration
 *
 * Defines which permissions are required to view each menu item.
 * If user has ANY of the listed permissions, the menu will be visible.
 *
 * Format: menuKey => array of permission slugs (any of these grants access)
 *
 * Permission slug format: {resource}-{action}
 * Actions: index, store, show, update, destroy
 */

export interface MenuPermissionConfig {
  permissions: string[];
  children?: Record<string, MenuPermissionConfig>;
}

/**
 * Permission mapping for menu items
 * Key matches the menu href or a unique identifier
 */
export const menuPermissions: Record<string, MenuPermissionConfig> = {
  // Dashboard - always visible if user has dashboard-index
  '/': {
    permissions: ['dashboard-index'],
  },

  // Chat
  '/chat': {
    permissions: ['chat-index', 'chat-store', 'chat-update', 'chat-destroy'],
  },

  // WhatsApp - Phone Numbers
  '/phone-numbers': {
    permissions: ['phone-number-index', 'phone-number-store', 'phone-number-update', 'phone-number-destroy'],
  },

  // WhatsApp - Contacts
  '/contacts': {
    permissions: ['contact-index', 'contact-store', 'contact-update', 'contact-destroy'],
  },

  // WhatsApp - Quick Replies
  '/quick-replies': {
    permissions: ['quick-reply-index', 'quick-reply-store', 'quick-reply-update', 'quick-reply-destroy'],
  },

  // WhatsApp - Templates
  '/templates': {
    permissions: ['template-index', 'template-store', 'template-update', 'template-destroy'],
  },

  // Management - Users
  '/users': {
    permissions: ['user-index', 'user-store', 'user-update', 'user-destroy'],
  },

  // Management - Roles
  '/roles': {
    permissions: ['role-index', 'role-store', 'role-update', 'role-destroy'],
  },

  // Management - Permissions
  '/permissions': {
    permissions: ['permission-index', 'permission-store', 'permission-update', 'permission-destroy'],
  },

  // Management - Webhook / API Management
  '/api-management': {
    permissions: ['webhook-index', 'webhook-store', 'webhook-update', 'webhook-destroy'],
  },

  // Management - Message Queue
  '/message-queues': {
    permissions: ['message-queue-index', 'message-queue-store', 'message-queue-update', 'message-queue-destroy'],
  },
};

/**
 * Group permissions for parent menu visibility
 * Parent menu is visible if ANY of its children are visible
 */
export const menuGroupPermissions: Record<string, string[]> = {
  // WhatsApp group - visible if user has any of these permissions
  whatsapp: [
    'phone-number-index',
    'phone-number-store',
    'phone-number-update',
    'phone-number-destroy',
    'contact-index',
    'contact-store',
    'contact-update',
    'contact-destroy',
    'quick-reply-index',
    'quick-reply-store',
    'quick-reply-update',
    'quick-reply-destroy',
    'template-index',
    'template-store',
    'template-update',
    'template-destroy',
  ],

  // Management group - visible if user has any of these permissions
  management: [
    'user-index',
    'user-store',
    'user-update',
    'user-destroy',
    'role-index',
    'role-store',
    'role-update',
    'role-destroy',
    'permission-index',
    'permission-store',
    'permission-update',
    'permission-destroy',
    'webhook-index',
    'webhook-store',
    'webhook-update',
    'webhook-destroy',
    'message-queue-index',
    'message-queue-store',
    'message-queue-update',
    'message-queue-destroy',
  ],
};

/**
 * Helper function to check if user can access a menu
 */
export function canAccessMenu(
  menuHref: string,
  userPermissions: string[],
  isSuperAdmin: boolean = false
): boolean {
  // Super admin can access everything
  if (isSuperAdmin) return true;

  const config = menuPermissions[menuHref];
  if (!config) return true; // No permission config = accessible to all

  // Check if user has any of the required permissions
  return config.permissions.some((permission) => userPermissions.includes(permission));
}

/**
 * Helper function to check if user can access a menu group (parent menu)
 */
export function canAccessMenuGroup(
  groupKey: string,
  userPermissions: string[],
  isSuperAdmin: boolean = false
): boolean {
  // Super admin can access everything
  if (isSuperAdmin) return true;

  const groupPerms = menuGroupPermissions[groupKey];
  if (!groupPerms) return true; // No permission config = accessible to all

  // Check if user has any of the group permissions
  return groupPerms.some((permission) => userPermissions.includes(permission));
}
