import { Hono } from 'hono';
import { MessageQueueController } from '../controllers/message-queue.controller';
import { authMiddleware } from '../middlewares';

const messageQueueRouter = new Hono();

// All routes require authentication
messageQueueRouter.use('*', authMiddleware);

// Get all message queues (with pagination & filters)
messageQueueRouter.get('/', MessageQueueController.index);

// Get single message queue by ID
messageQueueRouter.get('/:id', MessageQueueController.show);

export default messageQueueRouter;
