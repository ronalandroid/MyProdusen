import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/drizzle/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

function normalizeDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.searchParams.delete('schema');
  return url.toString();
}

// Create postgres connection with pooling optimization
const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);
const client = postgres(connectionString, {
  max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export schema for use in queries
export * from '@/drizzle/schema';
