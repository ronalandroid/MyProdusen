import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    setupFiles: ['./tests/setup.ts'],
    // include/exclude live on the projects below, NOT here: `extends: true`
    // MERGES root arrays into each project, so a root include would make every
    // project collect the whole suite again (observed: 366 files instead of 192).
    // tests/payroll/** must never run in parallel with each other:
    // calculatePayroll sweeps EVERY active employee holding an open
    // employeePayrolls assignment (endDate IS NULL), so two payroll files
    // running concurrently include each other's fixture employees mid-teardown.
    // Before the core FKs (migration 0042) this silently wrote orphaned
    // PayrollItem rows; with FKs it fails loudly. Only payroll files create
    // open assignments (verified: test-utils only cleans them), so serializing
    // this directory removes the race while the rest of the suite stays
    // parallel.
    projects: [
      {
        extends: true,
        test: {
          name: 'payroll-serial',
          include: ['tests/payroll/**/*.test.ts'],
          // Explicitly serialize FILES in this project (per-file module
          // isolation stays on). poolOptions maxForks/singleFork are not
          // honored per-project here — verified empirically: five files'
          // fixtures coexisted in one calculatePayroll sweep.
          fileParallelism: false,
        },
      },
      {
        extends: true,
        test: {
          name: 'general',
          include: ['**/*.test.ts', '**/*.spec.ts'],
          // '.claude/**' excludes git worktrees created under .claude/worktrees/ —
          // their duplicated *.test.ts copies otherwise get globbed and run
          // concurrently against the shared DB with the same time-based fixture
          // IDs, cross-deleting each other's rows.
          exclude: ['node_modules', 'dist', '.next', '.claude/**', 'tests/e2e/**', 'playwright-report/**', 'test-results/**', 'tests/payroll/**'],
        },
      },
    ],
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
        // External-service adapters (Redis client + filesystem document store).
        // Their success paths only execute against a live Redis/filesystem, which
        // the unit suite intentionally does not run (REDIS_URL unset -> cache
        // disabled). The graceful-degradation branches ARE unit-covered; the rest
        // is integration territory, same rationale as the browser exclusions above.
        'lib/cache/cache-manager.ts',
        'lib/cache/redis.ts',
        'lib/documents/document-storage.ts',
      ],
      // Ratchet floor — set just below current coverage so the gate passes today
      // and can never regress. Raise these toward 80 as DB-service integration
      // tests land (see issue #23). Enforced by `npx vitest run --coverage`.
      thresholds: {
        statements: 80,
        branches: 66,
        functions: 82,
        lines: 80,
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
