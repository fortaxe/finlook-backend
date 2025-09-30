import type { Request, Response } from 'express';
import { BaseController } from './base-controller.js';
import { PostService } from '../services/post-service.js';
import {
  createPostSchema,
  updatePostSchema,
  createRetweetSchema,
  createCommentSchema,
  updateCommentSchema,
  paginationSchema,
  postIdSchema,
  commentIdSchema,
} from '../validations/post-validation.js';

export class PostController extends BaseController {
  /**
   * Create a new post
   */
  createPost = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    console.log('req.body', req.body);
    const userId = (req as any).user?.userId;
    const postData = this.validateBody(createPostSchema, req.body);
    
    const post = await PostService.createPost(userId, postData);
    this.sendSuccess(res, { post }, 'Post created successfully', 201);
  });

  /**
   * Create a retweet
   */
  createRetweet = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    console.log('req.body', req.body);
    const userId = (req as any).user?.userId;
    const retweetData = this.validateBody(createRetweetSchema, req.body);
    
    const retweet = await PostService.createRetweet(userId, retweetData);
    this.sendSuccess(res, { post: retweet }, 'Retweet created successfully', 201);
  });

  /**
   * Get posts with pagination
   */
  getPosts = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const pagination = this.validateQuery(paginationSchema, req.query);
  
    const result = await PostService.getPosts(pagination, userId);
    this.sendPaginatedSuccess(res, result.data, result.pagination, 'Posts retrieved successfully');
  });

  /**
   * Get user's posts by user ID
   */
  getUserPosts = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUserId = (req as any).user?.userId;
    const { userId } = req.params;
    const pagination = this.validateQuery(paginationSchema, req.query);

    if (!userId) {
      return this.sendError(res, 'User ID is required', 400);
    }
  
    const result = await PostService.getUserPosts(userId, pagination, currentUserId);
    this.sendPaginatedSuccess(res, result.data, result.pagination, 'User posts retrieved successfully');
  });

  /**
   * Get post by ID
   */
  getPostById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = this.validateParams(postIdSchema, req.params);
    
    const post = await PostService.getPostById(id);
    this.sendSuccess(res, { post }, 'Post retrieved successfully');
  });

  /**
   * Update post
   */
  updatePost = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(postIdSchema, req.params);
    const updateData = this.validateBody(updatePostSchema, req.body);
    
    const post = await PostService.updatePost(id, userId, updateData);
    this.sendSuccess(res, { post }, 'Post updated successfully');
  });

  /**
   * Delete post
   */
  deletePost = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(postIdSchema, req.params);
    
    await PostService.deletePost(id, userId);
    this.sendSuccess(res, null, 'Post deleted successfully');
  });

  /**
   * Get post comments
   */
  getPostComments = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    console.log('userId', userId);
    const { id } = this.validateParams(postIdSchema, req.params);
    const pagination = this.validateQuery(paginationSchema, req.query);
    
    const result = await PostService.getPostComments(id, pagination, userId);
    console.log('result', result);
    this.sendPaginatedSuccess(res, result.comments, result.pagination, 'Comments retrieved successfully');
  });

  /**
   * Create comment
   */
  createComment = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(postIdSchema, req.params);
    const commentData = this.validateBody(createCommentSchema, req.body);
    
    const comment = await PostService.createComment(id, userId, commentData);
    this.sendSuccess(res, { comment }, 'Comment created successfully', 201);
  });

  /**
   * Update comment
   */
  updateComment = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(commentIdSchema, req.params);
    const updateData = this.validateBody(updateCommentSchema, req.body);
    
    const comment = await PostService.updateComment(id, userId, updateData);
    this.sendSuccess(res, { comment }, 'Comment updated successfully');
  });

  /**
   * Delete comment
   */
  deleteComment = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(commentIdSchema, req.params);
    
    await PostService.deleteComment(id, userId);
    this.sendSuccess(res, null, 'Comment deleted successfully');
  });

  /**
   * Toggle like on post
   */
  togglePostLike = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(postIdSchema, req.params);
    
    const result = await PostService.togglePostLike(id, userId);
    this.sendSuccess(res, result, result.liked ? 'Post liked' : 'Post unliked');
  });

  /**
   * Toggle like on comment
   */
  toggleCommentLike = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(commentIdSchema, req.params);
    
    const result = await PostService.toggleCommentLike(id, userId);
    this.sendSuccess(res, result, result.liked ? 'Comment liked' : 'Comment unliked');
  });

  /**
   * Toggle bookmark on post
   */
  toggleBookmark = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(postIdSchema, req.params);
    
    const result = await PostService.toggleBookmark(id, userId);
    this.sendSuccess(res, result, result.bookmarked ? 'Post bookmarked' : 'Bookmark removed');
  });
}
