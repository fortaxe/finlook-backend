import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CustomError } from '../middleware/error-handler.js';

export abstract class BaseController {
  /**
   * Wrapper for async route handlers to catch errors automatically
   */
  protected asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  /**
   * Validate request body against Zod schema
   */
  protected validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      console.error('Validation error details:', error);
      console.error('Data being validated:', JSON.stringify(data, null, 2));
      
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        console.error('Zod validation errors:', errorMessages);
        throw new CustomError(`Validation failed: ${JSON.stringify(errorMessages)}`, 400);
      }
      
      throw new CustomError('Validation failed', 400);
    }
  }

  /**
   * Validate query parameters against Zod schema
   */
  protected validateQuery<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      throw new CustomError('Query validation failed', 400);
    }
  }

  /**
   * Validate URL parameters against Zod schema
   */
  protected validateParams<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      throw new CustomError('Parameter validation failed', 400);
    }
  }

  /**
   * Send success response
   */
  protected sendSuccess(
    res: Response,
    data: any = null,
    message: string = 'Success',
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send paginated success response
   */
  protected sendPaginatedSuccess(
    res: Response,
    data: any[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message: string = 'Success'
  ): void {
    res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send error response
   */
  protected sendError(
    res: Response,
    message: string = 'Internal Server Error',
    statusCode: number = 500,
    details?: any
  ): void {
    res.status(statusCode).json({
      success: false,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    });
  }
}
