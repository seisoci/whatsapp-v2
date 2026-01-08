import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),

  // Database
  DB_HOST: z.string(),
  DB_PORT: z.string(),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_DATABASE: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security
  BCRYPT_ROUNDS: z.string().default('12'),
  MAX_LOGIN_ATTEMPTS: z.string().default('5'),
  LOCK_TIME: z.string().default('15'),

  // Rate Limiting - Auth Endpoints (login/register)
  AUTH_RATE_LIMIT_WINDOW: z.string().default('15'),
  AUTH_RATE_LIMIT_MAX: z.string().default('20'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // WhatsApp Cloud API
  WHATSAPP_API_VERSION: z.string().default('v21.0'),
});

export const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

export const env = validateEnv();
