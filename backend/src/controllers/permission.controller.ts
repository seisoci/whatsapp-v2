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

export class PermissionController {
  /**
   * Get all permissions with pagination
   */
  static async index(c: Context) {
    try {
      const query = c.req.query();
      const validated = getPermissionsQuerySchema.parse(query);

      const permissionRepo = AppDataSource.getRepository(Permission);

      const queryBuilder = permissionRepo
        .createQueryBuilder('permission')
        .leftJoinAndSelect('permission.menu', 'menu')
        .leftJoinAndSelect('permission.roles', 'roles');

      // Search
      if (validated.search) {
        queryBuilder.where('permission.name ILIKE :search OR permission.slug ILIKE :search', {
          search: `%${validated.search}%`,
        });
      }

      // Filter by menu
      if (validated.menuId) {
        queryBuilder.andWhere('permission.menuManagerId = :menuId', { menuId: validated.menuId });
      }

      // Filter by action
      if (validated.action) {
        queryBuilder.andWhere('permission.slug LIKE :action', { action: `%-${validated.action}` });
      }

      // Count total
      const total = await queryBuilder.getCount();

      // Pagination
      const permissions = await queryBuilder
        .orderBy(`permission.${validated.sortBy || 'createdAt'}`, validated.sortOrder)
        .skip((validated.page - 1) * validated.limit)
        .take(validated.limit)
        .getMany();

      return c.json({
        success: true,
        data: permissions,
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
      console.error('Get permissions error:', error);
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
   * Create new permission
   */
  static async store(c: Context) {
    try {
      const body = await c.req.json();
      const validated = createPermissionSchema.parse(body);

      const permissionRepo = AppDataSource.getRepository(Permission);
      const menuRepo = AppDataSource.getRepository(MenuManager);

      // Check if slug already exists
      const existingPermission = await permissionRepo.findOne({ where: { slug: validated.slug } });
      if (existingPermission) {
        return c.json({ success: false, message: 'Permission with this slug already exists' }, 400);
      }

      // Check if menu exists
      const menu = await menuRepo.findOne({ where: { id: validated.menuManagerId } });
      if (!menu) {
        return c.json({ success: false, message: 'Menu not found' }, 404);
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, message: 'Validation error', errors: error.errors }, 400);
      }
      console.error('Create permission error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
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
        show: 'View',
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
   * Update permission
   */
  static async update(c: Context) {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const validated = updatePermissionSchema.parse(body);

      const permissionRepo = AppDataSource.getRepository(Permission);

      const permission = await permissionRepo.findOne({ where: { id } });

      if (!permission) {
        return c.json({ success: false, message: 'Permission not found' }, 404);
      }

      // Check slug uniqueness if changed
      if (validated.slug && validated.slug !== permission.slug) {
        const existingPermission = await permissionRepo.findOne({ where: { slug: validated.slug } });
        if (existingPermission) {
          return c.json({ success: false, message: 'Permission with this slug already exists' }, 400);
        }
      }

      // Update fields
      if (validated.menuManagerId) permission.menuManagerId = validated.menuManagerId;
      if (validated.name) permission.name = validated.name;
      if (validated.slug) permission.slug = validated.slug;
      if (validated.description !== undefined) permission.description = validated.description;

      await permissionRepo.save(permission);

      // Reload with relations
      const updatedPermission = await permissionRepo.findOne({
        where: { id },
        relations: ['menu', 'roles'],
      });

      return c.json({ success: true, data: updatedPermission, message: 'Permission updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, message: 'Validation error', errors: error.errors }, 400);
      }
      console.error('Update permission error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Delete permission
   */
  static async destroy(c: Context) {
    try {
      const id = c.req.param('id');
      const permissionRepo = AppDataSource.getRepository(Permission);

      const permission = await permissionRepo.findOne({ where: { id } });

      if (!permission) {
        return c.json({ success: false, message: 'Permission not found' }, 404);
      }

      await permissionRepo.remove(permission);

      return c.json({ success: true, message: 'Permission deleted successfully' });
    } catch (error) {
      console.error('Delete permission error:', error);
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
