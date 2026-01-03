import { Hono } from 'hono';
import { PermissionControllerWithPermissions as PermissionController } from '../controllers/permission.controller';
import { authMiddleware } from '../middlewares';

const permissionRouter = new Hono();

// All routes require authentication
permissionRouter.use('*', authMiddleware);

// Get all permissions (permission check in controller)
permissionRouter.get('/', PermissionController.index);

// Get permissions grouped by menu (permission check in controller)
permissionRouter.get('/grouped', PermissionController.groupedByMenu);

// Get single permission (permission check in controller)
permissionRouter.get('/:id', PermissionController.show);

// Create permission (permission check in controller)
permissionRouter.post('/', PermissionController.store);

// Create CRUD permissions (permission check in controller)
permissionRouter.post('/crud', PermissionController.createCrudPermissions);

// Update menu manager and all related permissions (permission check in controller)
permissionRouter.put('/:menuManagerId', PermissionController.update);

// Delete permission (permission check in controller)
permissionRouter.delete('/:id', PermissionController.destroy);

export default permissionRouter;
