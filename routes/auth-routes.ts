import { Router } from 'express';
import { AuthController } from '../controller/auth-controller.js';
import authMiddleware from '../middleware/auth-middleware.js';

const router = Router();
const authController = new AuthController();

// Public routes with rate limiting
router.post('/signup', AuthController.applyRateLimit, authController.signUp);

// OTP-based authentication for users
router.post('/send-otp', AuthController.applyRateLimit, authController.sendOtp);
router.post('/verify-otp', AuthController.applyRateLimit, authController.verifyOtp);

// Password-based authentication for admins
router.post('/admin/signin', AuthController.applyRateLimit, authController.adminSignIn);

// Admin-only routes
router.post('/admin/create', authMiddleware(['admin']), authController.createAdmin);

// Protected routes
router.get('/profile', authMiddleware(['user']), authController.getProfile);

export default router;
