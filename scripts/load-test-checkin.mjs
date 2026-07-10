#!/usr/bin/env node
/**
 * Load test: N employees clocking in at the same instant.
 *
 * Seeds N distinct employees (+ one work location & shift), mints a JWT per
 * employee, then fires all N check-in POSTs concurrently against a running
 * app and reports latency percentiles, throughput, and error breakdown.
 * Cleans up everything it created afterwards.
 *
 *   CONCURRENCY=200 BASE_URL=http://localhost:3000 node scripts/load-test-checkin.mjs
 *
 * Env:
 *   BASE_URL        target app (default http://localhost:3000)
 *   CONCURRENCY     simultaneous check-ins (default 200)
 *   DATABASE_URL    seed/cleanup target (from .env if unset)
 *   JWT_SECRET      must match the running app so tokens verify (from .env)
 *
 * NOTE: run against a PRODUCTION build (npm run start:prod) or the staging
 * stack — never `next dev`, whose numbers are meaningless, and never live prod.
 */
import 'dotenv/config';
import postgres from 'postgres';
import jwt from 'jsonwebtoken';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const CONCURRENCY = Number(process.env.CONCURRENCY || 200);
const DATABASE_URL = (process.env.DATABASE_URL || '').replace(/\?schema=public$/, '');
const JWT_SECRET = process.env.JWT_SECRET;
// Mutations are CSRF-guarded against the configured APP_URL origin, so send
// that as Origin (spoofable locally since we own the server under test).
const ORIGIN = process.env.LOADTEST_ORIGIN || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || BASE_URL;
const RUN = `loadtest_${Date.now()}`;
const LOC_LAT = 3.5952;
const LOC_LNG = 98.6722;

if (!DATABASE_URL) throw new Error('DATABASE_URL required');
if (!JWT_SECRET) throw new Error('JWT_SECRET required (must match the running app)');

// A real 1x1 PNG (valid signature so validateImageSignature passes).
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const sql = postgres(DATABASE_URL, { max: 10 });

const locId = `${RUN}_loc`;
const shiftId = `${RUN}_shift`;

async function seed() {
  await sql`insert into "WorkLocation" (id, name, address, latitude, longitude, radius, "isActive")
            values (${locId}, ${'LoadTest Loc'}, ${'Jl. LoadTest'}, ${LOC_LAT}, ${LOC_LNG}, ${150}, ${true})`;
  await sql`insert into "Shift" (id, name, "startTime", "endTime", "isActive")
            values (${shiftId}, ${'LoadTest Shift'}, ${'00:00'}, ${'23:59'}, ${true})`;

  const users = [];
  const emps = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    const uid = `${RUN}_u${i}`;
    const eid = `${RUN}_e${i}`;
    users.push({ id: uid, email: `${uid}@loadtest.local`, username: uid, password: 'x', role: 'EMPLOYEE', isActive: true });
    emps.push({
      id: eid, nip: `LT${i}`, userId: uid, fullName: `LoadTest ${i}`, email: `${uid}@loadtest.local`,
      phone: '0810', address: 'a', division: 'd', position: 'p', status: 'ACTIVE',
      joinDate: new Date(), defaultLocationId: locId, defaultShiftId: shiftId,
    });
  }
  // Batch insert.
  await sql`insert into "User" ${sql(users, 'id', 'email', 'username', 'password', 'role', 'isActive')}`;
  await sql`insert into "Employee" ${sql(emps, 'id', 'nip', 'userId', 'fullName', 'email', 'phone', 'address', 'division', 'position', 'status', 'joinDate', 'defaultLocationId', 'defaultShiftId')}`;
  return users;
}

function tokenFor(user) {
  return jwt.sign({ userId: user.id, email: user.email, role: 'EMPLOYEE' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '8h' });
}

async function oneCheckIn(user) {
  const fd = new FormData();
  fd.set('latitude', String(LOC_LAT));
  fd.set('longitude', String(LOC_LNG));
  fd.set('accuracy', '8');
  fd.set('gpsTimestamp', new Date().toISOString());
  fd.set('type', 'clock-in');
  fd.set('workLocationId', locId);
  fd.set('shiftId', shiftId);
  fd.set('deviceInfo', 'loadtest');
  fd.set('livenessScore', '0');
  fd.set('livenessPassed', 'false');
  fd.set('faceDetected', 'false');
  fd.set('livenessUnsupported', 'true');
  fd.set('selfie', new Blob([PNG_1X1], { type: 'image/png' }), 'selfie.png');

  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        Cookie: `myprodusen_token=${tokenFor(user)}`,
        Origin: ORIGIN,
        'Idempotency-Key': `${user.id}-checkin`,
      },
      body: fd,
    });
    const ms = performance.now() - t0;
    return { ms, status: res.status, ok: res.ok };
  } catch (err) {
    return { ms: performance.now() - t0, status: 0, ok: false, err: String(err?.message || err) };
  }
}

function pct(sorted, p) {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

async function cleanup() {
  await sql`delete from "Attendance" where "employeeId" like ${RUN + '%'}`;
  await sql`delete from "Employee" where id like ${RUN + '%'}`;
  await sql`delete from "User" where id like ${RUN + '%'}`;
  await sql`delete from "Shift" where id = ${shiftId}`;
  await sql`delete from "WorkLocation" where id = ${locId}`;
}

(async () => {
  console.log(`Load test: ${CONCURRENCY} simultaneous check-ins → ${BASE_URL}`);
  console.log('Seeding…');
  const users = await seed();

  console.log('Firing all requests concurrently…');
  const wall0 = performance.now();
  const results = await Promise.all(users.map(oneCheckIn));
  const wallMs = performance.now() - wall0;

  const oks = results.filter((r) => r.ok || r.status === 409);
  const fails = results.filter((r) => !(r.ok || r.status === 409));
  const lat = results.map((r) => r.ms).sort((a, b) => a - b);
  const byStatus = {};
  for (const r of results) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  const errSamples = [...new Set(fails.map((r) => r.err).filter(Boolean))].slice(0, 3);

  console.log('\n================ RESULT ================');
  console.log(`Concurrency          : ${CONCURRENCY}`);
  console.log(`Wall clock (all done): ${wallMs.toFixed(0)} ms`);
  console.log(`Throughput           : ${(CONCURRENCY / (wallMs / 1000)).toFixed(1)} req/s`);
  console.log(`Success (2xx+409)    : ${oks.length}/${CONCURRENCY} (${((oks.length / CONCURRENCY) * 100).toFixed(1)}%)`);
  console.log(`Failed               : ${fails.length}`);
  console.log(`Latency p50 / p95 / p99 / max : ${pct(lat, 50).toFixed(0)} / ${pct(lat, 95).toFixed(0)} / ${pct(lat, 99).toFixed(0)} / ${lat[lat.length - 1].toFixed(0)} ms`);
  console.log(`Status breakdown     : ${JSON.stringify(byStatus)}`);
  if (errSamples.length) console.log(`Error samples        : ${JSON.stringify(errSamples)}`);
  console.log('========================================\n');

  console.log('Cleaning up…');
  await cleanup();
  await sql.end();
  console.log('Done.');
  process.exit(fails.length > CONCURRENCY * 0.02 ? 1 : 0); // fail if >2% error
})().catch(async (e) => {
  console.error('LOAD TEST ERROR:', e);
  try { await cleanup(); await sql.end(); } catch {}
  process.exit(1);
});
