import { Context, Next } from 'hono';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Role } from '../models/Role';

/**
 * Permission Middleware
 * Memeriksa apakah user memiliki permission tertentu
 */

/**
 * Check if user has specific permission(s)
 * @param permissions - Single permission slug or array of permission slugs
 * @param requireAll - If true, user must have all permissions. If false, user must have at least one
 */
export const hasPermission = (permissions: string | string[], requireAll: boolean = false) => {
  return async (c: Context, next: Next) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json(
          {
            success: false,
            message: 'Unauthorized - No user found',
          },
          401
        );
      }

      // Get user with role and permissions
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['role', 'role.permissions'],
      });

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'User not found',
          },
          404
        );
      }

      if (!user.role) {
        return c.json(
          {
            success: false,
            message: 'User has no role assigned',
          },
          403
        );
      }

      // Check if role is active
      if (!user.role.isActive) {
        return c.json(
          {
            success: false,
            message: 'Your role is inactive',
          },
          403
        );
      }

      // Normalize permissions to array
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

      // Check permissions
      let hasAccess = false;

      if (requireAll) {
        // User must have ALL permissions
        hasAccess = user.role.hasAllPermissions(requiredPermissions);
      } else {
        // User must have AT LEAST ONE permission
        hasAccess = user.role.hasAnyPermission(requiredPermissions);
      }

      if (!hasAccess) {
        return c.json(
          {
            success: false,
            message: 'Forbidden - Insufficient permissions',
            required: requiredPermissions,
            userPermissions: user.role.getPermissionSlugs(),
          },
          403
        );
      }

      // Store user and role in context for later use
      c.set('user', user);
      c.set('role', user.role);

      await next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return c.json(
        {
          success: false,
          message: 'Internal server error during permission check',
        },
        500
      );
    }
  };
};

/**
 * Check if user can perform CRUD action on a resource
 * @param resource - Resource name (e.g., 'user', 'role')
 * @param action - CRUD action: 'index' | 'store' | 'show' | 'update' | 'destroy'
 */
export const canAccess = (resource: string, action: 'index' | 'store' | 'show' | 'update' | 'destroy') => {
  const permissionSlug = `${resource}-${action}`;
  return hasPermission(permissionSlug);
};

/**
 * Check if user can perform any CRUD action on a resource
 * @param resource - Resource name
 * @param actions - Array of actions to check
 */
export const canAccessAny = (resource: string, actions: Array<'index' | 'store' | 'show' | 'update' | 'destroy'>) => {
  const permissionSlugs = actions.map((action) => `${resource}-${action}`);
  return hasPermission(permissionSlugs, false);
};

/**
 * Check if user can perform all CRUD actions on a resource
 * @param resource - Resource name
 * @param actions - Array of actions to check
 */
export const canAccessAll = (resource: string, actions: Array<'index' | 'store' | 'show' | 'update' | 'destroy'>) => {
  const permissionSlugs = actions.map((action) => `${resource}-${action}`);
  return hasPermission(permissionSlugs, true);
};

/**
 * Shorthand middlewares for common CRUD operations
 */
export const canIndex = (resource: string) => canAccess(resource, 'index');
export const canStore = (resource: string) => canAccess(resource, 'store');
export const canShow = (resource: string) => canAccess(resource, 'show');
export const canUpdate = (resource: string) => canAccess(resource, 'update');
export const canDestroy = (resource: string) => canAccess(resource, 'destroy');

/**
 * Check if user has full CRUD access to a resource
 */
export const hasFullAccess = (resource: string) => {
  return canAccessAll(resource, ['index', 'store', 'show', 'update', 'destroy']);
};
