import { z } from 'zod';

/**
 * Upload Validators
 * Validation schemas untuk file upload
 */

// Allowed MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
] as const;

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
] as const;

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
] as const;

// File size limits (in bytes)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

// File validation helper
export const fileValidationSchema = z.object({
  name: z.string().min(1, 'Nama file harus ada'),
  size: z.number().positive('Ukuran file harus valid'),
  type: z.string().min(1, 'Tipe file harus ada'),
});

// Image file validation
export const imageFileSchema = fileValidationSchema.extend({
  type: z.enum(ALLOWED_IMAGE_TYPES, {
    errorMap: () => ({ message: 'Tipe file harus berupa gambar (JPEG, PNG, GIF, WebP)' }),
  }),
  size: z.number().max(MAX_IMAGE_SIZE, `Ukuran gambar maksimal ${MAX_IMAGE_SIZE / 1024 / 1024}MB`),
});

// Avatar file validation (stricter than normal image)
export const avatarFileSchema = fileValidationSchema.extend({
  type: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Avatar harus berupa JPEG, PNG, atau WebP' }),
  }),
  size: z.number().max(MAX_AVATAR_SIZE, `Ukuran avatar maksimal ${MAX_AVATAR_SIZE / 1024 / 1024}MB`),
});

// Document file validation
export const documentFileSchema = fileValidationSchema.extend({
  type: z.enum(ALLOWED_DOCUMENT_TYPES, {
    errorMap: () => ({ message: 'Tipe file tidak didukung. Hanya PDF, Word, Excel, PowerPoint, atau Text' }),
  }),
  size: z.number().max(MAX_DOCUMENT_SIZE, `Ukuran dokumen maksimal ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB`),
});

// Video file validation
export const videoFileSchema = fileValidationSchema.extend({
  type: z.enum(ALLOWED_VIDEO_TYPES, {
    errorMap: () => ({ message: 'Tipe file harus berupa video (MP4, MPEG, MOV, AVI, WebM)' }),
  }),
  size: z.number().max(MAX_VIDEO_SIZE, `Ukuran video maksimal ${MAX_VIDEO_SIZE / 1024 / 1024}MB`),
});

// Audio file validation
export const audioFileSchema = fileValidationSchema.extend({
  type: z.enum(ALLOWED_AUDIO_TYPES, {
    errorMap: () => ({ message: 'Tipe file harus berupa audio (MP3, WAV, OGG, WebM)' }),
  }),
  size: z.number().max(MAX_AUDIO_SIZE, `Ukuran audio maksimal ${MAX_AUDIO_SIZE / 1024 / 1024}MB`),
});

// Multiple files upload validation
export const multipleFilesSchema = z.object({
  files: z.array(imageFileSchema).min(1, 'Minimal 1 file').max(5, 'Maksimal 5 file'),
});

// File metadata validation
export const fileMetadataSchema = z.object({
  category: z.enum(['avatar', 'document', 'image', 'video', 'audio', 'other']).optional(),
  description: z.string().max(500, 'Deskripsi terlalu panjang').optional(),
  tags: z.array(z.string()).max(10, 'Maksimal 10 tags').optional(),
  isPublic: z.boolean().default(false),
});

// Upload request validation
export const uploadRequestSchema = z.object({
  file: fileValidationSchema,
  metadata: fileMetadataSchema.optional(),
});

// Avatar upload validation
export const uploadAvatarSchema = z.object({
  file: avatarFileSchema,
});

// Document upload validation
export const uploadDocumentSchema = z.object({
  file: documentFileSchema,
  metadata: fileMetadataSchema.optional(),
});

// Get file query validation
export const getFileQuerySchema = z.object({
  fileName: z.string().min(1, 'Nama file harus diisi'),
});

// List files query validation
export const listFilesQuerySchema = z.object({
  prefix: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  cursor: z.string().optional(), // For pagination
});

// Delete file validation
export const deleteFileSchema = z.object({
  fileName: z.string().min(1, 'Nama file harus diisi'),
});

// Delete multiple files validation
export const deleteMultipleFilesSchema = z.object({
  fileNames: z.array(z.string().min(1)).min(1, 'Minimal 1 file').max(50, 'Maksimal 50 file'),
});

// File extension validation helper
export const allowedExtensions = (extensions: string[]) =>
  z.string().refine(
    (filename) => {
      const ext = filename.split('.').pop()?.toLowerCase();
      return ext && extensions.includes(ext);
    },
    {
      message: `File harus berekstensi: ${extensions.join(', ')}`,
    }
  );

// Common file extensions
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
export const VIDEO_EXTENSIONS = ['mp4', 'mpeg', 'mov', 'avi', 'webm'];
export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'webm'];

// Validate file by extension
export const imageExtensionSchema = allowedExtensions(IMAGE_EXTENSIONS);
export const documentExtensionSchema = allowedExtensions(DOCUMENT_EXTENSIONS);
export const videoExtensionSchema = allowedExtensions(VIDEO_EXTENSIONS);
export const audioExtensionSchema = allowedExtensions(AUDIO_EXTENSIONS);

// Export types
export type FileValidation = z.infer<typeof fileValidationSchema>;
export type ImageFile = z.infer<typeof imageFileSchema>;
export type AvatarFile = z.infer<typeof avatarFileSchema>;
export type DocumentFile = z.infer<typeof documentFileSchema>;
export type VideoFile = z.infer<typeof videoFileSchema>;
export type AudioFile = z.infer<typeof audioFileSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;
export type UploadRequest = z.infer<typeof uploadRequestSchema>;
export type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;
