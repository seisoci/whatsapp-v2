import { Hono } from 'hono';
import { PermissionController } from '../controllers/permission.controller';
import { authMiddleware, isSuperAdmin, canIndex } from '../middlewares';

const permissionRouter = new Hono();

// All routes require authentication
permissionRouter.use('*', authMiddleware);

// Get all permissions (need role-index permission to manage)
permissionRouter.get('/', canIndex('role'), PermissionController.index);

// Get permissions grouped by menu
permissionRouter.get('/grouped', canIndex('role'), PermissionController.groupedByMenu);

// Get single permission
permissionRouter.get('/:id', canIndex('role'), PermissionController.show);

// Create permission (only super admin)
permissionRouter.post('/', isSuperAdmin(), PermissionController.store);

// Create CRUD permissions (only super admin)
permissionRouter.post('/crud', isSuperAdmin(), PermissionController.createCrudPermissions);

// Update permission (only super admin)
permissionRouter.put('/:id', isSuperAdmin(), PermissionController.update);

// Delete permission (only super admin)
permissionRouter.delete('/:id', isSuperAdmin(), PermissionController.destroy);

export default permissionRouter;
