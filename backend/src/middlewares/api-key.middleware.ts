import { Context, Next } from 'hono';
import { AppDataSource } from '../config/database';
import { ApiEndpoint } from '../models/ApiEndpoint';

export const apiKeyMiddleware = async (c: Context, next: Next) => {
  try {
    const apiKey = c.req.header('X-API-Key');

    if (!apiKey) {
      return c.json(
        {
          success: false,
          message: 'API Key is required (X-API-Key header).',
        },
        401
      );
    }

    const apiEndpointRepo = AppDataSource.getRepository(ApiEndpoint);
    const apiEndpoint = await apiEndpointRepo.findOne({
      where: { apiKey, isActive: true },
      relations: ['creator'], // Load creator for user attribution
    });

    if (!apiEndpoint) {
      return c.json(
        {
          success: false,
          message: 'Invalid or inactive API Key.',
        },
        401
      );
    }

    // Attach API Endpoint info to context
    c.set('apiEndpoint', apiEndpoint);
    
    // Also set 'user' context for downstream compatibility (like MessageController)
    if (apiEndpoint.creator) {
        c.set('user', { userId: apiEndpoint.creator.id });
    }

    await next();
  } catch (error: any) {
    console.error('API Key Middleware Error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal Server Error during authentication.',
      },
      500
    );
  }
};
