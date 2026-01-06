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
import webhookRouter from './routes/webhook.routes';
import chatRouter from './routes/chat.routes';
import { handleWebSocketUpgrade } from './routes/websocket.routes';
import { chatWebSocketManager } from './services/chat-websocket.service';
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

// Health check
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// WebSocket route
app.get('/ws/chat', handleWebSocketUpgrade);

// API routes
app.route(`${env.API_PREFIX}/auth`, authRouter);
app.route(`${env.API_PREFIX}/upload`, uploadRouter);
app.route(`${env.API_PREFIX}/roles`, roleRouter);
app.route(`${env.API_PREFIX}/permissions`, permissionRouter);
app.route(`${env.API_PREFIX}/users`, userRouter);
app.route(`${env.API_PREFIX}/phone-numbers`, phoneNumberRouter);
app.route(`${env.API_PREFIX}/templates`, templateRouter);
app.route(`${env.API_PREFIX}/webhooks`, webhookRouter);
app.route(`${env.API_PREFIX}/chat`, chatRouter);


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

    // Start server with WebSocket support
    const port = parseInt(env.PORT);

    const server = Bun.serve({
      fetch(req, server) {
        // Store server reference in request for upgrade
        const url = new URL(req.url);

        // Handle WebSocket upgrade for /ws/chat
        if (url.pathname === '/ws/chat' && req.headers.get('upgrade') === 'websocket') {
          const upgraded = server.upgrade(req, {
            data: { request: req },
          });

          if (upgraded) {
            return undefined; // Connection upgraded
          }

          return new Response('WebSocket upgrade failed', { status: 500 });
        }

        // Regular HTTP requests go to Hono
        return app.fetch(req, { server });
      },
      port,
      websocket: {
        message: (ws, message) => {
          // Delegate to ChatWebSocketManager
          chatWebSocketManager.onMessage(ws, message);
        },
        open: (ws) => {
          // Delegate to ChatWebSocketManager with the stored request
          const request = ws.data?.request || new Request(`ws://localhost:${port}/ws/chat`);
          chatWebSocketManager.handleConnection(ws, request);
        },
        close: (ws, code, reason) => {
          // Close event is handled by listeners in ChatWebSocketManager
          chatWebSocketManager.onClose(ws);
        },
      },
    });

    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`🔌 WebSocket endpoint: ws://localhost:${port}/ws/chat`);
    console.log(`📝 API Documentation: http://localhost:${port}${env.API_PREFIX}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log('\nAvailable Services:');
    console.log(`  - Authentication: ${env.API_PREFIX}/auth`);
    console.log(`  - File Upload: ${env.API_PREFIX}/upload`);
    console.log(`  - User Management: ${env.API_PREFIX}/users`);
    console.log(`  - Role Management: ${env.API_PREFIX}/roles`);
    console.log(`  - Permission Management: ${env.API_PREFIX}/permissions`);
    console.log(`  - Phone Numbers (WhatsApp): ${env.API_PREFIX}/phone-numbers`);
    console.log(`  - Chat WebSocket: ws://localhost:${port}/ws/chat`);
    console.log(`  - Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
    console.log(`  - MinIO: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
