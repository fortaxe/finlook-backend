import type { Request, Response } from 'express';
import { BaseController } from './base-controller.js';
import { UploadService } from '../services/upload-service.js';
import { presignedUrlSchema } from '../validations/upload-validation.js';

export class UploadController extends BaseController {
  /**
   * Generate presigned URL for file upload
   */
  generatePresignedUrl = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { contentType, keyPrefix } = this.validateBody(presignedUrlSchema, req.body);
    
    const result = await UploadService.generatePresignedUrl(contentType, keyPrefix);
    
    this.sendSuccess(res, result, 'Presigned URL generated successfully');
  });
}
