import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateGpsAttendance } from '@/lib/attendance/gps-validation';

const ORIGINAL_REJECT = process.env.REJECT_OUTSIDE_GEOFENCE;
const ORIGINAL_MAX_ACC = process.env.GPS_MAX_ACCURACY_METERS;
const ORIGINAL_MAX_AGE = process.env.GPS_TIMESTAMP_MAX_AGE_SECONDS;

const LOCATION = { id: 'loc_test', latitude: 3.5952, longitude: 98.6722, radius: 100, isActive: true };

beforeEach(() => {
  delete process.env.REJECT_OUTSIDE_GEOFENCE;
  process.env.GPS_MAX_ACCURACY_METERS = '100';
  process.env.GPS_TIMESTAMP_MAX_AGE_SECONDS = '120';
});

afterEach(() => {
  if (ORIGINAL_REJECT === undefined) delete process.env.REJECT_OUTSIDE_GEOFENCE;
  else process.env.REJECT_OUTSIDE_GEOFENCE = ORIGINAL_REJECT;
  if (ORIGINAL_MAX_ACC === undefined) delete process.env.GPS_MAX_ACCURACY_METERS;
  else process.env.GPS_MAX_ACCURACY_METERS = ORIGINAL_MAX_ACC;
  if (ORIGINAL_MAX_AGE === undefined) delete process.env.GPS_TIMESTAMP_MAX_AGE_SECONDS;
  else process.env.GPS_TIMESTAMP_MAX_AGE_SECONDS = ORIGINAL_MAX_AGE;
});

describe('GPS attendance validation', () => {
  it('accepts inside-radius coordinates with good accuracy', () => {
    const r = validateGpsAttendance(
      { latitude: 3.5952, longitude: 98.6722, accuracy: 10 },
      LOCATION,
    );
    expect(r.decision).toBe('accept');
    expect(r.geoStatus).toBe('INSIDE_RADIUS');
    expect(r.distanceMeters).toBeLessThanOrEqual(100);
  });

  it('rejects missing latitude', () => {
    const r = validateGpsAttendance(
      { latitude: null, longitude: 98.6722, accuracy: 10 },
      LOCATION,
    );
    expect(r.decision).toBe('reject');
    if (r.decision === 'reject') expect(r.errorCode).toBe('ATTENDANCE_GPS_REQUIRED');
  });

  it('rejects out-of-range latitude', () => {
    const r = validateGpsAttendance(
      { latitude: 95, longitude: 98.6722, accuracy: 10 },
      LOCATION,
    );
    expect(r.decision).toBe('reject');
  });

  it('rejects out-of-range longitude', () => {
    const r = validateGpsAttendance(
      { latitude: 3.5952, longitude: 200, accuracy: 10 },
      LOCATION,
    );
    expect(r.decision).toBe('reject');
  });

  it('rejects accuracy above GPS_MAX_ACCURACY_METERS', () => {
    const r = validateGpsAttendance(
      { latitude: 3.5952, longitude: 98.6722, accuracy: 150 },
      LOCATION,
    );
    expect(r.decision).toBe('reject');
    if (r.decision === 'reject') expect(r.geoStatus).toBe('ACCURACY_TOO_LOW');
  });

  it('rejects stale GPS timestamp', () => {
    process.env.GPS_TIMESTAMP_MAX_AGE_SECONDS = '60';
    const stale = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const r = validateGpsAttendance(
      { latitude: 3.5952, longitude: 98.6722, accuracy: 10, capturedAt: stale },
      LOCATION,
    );
    expect(r.decision).toBe('reject');
  });

  it('rejects inactive work location', () => {
    const r = validateGpsAttendance(
      { latitude: 3.5952, longitude: 98.6722, accuracy: 10 },
      { ...LOCATION, isActive: false },
    );
    expect(r.decision).toBe('reject');
  });

  it('rejects when outside radius and REJECT_OUTSIDE_GEOFENCE=true', () => {
    process.env.REJECT_OUTSIDE_GEOFENCE = 'true';
    const r = validateGpsAttendance(
      { latitude: 3.6, longitude: 98.6722, accuracy: 10 },
      LOCATION,
    );
    expect(r.decision).toBe('reject');
    if (r.decision === 'reject') expect(r.geoStatus).toBe('OUTSIDE_RADIUS');
  });

  it('marks pending when outside radius and REJECT_OUTSIDE_GEOFENCE=false', () => {
    process.env.REJECT_OUTSIDE_GEOFENCE = 'false';
    const r = validateGpsAttendance(
      { latitude: 3.6, longitude: 98.6722, accuracy: 10 },
      LOCATION,
    );
    expect(r.decision).toBe('pending');
    if (r.decision === 'pending') {
      expect(r.geoStatus).toBe('PENDING_REVIEW');
      expect(r.distanceMeters).toBeGreaterThan(100);
    }
  });

  it('exposes serializable metadata for audit', () => {
    const r = validateGpsAttendance(
      { latitude: 3.5952, longitude: 98.6722, accuracy: 10 },
      LOCATION,
    );
    expect(r.metadata.maxAccuracyMeters).toBe(100);
    expect(r.metadata.workLocationId).toBe('loc_test');
    expect(r.metadata.distanceMeters).not.toBeNull();
  });
});
