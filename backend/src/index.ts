import 'reflect-metadata';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { AppDataSource } from './config/database';
import { env } from './config/env';
import { redisClient } from './config/redis';
import { storageService } from './services';
import authRouter from './routes/auth.routes';
import uploadRouter from './routes/upload.routes';
import roleRouter from './routes/role.routes';
import permissionRouter from './routes/permission.routes';
import userRouter from './routes/user.routes';
import phoneNumberRouter from './routes/phoneNumber.routes';
import templateRouter from './routes/template.routes';
import {
  securityHeaders,
  corsMiddleware,
  sanitizeMiddleware,
  ipFilter,
  rateLimiter,
} from './middlewares';

const app = new Hono();

// Global middlewares
app.use('*', logger());
app.use('*', securityHeaders);
app.use('*', corsMiddleware);
app.use('*', ipFilter);
app.use('*', sanitizeMiddleware);
app.use('*', rateLimiter(parseInt(env.RATE_LIMIT_WINDOW) * 60 * 1000, parseInt(env.RATE_LIMIT_MAX)));

// Health check
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.route(`${env.API_PREFIX}/auth`, authRouter);
app.route(`${env.API_PREFIX}/upload`, uploadRouter);
app.route(`${env.API_PREFIX}/roles`, roleRouter);
app.route(`${env.API_PREFIX}/permissions`, permissionRouter);
app.route(`${env.API_PREFIX}/users`, userRouter);
app.route(`${env.API_PREFIX}/phone-numbers`, phoneNumberRouter);
app.route(`${env.API_PREFIX}/templates`, templateRouter);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: 'Endpoint tidak ditemukan',
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
    500
  );
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // Run migrations automatically
    await AppDataSource.runMigrations();
    console.log('✅ Migrations executed successfully');

    // Test Redis connection (non-blocking)
    redisClient.ping()
      .then(() => console.log('✅ Redis connection successful'))
      .catch((error) => console.warn('⚠️  Redis connection failed (optional service):', error));

    // Initialize Storage Service (non-blocking)
    storageService.initialize()
      .then(() => console.log('✅ Storage service initialized'))
      .catch((error) => console.warn('⚠️  Storage service initialization failed (optional service):', error));

    // Start server
    const port = parseInt(env.PORT);

    Bun.serve({
      fetch: app.fetch,
      port,
    });

    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`📝 API Documentation: http://localhost:${port}${env.API_PREFIX}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log('\nAvailable Services:');
    console.log(`  - Authentication: ${env.API_PREFIX}/auth`);
    console.log(`  - File Upload: ${env.API_PREFIX}/upload`);
    console.log(`  - User Management: ${env.API_PREFIX}/users`);
    console.log(`  - Role Management: ${env.API_PREFIX}/roles`);
    console.log(`  - Permission Management: ${env.API_PREFIX}/permissions`);
    console.log(`  - Phone Numbers (WhatsApp): ${env.API_PREFIX}/phone-numbers`);
    console.log(`  - Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
    console.log(`  - MinIO: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
