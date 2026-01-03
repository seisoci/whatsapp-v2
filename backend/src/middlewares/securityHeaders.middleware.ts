import { Context, Next } from 'hono';

/**
 * Security headers middleware untuk mencegah berbagai attack vectors
 * Menambahkan HTTP security headers sesuai best practices
 */
export const securityHeaders = async (c: Context, next: Next) => {
  await next();

  // Mencegah MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');

  // Mencegah clickjacking dengan melarang iframe
  c.header('X-Frame-Options', 'DENY');

  // Enable XSS filter di browser
  c.header('X-XSS-Protection', '1; mode=block');

  // Force HTTPS di production (HTTP Strict Transport Security)
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Kontrol informasi referrer
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Kontrol browser features/APIs
  c.header(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );

  // Content Security Policy - mencegah XSS dan injection attacks
  c.header(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // Mencegah browser menyimpan data sensitif
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');

  // Remove server identification
  c.header('X-Powered-By', '');
};
