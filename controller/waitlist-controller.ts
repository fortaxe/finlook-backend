import type { Request, Response } from 'express';
import { BaseController } from './base-controller.js';
import { WaitlistService } from '../services/waitlist-service.js';
import { 
  joinWaitlistSchema, 
  updateWaitlistUserSchema, 
  waitlistQuerySchema,
  type JoinWaitlistRequest,
  type UpdateWaitlistUserRequest,
  type WaitlistQueryRequest
} from '../validations/waitlist-validation.js';

export class WaitlistController extends BaseController {
  private waitlistService: WaitlistService;

  constructor() {
    super();
    this.waitlistService = new WaitlistService();
  }

  /**
   * POST /api/waitlist/join
   * Join the waitlist with user information
   */
  joinWaitlist = this.asyncHandler(async (req: Request, res: Response) => {
    const validatedData = this.validateBody<JoinWaitlistRequest>(
      joinWaitlistSchema,
      req.body
    );

    const result = await this.waitlistService.joinWaitlist(validatedData);

    if (result.success) {
      this.sendSuccess(
        res,
        result.data,
        result.message,
        201
      );
    } else {
      // Handle duplicate case with structured response
      res.status(200).json({
        success: false,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /join-waitlist-count
   * Get the total count of waitlisted users
   */
  getWaitlistCount = this.asyncHandler(async (req: Request, res: Response) => {
    const result = await this.waitlistService.getWaitlistCount();

    this.sendSuccess(
      res,
      result,
      'Waitlist count retrieved successfully'
    );
  });

  // ===== ADMIN CRUD OPERATIONS =====

  /**
   * GET /api/admin/waitlist/users
   * Get all waitlist users (Admin only)
   */
  getWaitlistUsers = this.asyncHandler(async (req: Request, res: Response) => {
    const query = this.validateQuery<WaitlistQueryRequest>(
      waitlistQuerySchema,
      req.query
    );

    const result = await this.waitlistService.getWaitlistUsers(query);

    this.sendSuccess(
      res,
      result,
      'Waitlist users retrieved successfully'
    );
  });

  /**
   * GET /api/admin/waitlist/users/:id
   * Get a specific waitlist user by ID (Admin only)
   */
  getWaitlistUserById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return this.sendError(res, 'User ID is required', 400);
    }

    const result = await this.waitlistService.getWaitlistUserById(id);

    this.sendSuccess(
      res,
      { user: result },
      'Waitlist user retrieved successfully'
    );
  });

  /**
   * PUT /api/admin/waitlist/users/:id
   * Update a waitlist user (Admin only)
   */
  updateWaitlistUser = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = this.validateBody<UpdateWaitlistUserRequest>(
      updateWaitlistUserSchema,
      req.body
    );

    if (!id) {
      return this.sendError(res, 'User ID is required', 400);
    }

    const result = await this.waitlistService.updateWaitlistUser(id, updateData);

    this.sendSuccess(
      res,
      { user: result },
      'Waitlist user updated successfully'
    );
  });

  /**
   * DELETE /api/admin/waitlist/users/:id
   * Delete a user (Admin only) - Hard delete
   */
  deleteWaitlistUser = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return this.sendError(res, 'User ID is required', 400);
    }

    const result = await this.waitlistService.deleteWaitlistUser(id);

    this.sendSuccess(
      res,
      result,
      'User deleted successfully'
    );
  });
}
