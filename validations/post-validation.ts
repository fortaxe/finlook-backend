import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().max(2000, 'Post content is too long').optional(),
  images: z.array(z.string().url('Please provide valid image URLs')).max(4, 'Maximum 4 images allowed').optional(),
}).refine(
  (data) => data.content || (data.images && data.images.length > 0),
  {
    message: 'Post must have either content or images',
    path: ['content'],
  }
);

export const updatePostSchema = z.object({
  content: z.string().max(2000, 'Post content is too long').optional(),
  images: z.array(z.string().url('Please provide valid image URLs')).max(4, 'Maximum 4 images allowed').optional(),
}).refine(
  (data) => data.content || (data.images && data.images.length > 0),
  {
    message: 'Post must have either content or images',
    path: ['content'],
  }
);

export const createRetweetSchema = z.object({
  originalPostId: z.string().uuid('Please provide a valid post ID'),
  content: z.string().max(2000, 'Retweet content is too long').optional(),
  images: z.array(z.string().url('Please provide valid image URLs')).max(4, 'Maximum 4 images allowed').optional(),
});

export const createCommentSchema = z.object({
  content: z.string().max(1000, 'Comment content is too long').optional(),
  images: z.array(z.string().url('Please provide valid image URLs')).max(2, 'Maximum 2 images allowed for comments').optional(),
}).refine(
  (data) => data.content || (data.images && data.images.length > 0),
  {
    message: 'Comment must have either content or images',
    path: ['content'],
  }
);

export const updateCommentSchema = z.object({
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

export const postIdSchema = z.object({
  id: z.string().uuid('Please provide a valid post ID'),
});

export const commentIdSchema = z.object({
  id: z.string().uuid('Please provide a valid comment ID'),
});

export type CreatePostRequest = z.infer<typeof createPostSchema>;
export type UpdatePostRequest = z.infer<typeof updatePostSchema>;
export type CreateRetweetRequest = z.infer<typeof createRetweetSchema>;
export type CreateCommentRequest = z.infer<typeof createCommentSchema>;
export type UpdateCommentRequest = z.infer<typeof updateCommentSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type PostIdParams = z.infer<typeof postIdSchema>;
export type CommentIdParams = z.infer<typeof commentIdSchema>;
