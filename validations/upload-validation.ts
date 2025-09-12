import { z } from 'zod';

export const presignedUrlSchema = z.object({
  contentType: z.string()
    .refine(
      (type) => [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm'
      ].includes(type.toLowerCase()),
      'Only image and video files are allowed (JPEG, PNG, GIF, WebP, MP4, MOV, AVI, WebM)'
    ),
  keyPrefix: z.string()
    .regex(/^[a-zA-Z0-9\-_\/]+\/$/, 'Key prefix must end with / and contain only alphanumeric characters, hyphens, underscores, and slashes')
    .optional()
    .default('uploads/'),
});

export type PresignedUrlRequest = z.infer<typeof presignedUrlSchema>;
