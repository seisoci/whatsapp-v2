import { Context, Next } from 'hono';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

/**
 * Role Middleware
 * Memeriksa apakah user memiliki role tertentu
 */

/**
 * Check if user has specific role(s)
 * @param roles - Single role slug or array of role slugs
 */
export const hasRole = (roles: string | string[]) => {
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

      // Get user with role
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['role'],
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

      // Normalize roles to array
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      // Check if user's role is in allowed roles
      const hasAccess = allowedRoles.includes(user.role.slug);

      if (!hasAccess) {
        return c.json(
          {
            success: false,
            message: 'Forbidden - Insufficient role privileges',
            required: allowedRoles,
            userRole: user.role.slug,
          },
          403
        );
      }

      // Store user and role in context for later use
      c.set('user', user);
      c.set('role', user.role);

      await next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return c.json(
        {
          success: false,
          message: 'Internal server error during role check',
        },
        500
      );
    }
  };
};

/**
 * Check if user is Super Admin
 */
export const isSuperAdmin = () => hasRole('super-admin');

/**
 * Check if user is Admin (Super Admin or Admin)
 */
export const isAdmin = () => hasRole(['super-admin', 'admin']);

/**
 * Check if user is regular User
 */
export const isUser = () => hasRole('user');

/**
 * Check if user has any of admin roles
 */
export const isAnyAdmin = () => hasRole(['super-admin', 'admin']);

/**
 * Check if user can access menu based on role
 */
export const canAccessMenu = (menuSlug: string) => {
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

      // Get user with role and menus
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['role', 'role.menus'],
      });

      if (!user || !user.role) {
        return c.json(
          {
            success: false,
            message: 'User or role not found',
          },
          403
        );
      }

      // Check if user's role has access to this menu
      const hasMenuAccess = user.role.menus?.some((menu) => menu.slug === menuSlug);

      if (!hasMenuAccess) {
        return c.json(
          {
            success: false,
            message: 'Forbidden - No access to this menu',
            menu: menuSlug,
          },
          403
        );
      }

      // Store user and role in context
      c.set('user', user);
      c.set('role', user.role);

      await next();
    } catch (error) {
      console.error('Menu access middleware error:', error);
      return c.json(
        {
          success: false,
          message: 'Internal server error during menu access check',
        },
        500
      );
    }
  };
};
