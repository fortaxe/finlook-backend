import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { users } from "../db/schema.js";
import { env } from "../config/env.js";
import { CustomError } from "../middleware/error-handler.js";
import { OtpService } from "./otp-service.js";
import type {
  SignUpRequest,
  SendOtpRequest,
  VerifyOtpRequest,
  AdminSignInRequest,
  CreateAdminRequest,
} from "../validations/auth-validation.js";

export class AuthService {
  /**
   * Hash password using bcrypt
   */
  private static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  private static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  private static generateToken(
    userId: string,
    email: string,
    role: string
  ): string {
    return jwt.sign({ userId, email, role }, env.JWT_SECRET);
  }

  /**
   * Register new user (OTP-based)
   */
  static async signUp(userData: SignUpRequest) {
    try {
      // Check if user already exists by email
      const existingUserByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existingUserByEmail.length > 0) {
        throw new CustomError("User with this email already exists", 409);
      }

      // Check if username already exists
      const existingUserByUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, userData.username))
        .limit(1);

      if (existingUserByUsername.length > 0) {
        throw new CustomError("Username is already taken", 409);
      }

      // Check if mobile number already exists
      const existingUserByMobile = await db
        .select()
        .from(users)
        .where(eq(users.mobileNumber, userData.mobileNumber))
        .limit(1);

      if (existingUserByMobile.length > 0) {
        throw new CustomError(
          "User with this mobile number already exists",
          409
        );
      }

      // Create user (no password for regular users)
      const newUser = await db
        .insert(users)
        .values({
          name: userData.name,
          username: userData.username,
          email: userData.email,
          mobileNumber: userData.mobileNumber,
          password: null,
          isInfluencer: userData.isInfluencer || false,
          influencerUrl: userData.influencerUrl,
          role: "user",
        })
        .returning({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          mobileNumber: users.mobileNumber,
          isInfluencer: users.isInfluencer,
          influencerUrl: users.influencerUrl,
          avatar: users.avatar,
          verified: users.verified,
          role: users.role,
          createdAt: users.createdAt,
        });

      const user = newUser[0];

      if (!user) {
        throw new CustomError("Failed to create user account", 500);
      }

      const token = AuthService.generateToken(user.id, user.email, user.role);

      // Send OTP
      const result = await OtpService.sendOtp(user.mobileNumber);

      return {
        user,
        token,
        result,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error instanceof Error
          ? error.message
          : "Failed to create user account",
        500
      );
    }
  }

  /**
   * Send OTP to mobile number
   */
  static async sendOtp(otpData: SendOtpRequest) {
    try {
      // Check if user exists with this mobile number
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.mobileNumber, otpData.mobileNumber))
        .limit(1);

      if (userResult.length === 0) {
        throw new CustomError("User not found with this mobile number", 404);
      }

      const user = userResult[0];

      if (!user) {
        throw new CustomError("User not found with this mobile number", 404);
      }

      // Only allow OTP for regular users, not admins
      if (user.role === "admin") {
        throw new CustomError("Admin users must use password-based login", 400);
      }

      // Send OTP
      const result = await OtpService.sendOtp(otpData.mobileNumber);
      return result;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error instanceof Error ? error.message : "Failed to send OTP",
        500
      );
    }
  }

  /**
   * Create admin user (with password)
   */
  static async createAdmin(adminData: CreateAdminRequest) {
    try {
      // Check if user already exists by email
      const existingUserByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, adminData.email))
        .limit(1);

      if (existingUserByEmail.length > 0) {
        throw new CustomError("User with this email already exists", 409);
      }

      // Check if username already exists
      const existingUserByUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, adminData.username))
        .limit(1);

      if (existingUserByUsername.length > 0) {
        throw new CustomError("Username is already taken", 409);
      }

      // Check if mobile number already exists
      const existingUserByMobile = await db
        .select()
        .from(users)
        .where(eq(users.mobileNumber, adminData.mobileNumber))
        .limit(1);

      if (existingUserByMobile.length > 0) {
        throw new CustomError(
          "User with this mobile number already exists",
          409
        );
      }

      // Hash password
      const hashedPassword = await AuthService.hashPassword(adminData.password);

      // Create admin user
      const newAdmin = await db
        .insert(users)
        .values({
          name: adminData.name,
          username: adminData.username,
          email: adminData.email,
          mobileNumber: adminData.mobileNumber,
          password: hashedPassword,
          role: "admin",
          isInfluencer: false,
        })
        .returning({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          mobileNumber: users.mobileNumber,
          role: users.role,
          createdAt: users.createdAt,
        });

      const admin = newAdmin[0];

      if (!admin) {
        throw new CustomError("Failed to create admin account", 500);
      }

      const token = AuthService.generateToken(
        admin.id,
        admin.email,
        admin.role
      );

      return {
        user: admin,
        token,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to create admin account", 500);
    }
  }

  /**
   * Verify OTP and login user
   */
  static async verifyOtpAndLogin(otpData: VerifyOtpRequest) {
    try {
      // Verify OTP first
      await OtpService.verifyOtp(otpData.mobileNumber, otpData.otp);

      // Find user by mobile number
      const userResult = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          mobileNumber: users.mobileNumber,
          isInfluencer: users.isInfluencer,
          influencerUrl: users.influencerUrl,
          avatar: users.avatar,
          verified: users.verified,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.mobileNumber, otpData.mobileNumber))
        .limit(1);

      if (userResult.length === 0) {
        throw new CustomError("User not found", 404);
      }

      const user = userResult[0];

      if (!user) {
        throw new CustomError("User not found", 404);
      }

      // Generate token
      const token = AuthService.generateToken(user.id, user.email, user.role);

      return {
        user,
        token,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to verify OTP and login", 500);
    }
  }

  /**
   * Admin login with password
   */
  static async adminSignIn(credentials: AdminSignInRequest) {
    try {
      // Find user by email
      const userResult = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          mobileNumber: users.mobileNumber,
          password: users.password,
          role: users.role,
          isInfluencer: users.isInfluencer,
          influencerUrl: users.influencerUrl,
          avatar: users.avatar,
          verified: users.verified,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.email, credentials.email))
        .limit(1);

      if (userResult.length === 0) {
        throw new CustomError("Invalid email or password", 401);
      }

      const user = userResult[0];

      if (!user) {
        throw new CustomError("User not found", 404);
      }

      // Check if user is admin
      if (user.role !== "admin") {
        throw new CustomError(
          "Access denied. Admin credentials required.",
          403
        );
      }

      // Check if password exists
      if (!user.password) {
        throw new CustomError("Invalid email or password", 401);
      }

      // Verify password
      const isPasswordValid = await AuthService.comparePassword(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new CustomError("Invalid email or password", 401);
      }

      // Generate token
      const token = AuthService.generateToken(user.id, user.email, user.role);

      // Return user without password
      const { password, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to sign in", 500);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    try {
      const userResult = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          mobileNumber: users.mobileNumber,
          isInfluencer: users.isInfluencer,
          influencerUrl: users.influencerUrl,
          avatar: users.avatar,
          verified: users.verified,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        throw new CustomError("User not found", 404);
      }

      return userResult[0];
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to get user", 500);
    }
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string) {
    try {
      return jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
      };
    } catch (error) {
      throw new CustomError("Invalid or expired token", 401);
    }
  }
}
