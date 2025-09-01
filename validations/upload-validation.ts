import { z } from 'zod';

export const presignedUrlSchema = z.object({
  contentType: z.string()
    .refine(
      (type) => [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
      ].includes(type.toLowerCase()),
      'Only image files are allowed (JPEG, PNG, GIF, WebP)'
    ),
  keyPrefix: z.string()
    .regex(/^[a-zA-Z0-9\-_\/]+\/$/, 'Key prefix must end with / and contain only alphanumeric characters, hyphens, underscores, and slashes')
    .optional()
    .default('uploads/'),
});

export type PresignedUrlRequest = z.infer<typeof presignedUrlSchema>;
