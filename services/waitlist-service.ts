import { db } from '../config/database.js';
import { users } from '../db/schema.js';
import { eq, and, sql, like, or, desc, asc, count } from 'drizzle-orm';
import { CustomError } from '../middleware/error-handler.js';
import type { UpdateWaitlistUserRequest, WaitlistQueryRequest } from '../validations/waitlist-validation.js';

export class WaitlistService {
  /**
   * Join the waitlist by creating a new user entry
   */
  async joinWaitlist(data: {
    name: string;
    phone: string;
    email: string;
  }) {
    try {
      // Check if user already exists with this email or phone
      const existingUser = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, data.email)
          )
        )
        .limit(1);

      if (existingUser.length > 0 || 
          (await db
            .select()
            .from(users)
            .where(eq(users.mobileNumber, data.phone))
            .limit(1)).length > 0) {
        // Return success structure but with duplicate message
        return {
          success: false,
          message: "You are already on the waitlist.",
          isDuplicate: true
        };
      }

      // Generate a unique username from name and timestamp
      const timestamp = Date.now();
      const cleanName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const username = `${cleanName}${timestamp}`.substring(0, 50);

      // Create new user entry for waitlist
      const newUser = await db
        .insert(users)
        .values({
          name: data.name,
          username: username,
          email: data.email,
          mobileNumber: data.phone,
          isWaitlisted: true,
          verified: false, // Not verified until they complete registration
          role: 'user',
          isInfluencer: false,
        })
        .returning();

      // Increment the global waitlist counter for all users
      await db
        .update(users)
        .set({ 
          waitlistCount: sql`${users.waitlistCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(users.isWaitlisted, true));

      const createdUser = newUser[0];
      if (!createdUser) {
        throw new CustomError('Failed to create user', 500);
      }

      return {
        success: true,
        message: "Successfully joined the waitlist!",
        data: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          phone: createdUser.mobileNumber,
          isWaitlisted: createdUser.isWaitlisted,
          createdAt: createdUser.createdAt,
        }
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      console.error('Error joining waitlist:', error);
      throw new CustomError('Failed to join waitlist', 500);
    }
  }

  /**
   * Get the count of waitlisted users
   */
  async getWaitlistCount() {
    try {
      const result = await db
        .select({ waitlistCount: users.waitlistCount })
        .from(users)
        .where(eq(users.isWaitlisted, true))
        .limit(1);

      return {
        count: result[0]?.waitlistCount || 562,
      };
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      throw new CustomError('Failed to get waitlist count', 500);
    }
  }

  /**
   * Get all waitlist users (Admin only)
   */

  async getWaitlistUsers(query: WaitlistQueryRequest) {
    try {
      const { search, verified, sortBy = 'createdAt', sortOrder = 'desc' } = query;

      // Build where conditions
      const whereConditions = [];
      
      // Only fetch users with 'user' role
      whereConditions.push(eq(users.role, 'user'));

      if (search) {
        whereConditions.push(
          or(
            like(users.name, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.mobileNumber, `%${search}%`)
          )
        );
      }

      if (verified !== undefined) {
        whereConditions.push(eq(users.verified, verified));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get users with sorting
      const sortColumn = users[sortBy];
      const orderBy = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

      const waitlistUsers = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          mobileNumber: users.mobileNumber,
          isWaitlisted: users.isWaitlisted,
          verified: users.verified,
          waitlistCount: users.waitlistCount,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(orderBy);

      return {
        users: waitlistUsers,
        total: waitlistUsers.length,
      };
    } catch (error) {
      console.error('Error getting waitlist users:', error);
      throw new CustomError('Failed to get waitlist users', 500);
    }
  }

  /**
   * Get a specific waitlist user by ID (Admin only)
   */
  async getWaitlistUserById(userId: string) {
    try {
      const user = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          mobileNumber: users.mobileNumber,
          isWaitlisted: users.isWaitlisted,
          verified: users.verified,
          waitlistCount: users.waitlistCount,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new CustomError('User not found', 404);
      }

      return user[0];
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      console.error('Error getting user by ID:', error);
      throw new CustomError('Failed to get user', 500);
    }
  }

  /**
   * Update a user (Admin only)
   */
  async updateWaitlistUser(userId: string, updateData: UpdateWaitlistUserRequest) {
    try {
      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        throw new CustomError('User not found', 404);
      }

      // Check for email uniqueness if email is being updated
      if (updateData.email) {
        const emailCheck = await db
          .select()
          .from(users)
          .where(and(eq(users.email, updateData.email), eq(users.id, userId)))
          .limit(1);

        if (emailCheck.length === 0) {
          // Email is different, check if it's already taken
          const existingEmail = await db
            .select()
            .from(users)
            .where(eq(users.email, updateData.email))
            .limit(1);

          if (existingEmail.length > 0) {
            throw new CustomError('Email is already taken', 409);
          }
        }
      }

      // Check for phone uniqueness if phone is being updated
      if (updateData.phone) {
        const phoneCheck = await db
          .select()
          .from(users)
          .where(and(eq(users.mobileNumber, updateData.phone), eq(users.id, userId)))
          .limit(1);

        if (phoneCheck.length === 0) {
          // Phone is different, check if it's already taken
          const existingPhone = await db
            .select()
            .from(users)
            .where(eq(users.mobileNumber, updateData.phone))
            .limit(1);

          if (existingPhone.length > 0) {
            throw new CustomError('Phone number is already taken', 409);
          }
        }
      }

      // Prepare update data
      const updateFields: any = {
        updatedAt: new Date(),
      };

      if (updateData.name) updateFields.name = updateData.name;
      if (updateData.email) updateFields.email = updateData.email;
      if (updateData.phone) updateFields.mobileNumber = updateData.phone;
      if (updateData.isWaitlisted !== undefined) updateFields.isWaitlisted = updateData.isWaitlisted;
      if (updateData.verified !== undefined) updateFields.verified = updateData.verified;
      if (updateData.waitlistCount !== undefined) updateFields.waitlistCount = updateData.waitlistCount;

      // Update user
      const updatedUser = await db
        .update(users)
        .set(updateFields)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          mobileNumber: users.mobileNumber,
          isWaitlisted: users.isWaitlisted,
          verified: users.verified,
          waitlistCount: users.waitlistCount,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });

      return updatedUser[0];
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      console.error('Error updating user:', error);
      throw new CustomError('Failed to update user', 500);
    }
  }

  /**
   * Delete a user (Admin only) - Hard delete from database
   */
  async deleteWaitlistUser(userId: string) {
    try {
      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        throw new CustomError('User not found', 404);
      }

      // Hard delete from database
      await db
        .delete(users)
        .where(eq(users.id, userId));

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      console.error('Error deleting user:', error);
      throw new CustomError('Failed to delete user', 500);
    }
  }
}
