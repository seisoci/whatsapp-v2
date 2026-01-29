import { Context, Next } from 'hono';

/**
 * IP Blacklist
 * Tambahkan IP addresses yang ingin di-block di sini
 */
const blacklistedIPs = new Set<string>([
  // Contoh:
  // '192.168.1.100',
  // '10.0.0.50',
]);

/**
 * IP Whitelist (opsional)
 * Jika diaktifkan, hanya IP di whitelist yang diizinkan
 */
const whitelistedIPs = new Set<string>([
  // Contoh:
  // '192.168.1.1',
  // '10.0.0.1',
]);

/**
 * Enable whitelist mode
 * Jika true, hanya IP di whitelist yang diizinkan akses
 */
const WHITELIST_MODE = false;

/**
 * Helper function untuk mendapatkan client IP address
 * @param c - Hono context
 * @returns IP address string
 */
export const getClientIP = (c: Context): string => {
  // Check X-Forwarded-For header (jika behind proxy/load balancer)
  const xForwardedFor = c.req.header('x-forwarded-for');
  if (xForwardedFor) {
    // X-Forwarded-For bisa berisi multiple IPs, ambil yang pertama
    return xForwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const xRealIP = c.req.header('x-real-ip');
  if (xRealIP) {
    return xRealIP.trim();
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfConnectingIP = c.req.header('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Fallback: get IP from Bun server socket
  try {
    const server = c.env?.server;
    if (server?.requestIP) {
      const addr = server.requestIP(c.req.raw);
      if (addr?.address) {
        return addr.address;
      }
    }
  } catch {}

  return 'unknown';
};

/**
 * IP Filter middleware
 * Memblokir IP yang ada di blacklist atau mengizinkan hanya IP di whitelist
 */
export const ipFilter = async (c: Context, next: Next) => {
  const ip = getClientIP(c);

  // Whitelist mode: hanya izinkan IP yang ada di whitelist
  if (WHITELIST_MODE) {
    if (!whitelistedIPs.has(ip)) {
      return c.json(
        {
          success: false,
          message: 'Access denied',
        },
        403
      );
    }
    await next();
    return;
  }

  // Blacklist mode: block IP yang ada di blacklist
  if (blacklistedIPs.has(ip)) {
    return c.json(
      {
        success: false,
        message: 'Access denied',
      },
      403
    );
  }

  await next();
};

/**
 * Add IP to blacklist
 * @param ip - IP address to blacklist
 */
export const addToBlacklist = (ip: string): void => {
  blacklistedIPs.add(ip);
};

/**
 * Remove IP from blacklist
 * @param ip - IP address to remove
 */
export const removeFromBlacklist = (ip: string): void => {
  blacklistedIPs.delete(ip);
};

/**
 * Add IP to whitelist
 * @param ip - IP address to whitelist
 */
export const addToWhitelist = (ip: string): void => {
  whitelistedIPs.add(ip);
};

/**
 * Remove IP from whitelist
 * @param ip - IP address to remove
 */
export const removeFromWhitelist = (ip: string): void => {
  whitelistedIPs.delete(ip);
};

/**
 * Check if IP is blacklisted
 * @param ip - IP address to check
 */
export const isBlacklisted = (ip: string): boolean => {
  return blacklistedIPs.has(ip);
};

/**
 * Check if IP is whitelisted
 * @param ip - IP address to check
 */
export const isWhitelisted = (ip: string): boolean => {
  return whitelistedIPs.has(ip);
};
