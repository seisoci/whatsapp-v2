import { Hono } from 'hono';
import { MediaController } from '../controllers/media.controller';

const mediaRoutes = new Hono();

// Upload media file to WhatsApp API
mediaRoutes.post('/upload', MediaController.upload);

// Upload media file to S3/MinIO storage
mediaRoutes.post('/upload-s3', MediaController.uploadToS3);

// Generate fresh pre-signed URL for a stored media path
mediaRoutes.get('/presign', MediaController.presign);

export default mediaRoutes;
