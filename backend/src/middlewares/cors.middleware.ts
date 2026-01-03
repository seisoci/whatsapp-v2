import { Context, Next } from 'hono';
import { env } from '../config/env';

/**
 * CORS middleware untuk mengontrol access dari domain lain
 * Hanya domain yang di-whitelist yang diizinkan
 */
export const corsMiddleware = async (c: Context, next: Next) => {
  const origin = c.req.header('origin');
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  // Set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes('*')) {
    // Allow all origins jika configured (tidak disarankan untuk production)
    c.header('Access-Control-Allow-Origin', '*');
  }

  // Allowed HTTP methods
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  // Allowed headers
  c.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );

  // Allow credentials (cookies, authorization headers, TLS client certificates)
  c.header('Access-Control-Allow-Credentials', 'true');

  // Cache preflight request for 24 hours
  c.header('Access-Control-Max-Age', '86400');

  // Expose custom headers to client
  c.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }

  await next();
};
