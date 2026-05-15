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

// Create postgres connection
const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);
const client = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export schema for use in queries
export * from '@/drizzle/schema';
