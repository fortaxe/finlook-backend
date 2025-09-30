import type { Request, Response } from 'express';
import { BaseController } from './base-controller.js';
import { ReelService } from '../services/reel-service.js';
import {
  createReelSchema,
  updateReelSchema,
  createReelCommentSchema,
  updateReelCommentSchema,
  paginationSchema,
  reelIdSchema,
  reelCommentIdSchema,
} from '../validations/reel-validation.js';

export class ReelController extends BaseController {
  /**
   * Create a new reel
   */
  createReel = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    console.log('req.body', req.body);
    const userId = (req as any).user?.userId;
    const reelData = this.validateBody(createReelSchema, req.body);
    
    const reel = await ReelService.createReel(userId, reelData);
    this.sendSuccess(res, { reel }, 'Reel created successfully', 201);
  });

  /**
   * Get reels with pagination
   */
  getReels = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const pagination = this.validateQuery(paginationSchema, req.query);
  
    const result = await ReelService.getReels(pagination, userId);

    this.sendPaginatedSuccess(res, result.data, result.pagination, 'Reels retrieved successfully');
  });

  /**
   * Get user's reels by user ID
   */
  getUserReels = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUserId = (req as any).user?.userId;
    const { userId } = req.params;
    const pagination = this.validateQuery(paginationSchema, req.query);

    if (!userId) {
      return this.sendError(res, 'User ID is required', 400);
    }

    const result = await ReelService.getUserReels(userId, pagination, currentUserId);
    this.sendPaginatedSuccess(res, result.data, result.pagination, 'User reels retrieved successfully');
  });

  /**
   * Get reel by ID
   */
  getReelById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(reelIdSchema, req.params);
    
    const reel = await ReelService.getReelById(id, userId);
    this.sendSuccess(res, { reel }, 'Reel retrieved successfully');
  });

  /**
   * Update reel
   */
  updateReel = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(reelIdSchema, req.params);
    const updateData = this.validateBody(updateReelSchema, req.body);
    
    const reel = await ReelService.updateReel(id, userId, updateData);
    this.sendSuccess(res, { reel }, 'Reel updated successfully');
  });

  /**
   * Delete reel
   */
  deleteReel = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(reelIdSchema, req.params);
    
    await ReelService.deleteReel(id, userId);
    this.sendSuccess(res, null, 'Reel deleted successfully');
  });

  /**
   * Get reel comments
   */
  getReelComments = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    console.log('userId', userId);
    const { id } = this.validateParams(reelIdSchema, req.params);
    const pagination = this.validateQuery(paginationSchema, req.query);
    
    const result = await ReelService.getReelComments(id, pagination, userId);
    console.log('result', result);
    this.sendPaginatedSuccess(res, result.comments, result.pagination, 'Comments retrieved successfully');
  });

  /**
   * Create comment on reel
   */
  createReelComment = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(reelIdSchema, req.params);
    const commentData = this.validateBody(createReelCommentSchema, req.body);
    
    const comment = await ReelService.createReelComment(id, userId, commentData);
    this.sendSuccess(res, { comment }, 'Comment created successfully', 201);
  });

  /**
   * Update reel comment
   */
  updateReelComment = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(reelCommentIdSchema, req.params);
    const updateData = this.validateBody(updateReelCommentSchema, req.body);
    
    const comment = await ReelService.updateReelComment(id, userId, updateData);
    this.sendSuccess(res, { comment }, 'Comment updated successfully');
  });

  /**
   * Delete reel comment
   */
  deleteReelComment = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(reelCommentIdSchema, req.params);
    
    await ReelService.deleteReelComment(id, userId);
    this.sendSuccess(res, null, 'Comment deleted successfully');
  });

  /**
   * Toggle like on reel
   */
  toggleReelLike = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(reelIdSchema, req.params);
    
    const result = await ReelService.toggleReelLike(id, userId);
    this.sendSuccess(res, result, result.liked ? 'Reel liked' : 'Reel unliked');
  });

  /**
   * Toggle like on reel comment
   */
  toggleReelCommentLike = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(reelCommentIdSchema, req.params);
    
    const result = await ReelService.toggleReelCommentLike(id, userId);
    this.sendSuccess(res, result, result.liked ? 'Comment liked' : 'Comment unliked');
  });
}
