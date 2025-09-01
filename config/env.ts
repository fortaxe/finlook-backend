import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').default('redis://localhost:6379'),
  PORT: z.preprocess(
    (val) => typeof val === 'string' ? parseInt(val, 10) : val,
    z.number().default(3000)
  ),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  // Cloudflare R2 Configuration
  R2_REGION: z.string().default('auto'),
  R2_S3_ENDPOINT: z.string().url('R2_S3_ENDPOINT must be a valid URL'),
  R2_BUCKET: z.string().min(1, 'R2_BUCKET is required'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
  R2_PUBLIC_BASE_URL: z.string().url('R2_PUBLIC_BASE_URL must be a valid URL').optional(),
});

export type Environment = z.infer<typeof envSchema>;

export function validateEnvironment(): Environment {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

export const env = validateEnvironment();
