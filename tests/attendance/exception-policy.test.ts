import { describe, expect, it } from 'vitest';
import { getAttendanceExceptionTrigger } from '@/lib/attendance/exception-policy';

describe('attendance exception policy', () => {
  it('flags bad GPS accuracy before geofence checks', () => {
    expect(getAttendanceExceptionTrigger({ accuracy: 150, distance: 20, radius: 100, selfiePresent: true })).toEqual({
      type: 'BAD_GPS_ACCURACY',
      reason: 'Akurasi GPS 150m melebihi batas 100m',
    });
  });

  it('flags outside geofence when distance exceeds location radius', () => {
    expect(getAttendanceExceptionTrigger({ accuracy: 20, distance: 145, radius: 100, selfiePresent: true })).toEqual({
      type: 'OUTSIDE_GEOFENCE',
      reason: 'Jarak 145m di luar radius 100m',
    });
  });

  it('flags missing selfie', () => {
    expect(getAttendanceExceptionTrigger({ accuracy: 20, distance: 50, radius: 100, selfiePresent: false })).toEqual({
      type: 'MISSING_SELFIE',
      reason: 'Selfie absensi belum tersedia',
    });
  });

  it('returns null when attendance evidence is acceptable', () => {
    expect(getAttendanceExceptionTrigger({ accuracy: 20, distance: 50, radius: 100, selfiePresent: true })).toBeNull();
  });
});
