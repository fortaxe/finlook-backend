import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './base-controller.js';
import { AuthService } from '../services/auth-service.js';
import { 
  signUpSchema, 
  sendOtpSchema, 
  verifyOtpSchema, 
  adminSignInSchema,
  createAdminSchema,
  updateProfileSchema 
} from '../validations/auth-validation.js';
import { authRateLimitMiddleware } from '../middleware/security.js';

export class AuthController extends BaseController {
  /**
   * Sign up new user (no password required)
   */
  signUp = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData = this.validateBody(signUpSchema, req.body);
    const result = await AuthService.signUp(userData);
    
    this.sendSuccess(res, result, 'User registered successfully', 201);
  });

  /**
   * Send OTP to mobile number
   */
  sendOtp = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const otpData = this.validateBody(sendOtpSchema, req.body);
    const result = await AuthService.sendOtp(otpData);
    
    this.sendSuccess(res, result, result.message);
  });

  /**
   * Verify OTP and login user
   */
  verifyOtp = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const otpData = this.validateBody(verifyOtpSchema, req.body);
    const result = await AuthService.verifyOtpAndLogin(otpData);
    
    this.sendSuccess(res, result, 'OTP verified and user logged in successfully');
  });

  /**
   * Admin sign in with password
   */
  adminSignIn = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const credentials = this.validateBody(adminSignInSchema, req.body);
    const result = await AuthService.adminSignIn(credentials);
    
    this.sendSuccess(res, result, 'Admin signed in successfully');
  });

  /**
   * Create admin user (admin-only endpoint)
   */
  createAdmin = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const adminData = this.validateBody(createAdminSchema, req.body);
    const result = await AuthService.createAdmin(adminData);
    
    this.sendSuccess(res, result, 'Admin created successfully', 201);
  });

  /**
   * Get current user profile
   */
  getProfile = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const user = await AuthService.getUserById(userId);
    
    this.sendSuccess(res, { user }, 'Profile retrieved successfully');
  });

  /**
   * Update user profile
   */
  updateProfile = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const updateData = this.validateBody(updateProfileSchema, req.body);
    const user = await AuthService.updateProfile(userId, updateData);
    
    this.sendSuccess(res, { user }, 'Profile updated successfully');
  });

  /**
   * Apply auth rate limiting middleware
   */
  static applyRateLimit = authRateLimitMiddleware;
}
