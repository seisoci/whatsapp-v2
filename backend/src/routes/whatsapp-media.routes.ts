import { Hono } from 'hono';
import { WhatsAppMediaControllerWithPermissions as WhatsAppMediaController } from '../controllers/whatsapp-media.controller';
import { authMiddleware } from '../middlewares';

const whatsappMediaRouter = new Hono();

whatsappMediaRouter.use('*', authMiddleware);

whatsappMediaRouter.post('/upload', WhatsAppMediaController.upload);

export default whatsappMediaRouter;
