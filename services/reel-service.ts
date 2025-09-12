import { eq, desc, and, sql, count } from 'drizzle-orm';
import { db } from '../config/database.js';
import { reels, users, reelComments, reelLikes } from '../db/schema.js';
import { CustomError } from '../middleware/error-handler.js';
import type {
  CreateReelRequest,
  UpdateReelRequest,
  CreateReelCommentRequest,
  UpdateReelCommentRequest,
  PaginationQuery,
} from '../validations/reel-validation.js';

export class ReelService {
  /**
   * Create a new reel
   */
  static async createReel(userId: string, reelData: CreateReelRequest) {
    try {
      console.log('reelData', reelData);
      const newReel = await db
        .insert(reels)
        .values({
          userId,
          videoUrl: reelData.videoUrl,
          content: reelData.content,
          duration: reelData.duration,
        })
        .returning();

      if (!Array.isArray(newReel) || newReel.length === 0 || !newReel[0]?.id) {
        throw new CustomError('Failed to create reel', 500);
      }
      return await ReelService.getReelById(newReel[0].id, userId);
     
    } catch (error) {
      console.log('error', error);
      throw new CustomError('Failed to create reel', 500);
    }
  }

  /**
   * Get reels with pagination
   */
  static async getReels(pagination: PaginationQuery, userId?: string) {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(reels);

      const total = totalResult[0]?.count || 0;

      // Build base query
      const baseQuery = db
        .select({
          id: reels.id,
          videoUrl: reels.videoUrl,
          content: reels.content,
          likes: reels.likes,
          shares: reels.shares,
          duration: reels.duration,
          createdAt: reels.createdAt,
          updatedAt: reels.updatedAt,
          author: {
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar,
            verified: users.verified,
          },
          commentsCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${reelComments} 
            WHERE ${reelComments.reelId} = ${reels.id}
          )`,
          isLiked: userId ? sql<boolean>`(
            SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END
            FROM ${reelLikes}
            WHERE ${reelLikes.reelId} = ${reels.id} AND ${reelLikes.userId} = ${userId}
          )` : sql<boolean>`false`,
        })
        .from(reels)
        .leftJoin(users, eq(reels.userId, users.id))
        .orderBy(desc(reels.createdAt))
        .limit(limit)
        .offset(offset);

      const result = await baseQuery;

      const paginationData = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };

      return {
        data: result,
        pagination: paginationData,
      };

    } catch (error) {
      console.log('error', error);
      throw new CustomError('Failed to fetch reels', 500);
    }
  }

  /**
   * Get reel by ID
   */
  static async getReelById(reelId: string, userId?: string) {
    try {
      const result = await db
        .select({
          id: reels.id,
          videoUrl: reels.videoUrl,
          content: reels.content,
          likes: reels.likes,
          shares: reels.shares,
          duration: reels.duration,
          createdAt: reels.createdAt,
          updatedAt: reels.updatedAt,
          author: {
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar,
            verified: users.verified,
          },
          commentsCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${reelComments} 
            WHERE ${reelComments.reelId} = ${reels.id}
          )`,
          isLiked: userId ? sql<boolean>`(
            SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END
            FROM ${reelLikes}
            WHERE ${reelLikes.reelId} = ${reels.id} AND ${reelLikes.userId} = ${userId}
          )` : sql<boolean>`false`,
        })
        .from(reels)
        .leftJoin(users, eq(reels.userId, users.id))
        .where(eq(reels.id, reelId))
        .limit(1);

      if (!result || result.length === 0) {
        throw new CustomError('Reel not found', 404);
      }

      return result[0];
    } catch (error) {
      console.log('error', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to fetch reel', 500);
    }
  }

  /**
   * Update reel
   */
  static async updateReel(reelId: string, userId: string, updateData: UpdateReelRequest) {
    try {
      // Check if reel exists and user owns it
      const existingReel = await db
        .select()
        .from(reels)
        .where(and(eq(reels.id, reelId), eq(reels.userId, userId)))
        .limit(1);

      if (!existingReel || existingReel.length === 0) {
        throw new CustomError('Reel not found or you are not authorized to update it', 404);
      }

      // Update the reel
      await db
        .update(reels)
        .set({
          content: updateData.content,
          updatedAt: new Date(),
        })
        .where(eq(reels.id, reelId));

      return await ReelService.getReelById(reelId, userId);
    } catch (error) {
      console.log('error', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update reel', 500);
    }
  }

  /**
   * Delete reel
   */
  static async deleteReel(reelId: string, userId: string) {
    try {
      // Check if reel exists and user owns it
      const existingReel = await db
        .select()
        .from(reels)
        .where(and(eq(reels.id, reelId), eq(reels.userId, userId)))
        .limit(1);

      if (!existingReel || existingReel.length === 0) {
        throw new CustomError('Reel not found or you are not authorized to delete it', 404);
      }

      // Delete the reel (this will cascade delete comments, likes, etc.)
      await db.delete(reels).where(eq(reels.id, reelId));

      return { success: true };
    } catch (error) {
      console.log('error', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete reel', 500);
    }
  }

  /**
   * Get reel comments
   */
  static async getReelComments(reelId: string, pagination: PaginationQuery, userId?: string) {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Check if reel exists
      const reel = await db
        .select()
        .from(reels)
        .where(eq(reels.id, reelId))
        .limit(1);

      if (!reel || reel.length === 0) {
        throw new CustomError('Reel not found', 404);
      }

      // Get total count of comments
      const totalResult = await db
        .select({ count: count() })
        .from(reelComments)
        .where(eq(reelComments.reelId, reelId));

      const total = totalResult[0]?.count || 0;

      // Get comments with user info and like status
      const comments = await db
        .select({
          id: reelComments.id,
          content: reelComments.content,
          images: reelComments.images,
          likes: reelComments.likes,
          createdAt: reelComments.createdAt,
          updatedAt: reelComments.updatedAt,
          author: {
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar,
            verified: users.verified,
          },
          isLiked: userId ? sql<boolean>`(
            SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END
            FROM ${reelLikes}
            WHERE ${reelLikes.reelCommentId} = ${reelComments.id} AND ${reelLikes.userId} = ${userId}
          )` : sql<boolean>`false`,
        })
        .from(reelComments)
        .leftJoin(users, eq(reelComments.userId, users.id))
        .where(eq(reelComments.reelId, reelId))
        .orderBy(desc(reelComments.createdAt))
        .limit(limit)
        .offset(offset);

      const paginationData = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };

      return {
        comments,
        pagination: paginationData,
      };

    } catch (error) {
      console.log('error', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to fetch reel comments', 500);
    }
  }

  /**
   * Create comment on reel
   */
  static async createReelComment(reelId: string, userId: string, commentData: CreateReelCommentRequest) {
    try {
      // Check if reel exists
      const reel = await db
        .select()
        .from(reels)
        .where(eq(reels.id, reelId))
        .limit(1);

      if (!reel || reel.length === 0) {
        throw new CustomError('Reel not found', 404);
      }

      // Create the comment
      const newComment = await db
        .insert(reelComments)
        .values({
          reelId,
          userId,
          content: commentData.content,
          images: commentData.images || [],
        })
        .returning();

      if (!Array.isArray(newComment) || newComment.length === 0 || !newComment[0]?.id) {
        throw new CustomError('Failed to create comment', 500);
      }

      return await ReelService.getReelCommentById(newComment[0].id, userId);
    } catch (error) {
      console.log('error', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create comment', 500);
    }
  }

  /**
   * Get reel comment by ID
   */
  static async getReelCommentById(commentId: string, userId?: string) {
    try {
      const result = await db
        .select({
          id: reelComments.id,
          content: reelComments.content,
          images: reelComments.images,
          likes: reelComments.likes,
          createdAt: reelComments.createdAt,
          updatedAt: reelComments.updatedAt,
          author: {
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar,
            verified: users.verified,
          },
          isLiked: userId ? sql<boolean>`(
            SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END
            FROM ${reelLikes}
            WHERE ${reelLikes.reelCommentId} = ${reelComments.id} AND ${reelLikes.userId} = ${userId}
          )` : sql<boolean>`false`,
        })
        .from(reelComments)
        .leftJoin(users, eq(reelComments.userId, users.id))
        .where(eq(reelComments.id, commentId))
        .limit(1);

      if (!result || result.length === 0) {
        throw new CustomError('Comment not found', 404);
      }

      return result[0];
    } catch (error) {
      console.log('error', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to fetch comment', 500);
    }
  }

  /**
   * Update reel comment
   */
  static async updateReelComment(commentId: string, userId: string, updateData: UpdateReelCommentRequest) {
    try {
      // Check if comment exists and user owns it
      const existingComment = await db
        .select()
        .from(reelComments)
        .where(and(eq(reelComments.id, commentId), eq(reelComments.userId, userId)))
        .limit(1);

      if (!existingComment || existingComment.length === 0) {
        throw new CustomError('Comment not found or you are not authorized to update it', 404);
      }

      // Update the comment
      await db
        .update(reelComments)
        .set({
          content: updateData.content,
          images: updateData.images,
          updatedAt: new Date(),
        })
        .where(eq(reelComments.id, commentId));

      return await ReelService.getReelCommentById(commentId, userId);
    } catch (error) {
      console.log('error', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update comment', 500);
    }
  }

  /**
   * Delete reel comment
   */
  static async deleteReelComment(commentId: string, userId: string) {
    try {
      // Check if comment exists and user owns it
      const existingComment = await db
        .select()
        .from(reelComments)
        .where(and(eq(reelComments.id, commentId), eq(reelComments.userId, userId)))
        .limit(1);

      if (!existingComment || existingComment.length === 0) {
        throw new CustomError('Comment not found or you are not authorized to delete it', 404);
      }

      // Delete the comment (this will cascade delete likes)
      await db.delete(reelComments).where(eq(reelComments.id, commentId));

      return { success: true };
    } catch (error) {
      console.log('error', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete comment', 500);
    }
  }

  /**
   * Toggle like on reel
   */
  static async toggleReelLike(reelId: string, userId: string) {
    try {
      // Check if reel exists
      const reel = await db
        .select()
        .from(reels)
        .where(eq(reels.id, reelId))
        .limit(1);

      if (!reel || reel.length === 0) {
        throw new CustomError('Reel not found', 404);
      }

      // Check if user already liked the reel
      const existingLike = await db
        .select()
        .from(reelLikes)
        .where(and(eq(reelLikes.reelId, reelId), eq(reelLikes.userId, userId)))
        .limit(1);

      if (existingLike && existingLike.length > 0) {
        // Unlike the reel
        await db
          .delete(reelLikes)
          .where(and(eq(reelLikes.reelId, reelId), eq(reelLikes.userId, userId)));

        await db
          .update(reels)
          .set({ likes: sql`${reels.likes} - 1` })
          .where(eq(reels.id, reelId));

        return { liked: false };
      } else {
        // Like the reel
        await db
          .insert(reelLikes)
          .values({ reelId, userId });

        await db
          .update(reels)
          .set({ likes: sql`${reels.likes} + 1` })
          .where(eq(reels.id, reelId));

        return { liked: true };
      }
    } catch (error) {
      console.log('error', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to toggle reel like', 500);
    }
  }

  /**
   * Toggle like on reel comment
   */
  static async toggleReelCommentLike(commentId: string, userId: string) {
    try {
      // Check if comment exists
      const comment = await db
        .select()
        .from(reelComments)
        .where(eq(reelComments.id, commentId))
        .limit(1);

      if (!comment || comment.length === 0) {
        throw new CustomError('Comment not found', 404);
      }

      // Check if user already liked the comment
      const existingLike = await db
        .select()
        .from(reelLikes)
        .where(and(eq(reelLikes.reelCommentId, commentId), eq(reelLikes.userId, userId)))
        .limit(1);

      if (existingLike && existingLike.length > 0) {
        // Unlike the comment
        await db
          .delete(reelLikes)
          .where(and(eq(reelLikes.reelCommentId, commentId), eq(reelLikes.userId, userId)));

        await db
          .update(reelComments)
          .set({ likes: sql`${reelComments.likes} - 1` })
          .where(eq(reelComments.id, commentId));

        return { liked: false };
      } else {
        // Like the comment
        await db
          .insert(reelLikes)
          .values({ reelCommentId: commentId, userId });

        await db
          .update(reelComments)
          .set({ likes: sql`${reelComments.likes} + 1` })
          .where(eq(reelComments.id, commentId));

        return { liked: true };
      }
    } catch (error) {
      console.log('error', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to toggle comment like', 500);
    }
  }
}
