import { Hono } from 'hono';
import { WhatsAppWebhookController } from '../controllers/whatsapp-webhook.controller';

const webhookRouter = new Hono();

// Webhook verification (no auth required - WhatsApp needs to verify)
webhookRouter.get('/whatsapp', WhatsAppWebhookController.verify);

// Receive webhooks (no auth required - WhatsApp sends webhooks)
webhookRouter.post('/whatsapp', WhatsAppWebhookController.receive);

export default webhookRouter;
