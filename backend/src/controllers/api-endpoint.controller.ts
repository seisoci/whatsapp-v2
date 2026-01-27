import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { ApiEndpoint } from '../models/ApiEndpoint';
import { withPermissions } from '../utils/controller.decorator';
import { z } from 'zod';

// Validation schemas
const createApiEndpointSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  webhookUrl: z.string().url('Invalid webhook URL').max(500),
  apiKey: z.string().max(255).optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateApiEndpointSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  webhookUrl: z.string().url('Invalid webhook URL').max(500).optional(),
  apiKey: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
});

class ApiEndpointController {
  static permissions = {
    index: 'api-endpoint-index',
    show: 'api-endpoint-index',
    store: 'api-endpoint-store',
    update: 'api-endpoint-update',
    destroy: 'api-endpoint-destroy',
  };

  // Get all API endpoints
  static async index(c: Context) {
    try {
      const apiEndpointRepo = AppDataSource.getRepository(ApiEndpoint);

      const apiEndpoints = await apiEndpointRepo.find({
        order: { createdAt: 'DESC' },
        relations: ['creator'],
      });

      return c.json({
        success: true,
        data: apiEndpoints.map((endpoint) => ({
          id: endpoint.id,
          name: endpoint.name,
          description: endpoint.description,
          webhookUrl: endpoint.webhookUrl,
          apiKey: endpoint.apiKey,
          isActive: endpoint.isActive,
          createdBy: endpoint.createdBy,
          creatorName: endpoint.creator?.username || null,
          createdAt: endpoint.createdAt,
          updatedAt: endpoint.updatedAt,
        })),
      });
    } catch (error: any) {
      console.error('Error fetching API endpoints:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to fetch API endpoints',
          error: error.message,
        },
        500
      );
    }
  }

  // Get single API endpoint by ID
  static async show(c: Context) {
    try {
      const id = c.req.param('id');
      const apiEndpointRepo = AppDataSource.getRepository(ApiEndpoint);

      const endpoint = await apiEndpointRepo.findOne({
        where: { id },
        relations: ['creator'],
      });

      if (!endpoint) {
        return c.json(
          {
            success: false,
            message: 'API endpoint not found',
          },
          404
        );
      }

      return c.json({
        success: true,
        data: {
          id: endpoint.id,
          name: endpoint.name,
          description: endpoint.description,
          webhookUrl: endpoint.webhookUrl,
          apiKey: endpoint.apiKey,
          isActive: endpoint.isActive,
          createdBy: endpoint.createdBy,
          creatorName: endpoint.creator?.username || null,
          createdAt: endpoint.createdAt,
          updatedAt: endpoint.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error fetching API endpoint:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to fetch API endpoint',
          error: error.message,
        },
        500
      );
    }
  }

  // Create new API endpoint
  static async store(c: Context) {
    try {
      const body = await c.req.json();
      const validation = createApiEndpointSchema.safeParse(body);

      if (!validation.success) {
        return c.json(
          {
            success: false,
            message: 'Validation error',
            errors: validation.error.flatten().fieldErrors,
          },
          400
        );
      }

      const { name, description, webhookUrl, apiKey, isActive } = validation.data;
      const user = c.get('user');

      const apiEndpointRepo = AppDataSource.getRepository(ApiEndpoint);

      const newEndpoint = apiEndpointRepo.create({
        name,
        description: description || null,
        webhookUrl,
        apiKey: apiKey || null,
        isActive,
        createdBy: user?.id || null,
      });

      await apiEndpointRepo.save(newEndpoint);

      return c.json(
        {
          success: true,
          message: 'API endpoint created successfully',
          data: {
            id: newEndpoint.id,
            name: newEndpoint.name,
            description: newEndpoint.description,
            webhookUrl: newEndpoint.webhookUrl,
            apiKey: newEndpoint.apiKey,
            isActive: newEndpoint.isActive,
            createdAt: newEndpoint.createdAt,
            updatedAt: newEndpoint.updatedAt,
          },
        },
        201
      );
    } catch (error: any) {
      console.error('Error creating API endpoint:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to create API endpoint',
          error: error.message,
        },
        500
      );
    }
  }

  // Update API endpoint
  static async update(c: Context) {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const validation = updateApiEndpointSchema.safeParse(body);

      if (!validation.success) {
        return c.json(
          {
            success: false,
            message: 'Validation error',
            errors: validation.error.flatten().fieldErrors,
          },
          400
        );
      }

      const apiEndpointRepo = AppDataSource.getRepository(ApiEndpoint);
      const endpoint = await apiEndpointRepo.findOne({ where: { id } });

      if (!endpoint) {
        return c.json(
          {
            success: false,
            message: 'API endpoint not found',
          },
          404
        );
      }

      const { name, description, webhookUrl, apiKey, isActive } = validation.data;

      if (name !== undefined) endpoint.name = name;
      if (description !== undefined) endpoint.description = description;
      if (webhookUrl !== undefined) endpoint.webhookUrl = webhookUrl;
      if (apiKey !== undefined) endpoint.apiKey = apiKey;
      if (isActive !== undefined) endpoint.isActive = isActive;

      await apiEndpointRepo.save(endpoint);

      return c.json({
        success: true,
        message: 'API endpoint updated successfully',
        data: {
          id: endpoint.id,
          name: endpoint.name,
          description: endpoint.description,
          webhookUrl: endpoint.webhookUrl,
          apiKey: endpoint.apiKey,
          isActive: endpoint.isActive,
          createdAt: endpoint.createdAt,
          updatedAt: endpoint.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error updating API endpoint:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to update API endpoint',
          error: error.message,
        },
        500
      );
    }
  }

  // Delete API endpoint
  static async destroy(c: Context) {
    try {
      const id = c.req.param('id');
      const apiEndpointRepo = AppDataSource.getRepository(ApiEndpoint);

      const endpoint = await apiEndpointRepo.findOne({ where: { id } });

      if (!endpoint) {
        return c.json(
          {
            success: false,
            message: 'API endpoint not found',
          },
          404
        );
      }

      await apiEndpointRepo.remove(endpoint);

      return c.json({
        success: true,
        message: 'API endpoint deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting API endpoint:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to delete API endpoint',
          error: error.message,
        },
        500
      );
    }
  }

  // Toggle status
  static async toggleStatus(c: Context) {
    try {
      const id = c.req.param('id');
      const apiEndpointRepo = AppDataSource.getRepository(ApiEndpoint);

      const endpoint = await apiEndpointRepo.findOne({ where: { id } });

      if (!endpoint) {
        return c.json(
          {
            success: false,
            message: 'API endpoint not found',
          },
          404
        );
      }

      endpoint.isActive = !endpoint.isActive;
      await apiEndpointRepo.save(endpoint);

      return c.json({
        success: true,
        message: `API endpoint ${endpoint.isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          id: endpoint.id,
          name: endpoint.name,
          isActive: endpoint.isActive,
        },
      });
    } catch (error: any) {
      console.error('Error toggling API endpoint status:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to toggle API endpoint status',
          error: error.message,
        },
        500
      );
    }
  }
}

// Export wrapped controller with permission checks
export const ApiEndpointControllerWithPermissions = withPermissions(
  ApiEndpointController,
  ApiEndpointController.permissions
);

export { ApiEndpointController };
