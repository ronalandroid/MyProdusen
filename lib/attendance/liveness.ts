/**
 * Pure liveness/selfie-verification decision logic for attendance check-in/out.
 *
 * Replaces the previous hardcoded `selfieVerified: true`. Given the signals
 * reported by the client face detector, it decides whether a selfie is
 * verified and whether it should be flagged for admin review.
 *
 * Policy ("advisory + admin review"): it NEVER blocks a check-in — a
 * not-verified result simply sets `needsReview` so the selfie surfaces in the
 * admin grid. Unsupported devices (no ML) are allowed through but flagged, so
 * old phones are never locked out.
 */
export interface LivenessSignal {
  /** Face-detector confidence, 0..1. */
  score: number;
  /** Client liveness challenge result (blink / movement). */
  passed: boolean;
  /** Whether a face was detected at all. */
  faceDetected: boolean;
  /** Device/browser could not run the detector. */
  unsupported: boolean;
}

export interface LivenessVerdict {
  verified: boolean;
  needsReview: boolean;
  reason: string;
}

/** At or above this confidence (with a passed challenge) → verified. */
export const LIVENESS_VERIFIED_THRESHOLD = 0.7;
/** Below the verified threshold but at/above this → review band. */
export const LIVENESS_REVIEW_THRESHOLD = 0.5;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function evaluateLiveness(signal: LivenessSignal): LivenessVerdict {
  if (signal.unsupported) {
    return {
      verified: false,
      needsReview: true,
      reason: 'Perangkat tidak mendukung deteksi wajah — perlu tinjauan admin',
    };
  }

  if (!signal.faceDetected) {
    return { verified: false, needsReview: true, reason: 'Wajah tidak terdeteksi — perlu tinjauan admin' };
  }

  const score = clamp01(signal.score);

  if (signal.passed && score >= LIVENESS_VERIFIED_THRESHOLD) {
    return { verified: true, needsReview: false, reason: 'Liveness terverifikasi' };
  }

  if (score >= LIVENESS_REVIEW_THRESHOLD) {
    return { verified: false, needsReview: true, reason: 'Keyakinan liveness rendah — perlu tinjauan admin' };
  }

  return { verified: false, needsReview: true, reason: 'Liveness gagal — perlu tinjauan admin' };
}
