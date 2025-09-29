import { eq, desc, and, count, asc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { courses, coursePurchases,  courseVideos } from '../db/schema.js';
import { CustomError } from '../middleware/error-handler.js';
import type {
  CreateCourseRequest,
  UpdateCourseRequest,
  PurchaseCourseRequest,
  CreateVideoRequest,
  UpdateVideoRequest,
} from '../validations/course-validation.js';

export class CourseService {
  /**
   * Create a new course (Admin only)
   */
  static async createCourse(courseData: CreateCourseRequest) {
    try {
      // Start a transaction to create course and videos together
      const result = await db.transaction(async (tx) => {
        // Create the course
        const newCourse = await tx
          .insert(courses)
          .values({
            title: courseData.title,
            description: courseData.description,
            price: courseData.price,
            originalPrice: courseData.originalPrice,
            level: courseData.level,
            category: courseData.category,
            thumbnail: courseData.thumbnail,
          })
          .returning();

        if (!Array.isArray(newCourse) || newCourse.length === 0 || !newCourse[0]?.id) {
          throw new CustomError('Failed to create course', 500);
        }

        const course = newCourse[0];

        // Create videos if provided
        let videos: any[] = [];
        if (courseData.videos && courseData.videos.length > 0) {
          const videosToInsert = courseData.videos.map((video, index) => ({
            courseId: course.id,
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl,
            duration: video.duration,
            order: video.order !== undefined ? video.order : index,
          }));

          videos = await tx
            .insert(courseVideos)
            .values(videosToInsert)
            .returning();
        }

        return { course, videos };
      });

      return result;
    } catch (error) {
      console.log('Error creating course:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create course', 500);
    }
  }

  /**
   * Get all courses with purchase status for a user
   */
  static async getCourses(userId?: string) {
    try {
      const allCourses = await db
        .select()
        .from(courses)
        .where(eq(courses.isActive, true))
        .orderBy(desc(courses.createdAt));

      // If user is provided, check purchase status for each course
      if (userId) {
        const coursesWithPurchaseStatus = await Promise.all(
          allCourses.map(async (course) => {
            const purchase = await db
              .select()
              .from(coursePurchases)
              .where(
                and(
                  eq(coursePurchases.courseId, course.id),
                  eq(coursePurchases.userId, userId)
                )
              )
              .limit(1);

            return {
              ...course,
              isPurchased: purchase.length > 0,
            };
          })
        );

        return coursesWithPurchaseStatus;
      }

      // If no user, return courses without purchase status
      return allCourses.map(course => ({
        ...course,
        isPurchased: false,
      }));
    } catch (error) {
      console.log('Error getting courses:', error);
      throw new CustomError('Failed to get courses', 500);
    }
  }

  /**
   * Get course by ID
   */
  static async getCourseById(courseId: string, userId?: string) {
    try {
      const courseResult = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);

      if (courseResult.length === 0) {
        throw new CustomError('Course not found', 404);
      }

      const course = courseResult[0];

      // Check if user has purchased this course
      let isPurchased = false;
      if (userId) {
        const purchase = await db
          .select()
          .from(coursePurchases)
          .where(
            and(
              eq(coursePurchases.courseId, courseId),
              eq(coursePurchases.userId, userId)
            )
          )
          .limit(1);

        isPurchased = purchase.length > 0;
      }

      return {
        ...course,
        isPurchased,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to get course', 500);
    }
  }

  /**
   * Update course (Admin only)
   */
  static async updateCourse(courseId: string, updateData: UpdateCourseRequest) {
    try {
      // Check if course exists
      const existingCourse = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);

      if (existingCourse.length === 0) {
        throw new CustomError('Course not found', 404);
      }

      const updatedCourse = await db
        .update(courses)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, courseId))
        .returning();

      return updatedCourse[0];
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update course', 500);
    }
  }

  /**
   * Delete course (Admin only)
   */
  static async deleteCourse(courseId: string) {
    try {
      // Check if course exists
      const existingCourse = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);

      if (existingCourse.length === 0) {
        throw new CustomError('Course not found', 404);
      }

      // Soft delete by setting isActive to false
      await db
        .update(courses)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, courseId));

      return true;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete course', 500);
    }
  }

  /**
   * Purchase a course
   */
  static async purchaseCourse(userId: string, courseId: string) {
    try {
      // Check if course exists and is active
      const courseResult = await db
        .select()
        .from(courses)
        .where(and(eq(courses.id, courseId), eq(courses.isActive, true)))
        .limit(1);

      if (courseResult.length === 0) {
        throw new CustomError('Course not found or is no longer available', 404);
      }

      const course = courseResult[0];

      // Check if user already purchased this course
      const existingPurchase = await db
        .select()
        .from(coursePurchases)
        .where(
          and(
            eq(coursePurchases.courseId, courseId),
            eq(coursePurchases.userId, userId)
          )
        )
        .limit(1);

      if (existingPurchase.length > 0) {
        throw new CustomError('You have already purchased this course', 409);
      }

      // Create purchase record
      const newPurchase = await db
        .insert(coursePurchases)
        .values({
          userId,
          courseId,
          purchasePrice: course!.price,
        })
        .returning();

      return {
        purchase: newPurchase[0],
        course: {
          ...course,
          isPurchased: true,
        },
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to purchase course', 500);
    }
  }

  /**
   * Get user's purchased courses
   */
  static async getUserPurchasedCourses(userId: string) {
    try {
      const purchasedCourses = await db
        .select({
          course: courses,
          purchaseDate: coursePurchases.createdAt,
          purchasePrice: coursePurchases.purchasePrice,
        })
        .from(coursePurchases)
        .leftJoin(courses, eq(coursePurchases.courseId, courses.id))
        .where(eq(coursePurchases.userId, userId))
        .orderBy(desc(coursePurchases.createdAt));

      return purchasedCourses.map(item => ({
        ...item.course,
        isPurchased: true,
        purchaseDate: item.purchaseDate,
        purchasePrice: item.purchasePrice,
      }));
    } catch (error) {
      console.log('Error getting user purchased courses:', error);
      throw new CustomError('Failed to get purchased courses', 500);
    }
  }

  /**
   * Get course statistics (Admin only)
   */
  static async getCourseStats() {
    try {
      const stats = await db
        .select({
          courseId: courses.id,
          title: courses.title,
          price: courses.price,
          purchaseCount: count(coursePurchases.id)
        })
        .from(courses)
        .leftJoin(coursePurchases, eq(courses.id, coursePurchases.courseId))
        .where(eq(courses.isActive, true))
        .groupBy(courses.id, courses.title, courses.price);

      return stats;
    } catch (error) {
      console.log('Error getting course stats:', error);
      throw new CustomError('Failed to get course statistics', 500);
    }
  }

  /**
   * Seed courses from mock data
   */
  static async seedCourses(mockCourses: any[]) {
    try {
      const coursesToInsert = mockCourses.map(course => ({
        title: course.title,
        description: course.description,
        price: Math.round(course.price * 100), // Convert to cents
        originalPrice: course.originalPrice ? Math.round(course.originalPrice * 100) : undefined,
        level: course.level,
        category: course.category,
        thumbnail: course.thumbnail,
      }));

      const insertedCourses = await db
        .insert(courses)
        .values(coursesToInsert)
        .returning();

      return insertedCourses;
    } catch (error) {
      console.log('Error seeding courses:', error);
      throw new CustomError('Failed to seed courses', 500);
    }
  }

  // Video-related methods

  /**
   * Get course videos (only for purchased courses or admin)
   */
  static async getCourseVideos(courseId: string, userId?: string) {
    try {
      // Check if course exists
      const courseResult = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);

      if (courseResult.length === 0) {
        throw new CustomError('Course not found', 404);
      }

      // Check if user has purchased the course (if userId provided)
      if (userId) {
        const purchase = await db
          .select()
          .from(coursePurchases)
          .where(
            and(
              eq(coursePurchases.courseId, courseId),
              eq(coursePurchases.userId, userId)
            )
          )
          .limit(1);

        if (purchase.length === 0) {
          throw new CustomError('You must purchase this course to access videos', 403);
        }
      }

      // Get videos for the course
      const videos = await db
        .select()
        .from(courseVideos)
        .where(and(eq(courseVideos.courseId, courseId), eq(courseVideos.isActive, true)))
        .orderBy(asc(courseVideos.order), asc(courseVideos.createdAt));

      return videos;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to get course videos', 500);
    }
  }

  /**
   * Get video by ID (only for purchased courses or admin)
   */
  static async getVideoById(videoId: string, userId?: string) {
    try {
      const videoResult = await db
        .select({
          video: courseVideos,
          course: courses,
        })
        .from(courseVideos)
        .leftJoin(courses, eq(courseVideos.courseId, courses.id))
        .where(eq(courseVideos.id, videoId))
        .limit(1);

      if (videoResult.length === 0) {
        throw new CustomError('Video not found', 404);
      }

      const result = videoResult[0];
      if (!result) {
        throw new CustomError('Video not found', 404);
      }

      const { video, course } = result;
      if (!course) {
        throw new CustomError('Course not found', 404);
      }

      // Check if user has purchased the course (if userId provided)
      if (userId) {
        const purchase = await db
          .select()
          .from(coursePurchases)
          .where(
            and(
              eq(coursePurchases.courseId, course.id),
              eq(coursePurchases.userId, userId)
            )
          )
          .limit(1);

        if (purchase.length === 0) {
          throw new CustomError('You must purchase this course to access videos', 403);
        }
      }

      return { video, course };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to get video', 500);
    }
  }

  /**
   * Create video for course (Admin only)
   */
  static async createVideo(courseId: string, videoData: CreateVideoRequest) {
    try {
      // Check if course exists
      const courseResult = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);

      if (courseResult.length === 0) {
        throw new CustomError('Course not found', 404);
      }

      const newVideo = await db
        .insert(courseVideos)
        .values({
          courseId,
          title: videoData.title,
          description: videoData.description,
          videoUrl: videoData.videoUrl,
          duration: videoData.duration,
          order: videoData.order,
        })
        .returning();

      return newVideo[0];
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create video', 500);
    }
  }

  /**
   * Update video (Admin only)
   */
  static async updateVideo(videoId: string, updateData: UpdateVideoRequest) {
    try {
      // Check if video exists
      const existingVideo = await db
        .select()
        .from(courseVideos)
        .where(eq(courseVideos.id, videoId))
        .limit(1);

      if (existingVideo.length === 0) {
        throw new CustomError('Video not found', 404);
      }

      const updatedVideo = await db
        .update(courseVideos)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(courseVideos.id, videoId))
        .returning();

      return updatedVideo[0];
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update video', 500);
    }
  }

  /**
   * Delete video (Admin only)
   */
  static async deleteVideo(videoId: string) {
    try {
      // Check if video exists
      const existingVideo = await db
        .select()
        .from(courseVideos)
        .where(eq(courseVideos.id, videoId))
        .limit(1);

      if (existingVideo.length === 0) {
        throw new CustomError('Video not found', 404);
      }

      // Soft delete by setting isActive to false
      await db
        .update(courseVideos)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(courseVideos.id, videoId));

      return true;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete video', 500);
    }
  }

  /**
   * Seed videos for courses
   */
  static async seedVideos(courseId: string, videos: any[]) {
    try {
      const videosToInsert = videos.map((video, index) => ({
        courseId,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        duration: video.duration,
        order: video.order || index,
      }));

      const insertedVideos = await db
        .insert(courseVideos)
        .values(videosToInsert)
        .returning();

      return insertedVideos;
    } catch (error) {
      console.log('Error seeding videos:', error);
      throw new CustomError('Failed to seed videos', 500);
    }
  }
}
