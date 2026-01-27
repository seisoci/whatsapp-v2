import { Hono } from 'hono';
import { ApiEndpointControllerWithPermissions as ApiEndpointController } from '../controllers/api-endpoint.controller';
import { authMiddleware } from '../middlewares';

const apiEndpointRouter = new Hono();

// All routes require authentication
apiEndpointRouter.use('*', authMiddleware);

// Get all API endpoints (permission check in controller)
apiEndpointRouter.get('/', ApiEndpointController.index);

// Get single API endpoint (permission check in controller)
apiEndpointRouter.get('/:id', ApiEndpointController.show);

// Create API endpoint (permission check in controller)
apiEndpointRouter.post('/', ApiEndpointController.store);

// Update API endpoint (permission check in controller)
apiEndpointRouter.put('/:id', ApiEndpointController.update);

// Toggle status (permission check in controller)
apiEndpointRouter.patch('/:id/toggle-status', ApiEndpointController.toggleStatus);

// Delete API endpoint (permission check in controller)
apiEndpointRouter.delete('/:id', ApiEndpointController.destroy);

export default apiEndpointRouter;
