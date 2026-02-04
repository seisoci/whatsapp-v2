'use client';

import React, { useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  menuPermissions,
  menuGroupPermissions,
  canAccessMenu,
  canAccessMenuGroup,
} from '@/config/menu-permissions';
import type { ItemType, SubMenuItemType, MenuItemsType } from '@/layouts/beryllium/beryllium-fixed-menu-items';

/**
 * Hook to filter menu items based on user permissions
 * Returns filtered menu items that the user has access to
 */
export function usePermissionMenu() {
  const { user, isSuperAdmin, getPermissionSlugs } = useAuth();

  const userPermissions = useMemo(() => {
    return getPermissionSlugs();
  }, [getPermissionSlugs, user]);

  const isAdmin = useMemo(() => isSuperAdmin(), [isSuperAdmin, user]);

  /**
   * Check if user can access a specific menu item
   */
  const canAccess = useCallback(
    (href: string): boolean => {
      return canAccessMenu(href, userPermissions, isAdmin);
    },
    [userPermissions, isAdmin]
  );

  /**
   * Check if user can access a menu group (parent menu with submenus)
   */
  const canAccessGroup = useCallback(
    (groupKey: string): boolean => {
      return canAccessMenuGroup(groupKey, userPermissions, isAdmin);
    },
    [userPermissions, isAdmin]
  );

  /**
   * Filter menu items based on user permissions
   */
  const filterMenuItems = useCallback(
    (items: ItemType[]): ItemType[] => {
      return items
        .map((item) => {
          // If item has subMenuItems, filter them
          if (item.subMenuItems && item.subMenuItems.length > 0) {
            const filteredSubItems = item.subMenuItems.filter((subItem) =>
              canAccessMenu(subItem.href, userPermissions, isAdmin)
            );

            // If no sub items are accessible, hide the parent menu
            if (filteredSubItems.length === 0) {
              return null;
            }

            return {
              ...item,
              subMenuItems: filteredSubItems,
            };
          }

          // For items without submenus, check direct access
          if (item.href && !canAccessMenu(item.href, userPermissions, isAdmin)) {
            return null;
          }

          return item;
        })
        .filter((item): item is ItemType => item !== null);
    },
    [userPermissions, isAdmin]
  );

  /**
   * Filter entire menu structure
   */
  const filterMenuStructure = useCallback(
    (menuSections: MenuItemsType[]): MenuItemsType[] => {
      return menuSections
        .map((section) => ({
          ...section,
          menuItems: filterMenuItems(section.menuItems),
        }))
        .filter((section) => section.menuItems.length > 0);
    },
    [filterMenuItems]
  );

  return {
    canAccess,
    canAccessGroup,
    filterMenuItems,
    filterMenuStructure,
    userPermissions,
    isAdmin,
  };
}

/**
 * Hook to check specific permission
 */
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Hook to check if user has any of the permissions
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(permissions);
}

/**
 * Component wrapper that only renders children if user has permission
 */
export function PermissionGate({
  children,
  permissions,
  fallback = null,
}: {
  children: React.ReactNode;
  permissions: string[];
  fallback?: React.ReactNode;
}) {
  const hasAccess = useHasAnyPermission(permissions);

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
}
