import { Context, Next } from 'hono';

// Rate limiting sederhana menggunakan Map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter middleware untuk mencegah spam dan brute force attacks
 * @param windowMs - Durasi window dalam milliseconds (default: 15 menit)
 * @param max - Maximum requests per window (default: 100)
 * @returns Hono middleware
 */
export const rateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();

    // Bersihkan entries yang sudah expired
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }

    const current = rateLimitMap.get(ip);

    if (!current || current.resetTime < now) {
      // Buat entry baru atau reset
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      await next();
    } else if (current.count < max) {
      // Increment counter
      current.count++;
      await next();
    } else {
      // Rate limit exceeded
      return c.json(
        {
          success: false,
          message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
        },
        429
      );
    }
  };
};

/**
 * Cleanup expired entries periodically
 * Jalankan ini di background untuk memory management
 */
export const cleanupRateLimitMap = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
};

// Auto cleanup setiap 5 menit
setInterval(cleanupRateLimitMap, 5 * 60 * 1000);
