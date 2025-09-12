import type { Request, Response } from 'express';
import { BaseController } from './base-controller.js';
import { UploadService } from '../services/upload-service.js';
import { presignedUrlSchema } from '../validations/upload-validation.js';
// import multer from 'multer';

// // Configure multer for memory storage
// const upload = multer({ 
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
// });

export class UploadController extends BaseController {
  /**
   * Generate presigned URL for file upload
   */
  generatePresignedUrl = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { contentType, keyPrefix } = this.validateBody(presignedUrlSchema, req.body);
    
    const result = await UploadService.generatePresignedUrl(contentType, keyPrefix);
    
    this.sendSuccess(res, result, 'Presigned URL generated successfully');
  });

  /**
   * Direct upload through backend (proxy method)
   */
  // directUpload = [
  //   upload.single('file'),
  //   this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
  //     if (!req.file) {
  //       throw new Error('No file provided');
  //     }

  //     const { contentType, keyPrefix } = req.body;
  //     const fileBuffer = req.file.buffer;

  //     const result = await UploadService.uploadDirect(fileBuffer, contentType || req.file.mimetype, keyPrefix);
      
  //     this.sendSuccess(res, result, 'File uploaded successfully');
  //   })
  // ];
}
