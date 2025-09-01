import type { Config } from 'drizzle-kit';
import { env } from './config/env.ts';

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config;
