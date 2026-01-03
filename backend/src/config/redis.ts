import Redis from 'ioredis';
import { env } from './env';

/**
 * Redis Client Configuration
 * Untuk caching, session storage, dan rate limiting
 */
export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // Reconnect
    }
    return false;
  },
});

// Event handlers
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redisClient.on('ready', () => {
  console.log('✅ Redis is ready to accept commands');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

/**
 * Redis utility functions
 */
export class RedisService {
  /**
   * Set value dengan TTL (Time To Live)
   */
  static async set(key: string, value: string | object, ttlSeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds) {
      await redisClient.setex(key, ttlSeconds, stringValue);
    } else {
      await redisClient.set(key, stringValue);
    }
  }

  /**
   * Get value by key
   */
  static async get<T = string>(key: string, parseJson = false): Promise<T | null> {
    const value = await redisClient.get(key);

    if (!value) return null;

    if (parseJson) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    }

    return value as T;
  }

  /**
   * Delete key(s)
   */
  static async del(...keys: string[]): Promise<number> {
    return await redisClient.del(...keys);
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return result === 1;
  }

  /**
   * Set expiration pada key yang sudah ada
   */
  static async expire(key: string, seconds: number): Promise<boolean> {
    const result = await redisClient.expire(key, seconds);
    return result === 1;
  }

  /**
   * Get TTL (Time To Live) dari key
   */
  static async ttl(key: string): Promise<number> {
    return await redisClient.ttl(key);
  }

  /**
   * Increment value (untuk counters)
   */
  static async incr(key: string): Promise<number> {
    return await redisClient.incr(key);
  }

  /**
   * Decrement value
   */
  static async decr(key: string): Promise<number> {
    return await redisClient.decr(key);
  }

  /**
   * Get all keys matching pattern
   */
  static async keys(pattern: string): Promise<string[]> {
    return await redisClient.keys(pattern);
  }

  /**
   * Flush all data (gunakan hati-hati!)
   */
  static async flushAll(): Promise<void> {
    await redisClient.flushall();
  }

  /**
   * Cache data dengan function
   * Jika data ada di cache, return cached data
   * Jika tidak, execute function, cache result, lalu return
   */
  static async cacheData<T>(
    key: string,
    ttlSeconds: number,
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    // Cek cache terlebih dahulu
    const cached = await this.get<T>(key, true);
    if (cached !== null) {
      console.log(`✅ Cache HIT for key: ${key}`);
      return cached;
    }

    // Cache miss, execute function
    console.log(`❌ Cache MISS for key: ${key}`);
    const data = await fetchFunction();

    // Cache the result
    await this.set(key, data, ttlSeconds);

    return data;
  }

  /**
   * Invalidate cache by pattern
   */
  static async invalidatePattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern);
    if (keys.length === 0) return 0;
    return await this.del(...keys);
  }
}

export default redisClient;
