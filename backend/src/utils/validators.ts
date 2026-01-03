/**
 * @deprecated This file is deprecated. Please use validators from ../validators/ folder instead.
 *
 * Import validators from:
 * - import { emailSchema, passwordSchema, usernameSchema } from '../validators/common.validator';
 * - import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';
 *
 * Or use the central export:
 * - import { emailSchema, registerSchema, etc } from '../validators';
 */

// Re-export from new location for backward compatibility
export {
  emailSchema,
  passwordSchema,
  usernameSchema,
} from '../validators/common.validator';

export {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';
