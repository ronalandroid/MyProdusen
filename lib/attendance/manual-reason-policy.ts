/**
 * Policy for attending from OUTSIDE the work-location radius.
 *
 * Product rule: inside the radius auto-approves; outside the radius is still
 * allowed BUT only with a written reason, and the entry is queued for
 * Superadmin review. No reason → the check-in/out is blocked and the employee
 * is told to add one.
 *
 * This module is the single source of truth for that gate so check-in and
 * check-out stay in lockstep.
 */

export const MANUAL_REASON_MIN_LENGTH = 10;

export const OUTSIDE_GEOFENCE_REASON_REQUIRED =
  'Anda berada di luar radius lokasi kerja. Untuk tetap absen, isi keterangan minimal 10 karakter.';

/** True when the employee supplied an acceptable outside-radius reason. */
export function hasValidManualReason(reason?: string | null): boolean {
  return typeof reason === 'string' && reason.trim().length >= MANUAL_REASON_MIN_LENGTH;
}

/**
 * Given the (optional) reason, decide how geo-fence validation should treat an
 * outside-radius position: reject it (no reason) or queue it for review (reason
 * present). Inside-radius is unaffected — validation always accepts it.
 */
export function resolveOutsideGeofencePolicy(reason?: string | null): {
  hasReason: boolean;
  rejectOutsideGeofence: boolean;
} {
  const hasReason = hasValidManualReason(reason);
  return { hasReason, rejectOutsideGeofence: !hasReason };
}
