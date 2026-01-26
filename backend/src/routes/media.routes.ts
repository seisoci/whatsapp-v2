import { Hono } from 'hono';
import { MediaController } from '../controllers/media.controller';

const mediaRoutes = new Hono();

// Upload media file
mediaRoutes.post('/upload', MediaController.upload);

export default mediaRoutes;
