import { Router } from 'express';
import authRoutes from './auth-routes.js';
import postRoutes from './post-routes.js';
import uploadRoutes from './upload-routes.js';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API info route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Finlook API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        signup: '/api/auth/signup',
        sendOtp: '/api/auth/send-otp',
        verifyOtp: '/api/auth/verify-otp',
        adminSignin: '/api/auth/admin/signin',
        profile: '/api/auth/profile',
      },
      posts: '/api/posts',
      uploads: '/api/uploads',
    },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/uploads', uploadRoutes);

export default router;
