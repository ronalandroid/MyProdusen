import 'fake-indexeddb/auto';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Test suite must not inherit production mode from local `.env`.
(process.env as any).NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-32chars';
process.env.CACHE_ENABLED = 'false';
// Keep the suite hermetic — no live HIBP breach lookups. The dedicated HIBP
// unit test clears this flag to exercise the network path against a mock.
process.env.HIBP_NETWORK_DISABLED = 'true';

function sanitizeDatabaseUrl(databaseUrl: string | undefined): string | undefined {
  if (!databaseUrl) {
    return databaseUrl;
  }

  try {
    const url = new URL(databaseUrl);
    url.searchParams.delete('schema');
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

// Use TEST_DATABASE_URL if set, otherwise fall back to DATABASE_URL
process.env.DATABASE_URL = sanitizeDatabaseUrl(
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
);
process.env.TEST_DATABASE_URL = sanitizeDatabaseUrl(process.env.TEST_DATABASE_URL);

// Global test setup
beforeAll(async () => {
  // Setup runs before all tests
  console.log('Running tests with DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
});

afterAll(async () => {
  // Cleanup runs after all tests
});

beforeEach(async () => {
  // Reset state before each test if needed
});
