import { eq, desc,  and, sql, count } from 'drizzle-orm';
import { db } from '../config/database.js';
import { posts, users, comments, likes, bookmarks } from '../db/schema.js';
import { CustomError } from '../middleware/error-handler.js';
import { UploadService } from './upload-service.js';
import type {
  CreatePostRequest,
  UpdatePostRequest,
  CreateRetweetRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  PaginationQuery,
} from '../validations/post-validation.js';

export class PostService {
  /**
   * Create a new post
   */
  static async createPost(userId: string, postData: CreatePostRequest) {
    try {
      const newPost = await db
        .insert(posts)
        .values({
          userId,
          content: postData.content,
          images: postData.images || [],
          isRetweet: false,
        })
        .returning();

      if (!Array.isArray(newPost) || newPost.length === 0 || !newPost[0]?.id) {
        throw new CustomError('Failed to create post', 500);
      }
      return await PostService.getPostById(newPost[0].id);
     
    } catch (error) {
      console.log('error', error);
      throw new CustomError('Failed to create post', 500);
    }
  }

  /**
   * Create a retweet
   */
  static async createRetweet(userId: string, retweetData: CreateRetweetRequest) {
    try {
      // Check if original post exists and is not already a retweet
      const originalPost = await db
        .select()
        .from(posts)
        .where(eq(posts.id, retweetData.originalPostId))
        .limit(1);

      if (originalPost.length === 0) {
        throw new CustomError('Original post not found', 404);
      }

      if (!Array.isArray(originalPost) || originalPost.length === 0 || !originalPost[0]?.id) {
        throw new CustomError('Original post not found', 404);
      }

      if  (originalPost[0].isRetweet) {
        throw new CustomError('Cannot retweet a retweet', 400);
      }

      // Check if user already retweeted this post
      const existingRetweet = await db
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.userId, userId),
            eq(posts.originalPostId, retweetData.originalPostId),
            eq(posts.isRetweet, true)
          )
        )
        .limit(1);

      if (existingRetweet.length > 0) {
        throw new CustomError('You have already retweeted this post', 409);
      }

      const newRetweet = await db
        .insert(posts)
        .values({
          userId,
          content: retweetData.content,
          images: retweetData.images || [],
          isRetweet: true,
          originalPostId: retweetData.originalPostId,
        })
        .returning();

      // Update shares count on original post
      await db
        .update(posts)
        .set({
          shares: sql`${posts.shares} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, retweetData.originalPostId));

        if (!Array.isArray(newRetweet) || newRetweet.length === 0 || !newRetweet[0]?.id) {
          throw new CustomError('Failed to create retweet', 500);
        }

      return await PostService.getPostById(newRetweet[0].id);
    } catch (error) {
      console.log('error', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create retweet', 500);
    }
  }

  /**
   * Get posts with pagination
   */
  static async getPosts(pagination: PaginationQuery, userId?: string) {
    try {
      const offset = (pagination.page - 1) * pagination.limit;

      const postsResult = await db
        .select({
          id: posts.id,
          content: posts.content,
          images: posts.images,
          likes: posts.likes,
          shares: posts.shares,
          bookmarks: posts.bookmarks,
          isRetweet: posts.isRetweet,
          originalPostId: posts.originalPostId,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          user: {
            id: users.id,
            name: users.name,
            username: users.username,
            email: users.email,
            mobileNumber: users.mobileNumber,
            isInfluencer: users.isInfluencer,
            influencerUrl: users.influencerUrl,
            avatar: users.avatar,
            verified: users.verified,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .orderBy(desc(posts.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(posts);

      const total = totalResult[0]?.count || 0;

      // Get comments for each post and check user interactions
      const postsWithDetails = await Promise.all(
        postsResult.map(async (post) => {
          const postComments = await PostService.getPostComments(post.id, { page: 1, limit: 5 }, userId);
          
          let isLiked = false;
          let isBookmarked = false;
          
          // Check if user has liked this post
          if (userId) {
            const userLike = await db
              .select()
              .from(likes)
              .where(and(eq(likes.postId, post.id), eq(likes.userId, userId)))
              .limit(1);
            isLiked = userLike.length > 0;
            
            // Check if user has bookmarked this post
            const userBookmark = await db
              .select()
              .from(bookmarks)
              .where(and(eq(bookmarks.postId, post.id), eq(bookmarks.userId, userId)))
              .limit(1);
            isBookmarked = userBookmark.length > 0;
          }
          
          // Check if user has retweeted this post
          let isRetweeted = false;
          if (userId) {
            const userRetweet = await db
              .select()
              .from(posts)
              .where(
                and(
                  eq(posts.userId, userId),
                  eq(posts.originalPostId, post.id),
                  eq(posts.isRetweet, true)
                )
              )
              .limit(1);
            isRetweeted = userRetweet.length > 0;
          }
          
          // Get original post data if this is a retweet
          let originalPost = null;
          if (post.isRetweet && post.originalPostId) {
            try {
              const originalPostResult = await PostService.getPostById(post.originalPostId);
              originalPost = originalPostResult;
            } catch (error) {
              console.log(`Original post ${post.originalPostId} not found for retweet ${post.id}`);
              // Continue without original post data
            }
          }
          
          return {
            ...post,
            comments: postComments.comments,
            isLiked,
            isBookmarked,
            isRetweeted,
            originalPost,
          };
        })
      );

      return {
        data: postsWithDetails,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    } catch (error) {
      console.log('Error in getPosts:', error);
      throw new CustomError('Failed to get posts', 500);
    }
  }

  /**
   * Get post by ID
   */
  static async getPostById(postId: string) {
    try {
      const postResult = await db
        .select({
          id: posts.id,
          content: posts.content,
          images: posts.images,
          likes: posts.likes,
          shares: posts.shares,
          bookmarks: posts.bookmarks,
          isRetweet: posts.isRetweet,
          originalPostId: posts.originalPostId,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          user: {
            id: users.id,
            name: users.name,
            username: users.username,
            email: users.email,
            mobileNumber: users.mobileNumber,
            isInfluencer: users.isInfluencer,
            influencerUrl: users.influencerUrl,
            avatar: users.avatar,
            verified: users.verified,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.id, postId))
        .limit(1);

      if (postResult.length === 0) {
        throw new CustomError('Post not found', 404);
      }

      const post = postResult[0];

      // Get comments
      const postComments = await PostService.getPostComments(postId, { page: 1, limit: 10 });

      // Get original post data if this is a retweet (without deep recursion)
      let originalPost = null;

      if (!post) {
        throw new CustomError('Post not found', 404);
      }

      if (post.isRetweet && post.originalPostId) {
        try {
          const originalPostResult = await db
            .select({
              id: posts.id,
              content: posts.content,
              images: posts.images,
              likes: posts.likes,
              shares: posts.shares,
              bookmarks: posts.bookmarks,
              isRetweet: posts.isRetweet,
              originalPostId: posts.originalPostId,
              createdAt: posts.createdAt,
              updatedAt: posts.updatedAt,
              userId: posts.userId,
            })
            .from(posts)
            .where(eq(posts.id, post.originalPostId))
            .limit(1);
            
          if (originalPostResult.length > 0) {
            const originalPostData = originalPostResult[0];
            
            if (originalPostData) {
              // Get user data for original post
              const originalUserResult = await db
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
                })
                .from(users)
                .where(eq(users.id, originalPostData.userId))
                .limit(1);
                
              if (originalUserResult.length > 0) {
                originalPost = {
                  ...originalPostData,
                  user: originalUserResult[0],
                  comments: [], // Don't fetch comments for original post to avoid deep nesting
                };
              }
            }
          }
        } catch (error) {
          console.log(`Original post ${post.originalPostId} not found for retweet ${post.id}`);
          // Continue without original post data
        }
      }

      return {
        ...post,
        comments: postComments.comments,
        originalPost,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to get post', 500);
    }
  }

  /**
   * Update post
   */
  static async updatePost(postId: string, userId: string, updateData: UpdatePostRequest) {
    try {
      // Check if post exists and belongs to user
      const existingPost = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (existingPost.length === 0) {
        throw new CustomError('Post not found', 404);
      }

      const post = existingPost[0]!;
      if (post.userId !== userId) {
        throw new CustomError('You can only update your own posts', 403);
      }

      await db
        .update(posts)
        .set({
          content: updateData.content,
          images: updateData.images || [],
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      return await PostService.getPostById(postId);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update post', 500);
    }
  }

  /**
   * Delete post
   */
  static async deletePost(postId: string, userId: string) {
    try {
      // Check if post exists and belongs to user
      const existingPost = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (existingPost.length === 0) {
        throw new CustomError('Post not found', 404);
      }

      const post = existingPost[0]!;
      if (post.userId !== userId) {
        throw new CustomError('You can only delete your own posts', 403);
      }

      // Delete images from R2 if they exist
      if (post.images && post.images.length > 0) {
        const imageKeys = UploadService.extractKeysFromUrls(post.images as string[]);
        await UploadService.deleteFiles(imageKeys);
      }

      // Delete post (cascading will handle comments, likes, bookmarks)
      await db.delete(posts).where(eq(posts.id, postId));

      return true;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete post', 500);
    }
  }

  /**
   * Get post comments
   */
  static async getPostComments(postId: string, pagination: PaginationQuery, userId?: string) {
    try {
      const offset = (pagination.page - 1) * pagination.limit;

      const commentsResult = await db
        .select({
          id: comments.id,
          content: comments.content,
          images: comments.images,
          likes: comments.likes,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          user: {
            id: users.id,
            name: users.name,
            username: users.username,
            email: users.email,
            mobileNumber: users.mobileNumber,
            isInfluencer: users.isInfluencer,
            influencerUrl: users.influencerUrl,
            avatar: users.avatar,
            verified: users.verified,
          },
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.postId, postId));

      const total = totalResult[0]?.count || 0;

      // Add user interaction states to comments
      const commentsWithUserStates = await Promise.all(
        commentsResult.map(async (comment) => {
          let isLiked = false;
          
          // Check if user has liked this comment
          if (userId) {
            const userLike = await db
              .select()
              .from(likes)
              .where(and(eq(likes.commentId, comment.id), eq(likes.userId, userId)))
              .limit(1);
            isLiked = userLike.length > 0;
          }
          
          return {
            ...comment,
            likesCount: comment.likes || 0,
            isLiked,
          };
        })
      );

      return {
        comments: commentsWithUserStates,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    } catch (error) {
      throw new CustomError('Failed to get comments', 500);
    }
  }

  /**
   * Create comment
   */
  static async createComment(postId: string, userId: string, commentData: CreateCommentRequest) {
    try {
      // Check if post exists
      const existingPost = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (existingPost.length === 0) {
        throw new CustomError('Post not found', 404);
      }

      const newComment = await db
        .insert(comments)
        .values({
          postId,
          userId,
          content: commentData.content,
          images: commentData.images || [],
        })
        .returning();

      return await PostService.getCommentById(newComment[0]!.id);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create comment', 500);
    }
  }

  /**
   * Get comment by ID
   */
  static async getCommentById(commentId: string) {
    try {
      const commentResult = await db
        .select({
          id: comments.id,
          postId: comments.postId,
          content: comments.content,
          images: comments.images,
          likes: comments.likes,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          user: {
            id: users.id,
            name: users.name,
            username: users.username,
            email: users.email,
            mobileNumber: users.mobileNumber,
            isInfluencer: users.isInfluencer,
            influencerUrl: users.influencerUrl,
            avatar: users.avatar,
            verified: users.verified,
          },
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.id, commentId))
        .limit(1);

      if (commentResult.length === 0) {
        throw new CustomError('Comment not found', 404);
      }

      return commentResult[0];
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to get comment', 500);
    }
  }

  /**
   * Update comment
   */
  static async updateComment(commentId: string, userId: string, updateData: UpdateCommentRequest) {
    try {
      // Check if comment exists and belongs to user
      const existingComment = await db
        .select()
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);

      if (existingComment.length === 0) {
        throw new CustomError('Comment not found', 404);
      }

      const comment = existingComment[0]!;
      if (comment.userId !== userId) {
        throw new CustomError('You can only update your own comments', 403);
      }

      await db
        .update(comments)
        .set({
          content: updateData.content,
          images: updateData.images || [],
          updatedAt: new Date(),
        })
        .where(eq(comments.id, commentId));

      return await PostService.getCommentById(commentId);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update comment', 500);
    }
  }

  /**
   * Delete comment
   */
  static async deleteComment(commentId: string, userId: string) {
    try {
      // Check if comment exists and belongs to user
      const existingComment = await db
        .select()
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);

      if (existingComment.length === 0) {
        throw new CustomError('Comment not found', 404);
      }

      const comment = existingComment[0]!;
      if (comment.userId !== userId) {
        throw new CustomError('You can only delete your own comments', 403);
      }

      // Delete images from R2 if they exist
      if (comment.images && comment.images.length > 0) {
        const imageKeys = UploadService.extractKeysFromUrls(comment.images as string[]);
        await UploadService.deleteFiles(imageKeys);
      }

      // Delete comment
      await db.delete(comments).where(eq(comments.id, commentId));

      return true;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete comment', 500);
    }
  }

  /**
   * Toggle like on post
   */
  static async togglePostLike(postId: string, userId: string) {
    try {
      // Check if post exists
      const existingPost = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (existingPost.length === 0) {
        throw new CustomError('Post not found', 404);
      }

      // Check if user already liked the post
      const existingLike = await db
        .select()
        .from(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
        .limit(1);

      if (existingLike.length > 0) {
        // Unlike
        await db
          .delete(likes)
          .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

        await db
          .update(posts)
          .set({
            likes: sql`${posts.likes} - 1`,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, postId));

        const updatedPost = await db
          .select({ likes: posts.likes })
          .from(posts)
          .where(eq(posts.id, postId))
          .limit(1);

        return { 
          liked: false, 
          likesCount: updatedPost[0]?.likes || 0 
        };
      } else {
        // Like
        await db.insert(likes).values({
          postId,
          userId,
        });

        await db
          .update(posts)
          .set({
            likes: sql`${posts.likes} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, postId));

        const updatedPost = await db
          .select({ likes: posts.likes })
          .from(posts)
          .where(eq(posts.id, postId))
          .limit(1);

        return { 
          liked: true, 
          likesCount: updatedPost[0]?.likes || 0 
        };
      }
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to toggle like', 500);
    }
  }

  /**
   * Toggle like on comment
   */
  static async toggleCommentLike(commentId: string, userId: string) {
    try {
      // Check if comment exists
      const existingComment = await db
        .select()
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);

      if (existingComment.length === 0) {
        throw new CustomError('Comment not found', 404);
      }

      // Check if user already liked the comment
      const existingLike = await db
        .select()
        .from(likes)
        .where(and(eq(likes.commentId, commentId), eq(likes.userId, userId)))
        .limit(1);

      if (existingLike.length > 0) {
        // Unlike
        await db
          .delete(likes)
          .where(and(eq(likes.commentId, commentId), eq(likes.userId, userId)));

        await db
          .update(comments)
          .set({
            likes: sql`${comments.likes} - 1`,
            updatedAt: new Date(),
          })
          .where(eq(comments.id, commentId));

        const updatedComment = await db
          .select({ likes: comments.likes })
          .from(comments)
          .where(eq(comments.id, commentId))
          .limit(1);

        return { 
          liked: false, 
          likesCount: updatedComment[0]?.likes || 0 
        };
      } else {
        // Like
        await db.insert(likes).values({
          commentId,
          userId,
        });

        await db
          .update(comments)
          .set({
            likes: sql`${comments.likes} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(comments.id, commentId));

        const updatedComment = await db
          .select({ likes: comments.likes })
          .from(comments)
          .where(eq(comments.id, commentId))
          .limit(1);

        return { 
          liked: true, 
          likesCount: updatedComment[0]?.likes || 0 
        };
      }
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to toggle like', 500);
    }
  }

  /**
   * Toggle bookmark on post
   */
  static async toggleBookmark(postId: string, userId: string) {
    try {
      // Check if post exists
      const existingPost = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (existingPost.length === 0) {
        throw new CustomError('Post not found', 404);
      }

      // Check if user already bookmarked the post
      const existingBookmark = await db
        .select()
        .from(bookmarks)
        .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)))
        .limit(1);

      if (existingBookmark.length > 0) {
        // Remove bookmark
        await db
          .delete(bookmarks)
          .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));

        await db
          .update(posts)
          .set({
            bookmarks: sql`${posts.bookmarks} - 1`,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, postId));

        const updatedPost = await db
          .select({ bookmarks: posts.bookmarks })
          .from(posts)
          .where(eq(posts.id, postId))
          .limit(1);

        return { 
          bookmarked: false, 
          bookmarksCount: updatedPost[0]?.bookmarks || 0 
        };
      } else {
        // Add bookmark
        await db.insert(bookmarks).values({
          postId,
          userId,
        });

        await db
          .update(posts)
          .set({
            bookmarks: sql`${posts.bookmarks} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, postId));

        const updatedPost = await db
          .select({ bookmarks: posts.bookmarks })
          .from(posts)
          .where(eq(posts.id, postId))
          .limit(1);

        return { 
          bookmarked: true, 
          bookmarksCount: updatedPost[0]?.bookmarks || 0 
        };
      }
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to toggle bookmark', 500);
    }
  }
}
