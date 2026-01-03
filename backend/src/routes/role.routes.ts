import { Hono } from 'hono';
import { RoleController } from '../controllers/role.controller';
import { authMiddleware, isSuperAdmin, canIndex, canStore, canUpdate, canDestroy } from '../middlewares';

const roleRouter = new Hono();

// All routes require authentication
roleRouter.use('*', authMiddleware);

// Get all roles (need role-index permission)
roleRouter.get('/', canIndex('role'), RoleController.index);

// Get single role (need role-show permission)
roleRouter.get('/:id', canIndex('role'), RoleController.show);

// Create role (only super admin)
roleRouter.post('/', isSuperAdmin(), RoleController.store);

// Update role (only super admin)
roleRouter.put('/:id', isSuperAdmin(), RoleController.update);

// Delete role (only super admin)
roleRouter.delete('/:id', isSuperAdmin(), RoleController.destroy);

// Assign permissions to role (only super admin)
roleRouter.post('/:id/permissions', isSuperAdmin(), RoleController.assignPermissions);

// Assign menus to role (only super admin)
roleRouter.post('/:id/menus', isSuperAdmin(), RoleController.assignMenus);

export default roleRouter;
