import { z } from 'zod';

/**
 * Common Validators
 * Reusable validation schemas untuk field umum
 */

// Email validation
export const emailSchema = z
  .string()
  .email('Email tidak valid')
  .toLowerCase()
  .trim()
  .max(100, 'Email terlalu panjang');

// Password validation - minimum 8 karakter, harus ada huruf besar, kecil, angka, dan simbol
export const passwordSchema = z
  .string()
  .min(8, 'Password harus minimal 8 karakter')
  .max(100, 'Password terlalu panjang')
  .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
  .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
  .regex(/[0-9]/, 'Password harus mengandung angka')
  .regex(/[^a-zA-Z0-9]/, 'Password harus mengandung simbol khusus');

// Username validation - hanya huruf, angka, underscore, dan hyphen
export const usernameSchema = z
  .string()
  .min(3, 'Username harus minimal 3 karakter')
  .max(50, 'Username maksimal 50 karakter')
  .toLowerCase()
  .trim()
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username hanya boleh huruf, angka, underscore, dan hyphen');

// Phone number validation (Indonesia format)
export const phoneSchema = z
  .string()
  .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Format nomor telepon tidak valid')
  .transform((val) => {
    // Normalize to +62 format
    if (val.startsWith('0')) {
      return '+62' + val.slice(1);
    }
    if (val.startsWith('62')) {
      return '+' + val;
    }
    return val;
  });

// UUID validation
export const uuidSchema = z.string().uuid('UUID tidak valid');

// URL validation
export const urlSchema = z.string().url('URL tidak valid');

// Date validation (ISO 8601)
export const dateSchema = z.string().datetime('Format tanggal tidak valid');

// Numeric string (for IDs, etc)
export const numericStringSchema = z.string().regex(/^\d+$/, 'Harus berupa angka');

// Positive integer
export const positiveIntSchema = z.number().int().positive('Harus berupa bilangan bulat positif');

// Non-negative integer (including 0)
export const nonNegativeIntSchema = z.number().int().nonnegative('Harus berupa bilangan bulat non-negatif');

// Boolean string ("true" or "false")
export const booleanStringSchema = z
  .string()
  .transform((val) => val.toLowerCase() === 'true')
  .pipe(z.boolean());

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ID parameter validation
export const idParamSchema = z.object({
  id: uuidSchema,
});

// Search query validation
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Query pencarian harus diisi').max(255),
  ...paginationSchema.shape,
});

// Name validation (for full name, etc)
export const nameSchema = z
  .string()
  .min(2, 'Nama harus minimal 2 karakter')
  .max(100, 'Nama terlalu panjang')
  .trim()
  .regex(/^[a-zA-Z\s'-]+$/, 'Nama hanya boleh huruf, spasi, apostrof, dan hyphen');

// Address validation
export const addressSchema = z
  .string()
  .min(10, 'Alamat harus minimal 10 karakter')
  .max(500, 'Alamat terlalu panjang')
  .trim();

// Postal code validation (Indonesia)
export const postalCodeSchema = z
  .string()
  .regex(/^\d{5}$/, 'Kode pos harus 5 digit angka');

// Color hex validation
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna hex tidak valid (contoh: #FF5733)');

// IP address validation
export const ipAddressSchema = z
  .string()
  .ip('Format IP address tidak valid');

// Slug validation (for URLs)
export const slugSchema = z
  .string()
  .min(3, 'Slug harus minimal 3 karakter')
  .max(100, 'Slug terlalu panjang')
  .toLowerCase()
  .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan hyphen');

// JSON string validation
export const jsonStringSchema = z
  .string()
  .transform((str, ctx) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      ctx.addIssue({ code: 'custom', message: 'Format JSON tidak valid' });
      return z.NEVER;
    }
  });

// File size validation helper (in bytes)
export const fileSizeSchema = (maxSizeInMB: number) =>
  z.number().max(maxSizeInMB * 1024 * 1024, `Ukuran file maksimal ${maxSizeInMB}MB`);

// Array of unique strings
export const uniqueStringArraySchema = z
  .array(z.string())
  .refine((arr) => new Set(arr).size === arr.length, {
    message: 'Array harus berisi nilai unik',
  });

// Non-empty string
export const nonEmptyStringSchema = z.string().min(1, 'Field ini harus diisi').trim();

// Optional email (can be empty)
export const optionalEmailSchema = emailSchema.optional().or(z.literal(''));

// Coordinate validation (latitude, longitude)
export const latitudeSchema = z
  .number()
  .min(-90, 'Latitude harus antara -90 dan 90')
  .max(90, 'Latitude harus antara -90 dan 90');

export const longitudeSchema = z
  .number()
  .min(-180, 'Longitude harus antara -180 dan 180')
  .max(180, 'Longitude harus antara -180 dan 180');

export const coordinateSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});
