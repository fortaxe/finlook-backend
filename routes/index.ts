import { Router } from 'express';
import authRoutes from './auth-routes.js';
import postRoutes from './post-routes.js';
import reelRoutes from './reel-routes.js';
import uploadRoutes from './upload-routes.js';
import courseRoutes from './course-routes.js';
import blogRoutes from './blog-routes.js';
import waitlistRoutes from './waitlist-routes.js';

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
      reels: '/api/reels',
      uploads: '/api/uploads',
      courses: '/api/courses',
      blogs: '/api/blogs',
      waitlist: '/api/waitlist',
    },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/reels', reelRoutes);
router.use('/uploads', uploadRoutes);
router.use('/courses', courseRoutes);
router.use('/blogs', blogRoutes);
router.use('/waitlist', waitlistRoutes);

export default router;
