import { z } from 'zod';
import {
  emailSchema,
  usernameSchema,
  nameSchema,
  phoneSchema,
  addressSchema,
  dateSchema,
  optionalEmailSchema,
} from './common.validator';

/**
 * User Validators
 * Validation schemas untuk user-related operations
 */

// Update profile validation
export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  fullName: nameSchema.optional(),
  bio: z.string().max(500, 'Bio terlalu panjang').optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: dateSchema.optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: addressSchema.optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  website: z.string().url('URL website tidak valid').optional(),
  socialMedia: z.object({
    twitter: z.string().max(100).optional(),
    facebook: z.string().max(100).optional(),
    instagram: z.string().max(100).optional(),
    linkedin: z.string().max(100).optional(),
  }).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Update email validation
export const updateEmailSchema = z.object({
  newEmail: emailSchema,
  password: z.string().min(1, 'Password harus diisi untuk verifikasi'),
});

export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;

// Update notification settings
export const updateNotificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  marketingEmails: z.boolean().default(false),
  securityAlerts: z.boolean().default(true),
});

export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;

// Update privacy settings
export const updatePrivacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']).default('public'),
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  allowMessages: z.enum(['everyone', 'friends', 'none']).default('everyone'),
  searchable: z.boolean().default(true),
});

export type UpdatePrivacySettingsInput = z.infer<typeof updatePrivacySettingsSchema>;

// Delete account validation
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password harus diisi untuk konfirmasi'),
  reason: z.string().max(500, 'Alasan terlalu panjang').optional(),
  feedback: z.string().max(1000, 'Feedback terlalu panjang').optional(),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// User search validation
export const userSearchSchema = z.object({
  query: z.string().min(2, 'Query pencarian minimal 2 karakter').max(100),
  type: z.enum(['username', 'email', 'fullName', 'all']).default('all'),
  limit: z.coerce.number().int().positive().max(50).default(20),
  page: z.coerce.number().int().positive().default(1),
});

export type UserSearchInput = z.infer<typeof userSearchSchema>;

// Block user validation
export const blockUserSchema = z.object({
  userId: z.string().uuid('User ID tidak valid'),
  reason: z.string().max(500).optional(),
});

export type BlockUserInput = z.infer<typeof blockUserSchema>;

// Report user validation
export const reportUserSchema = z.object({
  userId: z.string().uuid('User ID tidak valid'),
  reason: z.enum(['spam', 'harassment', 'inappropriate-content', 'fake-account', 'other']),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter').max(1000),
  evidence: z.array(z.string().url()).max(5, 'Maksimal 5 bukti').optional(),
});

export type ReportUserInput = z.infer<typeof reportUserSchema>;

// Follow user validation
export const followUserSchema = z.object({
  userId: z.string().uuid('User ID tidak valid'),
});

export type FollowUserInput = z.infer<typeof followUserSchema>;
