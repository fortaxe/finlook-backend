import type { Request, Response } from 'express';
import { BaseController } from './base-controller.js';
import { CourseService } from '../services/course-service.js';
import {
  createCourseSchema,
  updateCourseSchema,
  courseIdSchema,
  purchaseCourseSchema,
  createVideoSchema,
  updateVideoSchema,
  videoIdSchema,
} from '../validations/course-validation.js';

export class CourseController extends BaseController {
  /**
   * Create a new course (Admin only)
   */
  createCourse = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const courseData = this.validateBody(createCourseSchema, req.body);
    
    const result = await CourseService.createCourse(courseData);
    
    const message = result.videos.length > 0 
      ? `Course created successfully with ${result.videos.length} videos`
      : 'Course created successfully';
    
    this.sendSuccess(res, result, message, 201);
  });

  /**
   * Get all courses
   */
  getCourses = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    
    const courses = await CourseService.getCourses(userId);
    this.sendSuccess(res, { courses }, 'Courses retrieved successfully');
  });

  /**
   * Get course by ID
   */
  getCourseById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(courseIdSchema, req.params);
    
    const course = await CourseService.getCourseById(id, userId);
    this.sendSuccess(res, { course }, 'Course retrieved successfully');
  });

  /**
   * Update course (Admin only)
   */
  updateCourse = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = this.validateParams(courseIdSchema, req.params);
    const updateData = this.validateBody(updateCourseSchema, req.body);
    
    const course = await CourseService.updateCourse(id, updateData);
    this.sendSuccess(res, { course }, 'Course updated successfully');
  });

  /**
   * Delete course (Admin only)
   */
  deleteCourse = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = this.validateParams(courseIdSchema, req.params);
    
    await CourseService.deleteCourse(id);
    this.sendSuccess(res, null, 'Course deleted successfully');
  });

  /**
   * Purchase a course
   */
  purchaseCourse = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(courseIdSchema, req.params);
    
    const result = await CourseService.purchaseCourse(userId, id);
    this.sendSuccess(res, result, 'Course purchased successfully', 201);
  });

  /**
   * Get user's purchased courses
   */
  getUserPurchasedCourses = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    
    const courses = await CourseService.getUserPurchasedCourses(userId);
    this.sendSuccess(res, { courses }, 'Purchased courses retrieved successfully');
  });

  /**
   * Get course statistics (Admin only)
   */
  getCourseStats = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = await CourseService.getCourseStats();
    this.sendSuccess(res, { stats }, 'Course statistics retrieved successfully');
  });

  /**
   * Seed courses from mock data (Admin only, for testing)
   */
  seedCourses = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { mockCourses } = req.body;
    
    if (!mockCourses || !Array.isArray(mockCourses)) {
      this.sendError(res, 'Mock courses data is required and must be an array', 400);
      return;
    }
    
    const courses = await CourseService.seedCourses(mockCourses);
    this.sendSuccess(res, { courses }, 'Courses seeded successfully', 201);
  });

  // Video-related endpoints

  /**
   * Get course videos (only for purchased courses)
   */
  getCourseVideos = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(courseIdSchema, req.params);
    
    const videos = await CourseService.getCourseVideos(id, userId);
    this.sendSuccess(res, { videos }, 'Course videos retrieved successfully');
  });

  /**
   * Get video by ID (only for purchased courses)
   */
  getVideoById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    const { id } = this.validateParams(videoIdSchema, req.params);
    
    const result = await CourseService.getVideoById(id, userId);
    this.sendSuccess(res, result, 'Video retrieved successfully');
  });

  /**
   * Create video for course (Admin only)
   */
  createVideo = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = this.validateParams(courseIdSchema, req.params);
    const videoData = this.validateBody(createVideoSchema, req.body);
    
    const video = await CourseService.createVideo(id, videoData);
    this.sendSuccess(res, { video }, 'Video created successfully', 201);
  });

  /**
   * Update video (Admin only)
   */
  updateVideo = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = this.validateParams(videoIdSchema, req.params);
    const updateData = this.validateBody(updateVideoSchema, req.body);
    
    const video = await CourseService.updateVideo(id, updateData);
    this.sendSuccess(res, { video }, 'Video updated successfully');
  });

  /**
   * Delete video (Admin only)
   */
  deleteVideo = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = this.validateParams(videoIdSchema, req.params);
    
    await CourseService.deleteVideo(id);
    this.sendSuccess(res, null, 'Video deleted successfully');
  });

  /**
   * Seed videos for a course (Admin only, for testing)
   */
  seedVideos = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = this.validateParams(courseIdSchema, req.params);
    const { videos } = req.body;
    
    if (!videos || !Array.isArray(videos)) {
      this.sendError(res, 'Videos data is required and must be an array', 400);
      return;
    }
    
    const seededVideos = await CourseService.seedVideos(id, videos);
    this.sendSuccess(res, { videos: seededVideos }, 'Videos seeded successfully', 201);
  });
}
