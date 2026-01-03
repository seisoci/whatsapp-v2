import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { MenuManager } from '../models/MenuManager';
import {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionsSchema,
  assignMenusSchema,
  getRolesQuerySchema,
} from '../validators';
import { z } from 'zod';

export class RoleController {
  /**
   * Get all roles with pagination
   */
  static async index(c: Context) {
    try {
      const query = c.req.query();
      const validated = getRolesQuerySchema.parse(query);

      const roleRepo = AppDataSource.getRepository(Role);

      const queryBuilder = roleRepo
        .createQueryBuilder('role')
        .leftJoinAndSelect('role.permissions', 'permissions')
        .leftJoinAndSelect('role.menus', 'menus');

      // Search
      if (validated.search) {
        queryBuilder.where('role.name ILIKE :search OR role.slug ILIKE :search', {
          search: `%${validated.search}%`,
        });
      }

      // Filter by active status
      if (validated.isActive !== undefined) {
        queryBuilder.andWhere('role.isActive = :isActive', { isActive: validated.isActive });
      }

      // Count total
      const total = await queryBuilder.getCount();

      // Pagination
      const roles = await queryBuilder
        .orderBy(`role.${validated.sortBy || 'createdAt'}`, validated.sortOrder)
        .skip((validated.page - 1) * validated.limit)
        .take(validated.limit)
        .getMany();

      return c.json({
        success: true,
        data: roles,
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
      console.error('Get roles error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Get single role by ID
   */
  static async show(c: Context) {
    try {
      const id = c.req.param('id');
      const roleRepo = AppDataSource.getRepository(Role);

      const role = await roleRepo.findOne({
        where: { id },
        relations: ['permissions', 'menus'],
      });

      if (!role) {
        return c.json({ success: false, message: 'Role not found' }, 404);
      }

      return c.json({ success: true, data: role });
    } catch (error) {
      console.error('Get role error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Create new role
   */
  static async store(c: Context) {
    try {
      const body = await c.req.json();
      const validated = createRoleSchema.parse(body);

      const roleRepo = AppDataSource.getRepository(Role);
      const permissionRepo = AppDataSource.getRepository(Permission);
      const menuRepo = AppDataSource.getRepository(MenuManager);

      // Check if slug already exists
      const existingRole = await roleRepo.findOne({ where: { slug: validated.slug } });
      if (existingRole) {
        return c.json({ success: false, message: 'Role with this slug already exists' }, 400);
      }

      // Create role
      const role = roleRepo.create({
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        isActive: validated.isActive,
      });

      // Assign permissions if provided
      if (validated.permissionIds && validated.permissionIds.length > 0) {
        const permissions = await permissionRepo.findByIds(validated.permissionIds);
        role.permissions = permissions;
      }

      // Assign menus if provided
      if (validated.menuIds && validated.menuIds.length > 0) {
        const menus = await menuRepo.findByIds(validated.menuIds);
        role.menus = menus;
      }

      await roleRepo.save(role);

      // Reload with relations
      const savedRole = await roleRepo.findOne({
        where: { id: role.id },
        relations: ['permissions', 'menus'],
      });

      return c.json({ success: true, data: savedRole, message: 'Role created successfully' }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, message: 'Validation error', errors: error.errors }, 400);
      }
      console.error('Create role error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Update role
   */
  static async update(c: Context) {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const validated = updateRoleSchema.parse(body);

      const roleRepo = AppDataSource.getRepository(Role);
      const permissionRepo = AppDataSource.getRepository(Permission);
      const menuRepo = AppDataSource.getRepository(MenuManager);

      const role = await roleRepo.findOne({
        where: { id },
        relations: ['permissions', 'menus'],
      });

      if (!role) {
        return c.json({ success: false, message: 'Role not found' }, 404);
      }

      // Check slug uniqueness if changed
      if (validated.slug && validated.slug !== role.slug) {
        const existingRole = await roleRepo.findOne({ where: { slug: validated.slug } });
        if (existingRole) {
          return c.json({ success: false, message: 'Role with this slug already exists' }, 400);
        }
      }

      // Update fields
      if (validated.name) role.name = validated.name;
      if (validated.slug) role.slug = validated.slug;
      if (validated.description !== undefined) role.description = validated.description;
      if (validated.isActive !== undefined) role.isActive = validated.isActive;

      // Update permissions if provided
      if (validated.permissionIds) {
        const permissions = await permissionRepo.findByIds(validated.permissionIds);
        role.permissions = permissions;
      }

      // Update menus if provided
      if (validated.menuIds) {
        const menus = await menuRepo.findByIds(validated.menuIds);
        role.menus = menus;
      }

      await roleRepo.save(role);

      // Reload with relations
      const updatedRole = await roleRepo.findOne({
        where: { id },
        relations: ['permissions', 'menus'],
      });

      return c.json({ success: true, data: updatedRole, message: 'Role updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, message: 'Validation error', errors: error.errors }, 400);
      }
      console.error('Update role error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Delete role
   */
  static async destroy(c: Context) {
    try {
      const id = c.req.param('id');
      const roleRepo = AppDataSource.getRepository(Role);

      const role = await roleRepo.findOne({ where: { id } });

      if (!role) {
        return c.json({ success: false, message: 'Role not found' }, 404);
      }

      // Prevent deletion of default roles
      if (['super-admin', 'admin', 'user'].includes(role.slug)) {
        return c.json({ success: false, message: 'Cannot delete default system roles' }, 400);
      }

      await roleRepo.remove(role);

      return c.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      console.error('Delete role error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Assign permissions to role
   */
  static async assignPermissions(c: Context) {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const validated = assignPermissionsSchema.parse(body);

      const roleRepo = AppDataSource.getRepository(Role);
      const permissionRepo = AppDataSource.getRepository(Permission);

      const role = await roleRepo.findOne({ where: { id }, relations: ['permissions'] });

      if (!role) {
        return c.json({ success: false, message: 'Role not found' }, 404);
      }

      const permissions = await permissionRepo.findByIds(validated.permissionIds);

      if (permissions.length !== validated.permissionIds.length) {
        return c.json({ success: false, message: 'Some permissions not found' }, 404);
      }

      role.permissions = permissions;
      await roleRepo.save(role);

      // Reload with relations
      const updatedRole = await roleRepo.findOne({
        where: { id },
        relations: ['permissions', 'menus'],
      });

      return c.json({ success: true, data: updatedRole, message: 'Permissions assigned successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, message: 'Validation error', errors: error.errors }, 400);
      }
      console.error('Assign permissions error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * Assign menus to role
   */
  static async assignMenus(c: Context) {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const validated = assignMenusSchema.parse(body);

      const roleRepo = AppDataSource.getRepository(Role);
      const menuRepo = AppDataSource.getRepository(MenuManager);

      const role = await roleRepo.findOne({ where: { id }, relations: ['menus'] });

      if (!role) {
        return c.json({ success: false, message: 'Role not found' }, 404);
      }

      const menus = await menuRepo.findByIds(validated.menuIds);

      if (menus.length !== validated.menuIds.length) {
        return c.json({ success: false, message: 'Some menus not found' }, 404);
      }

      role.menus = menus;
      await roleRepo.save(role);

      // Reload with relations
      const updatedRole = await roleRepo.findOne({
        where: { id },
        relations: ['permissions', 'menus'],
      });

      return c.json({ success: true, data: updatedRole, message: 'Menus assigned successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, message: 'Validation error', errors: error.errors }, 400);
      }
      console.error('Assign menus error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }
}
