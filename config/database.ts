import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { env } from './env.js';
import * as schema from '../db/schema.js';

// Create neon connection
const sql = neon(env.DATABASE_URL);

// Create drizzle database instance with schema
export const db = drizzle(sql, { schema });

export type Database = typeof db;
