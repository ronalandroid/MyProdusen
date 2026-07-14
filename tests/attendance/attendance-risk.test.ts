import { describe, expect, it } from 'vitest';
import { assessAttendanceRisk } from '@/lib/attendance/attendance-risk';

const clean = {
  livenessPassed: true,
  livenessScore: 0.95,
  faceDetected: true,
  livenessUnsupported: false,
  accuracyMeters: 8,
  distanceMeters: 20,
  radiusMeters: 200,
  geoStatus: 'INSIDE_RADIUS',
};

describe('assessAttendanceRisk', () => {
  it('rates a clean check-in as low risk with no reasons', () => {
    const r = assessAttendanceRisk(clean);
    expect(r.level).toBe('low');
    expect(r.reasons).toHaveLength(0);
  });

  it('flags high risk when liveness fails and no face is detected', () => {
    const r = assessAttendanceRisk({ ...clean, livenessPassed: false, faceDetected: false });
    expect(r.level).toBe('high');
    expect(r.reasons.join(' ')).toMatch(/liveness/i);
    expect(r.reasons.join(' ')).toMatch(/wajah tidak terdeteksi/i);
  });

  it('accumulates weak signals to high (unsupported + low score + poor GPS + edge)', () => {
    const r = assessAttendanceRisk({
      livenessPassed: true,
      livenessScore: 0.3,
      faceDetected: true,
      livenessUnsupported: true,
      accuracyMeters: 90,
      distanceMeters: 190,
      radiusMeters: 200,
      geoStatus: 'INSIDE_RADIUS',
    });
    expect(r.level).toBe('high');
    expect(r.reasons.length).toBeGreaterThanOrEqual(3);
  });

  it('does not double-flag an already-outside-radius case on the edge rule', () => {
    const r = assessAttendanceRisk({ ...clean, distanceMeters: 250, geoStatus: 'OUTSIDE_RADIUS' });
    expect(r.reasons.join(' ')).not.toMatch(/tepi radius/i);
  });

  it('a single weak signal stays low (below threshold)', () => {
    const r = assessAttendanceRisk({ ...clean, accuracyMeters: 90 });
    expect(r.level).toBe('low');
    expect(r.reasons.length).toBe(1);
  });
});
