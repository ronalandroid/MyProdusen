/**
 * Hardened GPS + geo-fence validation for attendance.
 *
 * Used by both `src/services/attendance/attendance.service.ts` and
 * `features/attendance/attendance.service.ts`. Backend never trusts the
 * frontend's distance or "inside radius" decision — all checks happen here.
 *
 * Inputs validated:
 *   - latitude, longitude presence and numeric range
 *   - GPS accuracy (must be <= GPS_MAX_ACCURACY_METERS)
 *   - Optional client timestamp freshness (GPS_TIMESTAMP_MAX_AGE_SECONDS)
 *   - Work location existence and active status
 *   - Server-side Haversine distance vs work-location radius
 *
 * Outputs an explicit `geoStatus` plus a `decision` (`accept` | `pending` |
 * `reject`) that callers translate into success, exception creation, or
 * thrown error.
 */

import { calculateDistance } from '@/lib/geofencing';
import { AppError } from '@/lib/core/app-error';

export type CheckGeoStatus =
  | 'INSIDE_RADIUS'
  | 'OUTSIDE_RADIUS'
  | 'PENDING_REVIEW'
  | 'ACCURACY_TOO_LOW'
  | 'GPS_UNAVAILABLE';

export type GpsValidationDecision = 'accept' | 'pending' | 'reject';

export interface GpsInput {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  accuracy: number | null | undefined;
  /** Optional ISO/epoch from the client. Treated as untrusted hint only. */
  capturedAt?: Date | string | number | null;
}

export interface WorkLocationInput {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
}

export interface GpsValidationOptions {
  /** Default 100m. Override per-environment via GPS_MAX_ACCURACY_METERS. */
  maxAccuracyMeters?: number;
  /** Default 120 seconds. 0 disables the check. */
  maxTimestampAgeSeconds?: number;
  /** When true (default), outside-radius rejects. When false, the call is queued for review. */
  rejectOutsideGeofence?: boolean;
  /** Default 30 seconds. Rejects client GPS timestamps too far in the future. */
  maxFutureTimestampSkewSeconds?: number;
}

export interface SuccessfulValidation {
  decision: 'accept';
  geoStatus: 'INSIDE_RADIUS';
  distanceMeters: number;
  withinRadius: true;
  metadata: GpsValidationMetadata;
}

export interface PendingValidation {
  decision: 'pending';
  geoStatus: 'PENDING_REVIEW';
  distanceMeters: number;
  withinRadius: false;
  reason: string;
  metadata: GpsValidationMetadata;
}

export interface RejectedValidation {
  decision: 'reject';
  geoStatus: Exclude<CheckGeoStatus, 'INSIDE_RADIUS' | 'PENDING_REVIEW'>;
  distanceMeters: number | null;
  withinRadius: false;
  reason: string;
  errorCode: string;
  metadata: GpsValidationMetadata;
}

export type GpsValidationResult = SuccessfulValidation | PendingValidation | RejectedValidation;

export interface GpsValidationMetadata {
  validatedAt: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  capturedAt: string | null;
  timestampAgeSeconds: number | null;
  maxAccuracyMeters: number;
  rejectOutsideGeofence: boolean;
  workLocationId: string | null;
  workLocationRadius: number | null;
  distanceMeters: number | null;
}

const DEFAULT_MAX_ACCURACY = 100;
const DEFAULT_TIMESTAMP_MAX_AGE = 120;
const DEFAULT_FUTURE_TIMESTAMP_SKEW = 30;

export function getGpsMaxAccuracyMeters(): number {
  const raw = Number(process.env.GPS_MAX_ACCURACY_METERS || '');
  if (Number.isFinite(raw) && raw > 0) return raw;
  return DEFAULT_MAX_ACCURACY;
}

export function getGpsTimestampMaxAgeSeconds(): number {
  const raw = Number(process.env.GPS_TIMESTAMP_MAX_AGE_SECONDS || '');
  if (Number.isFinite(raw) && raw >= 0) return raw;
  return DEFAULT_TIMESTAMP_MAX_AGE;
}

export function getRejectOutsideGeofence(): boolean {
  const raw = String(process.env.REJECT_OUTSIDE_GEOFENCE || 'true').toLowerCase().trim();
  return !(raw === 'false' || raw === '0' || raw === 'no');
}

function toDate(value: GpsInput['capturedAt']): Date | null {
  if (value === null || value === undefined) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isValidLatitude(lat: unknown): lat is number {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

function isValidLongitude(lon: unknown): lon is number {
  return typeof lon === 'number' && Number.isFinite(lon) && lon >= -180 && lon <= 180;
}

function isValidAccuracy(acc: unknown): acc is number {
  return typeof acc === 'number' && Number.isFinite(acc) && acc >= 0;
}

export function validateGpsAttendance(
  gps: GpsInput,
  workLocation: WorkLocationInput,
  options: GpsValidationOptions = {},
): GpsValidationResult {
  const maxAccuracyMeters = options.maxAccuracyMeters ?? getGpsMaxAccuracyMeters();
  const maxTimestampAgeSeconds = options.maxTimestampAgeSeconds ?? getGpsTimestampMaxAgeSeconds();
  const maxFutureTimestampSkewSeconds = options.maxFutureTimestampSkewSeconds ?? DEFAULT_FUTURE_TIMESTAMP_SKEW;
  const rejectOutsideGeofence = options.rejectOutsideGeofence ?? getRejectOutsideGeofence();
  const capturedAtDate = toDate(gps.capturedAt);
  const validatedAt = new Date();
  const rawTimestampAgeSeconds = capturedAtDate
    ? Math.round((validatedAt.getTime() - capturedAtDate.getTime()) / 1000)
    : null;
  const timestampAgeSeconds = rawTimestampAgeSeconds === null ? null : Math.max(0, rawTimestampAgeSeconds);

  const baseMetadata: GpsValidationMetadata = {
    validatedAt: validatedAt.toISOString(),
    latitude: typeof gps.latitude === 'number' && Number.isFinite(gps.latitude) ? gps.latitude : null,
    longitude: typeof gps.longitude === 'number' && Number.isFinite(gps.longitude) ? gps.longitude : null,
    accuracy: typeof gps.accuracy === 'number' && Number.isFinite(gps.accuracy) ? gps.accuracy : null,
    capturedAt: capturedAtDate ? capturedAtDate.toISOString() : null,
    timestampAgeSeconds,
    maxAccuracyMeters,
    rejectOutsideGeofence,
    workLocationId: workLocation?.id ?? null,
    workLocationRadius: workLocation?.radius ?? null,
    distanceMeters: null,
  };

  if (!isValidLatitude(gps.latitude) || !isValidLongitude(gps.longitude)) {
    return {
      decision: 'reject',
      geoStatus: 'GPS_UNAVAILABLE',
      distanceMeters: null,
      withinRadius: false,
      reason: 'Lokasi GPS tidak valid. Pastikan GPS aktif dan sinyal kuat.',
      errorCode: 'ATTENDANCE_GPS_REQUIRED',
      metadata: baseMetadata,
    };
  }

  if (!isValidAccuracy(gps.accuracy)) {
    return {
      decision: 'reject',
      geoStatus: 'GPS_UNAVAILABLE',
      distanceMeters: null,
      withinRadius: false,
      reason: 'Akurasi GPS tidak tersedia. Coba ulangi setelah sinyal stabil.',
      errorCode: 'ATTENDANCE_GPS_REQUIRED',
      metadata: baseMetadata,
    };
  }

  if (gps.accuracy > maxAccuracyMeters) {
    return {
      decision: 'reject',
      geoStatus: 'ACCURACY_TOO_LOW',
      distanceMeters: null,
      withinRadius: false,
      reason: `Akurasi GPS ${Math.round(gps.accuracy)}m melebihi batas ${maxAccuracyMeters}m.`,
      errorCode: 'GPS_ACCURACY_TOO_LOW',
      metadata: baseMetadata,
    };
  }

  if (capturedAtDate && rawTimestampAgeSeconds !== null && rawTimestampAgeSeconds < -maxFutureTimestampSkewSeconds) {
    return {
      decision: 'reject',
      geoStatus: 'GPS_UNAVAILABLE',
      distanceMeters: null,
      withinRadius: false,
      reason: 'Waktu GPS tidak valid. Sinkronkan jam perangkat lalu coba lagi.',
      errorCode: 'ATTENDANCE_GPS_REQUIRED',
      metadata: baseMetadata,
    };
  }

  if (capturedAtDate && maxTimestampAgeSeconds > 0 && timestampAgeSeconds !== null && timestampAgeSeconds > maxTimestampAgeSeconds) {
    return {
      decision: 'reject',
      geoStatus: 'GPS_UNAVAILABLE',
      distanceMeters: null,
      withinRadius: false,
      reason: `Waktu GPS terlalu lama (${timestampAgeSeconds}s). Maksimal ${maxTimestampAgeSeconds}s.`,
      errorCode: 'ATTENDANCE_GPS_REQUIRED',
      metadata: baseMetadata,
    };
  }

  if (!workLocation || !workLocation.id) {
    return {
      decision: 'reject',
      geoStatus: 'GPS_UNAVAILABLE',
      distanceMeters: null,
      withinRadius: false,
      reason: 'Lokasi kerja tidak ditemukan.',
      errorCode: 'WORK_LOCATION_NOT_FOUND',
      metadata: baseMetadata,
    };
  }

  if (!workLocation.isActive) {
    return {
      decision: 'reject',
      geoStatus: 'GPS_UNAVAILABLE',
      distanceMeters: null,
      withinRadius: false,
      reason: 'Lokasi kerja tidak aktif.',
      errorCode: 'WORK_LOCATION_INACTIVE',
      metadata: baseMetadata,
    };
  }

  const distanceMeters = calculateDistance(
    gps.latitude,
    gps.longitude,
    workLocation.latitude,
    workLocation.longitude,
  );

  const metadata: GpsValidationMetadata = {
    ...baseMetadata,
    distanceMeters,
  };

  if (distanceMeters <= workLocation.radius) {
    return {
      decision: 'accept',
      geoStatus: 'INSIDE_RADIUS',
      distanceMeters,
      withinRadius: true,
      metadata,
    };
  }

  // Outside radius
  const reason = `Anda berada di luar radius lokasi kerja (${Math.round(distanceMeters)}m, batas ${workLocation.radius}m).`;
  if (rejectOutsideGeofence) {
    return {
      decision: 'reject',
      geoStatus: 'OUTSIDE_RADIUS',
      distanceMeters,
      withinRadius: false,
      reason,
      errorCode: 'ATTENDANCE_OUTSIDE_GEOFENCE',
      metadata,
    };
  }

  return {
    decision: 'pending',
    geoStatus: 'PENDING_REVIEW',
    distanceMeters,
    withinRadius: false,
    reason: `${reason} Absensi masuk review admin.`,
    metadata,
  };
}

/**
 * Convert a rejected validation into the project's standard AppError.
 */
export function gpsRejectionToAppError(result: RejectedValidation) {
  return AppError.validation(result.reason);
}
