import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { Permission } from '../models/Permission';
import { MenuManager } from '../models/MenuManager';
import {
  createPermissionSchema,
  updatePermissionSchema,
  getPermissionsQuerySchema,
  createCrudPermissionsSchema,
} from '../validators';
import { z } from 'zod';
import { withPermissions } from '../utils/controller.decorator';

export class PermissionController {
  /**
   * Permission definitions (mirip Laravel constructor middleware)
   */
  static permissions = {
    index: 'role-index',
    show: 'role-index',
    groupedByMenu: 'role-index',
    store: ['permission-store', 'super-admin'],
    createCrudPermissions: ['permission-create-crud', 'super-admin'],
    update: ['permission-update', 'super-admin'],
    destroy: ['permission-destroy', 'super-admin'],
  };

  /**
   * Get all menu managers with their permissions (grouped)
   */
  static async index(c: Context) {
    try {
      const query = c.req.query();
      const validated = getPermissionsQuerySchema.parse(query);

      const menuRepo = AppDataSource.getRepository(MenuManager);

      const queryBuilder = menuRepo
        .createQueryBuilder('menu')
        .leftJoinAndSelect('menu.permissions', 'permissions')
        .orderBy('menu.sort', 'ASC')
        .addOrderBy('menu.createdAt', 'DESC');

      // Search by menu title or permissions
      if (validated.search) {
        queryBuilder.where(
          '(menu.title ILIKE :search OR menu.slug ILIKE :search OR permissions.name ILIKE :search OR permissions.slug ILIKE :search)',
          { search: `%${validated.search}%` }
        );
      }

      // Filter by specific menu
      if (validated.menuId) {
        queryBuilder.andWhere('menu.id = :menuId', { menuId: validated.menuId });
      }

      // Filter by action - check if any permission has this action
      if (validated.action) {
        queryBuilder.andWhere('permissions.slug LIKE :action', { action: `%-${validated.action}` });
      }

      // Count total menus
      const total = await queryBuilder.getCount();

      // Check if pagination=all to skip pagination
      let menus;
      if (validated.pagination === 'all') {
        menus = await queryBuilder.getMany();
      } else {
        // Apply pagination
        menus = await queryBuilder
          .skip((validated.page - 1) * validated.limit)
          .take(validated.limit)
          .getMany();
      }

      // Define CRUD action order
      const actionOrder = ['index', 'store', 'update', 'destroy'];

      // Helper function to get action from slug
      const getActionFromSlug = (slug: string) => {
        const parts = slug.split('-');
        return parts[parts.length - 1];
      };

      // Transform data to match frontend expectations
      const transformedData = menus.map((menu) => {
        // Sort permissions by CRUD order
        const sortedPermissions = (menu.permissions || []).sort((a, b) => {
          const actionA = getActionFromSlug(a.slug);
          const actionB = getActionFromSlug(b.slug);
          const indexA = actionOrder.indexOf(actionA);
          const indexB = actionOrder.indexOf(actionB);

          // If action not found in order, put it at the end
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;

          return indexA - indexB;
        });

        return {
          id: menu.id,
          menuManagerId: menu.id,
          menu: {
            id: menu.id,
            title: menu.title,
            slug: menu.slug,
            pathUrl: menu.pathUrl,
            icon: menu.icon,
          },
          permissions: sortedPermissions,
          createdAt: menu.createdAt,
        };
      });

      return c.json({
        success: true,
        data: transformedData,
        meta: {
          page: validated.page,
          limit: validated.limit,
          total,
          totalPages: Math.ceil(total / validated.limit),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, message: 'Validation error', errors: error.errors }, 400);
      }
      console.error('Get menu managers with permissions error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Get single permission by ID
   */
  static async show(c: Context) {
    try {
      const id = c.req.param('id');
      const permissionRepo = AppDataSource.getRepository(Permission);

      const permission = await permissionRepo.findOne({
        where: { id },
        relations: ['menu', 'roles'],
      });

      if (!permission) {
        return c.json({ success: false, message: 'Permission not found' }, 404);
      }

      return c.json({ success: true, data: permission });
    } catch (error) {
      console.error('Get permission error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Create new permission(s)
   * If 'resource' and 'actions' are provided, creates CRUD permissions
   * Otherwise creates a single permission
   */
  static async store(c: Context) {
    try {
      const body = await c.req.json();

      // Check if this is a CRUD permissions request
      if (body.resource && body.actions) {
        // Create CRUD permissions with auto-created MenuManager
        const validated = createCrudPermissionsSchema.parse(body);
        const permissionRepo = AppDataSource.getRepository(Permission);
        const menuRepo = AppDataSource.getRepository(MenuManager);

        // Auto-generate slug from title if not provided
        const slug = validated.slug || validated.title.toLowerCase().replace(/\s+/g, '-');

        // Handle pathUrl: if undefined, auto-generate from slug. If empty string, keep it empty
        const pathUrl = validated.pathUrl !== undefined ? validated.pathUrl : `/${slug}`;

        // Create MenuManager first
        const menuManager = menuRepo.create({
          title: validated.title,
          slug,
          pathUrl,
          icon: validated.icon || '',
          type: 'module',
          position: '',
          sort: 0,
        });

        await menuRepo.save(menuManager);

        const createdPermissions = [];
        const actionNames: Record<string, string> = {
          index: 'List',
          store: 'Create',
          update: 'Update',
          destroy: 'Delete',
        };

        for (const action of validated.actions) {
          const permSlug = `${validated.resource}-${action}`;
          const name = `${validated.title} ${actionNames[action]}`;

          // Check if permission already exists
          const existing = await permissionRepo.findOne({ where: { slug: permSlug } });
          if (existing) {
            continue; // Skip if already exists
          }

          const permission = permissionRepo.create({
            menuManagerId: menuManager.id,
            name,
            slug: permSlug,
            description: `${actionNames[action]} ${validated.title}`,
          });

          await permissionRepo.save(permission);
          createdPermissions.push(permission);
        }

        return c.json({
          success: true,
          data: createdPermissions,
          message: `Created ${createdPermissions.length} CRUD permissions`,
        }, 201);
      } else {
        // Create single permission
        const validated = createPermissionSchema.parse(body);
        const permissionRepo = AppDataSource.getRepository(Permission);
        const menuRepo = AppDataSource.getRepository(MenuManager);

        // Check if slug already exists
        const existingPermission = await permissionRepo.findOne({ where: { slug: validated.slug } });
        if (existingPermission) {
          return c.json({ success: false, message: 'Permission with this slug already exists' }, 400);
        }

        // Check if menu exists (if provided)
        if (validated.menuManagerId) {
          const menu = await menuRepo.findOne({ where: { id: validated.menuManagerId } });
          if (!menu) {
            return c.json({ success: false, message: 'Menu not found' }, 404);
          }
        }

        // Create permission
        const permission = permissionRepo.create({
          menuManagerId: validated.menuManagerId,
          name: validated.name,
          slug: validated.slug,
          description: validated.description,
        });

        await permissionRepo.save(permission);

        // Reload with relations
        const savedPermission = await permissionRepo.findOne({
          where: { id: permission.id },
          relations: ['menu', 'roles'],
        });

        return c.json({ success: true, data: savedPermission, message: 'Permission created successfully' }, 201);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, message: 'Validation error', errors: error.errors }, 400);
      }
      console.error('Create permission error:', error);
      return c.json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' }, 500);
    }
  }

  /**
   * Create CRUD permissions for a resource
   */
  static async createCrudPermissions(c: Context) {
    try {
      const body = await c.req.json();
      const validated = createCrudPermissionsSchema.parse(body);

      const permissionRepo = AppDataSource.getRepository(Permission);
      const menuRepo = AppDataSource.getRepository(MenuManager);

      // Check if menu exists
      const menu = await menuRepo.findOne({ where: { id: validated.menuManagerId } });
      if (!menu) {
        return c.json({ success: false, message: 'Menu not found' }, 404);
      }

      const createdPermissions = [];
      const actionNames: Record<string, string> = {
        index: 'List',
        store: 'Create',
        update: 'Update',
        destroy: 'Delete',
      };

      for (const action of validated.actions) {
        const slug = `${validated.resource}-${action}`;
        const name = `${menu.title} ${actionNames[action]}`;

        // Check if already exists
        const existing = await permissionRepo.findOne({ where: { slug } });
        if (existing) {
          continue; // Skip if already exists
        }

        const permission = permissionRepo.create({
          menuManagerId: validated.menuManagerId,
          name,
          slug,
          description: `${actionNames[action]} ${validated.resource}`,
        });

        await permissionRepo.save(permission);
        createdPermissions.push(permission);
      }

      return c.json({
        success: true,
        data: createdPermissions,
        message: `Created ${createdPermissions.length} CRUD permissions`,
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, message: 'Validation error', errors: error.errors }, 400);
      }
      console.error('Create CRUD permissions error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Update menu manager and all related permissions
   */
  static async update(c: Context) {
    try {
      const menuManagerId = c.req.param('menuManagerId');
      const body = await c.req.json();

      const menuRepo = AppDataSource.getRepository(MenuManager);
      const permissionRepo = AppDataSource.getRepository(Permission);

      // Find menu manager
      const menuManager = await menuRepo.findOne({ where: { id: menuManagerId } });
      if (!menuManager) {
        return c.json({ success: false, message: 'Menu not found' }, 404);
      }

      // Update menu manager
      menuManager.title = body.title;
      menuManager.slug = body.slug;
      menuManager.pathUrl = body.pathUrl !== undefined ? body.pathUrl : menuManager.pathUrl;
      menuManager.icon = body.icon !== undefined ? body.icon : menuManager.icon;

      await menuRepo.save(menuManager);

      // Update all related permissions
      const permissions = await permissionRepo.find({
        where: { menuManagerId },
        order: { id: 'ASC' }
      });

      const actionNames: Record<string, string> = {
        index: 'List',
        store: 'Create',
        update: 'Update',
        destroy: 'Delete',
      };

      for (const permission of permissions) {
        // Extract action from current slug (e.g., "user-index" -> "index")
        const parts = permission.slug.split('-');
        const action = parts[parts.length - 1];

        // Update permission with new slug and name
        permission.slug = `${body.slug}-${action}`;
        permission.name = `${body.title} ${actionNames[action] || action}`;

        await permissionRepo.save(permission);
      }

      return c.json({
        success: true,
        data: { menuManager, permissions },
        message: 'Menu and permissions updated successfully'
      });
    } catch (error) {
      console.error('Update menu manager error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Delete menu manager and all related permissions
   */
  static async destroy(c: Context) {
    try {
      const menuManagerId = c.req.param('id');
      const menuRepo = AppDataSource.getRepository(MenuManager);
      const permissionRepo = AppDataSource.getRepository(Permission);

      // Find menu manager
      const menuManager = await menuRepo.findOne({
        where: { id: menuManagerId },
        relations: ['permissions']
      });

      if (!menuManager) {
        return c.json({ success: false, message: 'Menu not found' }, 404);
      }

      // Count how many permissions will be deleted
      const permissionsCount = menuManager.permissions?.length || 0;

      // Delete menu manager (will cascade delete all related permissions)
      await menuRepo.remove(menuManager);

      return c.json({
        success: true,
        message: `Menu and ${permissionsCount} related permissions deleted successfully`
      });
    } catch (error) {
      console.error('Delete menu manager error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Get all permissions grouped by menu
   */
  static async groupedByMenu(c: Context) {
    try {
      const menuRepo = AppDataSource.getRepository(MenuManager);

      const menus = await menuRepo.find({
        relations: ['permissions'],
        order: { sort: 'ASC' },
      });

      const grouped = menus.map((menu) => ({
        id: menu.id,
        title: menu.title,
        slug: menu.slug,
        permissions: menu.permissions,
      }));

      return c.json({ success: true, data: grouped });
    } catch (error) {
      console.error('Get grouped permissions error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }
}

// Export wrapped controller dengan permission checks
export const PermissionControllerWithPermissions = withPermissions(
  PermissionController,
  PermissionController.permissions
);

