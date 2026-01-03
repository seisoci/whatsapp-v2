import { Hono } from 'hono';
import { UserController } from '../controllers/user.controller';
import { authMiddleware, isSuperAdmin, canIndex, canStore, canUpdate, canDestroy } from '../middlewares';

const userRouter = new Hono();

// All routes require authentication
userRouter.use('*', authMiddleware);

// Get all users (need user-index permission)
userRouter.get('/', canIndex('user'), UserController.index);

// Get single user (need user-show permission)
userRouter.get('/:id', canIndex('user'), UserController.show);

// Create user (need user-store permission or super admin)
userRouter.post('/', canStore('user'), UserController.store);

// Update user (need user-update permission or super admin)
userRouter.put('/:id', canUpdate('user'), UserController.update);

// Delete user (need user-destroy permission or super admin)
userRouter.delete('/:id', canDestroy('user'), UserController.destroy);

export default userRouter;
