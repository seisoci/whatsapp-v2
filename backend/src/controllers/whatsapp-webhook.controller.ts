/**
 * WhatsApp Webhook Controller
 * Handles webhook verification and incoming webhooks from WhatsApp
 */

import { Context } from 'hono';
import { WhatsAppWebhookService } from '../services/whatsapp-webhook.service';
import { validateWebhookPayload } from '../validators/webhook.validator';

export class WhatsAppWebhookController {
  /**
   * GET /api/v1/webhooks/whatsapp
   * Webhook verification endpoint
   * WhatsApp sends a GET request to verify the webhook URL
   */
  static async verify(c: Context) {
    try {
      const mode = c.req.query('hub.mode');
      const token = c.req.query('hub.verify_token');
      const challenge = c.req.query('hub.challenge');

      // Verify token from environment
      const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'your_verify_token_here';

      if (mode === 'subscribe' && token === verifyToken) {
        return c.text(challenge || '', 200);
      }

      console.warn('⚠️ Webhook verification failed', { mode, token });
      return c.json({
        success: false,
        message: 'Verification failed',
      }, 403);
    } catch (error: any) {
      console.error('❌ Webhook verification error:', error);
      return c.json({
        success: false,
        message: 'Internal server error',
      }, 500);
    }
  }

  /**
   * POST /api/v1/webhooks/whatsapp
   * Receive incoming webhooks from WhatsApp
   */
  static async receive(c: Context) {
    try {
      const payload = await c.req.json();
      
      // SECURITY: Validate payload structure
      const validation = validateWebhookPayload(payload);
      if (!validation.success) {
        console.warn('⚠️ Invalid webhook payload:', validation.error);
        return c.json({ 
          success: false, 
          message: 'Invalid payload structure',
          error: validation.error 
        }, 400);
      }

      const headers = c.req.header();
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

      // Optional: Verify webhook signature for security
      // const signature = c.req.header('x-hub-signature-256');
      // if (signature && process.env.WHATSAPP_APP_SECRET) {
      //   const rawBody = JSON.stringify(payload);
      //   const isValid = WhatsAppWebhookService.verifyWebhookSignature(
      //     rawBody,
      //     signature,
      //     process.env.WHATSAPP_APP_SECRET
      //   );
      //   if (!isValid) {
      //     console.warn('⚠️ Invalid webhook signature');
      //     return c.json({ success: false, message: 'Invalid signature' }, 403);
      //   }
      // }

      // Process webhook asynchronously (don't block response)
      WhatsAppWebhookService.processWebhook(validation.data!, headers, ip).catch((error: any) => {
        console.error('❌ Failed to process webhook:', error);
      });

      // Respond immediately to acknowledge receipt
      return c.json({ success: true }, 200);
    } catch (error: any) {
      console.error('❌ Webhook receive error:', error);
      // Still return 200 to prevent WhatsApp from retrying
      return c.json({ success: true }, 200);
    }
  }
}

