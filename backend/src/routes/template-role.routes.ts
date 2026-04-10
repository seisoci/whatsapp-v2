import { Hono } from 'hono';
import { TemplateRoleControllerWithPermissions as TemplateRoleController } from '../controllers/template-role.controller';
import { authMiddleware } from '../middlewares';

const templateRoleRouter = new Hono();

templateRoleRouter.use('*', authMiddleware);

// Get all template role access records (grouped by template)
templateRoleRouter.get('/', TemplateRoleController.index);

// Get roles for a specific template (?phoneNumberDbId=)
templateRoleRouter.get('/:templateId', TemplateRoleController.getByTemplate);

// Set (replace) roles for a template
templateRoleRouter.put('/:templateId', TemplateRoleController.assign);

// Remove all role access for a template (?phoneNumberDbId=)
templateRoleRouter.delete('/:templateId', TemplateRoleController.destroy);

export default templateRoleRouter;
