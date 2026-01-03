import { Context, Next } from 'hono';
import { RedisService } from '../config/redis';

/**
 * Cache Middleware untuk HTTP responses
 * Cache GET requests berdasarkan URL dan query params
 */
export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return async (c: Context, next: Next) => {
    // Only cache GET requests
    if (c.req.method !== 'GET') {
      await next();
      return;
    }

    // Generate cache key dari URL + query params
    const url = new URL(c.req.url);
    const cacheKey = `cache:${url.pathname}${url.search}`;

    try {
      // Check cache
      const cached = await RedisService.get(cacheKey);

      if (cached) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        // Return cached response
        return c.json(JSON.parse(cached));
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Execute request
      await next();

      // Cache the response (if success)
      const response = c.res;
      if (response.status === 200) {
        const body = await response.clone().text();
        await RedisService.set(cacheKey, body, ttlSeconds);
      }
    } catch (error) {
      console.error('Cache middleware error:', error);
      await next();
    }
  };
};

/**
 * User-specific cache middleware
 * Cache berdasarkan user ID
 */
export const userCacheMiddleware = (ttlSeconds: number = 300) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user || c.req.method !== 'GET') {
      await next();
      return;
    }

    const userId = user.userId;
    const url = new URL(c.req.url);
    const cacheKey = `cache:user:${userId}:${url.pathname}${url.search}`;

    try {
      const cached = await RedisService.get(cacheKey);

      if (cached) {
        console.log(`✅ User Cache HIT: ${cacheKey}`);
        return c.json(JSON.parse(cached));
      }

      console.log(`❌ User Cache MISS: ${cacheKey}`);
      await next();

      const response = c.res;
      if (response.status === 200) {
        const body = await response.clone().text();
        await RedisService.set(cacheKey, body, ttlSeconds);
      }
    } catch (error) {
      console.error('User cache middleware error:', error);
      await next();
    }
  };
};

/**
 * Login attempt cache - track login attempts
 */
export const loginCacheMiddleware = async (c: Context, next: Next) => {
  const body = c.get('sanitizedBody') || (await c.req.json());
  const email = body.email;

  if (!email) {
    await next();
    return;
  }

  const cacheKey = `login:attempt:${email}`;

  try {
    // Check if user recently logged in (prevent duplicate requests)
    const recentLogin = await RedisService.get(cacheKey);

    if (recentLogin) {
      // User baru saja login, return cached response atau reject
      return c.json(
        {
          success: false,
          message: 'Silakan tunggu sebentar sebelum mencoba login lagi.',
        },
        429
      );
    }

    // Execute login
    await next();

    // If login successful (check response status)
    const response = c.res;
    if (response.status === 200) {
      // Cache successful login untuk 5 detik (prevent rapid successive logins)
      await RedisService.set(cacheKey, 'true', 5);
    }
  } catch (error) {
    console.error('Login cache middleware error:', error);
    await next();
  }
};

/**
 * Session cache - cache user session data
 */
export class SessionCache {
  private static SESSION_PREFIX = 'session:';
  private static SESSION_TTL = 15 * 60; // 15 minutes

  /**
   * Store user session
   */
  static async set(userId: string, sessionData: any): Promise<void> {
    const key = `${this.SESSION_PREFIX}${userId}`;
    await RedisService.set(key, sessionData, this.SESSION_TTL);
  }

  /**
   * Get user session
   */
  static async get<T = any>(userId: string): Promise<T | null> {
    const key = `${this.SESSION_PREFIX}${userId}`;
    return await RedisService.get<T>(key, true);
  }

  /**
   * Delete user session (logout)
   */
  static async delete(userId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${userId}`;
    await RedisService.del(key);
  }

  /**
   * Refresh session TTL
   */
  static async refresh(userId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${userId}`;
    await RedisService.expire(key, this.SESSION_TTL);
  }

  /**
   * Check if session exists
   */
  static async exists(userId: string): Promise<boolean> {
    const key = `${this.SESSION_PREFIX}${userId}`;
    return await RedisService.exists(key);
  }
}

/**
 * API Response cache helper
 */
export class ApiCache {
  /**
   * Cache API response dengan custom key
   */
  static async cacheResponse<T>(
    key: string,
    ttlSeconds: number,
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    return await RedisService.cacheData(`api:${key}`, ttlSeconds, fetchFunction);
  }

  /**
   * Invalidate API cache by pattern
   */
  static async invalidate(pattern: string): Promise<number> {
    return await RedisService.invalidatePattern(`api:${pattern}`);
  }

  /**
   * Cache user-specific data
   */
  static async cacheUserData<T>(
    userId: string,
    dataKey: string,
    ttlSeconds: number,
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    const key = `api:user:${userId}:${dataKey}`;
    return await RedisService.cacheData(key, ttlSeconds, fetchFunction);
  }

  /**
   * Invalidate all user cache
   */
  static async invalidateUserCache(userId: string): Promise<number> {
    return await RedisService.invalidatePattern(`api:user:${userId}:*`);
  }
}

/**
 * Cache invalidation helper
 */
export const invalidateCache = async (patterns: string[]): Promise<void> => {
  for (const pattern of patterns) {
    await RedisService.invalidatePattern(pattern);
  }
};
