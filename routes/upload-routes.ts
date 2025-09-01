import { Router } from 'express';
import { UploadController } from '../controller/upload-controller.js';
import authMiddleware from '../middleware/auth-middleware.js';

const router = Router();
const uploadController = new UploadController();

// Protected routes - require authentication
router.post('/presigned-url', authMiddleware(['user', 'admin']), uploadController.generatePresignedUrl);

export default router;
