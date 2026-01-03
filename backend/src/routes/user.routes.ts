import { Hono } from 'hono';
import { UserControllerWithPermissions as UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares';

const userRouter = new Hono();

// All routes require authentication
userRouter.use('*', authMiddleware);

// Get all users (permission check in controller)
userRouter.get('/', UserController.index);

// Get single user (permission check in controller)
userRouter.get('/:id', UserController.show);

// Create user (permission check in controller)
userRouter.post('/', UserController.store);

// Update user (permission check in controller)
userRouter.put('/:id', UserController.update);

// Delete user (permission check in controller)
userRouter.delete('/:id', UserController.destroy);

export default userRouter;
