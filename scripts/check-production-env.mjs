#!/usr/bin/env node
/**
 * Static check of the production env surface documented in
 * /docs/DEPLOYMENT.md and /docs/COOLIFY.md.
 *
 *   node scripts/check-production-env.mjs
 *
 * Exits non-zero if any required key is missing, malformed, or unsafe. Run
 * this against the staging shell (or `coolify env exec ... -- node ...`)
 * before promoting a release.
 *
 * It does NOT print secret values. It only reports key names, lengths, and
 * shape mismatches.
 */

const ENV = process.env;
const errors = [];
const warnings = [];
const notes = [];

function require(name, predicate, message) {
  const value = ENV[name];
  if (value === undefined || value === '') {
    errors.push(`${name}: missing`);
    return;
  }
  if (predicate && !predicate(value)) {
    errors.push(`${name}: ${message}`);
  }
}

function suggest(name, predicate, message) {
  const value = ENV[name];
  if (value === undefined || value === '') {
    warnings.push(`${name}: missing (recommended)`);
    return;
  }
  if (predicate && !predicate(value)) {
    warnings.push(`${name}: ${message}`);
  }
}

function isHttps(value) {
  return /^https?:\/\//i.test(value);
}

function isPostgres(value) {
  return /^postgres(ql)?:\/\//i.test(value);
}

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0;
}

function isBoolean(value) {
  return ['true', 'false', '1', '0'].includes(String(value).toLowerCase());
}

// ---------------- Hard requirements ------------------------------------------

require('NODE_ENV', (v) => v === 'production', 'must be "production"');
require('DATABASE_URL', isPostgres, 'must start with postgres:// or postgresql://');
require('JWT_SECRET', (v) => v.length >= 32, 'must be at least 32 characters');
require('NEXT_PUBLIC_APP_URL', isHttps, 'must be an HTTP(S) URL');
require('APP_URL', isHttps, 'must be an HTTP(S) URL');

// Selfie + storage
require('UPLOAD_DIR', (v) => v.startsWith('/'), 'must be an absolute path');
require('ATTENDANCE_SELFIE_DIR', (v) => v.length > 0, 'must be a non-empty subdirectory');
require('MAX_SELFIE_SIZE_MB', isPositiveInt, 'must be a positive integer');

// GPS / geo-fence
require('GPS_MAX_ACCURACY_METERS', isPositiveInt, 'must be a positive integer');
require('DEFAULT_GEOFENCE_RADIUS_METERS', isPositiveInt, 'must be a positive integer');
require('REJECT_OUTSIDE_GEOFENCE', isBoolean, 'must be true or false');
require('GPS_TIMESTAMP_MAX_AGE_SECONDS', (v) => /^\d+$/.test(v), 'must be a non-negative integer');

// Reports
require('ATTENDANCE_EXPORT_MAX_ROWS', isPositiveInt, 'must be a positive integer');

// ---------------- Recommended but not strictly required ----------------------

suggest('NEXTAUTH_SECRET', (v) => v.length >= 32, 'must be at least 32 characters');
suggest('NEXTAUTH_URL', isHttps, 'must be an HTTP(S) URL');
suggest('NEXT_PUBLIC_SELFIE_MAX_WIDTH', isPositiveInt, 'must be a positive integer');
suggest('NEXT_PUBLIC_SELFIE_MAX_HEIGHT', isPositiveInt, 'must be a positive integer');
suggest('NEXT_PUBLIC_SELFIE_IMAGE_QUALITY', (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= 1;
}, 'must be a number between 0 and 1');
suggest('NEXT_PUBLIC_SELFIE_TARGET_SIZE_KB', isPositiveInt, 'must be a positive integer');
suggest('NEXT_PUBLIC_OSM_TILE_URL', (v) => /\{z\}.*\{x\}.*\{y\}/.test(v), 'must contain {z}, {x}, {y} placeholders');
require('RESEND_API_KEY', (v) => /^re_/.test(v), 'expected to start with "re_"');
require('RESEND_FROM_EMAIL', (v) => /@/.test(v), 'must contain "@"');

// ---------------- Bootstrap-only superadmin keys -----------------------------

if (ENV.SUPERADMIN_PASSWORD) {
  if (ENV.SUPERADMIN_PASSWORD.length < 12) {
    errors.push('SUPERADMIN_PASSWORD: must be at least 12 characters when present');
  }
  notes.push('SUPERADMIN_* present — rotate or remove after first login.');
}

// ---------------- Sanity rails -----------------------------------------------

if (ENV.JWT_SECRET && ENV.JWT_SECRET === 'dev-only-secret-change-me') {
  errors.push('JWT_SECRET: matches the dev fallback — replace before deploy');
}

if (ENV.DATABASE_URL && /:postgres(@|:postgres@)/.test(ENV.DATABASE_URL)) {
  warnings.push('DATABASE_URL: looks like the default postgres user/password — confirm this is intentional');
}

// ---------------- Output -----------------------------------------------------

const summary = (label, lines) => {
  if (!lines.length) return;
  console.log(`\n${label}:`);
  for (const line of lines) console.log(`  - ${line}`);
};

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
