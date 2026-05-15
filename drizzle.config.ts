import type { Config } from 'drizzle-kit';

function normalizeDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.searchParams.delete('schema');
  return url.toString();
}

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: normalizeDatabaseUrl(process.env.DATABASE_URL!),
  },
} satisfies Config;
