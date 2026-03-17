import { Hono } from 'hono';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middlewares';

const analyticsRouter = new Hono();

analyticsRouter.use('*', authMiddleware);

analyticsRouter.get('/messages-over-time', AnalyticsController.getMessagesOverTime);
analyticsRouter.get('/message-status', AnalyticsController.getMessageStatus);
analyticsRouter.get('/top-templates', AnalyticsController.getTopTemplates);
analyticsRouter.get('/response-time', AnalyticsController.getResponseTime);
analyticsRouter.get('/messages-per-agent', AnalyticsController.getMessagesPerAgent);
analyticsRouter.get('/contact-growth', AnalyticsController.getContactGrowth);

export default analyticsRouter;
