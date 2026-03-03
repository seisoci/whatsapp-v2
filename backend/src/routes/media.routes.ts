import { Hono } from 'hono';
import { MediaController } from '../controllers/media.controller';
import { authMiddleware } from '../middlewares';

const mediaRoutes = new Hono();

// Apply auth middleware to all media routes
mediaRoutes.use('*', authMiddleware);

// Upload media file to WhatsApp API
mediaRoutes.post('/upload', MediaController.upload);

// Upload media file to S3/MinIO storage
mediaRoutes.post('/upload-s3', MediaController.uploadToS3);

export default mediaRoutes;
