import { Hono } from 'hono';
import { MediaController } from '../controllers/media.controller';

const mediaRoutes = new Hono();

// Upload media file
mediaRoutes.post('/upload', MediaController.upload);

// Generate fresh pre-signed URL for a stored media path
mediaRoutes.get('/presign', MediaController.presign);

export default mediaRoutes;
