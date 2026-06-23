import { describe, it, expect } from 'vitest';
import {
  evaluateLiveness,
  LIVENESS_VERIFIED_THRESHOLD,
  LIVENESS_REVIEW_THRESHOLD,
} from './liveness';

describe('evaluateLiveness', () => {
  it('verifies a confident, passed, face-detected signal', () => {
    const v = evaluateLiveness({ score: 0.92, passed: true, faceDetected: true, unsupported: false });
    expect(v.verified).toBe(true);
    expect(v.needsReview).toBe(false);
  });

  it('flags (never blocks) an unsupported device for admin review', () => {
    const v = evaluateLiveness({ score: 0, passed: false, faceDetected: false, unsupported: true });
    expect(v.verified).toBe(false);
    expect(v.needsReview).toBe(true);
    expect(v.reason).toMatch(/tidak mendukung|tinjauan/i);
  });

  it('flags when no face was detected', () => {
    const v = evaluateLiveness({ score: 0.8, passed: true, faceDetected: false, unsupported: false });
    expect(v.verified).toBe(false);
    expect(v.needsReview).toBe(true);
    expect(v.reason).toMatch(/wajah/i);
  });

  it('does not verify when the liveness challenge did not pass', () => {
    const v = evaluateLiveness({ score: 0.95, passed: false, faceDetected: true, unsupported: false });
    expect(v.verified).toBe(false);
    expect(v.needsReview).toBe(true);
  });

  it('flags a mid-confidence score (review band) instead of verifying', () => {
    const mid = (LIVENESS_VERIFIED_THRESHOLD + LIVENESS_REVIEW_THRESHOLD) / 2;
    const v = evaluateLiveness({ score: mid, passed: true, faceDetected: true, unsupported: false });
    expect(v.verified).toBe(false);
    expect(v.needsReview).toBe(true);
  });

  it('verifies exactly at the verified threshold', () => {
    const v = evaluateLiveness({ score: LIVENESS_VERIFIED_THRESHOLD, passed: true, faceDetected: true, unsupported: false });
    expect(v.verified).toBe(true);
  });

  it('treats a very low score as failed (still review, never silent-pass)', () => {
    const v = evaluateLiveness({ score: 0.1, passed: true, faceDetected: true, unsupported: false });
    expect(v.verified).toBe(false);
    expect(v.needsReview).toBe(true);
  });

  it('clamps out-of-range scores defensively', () => {
    expect(evaluateLiveness({ score: 5, passed: true, faceDetected: true, unsupported: false }).verified).toBe(true);
    expect(evaluateLiveness({ score: -1, passed: true, faceDetected: true, unsupported: false }).verified).toBe(false);
  });
});
