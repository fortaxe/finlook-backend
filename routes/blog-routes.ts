import { Router } from 'express';
import { blogController } from '../controller/blog-controller.js';
import authMiddleware from '../middleware/auth-middleware.js';

const blogRoutes = Router();

// Public routes
blogRoutes.get('/', blogController.getAllBlogs);
blogRoutes.get('/:id', blogController.getBlogById);

// Admin routes (protected)
blogRoutes.post('/generate', authMiddleware, blogController.generateBlogsManually);

export default blogRoutes;
