import { z } from 'zod';

export const joinWaitlistSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name is too long'),
  phone: z.string()
    .length(10, 'Phone number must be exactly 10 digits')
    .regex(/^[0-9]{10}$/, 'Phone number must contain only digits'),
  email: z.string()
    .email('Please provide a valid email address')
    .max(255, 'Email is too long'),
});

// Admin CRUD validation schemas
export const updateWaitlistUserSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name is too long')
    .optional(),
  phone: z.string()
    .length(10, 'Phone number must be exactly 10 digits')
    .regex(/^[0-9]{10}$/, 'Phone number must contain only digits')
    .optional(),
  email: z.string()
    .email('Please provide a valid email address')
    .max(255, 'Email is too long')
    .optional(),
  isWaitlisted: z.boolean().optional(),
  verified: z.boolean().optional(),
  waitlistCount: z.number()
    .int('Waitlist count must be an integer')
    .min(0, 'Waitlist count cannot be negative')
    .optional(),
});

export const waitlistQuerySchema = z.object({
  search: z.string().optional(),
  verified: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'name', 'email', 'waitlistCount'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

export type JoinWaitlistRequest = z.infer<typeof joinWaitlistSchema>;
export type UpdateWaitlistUserRequest = z.infer<typeof updateWaitlistUserSchema>;
export type WaitlistQueryRequest = z.infer<typeof waitlistQuerySchema>;
