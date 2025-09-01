import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  error: AppError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  }
  // Handle custom app errors
  else if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle known errors with statusCode
  else if ('statusCode' in error && error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle generic errors
  else {
    message = error.message || message;
  }

  // Log error for debugging
  console.error('❌ Error:', {
    statusCode,
    message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
}
