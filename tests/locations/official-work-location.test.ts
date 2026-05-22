import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateGpsAttendance } from '@/lib/attendance/gps-validation';

const seedScript = readFileSync('scripts/seed-work-location.mjs', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');
const locationsPage = readFileSync('app/dashboard/locations/page.tsx', 'utf8');
const attendancePage = readFileSync('app/dashboard/attendance/page.tsx', 'utf8');
const checkInRoute = readFileSync('app/api/attendance/check-in/route.ts', 'utf8');
const checkOutRoute = readFileSync('app/api/attendance/check-out/route.ts', 'utf8');

const officialLocation = {
  id: 'loc_produsen_dimsum_medan_tbm_grup',
  latitude: 3.6009125,
  longitude: 98.6964954,
  radius: 100,
  isActive: true,
};

describe('official work location and geofence contract', () => {
  it('ships a safe official work-location upsert script', () => {
    expect(seedScript).toContain('Produsen Dimsum Medan | TBM GRUP');
    expect(seedScript).toContain('3.6009125');
    expect(seedScript).toContain('98.6964954');
    expect(seedScript).toContain('radius = ${OFFICIAL_LOCATION.radius}');
    expect(seedScript).toContain('"isActive" = true');
    expect(seedScript).not.toMatch(/delete\s+from\s+"WorkLocation"/i);
    expect(packageJson).toContain('"seed:work-location": "node scripts/seed-work-location.mjs"');
  });

  it('accepts official coordinate and rejects spoofed outside coordinate on backend validation', () => {
    const inside = validateGpsAttendance(
      { latitude: 3.6009125, longitude: 98.6964954, accuracy: 10 },
      officialLocation,
      { rejectOutsideGeofence: true, maxAccuracyMeters: 100 },
    );
    expect(inside.decision).toBe('accept');

    const outside = validateGpsAttendance(
      { latitude: 3.5909125, longitude: 98.6964954, accuracy: 10 },
      officialLocation,
      { rejectOutsideGeofence: true, maxAccuracyMeters: 100 },
    );
    expect(outside.decision).toBe('reject');
    if (outside.decision === 'reject') expect(outside.geoStatus).toBe('OUTSIDE_RADIUS');
  });

  it('rejects bad GPS accuracy and missing work location through backend validator', () => {
    const badAccuracy = validateGpsAttendance(
      { latitude: 3.6009125, longitude: 98.6964954, accuracy: 150 },
      officialLocation,
      { maxAccuracyMeters: 100 },
    );
    expect(badAccuracy.decision).toBe('reject');
    if (badAccuracy.decision === 'reject') expect(badAccuracy.geoStatus).toBe('ACCURACY_TOO_LOW');

    const inactive = validateGpsAttendance(
      { latitude: 3.6009125, longitude: 98.6964954, accuracy: 10 },
      { ...officialLocation, isActive: false },
    );
    expect(inactive.decision).toBe('reject');
  });

  it('keeps frontend as preview only and shows Maps plus distance/radius UI', () => {
    expect(locationsPage).toContain('https://www.google.com/maps/search/?api=1&query=');
    expect(locationsPage).toContain('Open in Google Maps');
    expect(attendancePage).toContain('calculateDistanceMeters');
    expect(attendancePage).toContain('Jarak ke lokasi');
    expect(attendancePage).toContain('Radius resmi');
    expect(attendancePage).toContain('Lokasi kerja belum tersedia. Hubungi Superadmin.');
    expect(attendancePage).toContain('Anda berada di luar radius lokasi kerja');
    expect(attendancePage).toContain('Server tetap menghitung jarak resmi');
  });

  it('audits attendance accepted and rejected geofence decisions with metadata', () => {
    const routeSource = `${checkInRoute}\n${checkOutRoute}`;
    expect(routeSource).toContain('`${type}_REJECTED_OUTSIDE_RADIUS`');
    expect(routeSource).toContain('`${type}_REJECTED_GPS_ACCURACY`');
    expect(routeSource).toContain('`${type}_REJECTED_SELFIE`');
    expect(routeSource).toContain("getFailureAuditAction(error, 'CHECK_IN')");
    expect(routeSource).toContain("getFailureAuditAction(error, 'CHECK_OUT')");
    expect(routeSource).toContain('distanceMeters');
    expect(routeSource).toContain('radiusMeters');
    expect(routeSource).toContain('decision');
  });
});
