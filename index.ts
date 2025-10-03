import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { env } from './config/env.js';
import { connectRedis } from './config/redis.js';
import { securityMiddleware, compressionMiddleware, rateLimitMiddleware } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { corsMiddleware } from './middleware/cors.js';
// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(securityMiddleware);
app.use(compressionMiddleware);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API routes
import apiRoutes from './routes/index.js';
app.use('/api', apiRoutes);

// Import and start blog scheduler
import { dailyBlogScheduler } from './scripts/daily-blog-scheduler.js';

// test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint',
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Server startup
async function startServer(): Promise<void> {
  try {
    // Connect to Redis
    await connectRedis();
    
    // Start blog scheduler
    dailyBlogScheduler.start();
    
    // Start server
    const host = env.NODE_ENV === 'development' ? 'localhost' : env.HOST;
    app.listen(env.PORT, host, () => {
      console.log(`🚀 Server running on ${host}:${env.PORT}`);
      console.log(`📱 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 Health check: http://${host}:${env.PORT}/health`);
      console.log(`📝 Blog API: http://${host}:${env.PORT}/api/blogs`);
      if (env.NODE_ENV === 'development') {
        console.log(`🌐 Network access: http://10.65.2.187:${env.PORT}/health`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();