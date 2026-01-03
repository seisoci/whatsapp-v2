/**
 * Middleware Exports
 * Central export point untuk semua middleware
 */

// Authentication
export { authMiddleware } from './auth.middleware';

// Security
export { securityHeaders } from './securityHeaders.middleware';
export { corsMiddleware } from './cors.middleware';
export { sanitizeMiddleware, sanitizeInput } from './sanitize.middleware';
export { rateLimiter, cleanupRateLimitMap } from './rateLimiter.middleware';
export {
  ipFilter,
  getClientIP,
  addToBlacklist,
  removeFromBlacklist,
  addToWhitelist,
  removeFromWhitelist,
  isBlacklisted,
  isWhitelisted,
} from './ipFilter.middleware';

// Redis-based middlewares
export {
  redisRateLimiter,
  multiWindowRateLimiter,
  userRateLimiter,
  getRateLimitInfo,
  resetRateLimit,
} from './redisRateLimiter.middleware';

// Cache middlewares
export {
  cacheMiddleware,
  userCacheMiddleware,
  loginCacheMiddleware,
  SessionCache,
  ApiCache,
  invalidateCache,
} from './cache.middleware';

// RBAC middlewares
export {
  hasPermission,
  canAccess,
  canAccessAny,
  canAccessAll,
  canIndex,
  canStore,
  canShow,
  canUpdate,
  canDestroy,
  hasFullAccess,
} from './permission.middleware';

export {
  hasRole,
  isSuperAdmin,
  isAdmin,
  isUser,
  isAnyAdmin,
  canAccessMenu,
} from './role.middleware';
