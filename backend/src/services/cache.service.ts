import { RedisService } from '../config/redis';

/**
 * Cache Service
 * Centralized service untuk semua operasi caching
 */
class CacheService {
  private prefix: string = 'app:';

  /**
   * Set cache dengan TTL
   */
  async set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const fullKey = this.prefix + key;
    await RedisService.set(fullKey, value, ttlSeconds);
  }

  /**
   * Get cache
   */
  async get<T = any>(key: string, parseJson = true): Promise<T | null> {
    const fullKey = this.prefix + key;
    return await RedisService.get<T>(fullKey, parseJson);
  }

  /**
   * Delete cache
   */
  async delete(...keys: string[]): Promise<number> {
    const fullKeys = keys.map((key) => this.prefix + key);
    return await RedisService.del(...fullKeys);
  }

  /**
   * Check if cache exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.prefix + key;
    return await RedisService.exists(fullKey);
  }

  /**
   * Increment counter
   */
  async increment(key: string): Promise<number> {
    const fullKey = this.prefix + key;
    return await RedisService.incr(fullKey);
  }

  /**
   * Decrement counter
   */
  async decrement(key: string): Promise<number> {
    const fullKey = this.prefix + key;
    return await RedisService.decr(fullKey);
  }

  /**
   * Get TTL
   */
  async ttl(key: string): Promise<number> {
    const fullKey = this.prefix + key;
    return await RedisService.ttl(fullKey);
  }

  /**
   * Set expiration
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const fullKey = this.prefix + key;
    return await RedisService.expire(fullKey, seconds);
  }

  /**
   * Cache data with function (auto fetch on miss)
   */
  async remember<T>(key: string, ttlSeconds: number, fetchFn: () => Promise<T>): Promise<T> {
    const fullKey = this.prefix + key;
    return await RedisService.cacheData(fullKey, ttlSeconds, fetchFn);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const fullPattern = this.prefix + pattern;
    return await RedisService.invalidatePattern(fullPattern);
  }

  // ============================================
  // User-specific caching
  // ============================================

  /**
   * Cache user data
   */
  async cacheUser<T>(userId: string, data: T, ttlSeconds = 3600): Promise<void> {
    await this.set(`user:${userId}`, data, ttlSeconds);
  }

  /**
   * Get cached user data
   */
  async getUser<T>(userId: string): Promise<T | null> {
    return await this.get<T>(`user:${userId}`);
  }

  /**
   * Delete user cache
   */
  async deleteUser(userId: string): Promise<number> {
    return await this.delete(`user:${userId}`);
  }

  /**
   * Invalidate all user cache
   */
  async invalidateUserCache(userId: string): Promise<number> {
    return await this.invalidatePattern(`user:${userId}:*`);
  }

  // ============================================
  // Session Management
  // ============================================

  /**
   * Store session
   */
  async setSession(userId: string, sessionData: any, ttlSeconds = 900): Promise<void> {
    await this.set(`session:${userId}`, sessionData, ttlSeconds);
  }

  /**
   * Get session
   */
  async getSession<T = any>(userId: string): Promise<T | null> {
    return await this.get<T>(`session:${userId}`);
  }

  /**
   * Delete session (logout)
   */
  async deleteSession(userId: string): Promise<number> {
    return await this.delete(`session:${userId}`);
  }

  /**
   * Refresh session TTL
   */
  async refreshSession(userId: string, ttlSeconds = 900): Promise<boolean> {
    return await this.expire(`session:${userId}`, ttlSeconds);
  }

  // ============================================
  // API Response Caching
  // ============================================

  /**
   * Cache API response
   */
  async cacheApiResponse<T>(
    endpoint: string,
    params: Record<string, any> = {},
    data: T,
    ttlSeconds = 300
  ): Promise<void> {
    const key = this.generateApiKey(endpoint, params);
    await this.set(key, data, ttlSeconds);
  }

  /**
   * Get cached API response
   */
  async getApiResponse<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    const key = this.generateApiKey(endpoint, params);
    return await this.get<T>(key);
  }

  /**
   * Cache API response with auto-fetch
   */
  async rememberApiResponse<T>(
    endpoint: string,
    params: Record<string, any> = {},
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const key = this.generateApiKey(endpoint, params);
    return await this.remember(key, ttlSeconds, fetchFn);
  }

  /**
   * Invalidate API cache for endpoint
   */
  async invalidateApiCache(endpoint: string): Promise<number> {
    return await this.invalidatePattern(`api:${endpoint}*`);
  }

  /**
   * Generate cache key for API
   */
  private generateApiKey(endpoint: string, params: Record<string, any>): string {
    const paramStr = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    return `api:${endpoint}${paramStr ? ':' + paramStr : ''}`;
  }

  // ============================================
  // Rate Limiting Helper
  // ============================================

  /**
   * Check and increment rate limit
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `ratelimit:${identifier}`;
    const count = await this.increment(key);

    if (count === 1) {
      // First request, set expiration
      await this.expire(key, windowSeconds);
    }

    const ttl = await this.ttl(key);
    const resetAt = Date.now() + ttl * 1000;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  }

  /**
   * Reset rate limit
   */
  async resetRateLimit(identifier: string): Promise<number> {
    return await this.delete(`ratelimit:${identifier}`);
  }

  // ============================================
  // Login Attempts Tracking
  // ============================================

  /**
   * Track login attempt
   */
  async trackLoginAttempt(identifier: string): Promise<number> {
    const key = `login:attempts:${identifier}`;
    const count = await this.increment(key);

    if (count === 1) {
      // First attempt, set expiration to 15 minutes
      await this.expire(key, 15 * 60);
    }

    return count;
  }

  /**
   * Get login attempts
   */
  async getLoginAttempts(identifier: string): Promise<number> {
    const key = `login:attempts:${identifier}`;
    const value = await this.get<string>(key, false);
    return value ? parseInt(value) : 0;
  }

  /**
   * Reset login attempts
   */
  async resetLoginAttempts(identifier: string): Promise<number> {
    return await this.delete(`login:attempts:${identifier}`);
  }

  /**
   * Lock account temporarily
   */
  async lockAccount(identifier: string, minutes = 15): Promise<void> {
    await this.set(`login:locked:${identifier}`, 'true', minutes * 60);
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(identifier: string): Promise<boolean> {
    return await this.exists(`login:locked:${identifier}`);
  }

  // ============================================
  // Verification Codes (OTP, Email Verification, etc)
  // ============================================

  /**
   * Store verification code
   */
  async storeVerificationCode(
    identifier: string,
    code: string,
    ttlSeconds = 600
  ): Promise<void> {
    await this.set(`verify:${identifier}`, code, ttlSeconds);
  }

  /**
   * Verify code
   */
  async verifyCode(identifier: string, code: string): Promise<boolean> {
    const storedCode = await this.get<string>(`verify:${identifier}`, false);
    return storedCode === code;
  }

  /**
   * Delete verification code
   */
  async deleteVerificationCode(identifier: string): Promise<number> {
    return await this.delete(`verify:${identifier}`);
  }

  // ============================================
  // General Utilities
  // ============================================

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const fullPattern = this.prefix + pattern;
    const keys = await RedisService.keys(fullPattern);
    // Remove prefix from returned keys
    return keys.map((key) => key.replace(this.prefix, ''));
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    await RedisService.flushAll();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    userKeys: number;
    sessionKeys: number;
    apiKeys: number;
  }> {
    const allKeys = await RedisService.keys(this.prefix + '*');
    const userKeys = allKeys.filter((k) => k.includes(':user:'));
    const sessionKeys = allKeys.filter((k) => k.includes(':session:'));
    const apiKeys = allKeys.filter((k) => k.includes(':api:'));

    return {
      totalKeys: allKeys.length,
      userKeys: userKeys.length,
      sessionKeys: sessionKeys.length,
      apiKeys: apiKeys.length,
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export class for testing
export { CacheService };
