/**
 * Tag Routes
 * Endpoints for tag management
 */

import { Hono } from 'hono';
import { TagControllerWithPermissions as TagController } from '../controllers/tag.controller';
import { authMiddleware } from '../middlewares';

const tags = new Hono();

// Apply authentication to all routes
tags.use('/*', authMiddleware);

tags.get('/', TagController.getAll);
tags.post('/', TagController.create);
tags.delete('/:id', TagController.delete);

export default tags;
