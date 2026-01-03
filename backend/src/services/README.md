# Services Documentation

Dokumentasi untuk semua services layer dalam aplikasi.

## 📁 Structure

```
services/
├── index.ts              # Central export point
├── storage.service.ts    # File storage service (MinIO S3)
├── cache.service.ts      # Caching service (Redis)
└── README.md             # This file
```

---

## 🗄️ Storage Service

**File:** `storage.service.ts`

Singleton service untuk semua operasi file storage menggunakan MinIO S3.

### Initialization

```typescript
import { storageService } from './services';

// Initialize (called automatically on server start)
await storageService.initialize();
```

### Basic Operations

#### Upload File

```typescript
const result = await storageService.uploadFile(
  'photo.jpg',
  fileBuffer,
  'image/jpeg',
  { userId: '123', category: 'profile' }
);

// Returns:
// {
//   fileName: '1704067200000-photo.jpg',
//   url: 'http://localhost:9000/...',
//   size: 12345
// }
```

#### Upload to Specific Path

```typescript
const result = await storageService.uploadFileToPath(
  'documents',      // path
  'report.pdf',     // fileName
  fileBuffer,
  'application/pdf',
  { userId: '123' }
);

// Returns:
// {
//   fileName: '1704067200000-report.pdf',
//   url: '...',
//   size: 12345,
//   path: 'documents/1704067200000-report.pdf'
// }
```

#### Download File

```typescript
const buffer = await storageService.downloadFile('1704067200000-photo.jpg');
```

#### Delete File

```typescript
// Single file
await storageService.deleteFile('1704067200000-photo.jpg');

// Multiple files
await storageService.deleteFiles(['file1.jpg', 'file2.png']);
```

#### Check File Exists

```typescript
const exists = await storageService.fileExists('photo.jpg');
```

#### Get File Info

```typescript
const info = await storageService.getFileInfo('photo.jpg');
console.log(info.size, info.lastModified, info.metaData);
```

### Helper Methods

#### Upload Avatar

```typescript
const result = await storageService.uploadAvatar(
  userId,
  fileBuffer,
  'image/jpeg',
  'original-filename.jpg'
);
// Uploads to: avatars/{userId}.jpg
```

#### Upload Document

```typescript
const result = await storageService.uploadDocument(
  userId,
  fileBuffer,
  'application/pdf',
  'document.pdf'
);
// Uploads to: documents/{timestamp}-document.pdf
```

#### Upload Image

```typescript
const result = await storageService.uploadImage(
  userId,
  fileBuffer,
  'image/jpeg',
  'photo.jpg'
);
// Uploads to: images/{timestamp}-photo.jpg
```

### Management Operations

#### List Files

```typescript
// All files
const allFiles = await storageService.listFiles();

// Files with prefix
const avatars = await storageService.listFiles('avatars/', true);
```

#### Copy File

```typescript
await storageService.copyFile('source.jpg', 'destination.jpg');
```

#### Get Storage Statistics

```typescript
const stats = await storageService.getBucketStats();
console.log(stats.totalFiles, stats.totalSize);
```

#### Cleanup Old Files

```typescript
// Delete files older than 30 days
const deletedCount = await storageService.cleanupOldFiles(30);
console.log(`Deleted ${deletedCount} old files`);
```

### URL Generation

#### Pre-signed URL (Recommended)

```typescript
// Valid for 7 days (default)
const url = await storageService.getFileUrl('photo.jpg');

// Custom expiry (24 hours)
const url = await storageService.getFileUrl('photo.jpg', 24 * 60 * 60);
```

#### Public URL

```typescript
const url = storageService.getPublicUrl('photo.jpg');
// Returns: http://localhost:9000/uploads/photo.jpg
```

---

## 💾 Cache Service

**File:** `cache.service.ts`

Singleton service untuk semua operasi caching menggunakan Redis.

### Initialization

```typescript
import { cacheService } from './services';

// Service is ready to use immediately
```

### Basic Operations

#### Set Cache

```typescript
// String value
await cacheService.set('key', 'value', 300); // 5 minutes

// Object value
await cacheService.set('user:123', { name: 'John' }, 3600);
```

#### Get Cache

```typescript
// String
const value = await cacheService.get('key');

// Object (auto parse)
const user = await cacheService.get<User>('user:123', true);
```

#### Delete Cache

```typescript
// Single key
await cacheService.delete('key');

// Multiple keys
await cacheService.delete('key1', 'key2', 'key3');
```

#### Check Exists

```typescript
const exists = await cacheService.exists('key');
```

### Advanced Caching

#### Remember Pattern

Auto-fetch and cache on miss:

```typescript
const userData = await cacheService.remember(
  'user:123',
  3600,
  async () => {
    // This only runs on cache miss
    return await fetchUserFromDatabase(123);
  }
);
```

#### Cache Invalidation

```typescript
// Invalidate by pattern
await cacheService.invalidatePattern('user:*');
await cacheService.invalidatePattern('api:products:*');
```

### User Caching

```typescript
// Cache user data
await cacheService.cacheUser('123', userData, 3600);

// Get user data
const user = await cacheService.getUser<User>('123');

// Delete user cache
await cacheService.deleteUser('123');

// Invalidate all user cache
await cacheService.invalidateUserCache('123');
```

### Session Management

```typescript
// Set session (15 minutes default)
await cacheService.setSession('userId', sessionData);

// Get session
const session = await cacheService.getSession('userId');

// Delete session (logout)
await cacheService.deleteSession('userId');

// Refresh session TTL
await cacheService.refreshSession('userId', 900);
```

### API Response Caching

```typescript
// Cache API response
await cacheService.cacheApiResponse(
  '/api/products',
  { category: 'electronics' },
  productsData,
  300
);

// Get cached response
const products = await cacheService.getApiResponse(
  '/api/products',
  { category: 'electronics' }
);

// Remember API response (auto-fetch on miss)
const products = await cacheService.rememberApiResponse(
  '/api/products',
  { category: 'electronics' },
  300,
  async () => await fetchProducts('electronics')
);

// Invalidate API cache
await cacheService.invalidateApiCache('/api/products');
```

### Rate Limiting

```typescript
const result = await cacheService.checkRateLimit(
  'user:123',
  10,    // limit
  60     // window in seconds
);

if (!result.allowed) {
  console.log(`Rate limit exceeded. Reset at: ${result.resetAt}`);
  console.log(`Remaining: ${result.remaining}`);
}

// Reset rate limit
await cacheService.resetRateLimit('user:123');
```

### Login Tracking

```typescript
// Track login attempt
const attempts = await cacheService.trackLoginAttempt('email@example.com');

// Get login attempts
const count = await cacheService.getLoginAttempts('email@example.com');

// Reset login attempts
await cacheService.resetLoginAttempts('email@example.com');

// Lock account
await cacheService.lockAccount('email@example.com', 15); // 15 minutes

// Check if locked
const isLocked = await cacheService.isAccountLocked('email@example.com');
```

### Verification Codes (OTP, Email Verification)

```typescript
// Store code (10 minutes default)
await cacheService.storeVerificationCode('email@example.com', '123456', 600);

// Verify code
const isValid = await cacheService.verifyCode('email@example.com', '123456');

// Delete code
await cacheService.deleteVerificationCode('email@example.com');
```

### Counter Operations

```typescript
// Increment
const count = await cacheService.increment('page:views');

// Decrement
const count = await cacheService.decrement('items:stock');
```

### Statistics

```typescript
const stats = await cacheService.getStats();
console.log(stats);
// {
//   totalKeys: 150,
//   userKeys: 50,
//   sessionKeys: 30,
//   apiKeys: 70
// }
```

### Utilities

```typescript
// Get all keys matching pattern
const keys = await cacheService.keys('user:*');

// Get TTL
const ttl = await cacheService.ttl('key');

// Set expiration
await cacheService.expire('key', 3600);

// Clear all cache (⚠️ Use with caution!)
await cacheService.clearAll();
```

---

## 🎯 Usage Examples

### Example 1: File Upload with Caching

```typescript
import { storageService, cacheService } from './services';

async function uploadUserAvatar(userId: string, fileBuffer: Buffer) {
  // Upload to storage
  const result = await storageService.uploadAvatar(
    userId,
    fileBuffer,
    'image/jpeg',
    'avatar.jpg'
  );

  // Cache avatar URL for quick access
  await cacheService.set(`avatar:${userId}`, result.url, 3600);

  // Invalidate user cache
  await cacheService.invalidateUserCache(userId);

  return result;
}
```

### Example 2: Cached User Profile

```typescript
async function getUserProfile(userId: string) {
  return await cacheService.remember(
    `profile:${userId}`,
    300, // 5 minutes
    async () => {
      const user = await userRepository.findOne({ where: { id: userId } });

      // Get avatar URL from cache or storage
      let avatarUrl = await cacheService.get(`avatar:${userId}`);
      if (!avatarUrl) {
        const files = await storageService.listFiles(`avatars/${userId}`, true);
        if (files.length > 0) {
          avatarUrl = await storageService.getFileUrl(files[0].name);
          await cacheService.set(`avatar:${userId}`, avatarUrl, 3600);
        }
      }

      return {
        ...user,
        avatarUrl,
      };
    }
  );
}
```

### Example 3: Rate Limited File Upload

```typescript
async function uploadWithRateLimit(userId: string, file: Buffer) {
  // Check rate limit: 5 uploads per hour
  const rateLimit = await cacheService.checkRateLimit(
    `upload:${userId}`,
    5,
    3600
  );

  if (!rateLimit.allowed) {
    throw new Error('Upload rate limit exceeded');
  }

  // Upload file
  return await storageService.uploadFile(
    'document.pdf',
    file,
    'application/pdf',
    { userId }
  );
}
```

---

## 🔒 Best Practices

### Storage Service

1. **Always validate files before upload**
2. **Use appropriate paths for organization**
3. **Set metadata for tracking**
4. **Clean up old files periodically**
5. **Use pre-signed URLs for security**

### Cache Service

1. **Always set TTL to prevent memory leaks**
2. **Use namespaced keys (e.g., `user:123` not just `123`)**
3. **Invalidate cache when data changes**
4. **Use `remember()` pattern for simplicity**
5. **Monitor cache hit rate**

---

## 🧪 Testing

```typescript
// Test storage service
await storageService.isInitialized(); // true

// Test cache service
await cacheService.set('test', 'value', 10);
const value = await cacheService.get('test'); // 'value'
await cacheService.delete('test');
```

---

## 📊 Monitoring

### Storage Metrics

```typescript
const stats = await storageService.getBucketStats();
console.log(`Total Files: ${stats.totalFiles}`);
console.log(`Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
```

### Cache Metrics

```typescript
const stats = await cacheService.getStats();
console.log(`Total Keys: ${stats.totalKeys}`);
console.log(`User Keys: ${stats.userKeys}`);
console.log(`Session Keys: ${stats.sessionKeys}`);
console.log(`API Keys: ${stats.apiKeys}`);
```

---

## 🚨 Error Handling

Both services throw errors that should be caught:

```typescript
try {
  await storageService.uploadFile(...);
} catch (error) {
  console.error('Storage error:', error.message);
  // Handle error
}

try {
  await cacheService.set(...);
} catch (error) {
  console.error('Cache error:', error.message);
  // Handle error (cache failures should not break app)
}
```

---

**Updated:** 2024-01-02
**Version:** 1.0.0
