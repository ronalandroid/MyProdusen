import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const SCRIPT = path.resolve('scripts/check-production-env.mjs');

function run(env: Record<string, string | undefined>) {
  // Strip every var the script consumes so the parent test environment never
  // bleeds in. Then merge the explicit env keys for this case.
  const KNOWN = [
    'NODE_ENV',
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'APP_URL',
    'UPLOAD_DIR',
    'ATTENDANCE_SELFIE_DIR',
    'MAX_UPLOAD_SIZE',
    'MAX_SELFIE_SIZE_MB',
    'GPS_MAX_ACCURACY_METERS',
    'DEFAULT_GEOFENCE_RADIUS_METERS',
    'REJECT_OUTSIDE_GEOFENCE',
    'GPS_TIMESTAMP_MAX_AGE_SECONDS',
    'ATTENDANCE_EXPORT_MAX_ROWS',
    'PDF_REPORT_MAX_ROWS',
    'PDF_REPORT_MAX_DATE_RANGE_MONTHS',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_SELFIE_MAX_WIDTH',
    'NEXT_PUBLIC_SELFIE_MAX_HEIGHT',
    'NEXT_PUBLIC_SELFIE_IMAGE_QUALITY',
    'NEXT_PUBLIC_SELFIE_TARGET_SIZE_KB',
    'NEXT_PUBLIC_OSM_TILE_URL',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'SUPERADMIN_PASSWORD',
  ];
  const cleaned: NodeJS.ProcessEnv = { PATH: process.env.PATH };
  for (const key of Object.keys(process.env)) {
    if (!KNOWN.includes(key) && key !== 'PATH') {
      cleaned[key] = process.env[key];
    }
  }
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) {
      delete cleaned[k];
    } else {
      cleaned[k] = v;
    }
  }
  return spawnSync('node', [SCRIPT], { env: cleaned, encoding: 'utf8' });
}

const VALID_ENV = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pass@db:5432/app',
  JWT_SECRET: 'a'.repeat(40),
  NEXTAUTH_SECRET: 'b'.repeat(40),
  NEXT_PUBLIC_APP_URL: 'https://example.com',
  APP_URL: 'https://example.com',
  UPLOAD_DIR: '/app/uploads',
  ATTENDANCE_SELFIE_DIR: 'attendance-selfies',
  MAX_UPLOAD_SIZE: '5242880',
  MAX_SELFIE_SIZE_MB: '1',
  GPS_MAX_ACCURACY_METERS: '100',
  DEFAULT_GEOFENCE_RADIUS_METERS: '100',
  REJECT_OUTSIDE_GEOFENCE: 'true',
  GPS_TIMESTAMP_MAX_AGE_SECONDS: '120',
  ATTENDANCE_EXPORT_MAX_ROWS: '5000',
  PDF_REPORT_MAX_ROWS: '1000',
  PDF_REPORT_MAX_DATE_RANGE_MONTHS: '12',
  RESEND_API_KEY: 're_test_key',
  RESEND_FROM_EMAIL: 'MyProdusen <noreply@example.com>',
};

describe('check-production-env script', () => {
  it('passes when every required key is well-formed', () => {
    const result = run(VALID_ENV);
    expect(result.status).toBe(0);
  });

  it('fails when JWT_SECRET is shorter than 32 characters', () => {
    const result = run({ ...VALID_ENV, JWT_SECRET: 'short' });
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('JWT_SECRET');
  });

  it('fails when NODE_ENV is not production', () => {
    const result = run({ ...VALID_ENV, NODE_ENV: 'development' });
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('NODE_ENV');
  });

  it('fails when DATABASE_URL is not a postgres URL', () => {
    const result = run({ ...VALID_ENV, DATABASE_URL: 'mysql://user:pass@db:3306/app' });
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('DATABASE_URL');
  });

  it('fails when REJECT_OUTSIDE_GEOFENCE is not a boolean', () => {
    const result = run({ ...VALID_ENV, REJECT_OUTSIDE_GEOFENCE: 'maybe' });
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('REJECT_OUTSIDE_GEOFENCE');
  });

  it('rejects the dev fallback secret', () => {
    const result = run({ ...VALID_ENV, JWT_SECRET: 'dev-only-secret-change-me' });
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('dev fallback');
  });

  it('fails when Resend email config is missing', () => {
    const result = run({ ...VALID_ENV, RESEND_API_KEY: undefined });
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('RESEND_API_KEY');
  });
});
