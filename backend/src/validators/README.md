# Validators Documentation

Dokumentasi lengkap untuk semua validation schemas menggunakan **Zod**.

## 📚 Library

Kami menggunakan [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation dengan static type inference.

### Kenapa Zod?

✅ TypeScript-first dengan full type safety
✅ Zero dependencies
✅ Composable schemas
✅ Detailed error messages
✅ Transform & refine capabilities
✅ Runtime validation

---

## 📁 Structure

```
validators/
├── index.ts              # Central export
├── common.validator.ts   # Reusable common validators
├── auth.validator.ts     # Authentication validators
├── upload.validator.ts   # File upload validators
├── user.validator.ts     # User-related validators
└── README.md             # This file
```

---

## 🔧 Common Validators

**File:** `common.validator.ts`

### Basic Fields

```typescript
import { emailSchema, passwordSchema, usernameSchema } from './validators';

// Email validation
const email = emailSchema.parse('user@example.com'); // ✅

// Password validation (min 8 chars, uppercase, lowercase, number, symbol)
const password = passwordSchema.parse('SecureP@ss123'); // ✅

// Username validation (3-50 chars, alphanumeric, _, -)
const username = usernameSchema.parse('john_doe'); // ✅
```

### Contact Information

```typescript
import { phoneSchema, addressSchema, postalCodeSchema } from './validators';

// Phone number (Indonesia format)
const phone = phoneSchema.parse('081234567890');
// Returns: '+6281234567890'

// Address
const address = addressSchema.parse('Jl. Sudirman No. 123');

// Postal code (5 digits)
const postalCode = postalCodeSchema.parse('12345');
```

### Identifiers

```typescript
import { uuidSchema, slugSchema } from './validators';

// UUID validation
const id = uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000');

// Slug validation (URL-friendly)
const slug = slugSchema.parse('my-blog-post');
```

### Numbers & Validation

```typescript
import {
  positiveIntSchema,
  nonNegativeIntSchema,
  latitudeSchema,
  longitudeSchema
} from './validators';

// Positive integer (> 0)
const count = positiveIntSchema.parse(5);

// Non-negative integer (>= 0)
const rating = nonNegativeIntSchema.parse(0);

// Coordinates
const lat = latitudeSchema.parse(-6.2088);
const lng = longitudeSchema.parse(106.8456);
```

### Pagination

```typescript
import { paginationSchema, searchQuerySchema } from './validators';

// Pagination
const pagination = paginationSchema.parse({
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

// Search with pagination
const search = searchQuerySchema.parse({
  q: 'laptop',
  page: 1,
  limit: 20,
});
```

### Others

```typescript
import {
  hexColorSchema,
  urlSchema,
  dateSchema,
  booleanStringSchema,
  jsonStringSchema,
} from './validators';

// Hex color
const color = hexColorSchema.parse('#FF5733');

// URL
const website = urlSchema.parse('https://example.com');

// ISO date
const date = dateSchema.parse('2024-01-01T00:00:00Z');

// Boolean from string
const isActive = booleanStringSchema.parse('true'); // Returns: true

// JSON string parsing
const data = jsonStringSchema.parse('{"name":"John"}');
// Returns: { name: 'John' }
```

---

## 🔐 Auth Validators

**File:** `auth.validator.ts`

### Register

```typescript
import { registerSchema, type RegisterInput } from './validators';

const data: RegisterInput = {
  email: 'user@example.com',
  username: 'johndoe',
  password: 'SecureP@ss123',
};

const validated = registerSchema.parse(data);
```

### Login

```typescript
import { loginSchema, type LoginInput } from './validators';

const credentials: LoginInput = {
  email: 'user@example.com',
  password: 'SecureP@ss123',
};

const validated = loginSchema.parse(credentials);
```

### Change Password

```typescript
import { changePasswordSchema, type ChangePasswordInput } from './validators';

const data: ChangePasswordInput = {
  currentPassword: 'OldP@ss123',
  newPassword: 'NewP@ss456',
  confirmPassword: 'NewP@ss456',
};

const validated = changePasswordSchema.parse(data);
// ✅ Validates:
// - New password matches confirmation
// - New password different from old
```

### Reset Password

```typescript
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput
} from './validators';

// Request reset
const forgotData: ForgotPasswordInput = {
  email: 'user@example.com',
};

// Reset with token
const resetData: ResetPasswordInput = {
  token: 'reset-token-here',
  newPassword: 'NewP@ss123',
  confirmPassword: 'NewP@ss123',
};
```

### 2FA (Two-Factor Authentication)

```typescript
import {
  setup2FASchema,
  verify2FASchema,
  loginWith2FASchema
} from './validators';

// Setup 2FA
const setupData = setup2FASchema.parse({
  password: 'MyP@ss123',
});

// Verify 2FA code
const verifyData = verify2FASchema.parse({
  code: '123456', // 6 digits
});

// Login with 2FA
const loginData = loginWith2FASchema.parse({
  email: 'user@example.com',
  password: 'MyP@ss123',
  twoFactorCode: '123456',
});
```

---

## 📤 Upload Validators

**File:** `upload.validator.ts`

### Image Upload

```typescript
import {
  imageFileSchema,
  avatarFileSchema,
  type ImageFile,
  type AvatarFile
} from './validators';

// General image
const imageData: ImageFile = {
  name: 'photo.jpg',
  size: 1024 * 1024 * 3, // 3MB
  type: 'image/jpeg',
};

const validated = imageFileSchema.parse(imageData);
// ✅ Max 5MB, types: jpeg, png, gif, webp, svg

// Avatar (stricter)
const avatarData: AvatarFile = {
  name: 'avatar.png',
  size: 1024 * 1024, // 1MB
  type: 'image/png',
};

const validatedAvatar = avatarFileSchema.parse(avatarData);
// ✅ Max 2MB, types: jpeg, png, webp only
```

### Document Upload

```typescript
import { documentFileSchema, type DocumentFile } from './validators';

const docData: DocumentFile = {
  name: 'report.pdf',
  size: 1024 * 1024 * 5, // 5MB
  type: 'application/pdf',
};

const validated = documentFileSchema.parse(docData);
// ✅ Max 10MB
// ✅ Types: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv
```

### Video & Audio

```typescript
import { videoFileSchema, audioFileSchema } from './validators';

// Video
const videoData = {
  name: 'video.mp4',
  size: 1024 * 1024 * 30, // 30MB
  type: 'video/mp4',
};
const validatedVideo = videoFileSchema.parse(videoData);
// ✅ Max 50MB

// Audio
const audioData = {
  name: 'song.mp3',
  size: 1024 * 1024 * 10, // 10MB
  type: 'audio/mpeg',
};
const validatedAudio = audioFileSchema.parse(audioData);
// ✅ Max 20MB
```

### File Metadata

```typescript
import { fileMetadataSchema, type FileMetadata } from './validators';

const metadata: FileMetadata = {
  category: 'document',
  description: 'Monthly report',
  tags: ['report', 'monthly', '2024'],
  isPublic: false,
};

const validated = fileMetadataSchema.parse(metadata);
```

### Multiple Files

```typescript
import { multipleFilesSchema } from './validators';

const data = {
  files: [
    { name: 'img1.jpg', size: 1024 * 1024, type: 'image/jpeg' },
    { name: 'img2.png', size: 1024 * 1024 * 2, type: 'image/png' },
  ],
};

const validated = multipleFilesSchema.parse(data);
// ✅ Min 1, Max 5 files
```

### File Queries

```typescript
import { listFilesQuerySchema, deleteMultipleFilesSchema } from './validators';

// List files
const listQuery = listFilesQuerySchema.parse({
  prefix: 'documents/',
  limit: 50,
  cursor: 'next-page-token',
});

// Delete multiple
const deleteData = deleteMultipleFilesSchema.parse({
  fileNames: ['file1.pdf', 'file2.jpg'],
});
// ✅ Min 1, Max 50 files
```

### Allowed Types Constants

```typescript
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES,
  IMAGE_EXTENSIONS,
  DOCUMENT_EXTENSIONS,
} from './validators';

console.log(ALLOWED_IMAGE_TYPES);
// ['image/jpeg', 'image/png', ...]

console.log(IMAGE_EXTENSIONS);
// ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
```

---

## 👤 User Validators

**File:** `user.validator.ts`

### Update Profile

```typescript
import { updateProfileSchema, type UpdateProfileInput } from './validators';

const data: UpdateProfileInput = {
  username: 'new_username',
  fullName: 'John Doe',
  bio: 'Software Developer',
  phone: '+6281234567890',
  dateOfBirth: '1990-01-01T00:00:00Z',
  gender: 'male',
  address: 'Jl. Sudirman No. 123',
  city: 'Jakarta',
  country: 'Indonesia',
  website: 'https://johndoe.com',
  socialMedia: {
    twitter: '@johndoe',
    facebook: 'johndoe',
    instagram: '@johndoe',
    linkedin: 'johndoe',
  },
};

const validated = updateProfileSchema.parse(data);
```

### Settings

```typescript
import {
  updateNotificationSettingsSchema,
  updatePrivacySettingsSchema
} from './validators';

// Notification settings
const notifSettings = updateNotificationSettingsSchema.parse({
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  marketingEmails: false,
  securityAlerts: true,
});

// Privacy settings
const privacySettings = updatePrivacySettingsSchema.parse({
  profileVisibility: 'public',
  showEmail: false,
  showPhone: false,
  allowMessages: 'friends',
  searchable: true,
});
```

### User Actions

```typescript
import {
  userSearchSchema,
  blockUserSchema,
  reportUserSchema,
  followUserSchema,
} from './validators';

// Search users
const searchQuery = userSearchSchema.parse({
  query: 'john',
  type: 'username',
  limit: 20,
  page: 1,
});

// Block user
const blockData = blockUserSchema.parse({
  userId: '550e8400-e29b-41d4-a716-446655440000',
  reason: 'Spam',
});

// Report user
const reportData = reportUserSchema.parse({
  userId: '550e8400-e29b-41d4-a716-446655440000',
  reason: 'harassment',
  description: 'User is harassing others in comments',
  evidence: ['https://example.com/screenshot1.jpg'],
});

// Follow user
const followData = followUserSchema.parse({
  userId: '550e8400-e29b-41d4-a716-446655440000',
});
```

### Delete Account

```typescript
import { deleteAccountSchema, type DeleteAccountInput } from './validators';

const data: DeleteAccountInput = {
  password: 'MyP@ss123',
  reason: 'No longer needed',
  feedback: 'Great service, but I no longer need it',
};

const validated = deleteAccountSchema.parse(data);
```

---

## 🎯 Usage in Controllers

### Example 1: Validate Request Body

```typescript
import { registerSchema } from '../validators';

export class AuthController {
  static async register(c: Context) {
    try {
      const body = await c.req.json();

      // Validate
      const validated = registerSchema.parse(body);

      // Use validated data (with type safety!)
      const user = await createUser(validated);

      return c.json({ success: true, user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        }, 400);
      }
      throw error;
    }
  }
}
```

### Example 2: Safe Parse (No Throw)

```typescript
import { loginSchema } from '../validators';

const body = await c.req.json();
const result = loginSchema.safeParse(body);

if (!result.success) {
  return c.json({
    success: false,
    errors: result.error.errors,
  }, 400);
}

// Use result.data (validated!)
const { email, password } = result.data;
```

### Example 3: Partial Validation

```typescript
import { updateProfileSchema } from '../validators';

// Only validate provided fields
const partialSchema = updateProfileSchema.partial();

const data = { bio: 'New bio' }; // Only updating bio
const validated = partialSchema.parse(data); // ✅
```

### Example 4: Custom Error Messages

```typescript
const customSchema = registerSchema
  .refine((data) => data.password !== data.username, {
    message: 'Password tidak boleh sama dengan username',
    path: ['password'],
  });
```

---

## 🧪 Testing

```typescript
import { describe, it, expect } from 'bun:test';
import { emailSchema, passwordSchema } from './validators';

describe('Email Validator', () => {
  it('should accept valid email', () => {
    expect(() => emailSchema.parse('user@example.com')).not.toThrow();
  });

  it('should reject invalid email', () => {
    expect(() => emailSchema.parse('invalid-email')).toThrow();
  });

  it('should normalize email to lowercase', () => {
    const result = emailSchema.parse('User@Example.COM');
    expect(result).toBe('user@example.com');
  });
});

describe('Password Validator', () => {
  it('should accept strong password', () => {
    expect(() => passwordSchema.parse('SecureP@ss123')).not.toThrow();
  });

  it('should reject weak password', () => {
    expect(() => passwordSchema.parse('weak')).toThrow();
  });
});
```

---

## 🔨 Creating Custom Validators

### Example: Custom Validator

```typescript
import { z } from 'zod';

// Custom credit card validator
export const creditCardSchema = z
  .string()
  .regex(/^\d{16}$/, 'Nomor kartu kredit harus 16 digit')
  .refine((val) => luhnCheck(val), {
    message: 'Nomor kartu kredit tidak valid',
  });

function luhnCheck(cardNumber: string): boolean {
  // Luhn algorithm implementation
  // ...
  return true;
}

// Custom Indonesian ID card (KTP) validator
export const ktpSchema = z
  .string()
  .regex(/^\d{16}$/, 'NIK harus 16 digit')
  .refine((val) => validateKTP(val), {
    message: 'NIK tidak valid',
  });

function validateKTP(nik: string): boolean {
  // KTP validation logic
  // ...
  return true;
}
```

### Example: Composed Validator

```typescript
import { z } from 'zod';
import { emailSchema, phoneSchema } from './common.validator';

// Contact must have either email or phone
export const contactSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Email atau nomor telepon harus diisi',
  });
```

---

## 📊 Best Practices

1. **Always use type inference:**
   ```typescript
   export type RegisterInput = z.infer<typeof registerSchema>;
   ```

2. **Use safeParse for user input:**
   ```typescript
   const result = schema.safeParse(input);
   if (!result.success) {
     // Handle errors
   }
   ```

3. **Compose schemas:**
   ```typescript
   const baseSchema = z.object({ name: z.string() });
   const extendedSchema = baseSchema.extend({ age: z.number() });
   ```

4. **Use transforms for data normalization:**
   ```typescript
   const emailSchema = z.string().email().toLowerCase().trim();
   ```

5. **Provide clear error messages:**
   ```typescript
   z.string().min(8, 'Password minimal 8 karakter');
   ```

---

## 📚 Resources

- [Zod Documentation](https://zod.dev/)
- [Zod GitHub](https://github.com/colinhacks/zod)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Updated:** 2024-01-02
**Library:** Zod v3.22.4
**Version:** 1.0.0
