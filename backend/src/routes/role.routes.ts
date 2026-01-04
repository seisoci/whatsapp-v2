import { Hono } from 'hono';
import { RoleControllerWithPermissions as RoleController } from '../controllers/role.controller';
import { authMiddleware } from '../middlewares';

const roleRouter = new Hono();

// All routes require authentication
roleRouter.use('*', authMiddleware);

// Get all roles (permission check in controller)
roleRouter.get('/', RoleController.index);

// Get single role (permission check in controller)
roleRouter.get('/:id', RoleController.show);

// Create role (permission check in controller)
roleRouter.post('/', RoleController.store);

// Update role (permission check in controller)
roleRouter.put('/:id', RoleController.update);

// Delete role (permission check in controller)
roleRouter.delete('/:id', RoleController.destroy);

// Assign permissions to role (permission check in controller)
roleRouter.post('/:id/permissions', RoleController.assignPermissions);
roleRouter.put('/:id/permissions', RoleController.assignPermissions); // RESTful alias

// Assign menus to role (permission check in controller)
roleRouter.post('/:id/menus', RoleController.assignMenus);

export default roleRouter;
