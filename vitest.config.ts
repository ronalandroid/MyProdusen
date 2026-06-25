import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.next', 'tests/e2e/**', 'playwright-report/**', 'test-results/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'drizzle/',
        '.next/',
        // Presentational layer — validated by visual-regression / E2E, not unit
        // tests (per testing rules: "highly visual components → visual regression,
        // not brittle markup assertions").
        '**/*.tsx',
        // Browser/offline-only runtime (IndexedDB, navigator, window) — exercised
        // by E2E, not unit-testable in the node test environment.
        'src/hooks/offline/**',
        'src/services/attendance/attendance.offline.ts',
        'src/services/attendance/check-in-handler.ts',
        'lib/auth-client.ts',
        // Infra / config / entrypoints — no business logic to unit-test.
        '**/*.config.{ts,js,mjs}',
        'middleware.ts',
        'instrumentation*.ts',
        'sentry.*.config.ts',
        'scripts/**',
        '**/*.d.ts',
      ],
      // Ratchet floor — set just below current coverage so the gate passes today
      // and can never regress. Raise these toward 80 as DB-service integration
      // tests land (see issue #23). Enforced by `npx vitest run --coverage`.
      thresholds: {
        statements: 66,
        branches: 56,
        functions: 69,
        lines: 67,
      },
    },
  },
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, './src/components'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/features': path.resolve(__dirname, './features'),
      '@/server': path.resolve(__dirname, './src/server'),
      '@': path.resolve(__dirname, './'),
    },
  },
});
