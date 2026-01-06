import { Hono } from 'hono';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares';

const dashboardRouter = new Hono();

// Protected routes
dashboardRouter.use('*', authMiddleware);

dashboardRouter.get('/stats', DashboardController.getStats);

export default dashboardRouter;
