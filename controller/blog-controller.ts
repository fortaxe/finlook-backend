  import type { Request, Response } from 'express';
import { blogService } from '../services/blog-service.js';

class BlogController {
  async getAllBlogs(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '10');
      const offset = (page - 1) * limit;

      const blogs = await blogService.getAllBlogs(limit, offset);

      res.json({
        success: true,
        message: 'Blogs retrieved successfully',
        data: {
          blogs,
          pagination: {
            page,
            limit,
            hasMore: blogs.length === limit
          }
        }
      });
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blogs'
      });
    }
  }

  async getBlogById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Blog ID is required'
        });
      }

      const blog = await blogService.getBlogById(id);
      
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      // Increment views
      await blogService.incrementViews(id);

      res.json({
        success: true,
        message: 'Blog retrieved successfully',
        data: { blog }
      });
    } catch (error) {
      console.error('Error fetching blog:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog'
      });
    }
  }

  async generateBlogsManually(req: Request, res: Response) {
    try {
      // This endpoint can be used for manual triggering
      await blogService.generateAndSaveBlogs();
      
      res.json({
        success: true,
        message: 'Blogs generated and saved successfully',
        data: {}
      });
    } catch (error) {
      console.error('Error generating blogs manually:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate blogs'
      });
    }
  }
}

export const blogController = new BlogController();
