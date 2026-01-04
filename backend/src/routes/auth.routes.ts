import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, rateLimiter } from '../middlewares';
import { env } from '../config/env';

const authRouter = new Hono();

// Rate limiter untuk auth endpoints - configurable via environment variables
// Default: 20 login attempts per 15 menit (cukup untuk testing tapi masih protect dari brute force)
const authRateLimiter = rateLimiter(
  parseInt(env.AUTH_RATE_LIMIT_WINDOW) * 60 * 1000,
  parseInt(env.AUTH_RATE_LIMIT_MAX)
);

// Public routes
authRouter.post('/register', authRateLimiter, AuthController.register);
authRouter.post('/login', authRateLimiter, AuthController.login);
authRouter.post('/refresh-token', rateLimiter(), AuthController.refreshToken);
authRouter.post('/logout', AuthController.logout);

// Protected routes
authRouter.get('/me', authMiddleware, AuthController.me);

export default authRouter;
