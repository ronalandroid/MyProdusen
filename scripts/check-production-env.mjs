#!/usr/bin/env node
/**
 * Production environment readiness check.
 *
 * Does not print secret values. Reports only key names and shape/length issues.
 */

const ENV = process.env;
const errors = [];
const warnings = [];
const notes = [];

function required(name, predicate, message) {
  const value = ENV[name];
  if (value === undefined || value === '') {
    errors.push(`${name}: missing`);
    return;
  }
  if (predicate && !predicate(value)) {
    errors.push(`${name}: ${message}`);
  }
}

function recommended(name, predicate, message) {
  const value = ENV[name];
  if (value === undefined || value === '') {
    warnings.push(`${name}: missing (recommended)`);
    return;
  }
  if (predicate && !predicate(value)) {
    warnings.push(`${name}: ${message}`);
  }
}

function optional(name, predicate, message) {
  const value = ENV[name];
  if (value === undefined || value === '') return;
  if (predicate && !predicate(value)) {
    warnings.push(`${name}: ${message}`);
  }
}

function strictOptional(name, predicate, message) {
  const value = ENV[name];
  if (value === undefined || value === '') return;
  if (predicate && !predicate(value)) {
    errors.push(`${name}: ${message}`);
  }
}

function isProduction(value) {
  return value === 'production';
}

function isPostgres(value) {
  return /^postgres(ql)?:\/\//i.test(value) && value.includes('@');
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function minLength(length) {
  return (value) => String(value).length >= length;
}

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0;
}

function isBoolean(value) {
  return ['true', 'false', '1', '0'].includes(String(value).toLowerCase());
}

// Hard requirements
required('NODE_ENV', isProduction, 'must be "production"');
required('DATABASE_URL', isPostgres, 'must be a postgres URL and include credentials/host');
required('JWT_SECRET', minLength(32), 'must be at least 32 characters');
required('NEXTAUTH_SECRET', minLength(32), 'must be at least 32 characters');
required('NEXT_PUBLIC_APP_URL', isHttpUrl, 'must be a valid http(s) URL');
required('RESEND_API_KEY', minLength(8), 'must be configured for activation/reset email delivery');
required('RESEND_FROM_EMAIL', (v) => v.includes('@'), 'must contain an email address');

// Production safety preferences
if (ENV.NEXT_PUBLIC_APP_URL && !isHttpsUrl(ENV.NEXT_PUBLIC_APP_URL)) {
  warnings.push('NEXT_PUBLIC_APP_URL: should use https in production');
}

optional('UPLOAD_DIR', (v) => v.length > 0, 'must not be empty');
optional('MAX_UPLOAD_SIZE', isPositiveInt, 'must be a positive integer');
optional('MAX_SELFIE_SIZE_MB', isPositiveInt, 'must be a positive integer');
optional('DEFAULT_GEOFENCE_RADIUS', isPositiveInt, 'must be a positive integer');
optional('DEFAULT_GEOFENCE_RADIUS_METERS', isPositiveInt, 'must be a positive integer');
optional('GPS_MAX_ACCURACY_METERS', isPositiveInt, 'must be a positive integer');
optional('GPS_TIMESTAMP_MAX_AGE_SECONDS', isPositiveInt, 'must be a positive integer');
optional('SESSION_TIMEOUT_HOURS', isPositiveInt, 'must be a positive integer');
strictOptional('REJECT_OUTSIDE_GEOFENCE', isBoolean, 'must be boolean when present');
optional('ATTENDANCE_EXPORT_MAX_ROWS', isPositiveInt, 'must be a positive integer');
optional('PDF_REPORT_MAX_ROWS', isPositiveInt, 'must be a positive integer');
optional('PDF_REPORT_MAX_DATE_RANGE_MONTHS', isPositiveInt, 'must be a positive integer');
optional('REDIS_URL', isHttpUrl, 'must be a valid URL when present');
optional('NEXT_PUBLIC_ENABLE_PWA', isBoolean, 'must be boolean when present');
optional('NEXT_TELEMETRY_DISABLED', isBoolean, 'must be boolean when present');

// Bootstrap-only superadmin keys
optional('SUPERADMIN_EMAIL', (v) => /@/.test(v), 'must contain "@" when present');
if (ENV.SUPERADMIN_PASSWORD) {
  if (ENV.SUPERADMIN_PASSWORD.length < 12) {
    errors.push('SUPERADMIN_PASSWORD: must be at least 12 characters when present');
  }
  notes.push('SUPERADMIN_* present — rotate or remove after first login.');
}

// Guard rails
const weakSecrets = new Set([
  'dev-only-secret-change-me',
  'your-super-secret-jwt-key-change-this-in-production',
  'change-this-to-a-strong-32-character-secret',
]);
if (ENV.JWT_SECRET && weakSecrets.has(ENV.JWT_SECRET)) {
  errors.push('JWT_SECRET: matches the dev fallback or another known placeholder secret');
}

if (ENV.NEXTAUTH_SECRET && weakSecrets.has(ENV.NEXTAUTH_SECRET)) {
  errors.push('NEXTAUTH_SECRET: matches the dev fallback or another known placeholder secret');
}

if (ENV.DATABASE_URL && /:postgres(@|:postgres@)/.test(ENV.DATABASE_URL)) {
  warnings.push('DATABASE_URL: looks like default postgres user/password — confirm this is intentional');
}

for (const flag of [
  'TESTSPRITE_COMPAT_RESPONSE',
  'TESTSPRITE_DISABLE_RATE_LIMITS',
  'E2E_DISABLE_RATE_LIMITS',
  'TESTSPRITE_DISABLE_CSRF_ORIGIN',
  'E2E_DISABLE_CSRF_ORIGIN',
  'TESTSPRITE_DISABLE_SECURE_COOKIES',
]) {
  if (String(ENV[flag] || '').toLowerCase() === 'true') {
    errors.push(`${flag}: must not be true in production`);
  }
}

function summary(label, lines) {
  if (!lines.length) return;
  console.log(`\n${label}:`);
  for (const line of lines) console.log(`  - ${line}`);
}

summary('ERRORS', errors);
summary('WARNINGS', warnings);
summary('NOTES', notes);

if (!errors.length && !warnings.length) {
  console.log('Production env check passed.');
}

if (errors.length) {
  console.error(`\n${errors.length} error(s) found. Fix before deploying.`);
  process.exit(1);
}

if (warnings.length) {
  console.warn(`\n${warnings.length} warning(s) found. Review before deploying.`);
}
