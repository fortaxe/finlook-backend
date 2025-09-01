import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Helmet configuration for security headers
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Compression middleware
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
});

 // Rate limiting configuration
 export const rateLimitMiddleware = rateLimit({
   windowMs: 60 * 1000, // 1 minute
   max: env.NODE_ENV === "development" ? 1000 : 15, // 15 requests per IP per minute in production
   message: {
     success: false,
     message: 'Too many requests from this IP, please try again later.',
   },
   standardHeaders: true,
   legacyHeaders: false,
 });

// Strict rate limiting for auth endpoints
export const authRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'development' ? 100 : 5, // Limit auth attempts
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
});
