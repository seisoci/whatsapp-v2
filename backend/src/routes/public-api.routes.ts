import { Hono } from 'hono';
import { PublicMessageController } from '../controllers/public-message.controller';
import { apiKeyMiddleware } from '../middlewares/api-key.middleware';

const publicApiRouter = new Hono();

// Apply API Key Middleware to all routes in this group
// Apply API Key Middleware to specific route to allow router mounting at root
publicApiRouter.use('/send-message-template', apiKeyMiddleware);
publicApiRouter.use('/message-queues/bulk-status', apiKeyMiddleware);

// Send Template Message
publicApiRouter.post('/send-message-template', PublicMessageController.sendTemplate);

// Bulk status check — used by ERP reconciliation to sync stuck "queued" items
publicApiRouter.post('/message-queues/bulk-status', PublicMessageController.bulkStatus);

export default publicApiRouter;
