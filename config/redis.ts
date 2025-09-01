import { createClient } from 'redis';
import { env } from './env.js';

export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (err: Error) => {
  console.error('❌ Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('end', () => {
  console.log('🔌 Redis connection closed');
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
   
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.quit();
  } catch (error) {
    console.error('❌ Error disconnecting from Redis:', error);
    throw error;
  }
}
