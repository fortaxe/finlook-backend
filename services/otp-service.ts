import { redisClient } from '../config/redis.js';
import { CustomError } from '../middleware/error-handler.js';

export class OtpService {
  private static readonly OTP_EXPIRY = 10 * 60; // 10 minutes in seconds
  private static readonly OTP_LENGTH = 6;

  /**
   * Generate a random 6-digit OTP
   */
  private static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get Redis key for OTP storage
   */
  private static getOtpKey(mobileNumber: string): string {
    return `otp:${mobileNumber}`;
  }

  /**
   * Get Redis key for OTP attempt tracking
   */
  private static getAttemptKey(mobileNumber: string): string {
    return `otp_attempts:${mobileNumber}`;
  }

  /**
   * Send OTP to mobile number
   */
  static async sendOtp(mobileNumber: string): Promise<{ success: boolean; message: string; otp: string }> {
    try {
      const otpKey = OtpService.getOtpKey(mobileNumber);
      const attemptKey = OtpService.getAttemptKey(mobileNumber);

      // Check if OTP was recently sent (rate limiting)
      const existingOtp = await redisClient.get(otpKey);
      if (existingOtp) {
        const ttl = await redisClient.ttl(otpKey);
        if (ttl > 8 * 60) { // If OTP was sent less than 2 minutes ago
          throw new CustomError('OTP was already sent. Please wait before requesting again.', 429);
        }
      }

      // Generate new OTP
      const otp = OtpService.generateOtp();

      // Store OTP in Redis with 10-minute expiry
      await redisClient.setEx(otpKey, OtpService.OTP_EXPIRY, otp);

      // Reset attempt counter
      await redisClient.del(attemptKey);

      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      // For now, log OTP to console (REMOVE IN PRODUCTION)
      console.log(`📱 OTP for ${mobileNumber}: ${otp}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        otp,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to send OTP', 500);
    }
  }

  /**
   * Verify OTP for mobile number
   */
  static async verifyOtp(mobileNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const otpKey = OtpService.getOtpKey(mobileNumber);
      const attemptKey = OtpService.getAttemptKey(mobileNumber);

      // Check attempt count
      const attempts = await redisClient.get(attemptKey);
      const attemptCount = attempts ? parseInt(attempts, 10) : 0;

      if (attemptCount >= 5) {
        // Delete OTP and block further attempts
        await redisClient.del(otpKey);
        await redisClient.setEx(attemptKey, 15 * 60, '5'); // Block for 15 minutes
        throw new CustomError('Too many failed attempts. Please request a new OTP.', 429);
      }

      // Get stored OTP
      const storedOtp = await redisClient.get(otpKey);
      if (!storedOtp) {
        throw new CustomError('OTP has expired or does not exist. Please request a new OTP.', 400);
      }

      // Verify OTP
      if (storedOtp !== otp) {
        // Increment attempt counter
        await redisClient.setEx(attemptKey, 15 * 60, (attemptCount + 1).toString());
        throw new CustomError('Invalid OTP. Please try again.', 400);
      }

      // OTP is valid - clean up
      await redisClient.del(otpKey);
      await redisClient.del(attemptKey);

      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to verify OTP', 500);
    }
  }

  /**
   * Check if OTP exists for mobile number
   */
  static async hasValidOtp(mobileNumber: string): Promise<boolean> {
    try {
      const otpKey = OtpService.getOtpKey(mobileNumber);
      const otp = await redisClient.get(otpKey);
      return !!otp;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get remaining time for OTP
   */
  static async getOtpTtl(mobileNumber: string): Promise<number> {
    try {
      const otpKey = OtpService.getOtpKey(mobileNumber);
      return await redisClient.ttl(otpKey);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clear OTP (for cleanup/testing)
   */
  static async clearOtp(mobileNumber: string): Promise<void> {
    try {
      const otpKey = OtpService.getOtpKey(mobileNumber);
      const attemptKey = OtpService.getAttemptKey(mobileNumber);
      
      await redisClient.del(otpKey);
      await redisClient.del(attemptKey);
    } catch (error) {
      console.error('Failed to clear OTP:', error);
    }
  }
}
