import { defineConfig } from 'drizzle-kit';
import { env } from './env.js';

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema/*',
  out: './db/migrations',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
