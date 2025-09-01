import type { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  details?: any;
  timestamp: string;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ResponseHelper {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string = 'Internal Server Error',
    statusCode: number = 500,
    details?: any
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message: string = 'Success'
  ): void {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    const response: PaginatedApiResponse<T> = {
      success: true,
      message,
      data,
      pagination: {
        ...pagination,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };
    
    res.status(200).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Created successfully'
  ): void {
    ResponseHelper.success(res, data, message, 201);
  }

  static noContent(res: Response): void {
    res.status(204).send();
  }
}
