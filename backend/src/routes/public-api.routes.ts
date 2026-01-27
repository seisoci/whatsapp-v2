import { Hono } from 'hono';
import { PublicMessageController } from '../controllers/public-message.controller';
import { apiKeyMiddleware } from '../middlewares/api-key.middleware';

const publicApiRouter = new Hono();

// Apply API Key Middleware to all routes in this group
// Apply API Key Middleware to specific route to allow router mounting at root
publicApiRouter.use('/send-message-template', apiKeyMiddleware);

// Send Template Message
publicApiRouter.post('/send-message-template', PublicMessageController.sendTemplate);

export default publicApiRouter;
