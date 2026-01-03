import { z } from 'zod';
import { emailSchema, passwordSchema, usernameSchema } from './common.validator';

/**
 * Auth Validators
 * Validation schemas untuk authentication endpoints
 */

// Register validation
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password harus diisi'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Refresh token validation
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token harus diisi'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// Change password validation
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama harus diisi'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Konfirmasi password harus diisi'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password baru dan konfirmasi tidak cocok',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Password baru harus berbeda dengan password lama',
  path: ['newPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Forgot password validation
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset password validation
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token harus diisi'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Konfirmasi password harus diisi'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password baru dan konfirmasi tidak cocok',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Email verification validation
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token verifikasi harus diisi'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// Resend verification email
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

// 2FA setup validation
export const setup2FASchema = z.object({
  password: z.string().min(1, 'Password harus diisi'),
});

export type Setup2FAInput = z.infer<typeof setup2FASchema>;

// 2FA verification validation
export const verify2FASchema = z.object({
  code: z.string().length(6, 'Kode 2FA harus 6 digit').regex(/^\d+$/, 'Kode harus berupa angka'),
});

export type Verify2FAInput = z.infer<typeof verify2FASchema>;

// Login with 2FA
export const loginWith2FASchema = loginSchema.extend({
  twoFactorCode: z.string().length(6, 'Kode 2FA harus 6 digit').regex(/^\d+$/, 'Kode harus berupa angka'),
});

export type LoginWith2FAInput = z.infer<typeof loginWith2FASchema>;
