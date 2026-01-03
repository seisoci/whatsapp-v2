import { Hono } from 'hono';
import { UploadController } from '../controllers/upload.controller';
import { authMiddleware } from '../middlewares';

const uploadRouter = new Hono();

// All upload routes require authentication
uploadRouter.use('*', authMiddleware);

// Upload routes
uploadRouter.post('/file', UploadController.uploadFile);
uploadRouter.post('/files', UploadController.uploadMultipleFiles);
uploadRouter.post('/avatar', UploadController.uploadAvatar);

// File management
uploadRouter.get('/file/:fileName', UploadController.getFileInfo);
uploadRouter.get('/download/:fileName', UploadController.downloadFile);
uploadRouter.delete('/file/:fileName', UploadController.deleteFile);
uploadRouter.get('/files', UploadController.listFiles);

export default uploadRouter;
