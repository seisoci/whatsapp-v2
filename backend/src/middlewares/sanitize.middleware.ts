import { Context, Next } from 'hono';

/**
 * Sanitize input untuk mencegah XSS dan injection attacks
 * @param input - Any input data (string, object, array)
 * @returns Sanitized input
 */
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Hapus < dan > untuk mencegah HTML injection
      .replace(/javascript:/gi, '') // Hapus javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Hapus event handlers (onclick, onerror, dll)
      .replace(/data:text\/html/gi, '') // Hapus data URI scheme untuk HTML
      .replace(/vbscript:/gi, '') // Hapus vbscript: protocol
      .trim();
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = Array.isArray(input) ? [] : {};
    for (const key in input) {
      // Sanitize key juga untuk mencegah prototype pollution
      const sanitizedKey = sanitizeInput(key);
      if (sanitizedKey !== '__proto__' && sanitizedKey !== 'constructor' && sanitizedKey !== 'prototype') {
        sanitized[sanitizedKey] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }

  return input;
};

/**
 * Input sanitization middleware
 * Automatically sanitizes request body untuk POST, PUT, PATCH requests
 */
export const sanitizeMiddleware = async (c: Context, next: Next) => {
  if (c.req.method === 'POST' || c.req.method === 'PUT' || c.req.method === 'PATCH') {
    try {
      const body = await c.req.json();
      const sanitized = sanitizeInput(body);
      c.set('sanitizedBody', sanitized);
    } catch (error) {
      // Body bukan JSON atau kosong, skip sanitization
    }
  }

  await next();
};
