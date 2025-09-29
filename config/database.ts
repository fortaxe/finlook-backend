import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { env } from './env.js';
import * as schema from '../db/schema.js';

// Create neon pool connection (supports transactions)
const pool = new Pool({ connectionString: env.DATABASE_URL });

// Create drizzle database instance with schema
export const db = drizzle(pool, { schema });

export type Database = typeof db;
