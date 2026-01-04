import { Hono } from 'hono';
import { TemplateControllerWithPermissions as TemplateController } from '../controllers/template.controller';
import { authMiddleware } from '../middlewares';

const templateRouter = new Hono();

// All routes require authentication
templateRouter.use('*', authMiddleware);

// Get all templates (permission check in controller)
templateRouter.get('/', TemplateController.index);

// Get single template (permission check in controller)
templateRouter.get('/:id', TemplateController.show);

// Create template (permission check in controller)
templateRouter.post('/', TemplateController.store);

// Update template (permission check in controller)
templateRouter.put('/:id', TemplateController.update);

// Delete template (permission check in controller)
templateRouter.delete('/:id', TemplateController.destroy);

export default templateRouter;
