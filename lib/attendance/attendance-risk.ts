/**
 * Suspicious-attendance detection (kebijakan owner #13). Combines weak signals
 * that individually pass the hard gates but together look off — mainly liveness
 * / selfie-verification quality — into a single risk verdict. A HIGH verdict
 * raises a warning notification to Superadmin for review. Pure & testable; the
 * caller decides what to do with the result (never blocks a check-in).
 */

export interface AttendanceRiskInput {
  livenessPassed: boolean;
  livenessScore?: number;
  faceDetected?: boolean;
  livenessUnsupported?: boolean;
  accuracyMeters?: number;
  distanceMeters?: number;
  radiusMeters?: number;
  /** Geo verdict; an already-pending outside-radius case is reviewed elsewhere. */
  geoStatus?: string;
}

export type AttendanceRiskLevel = 'low' | 'high';

export interface AttendanceRiskResult {
  level: AttendanceRiskLevel;
  score: number;
  reasons: string[];
}

// Tunable thresholds (kept as named constants — no magic numbers).
export const HIGH_RISK_THRESHOLD = 3;
export const LOW_LIVENESS_SCORE = 0.5;
export const POOR_GPS_ACCURACY_METERS = 60;

export function assessAttendanceRisk(input: AttendanceRiskInput): AttendanceRiskResult {
  let score = 0;
  const reasons: string[] = [];

  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(reason);
  };

  if (!input.livenessPassed) {
    add(2, 'Verifikasi wajah (liveness) tidak lolos');
  }
  if (input.faceDetected === false) {
    add(2, 'Wajah tidak terdeteksi pada selfie');
  }
  if (input.livenessUnsupported) {
    add(1, 'Perangkat tidak mendukung verifikasi wajah');
  }
  if (input.livenessPassed && typeof input.livenessScore === 'number' && input.livenessScore < LOW_LIVENESS_SCORE) {
    add(1, `Skor liveness rendah (${input.livenessScore.toFixed(2)})`);
  }
  if (typeof input.accuracyMeters === 'number' && input.accuracyMeters > POOR_GPS_ACCURACY_METERS) {
    add(1, `Akurasi GPS lemah (${Math.round(input.accuracyMeters)} m)`);
  }
  // Sitting exactly on the geofence edge (>90% of radius) is a common spoof tell.
  if (
    typeof input.distanceMeters === 'number' &&
    typeof input.radiusMeters === 'number' &&
    input.radiusMeters > 0 &&
    input.distanceMeters > input.radiusMeters * 0.9 &&
    input.geoStatus !== 'OUTSIDE_RADIUS'
  ) {
    add(1, 'Lokasi tepat di tepi radius geofence');
  }

  return {
    level: score >= HIGH_RISK_THRESHOLD ? 'high' : 'low',
    score,
    reasons,
  };
}
