import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { CustomError } from '../middleware/error-handler.js';

export class UploadService {
  private static s3Client = new S3Client({
    region: env.R2_REGION,
    endpoint: env.R2_S3_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });

  /**
   * Generate presigned URL for upload
   */
  static async generatePresignedUrl(contentType: string, keyPrefix?: string): Promise<{
    url: string;
    key: string;
    publicUrl: string;
  }> {
    try {
      // Validate content type
      if (!UploadService.isValidContentType(contentType)) {
        throw new CustomError('Invalid content type. Only images are allowed.', 400);
      }

      // Generate unique key
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = UploadService.getFileExtension(contentType);
      const key = `${keyPrefix || 'uploads/'}${timestamp}-${randomString}${extension}`;

      // Create presigned URL
      const command = new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(UploadService.s3Client, command, {
        expiresIn: 60 * 5, // 5 minutes
      });

      // Generate public URL
      const publicUrl = env.R2_PUBLIC_BASE_URL
        ? `${env.R2_PUBLIC_BASE_URL}/${key}`
        : `${env.R2_S3_ENDPOINT.replace('https://', `https://${env.R2_BUCKET}.`)}/${key}`;

      return {
        url,
        key,
        publicUrl,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to generate presigned URL', 500);
    }
  }

  /**
   * Delete file from R2
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
      });

      await UploadService.s3Client.send(command);
    } catch (error) {
      console.error('Failed to delete file from R2:', error);
      // Don't throw error for delete operations to avoid breaking the main flow
    }
  }

  /**
   * Delete multiple files from R2
   */
  static async deleteFiles(keys: string[]): Promise<void> {
    const deletePromises = keys.map((key) => UploadService.deleteFile(key));
    await Promise.allSettled(deletePromises);
  }

  /**
   * Extract key from public URL
   */
  static extractKeyFromUrl(url: string): string | null {
    try {
      if (env.R2_PUBLIC_BASE_URL && url.startsWith(env.R2_PUBLIC_BASE_URL)) {
        return url.replace(`${env.R2_PUBLIC_BASE_URL}/`, '');
      }
      
      // Fallback: try to extract from S3 endpoint format
      const bucketUrl = env.R2_S3_ENDPOINT.replace('https://', `https://${env.R2_BUCKET}.`);
      if (url.startsWith(bucketUrl)) {
        return url.replace(`${bucketUrl}/`, '');
      }
      
      return null;
    } catch (error) {
      console.error('Failed to extract key from URL:', error);
      return null;
    }
  }

  /**
   * Extract keys from multiple URLs
   */
  static extractKeysFromUrls(urls: string[]): string[] {
    return urls
      .map((url) => UploadService.extractKeyFromUrl(url))
      .filter((key): key is string => key !== null);
  }

  /**
   * Validate content type
   */
  private static isValidContentType(contentType: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    return allowedTypes.includes(contentType.toLowerCase());
  }

  /**
   * Get file extension from content type
   */
  private static getFileExtension(contentType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    return extensions[contentType.toLowerCase()] || '.jpg';
  }
}
