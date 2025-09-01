import cors from 'cors';
import { env } from '../config/env.js';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, define allowed origins
         const allowedOrigins = [
       'http://localhost:3000',
       'http://localhost:8081', 
       'http://localhost:8080', // Expo dev server
       'http://localhost:19006', // Expo web
       'https://www.finlook.ai'
       // Add your production domains here
     ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Cache-Date',
  ],
};

export const corsMiddleware = cors(corsOptions);
