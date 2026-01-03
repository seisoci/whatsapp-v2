import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, rateLimiter } from '../middlewares';

const authRouter = new Hono();

// Rate limiter untuk auth endpoints - lebih ketat
const authRateLimiter = rateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 menit

// Public routes
authRouter.post('/register', authRateLimiter, AuthController.register);
authRouter.post('/login', authRateLimiter, AuthController.login);
authRouter.post('/refresh-token', rateLimiter(), AuthController.refreshToken);
authRouter.post('/logout', AuthController.logout);

// Protected routes
authRouter.get('/me', authMiddleware, AuthController.me);

export default authRouter;
