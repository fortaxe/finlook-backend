import { Router } from 'express';
import { CourseController } from '../controller/course-controller.js';
import authMiddleware from '../middleware/auth-middleware.js';

const router = Router();
const courseController = new CourseController();

// Public routes (no authentication required)
// Note: These are commented out since the user wants authentication for all course endpoints
// router.get('/', courseController.getCourses);
// router.get('/:id', courseController.getCourseById);

// Routes requiring user authentication
router.use(authMiddleware(['user', 'admin']));

// Course browsing routes (authenticated users)
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);

// Course purchase routes (authenticated users)
router.post('/:id/purchase', courseController.purchaseCourse);
router.get('/user/purchased', courseController.getUserPurchasedCourses);

// Video routes (authenticated users - purchase validation in service)
router.get('/:id/videos', courseController.getCourseVideos);
router.get('/videos/:id', courseController.getVideoById);

// Admin-only routes
router.post('/', authMiddleware(['admin']), courseController.createCourse);
router.put('/:id', authMiddleware(['admin']), courseController.updateCourse);
router.delete('/:id', authMiddleware(['admin']), courseController.deleteCourse);
router.get('/admin/stats', authMiddleware(['admin']), courseController.getCourseStats);
router.post('/admin/seed', authMiddleware(['admin']), courseController.seedCourses);

// Admin video routes
router.post('/:id/videos', authMiddleware(['admin']), courseController.createVideo);
router.put('/videos/:id', authMiddleware(['admin']), courseController.updateVideo);
router.delete('/videos/:id', authMiddleware(['admin']), courseController.deleteVideo);
router.post('/:id/videos/seed', authMiddleware(['admin']), courseController.seedVideos);

export default router;
