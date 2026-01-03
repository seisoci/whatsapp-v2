import { Context, Next } from 'hono';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

/**
 * Controller Permission Wrapper
 * Mirip dengan Laravel: $this->middleware('permissions:user-index', ['only' => ['index']])
 * 
 * Usage:
 * export class UserController {
 *   static permissions = {
 *     index: 'user-index',
 *     store: 'user-store',
 *   };
 * }
 * 
 * export const UserControllerWithPermissions = withPermissions(
 *   UserController,
 *   UserController.permissions
 * );
 */

type PermissionMap = Record<string, string | string[]>;

/**
 * Wrap controller methods dengan permission checks
 */
export const withPermissions = <T extends Record<string, any>>(
  controller: T,
  permissions: PermissionMap
): T => {
  const wrappedController: any = {};

  // Get all static method names from the controller class
  const methodNames = Object.getOwnPropertyNames(controller).filter(
    (name) => name !== 'length' && name !== 'prototype' && name !== 'name' && name !== 'permissions'
  );

  // Loop through all methods in controller
  for (const methodName of methodNames) {
    const originalMethod = controller[methodName];

    // Skip if not a function
    if (typeof originalMethod !== 'function') {
      wrappedController[methodName] = originalMethod;
      continue;
    }

    // Check if this method has permission requirements
    const requiredPermissions = permissions[methodName];

    if (!requiredPermissions) {
      // No permission required, use original method
      wrappedController[methodName] = originalMethod;
      continue;
    }

    // Wrap method with permission check
    wrappedController[methodName] = async (c: Context, next?: Next) => {
      try {
        // Get user from context (set by authMiddleware)
        const decoded = c.get('user');

        if (!decoded || !decoded.userId) {
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
          where: { id: decoded.userId },
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

        // Super admin bypasses all permission checks
        if (user.isSuperAdmin()) {
          // Store user and role in context
          c.set('user', user);
          c.set('role', user.role);
          return await originalMethod.call(controller, c, next);
        }

        // Normalize permissions to array and filter out 'super-admin'
        // (super-admin already bypassed above, so we only check regular permissions)
        const permissionsArray = Array.isArray(requiredPermissions)
          ? requiredPermissions.filter(p => p !== 'super-admin')
          : requiredPermissions === 'super-admin'
            ? [] // If only 'super-admin', non-super-admin users have no valid permissions
            : [requiredPermissions];

        // If no valid permissions left (e.g., only 'super-admin' was specified)
        // and user is not super admin, deny access
        if (permissionsArray.length === 0) {
          return c.json(
            {
              success: false,
              message: 'Forbidden - Super admin access required',
            },
            403
          );
        }

        // Check if user has any of the required permissions using helper method
        const hasAccess = user.hasAnyPermission(permissionsArray);

        if (!hasAccess) {
          return c.json(
            {
              success: false,
              message: 'Forbidden - Insufficient permissions',
              required: permissionsArray,
              userPermissions: user.getPermissionSlugs(),
            },
            403
          );
        }

        // Store user and role in context
        c.set('user', user);
        c.set('role', user.role);

        // Call original method
        return await originalMethod.call(controller, c, next);
      } catch (error) {
        console.error(`Permission check error for ${methodName}:`, error);
        return c.json(
          {
            success: false,
            message: 'Internal server error during permission check',
          },
          500
        );
      }
    };
  }

  return wrappedController as T;
};
