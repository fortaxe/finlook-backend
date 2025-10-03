import { Router } from 'express';
import { WaitlistController } from '../controller/waitlist-controller.js';
import authMiddleware from '../middleware/auth-middleware.js';

const router = Router();
const waitlistController = new WaitlistController();

// ===== PUBLIC ROUTES =====

/**
 * POST /api/waitlist/join
 * Join the waitlist with user information
 */
router.post('/join', waitlistController.joinWaitlist);

/**
 * GET /api/waitlist/count
 * Get the total count of waitlisted users
 */
router.get('/count', waitlistController.getWaitlistCount);

// ===== ADMIN ROUTES =====

/**
 * GET /api/waitlist/admin/users
 * Get all waitlist users with pagination and filtering (Admin only)
 */
router.get('/admin/users', authMiddleware(['admin']), waitlistController.getWaitlistUsers);

/**
 * GET /api/waitlist/admin/users/:id
 * Get a specific waitlist user by ID (Admin only)
 */
router.get('/admin/users/:id', authMiddleware(['admin']), waitlistController.getWaitlistUserById);

/**
 * PUT /api/waitlist/admin/users/:id
 * Update a waitlist user (Admin only)
 */
router.put('/admin/users/:id', authMiddleware(['admin']), waitlistController.updateWaitlistUser);

/**
 * DELETE /api/waitlist/admin/users/:id
 * Delete a user (Admin only) - Hard delete
 */
router.delete('/admin/users/:id', authMiddleware(['admin']), waitlistController.deleteWaitlistUser);

export default router;
