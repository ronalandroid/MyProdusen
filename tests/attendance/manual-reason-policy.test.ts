import { describe, it, expect } from 'vitest';
import {
  hasValidManualReason,
  resolveOutsideGeofencePolicy,
  MANUAL_REASON_MIN_LENGTH,
  OUTSIDE_GEOFENCE_REASON_REQUIRED,
} from '@/lib/attendance/manual-reason-policy';

describe('manual-reason-policy', () => {
  it('rejects missing / short reasons', () => {
    expect(hasValidManualReason(undefined)).toBe(false);
    expect(hasValidManualReason(null)).toBe(false);
    expect(hasValidManualReason('')).toBe(false);
    expect(hasValidManualReason('   ')).toBe(false);
    expect(hasValidManualReason('pendek')).toBe(false); // < 10 chars
  });

  it('accepts a reason of at least the minimum length (after trim)', () => {
    expect(hasValidManualReason('a'.repeat(MANUAL_REASON_MIN_LENGTH))).toBe(true);
    expect(hasValidManualReason('  dinas ke cabang lain  ')).toBe(true);
  });

  it('outside-radius is REJECTED when no reason is given', () => {
    const p = resolveOutsideGeofencePolicy('');
    expect(p.hasReason).toBe(false);
    expect(p.rejectOutsideGeofence).toBe(true); // → validation rejects outside radius
  });

  it('outside-radius is QUEUED FOR REVIEW (allowed) when a reason is given', () => {
    const p = resolveOutsideGeofencePolicy('sedang dinas luar kota hari ini');
    expect(p.hasReason).toBe(true);
    expect(p.rejectOutsideGeofence).toBe(false); // → validation returns 'pending'
  });

  it('exposes a clear reason-required message', () => {
    expect(OUTSIDE_GEOFENCE_REASON_REQUIRED).toMatch(/keterangan/i);
  });
});
