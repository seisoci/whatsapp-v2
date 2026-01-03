import { Context, Next } from 'hono';
import { RedisService } from '../config/redis';

/**
 * Redis-based Rate Limiter Middleware
 * Production-ready rate limiter menggunakan Redis untuk distributed systems
 */
export const redisRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const key = `ratelimit:${ip}`;
    const now = Date.now();

    try {
      // Get current count
      const data = await RedisService.get<{ count: number; resetTime: number }>(key, true);

      if (!data || data.resetTime < now) {
        // Create new window
        const resetTime = now + windowMs;
        await RedisService.set(key, { count: 1, resetTime }, Math.ceil(windowMs / 1000));
        await next();
      } else if (data.count < max) {
        // Increment counter
        data.count++;
        const ttl = await RedisService.ttl(key);
        await RedisService.set(key, data, ttl > 0 ? ttl : Math.ceil(windowMs / 1000));
        await next();
      } else {
        // Rate limit exceeded
        const ttl = await RedisService.ttl(key);
        const resetIn = ttl > 0 ? Math.ceil(ttl / 60) : Math.ceil(windowMs / 60000);

        return c.json(
          {
            success: false,
            message: `Terlalu banyak permintaan. Silakan coba lagi dalam ${resetIn} menit.`,
            retryAfter: ttl > 0 ? ttl : Math.ceil(windowMs / 1000),
          },
          429
        );
      }
    } catch (error) {
      console.error('Redis rate limiter error:', error);
      // Fallback: allow request if Redis fails
      await next();
    }
  };
};

/**
 * Advanced rate limiter dengan multiple limits
 * Example: 5 per minute AND 100 per hour
 */
export const multiWindowRateLimiter = (
  limits: Array<{ windowMs: number; max: number; name: string }>
) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();

    try {
      // Check all limits
      for (const limit of limits) {
        const key = `ratelimit:${limit.name}:${ip}`;
        const data = await RedisService.get<{ count: number; resetTime: number }>(key, true);

        if (!data || data.resetTime < now) {
          // Create new window
          const resetTime = now + limit.windowMs;
          await RedisService.set(
            key,
            { count: 1, resetTime },
            Math.ceil(limit.windowMs / 1000)
          );
        } else if (data.count < limit.max) {
          // Increment counter
          data.count++;
          const ttl = await RedisService.ttl(key);
          await RedisService.set(
            key,
            data,
            ttl > 0 ? ttl : Math.ceil(limit.windowMs / 1000)
          );
        } else {
          // Rate limit exceeded
          const ttl = await RedisService.ttl(key);
          const resetIn = ttl > 0 ? Math.ceil(ttl / 60) : Math.ceil(limit.windowMs / 60000);

          return c.json(
            {
              success: false,
              message: `Rate limit exceeded for ${limit.name}. Silakan coba lagi dalam ${resetIn} menit.`,
              retryAfter: ttl > 0 ? ttl : Math.ceil(limit.windowMs / 1000),
            },
            429
          );
        }
      }

      await next();
    } catch (error) {
      console.error('Multi-window rate limiter error:', error);
      // Fallback: allow request if Redis fails
      await next();
    }
  };
};

/**
 * Rate limiter per user (authenticated users)
 */
export const userRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 1000) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user'); // Dari auth middleware

    if (!user) {
      await next();
      return;
    }

    const userId = user.userId;
    const key = `ratelimit:user:${userId}`;
    const now = Date.now();

    try {
      const data = await RedisService.get<{ count: number; resetTime: number }>(key, true);

      if (!data || data.resetTime < now) {
        const resetTime = now + windowMs;
        await RedisService.set(key, { count: 1, resetTime }, Math.ceil(windowMs / 1000));
        await next();
      } else if (data.count < max) {
        data.count++;
        const ttl = await RedisService.ttl(key);
        await RedisService.set(key, data, ttl > 0 ? ttl : Math.ceil(windowMs / 1000));
        await next();
      } else {
        const ttl = await RedisService.ttl(key);
        const resetIn = ttl > 0 ? Math.ceil(ttl / 60) : Math.ceil(windowMs / 60000);

        return c.json(
          {
            success: false,
            message: `User rate limit exceeded. Silakan coba lagi dalam ${resetIn} menit.`,
            retryAfter: ttl > 0 ? ttl : Math.ceil(windowMs / 1000),
          },
          429
        );
      }
    } catch (error) {
      console.error('User rate limiter error:', error);
      await next();
    }
  };
};

/**
 * Get rate limit info for IP
 */
export const getRateLimitInfo = async (ip: string, limitName = 'default') => {
  const key = `ratelimit:${limitName}:${ip}`;
  const data = await RedisService.get<{ count: number; resetTime: number }>(key, true);

  if (!data) {
    return {
      count: 0,
      resetTime: null,
      remaining: null,
    };
  }

  return {
    count: data.count,
    resetTime: data.resetTime,
    remaining: Math.max(0, data.resetTime - Date.now()),
  };
};

/**
 * Reset rate limit for IP or user
 */
export const resetRateLimit = async (identifier: string, limitName = 'default') => {
  const key = `ratelimit:${limitName}:${identifier}`;
  await RedisService.del(key);
};
