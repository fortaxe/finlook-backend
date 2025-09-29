import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Course title is required').max(255, 'Title is too long'),
  description: z.string().min(1, 'Course description is required'),
  price: z.number().int().min(0, 'Price must be a positive number'), // Price in cents
  originalPrice: z.number().int().min(0, 'Original price must be a positive number').optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  category: z.string().min(1, 'Category is required').max(100, 'Category is too long'),
  thumbnail: z.string().url('Please provide a valid thumbnail URL'),
  videos: z.array(z.object({
    title: z.string().min(1, 'Video title is required').max(255, 'Title is too long'),
    description: z.string().optional(),
    videoUrl: z.string().url('Please provide a valid video URL'),
    duration: z.number().int().min(0, 'Duration must be a positive number').optional(),
    order: z.number().int().min(0, 'Order must be a positive number').default(0),
  })).optional().default([]),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1, 'Course title is required').max(255, 'Title is too long').optional(),
  description: z.string().min(1, 'Course description is required').optional(),
  price: z.number().int().min(0, 'Price must be a positive number').optional(),
  originalPrice: z.number().int().min(0, 'Original price must be a positive number').optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category is too long').optional(),
  thumbnail: z.string().url('Please provide a valid thumbnail URL').optional(),
  isActive: z.boolean().optional(),
  // Note: Videos are not included in update - use separate video endpoints for video management
});

export const courseIdSchema = z.object({
  id: z.string().uuid('Please provide a valid course ID'),
});

export const purchaseCourseSchema = z.object({
  courseId: z.string().uuid('Please provide a valid course ID'),
});

// Video validation schemas
export const createVideoSchema = z.object({
  title: z.string().min(1, 'Video title is required').max(255, 'Title is too long'),
  description: z.string().optional(),
  videoUrl: z.string().url('Please provide a valid video URL'),
  duration: z.number().int().min(0, 'Duration must be a positive number').optional(),
  order: z.number().int().min(0, 'Order must be a positive number').default(0),
});

export const updateVideoSchema = z.object({
  title: z.string().min(1, 'Video title is required').max(255, 'Title is too long').optional(),
  description: z.string().optional(),
  videoUrl: z.string().url('Please provide a valid video URL').optional(),
  duration: z.number().int().min(0, 'Duration must be a positive number').optional(),
  order: z.number().int().min(0, 'Order must be a positive number').optional(),
  isActive: z.boolean().optional(),
});

export const videoIdSchema = z.object({
  id: z.string().uuid('Please provide a valid video ID'),
});

export type CreateCourseRequest = z.infer<typeof createCourseSchema>;
export type UpdateCourseRequest = z.infer<typeof updateCourseSchema>;
export type CourseIdParams = z.infer<typeof courseIdSchema>;
export type PurchaseCourseRequest = z.infer<typeof purchaseCourseSchema>;
export type CreateVideoRequest = z.infer<typeof createVideoSchema>;
export type UpdateVideoRequest = z.infer<typeof updateVideoSchema>;
export type VideoIdParams = z.infer<typeof videoIdSchema>;
