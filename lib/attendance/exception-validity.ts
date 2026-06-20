// Validity classification for attendance exceptions.
//
// Turns the raw check-in signals (GPS accuracy, distance from the work site,
// whether a selfie exists, the geofence result) into one of three tiers so a
// reviewer can mass-process by trustworthiness instead of clicking every row:
//
//   VALID   — data looks trustworthy → safe to bulk approve
//   REVIEW  — borderline / not enough signal → needs a human look
//   INVALID — clearly problematic → safe to bulk reject
//
// Pure and dependency-free so it runs on the client and is easy to unit-test.

export type ValidityTier = "VALID" | "REVIEW" | "INVALID";

export interface ValiditySignals {
  /** Exception type, e.g. OUTSIDE_GEOFENCE, BAD_GPS_ACCURACY, MISSING_SELFIE. */
  type?: string | null;
  /** A selfie image is attached to the check-in. */
  hasSelfie?: boolean;
  /** GPS accuracy radius in metres (lower is better). */
  accuracyMeters?: number | null;
  /** Distance from the work location in metres (lower is better). */
  distanceMeters?: number | null;
  /** Server geofence verdict, e.g. INSIDE / OUTSIDE / PENDING. */
  geoStatus?: string | null;
}

export interface ValidityResult {
  tier: ValidityTier;
  /** 0–100, higher = more trustworthy. Useful for sorting. */
  score: number;
  /** Short human reasons, in Indonesian, explaining the verdict. */
  reasons: string[];
}

// Thresholds. Mirror the attendance capture defaults
// (GPS_MAX_ACCURACY_METERS=100, DEFAULT_GEOFENCE_RADIUS_METERS≈100–150).
export const ACCURACY_OK_M = 100;
export const ACCURACY_SEVERE_M = 250;
export const DISTANCE_OK_M = 150;
export const DISTANCE_SEVERE_M = 500;

const TIER_LABEL: Record<ValidityTier, string> = {
  VALID: "Valid",
  REVIEW: "Perlu Ditinjau",
  INVALID: "Tidak Valid",
};

export function validityLabel(tier: ValidityTier): string {
  return TIER_LABEL[tier];
}

export function classifyExceptionValidity(signals: ValiditySignals): ValidityResult {
  const reasons: string[] = [];
  const type = (signals.type || "").toUpperCase();
  const accuracy = numeric(signals.accuracyMeters);
  const distance = numeric(signals.distanceMeters);
  const geo = (signals.geoStatus || "").toUpperCase();
  const hasSelfie = signals.hasSelfie !== false; // default optimistic only if unknown

  let score = 100;
  let tier: ValidityTier = "VALID";

  const demote = (next: ValidityTier) => {
    const rank = { VALID: 0, REVIEW: 1, INVALID: 2 } as const;
    if (rank[next] > rank[tier]) tier = next;
  };

  // No selfie = no proof of who/where → hard invalid.
  if (signals.hasSelfie === false || type === "MISSING_SELFIE") {
    reasons.push("Tidak ada selfie sebagai bukti kehadiran");
    score -= 60;
    demote("INVALID");
  }

  // Geofence: explicit outside, or a large measured distance.
  if (distance !== null) {
    if (distance > DISTANCE_SEVERE_M) {
      reasons.push(`Sangat jauh dari lokasi kerja (${Math.round(distance)} m)`);
      score -= 55;
      demote("INVALID");
    } else if (distance > DISTANCE_OK_M) {
      reasons.push(`Di luar radius lokasi kerja (${Math.round(distance)} m)`);
      score -= 25;
      demote("REVIEW");
    } else {
      reasons.push(`Dalam radius lokasi kerja (${Math.round(distance)} m)`);
    }
  } else if (geo === "OUTSIDE" || type === "OUTSIDE_GEOFENCE") {
    reasons.push("Tercatat di luar radius lokasi kerja");
    score -= 30;
    demote("REVIEW");
  }

  // GPS accuracy quality.
  if (accuracy !== null) {
    if (accuracy > ACCURACY_SEVERE_M) {
      reasons.push(`Akurasi GPS sangat buruk (${Math.round(accuracy)} m)`);
      score -= 30;
      demote("REVIEW");
    } else if (accuracy > ACCURACY_OK_M) {
      reasons.push(`Akurasi GPS di atas batas (${Math.round(accuracy)} m)`);
      score -= 15;
      demote("REVIEW");
    } else {
      reasons.push(`Akurasi GPS baik (${Math.round(accuracy)} m)`);
    }
  } else if (type === "BAD_GPS_ACCURACY") {
    reasons.push("Akurasi GPS bermasalah");
    score -= 15;
    demote("REVIEW");
  }

  // Exceptions with no measurable signal (manual edits, missing checkout) can't
  // be auto-judged — keep them in REVIEW rather than auto-approving.
  if (accuracy === null && distance === null && geo === "" && tier === "VALID") {
    if (type && type !== "") {
      reasons.push("Tidak ada data lokasi/GPS untuk dinilai otomatis");
      demote("REVIEW");
      score -= 20;
    }
  }

  return { tier, score: clamp(score), reasons };
}

function numeric(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
