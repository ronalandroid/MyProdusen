/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a coordinate is within the allowed radius of a work location
 */
export function isWithinGeofence(
  userLat: number,
  userLon: number,
  locationLat: number,
  locationLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLon, locationLat, locationLon);
  return distance <= radiusMeters;
}

/**
 * Get the configured maximum GPS accuracy threshold in meters.
 * Reads from GPS_MAX_ACCURACY_METERS env var, defaults to 100m.
 */
export function getMaxGpsAccuracyMeters(): number {
  const raw = Number(process.env.GPS_MAX_ACCURACY_METERS || '');
  if (Number.isFinite(raw) && raw > 0) return raw;
  return 100;
}

/**
 * Validate GPS accuracy against the configured threshold (GPS_MAX_ACCURACY_METERS).
 */
export function isGpsAccuracyAcceptable(accuracy: number, maxMeters?: number): boolean {
  const threshold = maxMeters ?? getMaxGpsAccuracyMeters();
  return accuracy <= threshold;
}
