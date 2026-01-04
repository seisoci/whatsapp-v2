import { z } from 'zod';
import { uuidSchema, slugSchema, paginationSchema } from './common.validator';

/**
 * RBAC Validators
 * Validation schemas untuk Role-Based Access Control
 */

// ============================================
// Role Validators
// ============================================

// Create role
export const createRoleSchema = z.object({
  name: z.string().min(2, 'Nama role minimal 2 karakter').max(100, 'Nama role maksimal 100 karakter'),
  slug: slugSchema,
  description: z.string().max(500, 'Deskripsi terlalu panjang').optional(),
  isActive: z.boolean().default(true),
  permissionIds: z.array(z.string()).optional(),
  menuIds: z.array(z.string()).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

// Update role
export const updateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  permissionIds: z.array(z.string()).optional(),
  menuIds: z.array(z.string()).optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// Assign permissions to role
export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string()).min(1, 'Minimal 1 permission harus dipilih'),
});

export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;

// Assign menus to role
export const assignMenusSchema = z.object({
  menuIds: z.array(z.string()).min(1, 'Minimal 1 menu harus dipilih'),
});

export type AssignMenusInput = z.infer<typeof assignMenusSchema>;

// ============================================
// Permission Validators
// ============================================

// Create permission
export const createPermissionSchema = z.object({
  menuManagerId: z.string().min(1, 'Menu ID harus diisi'),
  name: z.string().min(2, 'Nama permission minimal 2 karakter').max(255, 'Nama permission terlalu panjang'),
  slug: z
    .string()
    .min(3, 'Slug minimal 3 karakter')
    .max(255, 'Slug terlalu panjang')
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan hyphen')
    .refine((slug) => {
      // Validate format: resource-action
      const parts = slug.split('-');
      if (parts.length < 2) return false;
      const action = parts[parts.length - 1];
      return ['index', 'store', 'show', 'update', 'destroy'].includes(action);
    }, 'Format slug harus: resource-action (contoh: user-index, user-store)'),
  description: z.string().max(500, 'Deskripsi terlalu panjang').optional(),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;

// Update permission
export const updatePermissionSchema = z.object({
  menuManagerId: z.string().min(1).optional(),
  name: z.string().min(2).max(255).optional(),
  slug: z
    .string()
    .min(3)
    .max(255)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(500).optional(),
});

export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;

// ============================================
// Menu Manager Validators
// ============================================

// Create menu
export const createMenuSchema = z.object({
  parentId: z.number().int().nonnegative().default(0),
  title: z.string().min(1, 'Title harus diisi').max(255, 'Title terlalu panjang'),
  slug: slugSchema,
  pathUrl: z.string().max(255, 'Path URL terlalu panjang').optional(),
  icon: z.string().max(255, 'Icon terlalu panjang').optional(),
  type: z.enum(['module', 'header', 'line', 'static'], {
    errorMap: () => ({ message: 'Type harus salah satu: module, header, line, static' }),
  }),
  position: z.string().max(255).optional(),
  sort: z.number().int().nonnegative('Sort harus bilangan bulat non-negatif'),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;

// Update menu
export const updateMenuSchema = z.object({
  parentId: z.number().int().nonnegative().optional(),
  title: z.string().min(1).max(255).optional(),
  slug: slugSchema.optional(),
  pathUrl: z.string().max(255).optional(),
  icon: z.string().max(255).optional(),
  type: z.enum(['module', 'header', 'line', 'static']).optional(),
  position: z.string().max(255).optional(),
  sort: z.number().int().nonnegative().optional(),
});

export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;

// ============================================
// User Role Assignment
// ============================================

// Assign role to user
export const assignRoleToUserSchema = z.object({
  userId: uuidSchema,
  roleId: z.string().min(1, 'Role ID harus diisi'),
});

export type AssignRoleToUserInput = z.infer<typeof assignRoleToUserSchema>;

// ============================================
// Query Validators
// ============================================

// Get roles with pagination
export const getRolesQuerySchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
});

export type GetRolesQuery = z.infer<typeof getRolesQuerySchema>;

// Get permissions with pagination
export const getPermissionsQuerySchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  menuId: z.string().optional(),
  action: z.enum(['index', 'store', 'show', 'update', 'destroy']).optional(),
});

export type GetPermissionsQuery = z.infer<typeof getPermissionsQuerySchema>;

// Get menus with pagination
export const getMenusQuerySchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  type: z.enum(['module', 'header', 'line', 'static']).optional(),
  parentId: z.coerce.number().int().nonnegative().optional(),
});

export type GetMenusQuery = z.infer<typeof getMenusQuerySchema>;

// ============================================
// Permission Check
// ============================================

// Check user permission
export const checkPermissionSchema = z.object({
  userId: uuidSchema,
  permission: z.string().min(1, 'Permission slug harus diisi'),
});

export type CheckPermissionInput = z.infer<typeof checkPermissionSchema>;

// Check multiple permissions
export const checkPermissionsSchema = z.object({
  userId: uuidSchema,
  permissions: z.array(z.string().min(1)).min(1, 'Minimal 1 permission harus dicek'),
  requireAll: z.boolean().default(false),
});

export type CheckPermissionsInput = z.infer<typeof checkPermissionsSchema>;

// ============================================
// Bulk Operations
// ============================================

// Create multiple permissions for a menu (CRUD)
export const createCrudPermissionsSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().optional(), // Will be auto-generated from title if not provided
  pathUrl: z.string().optional().default(''), // Optional - can be empty if menu has no URL
  icon: z.string().optional(),
  resource: z
    .string()
    .min(2, 'Resource name minimal 2 karakter')
    .max(50, 'Resource name terlalu panjang')
    .regex(/^[a-z0-9-]+$/, 'Resource name hanya boleh huruf kecil, angka, dan hyphen'),
  actions: z
    .array(z.enum(['index', 'store', 'show', 'update', 'destroy']))
    .min(1, 'Minimal 1 action harus dipilih')
    .default(['index', 'store', 'show', 'update', 'destroy']),
  menuManagerId: z.string().optional(), // Optional, will be created if not provided
});

export type CreateCrudPermissionsInput = z.infer<typeof createCrudPermissionsSchema>;

// Delete multiple permissions
export const deletePermissionsSchema = z.object({
  permissionIds: z.array(z.string()).min(1, 'Minimal 1 permission harus dipilih').max(50, 'Maksimal 50 permission'),
});

export type DeletePermissionsInput = z.infer<typeof deletePermissionsSchema>;
