import { z } from 'zod';

export const createReelSchema = z.object({
  videoUrl: z.string().url('Please provide a valid video URL').min(1, 'Video URL is required'),
  content: z.string().max(2000, 'Reel content is too long').optional(),
  duration: z.number().min(1, 'Duration must be at least 1 second').max(300, 'Duration cannot exceed 5 minutes'),
});

export const updateReelSchema = z.object({
  content: z.string().max(2000, 'Reel content is too long').optional(),
});

export const createReelCommentSchema = z.object({
  content: z.string().max(1000, 'Comment content is too long').optional(),
  images: z.array(z.string().url('Please provide valid image URLs')).max(2, 'Maximum 2 images allowed for comments').optional(),
}).refine(
  (data) => data.content || (data.images && data.images.length > 0),
  {
    message: 'Comment must have either content or images',
    path: ['content'],
  }
);

export const updateReelCommentSchema = z.object({
  content: z.string().max(1000, 'Comment content is too long').optional(),
  images: z.array(z.string().url('Please provide valid image URLs')).max(2, 'Maximum 2 images allowed for comments').optional(),
}).refine(
  (data) => data.content || (data.images && data.images.length > 0),
  {
    message: 'Comment must have either content or images',
    path: ['content'],
  }
);

export const paginationSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

export const reelIdSchema = z.object({
  id: z.string().uuid('Please provide a valid reel ID'),
});

export const reelCommentIdSchema = z.object({
  id: z.string().uuid('Please provide a valid reel comment ID'),
});

export type CreateReelRequest = z.infer<typeof createReelSchema>;
export type UpdateReelRequest = z.infer<typeof updateReelSchema>;
export type CreateReelCommentRequest = z.infer<typeof createReelCommentSchema>;
export type UpdateReelCommentRequest = z.infer<typeof updateReelCommentSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type ReelIdParams = z.infer<typeof reelIdSchema>;
export type ReelCommentIdParams = z.infer<typeof reelCommentIdSchema>;
