import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name is too long'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username is too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please provide a valid email address'),
  mobileNumber: z.string()
    .length(10, 'Mobile number must be exactly 10 digits')
    .regex(/^[0-9]{10}$/, 'Mobile number must contain only digits'),
  isInfluencer: z.boolean().optional().default(false),
  influencerUrl: z.string().url('Please provide a valid URL').optional(),
});

// OTP-based authentication for users
export const sendOtpSchema = z.object({
  mobileNumber: z.string()
    .length(10, 'Mobile number must be exactly 10 digits')
    .regex(/^[0-9]{10}$/, 'Mobile number must contain only digits'),
});

export const verifyOtpSchema = z.object({
  mobileNumber: z.string()
    .length(10, 'Mobile number must be exactly 10 digits')
    .regex(/^[0-9]{10}$/, 'Mobile number must contain only digits'),
  otp: z.string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^[0-9]{6}$/, 'OTP must contain only digits'),
});

// Password-based authentication for admins
export const adminSignInSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Admin creation (with password)
export const createAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name is too long'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username is too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please provide a valid email address'),
  mobileNumber: z.string()
    .length(10, 'Mobile number must be exactly 10 digits')
    .regex(/^[0-9]{10}$/, 'Mobile number must contain only digits'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name is too long').optional(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username is too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  mobileNumber: z.string()
    .length(10, 'Mobile number must be exactly 10 digits')
    .regex(/^[0-9]{10}$/, 'Mobile number must contain only digits')
    .optional(),
  isInfluencer: z.boolean().optional(),
  influencerUrl: z.string().url('Please provide a valid URL').optional(),
  avatar: z.string().url('Please provide a valid avatar URL').optional(),
});

export type SignUpRequest = z.infer<typeof signUpSchema>;
export type SendOtpRequest = z.infer<typeof sendOtpSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;
export type AdminSignInRequest = z.infer<typeof adminSignInSchema>;
export type CreateAdminRequest = z.infer<typeof createAdminSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;